/**
 * Test Simple de Login - Diagnóstico
 * Para verificar que la autenticación funciona antes de tests complejos
 */

import { test, expect } from '@playwright/test';

test.describe('Login - Test de Diagnóstico', () => {
  test('Debe cargar la página de login', async ({ page }) => {
    await page.goto('/iniciar-sesion', { timeout: 30000 });

    // Verificar que carga
    await expect(page).toHaveURL(/iniciar-sesion/);

    // Verificar que tiene formulario
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="contrasena"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('Debe permitir login con credenciales válidas', async ({ page }) => {
    // Navegar a login
    await page.goto('/iniciar-sesion', { timeout: 30000, waitUntil: 'domcontentloaded' });

    // Esperar formulario
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });

    // Llenar formulario
    await page.fill('input[name="email"]', 'rrr@rrr.com');
    await page.fill('input[name="contrasena"]', '123456');

    // Submit
    await page.click('button[type="submit"]');

    // Esperar redirección
    await page.waitForURL(/\/(dashboard|admin|profesional)/, { timeout: 20000 });

    // Verificar que estamos autenticados
    const url = page.url();
    console.log('✅ Login exitoso - URL:', url);

    expect(url).toMatch(/\/(dashboard|admin|profesional)/);
  });
});
