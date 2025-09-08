class MonitoringService {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000;
    this.isEnabled = import.meta.env.MODE === 'production';
    this.errorCount = 0;
    this.warningCount = 0;
    this.infoCount = 0;
  }

  // Niveles de log
  static LOG_LEVELS = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug'
  };

  // Tipos de eventos
  static EVENT_TYPES = {
    USER_ACTION: 'user_action',
    API_CALL: 'api_call',
    ERROR: 'error',
    PERFORMANCE: 'performance',
    SECURITY: 'security',
    BUSINESS: 'business'
  };

  // Log principal
  log(level, message, data = {}, eventType = MonitoringService.EVENT_TYPES.USER_ACTION) {
    const logEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      eventType,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId()
    };

    // Agregar a logs en memoria
    this.addToLogs(logEntry);

    // Enviar a consola en desarrollo
    if (import.meta.env.MODE === 'development') {
      this.logToConsole(level, message, data);
    }

    // Enviar a servicio externo en producción
    if (this.isEnabled) {
      this.sendToExternalService(logEntry);
    }

    // Actualizar contadores
    this.updateCounters(level);
  }

  // Logs específicos por nivel
  error(message, data = {}, eventType = MonitoringService.EVENT_TYPES.ERROR) {
    this.log(MonitoringService.LOG_LEVELS.ERROR, message, data, eventType);
  }

  warn(message, data = {}, eventType = MonitoringService.EVENT_TYPES.USER_ACTION) {
    this.log(MonitoringService.LOG_LEVELS.WARN, message, data, eventType);
  }

  info(message, data = {}, eventType = MonitoringService.EVENT_TYPES.USER_ACTION) {
    this.log(MonitoringService.LOG_LEVELS.INFO, message, data, eventType);
  }

  debug(message, data = {}, eventType = MonitoringService.EVENT_TYPES.USER_ACTION) {
    this.log(MonitoringService.LOG_LEVELS.DEBUG, message, data, eventType);
  }

  // Logs específicos del negocio
  logUserAction(action, userId, additionalData = {}) {
    this.log(MonitoringService.LOG_LEVELS.INFO, `User action: ${action}`, {
      action,
      userId,
      ...additionalData
    }, MonitoringService.EVENT_TYPES.USER_ACTION);
  }

  logApiCall(endpoint, method, statusCode, duration, additionalData = {}) {
    this.log(MonitoringService.LOG_LEVELS.INFO, `API call: ${method} ${endpoint}`, {
      endpoint,
      method,
      statusCode,
      duration,
      ...additionalData
    }, MonitoringService.EVENT_TYPES.API_CALL);
  }

  logPerformance(metric, value, page, additionalData = {}) {
    this.log(MonitoringService.LOG_LEVELS.INFO, `Performance: ${metric}`, {
      metric,
      value,
      page,
      ...additionalData
    }, MonitoringService.EVENT_TYPES.PERFORMANCE);
  }

  logSecurity(event, severity, additionalData = {}) {
    this.log(MonitoringService.LOG_LEVELS.WARN, `Security event: ${event}`, {
      event,
      severity,
      ...additionalData
    }, MonitoringService.EVENT_TYPES.SECURITY);
  }

  logBusinessEvent(event, value, additionalData = {}) {
    this.log(MonitoringService.LOG_LEVELS.INFO, `Business event: ${event}`, {
      event,
      value,
      ...additionalData
    }, MonitoringService.EVENT_TYPES.BUSINESS);
  }

  // Métodos auxiliares
  addToLogs(logEntry) {
    this.logs.unshift(logEntry);
    
    // Mantener solo los últimos N logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
  }

  logToConsole(level, message, data) {
    const styles = {
      error: 'color: red; font-weight: bold;',
      warn: 'color: orange; font-weight: bold;',
      info: 'color: blue;',
      debug: 'color: gray;'
    };

    console.log(
      `%c[${level.toUpperCase()}] ${message}`,
      styles[level] || '',
      data
    );
  }

  sendToExternalService(logEntry) {
    // Aquí se enviaría a un servicio externo como Sentry, LogRocket, etc.
    // Por ahora solo simulamos el envío
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/logs', JSON.stringify(logEntry));
    } else {
      fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logEntry)
      }).catch(err => {
        console.error('Error sending log to external service:', err);
      });
    }
  }

  updateCounters(level) {
    switch (level) {
      case MonitoringService.LOG_LEVELS.ERROR:
        this.errorCount++;
        break;
      case MonitoringService.LOG_LEVELS.WARN:
        this.warningCount++;
        break;
      case MonitoringService.LOG_LEVELS.INFO:
        this.infoCount++;
        break;
    }
  }

  generateLogId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getCurrentUserId() {
    // Obtener ID del usuario actual desde el contexto de autenticación
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      return user?.uid || 'anonymous';
    } catch {
      return 'anonymous';
    }
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  // Métodos de consulta
  getLogs(level = null, eventType = null, limit = 100) {
    let filteredLogs = this.logs;

    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }

    if (eventType) {
      filteredLogs = filteredLogs.filter(log => log.eventType === eventType);
    }

    return filteredLogs.slice(0, limit);
  }

  getErrorLogs(limit = 50) {
    return this.getLogs(MonitoringService.LOG_LEVELS.ERROR, null, limit);
  }

  getWarningLogs(limit = 50) {
    return this.getLogs(MonitoringService.LOG_LEVELS.WARN, null, limit);
  }

  getPerformanceLogs(limit = 50) {
    return this.getLogs(null, MonitoringService.EVENT_TYPES.PERFORMANCE, limit);
  }

  getApiLogs(limit = 50) {
    return this.getLogs(null, MonitoringService.EVENT_TYPES.API_CALL, limit);
  }

  getBusinessLogs(limit = 50) {
    return this.getLogs(null, MonitoringService.EVENT_TYPES.BUSINESS, limit);
  }

  // Estadísticas
  getStats() {
    const totalLogs = this.logs.length;
    const errorRate = totalLogs > 0 ? (this.errorCount / totalLogs) * 100 : 0;
    const warningRate = totalLogs > 0 ? (this.warningCount / totalLogs) * 100 : 0;

    return {
      totalLogs,
      errorCount: this.errorCount,
      warningCount: this.warningCount,
      infoCount: this.infoCount,
      errorRate: Math.round(errorRate * 100) / 100,
      warningRate: Math.round(warningRate * 100) / 100,
      lastLogTime: this.logs[0]?.timestamp || null
    };
  }

  // Limpiar logs
  clearLogs() {
    this.logs = [];
    this.errorCount = 0;
    this.warningCount = 0;
    this.infoCount = 0;
  }

  // Exportar logs
  exportLogs(format = 'json') {
    const data = {
      exportedAt: new Date().toISOString(),
      stats: this.getStats(),
      logs: this.logs
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      return this.convertToCSV(data.logs);
    }

    return data;
  }

  convertToCSV(logs) {
    if (logs.length === 0) return '';

    const headers = ['timestamp', 'level', 'message', 'eventType', 'userId', 'url'];
    const csvContent = [
      headers.join(','),
      ...logs.map(log => 
        headers.map(header => 
          JSON.stringify(log[header] || '')
        ).join(',')
      )
    ].join('\n');

    return csvContent;
  }

  // Monitoreo de rendimiento
  startPerformanceTimer(name) {
    const startTime = performance.now();
    return {
      end: () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        this.logPerformance(name, duration, window.location.pathname);
        return duration;
      }
    };
  }

  // Monitoreo de memoria
  logMemoryUsage() {
    if (performance.memory) {
      this.logPerformance('memory_usage', {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      }, window.location.pathname);
    }
  }

  // Monitoreo de errores de JavaScript
  setupErrorHandling() {
    // Capturar errores no manejados
    window.addEventListener('error', (event) => {
      this.error('Unhandled JavaScript error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack
      });
    });

    // Capturar promesas rechazadas
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection', {
        reason: event.reason,
        promise: event.promise
      });
    });

    // Monitorear memoria cada 30 segundos
    setInterval(() => {
      this.logMemoryUsage();
    }, 30000);
  }

  // Habilitar/deshabilitar monitoreo
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  isMonitoringEnabled() {
    return this.isEnabled;
  }
}

export default new MonitoringService();
