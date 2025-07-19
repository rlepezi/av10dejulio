import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.[jt]sx?$/,
  },
  define: {
    // Fallback para compatibility con código que usa process.env
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  server: {
    // Configuración para desarrollo
    port: 5173,
    open: true
  },
  build: {
    // Configuraciones para el build de producción
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth', 'firebase/storage', 'firebase/messaging']
        }
      }
    }
  }
});