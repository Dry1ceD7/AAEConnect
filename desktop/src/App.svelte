<script>
  import { onMount } from 'svelte';
  import { invoke } from '@tauri-apps/api/tauri';
  import { appWindow } from '@tauri-apps/api/window';
  import { emit, listen } from '@tauri-apps/api/event';
  import { sendNotification } from '@tauri-apps/api/notification';

  // AAE Props
  export let company = 'Advanced ID Asia Engineering Co.,Ltd';
  export let location = 'Chiang Mai, Thailand';
  export let version = '1.0.0';
  export let theme = 'cyan-light-blue-modern';

  // Application state
  let connected = false;
  let messages = [];
  let newMessage = '';
  let performanceMetrics = {
    memoryUsage: 20,
    latency: 15,
    fps: 120,
    users: 1,
  };
  let aaeInfo = {};

  onMount(async () => {
    console.log('🚀 AAEConnect Desktop initializing...');
    console.log(`🏭 ${company}`);
    console.log(`📍 ${location}`);

    try {
      // Get AAE company information
      aaeInfo = await invoke('get_aae_company_info');
      console.log('🏢 AAE company info loaded:', aaeInfo);

      // Connect to WebSocket backend
      await connectToBackend();

      // Setup performance monitoring
      await startPerformanceMonitoring();

      // Setup event listeners
      await setupEventListeners();

      // Show ready notification
      await sendNotification({
        title: 'AAEConnect Desktop Ready',
        body: `${company} - Enterprise communication platform loaded`,
      });
    } catch (error) {
      console.error('❌ Initialization error:', error);
    }
  });

  async function connectToBackend() {
    try {
      const backendUrl = 'ws://localhost:3000/ws';
      const result = await invoke('connect_websocket', { backendUrl });
      connected = true;
      console.log('✅ Connected to AAE backend:', result);

      addSystemMessage('Connected to AAE Enterprise Backend', 'success');
    } catch (error) {
      console.error('❌ Backend connection failed:', error);
      addSystemMessage('Failed to connect to backend', 'error');
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !connected) return;

    try {
      const message = {
        id: Date.now().toString(),
        content: newMessage,
        user: 'AAE Desktop User',
        department: 'engineering',
        timestamp: new Date().toISOString(),
        encrypted: true,
        messageType: 'chat',
      };

      const result = await invoke('send_message', { message });

      addMessage({
        ...message,
        type: 'sent',
      });

      newMessage = '';
      console.log('📤 Message sent:', result);
    } catch (error) {
      console.error('❌ Send message failed:', error);
      addSystemMessage('Failed to send message', 'error');
    }
  }

  async function startPerformanceMonitoring() {
    try {
      const metrics = await invoke('get_performance_metrics');
      performanceMetrics = { ...performanceMetrics, ...metrics };

      console.log('📊 Performance metrics:', performanceMetrics);

      if (performanceMetrics.memoryUsage > 25) {
        console.warn('⚠️ Memory usage exceeds 25MB target');
      }

      if (performanceMetrics.latency > 25) {
        console.warn('⚠️ Latency exceeds 25ms target');
      }
    } catch (error) {
      console.error('❌ Performance monitoring failed:', error);
    }

    // Update metrics every 5 seconds
    setTimeout(startPerformanceMonitoring, 5000);
  }

  async function setupEventListeners() {
    // Listen for system tray events
    await listen('system_tray_click', () => {
      appWindow.show();
      appWindow.setFocus();
    });

    // Listen for window events
    await listen('tauri://close-requested', () => {
      addSystemMessage('AAEConnect Desktop minimized to system tray', 'info');
    });

    // Listen for performance updates
    await listen('performance_update', (event) => {
      performanceMetrics = { ...performanceMetrics, ...event.payload };
    });
  }

  function addMessage(message) {
    messages = [
      ...messages,
      {
        ...message,
        id: message.id || Date.now(),
        timestamp: new Date().toLocaleTimeString(),
      },
    ];
  }

  function addSystemMessage(content, type) {
    addMessage({
      id: Date.now(),
      content,
      type: 'system',
      systemType: type,
      user: 'AAE System',
      timestamp: new Date().toLocaleTimeString(),
    });
  }

  async function openMeetingWindow() {
    try {
      await invoke('create_meeting_window');
      addSystemMessage('Meeting window opened', 'success');
    } catch (error) {
      console.error('❌ Failed to open meeting window:', error);
      addSystemMessage('Failed to open meeting window', 'error');
    }
  }

  async function showNotification() {
    try {
      await invoke('show_notification', {
        title: 'AAEConnect Desktop',
        body: 'High-performance enterprise communication for AAE',
      });
    } catch (error) {
      console.error('❌ Notification failed:', error);
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }
</script>

<main class="aae-desktop">
  <!-- Header with AAE branding -->
  <header class="aae-header">
    <div class="aae-logo">
      <div class="logo-circle">A</div>
      <div class="company-info">
        <h1>AAEConnect Desktop</h1>
        <p>{company}</p>
        <span class="location">{location}</span>
      </div>
    </div>

    <div class="controls">
      <button class="btn-secondary" on:click={openMeetingWindow}>
        🎥 Meeting
      </button>
      <button class="btn-secondary" on:click={showNotification}>
        🔔 Notify
      </button>
      <div class="status">
        <div class="status-dot {connected ? 'online' : 'offline'}"></div>
        <span>{connected ? 'Connected' : 'Disconnected'}</span>
      </div>
    </div>
  </header>

  <!-- Performance Dashboard -->
  <div class="performance-dashboard">
    <div class="metric">
      <span class="label">Memory</span>
      <span class="value">{performanceMetrics.memoryUsage}MB</span>
    </div>
    <div class="metric">
      <span class="label">Latency</span>
      <span class="value">{performanceMetrics.latency}ms</span>
    </div>
    <div class="metric">
      <span class="label">FPS</span>
      <span class="value">{performanceMetrics.fps}</span>
    </div>
    <div class="metric">
      <span class="label">Users</span>
      <span class="value">{performanceMetrics.users}</span>
    </div>
  </div>

  <!-- Main chat area -->
  <div class="chat-container">
    <div class="messages">
      {#each messages as message}
        <div class="message {message.type}">
          {#if message.type === 'system'}
            <div class="system-message {message.systemType}">
              🤖 {message.content}
              <span class="timestamp">{message.timestamp}</span>
            </div>
          {:else}
            <div class="chat-message">
              <div class="message-header">
                <span class="user">{message.user}</span>
                <span class="timestamp">{message.timestamp}</span>
                {#if message.encrypted}
                  <span class="encrypted">🔒</span>
                {/if}
              </div>
              <p class="content">{message.content}</p>
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <div class="input-area">
      <input
        bind:value={newMessage}
        on:keydown={handleKeyDown}
        placeholder="Type your message to AAE team..."
        disabled={!connected}
        class="message-input"
      />
      <button
        on:click={sendMessage}
        disabled={!connected || !newMessage.trim()}
        class="btn-primary"
      >
        Send
      </button>
    </div>
  </div>

  <!-- Footer with AAE info -->
  <footer class="aae-footer">
    <div class="footer-content">
      <span>AAEConnect Desktop v{version}</span>
      <span>🔒 Matrix E2E</span>
      <span>📋 ISO 9001:2015</span>
      <span>🚗 IATF 16949</span>
      <span class="aae-colors">Cyan-Light Blue Theme</span>
    </div>
  </footer>
</main>

<style>
  /* AAE Corporate Desktop Theme */
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(body) {
    font-family:
      'Inter',
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      sans-serif;
    background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
    color: #212121;
    overflow: hidden;
  }

  .aae-desktop {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, #fafafa 0%, #f0f9ff 100%);
  }

  .aae-header {
    background: linear-gradient(135deg, #00bcd4 0%, #0097a7 100%);
    color: white;
    padding: 16px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 10px rgba(0, 188, 212, 0.2);
  }

  .aae-logo {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo-circle {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #00e5ff 0%, #ffffff 100%);
    color: #00bcd4;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 18px;
  }

  .company-info h1 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }

  .company-info p {
    font-size: 12px;
    opacity: 0.9;
    margin: 0;
  }

  .location {
    font-size: 10px;
    opacity: 0.7;
    background: rgba(255, 255, 255, 0.2);
    padding: 2px 6px;
    border-radius: 4px;
    margin-top: 2px;
    display: inline-block;
  }

  .controls {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .btn-primary {
    background: #00e5ff;
    color: #212121;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary:hover:not(:disabled) {
    background: #00b8d4;
    transform: translateY(-1px);
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .status-dot.online {
    background: #4caf50;
    box-shadow: 0 0 6px rgba(76, 175, 80, 0.6);
  }

  .status-dot.offline {
    background: #f44336;
  }

  .performance-dashboard {
    background: white;
    display: flex;
    justify-content: space-around;
    padding: 12px;
    border-bottom: 1px solid #e0e0e0;
  }

  .metric {
    text-align: center;
  }

  .metric .label {
    font-size: 10px;
    color: #757575;
    display: block;
  }

  .metric .value {
    font-size: 16px;
    font-weight: 600;
    color: #00bcd4;
  }

  .chat-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .messages {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
    scroll-behavior: smooth;
  }

  .messages::-webkit-scrollbar {
    width: 6px;
  }

  .messages::-webkit-scrollbar-thumb {
    background: #00bcd4;
    border-radius: 3px;
  }

  .message {
    margin-bottom: 12px;
  }

  .system-message {
    background: #f5f5f5;
    border-left: 4px solid #2196f3;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 14px;
    position: relative;
  }

  .system-message.success {
    border-left-color: #4caf50;
    background: #f1f8e9;
  }

  .system-message.error {
    border-left-color: #f44336;
    background: #ffebee;
  }

  .chat-message {
    background: white;
    border-radius: 12px;
    padding: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    max-width: 80%;
  }

  .message.sent .chat-message {
    background: linear-gradient(135deg, #00bcd4 0%, #0097a7 100%);
    color: white;
    margin-left: auto;
  }

  .message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    margin-bottom: 4px;
    opacity: 0.8;
  }

  .user {
    font-weight: 600;
  }

  .encrypted {
    color: #4caf50;
    font-size: 10px;
  }

  .content {
    margin: 0;
    line-height: 1.4;
  }

  .input-area {
    padding: 16px;
    background: white;
    border-top: 1px solid #e0e0e0;
    display: flex;
    gap: 12px;
  }

  .message-input {
    flex: 1;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    outline: none;
    font-size: 14px;
    transition: border-color 0.2s;
  }

  .message-input:focus {
    border-color: #00bcd4;
  }

  .message-input:disabled {
    background: #f5f5f5;
    color: #999;
  }

  .aae-footer {
    background: #f5f5f5;
    border-top: 1px solid #e0e0e0;
    padding: 8px 24px;
  }

  .footer-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    color: #757575;
  }

  .footer-content span {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .aae-colors {
    color: #00bcd4;
    font-weight: 500;
  }

  /* Performance optimizations for 120fps target */
  .chat-container,
  .messages {
    will-change: scroll-position;
    transform: translateZ(0);
  }

  .message {
    will-change: transform;
    transform: translateZ(0);
  }

  /* AAE responsive design */
  @media (max-width: 800px) {
    .performance-dashboard {
      padding: 8px;
    }

    .metric {
      font-size: 12px;
    }

    .aae-header {
      padding: 12px 16px;
    }
  }
</style>
