import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['pwa-192x192.png', 'pwa-512x512.png'],
        manifest: {
          name: 'Geekhoot Printing Store',
          short_name: 'Geekhoot',
          description: 'Premium print processing and customization ecommerce store.',
          theme_color: '#ff5200',
          background_color: '#ffffff',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          orientation: 'portrait',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json,webmanifest}'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true
        }
      })
    ],
    resolve: {
      alias: {
        '@/src': path.resolve(__dirname, './frontend'),
        '@/components': path.resolve(__dirname, './frontend/components'),
        '@/lib': path.resolve(__dirname, './frontend/lib'),
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
