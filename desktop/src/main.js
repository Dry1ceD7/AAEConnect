/**
 * AAEConnect Tauri Desktop - Frontend Entry Point
 * 
 * Svelte-based frontend for native desktop application
 * with AAE corporate branding and 120fps performance
 */

import './app.css';
import App from './App.svelte';

// Initialize AAE Desktop Application
const app = new App({
  target: document.getElementById('app'),
  props: {
    company: 'Advanced ID Asia Engineering Co.,Ltd',
    location: 'Chiang Mai, Thailand',
    version: '1.0.0',
    theme: 'cyan-light-blue-modern'
  }
});

// Export for HMR
export default app;
