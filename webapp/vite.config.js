import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
console.log("Vite config loaded, NODE_ENV =", process.env.NODE_ENV);
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:51213",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
    // ✅ разрешаем все ngrok поддомены
    allowedHosts: [".ngrok-free.dev"],
  },
});
