/**
 * Setup de Jest - Ejecutado antes de cada archivo de test
 *
 * Configura:
 * - Matchers personalizados de @testing-library/jest-dom
 * - Mocks globales
 * - Variables de entorno
 * - Polyfills necesarios
 */

// Matchers de jest-dom para aserciones de DOM más expresivas
// Ejemplo: expect(element).toBeInTheDocument()
import '@testing-library/jest-dom';

// Mock de Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock de next-intl para internacionalización
jest.mock('next-intl', () => ({
  useTranslations: () => (key) => key,
  useLocale: () => 'es',
}));

// Mock de Supabase client para tests
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
      getSession: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  })),
}));

// Mock de window.matchMedia (usado por componentes responsive)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock de IntersectionObserver (usado por lazy loading)
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

// Mock de ResizeObserver (usado por componentes responsive)
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Polyfill de fetch, Request, Response para Edge Functions
import 'whatwg-fetch';

// Mock de fetch global (para tests de Edge Functions)
global.fetch = jest.fn();

// Suprimir console.error y console.warn en tests (comentar para debugging)
// global.console.error = jest.fn();
// global.console.warn = jest.fn();

// Variables de entorno para tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.NEXTAUTH_SECRET = 'test-nextauth-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Aumentar timeout para tests de integración lentos
jest.setTimeout(10000);

// Helper global: Mockear fecha actual (útil para tests de disponibilidad)
global.mockDate = (date) => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(date));
};

// Helper global: Restaurar fecha real
global.restoreDate = () => {
  jest.useRealTimers();
};

// Limpiar todos los mocks después de cada test
afterEach(() => {
  jest.clearAllMocks();
});
