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
        manifest: {
          name: 'Brew & Byte Cafe - POS Tablet & Self-Order System',
          short_name: 'Cafe POS',
          description: 'Sistem POS Tablet Kasir, Self-Order QR Pelanggan, dan Dashboard Admin Manajemen Cafe',
          start_url: '/pos',
          scope: '/',
          display: 'standalone',
          background_color: '#0f172a',
          theme_color: '#1A3A5C',
          orientation: 'any',
          categories: ['business', 'food', 'productivity', 'utilities'],
          shortcuts: [
            { name: 'Layar POS Kasir', url: '/pos', description: 'Buka terminal kasir tablet langsung' },
            { name: 'Admin Dashboard', url: '/admin', description: 'Buka laporan & manajemen cafe' },
            { name: 'Menu Self-Order QR', url: '/customer', description: 'Buka katalog menu pelanggan' }
          ],
          icons: [
            {
              src: '/icon.svg',
              sizes: '192x192 512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
