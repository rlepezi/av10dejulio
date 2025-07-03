import { render, screen } from '@testing-library/react';
import App from './App';

test('renderiza el header', () => {
  render(<App />);
  // Cambia "Directorio Empresas 10 de Julio" por el texto real de tu Header
  const header = screen.getByText(/Av. 10 de julio/i);
  expect(header).toBeInTheDocument();
});
