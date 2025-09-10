import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  
  kit: {
    adapter: adapter({
      // Production build configuration
      out: 'build',
      precompress: true,
      envPrefix: 'AAE_'
    }),
    
    // Performance optimizations
    prerender: {
      handleHttpError: 'warn',
      handleMissingId: 'warn'
    },
    
    // CSP for security
    csp: {
      mode: 'auto',
      directives: {
        'script-src': ['self', 'unsafe-inline'],
        'style-src': ['self', 'unsafe-inline', 'https://fonts.googleapis.com'],
        'font-src': ['self', 'https://fonts.gstatic.com'],
        'connect-src': ['self', 'ws:', 'wss:'],
        'img-src': ['self', 'data:', 'https:']
      }
    },
    
    // Alias configuration
    alias: {
      '$components': 'src/components',
      '$stores': 'src/stores',
      '$utils': 'src/utils',
      '$types': 'src/types'
    },
    
    // Service worker
    serviceWorker: {
      register: true,
      files: (filepath) => !/\.DS_Store/.test(filepath)
    },
    
    // AAE-specific configuration
    env: {
      publicPrefix: 'PUBLIC_',
      privatePrefix: 'PRIVATE_'
    }
  },
  
  // Svelte compiler options for performance
  compilerOptions: {
    hydratable: true,
    css: 'injected'
  },
  
  // Vite plugin options
  vitePlugin: {
    inspector: {
      holdMode: true,
      showToggleButton: 'always',
      toggleButtonPos: 'bottom-right'
    }
  }
};

export default config;
