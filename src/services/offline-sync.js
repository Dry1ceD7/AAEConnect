/**
 * AAEConnect Offline Synchronization Service
 * Advanced ID Asia Engineering Co.,Ltd
 * 
 * Implements offline-first architecture with intelligent sync
 * Ensures message delivery even during network disruptions
 */

const EventEmitter = require('events');

class OfflineSyncService extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      company: 'Advanced ID Asia Engineering Co.,Ltd',
      location: 'Chiang Mai, Thailand',
      maxQueueSize: options.maxQueueSize || 10000,
      syncInterval: options.syncInterval || 5000,
      retryAttempts: options.retryAttempts || 3,
      retryDelay: options.retryDelay || 1000,
      persistQueue: options.persistQueue !== false,
      storageKey: 'aaeconnect_offline_queue'
    };
    
    // Message queue for offline storage
    this.messageQueue = [];
    this.syncQueue = [];
    this.isOnline = true;
    this.isSyncing = false;
    this.syncTimer = null;
    this.retryCount = new Map();
    
    // Statistics
    this.stats = {
      messageQueued: 0,
      messageSynced: 0,
      messageFailed: 0,
      lastSyncTime: null,
      queueSize: 0
    };
    
    this.initialize();
  }
  
  initialize() {
    console.log('🔄 Initializing AAEConnect Offline Sync Service...');
    console.log(`🏭 ${this.config.company}`);
    console.log(`📍 ${this.config.location}`);
    
    // Load persisted queue if available
    if (this.config.persistQueue) {
      this.loadPersistedQueue();
    }
    
    // Monitor online status
    this.monitorConnectivity();
    
    // Start sync timer
    this.startSyncTimer();
    
    // Handle process termination
    this.setupCleanup();
    
    console.log('✅ Offline sync service initialized');
  }
  
  /**
   * Monitor network connectivity
   */
  monitorConnectivity() {
    // Browser environment
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
      this.isOnline = navigator.onLine;
    }
    
    // Node.js environment - check periodically
    else {
      setInterval(() => {
        this.checkConnectivity();
      }, 5000);
    }
  }
  
  /**
   * Check connectivity by pinging the server
   */
  async checkConnectivity() {
    try {
      const response = await fetch('http://localhost:3000/health', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      }).catch(() => null);
      
      const wasOnline = this.isOnline;
      this.isOnline = response !== null;
      
      if (!wasOnline && this.isOnline) {
        this.handleOnline();
      } else if (wasOnline && !this.isOnline) {
        this.handleOffline();
      }
    } catch (error) {
      // Assume offline if check fails
      if (this.isOnline) {
        this.handleOffline();
      }
    }
  }
  
  /**
   * Handle coming online
   */
  handleOnline() {
    console.log('🟢 AAEConnect is online');
    this.isOnline = true;
    this.emit('online');
    
    // Immediately start syncing queued messages
    this.syncMessages();
  }
  
  /**
   * Handle going offline
   */
  handleOffline() {
    console.log('🔴 AAEConnect is offline - Messages will be queued');
    this.isOnline = false;
    this.emit('offline');
  }
  
  /**
   * Queue a message for sending
   */
  queueMessage(message) {
    // Add metadata
    const queuedMessage = {
      ...message,
      queuedAt: Date.now(),
      id: message.id || this.generateId(),
      retryCount: 0,
      priority: message.priority || 'normal'
    };
    
    // Check queue size limit
    if (this.messageQueue.length >= this.config.maxQueueSize) {
      // Remove oldest low-priority message
      const removed = this.removeOldestLowPriority();
      if (!removed) {
        console.warn('⚠️ Message queue full, dropping oldest message');
        this.messageQueue.shift();
      }
    }
    
    // Add to queue
    this.messageQueue.push(queuedMessage);
    this.stats.messageQueued++;
    this.stats.queueSize = this.messageQueue.length;
    
    // Persist queue
    if (this.config.persistQueue) {
      this.persistQueue();
    }
    
    // Emit event
    this.emit('messageQueued', queuedMessage);
    
    console.log(`📥 Message queued (${this.messageQueue.length} in queue)`);
    
    // Try to sync if online
    if (this.isOnline && !this.isSyncing) {
      this.syncMessages();
    }
    
    return queuedMessage.id;
  }
  
  /**
   * Remove oldest low-priority message
   */
  removeOldestLowPriority() {
    for (let i = 0; i < this.messageQueue.length; i++) {
      if (this.messageQueue[i].priority === 'low') {
        const removed = this.messageQueue.splice(i, 1)[0];
        console.log('🗑️ Removed low-priority message to make space');
        return removed;
      }
    }
    return null;
  }
  
  /**
   * Sync queued messages
   */
  async syncMessages() {
    if (!this.isOnline || this.isSyncing || this.messageQueue.length === 0) {
      return;
    }
    
    this.isSyncing = true;
    console.log(`🔄 Syncing ${this.messageQueue.length} queued messages...`);
    
    // Sort by priority and timestamp
    const sortedQueue = [...this.messageQueue].sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      return priorityDiff !== 0 ? priorityDiff : a.queuedAt - b.queuedAt;
    });
    
    const syncResults = [];
    
    for (const message of sortedQueue) {
      try {
        const result = await this.sendMessage(message);
        
        if (result.success) {
          // Remove from queue
          const index = this.messageQueue.findIndex(m => m.id === message.id);
          if (index !== -1) {
            this.messageQueue.splice(index, 1);
          }
          
          this.stats.messageSynced++;
          this.retryCount.delete(message.id);
          
          syncResults.push({ id: message.id, success: true });
          
          console.log(`✅ Message ${message.id} synced successfully`);
        } else {
          // Handle failure
          await this.handleSyncFailure(message, result.error);
          syncResults.push({ id: message.id, success: false, error: result.error });
        }
      } catch (error) {
        await this.handleSyncFailure(message, error);
        syncResults.push({ id: message.id, success: false, error });
      }
      
      // Small delay between messages to avoid overwhelming server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.stats.queueSize = this.messageQueue.length;
    this.stats.lastSyncTime = new Date().toISOString();
    
    // Persist updated queue
    if (this.config.persistQueue) {
      this.persistQueue();
    }
    
    this.isSyncing = false;
    
    // Emit sync complete event
    this.emit('syncComplete', {
      synced: syncResults.filter(r => r.success).length,
      failed: syncResults.filter(r => !r.success).length,
      remaining: this.messageQueue.length
    });
    
    console.log(`🔄 Sync complete: ${syncResults.filter(r => r.success).length} sent, ${this.messageQueue.length} remaining`);
  }
  
  /**
   * Send a single message
   */
  async sendMessage(message) {
    try {
      const response = await fetch('http://localhost:3000/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...message,
          offline_sync: true,
          sync_timestamp: Date.now()
        })
      });
      
      if (response.ok) {
        return { success: true };
      } else {
        const error = await response.text();
        return { success: false, error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Handle sync failure
   */
  async handleSyncFailure(message, error) {
    const retries = this.retryCount.get(message.id) || 0;
    
    if (retries < this.config.retryAttempts) {
      // Increment retry count
      this.retryCount.set(message.id, retries + 1);
      
      // Update message retry count
      const index = this.messageQueue.findIndex(m => m.id === message.id);
      if (index !== -1) {
        this.messageQueue[index].retryCount = retries + 1;
        this.messageQueue[index].lastError = error;
      }
      
      console.log(`⚠️ Message ${message.id} failed, will retry (${retries + 1}/${this.config.retryAttempts})`);
    } else {
      // Max retries reached
      const index = this.messageQueue.findIndex(m => m.id === message.id);
      if (index !== -1) {
        this.messageQueue.splice(index, 1);
      }
      
      this.stats.messageFailed++;
      this.retryCount.delete(message.id);
      
      // Move to failed queue
      this.handleFailedMessage(message, error);
      
      console.error(`❌ Message ${message.id} failed permanently after ${this.config.retryAttempts} attempts`);
    }
  }
  
  /**
   * Handle permanently failed messages
   */
  handleFailedMessage(message, error) {
    // Store in failed messages for manual review
    const failedMessage = {
      ...message,
      failedAt: Date.now(),
      error: error?.toString() || 'Unknown error'
    };
    
    // Emit event for handling by application
    this.emit('messageFailed', failedMessage);
    
    // Could store in a separate failed queue for admin review
    // this.failedMessages.push(failedMessage);
  }
  
  /**
   * Start sync timer
   */
  startSyncTimer() {
    this.syncTimer = setInterval(() => {
      if (this.isOnline && !this.isSyncing && this.messageQueue.length > 0) {
        this.syncMessages();
      }
    }, this.config.syncInterval);
  }
  
  /**
   * Stop sync timer
   */
  stopSyncTimer() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }
  
  /**
   * Persist queue to storage
   */
  persistQueue() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const data = {
          queue: this.messageQueue,
          stats: this.stats,
          timestamp: Date.now()
        };
        
        localStorage.setItem(this.config.storageKey, JSON.stringify(data));
      } catch (error) {
        console.error('Failed to persist queue:', error);
      }
    }
  }
  
  /**
   * Load persisted queue
   */
  loadPersistedQueue() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem(this.config.storageKey);
        
        if (stored) {
          const data = JSON.parse(stored);
          
          // Check if data is not too old (24 hours)
          if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
            this.messageQueue = data.queue || [];
            this.stats = { ...this.stats, ...data.stats };
            
            console.log(`📥 Loaded ${this.messageQueue.length} queued messages from storage`);
          } else {
            // Clear old data
            localStorage.removeItem(this.config.storageKey);
          }
        }
      } catch (error) {
        console.error('Failed to load persisted queue:', error);
      }
    }
  }
  
  /**
   * Clear the message queue
   */
  clearQueue() {
    const count = this.messageQueue.length;
    this.messageQueue = [];
    this.stats.queueSize = 0;
    
    if (this.config.persistQueue) {
      this.persistQueue();
    }
    
    console.log(`🗑️ Cleared ${count} messages from queue`);
    return count;
  }
  
  /**
   * Get queue status
   */
  getStatus() {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      queueSize: this.messageQueue.length,
      stats: this.stats,
      oldestMessage: this.messageQueue[0]?.queuedAt 
        ? new Date(this.messageQueue[0].queuedAt).toISOString() 
        : null
    };
  }
  
  /**
   * Generate unique ID
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Setup cleanup handlers
   */
  setupCleanup() {
    const cleanup = () => {
      console.log('🧹 Cleaning up offline sync service...');
      
      // Persist queue before exit
      if (this.config.persistQueue) {
        this.persistQueue();
      }
      
      // Stop sync timer
      this.stopSyncTimer();
      
      console.log(`📊 Final stats: ${this.stats.messageSynced} synced, ${this.messageQueue.length} pending`);
    };
    
    // Handle various termination signals
    if (typeof process !== 'undefined') {
      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);
      process.on('beforeExit', cleanup);
    }
    
    // Browser environment
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', cleanup);
    }
  }
  
  /**
   * Force sync all messages
   */
  async forceSync() {
    console.log('⚡ Forcing sync of all queued messages...');
    
    const wasOnline = this.isOnline;
    this.isOnline = true; // Temporarily force online
    
    await this.syncMessages();
    
    this.isOnline = wasOnline; // Restore original state
    
    return this.getStatus();
  }
}

// Export for use in AAEConnect
module.exports = OfflineSyncService;

// Example usage and testing
if (require.main === module) {
  console.log('🧪 Testing AAEConnect Offline Sync Service...\n');
  
  const syncService = new OfflineSyncService({
    syncInterval: 3000,
    persistQueue: false // Disable for testing
  });
  
  // Listen to events
  syncService.on('online', () => console.log('📡 Event: System online'));
  syncService.on('offline', () => console.log('📴 Event: System offline'));
  syncService.on('messageQueued', (msg) => console.log(`📬 Event: Message queued - ${msg.id}`));
  syncService.on('syncComplete', (result) => console.log(`✅ Event: Sync complete -`, result));
  syncService.on('messageFailed', (msg) => console.log(`❌ Event: Message failed -`, msg.id));
  
  // Simulate offline scenario
  setTimeout(() => {
    console.log('\n🔴 Simulating offline mode...');
    syncService.handleOffline();
    
    // Queue some messages while offline
    for (let i = 1; i <= 5; i++) {
      syncService.queueMessage({
        content: `Test message ${i}`,
        user: 'test_user',
        department: 'engineering',
        priority: i === 1 ? 'high' : 'normal'
      });
    }
    
    console.log('\n📊 Status:', syncService.getStatus());
  }, 1000);
  
  // Simulate coming back online
  setTimeout(() => {
    console.log('\n🟢 Simulating online mode...');
    syncService.handleOnline();
  }, 5000);
  
  // Check final status
  setTimeout(() => {
    console.log('\n📊 Final Status:', syncService.getStatus());
    process.exit(0);
  }, 10000);
}
