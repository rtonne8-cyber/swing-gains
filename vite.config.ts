import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/swing-gains/",
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"],
      manifest: {
        name: "Swing Gains",
        short_name: "Swing Gains",
        description: "12-month golf strength and conditioning programme — adaptive load progression, venue-aware session queues.",
        theme_color: "#34699E",
        background_color: "#D8D4C9",
        display: "standalone",
        orientation: "portrait",
        start_url: "/swing-gains/",
        scope: "/swing-gains/",
        icons: [
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: []
      }
    })
  ],
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"]
  }
});
