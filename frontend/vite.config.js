import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./", // Relative paths cho production serve (Render)
  build: {
    outDir: "dist", // Output folder cho static files
    sourcemap: true, // Debug JS errors
    rollupOptions: {
      output: {
        manualChunks: undefined, // Optimize chunks cho chat app
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    }, // Proxy API đến backend dev
  },
});
