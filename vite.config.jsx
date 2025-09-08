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
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'process.env': JSON.stringify(process.env),
    // Exponer variables de entorno de Vite
    'import.meta.env.VITE_GA_MEASUREMENT_ID': JSON.stringify(process.env.VITE_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX'),
    'import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify(process.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_...'),
    'import.meta.env.VITE_BASE_URL': JSON.stringify(process.env.VITE_BASE_URL || 'http://localhost:5176'),
    'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV || 'development')
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