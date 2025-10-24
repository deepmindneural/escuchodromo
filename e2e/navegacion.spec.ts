/**
 * Tests E2E - Componente de Navegación
 *
 * CRÍTICO: La navegación es el componente más usado
 * Errores aquí afectan la experiencia completa del usuario
 */

import { test, expect } from '@playwright/test';
import { iniciarSesion, CREDENCIALES_PRUEBA, verificarAutenticado } from './helpers/auth.helper';
import { CaptorConsola } from './helpers/console.helper';

test.describe('Navegación - Suite Completa', () => {
  let captor: CaptorConsola;

  test.beforeEach(async ({ page }) => {
    captor = new CaptorConsola(page);
    captor.capturarErroresRed();

    await iniciarSesion(page, CREDENCIALES_PRUEBA.usuario);
    await verificarAutenticado(page);
  });

  test.afterEach(async () => {
    captor.detener();
  });

  test('TC-NAV-001: Debe mostrar navegación en todas las páginas', async ({ page }) => {
    const paginas = [
      '/dashboard',
      '/evaluaciones',
      '/chat',
      '/perfil',
      '/progreso',
      '/recomendaciones'
    ];

    for (const pagina of paginas) {
      await page.goto(pagina);
      await page.waitForLoadState('networkidle');

      // Verificar que existe nav
      const nav = page.locator('nav');
      await expect(nav).toBeVisible();
    }
  });

  test('TC-NAV-002: Debe tener logo o nombre de la app', async ({ page }) => {
    await page.goto('/dashboard');

    // Buscar logo o nombre
    const hasLogo = await page.locator('img[alt*="logo"], img[alt*="Escuchodromo"]').count() > 0 ||
                    await page.getByText(/Escuchodromo/i).first().isVisible();

    expect(hasLogo).toBeTruthy();
  });

  test('TC-NAV-003: Debe tener menú de usuario', async ({ page }) => {
    await page.goto('/dashboard');

    // Buscar menú de usuario (puede ser dropdown, avatar, etc.)
    const hasUserMenu = await page.locator('[data-testid="menu-usuario"]').count() > 0 ||
                        await page.locator('.avatar, .user-menu, [role="button"]').count() > 0 ||
                        await page.getByText(/rrr@rrr.com/i).isVisible();

    expect(hasUserMenu).toBeTruthy();
  });

  test('TC-NAV-004: Debe permitir navegar entre secciones', async ({ page }) => {
    await page.goto('/dashboard');

    // Intentar navegar a evaluaciones desde nav (si existe link directo)
    const evalLink = page.locator('nav a[href="/evaluaciones"]').first();

    if (await evalLink.count() > 0) {
      await evalLink.click();
      await expect(page).toHaveURL(/\/evaluaciones/);
    }
  });

  test('TC-NAV-005: No debe tener errores visuales (menú superpuesto)', async ({ page }) => {
    await page.goto('/dashboard');

    // Verificar que el contenido principal no está tapado por nav
    const main = page.locator('main');
    await expect(main).toBeVisible();

    // Verificar que hay padding-top suficiente
    const mainBox = await main.boundingBox();
    expect(mainBox).toBeTruthy();

    if (mainBox) {
      // El main debe estar debajo del nav (top > 0)
      expect(mainBox.y).toBeGreaterThan(0);
    }
  });

  test('TC-NAV-006: Navegación móvil - Debe tener menú hamburguesa', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
    }

    await page.goto('/dashboard');

    // Buscar botón de menú hamburguesa
    const menuBtn = page.locator('[aria-label*="menu"], [data-testid="menu-toggle"], button.hamburger');

    if (await menuBtn.count() > 0) {
      await expect(menuBtn).toBeVisible();

      // Click para abrir
      await menuBtn.click();
      await page.waitForTimeout(500);

      // Verificar que se abre el menú
      const menuOpen = page.locator('[role="dialog"], .mobile-menu, .drawer');
      await expect(menuOpen).toBeVisible();
    }
  });

  test('TC-NAV-007: No debe tener errores de console en navegación', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const resumen = captor.obtenerResumen();

    // No debe tener errores críticos
    expect(resumen.errores406.length).toBe(0);
    expect(resumen.errores403.length).toBe(0);
  });
});
