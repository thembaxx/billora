import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['logo.png', 'favicon.png', 'icons/*.png', 'images/*.webp', '*.webmanifest'],
      manifest: {
        id: '/',
        name: 'Billora — Your municipal accounts, together',
        short_name: 'Billora',
        description:
          'A little clarity for everything home. Organise South African municipal accounts, statements and reminders.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],
        background_color: '#f5f5f8',
        theme_color: '#f5f5f8',
        lang: 'en-ZA',
        orientation: 'any',
        categories: ['finance', 'productivity', 'utilities'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: '/icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Import a statement',
            url: '/?import=1',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
          },
          { name: 'My properties', url: '/?view=properties' },
        ],
        screenshots: [
          {
            src: '/images/app-desktop.png',
            sizes: '1440x1000',
            type: 'image/png',
            form_factor: 'wide',
            label: 'The Billora workspace',
          },
          {
            src: '/images/app-mobile.png',
            sizes: '390x844',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Municipal accounts on the move',
          },
        ],
        // Supported by installed Chromium apps. Other browsers use the file picker.
        file_handlers: [{ action: '/?import=1', accept: { 'application/pdf': ['.pdf'] } }],
      },
      workbox: {
        globPatterns: ['**/*.{js,mjs,css,html,ico,png,svg,webp,woff2}'],
        globIgnores: ['**/brand/**'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/three/')) return 'three';
          if (id.includes('/pdfjs-dist/')) return 'pdf';
          if (
            id.includes('/motion/') ||
            id.includes('/motion-dom/') ||
            id.includes('/motion-utils/')
          )
            return 'motion';
        },
      },
    },
  },
});
