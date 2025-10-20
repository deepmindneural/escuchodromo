/**
 * Configuración de Playwright para Tests E2E
 *
 * Playwright es el framework E2E recomendado por su:
 * - Velocidad y estabilidad
 * - Auto-waiting inteligente
 * - Soporte de múltiples navegadores (Chromium, Firefox, WebKit)
 * - Testing de accesibilidad integrado
 * - Screenshots y videos automáticos
 *
 * Documentación: https://playwright.dev/
 */

import { defineConfig, devices } from '@playwright/test';

/**
 * Leer variables de entorno del archivo .env.test
 */
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  // Directorio de tests E2E
  testDir: './e2e',

  // Directorio de salida de resultados
  outputDir: './test-results',

  // Timeout global para cada test (30 segundos)
  timeout: 30 * 1000,

  // Timeout para expect() assertions (5 segundos)
  expect: {
    timeout: 5000,
  },

  // Configuración de tests
  fullyParallel: true, // Ejecutar tests en paralelo
  forbidOnly: !!process.env.CI, // Fallar si hay test.only() en CI
  retries: process.env.CI ? 2 : 0, // Retry 2 veces en CI, 0 en local
  workers: process.env.CI ? 1 : undefined, // 1 worker en CI, auto en local
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    process.env.CI ? ['github'] : ['list'],
  ],

  // Configuración compartida para todos los proyectos
  use: {
    // URL base para navegación
    baseURL: BASE_URL,

    // Trace en primera retry
    trace: 'on-first-retry',

    // Screenshot solo en fallo
    screenshot: 'only-on-failure',

    // Video solo en fallo
    video: 'retain-on-failure',

    // Timeouts de navegación
    navigationTimeout: 10000,
    actionTimeout: 5000,

    // Locale español
    locale: 'es-CO',

    // Timezone Colombia
    timezoneId: 'America/Bogota',

    // Configuración de accesibilidad
    // Simular prefers-reduced-motion para algunos tests
    // reducedMotion: 'reduce',
  },

  // Proyectos (configuraciones de navegadores)
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Simular usuario autenticado
        // storageState: 'e2e/.auth/usuario.json',
      },
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
      },
    },

    // Tests móviles
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },

    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 13'],
      },
    },

    // Tablet
    {
      name: 'iPad',
      use: {
        ...devices['iPad Pro'],
      },
    },
  ],

  // Web Server (iniciar Next.js antes de los tests)
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutos para iniciar
  },
});
