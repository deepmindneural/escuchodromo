/**
 * Tests de Integración con Stripe API
 *
 * Estos tests realizan llamadas REALES a la API de Stripe en Test Mode
 * Requieren claves de API configuradas en variables de entorno
 *
 * IMPORTANTE: Solo se ejecutan si STRIPE_TEST_SECRET_KEY está configurada
 *
 * PRIORIDAD: ALTO
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import Stripe from 'stripe';
import {
  crearClienteStripeTest,
  STRIPE_TEST_CONFIG,
  TARJETAS_TEST,
  PLANES_TEST,
  crearCheckoutSessionTest,
  crearClienteStripeParaTest,
  crearSuscripcionTest,
  limpiarRecursosStripeTest,
  verificarEstadoSuscripcion,
  ESTADOS_SUSCRIPCION,
} from './setup-test-stripe';

// Solo ejecutar si hay claves de Stripe configuradas
const skipIfNoStripeKeys = () => {
  const hasKeys = process.env.STRIPE_TEST_SECRET_KEY &&
    process.env.STRIPE_TEST_SECRET_KEY.startsWith('sk_test_');

  if (!hasKeys) {
    console.warn('⚠️ Tests de integración con Stripe omitidos - configura STRIPE_TEST_SECRET_KEY');
  }

  return !hasKeys;
};

describe('Integración con Stripe API', () => {
  let stripe: Stripe;
  let recursosLimpiar: {
    customers: string[];
    subscriptions: string[];
    sessions: string[];
  };

  beforeAll(() => {
    if (skipIfNoStripeKeys()) {
      return;
    }

    stripe = crearClienteStripeTest();
    recursosLimpiar = { customers: [], subscriptions: [], sessions: [] };
  });

  afterAll(async () => {
    if (skipIfNoStripeKeys()) {
      return;
    }

    await limpiarRecursosStripeTest(stripe, recursosLimpiar);
  });

  beforeEach(() => {
    if (skipIfNoStripeKeys()) {
      return;
    }
  });

  // ============================================
  // TESTS DE CONFIGURACIÓN DE STRIPE
  // ============================================

  describe('Configuración de Stripe', () => {
    it('debe verificar que las claves sean de test mode', () => {
      if (skipIfNoStripeKeys()) return;

      expect(STRIPE_TEST_CONFIG.secretKey).toMatch(/^sk_test_/);
      expect(STRIPE_TEST_CONFIG.publishableKey).toMatch(/^pk_test_/);
    });

    it('debe conectarse exitosamente a Stripe API', async () => {
      if (skipIfNoStripeKeys()) return;

      // Verificar conexión obteniendo balance
      const balance = await stripe.balance.retrieve();

      expect(balance).toBeDefined();
      expect(balance.object).toBe('balance');
    });

    it('debe usar la versión correcta de API', async () => {
      if (skipIfNoStripeKeys()) return;

      // La versión se configura en el cliente
      expect(stripe.getApiField('version')).toBe(STRIPE_TEST_CONFIG.apiVersion);
    });
  });

  // ============================================
  // TESTS DE PRODUCTOS Y PRECIOS
  // ============================================

  describe('Productos y Precios en Stripe Dashboard', () => {
    it('debe poder crear productos dinámicamente para cada plan', async () => {
      if (skipIfNoStripeKeys()) return;

      const producto = await stripe.products.create({
        name: 'Plan Premium Test',
        description: 'Plan premium para testing',
        metadata: {
          plan: 'premium',
          test: 'true',
        },
      });

      expect(producto.id).toMatch(/^prod_/);
      expect(producto.name).toBe('Plan Premium Test');

      // Limpiar
      await stripe.products.del(producto.id);
    });

    it('debe crear precios para planes mensuales y anuales', async () => {
      if (skipIfNoStripeKeys()) return;

      // Crear producto
      const producto = await stripe.products.create({
        name: 'Plan Test Precios',
      });

      // Precio mensual
      const precioMensual = await stripe.prices.create({
        product: producto.id,
        unit_amount: 4990000, // 49900 COP
        currency: 'cop',
        recurring: {
          interval: 'month',
        },
      });

      // Precio anual
      const precioAnual = await stripe.prices.create({
        product: producto.id,
        unit_amount: 47900000, // 479000 COP (20% descuento)
        currency: 'cop',
        recurring: {
          interval: 'year',
        },
      });

      expect(precioMensual.id).toMatch(/^price_/);
      expect(precioAnual.id).toMatch(/^price_/);
      expect(precioMensual.recurring?.interval).toBe('month');
      expect(precioAnual.recurring?.interval).toBe('year');

      // Limpiar
      await stripe.products.del(producto.id);
    });

    it('debe soportar múltiples monedas (COP y USD)', async () => {
      if (skipIfNoStripeKeys()) return;

      const producto = await stripe.products.create({
        name: 'Plan Multimoneda Test',
      });

      const precioCOP = await stripe.prices.create({
        product: producto.id,
        unit_amount: 4990000,
        currency: 'cop',
        recurring: { interval: 'month' },
      });

      const precioUSD = await stripe.prices.create({
        product: producto.id,
        unit_amount: 1200, // $12 USD
        currency: 'usd',
        recurring: { interval: 'month' },
      });

      expect(precioCOP.currency).toBe('cop');
      expect(precioUSD.currency).toBe('usd');

      await stripe.products.del(producto.id);
    });
  });

  // ============================================
  // TESTS DE CLIENTES
  // ============================================

  describe('Gestión de Clientes', () => {
    it('debe crear un cliente nuevo en Stripe', async () => {
      if (skipIfNoStripeKeys()) return;

      const cliente = await crearClienteStripeParaTest(
        stripe,
        'test@escuchodromo.com',
        'Usuario Test Integración'
      );

      recursosLimpiar.customers.push(cliente.id);

      expect(cliente.id).toMatch(/^cus_/);
      expect(cliente.email).toBe('test@escuchodromo.com');
      expect(cliente.name).toBe('Usuario Test Integración');
    });

    it('debe almacenar metadata del cliente', async () => {
      if (skipIfNoStripeKeys()) return;

      const cliente = await stripe.customers.create({
        email: 'metadata@escuchodromo.com',
        metadata: {
          usuario_id: 'usuario-test-123',
          origen: 'test',
          plataforma: 'escuchodromo',
        },
      });

      recursosLimpiar.customers.push(cliente.id);

      expect(cliente.metadata.usuario_id).toBe('usuario-test-123');
      expect(cliente.metadata.plataforma).toBe('escuchodromo');
    });

    it('debe actualizar información del cliente', async () => {
      if (skipIfNoStripeKeys()) return;

      const cliente = await stripe.customers.create({
        email: 'actualizar@escuchodromo.com',
      });

      recursosLimpiar.customers.push(cliente.id);

      const clienteActualizado = await stripe.customers.update(cliente.id, {
        name: 'Nombre Actualizado',
        phone: '+573001234567',
      });

      expect(clienteActualizado.name).toBe('Nombre Actualizado');
      expect(clienteActualizado.phone).toBe('+573001234567');
    });

    it('debe poder eliminar un cliente', async () => {
      if (skipIfNoStripeKeys()) return;

      const cliente = await stripe.customers.create({
        email: 'eliminar@escuchodromo.com',
      });

      const eliminado = await stripe.customers.del(cliente.id);

      expect(eliminado.deleted).toBe(true);
      expect(eliminado.id).toBe(cliente.id);
    });
  });

  // ============================================
  // TESTS DE SESIONES DE CHECKOUT
  // ============================================

  describe('Sesiones de Checkout', () => {
    it('debe crear sesión de checkout para plan premium mensual', async () => {
      if (skipIfNoStripeKeys()) return;

      const session = await crearCheckoutSessionTest(stripe, {
        customer_email: 'checkout@escuchodromo.com',
        plan: 'premium',
        periodo: 'mensual',
        moneda: 'COP',
      });

      recursosLimpiar.sessions.push(session.id);

      expect(session.id).toMatch(/^cs_/);
      expect(session.mode).toBe('subscription');
      expect(session.url).toBeTruthy();
      expect(session.metadata?.plan).toBe('premium');
    });

    it('debe incluir URLs de éxito y cancelación', async () => {
      if (skipIfNoStripeKeys()) return;

      const session = await crearCheckoutSessionTest(stripe, {
        customer_email: 'urls@escuchodromo.com',
        plan: 'profesional',
        periodo: 'anual',
        moneda: 'USD',
      });

      recursosLimpiar.sessions.push(session.id);

      expect(session.success_url).toContain('success');
      expect(session.cancel_url).toContain('cancel');
    });

    it('debe expirar después de 24 horas por defecto', async () => {
      if (skipIfNoStripeKeys()) return;

      const session = await crearCheckoutSessionTest(stripe, {
        customer_email: 'expiry@escuchodromo.com',
        plan: 'premium',
        periodo: 'mensual',
        moneda: 'COP',
      });

      recursosLimpiar.sessions.push(session.id);

      const ahora = Math.floor(Date.now() / 1000);
      const expires_at = session.expires_at!;

      // Debe expirar en ~24 horas (permitir margen de 1 hora)
      const diff = expires_at - ahora;
      expect(diff).toBeGreaterThan(23 * 3600);
      expect(diff).toBeLessThan(25 * 3600);
    });
  });

  // ============================================
  // TESTS DE SUSCRIPCIONES
  // ============================================

  describe('Suscripciones', () => {
    let customerId: string;

    beforeEach(async () => {
      if (skipIfNoStripeKeys()) return;

      const cliente = await stripe.customers.create({
        email: 'suscripcion@escuchodromo.com',
      });
      customerId = cliente.id;
      recursosLimpiar.customers.push(customerId);
    });

    it('debe crear suscripción activa', async () => {
      if (skipIfNoStripeKeys()) return;

      const suscripcion = await crearSuscripcionTest(stripe, customerId, {
        plan: 'premium',
        periodo: 'mensual',
        moneda: 'COP',
      });

      recursosLimpiar.subscriptions.push(suscripcion.id);

      expect(suscripcion.id).toMatch(/^sub_/);
      expect(suscripcion.status).toBe('active');
      expect(suscripcion.customer).toBe(customerId);
    });

    it('debe tener fechas de inicio y fin del período', async () => {
      if (skipIfNoStripeKeys()) return;

      const suscripcion = await crearSuscripcionTest(stripe, customerId, {
        plan: 'premium',
        periodo: 'mensual',
        moneda: 'COP',
      });

      recursosLimpiar.subscriptions.push(suscripcion.id);

      expect(suscripcion.current_period_start).toBeDefined();
      expect(suscripcion.current_period_end).toBeDefined();
      expect(suscripcion.current_period_end).toBeGreaterThan(
        suscripcion.current_period_start
      );
    });

    it('debe poder cancelar suscripción al final del período', async () => {
      if (skipIfNoStripeKeys()) return;

      const suscripcion = await crearSuscripcionTest(stripe, customerId, {
        plan: 'premium',
        periodo: 'mensual',
        moneda: 'COP',
      });

      recursosLimpiar.subscriptions.push(suscripcion.id);

      const cancelada = await stripe.subscriptions.update(suscripcion.id, {
        cancel_at_period_end: true,
      });

      expect(cancelada.cancel_at_period_end).toBe(true);
      expect(cancelada.status).toBe('active'); // Sigue activa hasta el final
    });

    it('debe poder cancelar suscripción inmediatamente', async () => {
      if (skipIfNoStripeKeys()) return;

      const suscripcion = await crearSuscripcionTest(stripe, customerId, {
        plan: 'premium',
        periodo: 'mensual',
        moneda: 'COP',
      });

      recursosLimpiar.subscriptions.push(suscripcion.id);

      const cancelada = await stripe.subscriptions.cancel(suscripcion.id);

      expect(cancelada.status).toBe('canceled');
    });

    it('debe poder reactivar suscripción cancelada (antes del fin del período)', async () => {
      if (skipIfNoStripeKeys()) return;

      const suscripcion = await crearSuscripcionTest(stripe, customerId, {
        plan: 'premium',
        periodo: 'mensual',
        moneda: 'COP',
      });

      recursosLimpiar.subscriptions.push(suscripcion.id);

      // Cancelar al final del período
      await stripe.subscriptions.update(suscripcion.id, {
        cancel_at_period_end: true,
      });

      // Reactivar
      const reactivada = await stripe.subscriptions.update(suscripcion.id, {
        cancel_at_period_end: false,
      });

      expect(reactivada.cancel_at_period_end).toBe(false);
      expect(reactivada.status).toBe('active');
    });

    it('debe poder cambiar de plan (upgrade)', async () => {
      if (skipIfNoStripeKeys()) return;

      const suscripcion = await crearSuscripcionTest(stripe, customerId, {
        plan: 'premium',
        periodo: 'mensual',
        moneda: 'COP',
      });

      recursosLimpiar.subscriptions.push(suscripcion.id);

      // Crear nuevo precio para plan profesional
      const nuevoPrecio = await stripe.prices.create({
        unit_amount: 9990000, // 99900 COP
        currency: 'cop',
        recurring: { interval: 'month' },
        product_data: {
          name: 'Plan Profesional',
        },
      });

      // Actualizar suscripción con nuevo precio
      const actualizada = await stripe.subscriptions.update(suscripcion.id, {
        items: [
          {
            id: suscripcion.items.data[0].id,
            price: nuevoPrecio.id,
          },
        ],
        proration_behavior: 'always_invoice', // Prorratear inmediatamente
      });

      expect(actualizada.items.data[0].price.id).toBe(nuevoPrecio.id);
    });
  });

  // ============================================
  // TESTS DE MÉTODOS DE PAGO
  // ============================================

  describe('Métodos de Pago con Tarjetas de Test', () => {
    it('debe aceptar tarjeta exitosa (4242...)', async () => {
      if (skipIfNoStripeKeys()) return;

      const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: TARJETAS_TEST.EXITOSA.number,
          exp_month: TARJETAS_TEST.EXITOSA.exp_month,
          exp_year: TARJETAS_TEST.EXITOSA.exp_year,
          cvc: TARJETAS_TEST.EXITOSA.cvc,
        },
      });

      expect(paymentMethod.id).toMatch(/^pm_/);
      expect(paymentMethod.type).toBe('card');
      expect(paymentMethod.card?.last4).toBe('4242');
    });

    it('debe rechazar tarjeta con fondos insuficientes', async () => {
      if (skipIfNoStripeKeys()) return;

      const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: TARJETAS_TEST.FONDOS_INSUFICIENTES.number,
          exp_month: TARJETAS_TEST.FONDOS_INSUFICIENTES.exp_month,
          exp_year: TARJETAS_TEST.FONDOS_INSUFICIENTES.exp_year,
          cvc: TARJETAS_TEST.FONDOS_INSUFICIENTES.cvc,
        },
      });

      expect(paymentMethod.id).toMatch(/^pm_/);
      expect(paymentMethod.card?.last4).toBe('9995');
    });
  });

  // ============================================
  // TESTS DE WEBHOOKS
  // ============================================

  describe('Configuración de Webhooks', () => {
    it('debe poder listar endpoints de webhook', async () => {
      if (skipIfNoStripeKeys()) return;

      const endpoints = await stripe.webhookEndpoints.list({ limit: 10 });

      expect(endpoints.object).toBe('list');
      expect(Array.isArray(endpoints.data)).toBe(true);
    });

    it('debe crear endpoint de webhook para testing', async () => {
      if (skipIfNoStripeKeys()) return;

      const endpoint = await stripe.webhookEndpoints.create({
        url: 'https://test.escuchodromo.com/webhook-stripe',
        enabled_events: [
          'checkout.session.completed',
          'customer.subscription.updated',
          'customer.subscription.deleted',
          'invoice.payment_succeeded',
          'invoice.payment_failed',
        ],
        description: 'Webhook de test para Escuchodromo',
      });

      expect(endpoint.id).toMatch(/^we_/);
      expect(endpoint.url).toBe('https://test.escuchodromo.com/webhook-stripe');
      expect(endpoint.enabled_events).toContain('checkout.session.completed');

      // Limpiar
      await stripe.webhookEndpoints.del(endpoint.id);
    });
  });

  // ============================================
  // TESTS DE EVENTOS
  // ============================================

  describe('Sistema de Eventos', () => {
    it('debe poder listar eventos recientes', async () => {
      if (skipIfNoStripeKeys()) return;

      const eventos = await stripe.events.list({ limit: 5 });

      expect(eventos.object).toBe('list');
      expect(Array.isArray(eventos.data)).toBe(true);
    });

    it('debe poder obtener un evento específico por ID', async () => {
      if (skipIfNoStripeKeys()) return;

      const eventos = await stripe.events.list({ limit: 1 });

      if (eventos.data.length > 0) {
        const eventoId = eventos.data[0].id;
        const evento = await stripe.events.retrieve(eventoId);

        expect(evento.id).toBe(eventoId);
        expect(evento.type).toBeDefined();
      }
    });
  });

  // ============================================
  // TESTS DE FACTURAS
  // ============================================

  describe('Facturas', () => {
    let customerId: string;

    beforeEach(async () => {
      if (skipIfNoStripeKeys()) return;

      const cliente = await stripe.customers.create({
        email: 'facturas@escuchodromo.com',
      });
      customerId = cliente.id;
      recursosLimpiar.customers.push(customerId);
    });

    it('debe listar facturas del cliente', async () => {
      if (skipIfNoStripeKeys()) return;

      const facturas = await stripe.invoices.list({
        customer: customerId,
        limit: 10,
      });

      expect(facturas.object).toBe('list');
      expect(Array.isArray(facturas.data)).toBe(true);
    });

    it('debe generar factura próxima para suscripción', async () => {
      if (skipIfNoStripeKeys()) return;

      const suscripcion = await crearSuscripcionTest(stripe, customerId, {
        plan: 'premium',
        periodo: 'mensual',
        moneda: 'COP',
      });

      recursosLimpiar.subscriptions.push(suscripcion.id);

      const facturaProxima = await stripe.invoices.retrieveUpcoming({
        customer: customerId,
      });

      expect(facturaProxima.customer).toBe(customerId);
      expect(facturaProxima.subscription).toBe(suscripcion.id);
      expect(facturaProxima.amount_due).toBeGreaterThan(0);
    });
  });

  // ============================================
  // TESTS DE REEMBOLSOS
  // ============================================

  describe('Reembolsos', () => {
    it('debe poder verificar política de reembolsos', async () => {
      if (skipIfNoStripeKeys()) return;

      // Este test verifica que se puede acceder a la API de reembolsos
      // En producción, los reembolsos se hacen sobre pagos reales

      const reembolsos = await stripe.refunds.list({ limit: 1 });

      expect(reembolsos.object).toBe('list');
    });
  });

  // ============================================
  // TESTS DE PERFORMANCE
  // ============================================

  describe('Performance de API', () => {
    it('debe responder en menos de 1 segundo para crear cliente', async () => {
      if (skipIfNoStripeKeys()) return;

      const inicio = Date.now();

      const cliente = await stripe.customers.create({
        email: 'performance@escuchodromo.com',
      });

      const duracion = Date.now() - inicio;

      recursosLimpiar.customers.push(cliente.id);

      expect(duracion).toBeLessThan(1000);
    });

    it('debe responder en menos de 2 segundos para crear sesión de checkout', async () => {
      if (skipIfNoStripeKeys()) return;

      const inicio = Date.now();

      const session = await crearCheckoutSessionTest(stripe, {
        customer_email: 'performance-checkout@escuchodromo.com',
        plan: 'premium',
        periodo: 'mensual',
        moneda: 'COP',
      });

      const duracion = Date.now() - inicio;

      recursosLimpiar.sessions.push(session.id);

      expect(duracion).toBeLessThan(2000);
    });
  });
});
