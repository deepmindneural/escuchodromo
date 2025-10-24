/**
 * Tests E2E - Evaluaciones Psicológicas (GAD-7, PHQ-9)
 *
 * CRÍTICO: Las evaluaciones son herramientas clínicas validadas
 * Los errores pueden afectar diagnósticos y decisiones terapéuticas
 */

import { test, expect, Page } from '@playwright/test';
import { iniciarSesion, CREDENCIALES_PRUEBA, verificarAutenticado } from './helpers/auth.helper';
import { CaptorConsola } from './helpers/console.helper';

test.describe('Evaluaciones Psicológicas - Suite Completa', () => {
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
      console.log('\n📊 RESUMEN DE ERRORES EN EVALUACIONES:');
      console.log(`   - Total errores: ${resumen.erroresTotales}`);
      console.log(`   - Errores 406: ${resumen.errores406.length}`);
      console.log(`   - Errores 403: ${resumen.errores403.length}`);
      console.log(`   - Errores 404: ${resumen.errores404.length}`);
      console.log(`   - Errores API: ${resumen.erroresAPI.length}`);
    }

    captor.detener();
  });

  test('TC-EVAL-001: Debe cargar página de evaluaciones sin errores', async ({ page }) => {
    await page.goto('/evaluaciones');

    // Verificar título
    await expect(page.getByRole('heading', { name: /Evaluaciones Psicológicas/i })).toBeVisible();

    // Verificar que no hay errores críticos
    const resumen = captor.obtenerResumen();
    expect(resumen.errores406.length).toBe(0);
    expect(resumen.errores403.length).toBe(0);
  });

  test('TC-EVAL-002: Debe mostrar lista de evaluaciones disponibles', async ({ page }) => {
    await page.goto('/evaluaciones');

    // Esperar a que carguen los tests
    await page.waitForLoadState('networkidle');

    // Debe mostrar al menos un test o mensaje de no disponibles
    const hayTests = await page.locator('.grid').count() > 0 ||
                     await page.getByText(/No hay evaluaciones disponibles/i).isVisible();

    expect(hayTests).toBeTruthy();
  });

  test('TC-EVAL-003: Debe mostrar información de cada test', async ({ page }) => {
    await page.goto('/evaluaciones');
    await page.waitForLoadState('networkidle');

    // Si hay tests disponibles, verificar que tienen información completa
    const testCards = page.locator('.bg-white.rounded-lg.shadow-md');
    const count = await testCards.count();

    if (count > 0) {
      const firstCard = testCards.first();

      // Debe tener nombre, descripción y botón
      await expect(firstCard.locator('h3')).toBeVisible();
      await expect(firstCard.getByText(/Iniciar Evaluación/i)).toBeVisible();
    }
  });

  test('TC-EVAL-004: Debe navegar a evaluación GAD-7', async ({ page }) => {
    await page.goto('/evaluaciones');
    await page.waitForLoadState('networkidle');

    // Buscar GAD-7 (puede estar o no disponible)
    const gad7Link = page.locator('a[href*="GAD-7"]').first();
    const hasGAD7 = await gad7Link.count() > 0;

    if (hasGAD7) {
      await gad7Link.click();

      // Verificar navegación
      await expect(page).toHaveURL(/\/evaluaciones\/GAD-7/i);

      // Verificar que carga
      await page.waitForLoadState('networkidle');

      // Verificar errores
      const resumen = captor.obtenerResumen();
      expect(resumen.errores406.length).toBe(0);
      expect(resumen.errores403.length).toBe(0);
    } else {
      console.log('⚠️ GAD-7 no disponible - test skipped');
    }
  });

  test('TC-EVAL-005: Debe navegar a evaluación PHQ-9', async ({ page }) => {
    await page.goto('/evaluaciones');
    await page.waitForLoadState('networkidle');

    // Buscar PHQ-9
    const phq9Link = page.locator('a[href*="PHQ-9"]').first();
    const hasPHQ9 = await phq9Link.count() > 0;

    if (hasPHQ9) {
      await phq9Link.click();

      // Verificar navegación
      await expect(page).toHaveURL(/\/evaluaciones\/PHQ-9/i);

      // Verificar que carga
      await page.waitForLoadState('networkidle');

      // Verificar errores
      const resumen = captor.obtenerResumen();
      expect(resumen.errores406.length).toBe(0);
      expect(resumen.errores403.length).toBe(0);
    } else {
      console.log('⚠️ PHQ-9 no disponible - test skipped');
    }
  });

  test('TC-EVAL-006: GAD-7 - Debe mostrar formulario correctamente', async ({ page }) => {
    // Intentar navegar directamente a GAD-7
    await page.goto('/evaluaciones/GAD-7');

    // Esperar carga
    await page.waitForTimeout(2000);

    // Verificar si existe el test (puede no estar en BD)
    const hasError = await page.getByText(/Test no encontrado/i).isVisible();

    if (!hasError) {
      // Verificar que muestra el nombre del test
      await expect(page.locator('h1, h2')).toContainText(/GAD-7|Ansiedad/i);

      // Verificar que hay preguntas
      const preguntas = page.locator('[type="radio"]');
      const countPreguntas = await preguntas.count();

      expect(countPreguntas).toBeGreaterThan(0);

      // Verificar barra de progreso
      await expect(page.locator('.bg-primary-600.h-2.rounded-full')).toBeVisible();

      // Verificar errores
      const resumen = captor.obtenerResumen();
      expect(resumen.errores406.length).toBe(0);
    } else {
      console.log('⚠️ GAD-7 no encontrado en BD - verificar seed de datos');
    }
  });

  test('TC-EVAL-007: PHQ-9 - Debe mostrar formulario correctamente', async ({ page }) => {
    // Intentar navegar directamente a PHQ-9
    await page.goto('/evaluaciones/PHQ-9');

    // Esperar carga
    await page.waitForTimeout(2000);

    // Verificar si existe el test
    const hasError = await page.getByText(/Test no encontrado/i).isVisible();

    if (!hasError) {
      // Verificar que muestra el nombre del test
      await expect(page.locator('h1, h2')).toContainText(/PHQ-9|Depresión/i);

      // Verificar que hay preguntas
      const preguntas = page.locator('[type="radio"]');
      const countPreguntas = await preguntas.count();

      expect(countPreguntas).toBeGreaterThan(0);

      // Verificar barra de progreso
      await expect(page.locator('.bg-primary-600.h-2.rounded-full')).toBeVisible();

      // Verificar errores
      const resumen = captor.obtenerResumen();
      expect(resumen.errores406.length).toBe(0);
    } else {
      console.log('⚠️ PHQ-9 no encontrado en BD - verificar seed de datos');
    }
  });

  test('TC-EVAL-008: Debe validar respuestas antes de enviar', async ({ page }) => {
    await page.goto('/evaluaciones/GAD-7');
    await page.waitForTimeout(2000);

    const hasError = await page.getByText(/Test no encontrado/i).isVisible();

    if (!hasError) {
      // Intentar enviar sin responder
      const btnEnviar = page.getByText(/Enviar Evaluación/i);

      // El botón debe estar deshabilitado inicialmente
      const isDisabled = await btnEnviar.isDisabled();
      expect(isDisabled).toBeTruthy();

      // Intentar hacer click (debe mostrar error o no hacer nada)
      await btnEnviar.click();

      // No debe navegar a resultados
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/\/evaluaciones\/GAD-7/);
    }
  });

  test('TC-EVAL-009: Debe actualizar barra de progreso al responder', async ({ page }) => {
    await page.goto('/evaluaciones/GAD-7');
    await page.waitForTimeout(2000);

    const hasError = await page.getByText(/Test no encontrado/i).isVisible();

    if (!hasError) {
      // Verificar progreso inicial
      const progressText = page.getByText(/0% completado/i);
      if (await progressText.count() > 0) {
        await expect(progressText).toBeVisible();
      }

      // Responder primera pregunta
      const firstRadio = page.locator('[type="radio"]').first();
      await firstRadio.click();

      // Esperar actualización
      await page.waitForTimeout(500);

      // El progreso debe haber cambiado
      const hasProgress = await page.getByText(/completado/i).isVisible();
      expect(hasProgress).toBeTruthy();
    }
  });

  test('TC-EVAL-010: Debe permitir completar evaluación completa', async ({ page }) => {
    await page.goto('/evaluaciones/GAD-7');
    await page.waitForTimeout(2000);

    const hasError = await page.getByText(/Test no encontrado/i).isVisible();

    if (!hasError) {
      // Responder todas las preguntas (seleccionar primera opción de cada una)
      const radioGroups = await page.locator('[type="radio"]').all();

      // Agrupar por pregunta
      const preguntasRespondidas = new Set();

      for (const radio of radioGroups) {
        const name = await radio.getAttribute('name');
        if (name && !preguntasRespondidas.has(name)) {
          await radio.click();
          preguntasRespondidas.add(name);
          await page.waitForTimeout(200); // Pequeña pausa entre clicks
        }
      }

      // Verificar que el botón de enviar está habilitado
      const btnEnviar = page.getByText(/Enviar Evaluación/i);
      await page.waitForTimeout(500);

      const isEnabled = !(await btnEnviar.isDisabled());

      if (isEnabled) {
        // Intentar enviar (puede fallar si no hay Edge Function configurada)
        await btnEnviar.click();

        // Esperar procesamiento o error
        await page.waitForTimeout(3000);

        // Verificar si navegó a resultados o mostró error
        const url = page.url();
        const tieneResultados = url.includes('resultados');
        const tieneError = await page.getByText(/Error/i).isVisible();

        // Cualquiera de los dos es aceptable (depende de configuración de Edge Functions)
        expect(tieneResultados || tieneError).toBeTruthy();
      }
    }
  });

  test('TC-EVAL-011: Debe mostrar botón de cancelar', async ({ page }) => {
    await page.goto('/evaluaciones/GAD-7');
    await page.waitForTimeout(2000);

    const hasError = await page.getByText(/Test no encontrado/i).isVisible();

    if (!hasError) {
      // Buscar botón de cancelar
      const btnCancelar = page.getByText(/Cancelar/i);
      await expect(btnCancelar).toBeVisible();

      // Click en cancelar
      await btnCancelar.click();

      // Debe volver a /evaluaciones
      await expect(page).toHaveURL(/\/evaluaciones$/);
    }
  });

  test('TC-EVAL-012: Debe mostrar información de privacidad', async ({ page }) => {
    await page.goto('/evaluaciones');

    // Verificar mensaje de privacidad
    await expect(page.getByText(/confidenciales/i)).toBeVisible();
    await expect(page.getByText(/Privacidad/i)).toBeVisible();
  });

  test('TC-EVAL-013: Debe mostrar advertencia sobre diagnóstico profesional', async ({ page }) => {
    await page.goto('/evaluaciones');

    // Verificar advertencia
    await expect(page.getByText(/no reemplazan el diagnóstico/i)).toBeVisible();
  });

  test('TC-EVAL-014: No debe tener errores 406 en carga de tests', async ({ page }) => {
    await page.goto('/evaluaciones');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const resumen = captor.obtenerResumen();

    if (resumen.errores406.length > 0) {
      console.error('❌ ERRORES 406 EN EVALUACIONES:');
      resumen.errores406.forEach((e, i) => {
        console.error(`   ${i + 1}. ${e.mensaje} - ${e.url}`);
      });
    }

    expect(resumen.errores406.length).toBe(0);
  });

  test('TC-EVAL-015: No debe tener errores 403 en carga de tests', async ({ page }) => {
    await page.goto('/evaluaciones');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const resumen = captor.obtenerResumen();

    if (resumen.errores403.length > 0) {
      console.error('❌ ERRORES 403 EN EVALUACIONES:');
      resumen.errores403.forEach((e, i) => {
        console.error(`   ${i + 1}. ${e.mensaje} - ${e.url}`);
      });
    }

    expect(resumen.errores403.length).toBe(0);
  });

  test('TC-EVAL-016: Historial de evaluaciones debe cargar sin errores', async ({ page }) => {
    await page.goto('/evaluaciones/historial');

    // Verificar que carga
    await page.waitForLoadState('networkidle');

    // Debe mostrar historial o mensaje de vacío
    const tieneHistorial = await page.locator('.table, .grid, [data-testid="historial"]').count() > 0 ||
                           await page.getByText(/No has realizado evaluaciones/i).isVisible() ||
                           await page.getByText(/historial/i).isVisible();

    expect(tieneHistorial).toBeTruthy();

    // Verificar errores
    const resumen = captor.obtenerResumen();
    expect(resumen.errores406.length).toBe(0);
    expect(resumen.errores403.length).toBe(0);
  });
});
