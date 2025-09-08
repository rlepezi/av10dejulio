import React, { useState, useEffect } from 'react';
import { useMobileDetection } from '../hooks/useMobileDetection';

export default function MobileOptimizedForm({ 
  children, 
  onSubmit, 
  className = '',
  ...props 
}) {
  const { isMobile, isTablet } = useMobileDetection();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Detectar si el teclado está abierto (aproximación)
  useEffect(() => {
    const handleResize = () => {
      const initialHeight = window.innerHeight;
      const currentHeight = window.innerHeight;
      const heightDifference = initialHeight - currentHeight;
      
      // Si la altura disminuyó significativamente, probablemente el teclado está abierto
      setIsKeyboardOpen(heightDifference > 150);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll suave para campos de entrada en móvil
  const handleInputFocus = (e) => {
    if (isMobile || isTablet) {
      setTimeout(() => {
        e.target.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }, 300);
    }
  };

  // Agregar event listeners a todos los inputs
  useEffect(() => {
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.addEventListener('focus', handleInputFocus);
    });

    return () => {
      inputs.forEach(input => {
        input.removeEventListener('focus', handleInputFocus);
      });
    };
  }, [isMobile, isTablet]);

  const baseClasses = `
    ${isMobile ? 'space-y-4' : 'space-y-6'}
    ${isMobile ? 'p-4' : 'p-6'}
    ${isKeyboardOpen && isMobile ? 'pb-20' : ''}
  `;

  return (
    <form 
      onSubmit={onSubmit}
      className={`${baseClasses} ${className}`}
      {...props}
    >
      {children}
    </form>
  );
}

// Componente de campo de entrada optimizado para móvil
export function MobileInput({ 
  label, 
  type = 'text', 
  required = false, 
  error = '',
  className = '',
  ...props 
}) {
  const { isMobile } = useMobileDetection();
  const [isFocused, setIsFocused] = useState(false);

  const inputClasses = `
    w-full px-4 py-3 rounded-lg border transition-all duration-200
    ${error 
      ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200' 
      : isFocused
        ? 'border-blue-500 bg-blue-50 focus:border-blue-500 focus:ring-blue-200'
        : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-200'
    }
    ${isMobile ? 'text-base' : 'text-sm'}
    focus:outline-none focus:ring-2
  `;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        type={type}
        className={inputClasses}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      
      {error && (
        <p className="text-sm text-red-600 flex items-center">
          <span className="mr-1">⚠️</span>
          {error}
        </p>
      )}
    </div>
  );
}

// Componente de textarea optimizado para móvil
export function MobileTextarea({ 
  label, 
  required = false, 
  error = '',
  className = '',
  ...props 
}) {
  const { isMobile } = useMobileDetection();
  const [isFocused, setIsFocused] = useState(false);

  const textareaClasses = `
    w-full px-4 py-3 rounded-lg border transition-all duration-200 resize-none
    ${error 
      ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200' 
      : isFocused
        ? 'border-blue-500 bg-blue-50 focus:border-blue-500 focus:ring-blue-200'
        : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-200'
    }
    ${isMobile ? 'text-base min-h-[120px]' : 'text-sm min-h-[100px]'}
    focus:outline-none focus:ring-2
  `;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        className={textareaClasses}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      
      {error && (
        <p className="text-sm text-red-600 flex items-center">
          <span className="mr-1">⚠️</span>
          {error}
        </p>
      )}
    </div>
  );
}

// Componente de botón optimizado para móvil
export function MobileButton({ 
  children, 
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...props 
}) {
  const { isMobile } = useMobileDetection();

  const baseClasses = `
    font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2
    ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
  `;

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-200',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-200',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-200',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-200'
  };

  const sizeClasses = {
    sm: isMobile ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs',
    md: isMobile ? 'px-6 py-3 text-base' : 'px-4 py-2 text-sm',
    lg: isMobile ? 'px-8 py-4 text-lg' : 'px-6 py-3 text-base'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          Cargando...
        </div>
      ) : (
        children
      )}
    </button>
  );
}

// Componente de card optimizado para móvil
export function MobileCard({ 
  children, 
  padding = 'md',
  shadow = 'md',
  className = '',
  ...props 
}) {
  const { isMobile } = useMobileDetection();

  const paddingClasses = {
    sm: isMobile ? 'p-3' : 'p-2',
    md: isMobile ? 'p-4' : 'p-3',
    lg: isMobile ? 'p-6' : 'p-4'
  };

  const shadowClasses = {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };

  return (
    <div
      className={`
        bg-white rounded-lg border border-gray-200
        ${paddingClasses[padding]}
        ${shadowClasses[shadow]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

