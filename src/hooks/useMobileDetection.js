import { useState, useEffect } from 'react';

export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [screenSize, setScreenSize] = useState('desktop');

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      
      // Breakpoints
      const mobileBreakpoint = 768;
      const tabletBreakpoint = 1024;
      
      const mobile = width < mobileBreakpoint;
      const tablet = width >= mobileBreakpoint && width < tabletBreakpoint;
      const desktop = width >= tabletBreakpoint;
      
      setIsMobile(mobile);
      setIsTablet(tablet);
      setIsDesktop(desktop);
      
      // Determinar tamaño de pantalla
      if (mobile) {
        setScreenSize('mobile');
      } else if (tablet) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    // Verificar al cargar
    checkDevice();

    // Escuchar cambios de tamaño
    window.addEventListener('resize', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop,
    screenSize,
    isMobileOrTablet: isMobile || isTablet
  };
};

export default useMobileDetection;

