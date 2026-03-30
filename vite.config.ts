import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api/hr-partner": {
        target: "https://api.hrpartner.io",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/hr-partner/, ""),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('x-api-key', '9e200e2c3a9411cdc20939706bb69c61d4eaadb4');
            proxyReq.removeHeader('Origin');
            proxyReq.removeHeader('Referer');
          });
        },
      },
    },
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
