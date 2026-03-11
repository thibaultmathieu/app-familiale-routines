import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Routines Familiales',
        short_name: 'Routines',
        description: 'App familiale de routines quotidiennes',
        theme_color: '#F5F0EB',
        background_color: '#F5F0EB',
        display: 'standalone',
        orientation: 'landscape',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpeg,webp,mp3}'],
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024, // 15 MB for music files
      },
    }),
  ],
})
