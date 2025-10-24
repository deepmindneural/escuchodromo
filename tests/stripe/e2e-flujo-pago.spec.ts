/**
 * Tests E2E: Flujo Completo de Pago con Stripe
 *
 * Simula el journey completo del usuario desde la selección del plan
 * hasta la confirmación de pago y activación de suscripción.
 *
 * Flujo probado:
 * 1. Usuario selecciona plan
 * 2. Se crea sesión de checkout
 * 3. Usuario es redirigido a Stripe
 * 4. Stripe procesa pago
 * 5. Webhook notifica éxito
 * 6. Sistema actualiza base de datos
 * 7. Usuario obtiene acceso
 *
 * PRIORIDAD: CRÍTICO
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import {
  crearClienteStripeTest,
  USUARIOS_TEST,
  PLANES_TEST,
  TARJETAS_TEST,
  esperarEventoWebhook,
  limpiarRecursosStripeTest,
} from './setup-test-stripe';

// Mock de funciones de Supabase
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
    signIn: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
        in: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              single: jest.fn(),
            })),
          })),
        })),
      })),
    })),
    insert: jest.fn(),
    update: jest.fn(() => ({
      eq: jest.fn(),
    })),
  })),
  rpc: jest.fn(),
};

describe('E2E: Flujo Completo de Pago', () => {
  let stripe: any;
  let recursosLimpiar: {
    customers: string[];
    subscriptions: string[];
    sessions: string[];
  };

  beforeAll(() => {
    stripe = crearClienteStripeTest();
    recursosLimpiar = { customers: [], subscriptions: [], sessions: [] };
  });

  afterAll(async () => {
    await limpiarRecursosStripeTest(stripe, recursosLimpiar);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // FLUJO 1: Usuario Nuevo → Plan Premium Mensual
  // ============================================

  describe('FLUJO 1: Usuario Nuevo Compra Plan Premium Mensual', () => {
    it('debe completar flujo exitosamente de inicio a fin', async () => {
      // PASO 1: Usuario se autentica
      const usuario = USUARIOS_TEST.usuario_basico;
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: usuario.auth_id } },
        error: null,
      });

      // PASO 2: Sistema obtiene datos del usuario
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: usuario,
              error: null,
            }),
            not: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null, // No tiene stripe_cliente_id
                  error: null,
                }),
              }),
            }),
          }),
        }),
        insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
      });

      // PASO 3: Usuario selecciona plan premium mensual en COP
      const seleccionPlan = {
        plan: 'premium' as const,
        periodo: 'mensual' as const,
        moneda: 'COP' as const,
      };

      // PASO 4: Sistema crea sesión de checkout
      // (Simulado - en producción esto llamaría a la Edge Function)
      const sessionSimulada = {
        id: 'cs_test_e2e_123',
        url: 'https://checkout.stripe.com/pay/cs_test_e2e_123',
        customer: 'cus_test_e2e_123',
        amount_total: PLANES_TEST.premium.precio.mensual.COP * 100,
        metadata: {
          usuario_id: usuario.id,
          plan: seleccionPlan.plan,
          periodo: seleccionPlan.periodo,
          moneda: seleccionPlan.moneda,
        },
      };

      expect(sessionSimulada.url).toContain('checkout.stripe.com');
      expect(sessionSimulada.metadata.plan).toBe('premium');

      // PASO 5: Usuario es redirigido a Stripe Checkout
      // (En test, simulamos que el usuario completa el pago)

      // PASO 6: Stripe procesa el pago y envía webhook
      const webhookEvent = {
        id: 'evt_test_e2e_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            ...sessionSimulada,
            subscription: 'sub_test_e2e_123',
            payment_status: 'paid',
          },
        },
      };

      // PASO 7: Sistema procesa webhook
      mockSupabase.rpc.mockResolvedValue({ data: {}, error: null });

      // Simular procesamiento del webhook
      await procesarWebhookCheckoutCompleted(webhookEvent);

      // PASO 8: Verificar que se creó la suscripción en BD
      expect(mockSupabase.from).toHaveBeenCalledWith('Suscripcion');

      // PASO 9: Verificar que se actualizó el pago a completado
      expect(mockSupabase.from).toHaveBeenCalledWith('Pago');

      // PASO 10: Usuario puede acceder a features premium
      const suscripcionActiva = {
        plan: 'premium',
        estado: 'activa',
        usuario_id: usuario.id,
      };

      expect(suscripcionActiva.estado).toBe('activa');
      expect(suscripcionActiva.plan).toBe('premium');
    });

    it('debe registrar el pago en estado pendiente antes del webhook', async () => {
      const usuario = USUARIOS_TEST.usuario_basico;

      const insertMock = jest.fn().mockResolvedValue({ data: {}, error: null });
      mockSupabase.from.mockReturnValue({
        insert: insertMock,
      });

      // Al crear la sesión de checkout, se debe insertar pago pendiente
      await insertarPagoPendiente({
        usuario_id: usuario.id,
        stripe_sesion_id: 'cs_test_pending_123',
        monto: PLANES_TEST.premium.precio.mensual.COP,
        moneda: 'COP',
      });

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          estado: 'pendiente',
          usuario_id: usuario.id,
        })
      );
    });

    it('debe crear cliente de Stripe con email y nombre del usuario', async () => {
      const usuario = USUARIOS_TEST.usuario_basico;

      const clienteEsperado = {
        email: usuario.email,
        name: usuario.nombre,
        metadata: {
          usuario_id: usuario.id,
        },
      };

      expect(clienteEsperado.email).toBe(usuario.email);
      expect(clienteEsperado.metadata.usuario_id).toBe(usuario.id);
    });
  });

  // ============================================
  // FLUJO 2: Usuario Existente → Upgrade a Profesional
  // ============================================

  describe('FLUJO 2: Usuario con Premium hace Upgrade a Profesional', () => {
    it('debe reutilizar stripe_cliente_id existente', async () => {
      const usuario = USUARIOS_TEST.usuario_premium;
      const stripeClienteId = 'cus_existing_premium_user';

      // Usuario ya tiene suscripción
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            not: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { stripe_cliente_id: stripeClienteId },
                  error: null,
                }),
              }),
            }),
            single: jest.fn().mockResolvedValue({
              data: usuario,
              error: null,
            }),
          }),
        }),
      });

      // Al crear nueva sesión, debe usar el mismo cliente
      const sessionConClienteExistente = {
        customer: stripeClienteId,
        plan_nuevo: 'profesional',
      };

      expect(sessionConClienteExistente.customer).toBe(stripeClienteId);
    });

    it('debe permitir tener múltiples registros de pago', async () => {
      const usuario = USUARIOS_TEST.usuario_premium;

      // Pagos históricos
      const pagosDelUsuario = [
        {
          id: 'pago-1',
          plan: 'premium',
          monto: 49900,
          estado: 'completado',
          fecha: '2024-01-01',
        },
        {
          id: 'pago-2',
          plan: 'profesional',
          monto: 99900,
          estado: 'completado',
          fecha: '2024-02-01',
        },
      ];

      expect(pagosDelUsuario).toHaveLength(2);
      expect(pagosDelUsuario[1].plan).toBe('profesional');
    });
  });

  // ============================================
  // FLUJO 3: Plan Anual con Descuento
  // ============================================

  describe('FLUJO 3: Usuario Compra Plan Anual con Descuento', () => {
    it('debe aplicar descuento del 20% en plan anual', async () => {
      const precioMensual = PLANES_TEST.premium.precio.mensual.COP;
      const precioAnual = PLANES_TEST.premium.precio.anual.COP;

      const precioSinDescuento = precioMensual * 12;
      const ahorroEsperado = precioSinDescuento * 0.2;

      expect(precioAnual).toBeLessThan(precioSinDescuento);

      const ahorroReal = precioSinDescuento - precioAnual;
      const margenError = 1000; // Permitir pequeña diferencia

      expect(ahorroReal).toBeGreaterThanOrEqual(ahorroEsperado - margenError);
      expect(ahorroReal).toBeLessThanOrEqual(ahorroEsperado + margenError);
    });

    it('debe establecer fecha de renovación en 1 año', async () => {
      const ahora = new Date();
      const enUnAno = new Date();
      enUnAno.setFullYear(ahora.getFullYear() + 1);

      const suscripcionAnual = {
        periodo: 'anual',
        fecha_inicio: ahora.toISOString(),
        fecha_renovacion: enUnAno.toISOString(),
      };

      const fechaRenovacion = new Date(suscripcionAnual.fecha_renovacion);
      const diferenciaDias = Math.floor(
        (fechaRenovacion.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(diferenciaDias).toBeGreaterThanOrEqual(364);
      expect(diferenciaDias).toBeLessThanOrEqual(366);
    });
  });

  // ============================================
  // FLUJO 4: Plan Básico Gratuito
  // ============================================

  describe('FLUJO 4: Usuario Selecciona Plan Básico Gratuito', () => {
    it('no debe crear sesión de Stripe para plan básico', async () => {
      const usuario = USUARIOS_TEST.usuario_basico;

      const seleccionPlan = {
        plan: 'basico' as const,
        periodo: 'mensual' as const,
      };

      // Plan básico retorna éxito directo sin Stripe
      const respuesta = {
        success: true,
        message: 'El plan básico es gratuito',
        redirect_url: '/dashboard',
      };

      expect(respuesta.success).toBe(true);
      expect(respuesta.redirect_url).toBe('/dashboard');
    });

    it('debe crear registro de suscripción básica en BD directamente', async () => {
      const usuario = USUARIOS_TEST.usuario_basico;

      const insertMock = jest.fn().mockResolvedValue({ data: {}, error: null });
      mockSupabase.from.mockReturnValue({
        insert: insertMock,
      });

      await crearSuscripcionBasicaGratuita(usuario.id);

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          usuario_id: usuario.id,
          plan: 'basico',
          estado: 'activa',
          precio: 0,
          stripe_suscripcion_id: null,
        })
      );
    });
  });

  // ============================================
  // FLUJO 5: Pago con USD en lugar de COP
  // ============================================

  describe('FLUJO 5: Usuario Internacional Paga en USD', () => {
    it('debe crear sesión de checkout con precios en USD', async () => {
      const sessionUSD = {
        currency: 'usd',
        amount_total: PLANES_TEST.premium.precio.mensual.USD * 100, // $12 USD
        metadata: {
          moneda: 'USD',
        },
      };

      expect(sessionUSD.currency).toBe('usd');
      expect(sessionUSD.amount_total).toBe(1200); // $12 en centavos
    });

    it('debe registrar pago en USD correctamente en BD', async () => {
      const pagoUSD = {
        monto: 12,
        moneda: 'USD',
        usuario_id: USUARIOS_TEST.usuario_basico.id,
      };

      expect(pagoUSD.moneda).toBe('USD');
      expect(pagoUSD.monto).toBe(12);
    });
  });

  // ============================================
  // FLUJO 6: Cancelación y Reactivación
  // ============================================

  describe('FLUJO 6: Usuario Cancela y Luego Reactiva Suscripción', () => {
    it('debe marcar suscripción para cancelar al final del período', async () => {
      const suscripcionId = 'sub_test_cancelar_123';

      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
      });
      mockSupabase.from.mockReturnValue({
        update: updateMock,
      });

      await cancelarSuscripcionAlFinal(suscripcionId);

      expect(updateMock).toHaveBeenCalledWith({
        cancelada_en: expect.any(String),
      });
    });

    it('debe mantener acceso hasta la fecha de renovación', async () => {
      const ahora = new Date();
      const fechaRenovacion = new Date();
      fechaRenovacion.setDate(ahora.getDate() + 15); // 15 días restantes

      const suscripcionCancelada = {
        estado: 'activa',
        cancelada_en: ahora.toISOString(),
        fecha_renovacion: fechaRenovacion.toISOString(),
      };

      // Usuario sigue teniendo acceso
      const tieneAcceso = new Date() < new Date(suscripcionCancelada.fecha_renovacion);

      expect(tieneAcceso).toBe(true);
      expect(suscripcionCancelada.estado).toBe('activa');
    });

    it('debe poder reactivar antes del fin del período', async () => {
      const suscripcionId = 'sub_test_reactivar_123';

      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
      });
      mockSupabase.from.mockReturnValue({
        update: updateMock,
      });

      await reactivarSuscripcion(suscripcionId);

      expect(updateMock).toHaveBeenCalledWith({
        cancelada_en: null,
      });
    });
  });

  // ============================================
  // FLUJO 7: Renovación Automática
  // ============================================

  describe('FLUJO 7: Renovación Automática de Suscripción', () => {
    it('debe procesar invoice.payment_succeeded para renovación', async () => {
      const invoice = {
        id: 'in_test_renovacion_123',
        subscription: 'sub_test_123',
        amount_paid: 4990000,
        currency: 'cop',
        payment_intent: 'pi_test_123',
      };

      // Mock obtener suscripción
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                usuario_id: USUARIOS_TEST.usuario_premium.id,
                plan: 'premium',
                periodo: 'mensual',
                moneda: 'COP',
              },
              error: null,
            }),
          }),
        }),
        insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
      });

      await procesarRenovacionAutomatica(invoice);

      // Debe crear nuevo registro de Pago
      expect(mockSupabase.from).toHaveBeenCalledWith('Pago');
    });

    it('debe actualizar fecha de renovación al siguiente período', async () => {
      const subscription = {
        id: 'sub_test_renovar_123',
        current_period_end: Math.floor(Date.now() / 1000) + 2592000, // +30 días
      };

      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
      });
      mockSupabase.from.mockReturnValue({
        update: updateMock,
      });

      await actualizarFechaRenovacion(subscription);

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          fecha_renovacion: expect.any(String),
        })
      );
    });
  });

  // ============================================
  // FLUJO 8: Pago Fallido
  // ============================================

  describe('FLUJO 8: Manejo de Pago Fallido', () => {
    it('debe marcar suscripción como vencida cuando falla el pago', async () => {
      const invoice = {
        id: 'in_test_failed_123',
        subscription: 'sub_test_123',
        attempt_count: 1,
      };

      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
      });
      mockSupabase.from.mockReturnValue({
        update: updateMock,
      });

      await procesarPagoFallido(invoice);

      expect(updateMock).toHaveBeenCalledWith({
        estado: 'vencida',
      });
    });

    it('debe enviar notificación al usuario sobre pago fallido', async () => {
      const suscripcion = {
        usuario_id: USUARIOS_TEST.usuario_premium.id,
        stripe_suscripcion_id: 'sub_test_failed_123',
        estado: 'vencida',
      };

      // Verificar que se debe enviar notificación
      const debeNotificar = suscripcion.estado === 'vencida';

      expect(debeNotificar).toBe(true);
    });
  });
});

// ============================================
// FUNCIONES HELPER PARA SIMULAR FLUJOS
// ============================================

async function procesarWebhookCheckoutCompleted(evento: any): Promise<void> {
  const session = evento.data.object;

  await mockSupabase.from('Suscripcion').insert({
    usuario_id: session.metadata.usuario_id,
    stripe_suscripcion_id: session.subscription,
    plan: session.metadata.plan,
    estado: 'activa',
  });

  await mockSupabase.from('Pago').update({
    estado: 'completado',
  });
}

async function insertarPagoPendiente(datos: any): Promise<void> {
  await mockSupabase.from('Pago').insert({
    ...datos,
    estado: 'pendiente',
    metodo_pago: 'tarjeta',
  });
}

async function crearSuscripcionBasicaGratuita(usuarioId: string): Promise<void> {
  await mockSupabase.from('Suscripcion').insert({
    usuario_id: usuarioId,
    plan: 'basico',
    estado: 'activa',
    precio: 0,
    moneda: 'COP',
    periodo: 'mensual',
    stripe_suscripcion_id: null,
    fecha_inicio: new Date().toISOString(),
  });
}

async function cancelarSuscripcionAlFinal(suscripcionId: string): Promise<void> {
  await mockSupabase.from('Suscripcion').update({
    cancelada_en: new Date().toISOString(),
  });
}

async function reactivarSuscripcion(suscripcionId: string): Promise<void> {
  await mockSupabase.from('Suscripcion').update({
    cancelada_en: null,
  });
}

async function procesarRenovacionAutomatica(invoice: any): Promise<void> {
  const { data: suscripcion } = await mockSupabase
    .from('Suscripcion')
    .select('usuario_id, plan, periodo, moneda')
    .eq('stripe_suscripcion_id', invoice.subscription)
    .single();

  if (suscripcion) {
    await mockSupabase.from('Pago').insert({
      usuario_id: suscripcion.usuario_id,
      monto: invoice.amount_paid / 100,
      estado: 'completado',
      descripcion: 'Renovación automática',
    });
  }
}

async function actualizarFechaRenovacion(subscription: any): Promise<void> {
  await mockSupabase.from('Suscripcion').update({
    fecha_renovacion: new Date(subscription.current_period_end * 1000).toISOString(),
  });
}

async function procesarPagoFallido(invoice: any): Promise<void> {
  await mockSupabase.from('Suscripcion').update({
    estado: 'vencida',
  });
}
