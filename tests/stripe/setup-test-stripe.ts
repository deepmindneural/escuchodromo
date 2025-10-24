/**
 * Configuración y utilidades para tests de Stripe
 *
 * IMPORTANTE: Todos los tests usan Stripe Test Mode
 * Las claves de test comienzan con 'sk_test_' y 'pk_test_'
 *
 * Documentación: https://stripe.com/docs/testing
 */

import Stripe from 'stripe';

// ============================================
// CONFIGURACIÓN DE STRIPE TEST MODE
// ============================================

export const STRIPE_TEST_CONFIG = {
  // Claves de test (reemplazar con tus claves reales de test)
  secretKey: process.env.STRIPE_TEST_SECRET_KEY || 'sk_test_...',
  publishableKey: process.env.STRIPE_TEST_PUBLISHABLE_KEY || 'pk_test_...',
  webhookSecret: process.env.STRIPE_TEST_WEBHOOK_SECRET || 'whsec_test_...',

  // Configuración de API
  apiVersion: '2023-10-16' as const,
};

// ============================================
// TARJETAS DE TEST DE STRIPE
// ============================================

export const TARJETAS_TEST = {
  // Tarjeta que siempre es exitosa
  EXITOSA: {
    number: '4242424242424242',
    exp_month: 12,
    exp_year: 2030,
    cvc: '123',
  },

  // Tarjeta que requiere autenticación 3D Secure
  REQUIERE_AUTH: {
    number: '4000002500003155',
    exp_month: 12,
    exp_year: 2030,
    cvc: '123',
  },

  // Tarjeta rechazada por fondos insuficientes
  FONDOS_INSUFICIENTES: {
    number: '4000000000009995',
    exp_month: 12,
    exp_year: 2030,
    cvc: '123',
  },

  // Tarjeta rechazada (genérico)
  RECHAZADA: {
    number: '4000000000000002',
    exp_month: 12,
    exp_year: 2030,
    cvc: '123',
  },

  // Tarjeta con CVC incorrecto
  CVC_INCORRECTO: {
    number: '4000000000000127',
    exp_month: 12,
    exp_year: 2030,
    cvc: '123',
  },

  // Tarjeta expirada
  EXPIRADA: {
    number: '4000000000000069',
    exp_month: 12,
    exp_year: 2030,
    cvc: '123',
  },

  // Tarjeta para procesos de disputa
  DISPUTA: {
    number: '4000000000000259',
    exp_month: 12,
    exp_year: 2030,
    cvc: '123',
  },
};

// ============================================
// CLIENTE DE STRIPE PARA TESTS
// ============================================

export const crearClienteStripeTest = (): Stripe => {
  if (!STRIPE_TEST_CONFIG.secretKey.startsWith('sk_test_')) {
    console.warn('⚠️ ADVERTENCIA: No estás usando una clave de test de Stripe');
  }

  return new Stripe(STRIPE_TEST_CONFIG.secretKey, {
    apiVersion: STRIPE_TEST_CONFIG.apiVersion,
  });
};

// ============================================
// DATOS DE TEST PARA PLANES
// ============================================

export const PLANES_TEST = {
  basico: {
    nombre: 'Plan Básico',
    precio: {
      mensual: { COP: 0, USD: 0 },
      anual: { COP: 0, USD: 0 },
    },
    features: ['Chat con IA', 'Evaluaciones básicas'],
  },
  premium: {
    nombre: 'Plan Premium',
    precio: {
      mensual: { COP: 49900, USD: 12 },
      anual: { COP: 479000, USD: 115 },
    },
    features: ['Todo lo de Básico', 'Recomendaciones personalizadas', 'Análisis de voz'],
  },
  profesional: {
    nombre: 'Plan Profesional',
    precio: {
      mensual: { COP: 99900, USD: 24 },
      anual: { COP: 959000, USD: 230 },
    },
    features: ['Todo lo de Premium', 'Sesiones con terapeuta', 'Reportes clínicos'],
  },
};

// ============================================
// USUARIOS DE TEST
// ============================================

export const USUARIOS_TEST = {
  usuario_basico: {
    id: 'usuario-test-basico-123',
    auth_id: 'auth-basico-456',
    email: 'test.basico@escuchodromo.com',
    nombre: 'Usuario Test Básico',
    rol: 'USUARIO' as const,
  },
  usuario_premium: {
    id: 'usuario-test-premium-123',
    auth_id: 'auth-premium-456',
    email: 'test.premium@escuchodromo.com',
    nombre: 'Usuario Test Premium',
    rol: 'USUARIO' as const,
  },
  terapeuta: {
    id: 'terapeuta-test-123',
    auth_id: 'auth-terapeuta-456',
    email: 'terapeuta.test@escuchodromo.com',
    nombre: 'Terapeuta Test',
    rol: 'TERAPEUTA' as const,
  },
};

// ============================================
// HELPERS PARA GENERAR EVENTOS DE WEBHOOK
// ============================================

export const generarEventoWebhookTest = (
  tipo: string,
  data: any,
  stripeClient: Stripe
): string => {
  const evento = {
    id: `evt_test_${Date.now()}`,
    object: 'event',
    api_version: STRIPE_TEST_CONFIG.apiVersion,
    created: Math.floor(Date.now() / 1000),
    data: {
      object: data,
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: null,
      idempotency_key: null,
    },
    type: tipo,
  };

  return JSON.stringify(evento);
};

export const generarFirmaWebhookTest = (
  payload: string,
  secret: string = STRIPE_TEST_CONFIG.webhookSecret
): string => {
  // En tests reales, Stripe proporciona una librería para esto
  // Por ahora, retornamos una firma de test
  const timestamp = Math.floor(Date.now() / 1000);
  return `t=${timestamp},v1=test_signature_${Date.now()}`;
};

// ============================================
// HELPERS PARA CREAR DATOS DE TEST
// ============================================

export const crearCheckoutSessionTest = async (
  stripe: Stripe,
  params: {
    customer_email: string;
    plan: 'basico' | 'premium' | 'profesional';
    periodo: 'mensual' | 'anual';
    moneda: 'COP' | 'USD';
  }
): Promise<Stripe.Checkout.Session> => {
  const { customer_email, plan, periodo, moneda } = params;
  const precio = PLANES_TEST[plan].precio[periodo][moneda];

  return await stripe.checkout.sessions.create({
    customer_email,
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: moneda.toLowerCase(),
          product_data: {
            name: PLANES_TEST[plan].nombre,
            description: `Suscripción ${periodo} a Escuchodromo`,
          },
          unit_amount: precio * 100,
          recurring: {
            interval: periodo === 'mensual' ? 'month' : 'year',
          },
        },
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: 'https://test.escuchodromo.com/success',
    cancel_url: 'https://test.escuchodromo.com/cancel',
    metadata: {
      plan,
      periodo,
      moneda,
    },
  });
};

export const crearClienteStripeParaTest = async (
  stripe: Stripe,
  email: string,
  nombre: string
): Promise<Stripe.Customer> => {
  return await stripe.customers.create({
    email,
    name: nombre,
    metadata: {
      test: 'true',
      entorno: 'test',
    },
  });
};

export const crearSuscripcionTest = async (
  stripe: Stripe,
  customerId: string,
  params: {
    plan: 'basico' | 'premium' | 'profesional';
    periodo: 'mensual' | 'anual';
    moneda: 'COP' | 'USD';
  }
): Promise<Stripe.Subscription> => {
  const { plan, periodo, moneda } = params;
  const precio = PLANES_TEST[plan].precio[periodo][moneda];

  // Primero crear un precio en Stripe
  const price = await stripe.prices.create({
    unit_amount: precio * 100,
    currency: moneda.toLowerCase(),
    recurring: {
      interval: periodo === 'mensual' ? 'month' : 'year',
    },
    product_data: {
      name: PLANES_TEST[plan].nombre,
    },
  });

  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: price.id }],
    metadata: {
      plan,
      periodo,
      moneda,
    },
  });
};

// ============================================
// HELPERS PARA LIMPIAR DATOS DE TEST
// ============================================

export const limpiarRecursosStripeTest = async (
  stripe: Stripe,
  recursos: {
    customers?: string[];
    subscriptions?: string[];
    sessions?: string[];
  }
): Promise<void> => {
  try {
    // Cancelar suscripciones
    if (recursos.subscriptions) {
      for (const subId of recursos.subscriptions) {
        try {
          await stripe.subscriptions.cancel(subId);
        } catch (error) {
          console.warn(`No se pudo cancelar suscripción ${subId}:`, error);
        }
      }
    }

    // Eliminar clientes (esto también elimina sus suscripciones)
    if (recursos.customers) {
      for (const custId of recursos.customers) {
        try {
          await stripe.customers.del(custId);
        } catch (error) {
          console.warn(`No se pudo eliminar cliente ${custId}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error limpiando recursos de Stripe:', error);
  }
};

// ============================================
// HELPERS PARA VERIFICAR ESTADOS
// ============================================

export const esperarEventoWebhook = (
  timeoutMs: number = 5000
): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeoutMs);
  });
};

export const verificarEstadoSuscripcion = (
  suscripcion: Stripe.Subscription,
  estadoEsperado: Stripe.Subscription.Status
): boolean => {
  return suscripcion.status === estadoEsperado;
};

// ============================================
// CONSTANTES DE TEST
// ============================================

export const ESTADOS_SUSCRIPCION = {
  ACTIVA: 'active',
  CANCELADA: 'canceled',
  VENCIDA: 'past_due',
  PAUSADA: 'paused',
  INCOMPLETA: 'incomplete',
  INCOMPLETA_EXPIRADA: 'incomplete_expired',
  TRIALING: 'trialing',
  UNPAID: 'unpaid',
} as const;

export const ESTADOS_PAGO = {
  PENDIENTE: 'pendiente',
  COMPLETADO: 'completado',
  FALLIDO: 'fallido',
  REEMBOLSADO: 'reembolsado',
} as const;

export const TIPOS_EVENTO_WEBHOOK = {
  CHECKOUT_COMPLETED: 'checkout.session.completed',
  SUBSCRIPTION_CREATED: 'customer.subscription.created',
  SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  INVOICE_PAYMENT_SUCCEEDED: 'invoice.payment_succeeded',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
  PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
  PAYMENT_INTENT_FAILED: 'payment_intent.payment_failed',
} as const;
