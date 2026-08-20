import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    // 오프라인에서도 돌아가고 홈 화면에 설치할 수 있게 한다.
    // 정적 사이트라 앱 껍데기와 콘텐츠 청크를 그대로 캐시하면 끝이다.
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon-64.png", "icon-180.png"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,woff2}"],
        // 문법 데이터 청크가 커서 기본 상한(2MB)을 넉넉히 넘겨 둔다
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: "index.html",
      },
      manifest: {
        name: "고등영어문법",
        short_name: "고등영어문법",
        description: "고등학교 영어 문법 정리와 퀴즈 학습 도구",
        lang: "ko",
        start_url: "./",
        scope: "./",
        display: "standalone",
        orientation: "portrait",
        background_color: "#FFFFFF",
        theme_color: "#FFFFFF",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
  build: {
    // 정적 호스팅(Cloudflare Pages / Vercel)에 그대로 올리는 구조를 유지한다
    outDir: "dist",
    sourcemap: false,
  },
});
