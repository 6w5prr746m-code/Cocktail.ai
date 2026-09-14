import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Cocktail.ai',
        short_name: 'Cocktail.ai',
        description: "Trouve le cocktail parfait selon les ingrédients que tu as sous la main.",
        theme_color: '#0b0b0f',
        background_color: '#0b0b0f',
        lang: 'fr',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Précache le shell (JS/CSS/HTML) + les illustrations — tout ce qui
        // fait tourner l'app hors ligne pour les cocktails déjà consultés.
        globPatterns: ['**/*.{js,css,html,svg,ico}'],
        runtimeCaching: [
          {
            // Photos de cocktails : rarement modifiées une fois publiées,
            // CacheFirst pour un chargement instantané après la première visite.
            urlPattern: ({ url }) => url.pathname.includes('/images/cocktails/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'cocktail-photos',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 90 },
            },
          },
        ],
      },
    }),
  ],
})
