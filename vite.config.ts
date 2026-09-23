import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

export default defineConfig(() => {
  return {
    base: process.env.VITE_BASE_PATH || './',
    define: {
      '__APP_VERSION__': JSON.stringify(packageJson.version)
    },
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: null, // we use virtual:pwa-register in React
        includeAssets: ['icon.svg'],
        manifest: {
          short_name: "FlowGenius",
          name: "FlowGenius - Code to Flowchart IDE",
          description: "Offline-first code-to-flowchart IDE with academic homework headers, AST parsing, and cloud sync.",
          icons: [
            {
              src: "icon.svg",
              type: "image/svg+xml",
              sizes: "192x192 512x512",
              purpose: "any maskable"
            }
          ],
          start_url: ".",
          display: "standalone",
          background_color: "#0b1326",
          theme_color: "#0b1326",
          orientation: "portrait-primary"
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          maximumFileSizeToCacheInBytes: 5000000, // accommodate larger diagram chunks
          cleanupOutdatedCaches: true,
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
