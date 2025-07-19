import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.jsx"
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css"

// Registrar Service Worker para PWA y notificaciones push
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registrado con éxito:', registration);
      })
      .catch((registrationError) => {
        console.log('SW registración falló:', registrationError);
      });
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)