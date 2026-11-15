import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [dyadComponentTagger(), react(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['icon.svg'],
    manifest: {
      name: 'Sklad součástek', short_name: 'Součástky',
      description: 'Tvůj osobní sklad elektroniky, projekty a nápady do dílny.',
      lang: 'cs', start_url: '/', scope: '/', display: 'standalone',
      theme_color: '#0B0D10', background_color: '#0B0D10',
      icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }, { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' }]
    },
    workbox: { globPatterns: ['**/*.{js,css,html,svg,woff2}'], navigateFallbackDenylist: [/^\/auth\//, /^\/reset-password/], runtimeCaching: [] }
  })],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
