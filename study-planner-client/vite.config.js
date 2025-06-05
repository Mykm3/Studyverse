import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    hmr: {
      overlay: false,
      clientPort: 5173
    },
    cors: {
      origin: "*",
      methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
      credentials: true
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        configure: (proxy, options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Range';
            proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
            proxyRes.headers['Access-Control-Expose-Headers'] = 'Content-Range, Accept-Ranges, Content-Length';
            
            if (req.url.includes('/view-pdf/') || req.url.includes('/download/')) {
              proxyRes.headers['Content-Disposition'] = 'inline';
              proxyRes.headers['X-Content-Type-Options'] = 'nosniff';
            }
            
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
          
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
          
          proxy.on('proxyReq', (proxyReq, req, res) => {
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
            
            if (req.query && req.query.token) {
              proxyReq.setHeader('X-Auth-Token', req.query.token);
            }
            
            console.log('Sending Request to the Target:', req.method, req.url);
          });
        }
      },
    }
  },
  publicDir: 'public',
});
