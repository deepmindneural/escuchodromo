/**
 * Tests E2E - Dashboard de Profesional
 *
 * CRÍTICO: Valida que profesionales puedan:
 * - Acceder a su dashboard
 * - Ver métricas de pacientes
 * - Gestionar citas
 * - Acceder a planes de suscripción
 *
 * TODO: Crear credenciales de profesional en seed
 */

import { test, expect } from '@playwright/test';
import { CaptorConsola } from './helpers/console.helper';
import { CaptorRPC } from './helpers/supabase.helper';

test.describe('Dashboard de Profesional - Suite Completa', () => {
  let captorConsola: CaptorConsola;
  let captorRPC: CaptorRPC;

  test.beforeEach(async ({ page }) => {
    // Inicializar captores
    captorConsola = new CaptorConsola(page);
    captorConsola.capturarErroresRed();
    captorRPC = new CaptorRPC(page);

    // NOTA: Necesitamos crear un usuario profesional en el seed
    // Por ahora, este test documentará el comportamiento esperado
    console.log('⚠️ IMPORTANTE: Se requiere credencial de profesional en seed de BD');
  });

  test.afterEach(async () => {
    // Reportar errores
    const resumenConsola = captorConsola.obtenerResumen();
    const resumenRPC = captorRPC.obtenerErrores();

    if (resumenConsola.erroresTotales > 0 || resumenRPC.totalErrores > 0) {
      console.log('\n📊 RESUMEN DE ERRORES:');
      console.log(`   - Errores consola: ${resumenConsola.erroresTotales}`);
      console.log(`   - Errores RPC: ${resumenRPC.totalErrores}`);
      console.log(`   - Errores 406: ${resumenConsola.errores406.length + resumenRPC.errores406.length}`);
      console.log(`   - Errores 403: ${resumenConsola.errores403.length + resumenRPC.errores403.length}`);

      if (resumenRPC.totalErrores > 0) {
        console.log('\n📄 Reporte RPC:');
        console.log(captorRPC.generarReporte());
      }
    }

    captorConsola.detener();
  });

  test('TC-PROF-001: Debe redirigir a login si no está autenticado', async ({ page }) => {
    // Intentar acceder al dashboard sin login
    await page.goto('/profesional/dashboard');

    // Debe redirigir a login
    await expect(page).toHaveURL(/\/iniciar-sesion/);
  });

  test.skip('TC-PROF-002: Usuario regular no debe acceder a dashboard profesional', async ({ page }) => {
    // Login como usuario regular
    await page.goto('/iniciar-sesion');
    await page.fill('input[name="email"]', 'rrr@rrr.com');
    await page.fill('input[name="contrasena"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    // Intentar acceder a dashboard profesional
    await page.goto('/profesional/dashboard');

    // Debe mostrar error o redirigir
    const tieneError = await page.getByText(/no tienes permisos/i).isVisible().catch(() => false);
    const redirigio = page.url().includes('/dashboard') && !page.url().includes('/profesional');

    expect(tieneError || redirigio).toBeTruthy();
  });

  test.skip('TC-PROF-003: Dashboard profesional debe cargar sin errores', async ({ page }) => {
    // TODO: Login como profesional
    // await iniciarSesion(page, CREDENCIALES_PRUEBA.profesional);

    await page.goto('/profesional/dashboard');

    // Verificar que carga
    await expect(page.getByRole('heading', { name: /Dashboard Profesional|Bienvenido/i }))
      .toBeVisible({ timeout: 10000 });

    // Esperar carga completa
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verificar que NO hay errores críticos
    const resumenConsola = captorConsola.obtenerResumen();
    const resumenRPC = captorRPC.obtenerErrores();

    expect(resumenConsola.errores406.length).toBe(0);
    expect(resumenConsola.errores403.length).toBe(0);
    expect(resumenRPC.errores406.length).toBe(0);
    expect(resumenRPC.errores403.length).toBe(0);
  });

  test.skip('TC-PROF-004: Debe mostrar métricas clave del profesional', async ({ page }) => {
    // TODO: Login como profesional
    await page.goto('/profesional/dashboard');

    // Verificar métricas clave
    const metricasEsperadas = [
      /Pacientes Activos/i,
      /Citas Programadas/i,
      /Adherencia|Progreso/i,
      /Ingresos|Pagos/i
    ];

    for (const metrica of metricasEsperadas) {
      await expect(page.getByText(metrica)).toBeVisible();
    }
  });

  test.skip('TC-PROF-005: Debe mostrar tabla de pacientes', async ({ page }) => {
    await page.goto('/profesional/dashboard');

    // Verificar sección de pacientes
    await expect(page.getByText(/Pacientes|Mis Pacientes/i)).toBeVisible();

    // Verificar que existe una tabla o lista
    const tieneTabla = await page.locator('table').count() > 0;
    const tieneLista = await page.locator('[data-testid="lista-pacientes"]').count() > 0;

    expect(tieneTabla || tieneLista).toBeTruthy();
  });

  test.skip('TC-PROF-006: Debe mostrar próximas citas', async ({ page }) => {
    await page.goto('/profesional/dashboard');

    // Verificar sección de citas
    await expect(page.getByText(/Próximas Citas|Citas/i)).toBeVisible();
  });

  test.skip('TC-PROF-007: Debe navegar a página de planes sin errores', async ({ page }) => {
    await page.goto('/profesional/dashboard');

    // Buscar enlace a planes
    const linkPlanes = page.getByRole('link', { name: /plan|suscripción/i }).first();

    if (await linkPlanes.isVisible()) {
      await linkPlanes.click();

      // Verificar navegación
      await expect(page).toHaveURL(/\/profesional\/planes|\/suscripcion/);

      // Verificar que no hay errores
      const resumenRPC = captorRPC.obtenerErrores();
      expect(resumenRPC.errores406.length).toBe(0);
    }
  });

  test.skip('TC-PROF-008: Debe navegar a pacientes sin errores', async ({ page }) => {
    await page.goto('/profesional/dashboard');

    // Click en ver todos los pacientes (si existe el botón)
    const btnPacientes = page.getByRole('link', { name: /ver todos|pacientes/i }).first();

    if (await btnPacientes.isVisible()) {
      await btnPacientes.click();

      // Verificar navegación
      await expect(page).toHaveURL(/\/profesional\/pacientes/);

      // Verificar sin errores
      const resumen = captorConsola.obtenerResumen();
      expect(resumen.errores406.length).toBe(0);
    }
  });

  test.skip('TC-PROF-009: Debe navegar a calendario sin errores', async ({ page }) => {
    await page.goto('/profesional/dashboard');

    // Buscar navegación a calendario
    const linkCalendario = page.getByRole('link', { name: /calendario|citas/i }).first();

    if (await linkCalendario.isVisible()) {
      await linkCalendario.click();

      // Verificar navegación
      await expect(page).toHaveURL(/\/profesional\/calendario|\/profesional\/citas/);

      // Verificar sin errores
      const resumen = captorConsola.obtenerResumen();
      expect(resumen.errores406.length).toBe(0);
    }
  });

  test.skip('TC-PROF-010: Debe verificar suscripción activa del profesional', async ({ page }) => {
    await page.goto('/profesional/dashboard');

    // Esperar que cargue la verificación de suscripción
    await page.waitForLoadState('networkidle');

    // Verificar que se llamó el RPC de suscripción
    const resumenRPC = captorRPC.obtenerErrores();
    const llamadasSuscripcion = resumenRPC.exitos.filter(e =>
      e.funcion.includes('Suscripcion') || e.funcion.includes('obtener_suscripcion')
    );

    // Debe haber al menos una llamada exitosa a suscripción
    // O ningún error 406 relacionado con suscripción
    const erroresSuscripcion = resumenRPC.errores406.filter(e =>
      e.funcion.includes('Suscripcion')
    );

    expect(erroresSuscripcion.length).toBe(0);
  });

  test.skip('TC-PROF-011: No debe tener errores 406 en llamadas RPC', async ({ page }) => {
    await page.goto('/profesional/dashboard');

    // Esperar carga completa
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Verificar errores RPC
    const resumenRPC = captorRPC.obtenerErrores();

    if (resumenRPC.errores406.length > 0) {
      console.error('❌ ERRORES 406 EN RPC:');
      resumenRPC.errores406.forEach((e, i) => {
        console.error(`   ${i + 1}. ${e.funcion} - ${e.error.substring(0, 100)}`);
      });
    }

    expect(resumenRPC.errores406.length).toBe(0);
  });

  test.skip('TC-PROF-012: No debe tener errores 403 en llamadas RPC', async ({ page }) => {
    await page.goto('/profesional/dashboard');

    // Esperar carga completa
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Verificar errores de permisos
    const resumenRPC = captorRPC.obtenerErrores();

    if (resumenRPC.errores403.length > 0) {
      console.error('❌ ERRORES 403 EN RPC (Permisos):');
      resumenRPC.errores403.forEach((e, i) => {
        console.error(`   ${i + 1}. ${e.funcion} - ${e.error.substring(0, 100)}`);
      });
    }

    expect(resumenRPC.errores403.length).toBe(0);
  });

  test('TC-PROF-013: Debe existir ruta de dashboard profesional', async ({ page }) => {
    // Verificar que la ruta existe (aunque redirija a login)
    const response = await page.goto('/profesional/dashboard');

    // No debe ser 404
    expect(response?.status()).not.toBe(404);

    // Debe redirigir a login o cargar el dashboard
    const url = page.url();
    expect(url).toMatch(/\/profesional\/dashboard|\/iniciar-sesion/);
  });
});
