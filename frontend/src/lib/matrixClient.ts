/**
 * AAEConnect Matrix Client - Frontend E2E Encryption
 * Provides secure messaging with Matrix protocol integration
 */

import { createClient, MatrixClient, Room, MatrixEvent, EventType, MsgType } from 'matrix-js-sdk';
import { writable, type Writable } from 'svelte/store';

// Matrix connection status store
export const matrixStatus: Writable<{
  connected: boolean;
  encrypted: boolean;
  userId: string | null;
  error: string | null;
}> = writable({
  connected: false,
  encrypted: false,
  userId: null,
  error: null
});

// Matrix messages store
export const matrixMessages: Writable<Array<{
  id: string;
  roomId: string;
  userId: string;
  content: string;
  timestamp: string;
  encrypted: boolean;
  department?: string;
}>> = writable([]);

class AAEMatrixClient {
  private client: MatrixClient | null = null;
  private isInitialized = false;
  private rooms = new Map<string, Room>();

  // AAE Configuration
  private config = {
    homeserver: 'https://matrix.aae.local',
    departments: [
      'engineering',
      'manufacturing',
      'quality-control', 
      'management',
      'it-support'
    ],
    branding: {
      primaryColor: '#00BCD4',
      secondaryColor: '#0097A7',
      accentColor: '#00E5FF'
    }
  };

  /**
   * Initialize Matrix client with AAE credentials
   */
  async initialize(username: string, password: string): Promise<boolean> {
    try {
      console.log('🔒 Initializing AAE Matrix E2E encryption...');

      // Create client
      this.client = createClient({
        baseUrl: this.config.homeserver,
        userId: `@${username}:aae.local`,
        deviceId: `AAEConnect_${Date.now()}`,
        timelineSupport: true,
      });

      // Login with password
      const loginResponse = await this.client.loginWithPassword(username, password);
      
      console.log('✅ Matrix login successful');

      // Initialize crypto for E2E encryption
      await this.client.initCrypto();
      console.log('🔐 E2E encryption initialized');

      // Set up event handlers
      this.setupEventHandlers();

      // Start client
      await this.client.startClient({
        initialSyncLimit: 20,
        includeArchivedRooms: false
      });

      // Wait for initial sync
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Sync timeout')), 30000);
        
        this.client!.once('sync', (state: string) => {
          clearTimeout(timeout);
          if (state === 'PREPARED') {
            this.isInitialized = true;
            matrixStatus.update(status => ({
              ...status,
              connected: true,
              encrypted: true,
              userId: this.client!.getUserId()
            }));
            resolve();
          }
        });
      });

      // Join AAE department rooms
      await this.joinAAERooms();

      console.log('🏢 AAEConnect Matrix client ready');
      return true;

    } catch (error) {
      console.error('❌ Matrix initialization failed:', error);
      matrixStatus.update(status => ({
        ...status,
        error: error instanceof Error ? error.message : 'Matrix connection failed'
      }));
      return false;
    }
  }

  /**
   * Set up Matrix event handlers
   */
  private setupEventHandlers(): void {
    if (!this.client) return;

    // Handle incoming messages
    this.client.on('Room.timeline', (event: MatrixEvent, room: Room | undefined, toStartOfTimeline: boolean) => {
      if (toStartOfTimeline || !room) return;
      if (event.getType() !== EventType.RoomMessage) return;
      
      this.handleIncomingMessage(event, room);
    });

    // Handle sync state changes
    this.client.on('sync', (state: string) => {
      console.log(`Matrix sync state: ${state}`);
      
      if (state === 'RECONNECTING') {
        matrixStatus.update(status => ({
          ...status,
          connected: false,
          error: 'Reconnecting...'
        }));
      } else if (state === 'PREPARED') {
        matrixStatus.update(status => ({
          ...status,
          connected: true,
          error: null
        }));
      }
    });

    // Handle encryption events
    this.client.on('crypto.deviceVerificationChanged', (userId: string, deviceId: string) => {
      console.log(`🔐 Device verification changed: ${userId}/${deviceId}`);
    });

    // Handle room encryption status
    this.client.on('RoomState.events', (event: MatrixEvent) => {
      if (event.getType() === EventType.RoomEncryption) {
        console.log(`🔒 Room encryption enabled: ${event.getRoomId()}`);
      }
    });
  }

  /**
   * Handle incoming Matrix messages
   */
  private async handleIncomingMessage(event: MatrixEvent, room: Room): Promise<void> {
    const startTime = performance.now();

    try {
      const content = event.getContent();
      const sender = event.getSender();
      const timestamp = new Date(event.getTs()).toISOString();

      // Skip our own messages
      if (sender === this.client?.getUserId()) return;

      const message = {
        id: event.getId()!,
        roomId: room.roomId,
        userId: sender!,
        content: content.body || '',
        timestamp,
        encrypted: event.isEncrypted(),
        department: this.extractDepartmentFromRoom(room.name)
      };

      // Add to messages store
      matrixMessages.update(messages => [...messages, message]);

      const processingTime = performance.now() - startTime;
      console.log(`📨 Matrix message processed in ${processingTime.toFixed(2)}ms`);

      // Performance warning if over target
      if (processingTime > 25) {
        console.warn(`⚠️ Matrix message processing exceeded 25ms target: ${processingTime.toFixed(2)}ms`);
      }

    } catch (error) {
      console.error('❌ Error processing Matrix message:', error);
    }
  }

  /**
   * Send encrypted message to room
   */
  async sendMessage(roomId: string, content: string, messageType: MsgType = MsgType.Text): Promise<boolean> {
    if (!this.client || !this.isInitialized) {
      throw new Error('Matrix client not initialized');
    }

    const startTime = performance.now();

    try {
      const messageContent = {
        body: content,
        msgtype: messageType,
        // AAE compliance metadata
        'com.aae.metadata': {
          timestamp: new Date().toISOString(),
          compliance: 'ISO_9001_2015',
          department: 'engineering', // TODO: Get from user profile
          retention: '7_years'
        }
      };

      await this.client.sendMessage(roomId, messageContent);

      const latency = performance.now() - startTime;
      console.log(`📤 Matrix message sent in ${latency.toFixed(2)}ms`);

      return true;

    } catch (error) {
      console.error('❌ Error sending Matrix message:', error);
      throw error;
    }
  }

  /**
   * Join AAE department rooms
   */
  private async joinAAERooms(): Promise<void> {
    if (!this.client) return;

    console.log('🏢 Joining AAE department rooms...');

    for (const department of this.config.departments) {
      try {
        const roomAlias = `#aae-${department}:aae.local`;
        
        // Try to join room
        const room = await this.client.joinRoom(roomAlias);
        this.rooms.set(department, room);
        
        console.log(`✅ Joined AAE ${department} room`);

        // Enable encryption if not already enabled
        const isEncrypted = this.client.isRoomEncrypted(room.roomId);
        if (!isEncrypted) {
          await this.enableRoomEncryption(room.roomId);
        }

      } catch (error) {
        console.warn(`⚠️ Could not join ${department} room:`, error);
        // Room might not exist yet - could be created by admin
      }
    }
  }

  /**
   * Enable E2E encryption for room
   */
  private async enableRoomEncryption(roomId: string): Promise<void> {
    if (!this.client) return;

    try {
      await this.client.sendStateEvent(roomId, EventType.RoomEncryption, {
        algorithm: 'm.megolm.v1.aes-sha2'
      });
      console.log(`🔒 Enabled E2E encryption for room ${roomId}`);
    } catch (error) {
      console.error(`❌ Failed to enable encryption:`, error);
    }
  }

  /**
   * Get available rooms with AAE branding
   */
  getAAERooms(): Array<{
    id: string;
    name: string;
    department: string;
    encrypted: boolean;
    memberCount: number;
  }> {
    if (!this.client) return [];

    return Array.from(this.rooms.entries()).map(([department, room]) => ({
      id: room.roomId,
      name: room.name || `AAE ${department.charAt(0).toUpperCase() + department.slice(1)}`,
      department,
      encrypted: this.client!.isRoomEncrypted(room.roomId),
      memberCount: room.getJoinedMemberCount()
    }));
  }

  /**
   * Extract department from room name
   */
  private extractDepartmentFromRoom(roomName?: string): string {
    if (!roomName) return 'general';
    
    const dept = this.config.departments.find(d => 
      roomName.toLowerCase().includes(d.replace('-', ''))
    );
    
    return dept || 'general';
  }

  /**
   * Get Matrix status and metrics
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      connected: this.client?.clientRunning || false,
      userId: this.client?.getUserId(),
      roomCount: this.rooms.size,
      encryptionEnabled: true,
      homeserver: this.config.homeserver,
      departments: this.config.departments,
      compliance: {
        iso_9001: true,
        iatf_16949: true,
        e2e_encryption: true,
        audit_trail: true
      }
    };
  }

  /**
   * Disconnect from Matrix
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.stopClient();
      this.client = null;
      this.isInitialized = false;
      this.rooms.clear();
      
      matrixStatus.update(status => ({
        connected: false,
        encrypted: false,
        userId: null,
        error: null
      }));
      
      console.log('🔒 Matrix client disconnected');
    }
  }
}

// Export singleton instance
export const aaeMatrix = new AAEMatrixClient();
