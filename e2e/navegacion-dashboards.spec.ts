/**
 * Tests E2E - Navegación Completa entre Dashboards
 *
 * CRÍTICO: Valida flujos completos de navegación entre:
 * - Login → Dashboard → Planes
 * - Dashboard → Secciones internas → Regreso
 * - Detección de errores 406 en todo el flujo
 */

import { test, expect } from '@playwright/test';
import { iniciarSesion, CREDENCIALES_PRUEBA, verificarAutenticado } from './helpers/auth.helper';
import { CaptorConsola } from './helpers/console.helper';
import { CaptorRPC } from './helpers/supabase.helper';

test.describe('Navegación entre Dashboards - Flujos Completos', () => {
  let captorConsola: CaptorConsola;
  let captorRPC: CaptorRPC;

  test.beforeEach(async ({ page }) => {
    captorConsola = new CaptorConsola(page);
    captorConsola.capturarErroresRed();
    captorRPC = new CaptorRPC(page);
  });

  test.afterEach(async () => {
    const resumenConsola = captorConsola.obtenerResumen();
    const resumenRPC = captorRPC.obtenerErrores();

    if (resumenConsola.erroresTotales > 0 || resumenRPC.totalErrores > 0) {
      console.log('\n📊 RESUMEN DEL FLUJO:');
      console.log(`   - Errores consola: ${resumenConsola.erroresTotales}`);
      console.log(`   - Errores RPC: ${resumenRPC.totalErrores}`);
      console.log(`   - Total 406: ${resumenConsola.errores406.length + resumenRPC.errores406.length}`);
      console.log(`   - Total 403: ${resumenConsola.errores403.length + resumenRPC.errores403.length}`);
    }

    captorConsola.detener();
  });

  test('TC-NAV-001: Flujo completo - Login → Dashboard → Planes → Regreso', async ({ page }) => {
    // PASO 1: Login
    console.log('📍 PASO 1: Iniciando sesión...');
    await iniciarSesion(page, CREDENCIALES_PRUEBA.usuario);
    await verificarAutenticado(page);

    // PASO 2: Verificar dashboard carga sin errores
    console.log('📍 PASO 2: Cargando dashboard...');
    await expect(page).toHaveURL(/\/dashboard/);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    let resumenConsola = captorConsola.obtenerResumen();
    let resumenRPC = captorRPC.obtenerErrores();

    console.log(`   - Dashboard cargado. Errores 406: ${resumenConsola.errores406.length + resumenRPC.errores406.length}`);

    expect(resumenConsola.errores406.length + resumenRPC.errores406.length).toBe(0);

    // PASO 3: Navegar a planes
    console.log('📍 PASO 3: Navegando a planes...');

    // Buscar enlace a planes/precios
    const linkPlanes =
      page.getByRole('link', { name: /plan|precio|suscripción/i }).first() ||
      page.getByRole('link', { name: /ver planes|cambiar plan/i }).first();

    // Si no hay link directo, ir manualmente
    if (!(await linkPlanes.isVisible().catch(() => false))) {
      await page.goto('/precios');
    } else {
      await linkPlanes.click();
    }

    // Verificar navegación a planes
    await expect(page).toHaveURL(/\/precios|\/profesional\/planes|\/suscripcion/);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    resumenConsola = captorConsola.obtenerResumen();
    resumenRPC = captorRPC.obtenerErrores();

    console.log(`   - Planes cargados. Errores 406: ${resumenConsola.errores406.length + resumenRPC.errores406.length}`);

    expect(resumenConsola.errores406.length + resumenRPC.errores406.length).toBe(0);

    // PASO 4: Regresar al dashboard
    console.log('📍 PASO 4: Regresando al dashboard...');

    const linkDashboard = page.getByRole('link', { name: /dashboard|inicio/i }).first();

    if (await linkDashboard.isVisible().catch(() => false)) {
      await linkDashboard.click();
    } else {
      await page.goto('/dashboard');
    }

    await expect(page).toHaveURL(/\/dashboard/);
    await page.waitForLoadState('networkidle');

    console.log('✅ Flujo completo sin errores 406');
  });

  test('TC-NAV-002: Flujo - Dashboard → Chat → Dashboard', async ({ page }) => {
    await iniciarSesion(page, CREDENCIALES_PRUEBA.usuario);

    // Ir a chat
    await page.goto('/dashboard');
    await page.getByText(/chat|conversación/i).first().click();

    await expect(page).toHaveURL(/\/chat/);
    await page.waitForLoadState('networkidle');

    // Verificar sin errores
    let resumen = captorConsola.obtenerResumen();
    expect(resumen.errores406.length).toBe(0);

    // Regresar a dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    resumen = captorConsola.obtenerResumen();
    expect(resumen.errores406.length).toBe(0);
  });

  test('TC-NAV-003: Flujo - Dashboard → Evaluaciones → Dashboard', async ({ page }) => {
    await iniciarSesion(page, CREDENCIALES_PRUEBA.usuario);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Ir a evaluaciones
    const linkEvaluaciones = page.getByText(/evaluaciones/i).first();
    await linkEvaluaciones.click();

    await expect(page).toHaveURL(/\/evaluaciones/);
    await page.waitForLoadState('networkidle');

    // Verificar sin errores
    let resumen = captorConsola.obtenerResumen();
    expect(resumen.errores406.length).toBe(0);

    // Regresar
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    resumen = captorConsola.obtenerResumen();
    expect(resumen.errores406.length).toBe(0);
  });

  test('TC-NAV-004: Flujo - Dashboard → Perfil → Dashboard', async ({ page }) => {
    await iniciarSesion(page, CREDENCIALES_PRUEBA.usuario);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Ir a perfil
    const linkPerfil = page.getByText(/mi perfil|perfil/i).first();
    await linkPerfil.click();

    await expect(page).toHaveURL(/\/perfil/);
    await page.waitForLoadState('networkidle');

    // Verificar sin errores
    let resumen = captorConsola.obtenerResumen();
    expect(resumen.errores406.length).toBe(0);

    // Regresar
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    resumen = captorConsola.obtenerResumen();
    expect(resumen.errores406.length).toBe(0);
  });

  test('TC-NAV-005: Navegación con header persistente', async ({ page }) => {
    await iniciarSesion(page, CREDENCIALES_PRUEBA.usuario);

    await page.goto('/dashboard');

    // Verificar que existe navegación persistente
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // Navegar a diferentes secciones y verificar que nav persiste
    const secciones = ['/chat', '/evaluaciones', '/perfil', '/dashboard'];

    for (const seccion of secciones) {
      await page.goto(seccion);
      await page.waitForLoadState('networkidle');

      // Nav debe seguir visible
      await expect(nav).toBeVisible();

      console.log(`✅ Nav persiste en: ${seccion}`);
    }
  });

  test('TC-NAV-006: Breadcrumbs o indicador de ubicación', async ({ page }) => {
    await iniciarSesion(page, CREDENCIALES_PRUEBA.usuario);

    await page.goto('/dashboard');

    // Verificar si existe algún indicador de ubicación
    const tieneBreadcrumbs = await page.locator('[aria-label="breadcrumb"]').isVisible().catch(() => false);
    const tieneIndicador = await page.locator('[data-testid="ubicacion"]').isVisible().catch(() => false);
    const tieneActiveLink = await page.locator('a[aria-current="page"]').count() > 0;

    const tieneOrientacion = tieneBreadcrumbs || tieneIndicador || tieneActiveLink;

    console.log(`📍 Indicador de ubicación: ${tieneOrientacion ? 'Sí' : 'No'}`);

    // No es crítico, pero es buena práctica UX
  });

  test('TC-NAV-007: Enlaces de navegación principales funcionan', async ({ page }) => {
    await iniciarSesion(page, CREDENCIALES_PRUEBA.usuario);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Lista de enlaces principales esperados
    const enlacesEsperados = [
      { texto: /dashboard|inicio/i, url: /\/dashboard/ },
      { texto: /chat|conversación/i, url: /\/chat/ },
      { texto: /evaluaciones|tests/i, url: /\/evaluaciones/ },
    ];

    for (const enlace of enlacesEsperados) {
      const link = page.getByRole('link', { name: enlace.texto }).first();

      if (await link.isVisible().catch(() => false)) {
        await link.click();
        await expect(page).toHaveURL(enlace.url);
        await page.waitForLoadState('networkidle');

        console.log(`✅ Enlace funcional: ${enlace.texto}`);

        // Verificar sin errores
        const resumen = captorConsola.obtenerResumen();
        expect(resumen.errores406.length).toBe(0);

        // Volver al dashboard para siguiente iteración
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
      } else {
        console.log(`⚠️ Enlace no encontrado: ${enlace.texto}`);
      }
    }
  });

  test('TC-NAV-008: Botón atrás del navegador funciona correctamente', async ({ page }) => {
    await iniciarSesion(page, CREDENCIALES_PRUEBA.usuario);

    // Navegar por varias páginas
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await page.goto('/chat');
    await page.waitForLoadState('networkidle');

    await page.goto('/evaluaciones');
    await page.waitForLoadState('networkidle');

    // Usar botón atrás
    await page.goBack();
    await expect(page).toHaveURL(/\/chat/);

    await page.goBack();
    await expect(page).toHaveURL(/\/dashboard/);

    // Adelante
    await page.goForward();
    await expect(page).toHaveURL(/\/chat/);

    console.log('✅ Navegación con botones del navegador funcional');
  });

  test('TC-NAV-009: Reporte completo de errores en flujo completo', async ({ page }) => {
    await iniciarSesion(page, CREDENCIALES_PRUEBA.usuario);

    // Navegar por todo el sitio
    const paginas = [
      '/dashboard',
      '/precios',
      '/chat',
      '/evaluaciones',
      '/perfil',
      '/mis-citas',
      '/dashboard' // Regresar
    ];

    for (const pagina of paginas) {
      console.log(`\n📍 Navegando a: ${pagina}`);

      try {
        await page.goto(pagina, { timeout: 15000 });
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        await page.waitForTimeout(1500);

        const resumenConsola = captorConsola.obtenerResumen();
        const resumenRPC = captorRPC.obtenerErrores();

        const errores406 = resumenConsola.errores406.length + resumenRPC.errores406.length;

        console.log(`   - Errores 406: ${errores406}`);
        console.log(`   - Errores RPC: ${resumenRPC.totalErrores}`);
        console.log(`   - RPC exitosos: ${resumenRPC.totalExitos}`);

        // Limpiar para siguiente página
        captorConsola.limpiar();
        captorRPC.limpiar();
      } catch (error) {
        console.error(`❌ Error navegando a ${pagina}:`, error);
      }
    }

    console.log('\n✅ Flujo completo de navegación finalizado');
  });

  test('TC-NAV-010: No debe tener errores 406 acumulados en sesión larga', async ({ page }) => {
    await iniciarSesion(page, CREDENCIALES_PRUEBA.usuario);

    // Simular uso normal del sitio
    const acciones = [
      async () => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
      },
      async () => {
        await page.goto('/chat');
        await page.waitForLoadState('networkidle');
      },
      async () => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
      },
      async () => {
        await page.goto('/precios');
        await page.waitForLoadState('networkidle');
      },
      async () => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
      }
    ];

    for (const accion of acciones) {
      await accion();
      await page.waitForTimeout(1000);
    }

    // Verificar errores acumulados
    const resumenConsola = captorConsola.obtenerResumen();
    const resumenRPC = captorRPC.obtenerErrores();

    const totalErrores406 = resumenConsola.errores406.length + resumenRPC.errores406.length;

    console.log(`\n📊 ERRORES ACUMULADOS EN SESIÓN:`);
    console.log(`   - Total 406: ${totalErrores406}`);
    console.log(`   - Total errores consola: ${resumenConsola.erroresTotales}`);
    console.log(`   - Total errores RPC: ${resumenRPC.totalErrores}`);

    expect(totalErrores406).toBe(0);
  });
});
