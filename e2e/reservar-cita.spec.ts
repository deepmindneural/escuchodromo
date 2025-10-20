/**
 * Test E2E: Flujo Completo de Búsqueda y Reserva de Cita
 *
 * Este es el flujo MÁS CRÍTICO para un usuario de la plataforma.
 * Simula el caso de uso de un paciente en crisis buscando ayuda profesional.
 *
 * Flujo:
 * 1. Login como paciente
 * 2. Buscar profesionales por especialidad "ansiedad"
 * 3. Filtrar por modalidad "virtual" y disponibilidad "inmediata"
 * 4. Ver perfil de profesional con rating alto
 * 5. Seleccionar fecha disponible (próximos días)
 * 6. Elegir horario disponible
 * 7. Completar motivo de consulta
 * 8. Confirmar reserva
 * 9. Ver mensaje de confirmación reconfortante
 *
 * Tiempo estimado: ~30 segundos
 */

import { test, expect } from '@playwright/test';

// ==========================================
// CONFIGURACIÓN
// ==========================================

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

// Credenciales de prueba
const USUARIO_TEST = {
  email: 'usuario@escuchodromo.com',
  password: '123456',
};

// ==========================================
// HELPERS
// ==========================================

/**
 * Helper: Login de usuario
 */
async function loginComoUsuario(page: any) {
  await page.goto('/login');

  // Llenar formulario de login
  await page.fill('input[name="email"]', USUARIO_TEST.email);
  await page.fill('input[name="password"]', USUARIO_TEST.password);

  // Click en "Iniciar sesión"
  await page.click('button[type="submit"]');

  // Esperar redirección a dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

// ==========================================
// SUITE DE TESTS E2E
// ==========================================

test.describe('Flujo de Búsqueda y Reserva de Cita', () => {
  test.beforeEach(async ({ page }) => {
    // Login antes de cada test
    await loginComoUsuario(page);
  });

  test('Flujo completo: Buscar, seleccionar y reservar cita con profesional', async ({ page }) => {
    // ==========================================
    // PASO 1: Navegar a búsqueda de profesionales
    // ==========================================
    await page.goto('/profesionales');
    await expect(page).toHaveTitle(/Profesionales/i);

    // Verificar que la página cargó correctamente
    await expect(page.locator('h1')).toContainText('Encuentra tu profesional');

    // ==========================================
    // PASO 2: Buscar por especialidad "ansiedad"
    // ==========================================
    const inputBusqueda = page.locator('input[placeholder*="Buscar"]');
    await inputBusqueda.fill('ansiedad');

    // Esperar a que se carguen resultados filtrados
    await page.waitForSelector('[data-testid="card-profesional"]', { timeout: 5000 });

    // Verificar que hay resultados
    const profesionales = page.locator('[data-testid="card-profesional"]');
    const count = await profesionales.count();
    expect(count).toBeGreaterThan(0);

    // ==========================================
    // PASO 3: Aplicar filtros
    // ==========================================

    // Filtrar por modalidad "virtual"
    await page.click('button:has-text("Modalidad")');
    await page.click('label:has-text("Virtual")');

    // Filtrar por disponibilidad "Solo disponibles"
    await page.click('label:has-text("Solo disponibles")');

    // Esperar actualización de resultados
    await page.waitForTimeout(1000);

    // ==========================================
    // PASO 4: Seleccionar primer profesional con buena calificación
    // ==========================================

    // Buscar profesional con rating >= 4.5
    const profesionalConBuenRating = page.locator('[data-testid="card-profesional"]').filter({
      has: page.locator('[aria-label*="Calificación"]', {
        hasText: /4\.[5-9]|5\.0/,
      }),
    }).first();

    // Obtener nombre del profesional para verificar después
    const nombreProfesional = await profesionalConBuenRating.locator('h3').textContent();

    // Click en "Ver perfil"
    await profesionalConBuenRating.locator('button:has-text("Ver perfil")').click();

    // Esperar carga de perfil
    await page.waitForURL(/\/profesionales\/[a-z0-9-]+$/);

    // ==========================================
    // PASO 5: Ver perfil y hacer click en "Reservar"
    // ==========================================

    // Verificar que estamos en perfil correcto
    await expect(page.locator('h1')).toContainText(nombreProfesional || '');

    // Verificar información del profesional
    await expect(page.locator('[data-testid="biografia"]')).toBeVisible();
    await expect(page.locator('[data-testid="especialidades"]')).toBeVisible();
    await expect(page.locator('[data-testid="experiencia"]')).toBeVisible();
    await expect(page.locator('[data-testid="tarifas"]')).toBeVisible();

    // Click en botón "Reservar cita"
    await page.click('button:has-text("Reservar cita")');

    // Esperar navegación a página de reserva
    await page.waitForURL(/\/profesionales\/[a-z0-9-]+\/reservar/);

    // ==========================================
    // PASO 6: Seleccionar fecha disponible
    // ==========================================

    // Esperar que el calendario cargue
    await page.waitForSelector('[role="grid"]', { timeout: 5000 });

    // Seleccionar primer día con disponibilidad (icono de check)
    const primerDiaDisponible = page.locator('[role="gridcell"]:has([data-testid="icono-disponibilidad"])').first();
    await primerDiaDisponible.click();

    // Verificar que el día se marcó como seleccionado
    await expect(primerDiaDisponible).toHaveAttribute('aria-pressed', 'true');

    // ==========================================
    // PASO 7: Seleccionar horario disponible
    // ==========================================

    // Esperar que los slots de horarios carguen
    await page.waitForSelector('[data-testid="slot-disponible"]', { timeout: 5000 });

    // Seleccionar primer slot disponible
    const primerSlot = page.locator('[data-testid="slot-disponible"]').first();
    const horarioSeleccionado = await primerSlot.textContent();
    await primerSlot.click();

    // ==========================================
    // PASO 8: Seleccionar duración
    // ==========================================

    // Seleccionar sesión de 60 minutos
    await page.click('label:has-text("60 minutos")');

    // ==========================================
    // PASO 9: Completar motivo de consulta
    // ==========================================

    const motivoConsulta = 'Estoy experimentando episodios de ansiedad severa y necesito ayuda profesional urgente.';
    await page.fill('textarea[name="motivo_consulta"]', motivoConsulta);

    // Verificar que el texto se ingresó correctamente
    await expect(page.locator('textarea[name="motivo_consulta"]')).toHaveValue(motivoConsulta);

    // ==========================================
    // PASO 10: Revisar resumen de reserva
    // ==========================================

    // Verificar resumen
    await expect(page.locator('[data-testid="resumen-profesional"]')).toContainText(nombreProfesional || '');
    await expect(page.locator('[data-testid="resumen-fecha"]')).toBeVisible();
    await expect(page.locator('[data-testid="resumen-horario"]')).toContainText(horarioSeleccionado || '');
    await expect(page.locator('[data-testid="resumen-duracion"]')).toContainText('60 minutos');
    await expect(page.locator('[data-testid="resumen-tarifa"]')).toBeVisible();

    // ==========================================
    // PASO 11: Confirmar reserva
    // ==========================================

    // Click en botón "Confirmar reserva"
    const botonConfirmar = page.locator('button:has-text("Confirmar reserva")');
    await expect(botonConfirmar).toBeEnabled();
    await botonConfirmar.click();

    // ==========================================
    // PASO 12: Verificar confirmación
    // ==========================================

    // Esperar mensaje de confirmación (puede ser modal o página nueva)
    await expect(page.locator('[data-testid="mensaje-confirmacion"]')).toBeVisible({ timeout: 10000 });

    // Verificar mensaje reconfortante
    const mensajeConfirmacion = page.locator('[data-testid="mensaje-confirmacion"]');
    await expect(mensajeConfirmacion).toContainText(/confirmada|exitosa/i);
    await expect(mensajeConfirmacion).toContainText(/no estás sol/i); // Mensaje empático

    // Verificar que se muestra información de la cita
    await expect(page.locator('[data-testid="cita-confirmada-fecha"]')).toBeVisible();
    await expect(page.locator('[data-testid="cita-confirmada-horario"]')).toBeVisible();
    await expect(page.locator('[data-testid="cita-confirmada-profesional"]')).toContainText(nombreProfesional || '');

    // Verificar botones de acción
    await expect(page.locator('button:has-text("Ver mis citas")')).toBeVisible();
    await expect(page.locator('button:has-text("Volver al inicio")')).toBeVisible();

    // ==========================================
    // PASO 13: Navegar a "Mis citas" y verificar
    // ==========================================

    await page.click('button:has-text("Ver mis citas")');
    await page.waitForURL('/mis-citas');

    // Verificar que la cita aparece en la lista
    const citaEnLista = page.locator('[data-testid="item-cita"]').first();
    await expect(citaEnLista).toContainText(nombreProfesional || '');
    await expect(citaEnLista).toContainText('Pendiente'); // Estado inicial

    console.log('✅ Test E2E completado exitosamente: Búsqueda y reserva de cita');
  });

  test('Debe manejar error cuando no hay disponibilidad', async ({ page }) => {
    await page.goto('/profesionales');

    // Seleccionar profesional sin disponibilidad
    const profesionalSinDispo = page.locator('[data-testid="card-profesional"]').filter({
      hasNot: page.locator('[data-testid="badge-disponible"]'),
    }).first();

    await profesionalSinDispo.click();

    // Intentar reservar
    await page.click('button:has-text("Reservar cita")');

    // Debe mostrar mensaje de error amigable
    await expect(page.locator('[role="alert"]')).toContainText(/no disponible|sin horarios/i);
  });

  test('Debe prevenir reserva en horarios ocupados', async ({ page }) => {
    await page.goto('/profesionales');

    // Flujo hasta selección de fecha
    const profesional = page.locator('[data-testid="card-profesional"]').first();
    await profesional.click();
    await page.click('button:has-text("Reservar cita")');

    // Seleccionar fecha con algunos horarios ocupados
    const diaConAlgunaDisponibilidad = page.locator('[role="gridcell"]').nth(5);
    await diaConAlgunaDisponibilidad.click();

    // Los slots ocupados deben estar deshabilitados
    const slotsOcupados = page.locator('[data-testid="slot-ocupado"]');
    const countOcupados = await slotsOcupados.count();

    if (countOcupados > 0) {
      // Verificar que están visualmente marcados como ocupados
      await expect(slotsOcupados.first()).toHaveClass(/opacity-50|cursor-not-allowed/);
      await expect(slotsOcupados.first()).toBeDisabled();
    }
  });

  test('Debe validar formulario antes de permitir reserva', async ({ page }) => {
    await page.goto('/profesionales');

    // Flujo hasta formulario de reserva
    const profesional = page.locator('[data-testid="card-profesional"]').first();
    await profesional.click();
    await page.click('button:has-text("Reservar cita")');

    // Seleccionar fecha y horario
    const diaDisponible = page.locator('[role="gridcell"]').nth(5);
    await diaDisponible.click();

    const slotDisponible = page.locator('[data-testid="slot-disponible"]').first();
    await slotDisponible.click();

    // Intentar confirmar sin llenar motivo de consulta
    const botonConfirmar = page.locator('button:has-text("Confirmar reserva")');

    // Debe estar deshabilitado o mostrar error al hacer click
    const isDisabled = await botonConfirmar.isDisabled();
    if (!isDisabled) {
      await botonConfirmar.click();
      // Debe mostrar mensaje de validación
      await expect(page.locator('[data-testid="error-motivo"]')).toContainText(/requerido|obligatorio/i);
    } else {
      expect(isDisabled).toBe(true);
    }
  });
});

// ==========================================
// TESTS DE ACCESIBILIDAD EN FLUJO
// ==========================================

test.describe('Accesibilidad en flujo de reserva', () => {
  test('Debe ser navegable completamente por teclado', async ({ page }) => {
    await loginComoUsuario(page);
    await page.goto('/profesionales');

    // Simular navegación por Tab
    await page.keyboard.press('Tab'); // Focus en búsqueda
    await page.keyboard.type('ansiedad');

    // Navegar a primer profesional y activar con Enter
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }
    await page.keyboard.press('Enter');

    // Debe navegar al perfil
    await page.waitForURL(/\/profesionales\/[a-z0-9-]+$/);

    console.log('✅ Navegación por teclado funciona correctamente');
  });

  test('Debe anunciar estados a screen readers', async ({ page }) => {
    await loginComoUsuario(page);
    await page.goto('/profesionales');

    // Verificar regiones ARIA
    await expect(page.locator('[role="region"]')).toBeVisible();
    await expect(page.locator('[aria-live="polite"]')).toBeVisible();

    // Verificar labels descriptivos
    const profesional = page.locator('[data-testid="card-profesional"]').first();
    const ariaLabel = await profesional.getAttribute('aria-label');
    expect(ariaLabel).toContain('Ver perfil de');
  });
});
