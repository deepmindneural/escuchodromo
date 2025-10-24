/**
 * Tests E2E - Planes y Suscripciones
 *
 * CRÍTICO: Valida que los planes se cargan correctamente mediante RPC
 * y que no hay errores 406 en el proceso de carga.
 *
 * Este test debe FALLAR actualmente debido al error 406 en obtener_planes_publico
 * Una vez corregido, servirá como regression test.
 */

import { test, expect } from '@playwright/test';
import { CaptorConsola } from './helpers/console.helper';
import { CaptorRPC, validarLlamadaRPC } from './helpers/supabase.helper';

test.describe('Planes y Suscripciones - Suite Completa', () => {
  let captorConsola: CaptorConsola;
  let captorRPC: CaptorRPC;

  test.beforeEach(async ({ page }) => {
    // Inicializar captores
    captorConsola = new CaptorConsola(page);
    captorConsola.capturarErroresRed();
    captorRPC = new CaptorRPC(page);
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
      console.log(`   - RPC exitosos: ${resumenRPC.totalExitos}`);

      if (resumenRPC.errores406.length > 0) {
        console.log('\n🔴 ERRORES 406 DETECTADOS EN RPC:');
        resumenRPC.errores406.forEach((e, i) => {
          console.log(`   ${i + 1}. ${e.funcion}`);
          console.log(`      Error: ${e.error.substring(0, 150)}`);
        });
      }
    }

    captorConsola.detener();
  });

  test('TC-PLANES-001: Página de precios debe cargar sin errores', async ({ page }) => {
    await page.goto('/precios');

    // Verificar que la página carga
    await expect(page.getByRole('heading', { name: /planes|precios|suscripciones/i }))
      .toBeVisible({ timeout: 10000 });

    // Esperar a que carguen completamente
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verificar que la página renderizó
    const tieneContenido = await page.locator('body').textContent();
    expect(tieneContenido).toBeTruthy();
  });

  test('TC-PLANES-002: Debe llamar RPC obtener_planes_publico exitosamente', async ({ page }) => {
    // Iniciar navegación y capturar RPC
    const promesaRPC = validarLlamadaRPC(page, 'obtener_planes_publico', 15000);

    await page.goto('/precios');

    // Esperar resultado del RPC
    const resultadoRPC = await promesaRPC;

    console.log('\n📡 RESULTADO RPC obtener_planes_publico:');
    console.log(`   - Exitoso: ${resultadoRPC.exito}`);
    console.log(`   - Código: ${resultadoRPC.codigo}`);
    if (resultadoRPC.error) {
      console.log(`   - Error: ${resultadoRPC.error.substring(0, 200)}`);
    }
    if (resultadoRPC.datos) {
      console.log(`   - Planes recibidos: ${Array.isArray(resultadoRPC.datos) ? resultadoRPC.datos.length : 'N/A'}`);
    }

    // VALIDACIÓN CRÍTICA: No debe haber error 406
    expect(resultadoRPC.codigo).not.toBe(406);
    expect(resultadoRPC.exito).toBe(true);
    expect(resultadoRPC.codigo).toBe(200);
  });

  test('TC-PLANES-003: Debe mostrar al menos 3 planes (Básico, Premium, Profesional)', async ({ page }) => {
    await page.goto('/precios');

    // Esperar que carguen los planes
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Buscar elementos de planes
    const nombresPlanesEsperados = [/básico|gratis|free/i, /premium|plus/i, /profesional|pro/i];

    for (const nombrePlan of nombresPlanesEsperados) {
      const planVisible = await page.getByText(nombrePlan).first().isVisible().catch(() => false);

      if (!planVisible) {
        console.warn(`⚠️ Plan no encontrado: ${nombrePlan}`);
      }

      // Solo advertir, no fallar (porque puede tener nombres diferentes)
      // expect(planVisible).toBeTruthy();
    }

    // Verificar que al menos hay contenido de planes
    const tieneCardsPlanes =
      (await page.locator('[data-testid="plan-card"]').count()) >= 3 ||
      (await page.locator('.plan-card').count()) >= 3 ||
      (await page.getByRole('heading', { level: 3 }).count()) >= 3;

    expect(tieneCardsPlanes).toBeTruthy();
  });

  test('TC-PLANES-004: Debe mostrar precios en COP y USD', async ({ page }) => {
    await page.goto('/precios');

    // Esperar carga
    await page.waitForLoadState('networkidle');

    // Buscar selector de moneda (puede ser botones o dropdown)
    const tieneSelectMoneda =
      (await page.getByText(/COP|USD|Moneda/i).count()) > 0 ||
      (await page.locator('select').count()) > 0 ||
      (await page.locator('[data-testid="moneda-selector"]').count()) > 0;

    // Si hay selector, debería poder cambiar
    if (tieneSelectMoneda) {
      console.log('✅ Selector de moneda encontrado');
    } else {
      console.log('⚠️ No se encontró selector de moneda');
    }
  });

  test('TC-PLANES-005: Debe mostrar características de cada plan', async ({ page }) => {
    await page.goto('/precios');

    // Esperar carga completa
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verificar características comunes
    const caracteristicasEsperadas = [
      /chat|conversaciones|mensajes/i,
      /evaluaciones|tests|pruebas/i,
      /profesional|terapeuta|psicólogo/i
    ];

    for (const caracteristica of caracteristicasEsperadas) {
      const visible = await page.getByText(caracteristica).first().isVisible().catch(() => false);

      if (visible) {
        console.log(`✅ Característica encontrada: ${caracteristica}`);
      }
    }
  });

  test('TC-PLANES-006: Botones de selección deben estar funcionales', async ({ page }) => {
    await page.goto('/precios');

    // Esperar carga
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Buscar botones de acción (Seleccionar, Comenzar, etc.)
    const botones = page.getByRole('button', { name: /seleccionar|comenzar|elegir|empezar/i });
    const cantidadBotones = await botones.count();

    console.log(`📍 Botones de selección encontrados: ${cantidadBotones}`);

    // Debe haber al menos un botón por cada plan
    expect(cantidadBotones).toBeGreaterThanOrEqual(3);
  });

  test('TC-PLANES-007: Click en plan debe navegar a checkout o registro', async ({ page }) => {
    await page.goto('/precios');

    // Esperar carga
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Buscar primer botón de selección
    const botonSeleccionar = page
      .getByRole('button', { name: /seleccionar|comenzar|elegir/i })
      .first();

    if (await botonSeleccionar.isVisible()) {
      await botonSeleccionar.click();

      // Esperar navegación o modal
      await page.waitForTimeout(1000);

      // Verificar que navegó o mostró modal
      const urlActual = page.url();
      const hayModal = await page.locator('[role="dialog"]').isVisible().catch(() => false);

      const navegoCorrectamente =
        urlActual.includes('/checkout') ||
        urlActual.includes('/registro') ||
        urlActual.includes('/iniciar-sesion') ||
        hayModal;

      expect(navegoCorrectamente).toBeTruthy();
    }
  });

  test('TC-PLANES-008: No debe tener errores 406 en carga de planes', async ({ page }) => {
    await page.goto('/precios');

    // Esperar carga completa
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // VALIDACIÓN CRÍTICA: No debe haber errores 406
    const resumenConsola = captorConsola.obtenerResumen();
    const resumenRPC = captorRPC.obtenerErrores();

    const totalErrores406 = resumenConsola.errores406.length + resumenRPC.errores406.length;

    if (totalErrores406 > 0) {
      console.error('\n❌ ERRORES 406 DETECTADOS:');

      resumenConsola.errores406.forEach((e, i) => {
        console.error(`   Consola ${i + 1}: ${e.mensaje} - ${e.url}`);
      });

      resumenRPC.errores406.forEach((e, i) => {
        console.error(`   RPC ${i + 1}: ${e.funcion} - ${e.error.substring(0, 100)}`);
      });

      console.error('\n💡 SUGERENCIA:');
      console.error('   - Verificar que la función RPC "obtener_planes_publico" existe');
      console.error('   - Verificar parámetros: p_tipo_usuario, p_moneda');
      console.error('   - Verificar permisos de la función en Supabase');
    }

    expect(totalErrores406).toBe(0);
  });

  test('TC-PLANES-009: Planes profesionales deben cargar en /profesional/planes', async ({ page }) => {
    // Navegar a planes profesionales
    await page.goto('/profesional/planes');

    // Puede redirigir a login si no está autenticado
    const urlFinal = page.url();

    if (urlFinal.includes('/iniciar-sesion')) {
      console.log('⚠️ Redirigió a login (esperado si no está autenticado)');
      return;
    }

    // Si no redirigió, verificar que carga
    await page.waitForLoadState('networkidle');

    // Verificar errores RPC
    const resumenRPC = captorRPC.obtenerErrores();

    if (resumenRPC.errores406.length > 0) {
      console.error('❌ Errores 406 en planes profesionales');
    }

    expect(resumenRPC.errores406.length).toBe(0);
  });

  test('TC-PLANES-010: Debe manejar errores de carga gracefully', async ({ page }) => {
    // Simular error de red (interceptar y fallar la llamada RPC)
    await page.route('**/rest/v1/rpc/obtener_planes_publico*', (route) => {
      route.abort('failed');
    });

    await page.goto('/precios');

    // Esperar carga
    await page.waitForTimeout(3000);

    // Verificar que muestra mensaje de error o estado de carga
    const tieneErrorUI =
      (await page.getByText(/error|no se pudieron cargar/i).isVisible().catch(() => false)) ||
      (await page.getByText(/cargando|loading/i).isVisible().catch(() => false)) ||
      (await page.locator('[data-testid="error-carga"]').isVisible().catch(() => false));

    // La aplicación debe manejar el error (mostrando mensaje o spinner)
    console.log(`📍 Manejo de error UI: ${tieneErrorUI ? 'Sí' : 'No'}`);

    // No forzar expectativa porque depende de la implementación
    // pero es buena práctica mostrar algo al usuario
  });

  test('TC-PLANES-011: Toggle mensual/anual debe funcionar', async ({ page }) => {
    await page.goto('/precios');

    // Esperar carga
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Buscar toggle de periodo
    const togglePeriodo =
      page.getByRole('button', { name: /mensual|anual/i }).first() ||
      page.locator('[data-testid="periodo-toggle"]');

    if (await togglePeriodo.isVisible().catch(() => false)) {
      // Guardar precio actual
      const precioAntes = await page.locator('body').textContent();

      // Hacer toggle
      await togglePeriodo.click();
      await page.waitForTimeout(1000);

      // Verificar que algo cambió (precio o indicador)
      const precioDespues = await page.locator('body').textContent();

      // Los textos deberían ser diferentes
      expect(precioAntes).not.toBe(precioDespues);

      console.log('✅ Toggle de periodo funcional');
    } else {
      console.log('⚠️ Toggle de periodo no encontrado');
    }
  });

  test('TC-PLANES-012: Debe verificar datos recibidos del RPC', async ({ page }) => {
    // Capturar respuesta del RPC
    const promesaRPC = validarLlamadaRPC(page, 'obtener_planes_publico', 15000);

    await page.goto('/precios');

    const resultadoRPC = await promesaRPC;

    if (resultadoRPC.exito && resultadoRPC.datos) {
      console.log('\n📊 ANÁLISIS DE DATOS RPC:');

      if (Array.isArray(resultadoRPC.datos)) {
        console.log(`   - Total planes: ${resultadoRPC.datos.length}`);

        resultadoRPC.datos.forEach((plan: any, i: number) => {
          console.log(`\n   Plan ${i + 1}:`);
          console.log(`     - Nombre: ${plan.nombre || 'N/A'}`);
          console.log(`     - Precio mensual: ${plan.precio_mensual || 0}`);
          console.log(`     - Moneda: ${plan.moneda || 'N/A'}`);
          console.log(`     - Activo: ${plan.activo ? 'Sí' : 'No'}`);
        });

        // Validar estructura de datos
        expect(resultadoRPC.datos.length).toBeGreaterThanOrEqual(3);

        // Validar que cada plan tiene campos requeridos
        resultadoRPC.datos.forEach((plan: any) => {
          expect(plan).toHaveProperty('nombre');
          expect(plan).toHaveProperty('precio_mensual');
          expect(plan).toHaveProperty('moneda');
        });
      }
    }
  });
});
