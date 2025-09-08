class BackupService {
  constructor() {
    this.isEnabled = import.meta.env.MODE === 'production';
    this.backupInterval = 24 * 60 * 60 * 1000; // 24 horas
    this.maxBackups = 30; // Mantener 30 backups
    this.backupKey = 'av10dejulio_backup';
  }

  // Inicializar el servicio de backup
  initialize() {
    if (!this.isEnabled) {
      console.log('🔄 Backup service disabled in development');
      return;
    }

    // Backup inicial
    this.createBackup();

    // Programar backups automáticos
    this.scheduleBackups();
  }

  // Crear backup de datos críticos
  async createBackup() {
    try {
      const backupData = await this.collectBackupData();
      const backupId = this.generateBackupId();
      const timestamp = new Date().toISOString();

      const backup = {
        id: backupId,
        timestamp,
        version: import.meta.env.VITE_APP_VERSION || '1.0.0',
        data: backupData,
        size: JSON.stringify(backupData).length,
        checksum: this.calculateChecksum(backupData)
      };

      // Guardar en localStorage
      this.saveBackupToLocal(backup);

      // Enviar a servidor (si está disponible)
      await this.sendBackupToServer(backup);

      console.log(`✅ Backup created: ${backupId}`);
      return backup;
    } catch (error) {
      console.error('❌ Error creating backup:', error);
      throw error;
    }
  }

  // Recopilar datos para backup
  async collectBackupData() {
    const backupData = {
      // Datos de usuario
      user: this.getUserData(),
      
      // Configuraciones de la aplicación
      settings: this.getAppSettings(),
      
      // Datos de formularios guardados
      formData: this.getFormData(),
      
      // Preferencias de UI
      uiPreferences: this.getUIPreferences(),
      
      // Datos de caché importantes
      cache: this.getImportantCache(),
      
      // Metadatos del sistema
      metadata: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screenResolution: `${screen.width}x${screen.height}`,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onlineStatus: navigator.onLine
      }
    };

    return backupData;
  }

  // Obtener datos del usuario
  getUserData() {
    try {
      const user = localStorage.getItem('user');
      const userProfile = localStorage.getItem('userProfile');
      const userSettings = localStorage.getItem('userSettings');
      
      return {
        user: user ? JSON.parse(user) : null,
        profile: userProfile ? JSON.parse(userProfile) : null,
        settings: userSettings ? JSON.parse(userSettings) : null
      };
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  // Obtener configuraciones de la aplicación
  getAppSettings() {
    try {
      const settings = localStorage.getItem('appSettings');
      return settings ? JSON.parse(settings) : {};
    } catch (error) {
      console.error('Error getting app settings:', error);
      return {};
    }
  }

  // Obtener datos de formularios
  getFormData() {
    try {
      const formData = localStorage.getItem('formData');
      return formData ? JSON.parse(formData) : {};
    } catch (error) {
      console.error('Error getting form data:', error);
      return {};
    }
  }

  // Obtener preferencias de UI
  getUIPreferences() {
    try {
      const uiPrefs = localStorage.getItem('uiPreferences');
      return uiPrefs ? JSON.parse(uiPrefs) : {};
    } catch (error) {
      console.error('Error getting UI preferences:', error);
      return {};
    }
  }

  // Obtener caché importante
  getImportantCache() {
    try {
      const cache = {};
      const cacheKeys = [
        'recentSearches',
        'favoriteCompanies',
        'recentServices',
        'userPreferences',
        'themeSettings'
      ];

      cacheKeys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          cache[key] = JSON.parse(data);
        }
      });

      return cache;
    } catch (error) {
      console.error('Error getting cache data:', error);
      return {};
    }
  }

  // Guardar backup en localStorage
  saveBackupToLocal(backup) {
    try {
      const backups = this.getStoredBackups();
      backups.unshift(backup);

      // Mantener solo los últimos N backups
      if (backups.length > this.maxBackups) {
        backups.splice(this.maxBackups);
      }

      localStorage.setItem(this.backupKey, JSON.stringify(backups));
    } catch (error) {
      console.error('Error saving backup to local storage:', error);
    }
  }

  // Enviar backup al servidor
  async sendBackupToServer(backup) {
    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(backup)
      });

      if (!response.ok) {
        throw new Error(`Server backup failed: ${response.status}`);
      }

      console.log('✅ Backup sent to server successfully');
    } catch (error) {
      console.warn('⚠️ Server backup failed, keeping local backup only:', error);
    }
  }

  // Obtener backups almacenados
  getStoredBackups() {
    try {
      const backups = localStorage.getItem(this.backupKey);
      return backups ? JSON.parse(backups) : [];
    } catch (error) {
      console.error('Error getting stored backups:', error);
      return [];
    }
  }

  // Restaurar desde backup
  async restoreFromBackup(backupId) {
    try {
      const backups = this.getStoredBackups();
      const backup = backups.find(b => b.id === backupId);

      if (!backup) {
        throw new Error('Backup not found');
      }

      // Verificar integridad del backup
      if (!this.verifyBackupIntegrity(backup)) {
        throw new Error('Backup integrity check failed');
      }

      // Restaurar datos
      await this.restoreData(backup.data);

      console.log(`✅ Restored from backup: ${backupId}`);
      return true;
    } catch (error) {
      console.error('❌ Error restoring from backup:', error);
      throw error;
    }
  }

  // Restaurar datos desde backup
  async restoreData(data) {
    try {
      // Restaurar datos de usuario
      if (data.user) {
        if (data.user.user) {
          localStorage.setItem('user', JSON.stringify(data.user.user));
        }
        if (data.user.profile) {
          localStorage.setItem('userProfile', JSON.stringify(data.user.profile));
        }
        if (data.user.settings) {
          localStorage.setItem('userSettings', JSON.stringify(data.user.settings));
        }
      }

      // Restaurar configuraciones
      if (data.settings) {
        localStorage.setItem('appSettings', JSON.stringify(data.settings));
      }

      // Restaurar datos de formularios
      if (data.formData) {
        localStorage.setItem('formData', JSON.stringify(data.formData));
      }

      // Restaurar preferencias de UI
      if (data.uiPreferences) {
        localStorage.setItem('uiPreferences', JSON.stringify(data.uiPreferences));
      }

      // Restaurar caché
      if (data.cache) {
        Object.keys(data.cache).forEach(key => {
          localStorage.setItem(key, JSON.stringify(data.cache[key]));
        });
      }

      // Recargar la página para aplicar cambios
      window.location.reload();
    } catch (error) {
      console.error('Error restoring data:', error);
      throw error;
    }
  }

  // Verificar integridad del backup
  verifyBackupIntegrity(backup) {
    try {
      const calculatedChecksum = this.calculateChecksum(backup.data);
      return calculatedChecksum === backup.checksum;
    } catch (error) {
      console.error('Error verifying backup integrity:', error);
      return false;
    }
  }

  // Calcular checksum
  calculateChecksum(data) {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  // Generar ID de backup
  generateBackupId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `backup_${timestamp}_${random}`;
  }

  // Programar backups automáticos
  scheduleBackups() {
    setInterval(() => {
      this.createBackup();
    }, this.backupInterval);
  }

  // Obtener token de autenticación
  getAuthToken() {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      return user?.accessToken || null;
    } catch {
      return null;
    }
  }

  // Exportar backup
  exportBackup(backupId) {
    try {
      const backups = this.getStoredBackups();
      const backup = backups.find(b => b.id === backupId);

      if (!backup) {
        throw new Error('Backup not found');
      }

      const dataStr = JSON.stringify(backup, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_${backupId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log(`✅ Backup exported: ${backupId}`);
    } catch (error) {
      console.error('❌ Error exporting backup:', error);
      throw error;
    }
  }

  // Importar backup
  async importBackup(file) {
    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      // Verificar estructura del backup
      if (!backup.id || !backup.timestamp || !backup.data) {
        throw new Error('Invalid backup file format');
      }

      // Verificar integridad
      if (!this.verifyBackupIntegrity(backup)) {
        throw new Error('Backup integrity check failed');
      }

      // Guardar backup
      this.saveBackupToLocal(backup);

      console.log(`✅ Backup imported: ${backup.id}`);
      return backup;
    } catch (error) {
      console.error('❌ Error importing backup:', error);
      throw error;
    }
  }

  // Limpiar backups antiguos
  cleanOldBackups() {
    try {
      const backups = this.getStoredBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 días

      const recentBackups = backups.filter(backup => 
        new Date(backup.timestamp) > cutoffDate
      );

      localStorage.setItem(this.backupKey, JSON.stringify(recentBackups));
      console.log(`🧹 Cleaned old backups, kept ${recentBackups.length} recent ones`);
    } catch (error) {
      console.error('Error cleaning old backups:', error);
    }
  }

  // Obtener estadísticas de backup
  getBackupStats() {
    const backups = this.getStoredBackups();
    const totalSize = backups.reduce((sum, backup) => sum + (backup.size || 0), 0);
    const oldestBackup = backups[backups.length - 1];
    const newestBackup = backups[0];

    return {
      totalBackups: backups.length,
      totalSize: totalSize,
      averageSize: backups.length > 0 ? Math.round(totalSize / backups.length) : 0,
      oldestBackup: oldestBackup?.timestamp,
      newestBackup: newestBackup?.timestamp,
      lastBackupSize: newestBackup?.size || 0
    };
  }

  // Habilitar/deshabilitar servicio
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  // Verificar si está habilitado
  isBackupEnabled() {
    return this.isEnabled;
  }
}

export default new BackupService();
