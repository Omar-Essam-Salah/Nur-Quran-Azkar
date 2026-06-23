import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { inspectAttr } from 'kimi-plugin-inspect-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    inspectAttr(), 
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        // كاش لكل ملفات الواجهة عشان تشتغل بدون نت نهائياً
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,ttf,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 6000000,
        navigateFallback: 'index.html',
        // Cache dynamic content as it's used, so the app keeps working offline.
        runtimeCaching: [
          {
            // Quran text / translations / tafsir / word data
            urlPattern: ({ url }) => url.hostname === 'api.quran.com',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'quran-api',
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Per-ayah recitation audio
            urlPattern: ({ url }) => url.hostname === 'verses.quran.com' || url.hostname === 'everyayah.com' || url.hostname === 'audio.qurancdn.com' || url.hostname === 'mirrors.quranicaudio.com' || url.hostname === 'download.quranicaudio.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'quran-audio',
              rangeRequests: true,
              expiration: { maxEntries: 4000, maxAgeSeconds: 60 * 60 * 24 * 120 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Mushaf (paper) page images
            urlPattern: ({ url }) => url.hostname === 'files.quran.app' || url.hostname === 'android.quran.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'mushaf-pages',
              expiration: { maxEntries: 650, maxAgeSeconds: 60 * 60 * 24 * 180 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Prayer times + hijri date
            urlPattern: ({ url }) => url.hostname === 'api.aladhan.com',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'prayer-times',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Bundled adhan recitations (same-origin) — cache on first play
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/adhan/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'adhan-audio',
              rangeRequests: true,
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Google Fonts (Amiri / Inter)
            urlPattern: ({ url }) => url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
      manifest: {
        name: 'Nur - Quran & Azkar',
        short_name: 'Nur',
        description: 'تطبيق القرآن والأذكار - خالي من الإعلانات ويعمل بدون إنترنت',
        theme_color: '#081d23',
        background_color: '#081d23',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icon-512.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});