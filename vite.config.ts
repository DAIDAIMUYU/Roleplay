import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["icons/*.svg", "apple-touch-icon.svg"],
      manifest: {
        name: "Roleplay Tavern",
        short_name: "角色酒馆",
        description: "本地优先的 AI 角色酒馆，支持角色卡、世界书、记忆、长会话上下文与云端同步。",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait-primary",
        theme_color: "#EEF7FF",
        background_color: "#EEF7FF",
        lang: "zh-CN",
        categories: ["productivity", "entertainment", "utilities"],
        icons: [
          {
            src: "/icons/icon-192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
          },
          {
            src: "/icons/icon-512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
          },
          {
            src: "/icons/maskable-512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api\//, /^\/functions\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkOnly",
          },
          {
            urlPattern: /^https:\/\/api\.deepseek\.com\/.*/i,
            handler: "NetworkOnly",
          },
          {
            urlPattern: /^https:\/\/.*\.openai\.com\/.*/i,
            handler: "NetworkOnly",
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "image-assets",
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
          {
            urlPattern: /\.(?:js|css|woff2)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "static-assets",
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 7 * 24 * 60 * 60,
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
