import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import swc from '@vitejs/plugin-swc';

export default defineConfig({
  plugins: [
    // SWC compiler for fast TypeScript/JavaScript compilation
    swc({
      jsc: {
        target: 'es2020',
        parser: {
          syntax: 'typescript',
          tsx: false, // We're using vanilla JS, not React
        },
        transform: {
          // No React transforms needed
        }
      }
    }),
    
    // PWA plugin for offline capabilities
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,geojson}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.openweathermap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'weather-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          },
          {
            urlPattern: /^https:\/\/api\.alerts\.vic\.gov\.au\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'alerts-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutes
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.geojson$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'geojson-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          }
        ]
      },
      manifest: {
        name: 'WeeWoo Map Friends V2',
        short_name: 'WeeWoo Map',
        description: 'Emergency Services Mapping Tool for Australia',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
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
          }
        ]
      }
    })
  ],
  
  build: {
    target: 'es2020',
    minify: 'terser',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries
          vendor: ['leaflet', 'turf', 'proj4'],
          // State management
          state: ['zustand'],
          // Utility libraries
          utils: ['axios', 'date-fns']
        }
      }
    }
  },
  
  // Optimize dependencies for faster dev server
  optimizeDeps: {
    include: [
      'leaflet',
      'turf',
      'proj4',
      'zustand',
      'axios',
      'date-fns'
    ]
  },
  
  // Development server configuration
  server: {
    port: 3000,
    open: true,
    cors: true
  },
  
  // Preview server configuration
  preview: {
    port: 4173,
    open: true
  },
  
  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
  }
});