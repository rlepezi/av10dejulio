// Logger de producción para reemplazar console.log
class Logger {
  static isDevelopment = process.env.NODE_ENV === 'development';

  static log(message, data = null) {
    if (this.isDevelopment) {
      console.log(message, data);
    }
  }

  static error(message, error = null) {
    console.error(message, error);
    // En producción, enviar a servicio de monitoreo
    if (!this.isDevelopment) {
      this.sendToMonitoring('error', message, error);
    }
  }

  static warn(message, data = null) {
    if (this.isDevelopment) {
      console.warn(message, data);
    }
  }

  static info(message, data = null) {
    if (this.isDevelopment) {
      console.info(message, data);
    }
  }

  static sendToMonitoring(level, message, data) {
    // Integración futura con Sentry, LogRocket, etc.
    try {
      fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level,
          message,
          data: JSON.stringify(data),
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent
        })
      });
    } catch (err) {
      // Fallback silencioso
    }
  }
}

export default Logger;
