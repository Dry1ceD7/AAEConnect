import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    hmr: {
      port: 5173
    },
    proxy: {
      // Proxy API requests to Rust backend
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/health': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
        changeOrigin: true
      }
    }
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['svelte', '@sveltejs/kit'],
          utils: ['ws']
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log']
      }
    }
  },
  optimizeDeps: {
    include: ['ws']
  },
  define: {
    '__AAE_VERSION__': JSON.stringify('1.0.0'),
    '__BMAD_AGENTS__': 25,
    '__TARGET_FPS__': 120,
    '__TARGET_LATENCY__': 25
  }
});
