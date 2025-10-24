/**
 * Helper de Autenticación para Tests E2E
 * Proporciona funciones reutilizables para login y autenticación
 */

import { Page, expect } from '@playwright/test';

export interface Credenciales {
  email: string;
  password: string;
}

export const CREDENCIALES_PRUEBA = {
  usuario: {
    email: 'rrr@rrr.com',
    password: '123456'
  },
  usuarioAlternativo: {
    email: 'usuario@escuchodromo.com',
    password: '123456'
  },
  admin: {
    email: 'admin@escuchodromo.com',
    password: '123456'
  },
  // TODO: Crear en seed de base de datos
  profesional: {
    email: 'profesional@escuchodromo.com',
    password: '123456'
  }
};

/**
 * Realiza login en la aplicación
 */
export async function iniciarSesion(
  page: Page,
  credenciales: Credenciales
): Promise<void> {
  // Navegar a login con timeout extendido
  await page.goto('/iniciar-sesion', { timeout: 30000, waitUntil: 'domcontentloaded' });

  // Esperar que cargue el formulario
  await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 10000 });

  // Llenar formulario (campo es "contrasena" no "password" en español)
  await page.fill('input[name="email"]', credenciales.email);
  await page.fill('input[name="contrasena"]', credenciales.password);

  // Hacer click en el botón de iniciar sesión
  await page.click('button[type="submit"]');

  // Esperar redirección (puede ser a dashboard, profesional/dashboard o admin)
  // Timeout extendido porque Supabase puede tardar
  await page.waitForURL(/\/(dashboard|profesional\/dashboard|admin)/, { timeout: 20000 });

  // Esperar que la página cargue completamente
  await page.waitForLoadState('networkidle', { timeout: 10000 });
}

/**
 * Verifica que el usuario está autenticado
 */
export async function verificarAutenticado(page: Page): Promise<void> {
  // Verificar que existe el token en localStorage
  const hasAuth = await page.evaluate(() => {
    const authData = localStorage.getItem('sb-supabase-auth-token');
    return !!authData;
  });

  expect(hasAuth).toBeTruthy();
}

/**
 * Cierra la sesión del usuario
 */
export async function cerrarSesion(page: Page): Promise<void> {
  // Buscar el botón de cerrar sesión (puede estar en navegación)
  await page.click('[data-testid="boton-cerrar-sesion"]').catch(() => {
    // Si no existe data-testid, buscar por texto
    page.getByText(/cerrar sesión/i).first().click();
  });

  // Esperar redirección a página pública
  await page.waitForURL(/\/(iniciar-sesion|\/(?!dashboard|profesional|admin))/, { timeout: 5000 });
}

/**
 * Limpia el estado de autenticación
 */
export async function limpiarAutenticacion(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Crea una sesión autenticada persistente (para setup de tests)
 */
export async function crearSesionPersistente(
  page: Page,
  credenciales: Credenciales,
  storageStatePath: string
): Promise<void> {
  await iniciarSesion(page, credenciales);
  await verificarAutenticado(page);

  // Guardar estado de autenticación
  await page.context().storageState({ path: storageStatePath });
}
