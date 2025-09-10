<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  let isConnected = false;
  let messageCount = 0;
  
  onMount(() => {
    // Initialize WebSocket connection for real-time updates
    const ws = new WebSocket(`ws://${window.location.host}/ws`);
    
    ws.onopen = () => {
      isConnected = true;
      console.log('🔌 AAEConnect WebSocket connected');
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      messageCount++;
      console.log('📨 New message:', data);
    };
    
    ws.onclose = () => {
      isConnected = false;
      console.log('🔌 AAEConnect WebSocket disconnected');
    };
    
    return () => ws.close();
  });
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
  <!-- Header with AAE branding -->
  <header class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <div class="flex items-center space-x-4">
          <div class="flex-shrink-0">
            <!-- AAE Logo placeholder -->
            <div class="w-10 h-10 bg-gradient-to-r from-aae-primary to-aae-accent rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-lg">A</span>
            </div>
          </div>
          <div>
            <h1 class="text-xl font-bold text-gray-900">AAEConnect</h1>
            <p class="text-xs text-aae-gray">Advanced ID Asia Engineering Co.,Ltd</p>
          </div>
        </div>
        
        <div class="flex items-center space-x-4">
          <!-- Connection status -->
          <div class="flex items-center space-x-2">
            <div class={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span class="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <!-- Performance indicator -->
          <div class="hidden md:flex items-center space-x-2 text-xs">
            <span class="text-aae-gray">🚀 BMAD Agents: 25 Active</span>
            <span class="text-aae-gray">📊 Target: <25ms</span>
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- Main content area -->
  <main class="flex-1 flex">
    <slot />
  </main>

  <!-- Footer -->
  <footer class="bg-white border-t border-gray-200 py-4">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <p class="text-sm text-aae-gray">
        AAEConnect Enterprise Communication Platform • 
        <span class="text-aae-primary">Chiang Mai, Thailand</span> • 
        ISO 9001:2015 & IATF 16949 Compliant
      </p>
      <div class="mt-2 text-xs text-aae-gray space-x-4">
        <span>🔒 Matrix E2EE</span>
        <span>⚡ Rust + Axum</span>
        <span>🎨 SvelteKit + TypeScript</span>
        <span>📱 Flutter + Tauri</span>
        <span>📈 120fps UI</span>
      </div>
    </div>
  </footer>
</div>

<style>
  :global(.aae-primary) {
    color: var(--aae-primary);
  }
  
  :global(.aae-secondary) {
    color: var(--aae-secondary);
  }
  
  :global(.aae-gray) {
    color: var(--aae-gray);
  }
</style>
