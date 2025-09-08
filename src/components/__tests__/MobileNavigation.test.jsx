import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MobileNavigation from '../MobileNavigation';
import { AuthProvider } from '../AuthProvider';

// Mock del hook useMobileDetection
jest.mock('../../hooks/useMobileDetection', () => ({
  useMobileDetection: () => ({
    isMobile: true,
    isTablet: false,
    isDesktop: false,
    screenSize: 'mobile',
    isMobileOrTablet: true
  })
}));

// Mock del AuthProvider
const MockAuthProvider = ({ children, user = null, rol = null }) => (
  <AuthProvider value={{ user, rol }}>
    {children}
  </AuthProvider>
);

const renderWithRouter = (component, { user = null, rol = null } = {}) => {
  return render(
    <BrowserRouter>
      <MockAuthProvider user={user} rol={rol}>
        {component}
      </MockAuthProvider>
    </BrowserRouter>
  );
};

describe('MobileNavigation', () => {
  test('renders mobile navigation when on mobile device', () => {
    renderWithRouter(<MobileNavigation />);
    
    // Verificar que el botón de menú esté presente
    const menuButton = screen.getByRole('button');
    expect(menuButton).toBeInTheDocument();
  });

  test('opens and closes mobile menu', () => {
    renderWithRouter(<MobileNavigation />);
    
    const menuButton = screen.getByRole('button');
    
    // Abrir menú
    fireEvent.click(menuButton);
    
    // Verificar que el menú esté abierto
    expect(screen.getByText('Menú')).toBeInTheDocument();
    
    // Cerrar menú
    const closeButton = screen.getByText('✕');
    fireEvent.click(closeButton);
    
    // El menú debería estar cerrado (no visible)
    expect(screen.queryByText('Menú')).not.toBeInTheDocument();
  });

  test('shows navigation items for unauthenticated user', () => {
    renderWithRouter(<MobileNavigation />);
    
    const menuButton = screen.getByRole('button');
    fireEvent.click(menuButton);
    
    // Verificar elementos de navegación pública
    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.getByText('Empresas')).toBeInTheDocument();
    expect(screen.getByText('Servicios')).toBeInTheDocument();
    expect(screen.getByText('Recursos')).toBeInTheDocument();
    expect(screen.getByText('FAQ')).toBeInTheDocument();
    expect(screen.getByText('Contacto')).toBeInTheDocument();
  });

  test('shows user menu for authenticated user', () => {
    const mockUser = {
      uid: '123',
      email: 'test@example.com'
    };
    
    renderWithRouter(<MobileNavigation />, { 
      user: mockUser, 
      rol: 'cliente' 
    });
    
    const menuButton = screen.getByRole('button');
    fireEvent.click(menuButton);
    
    // Verificar información del usuario
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('cliente')).toBeInTheDocument();
    
    // Verificar menú de usuario
    expect(screen.getByText('Mi Cuenta')).toBeInTheDocument();
    expect(screen.getByText('Mi Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Mi Perfil')).toBeInTheDocument();
    expect(screen.getByText('Configuración')).toBeInTheDocument();
  });

  test('shows login/register buttons for unauthenticated user', () => {
    renderWithRouter(<MobileNavigation />);
    
    const menuButton = screen.getByRole('button');
    fireEvent.click(menuButton);
    
    // Verificar botones de autenticación
    expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
    expect(screen.getByText('Registrarse')).toBeInTheDocument();
  });

  test('closes menu when clicking outside', () => {
    renderWithRouter(<MobileNavigation />);
    
    const menuButton = screen.getByRole('button');
    fireEvent.click(menuButton);
    
    // Verificar que el menú esté abierto
    expect(screen.getByText('Menú')).toBeInTheDocument();
    
    // Hacer clic fuera del menú
    const overlay = document.querySelector('.fixed.inset-0.bg-black');
    fireEvent.click(overlay);
    
    // El menú debería estar cerrado
    expect(screen.queryByText('Menú')).not.toBeInTheDocument();
  });
});

