// vite.config.ts
import { sveltekit } from "file:///Users/d7y1ce/AAEConnect/node_modules/@sveltejs/kit/src/exports/vite/index.js";
import { defineConfig } from "file:///Users/d7y1ce/AAEConnect/frontend/node_modules/vite/dist/node/index.js";
var vite_config_default = defineConfig({
  plugins: [sveltekit()],
  server: {
    port: 5173,
    host: "0.0.0.0",
    hmr: {
      port: 5173
    },
    proxy: {
      // Proxy API requests to Rust backend
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "")
      },
      "/health": {
        target: "http://localhost:8080",
        changeOrigin: true
      },
      "/ws": {
        target: "ws://localhost:8080",
        ws: true,
        changeOrigin: true
      }
    }
  },
  build: {
    target: "esnext",
    minify: "terser",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["svelte", "@sveltejs/kit"],
          utils: ["ws"]
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ["console.log"]
      }
    }
  },
  optimizeDeps: {
    include: ["ws"]
  },
  define: {
    "__AAE_VERSION__": JSON.stringify("1.0.0"),
    "__BMAD_AGENTS__": 25,
    "__TARGET_FPS__": 120,
    "__TARGET_LATENCY__": 25
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvZDd5MWNlL0FBRUNvbm5lY3QvZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9kN3kxY2UvQUFFQ29ubmVjdC9mcm9udGVuZC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvZDd5MWNlL0FBRUNvbm5lY3QvZnJvbnRlbmQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBzdmVsdGVraXQgfSBmcm9tICdAc3ZlbHRlanMva2l0L3ZpdGUnO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtzdmVsdGVraXQoKV0sXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDUxNzMsXG4gICAgaG9zdDogJzAuMC4wLjAnLFxuICAgIGhtcjoge1xuICAgICAgcG9ydDogNTE3M1xuICAgIH0sXG4gICAgcHJveHk6IHtcbiAgICAgIC8vIFByb3h5IEFQSSByZXF1ZXN0cyB0byBSdXN0IGJhY2tlbmRcbiAgICAgICcvYXBpJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjgwODAnLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9hcGkvLCAnJylcbiAgICAgIH0sXG4gICAgICAnL2hlYWx0aCc6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDo4MDgwJyxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlXG4gICAgICB9LFxuICAgICAgJy93cyc6IHtcbiAgICAgICAgdGFyZ2V0OiAnd3M6Ly9sb2NhbGhvc3Q6ODA4MCcsXG4gICAgICAgIHdzOiB0cnVlLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWVcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgdGFyZ2V0OiAnZXNuZXh0JyxcbiAgICBtaW5pZnk6ICd0ZXJzZXInLFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICB2ZW5kb3I6IFsnc3ZlbHRlJywgJ0BzdmVsdGVqcy9raXQnXSxcbiAgICAgICAgICB1dGlsczogWyd3cyddXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIHRlcnNlck9wdGlvbnM6IHtcbiAgICAgIGNvbXByZXNzOiB7XG4gICAgICAgIGRyb3BfY29uc29sZTogdHJ1ZSxcbiAgICAgICAgZHJvcF9kZWJ1Z2dlcjogdHJ1ZSxcbiAgICAgICAgcHVyZV9mdW5jczogWydjb25zb2xlLmxvZyddXG4gICAgICB9XG4gICAgfVxuICB9LFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBpbmNsdWRlOiBbJ3dzJ11cbiAgfSxcbiAgZGVmaW5lOiB7XG4gICAgJ19fQUFFX1ZFUlNJT05fXyc6IEpTT04uc3RyaW5naWZ5KCcxLjAuMCcpLFxuICAgICdfX0JNQURfQUdFTlRTX18nOiAyNSxcbiAgICAnX19UQVJHRVRfRlBTX18nOiAxMjAsXG4gICAgJ19fVEFSR0VUX0xBVEVOQ1lfXyc6IDI1XG4gIH1cbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFxUixTQUFTLGlCQUFpQjtBQUMvUyxTQUFTLG9CQUFvQjtBQUU3QixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsVUFBVSxDQUFDO0FBQUEsRUFDckIsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sS0FBSztBQUFBLE1BQ0gsTUFBTTtBQUFBLElBQ1I7QUFBQSxJQUNBLE9BQU87QUFBQTtBQUFBLE1BRUwsUUFBUTtBQUFBLFFBQ04sUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsU0FBUyxDQUFDLFNBQVMsS0FBSyxRQUFRLFVBQVUsRUFBRTtBQUFBLE1BQzlDO0FBQUEsTUFDQSxXQUFXO0FBQUEsUUFDVCxRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsTUFDaEI7QUFBQSxNQUNBLE9BQU87QUFBQSxRQUNMLFFBQVE7QUFBQSxRQUNSLElBQUk7QUFBQSxRQUNKLGNBQWM7QUFBQSxNQUNoQjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixRQUFRO0FBQUEsSUFDUixlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUEsVUFDWixRQUFRLENBQUMsVUFBVSxlQUFlO0FBQUEsVUFDbEMsT0FBTyxDQUFDLElBQUk7QUFBQSxRQUNkO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLGVBQWU7QUFBQSxNQUNiLFVBQVU7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLGVBQWU7QUFBQSxRQUNmLFlBQVksQ0FBQyxhQUFhO0FBQUEsTUFDNUI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osU0FBUyxDQUFDLElBQUk7QUFBQSxFQUNoQjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sbUJBQW1CLEtBQUssVUFBVSxPQUFPO0FBQUEsSUFDekMsbUJBQW1CO0FBQUEsSUFDbkIsa0JBQWtCO0FBQUEsSUFDbEIsc0JBQXNCO0FBQUEsRUFDeEI7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
