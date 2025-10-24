/**
 * Configuración de Jest para Escuchodromo
 *
 * Stack:
 * - Next.js 15.2.4
 * - React 19
 * - TypeScript 5.8.2
 * - Jest 30.0.2
 * - React Testing Library 16.3.0
 *
 * Cobertura objetivo:
 * - Global: 80%
 * - Código crítico (reservas, disponibilidad): 90-95%
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Proveer la ruta al directorio de Next.js para cargar next.config.js y archivos .env en el entorno de test
  dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
  // Setup después de que el entorno esté configurado
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Entorno de testing (jsdom para componentes React)
  testEnvironment: 'jest-environment-jsdom',

  // Module name mapper para resolver aliases de TypeScript
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@escuchodromo/shared$': '<rootDir>/libs/shared/src/index.ts',
  },

  // Archivos a incluir en cobertura
  collectCoverageFrom: [
    // Frontend (componentes, páginas, hooks, utils)
    'src/**/*.{js,jsx,ts,tsx}',
    // Edge Functions de Supabase
    'supabase/functions/**/*.ts',
    // Excluir archivos que no necesitan cobertura
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.config.{js,ts}',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/dist/**',
    '!**/coverage/**',
  ],

  // Umbrales de cobertura
  coverageThreshold: {
    // Umbral global (todo el proyecto)
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Umbrales específicos para código crítico
    // Edge Functions (seguridad y disponibilidad)
    './supabase/functions/reservar-cita/index.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './supabase/functions/listar-profesionales/index.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './supabase/functions/disponibilidad-profesional/index.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    // Componentes críticos
    './src/lib/componentes/CardProfesional.tsx': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './src/lib/componentes/CalendarioMensual.tsx': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/lib/componentes/SlotsDisponibles.tsx': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },

  // Patrones de archivos de test
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],

  // Ignorar estos directorios al buscar tests
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/dist/',
    '/coverage/',
  ],

  // Transformaciones personalizadas (manejadas por next/jest)
  transform: {
    // next/jest maneja la transformación de TS/TSX automáticamente
  },

  // Reporters de cobertura
  coverageReporters: [
    'text',      // Output en consola
    'lcov',      // Para herramientas de CI (Codecov, Coveralls)
    'html',      // Reporte HTML interactivo
    'json',      // Para procesamiento programático
  ],

  // Directorio de salida de cobertura
  coverageDirectory: 'coverage',

  // Configuración de timers (para tests que usan setInterval, setTimeout)
  fakeTimers: { enableGlobally: false },

  // Timeout global para tests (10 segundos)
  testTimeout: 10000,

  // Mostrar cada test individual en la salida
  verbose: true,

  // Limpiar mocks automáticamente entre tests
  clearMocks: true,

  // Restaurar mocks automáticamente entre tests
  restoreMocks: true,

  // Resetear estado de módulos entre tests
  resetMocks: true,

  // Configuración de módulos a transformar (node_modules que usan ESM)
  transformIgnorePatterns: [
    'node_modules/(?!(uuid|@supabase|@heroicons|lucide-react)/)',
  ],

  // Variables de entorno para tests
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },

  // Global setup/teardown
  // globalSetup: '<rootDir>/jest.global-setup.js',
  // globalTeardown: '<rootDir>/jest.global-teardown.js',

  // Maximum number of workers (4 workers en paralelo)
  maxWorkers: '50%',

  // Mostrar notificación cuando termine (solo en modo watch)
  notify: false,

  // Coverage provider (v8 es más rápido que babel)
  coverageProvider: 'v8',
};

// createJestConfig exporta una función async que es necesaria para que next/jest cargue la configuración de Next.js
module.exports = createJestConfig(customJestConfig);
