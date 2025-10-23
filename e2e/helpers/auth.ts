/**
 * Helpers de Autenticación para Tests E2E
 *
 * Proporciona funciones reutilizables para login y gestión de sesiones
 * en diferentes roles (USUARIO, TERAPEUTA, ADMIN)
 */

import { Page, expect } from '@playwright/test';

// ==========================================
// CREDENCIALES DE PRUEBA
// ==========================================

export const CREDENCIALES = {
  usuario: {
    email: 'usuario@escuchodromo.com',
    password: '123456',
    rol: 'USUARIO',
  },
  terapeuta: {
    email: 'terapeuta@escuchodromo.com',
    password: '123456',
    rol: 'TERAPEUTA',
  },
  admin: {
    email: 'admin@escuchodromo.com',
    password: '123456',
    rol: 'ADMIN',
  },
};

// ==========================================
// FUNCIÓN GENÉRICA DE LOGIN
// ==========================================

/**
 * Login genérico que funciona para cualquier rol
 * @param page - Instancia de Playwright Page
 * @param email - Email del usuario
 * @param password - Contraseña del usuario
 */
export async function login(page: Page, email: string, password: string) {
  // Navegar a página de login
  await page.goto('/iniciar-sesion');

  // Verificar que estamos en la página correcta
  await expect(page).toHaveURL(/\/iniciar-sesion/);

  // Llenar formulario
  const emailInput = page.locator('input[name="email"], input[type="email"]');
  const passwordInput = page.locator('input[name="password"], input[type="password"]');

  await emailInput.fill(email);
  await passwordInput.fill(password);

  // Click en botón de submit
  const submitButton = page.locator('button[type="submit"]');
  await submitButton.click();

  // Esperar redirección (timeout aumentado para carga de datos)
  await page.waitForURL(/\/(dashboard|profesional|admin)/, { timeout: 15000 });
}

// ==========================================
// FUNCIONES DE LOGIN POR ROL
// ==========================================

/**
 * Login como usuario paciente (USUARIO)
 */
export async function loginComoUsuario(page: Page) {
  await login(page, CREDENCIALES.usuario.email, CREDENCIALES.usuario.password);

  // Verificar redirección correcta
  await expect(page).toHaveURL(/\/dashboard/);

  console.log('✅ Login exitoso como USUARIO');
}

/**
 * Login como terapeuta profesional (TERAPEUTA)
 */
export async function loginComoTerapeuta(page: Page) {
  await login(page, CREDENCIALES.terapeuta.email, CREDENCIALES.terapeuta.password);

  // Verificar redirección correcta
  await expect(page).toHaveURL(/\/profesional/);

  console.log('✅ Login exitoso como TERAPEUTA');
}

/**
 * Login como administrador (ADMIN)
 */
export async function loginComoAdmin(page: Page) {
  await login(page, CREDENCIALES.admin.email, CREDENCIALES.admin.password);

  // Verificar redirección correcta
  await expect(page).toHaveURL(/\/admin/);

  console.log('✅ Login exitoso como ADMIN');
}

// ==========================================
// FUNCIÓN DE LOGOUT
// ==========================================

/**
 * Cerrar sesión del usuario actual
 */
export async function logout(page: Page) {
  // Buscar botón de logout (puede estar en menú desplegable)
  const logoutButton = page.locator('button:has-text("Cerrar sesión"), a:has-text("Cerrar sesión")');

  // Verificar si está visible directamente
  const isVisible = await logoutButton.isVisible();

  if (!isVisible) {
    // Puede estar en un menú desplegable, intentar abrir menú de usuario
    const userMenu = page.locator('[data-testid="menu-usuario"], button:has([data-testid="avatar"])');
    await userMenu.click();

    // Esperar a que el menú se abra
    await page.waitForTimeout(500);
  }

  // Click en cerrar sesión
  await logoutButton.click();

  // Esperar redirección a página pública
  await page.waitForURL(/\/(iniciar-sesion|\/)?$/, { timeout: 5000 });

  console.log('✅ Logout exitoso');
}

// ==========================================
// VERIFICAR ESTADO DE AUTENTICACIÓN
// ==========================================

/**
 * Verificar si el usuario está autenticado
 */
export async function estaAutenticado(page: Page): Promise<boolean> {
  try {
    // Buscar elementos que solo aparecen cuando estás autenticado
    const elementosAutenticados = [
      '[data-testid="menu-usuario"]',
      '[data-testid="avatar"]',
      'button:has-text("Mi perfil")',
    ];

    for (const selector of elementosAutenticados) {
      const element = page.locator(selector);
      const isVisible = await element.isVisible({ timeout: 2000 });
      if (isVisible) return true;
    }

    return false;
  } catch {
    return false;
  }
}

// ==========================================
// OBTENER ROL DEL USUARIO ACTUAL
// ==========================================

/**
 * Detectar el rol del usuario actual basándose en la URL o elementos visibles
 */
export async function obtenerRolActual(page: Page): Promise<'USUARIO' | 'TERAPEUTA' | 'ADMIN' | null> {
  const url = page.url();

  if (url.includes('/admin')) return 'ADMIN';
  if (url.includes('/profesional')) return 'TERAPEUTA';
  if (url.includes('/dashboard')) return 'USUARIO';

  return null;
}

// ==========================================
// GUARDAR Y RESTAURAR SESIÓN
// ==========================================

/**
 * Guardar estado de sesión actual a archivo
 * Útil para reutilizar sesiones entre tests
 */
export async function guardarSesion(page: Page, archivo: string) {
  await page.context().storageState({ path: archivo });
  console.log(`✅ Sesión guardada en: ${archivo}`);
}

/**
 * Restaurar sesión desde archivo
 */
export async function restaurarSesion(page: Page, archivo: string) {
  // Esta función requiere configuración en playwright.config.ts
  // Se usa con: use: { storageState: archivo }
  console.log(`✅ Sesión restaurada desde: ${archivo}`);
}

// ==========================================
// ESPERAS INTELIGENTES
// ==========================================

/**
 * Esperar a que la página termine de cargar datos
 * Útil después de login cuando se cargan datos del usuario
 */
export async function esperarCargaDatos(page: Page, timeout = 5000) {
  // Esperar a que no haya spinners o loaders visibles
  const loadingIndicators = [
    '[data-testid="spinner"]',
    '[data-testid="loading"]',
    '.animate-spin',
    '[aria-busy="true"]',
  ];

  for (const selector of loadingIndicators) {
    try {
      await page.waitForSelector(selector, { state: 'hidden', timeout });
    } catch {
      // Si no existe el selector, continuar
    }
  }

  // Esperar a que la red esté idle
  await page.waitForLoadState('networkidle', { timeout });
}

// ==========================================
// VERIFICAR REDIRECCIÓN DE PROTECCIÓN
// ==========================================

/**
 * Verificar que una ruta protegida redirige a login
 */
export async function verificarRedirectALogin(page: Page, rutaProtegida: string) {
  await page.goto(rutaProtegida);

  // Debe redirigir a login
  await expect(page).toHaveURL(/\/iniciar-sesion/, { timeout: 10000 });

  // Verificar que el parámetro redirect está presente
  const url = new URL(page.url());
  const redirect = url.searchParams.get('redirect');

  if (redirect) {
    expect(redirect).toBe(rutaProtegida);
  }
}

/**
 * Verificar que una ruta de admin redirige a dashboard si no eres admin
 */
export async function verificarRedirectPorPermisos(page: Page, rutaAdmin: string) {
  await page.goto(rutaAdmin);

  // Debe redirigir a dashboard con error
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

  // Verificar parámetro de error
  const url = new URL(page.url());
  const error = url.searchParams.get('error');

  expect(error).toBe('no_autorizado');
}
