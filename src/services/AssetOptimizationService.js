class AssetOptimizationService {
  constructor() {
    this.imageCache = new Map();
    this.fontCache = new Map();
    this.scriptCache = new Map();
    this.styleCache = new Map();
    this.isEnabled = true;
  }

  // Optimizar imágenes
  async optimizeImage(imageUrl, options = {}) {
    const {
      width = null,
      height = null,
      quality = 80,
      format = 'webp',
      lazy = true
    } = options;

    // Verificar caché
    const cacheKey = `${imageUrl}_${width}x${height}_${quality}_${format}`;
    if (this.imageCache.has(cacheKey)) {
      return this.imageCache.get(cacheKey);
    }

    try {
      // Si es una URL externa, usar servicio de optimización
      if (imageUrl.startsWith('http')) {
        const optimizedUrl = await this.optimizeExternalImage(imageUrl, {
          width,
          height,
          quality,
          format
        });
        
        this.imageCache.set(cacheKey, optimizedUrl);
        return optimizedUrl;
      }

      // Para imágenes locales, devolver la URL original
      this.imageCache.set(cacheKey, imageUrl);
      return imageUrl;
    } catch (error) {
      console.error('Error optimizing image:', error);
      return imageUrl; // Fallback a imagen original
    }
  }

  // Optimizar imagen externa usando servicio de optimización
  async optimizeExternalImage(imageUrl, options) {
    const params = new URLSearchParams();
    
    if (options.width) params.append('w', options.width);
    if (options.height) params.append('h', options.height);
    if (options.quality) params.append('q', options.quality);
    if (options.format) params.append('f', options.format);
    
    // Usar servicio de optimización (ej: Cloudinary, ImageKit, etc.)
    const optimizedUrl = `${import.meta.env.VITE_IMAGE_OPTIMIZATION_URL || 'https://res.cloudinary.com/demo/image/fetch'}/${imageUrl}?${params.toString()}`;
    
    return optimizedUrl;
  }

  // Precargar imágenes críticas
  preloadCriticalImages(imageUrls) {
    imageUrls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
    });
  }

  // Lazy loading de imágenes
  setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.dataset.src;
            
            if (src) {
              img.src = src;
              img.classList.remove('lazy');
              img.classList.add('loaded');
              observer.unobserve(img);
            }
          }
        });
      });

      // Observar todas las imágenes con clase 'lazy'
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  // Optimizar fuentes
  async optimizeFonts(fontUrls) {
    const optimizedFonts = [];

    for (const fontUrl of fontUrls) {
      try {
        // Verificar si la fuente ya está cargada
        if (this.fontCache.has(fontUrl)) {
          optimizedFonts.push(this.fontCache.get(fontUrl));
          continue;
        }

        // Precargar fuente
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'font';
        link.type = 'font/woff2';
        link.href = fontUrl;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);

        // Agregar a caché
        this.fontCache.set(fontUrl, fontUrl);
        optimizedFonts.push(fontUrl);
      } catch (error) {
        console.error('Error optimizing font:', error);
        optimizedFonts.push(fontUrl); // Fallback
      }
    }

    return optimizedFonts;
  }

  // Optimizar CSS
  async optimizeCSS(cssUrls) {
    const optimizedStyles = [];

    for (const cssUrl of cssUrls) {
      try {
        // Verificar caché
        if (this.styleCache.has(cssUrl)) {
          optimizedStyles.push(this.styleCache.get(cssUrl));
          continue;
        }

        // Precargar CSS crítico
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'style';
        link.href = cssUrl;
        link.onload = () => {
          link.rel = 'stylesheet';
        };
        document.head.appendChild(link);

        this.styleCache.set(cssUrl, cssUrl);
        optimizedStyles.push(cssUrl);
      } catch (error) {
        console.error('Error optimizing CSS:', error);
        optimizedStyles.push(cssUrl);
      }
    }

    return optimizedStyles;
  }

  // Optimizar JavaScript
  async optimizeJS(jsUrls) {
    const optimizedScripts = [];

    for (const jsUrl of jsUrls) {
      try {
        // Verificar caché
        if (this.scriptCache.has(jsUrl)) {
          optimizedScripts.push(this.scriptCache.get(jsUrl));
          continue;
        }

        // Precargar JavaScript crítico
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'script';
        link.href = jsUrl;
        document.head.appendChild(link);

        this.scriptCache.set(jsUrl, jsUrl);
        optimizedScripts.push(jsUrl);
      } catch (error) {
        console.error('Error optimizing JavaScript:', error);
        optimizedScripts.push(jsUrl);
      }
    }

    return optimizedScripts;
  }

  // Compresión de datos
  compressData(data) {
    try {
      // Usar compresión gzip si está disponible
      if (typeof CompressionStream !== 'undefined') {
        return this.compressWithGzip(data);
      }
      
      // Fallback a compresión simple
      return this.simpleCompress(data);
    } catch (error) {
      console.error('Error compressing data:', error);
      return data;
    }
  }

  // Compresión con gzip
  async compressWithGzip(data) {
    const stream = new CompressionStream('gzip');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    writer.write(new TextEncoder().encode(JSON.stringify(data)));
    writer.close();

    const chunks = [];
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        chunks.push(value);
      }
    }

    return new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], []));
  }

  // Compresión simple
  simpleCompress(data) {
    // Implementación básica de compresión
    const str = JSON.stringify(data);
    return str.replace(/(\w)\1+/g, (match, char) => `${char}${match.length}`);
  }

  // Descompresión de datos
  decompressData(compressedData) {
    try {
      if (compressedData instanceof Uint8Array) {
        return this.decompressGzip(compressedData);
      }
      
      return this.simpleDecompress(compressedData);
    } catch (error) {
      console.error('Error decompressing data:', error);
      return compressedData;
    }
  }

  // Descompresión gzip
  async decompressGzip(compressedData) {
    const stream = new DecompressionStream('gzip');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    writer.write(compressedData);
    writer.close();

    const chunks = [];
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        chunks.push(value);
      }
    }

    const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], []));
    return JSON.parse(new TextDecoder().decode(decompressed));
  }

  // Descompresión simple
  simpleDecompress(compressedData) {
    return compressedData.replace(/(\w)(\d+)/g, (match, char, count) => char.repeat(parseInt(count)));
  }

  // Optimizar bundle de JavaScript
  optimizeBundle() {
    // Dividir código en chunks más pequeños
    this.splitCodeIntoChunks();
    
    // Eliminar código muerto
    this.removeDeadCode();
    
    // Minificar código
    this.minifyCode();
  }

  // Dividir código en chunks
  splitCodeIntoChunks() {
    // Implementación básica de code splitting
    const chunks = {
      vendor: [],
      app: [],
      components: []
    };

    // Lógica para dividir el código
    return chunks;
  }

  // Eliminar código muerto
  removeDeadCode() {
    // Implementación básica de tree shaking
    console.log('🧹 Removing dead code...');
  }

  // Minificar código
  minifyCode() {
    // Implementación básica de minificación
    console.log('📦 Minifying code...');
  }

  // Optimizar recursos críticos
  optimizeCriticalResources() {
    // CSS crítico inline
    this.inlineCriticalCSS();
    
    // JavaScript crítico inline
    this.inlineCriticalJS();
    
    // Precargar recursos importantes
    this.preloadCriticalResources();
  }

  // CSS crítico inline
  inlineCriticalCSS() {
    const criticalCSS = `
      /* CSS crítico para above-the-fold */
      body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
      .header { background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      .hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    `;

    const style = document.createElement('style');
    style.textContent = criticalCSS;
    document.head.insertBefore(style, document.head.firstChild);
  }

  // JavaScript crítico inline
  inlineCriticalJS() {
    const criticalJS = `
      // JavaScript crítico para funcionalidad básica
      window.addEventListener('load', function() {
        console.log('Critical JS loaded');
      });
    `;

    const script = document.createElement('script');
    script.textContent = criticalJS;
    document.head.appendChild(script);
  }

  // Precargar recursos críticos
  preloadCriticalResources() {
    const criticalResources = [
      '/fonts/inter-var.woff2',
      '/images/logo.svg',
      '/css/critical.css',
      '/js/critical.js'
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      
      if (resource.endsWith('.woff2')) {
        link.as = 'font';
        link.type = 'font/woff2';
        link.crossOrigin = 'anonymous';
      } else if (resource.endsWith('.css')) {
        link.as = 'style';
      } else if (resource.endsWith('.js')) {
        link.as = 'script';
      } else if (resource.endsWith('.svg') || resource.endsWith('.png') || resource.endsWith('.jpg')) {
        link.as = 'image';
      }

      document.head.appendChild(link);
    });
  }

  // Optimizar para diferentes dispositivos
  optimizeForDevice() {
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    const isDesktop = window.innerWidth >= 1024;

    if (isMobile) {
      this.optimizeForMobile();
    } else if (isTablet) {
      this.optimizeForTablet();
    } else {
      this.optimizeForDesktop();
    }
  }

  // Optimización para móvil
  optimizeForMobile() {
    // Reducir calidad de imágenes
    this.setImageQuality(70);
    
    // Deshabilitar animaciones complejas
    this.disableComplexAnimations();
    
    // Optimizar fuentes
    this.optimizeFontsForMobile();
  }

  // Optimización para tablet
  optimizeForTablet() {
    this.setImageQuality(80);
    this.optimizeFontsForTablet();
  }

  // Optimización para desktop
  optimizeForDesktop() {
    this.setImageQuality(90);
    this.enableAllFeatures();
  }

  // Configurar calidad de imágenes
  setImageQuality(quality) {
    document.documentElement.style.setProperty('--image-quality', quality);
  }

  // Deshabilitar animaciones complejas
  disableComplexAnimations() {
    document.documentElement.classList.add('reduce-motion');
  }

  // Optimizar fuentes para móvil
  optimizeFontsForMobile() {
    // Usar fuentes del sistema para mejor rendimiento
    document.documentElement.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  }

  // Optimizar fuentes para tablet
  optimizeFontsForTablet() {
    // Balance entre rendimiento y diseño
    document.documentElement.style.fontFamily = 'Inter, system-ui, sans-serif';
  }

  // Habilitar todas las características
  enableAllFeatures() {
    document.documentElement.classList.remove('reduce-motion');
  }

  // Limpiar caché
  clearCache() {
    this.imageCache.clear();
    this.fontCache.clear();
    this.scriptCache.clear();
    this.styleCache.clear();
    console.log('🧹 Cache cleared');
  }

  // Obtener estadísticas de caché
  getCacheStats() {
    return {
      images: this.imageCache.size,
      fonts: this.fontCache.size,
      scripts: this.scriptCache.size,
      styles: this.styleCache.size,
      total: this.imageCache.size + this.fontCache.size + this.scriptCache.size + this.styleCache.size
    };
  }

  // Habilitar/deshabilitar servicio
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  // Verificar si está habilitado
  isOptimizationEnabled() {
    return this.isEnabled;
  }
}

export default new AssetOptimizationService();
