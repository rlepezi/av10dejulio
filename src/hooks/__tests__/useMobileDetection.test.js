import { renderHook } from '@testing-library/react';
import { useMobileDetection } from '../useMobileDetection';

// Mock de window.innerWidth
const mockInnerWidth = (width) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
};

describe('useMobileDetection', () => {
  beforeEach(() => {
    // Reset window.innerWidth antes de cada test
    mockInnerWidth(1024);
  });

  test('detects desktop screen size', () => {
    mockInnerWidth(1200);
    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isDesktop).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isMobile).toBe(false);
    expect(result.current.screenSize).toBe('desktop');
    expect(result.current.isMobileOrTablet).toBe(false);
  });

  test('detects tablet screen size', () => {
    mockInnerWidth(800);
    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isDesktop).toBe(false);
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isMobile).toBe(false);
    expect(result.current.screenSize).toBe('tablet');
    expect(result.current.isMobileOrTablet).toBe(true);
  });

  test('detects mobile screen size', () => {
    mockInnerWidth(400);
    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isDesktop).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isMobile).toBe(true);
    expect(result.current.screenSize).toBe('mobile');
    expect(result.current.isMobileOrTablet).toBe(true);
  });

  test('updates on window resize', () => {
    mockInnerWidth(1200);
    const { result, rerender } = renderHook(() => useMobileDetection());

    // Inicialmente desktop
    expect(result.current.isDesktop).toBe(true);

    // Simular resize a mobile
    mockInnerWidth(400);
    window.dispatchEvent(new Event('resize'));
    rerender();

    // Debería detectar mobile
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });

  test('handles edge cases at breakpoints', () => {
    // Test en el breakpoint exacto de mobile (768px)
    mockInnerWidth(768);
    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(true);
    expect(result.current.screenSize).toBe('tablet');
  });

  test('handles very small screens', () => {
    mockInnerWidth(320);
    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.screenSize).toBe('mobile');
  });

  test('handles very large screens', () => {
    mockInnerWidth(2560);
    const { result } = renderHook(() => useMobileDetection());

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.screenSize).toBe('desktop');
  });
});

