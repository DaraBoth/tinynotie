import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host:'0.0.0.0',
    strictPort:true,
    port:2023,
    hmr:{
      overlay:false
    }
  },
  resolve: {
    alias: [{ find: "@", replacement: path.resolve(__dirname, "src") }],
  },
  build: {
    rollupOptions: {
      external: ["zwitch"],
    },
  },
  optimizeDeps: {
    include: ["zwitch"],
  },
});
