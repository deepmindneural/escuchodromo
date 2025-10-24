/**
 * Tests E2E - Dashboard de Usuario
 *
 * CRÍTICO: Esta suite verifica el flujo completo del dashboard
 * Cualquier fallo puede afectar la experiencia de usuarios en crisis
 */

import { test, expect, Page } from '@playwright/test';
import { iniciarSesion, CREDENCIALES_PRUEBA, verificarAutenticado } from './helpers/auth.helper';
import { CaptorConsola } from './helpers/console.helper';

test.describe('Dashboard de Usuario - Suite Completa', () => {
  let captor: CaptorConsola;

  test.beforeEach(async ({ page }) => {
    // Inicializar captor de errores
    captor = new CaptorConsola(page);
    captor.capturarErroresRed();

    // Login como usuario
    await iniciarSesion(page, CREDENCIALES_PRUEBA.usuario);
    await verificarAutenticado(page);
  });

  test.afterEach(async () => {
    // Generar reporte de errores
    const resumen = captor.obtenerResumen();

    if (resumen.erroresTotales > 0) {
      console.log('\n📊 RESUMEN DE ERRORES:');
      console.log(`   - Total errores: ${resumen.erroresTotales}`);
      console.log(`   - Errores 406: ${resumen.errores406.length}`);
      console.log(`   - Errores 403: ${resumen.errores403.length}`);
      console.log(`   - Errores 404: ${resumen.errores404.length}`);
      console.log(`   - Errores API: ${resumen.erroresAPI.length}`);
    }

    captor.detener();
  });

  test('TC-DASH-001: Debe cargar el dashboard sin errores', async ({ page }) => {
    // Navegar al dashboard
    await page.goto('/dashboard');

    // Verificar que la página carga
    await expect(page).toHaveTitle(/Escuchodromo|Dashboard/i);

    // Verificar header del dashboard
    await expect(page.getByRole('heading', { name: /¡Hola/i })).toBeVisible();

    // Verificar que no hay errores críticos
    const resumen = captor.obtenerResumen();
    expect(resumen.errores406.length).toBe(0);
    expect(resumen.errores403.length).toBe(0);
  });

  test('TC-DASH-002: Debe mostrar estadísticas del usuario', async ({ page }) => {
    await page.goto('/dashboard');

    // Verificar que las tarjetas de estadísticas están visibles
    await expect(page.getByText(/Evaluaciones/i)).toBeVisible();
    await expect(page.getByText(/Conversaciones/i)).toBeVisible();
    await expect(page.getByText(/Mi Plan/i)).toBeVisible();
    await expect(page.getByText(/Progreso/i)).toBeVisible();

    // Verificar que los números están presentes (pueden ser 0)
    const estadisticas = page.locator('.text-4xl.font-bold');
    await expect(estadisticas.first()).toBeVisible();
  });

  test('TC-DASH-003: Debe mostrar todos los accesos rápidos', async ({ page }) => {
    await page.goto('/dashboard');

    // Verificar accesos rápidos críticos
    const accesosCriticos = [
      'Chat con IA',
      'Hablar por Voz',
      'Evaluaciones',
      'Mis Citas',
      'Registro de Ánimo',
      'Recomendaciones',
      'Mi Perfil',
      'Mi Progreso',
      'Plan de Acción',
      'Mis Pagos',
      'Historial de Evaluaciones'
    ];

    for (const acceso of accesosCriticos) {
      await expect(page.getByText(acceso)).toBeVisible();
    }
  });

  test('TC-DASH-004: Debe navegar a página de chat sin errores', async ({ page }) => {
    await page.goto('/dashboard');

    // Click en acceso de Chat con IA
    await page.getByText('Chat con IA').click();

    // Verificar navegación
    await expect(page).toHaveURL(/\/chat/);

    // Verificar que la página carga
    await page.waitForLoadState('networkidle');

    // Verificar errores
    const resumen = captor.obtenerResumen();
    expect(resumen.errores406.length).toBe(0);
    expect(resumen.errores403.length).toBe(0);
  });

  test('TC-DASH-005: Debe navegar a página de evaluaciones sin errores', async ({ page }) => {
    await page.goto('/dashboard');

    // Click en acceso de Evaluaciones
    await page.getByText('Evaluaciones').first().click();

    // Verificar navegación
    await expect(page).toHaveURL(/\/evaluaciones/);

    // Verificar que la página carga
    await expect(page.getByText(/Evaluaciones Psicológicas/i)).toBeVisible();

    // Verificar errores
    const resumen = captor.obtenerResumen();
    expect(resumen.errores406.length).toBe(0);
    expect(resumen.errores403.length).toBe(0);
  });

  test('TC-DASH-006: Debe navegar a página de voz sin errores', async ({ page }) => {
    await page.goto('/dashboard');

    // Click en acceso de Voz
    await page.getByText('Hablar por Voz').click();

    // Verificar navegación
    await expect(page).toHaveURL(/\/voz/);

    // Verificar que la página carga
    await page.waitForLoadState('networkidle');

    // Verificar errores
    const resumen = captor.obtenerResumen();
    expect(resumen.errores406.length).toBe(0);
    expect(resumen.errores403.length).toBe(0);
  });

  test('TC-DASH-007: Debe navegar a Mi Perfil sin errores', async ({ page }) => {
    await page.goto('/dashboard');

    // Click en acceso de Mi Perfil
    await page.getByText('Mi Perfil').click();

    // Verificar navegación
    await expect(page).toHaveURL(/\/perfil/);

    // Verificar que la página carga
    await page.waitForLoadState('networkidle');

    // Verificar errores
    const resumen = captor.obtenerResumen();
    expect(resumen.errores406.length).toBe(0);
    expect(resumen.errores403.length).toBe(0);
  });

  test('TC-DASH-008: Debe navegar a Mis Citas sin errores', async ({ page }) => {
    await page.goto('/dashboard');

    // Click en acceso de Mis Citas
    await page.getByText('Mis Citas').click();

    // Verificar navegación
    await expect(page).toHaveURL(/\/mis-citas/);

    // Verificar que la página carga
    await page.waitForLoadState('networkidle');

    // Verificar errores
    const resumen = captor.obtenerResumen();
    expect(resumen.errores406.length).toBe(0);
    expect(resumen.errores403.length).toBe(0);
  });

  test('TC-DASH-009: Debe navegar a Plan de Acción sin errores', async ({ page }) => {
    await page.goto('/dashboard');

    // Click en acceso de Plan de Acción
    await page.getByText('Plan de Acción').click();

    // Verificar navegación
    await expect(page).toHaveURL(/\/plan-accion/);

    // Verificar que la página carga
    await page.waitForLoadState('networkidle');

    // Verificar errores
    const resumen = captor.obtenerResumen();
    expect(resumen.errores406.length).toBe(0);
    expect(resumen.errores403.length).toBe(0);
  });

  test('TC-DASH-010: Debe mostrar información de ayuda en crisis', async ({ page }) => {
    await page.goto('/dashboard');

    // Verificar sección de ayuda inmediata
    await expect(page.getByText(/¿Necesitas ayuda inmediata?/i)).toBeVisible();
    await expect(page.getByText(/Línea Nacional/i)).toBeVisible();
  });

  test('TC-DASH-011: No debe tener errores 406 en llamadas API', async ({ page }) => {
    await page.goto('/dashboard');

    // Esperar a que todas las llamadas API terminen
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Dar tiempo extra para llamadas asíncronas

    // Verificar que NO hay errores 406
    const resumen = captor.obtenerResumen();

    if (resumen.errores406.length > 0) {
      console.error('❌ ERRORES 406 DETECTADOS:');
      resumen.errores406.forEach((e, i) => {
        console.error(`   ${i + 1}. ${e.mensaje} - ${e.url}`);
      });
    }

    expect(resumen.errores406.length).toBe(0);
  });

  test('TC-DASH-012: No debe tener errores 403 en llamadas API', async ({ page }) => {
    await page.goto('/dashboard');

    // Esperar a que todas las llamadas API terminen
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verificar que NO hay errores 403
    const resumen = captor.obtenerResumen();

    if (resumen.errores403.length > 0) {
      console.error('❌ ERRORES 403 DETECTADOS:');
      resumen.errores403.forEach((e, i) => {
        console.error(`   ${i + 1}. ${e.mensaje} - ${e.url}`);
      });
    }

    expect(resumen.errores403.length).toBe(0);
  });

  test('TC-DASH-013: Navegación debe funcionar correctamente', async ({ page }) => {
    await page.goto('/dashboard');

    // Verificar que existe el componente de navegación
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // Verificar menú (puede estar en hamburguesa en móvil)
    // Buscar elementos de navegación comunes
    const hasNavItems = await page.locator('a[href="/dashboard"]').count() > 0 ||
                        await page.locator('[data-testid="navegacion"]').count() > 0 ||
                        await page.locator('.navigation').count() > 0;

    expect(hasNavItems).toBeTruthy();
  });
});
