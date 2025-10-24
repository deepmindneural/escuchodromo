# Suite de Tests para Sistema de Pagos con Stripe

> Suite completa de tests para validar el sistema de pagos con Stripe en Escuchodromo (plataforma de salud mental).

## Índice

1. [Visión General](#visión-general)
2. [Configuración](#configuración)
3. [Estructura de Tests](#estructura-de-tests)
4. [Ejecutar Tests](#ejecutar-tests)
5. [Casos de Prueba](#casos-de-prueba)
6. [Priorización](#priorización)
7. [Checklist de Validación](#checklist-de-validación)
8. [Troubleshooting](#troubleshooting)

---

## Visión General

Esta suite de tests cubre **TODOS** los aspectos críticos del sistema de pagos:

- ✅ **Tests Unitarios**: Edge Functions individuales
- ✅ **Tests de Integración**: Llamadas reales a Stripe API (Test Mode)
- ✅ **Tests E2E**: Flujos completos de usuario
- ✅ **Tests de Seguridad**: Webhooks, autenticación, protección de datos
- ✅ **Tests de Manejo de Errores**: Todos los escenarios de fallo

### Cobertura Total

| Componente | Tests | Prioridad |
|------------|-------|-----------|
| `crear-checkout-stripe` | 25+ | CRÍTICO |
| `webhook-stripe` | 30+ | CRÍTICO |
| `gestionar-suscripcion` | 15+ | ALTO |
| Integración Stripe API | 40+ | ALTO |
| Flujos E2E | 35+ | CRÍTICO |
| Seguridad | 45+ | CRÍTICO |
| Manejo de Errores | 50+ | ALTO |
| **TOTAL** | **240+** | - |

---

## Configuración

### 1. Variables de Entorno

Crea un archivo `.env.test` en la raíz del proyecto:

```bash
# Stripe Test Mode Keys (NUNCA uses claves de producción)
STRIPE_TEST_SECRET_KEY=sk_test_tu_clave_secreta_aqui
STRIPE_TEST_PUBLISHABLE_KEY=pk_test_tu_clave_publica_aqui
STRIPE_TEST_WEBHOOK_SECRET=whsec_test_tu_webhook_secret_aqui

# Supabase (usar proyecto de test o local)
SUPABASE_URL=https://tu-proyecto-test.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

### 2. Obtener Claves de Stripe Test Mode

1. Ve a [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Asegúrate de estar en **Test Mode** (toggle en la parte superior)
3. Copia las claves:
   - **Secret key**: `sk_test_...`
   - **Publishable key**: `pk_test_...`

### 3. Configurar Webhook para Tests

1. Ve a [Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Crea un endpoint de test: `https://tu-dominio/webhook-stripe`
3. Selecciona estos eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copia el **Signing secret**: `whsec_test_...`

### 4. Instalar Dependencias

```bash
npm install
```

### 5. Verificar Configuración

```bash
npm run test:stripe:setup
```

---

## Estructura de Tests

```
tests/stripe/
├── README.md                          # Esta documentación
├── setup-test-stripe.ts               # Helpers y configuración
├── crear-checkout-stripe.spec.ts      # Tests unitarios de checkout
├── webhook-stripe.spec.ts             # Tests unitarios de webhooks
├── integracion-stripe.spec.ts         # Tests de integración con API
├── e2e-flujo-pago.spec.ts            # Tests E2E de flujos completos
├── seguridad-stripe.spec.ts          # Tests de seguridad críticos
├── manejo-errores-stripe.spec.ts     # Tests de manejo de errores
├── run-tests.sh                       # Script de automatización
└── CHECKLIST.md                       # Checklist de validación manual
```

---

## Ejecutar Tests

### Opción 1: Script Automatizado (Recomendado)

```bash
# Todos los tests
./tests/stripe/run-tests.sh all

# Solo tests unitarios
./tests/stripe/run-tests.sh unit

# Solo tests de integración (requiere claves de Stripe)
./tests/stripe/run-tests.sh integration

# Solo tests E2E
./tests/stripe/run-tests.sh e2e

# Solo tests de seguridad
./tests/stripe/run-tests.sh security

# Solo tests de manejo de errores
./tests/stripe/run-tests.sh errors

# Modo watch (desarrollo)
./tests/stripe/run-tests.sh watch

# Con reporte de cobertura
./tests/stripe/run-tests.sh coverage
```

### Opción 2: Jest Directamente

```bash
# Todos los tests de Stripe
npm run test:stripe

# Un archivo específico
npm test tests/stripe/crear-checkout-stripe.spec.ts

# Con cobertura
npm test tests/stripe/ -- --coverage

# Modo watch
npm test tests/stripe/ -- --watch
```

### Opción 3: NPM Scripts (agregar a package.json)

```json
{
  "scripts": {
    "test:stripe": "jest tests/stripe/",
    "test:stripe:unit": "jest tests/stripe/crear-checkout-stripe.spec.ts tests/stripe/webhook-stripe.spec.ts",
    "test:stripe:integration": "jest tests/stripe/integracion-stripe.spec.ts",
    "test:stripe:e2e": "jest tests/stripe/e2e-flujo-pago.spec.ts",
    "test:stripe:security": "jest tests/stripe/seguridad-stripe.spec.ts",
    "test:stripe:errors": "jest tests/stripe/manejo-errores-stripe.spec.ts",
    "test:stripe:coverage": "jest tests/stripe/ --coverage --coverageDirectory=coverage/stripe"
  }
}
```

---

## Casos de Prueba

### Tests Unitarios (crear-checkout-stripe)

| Test | Descripción | Prioridad |
|------|-------------|-----------|
| Autenticación sin token | Debe rechazar con 401 | CRÍTICO |
| Token inválido | Debe rechazar con 401 | CRÍTICO |
| Plan inválido | Debe rechazar con 400 | CRÍTICO |
| Plan básico gratuito | Debe retornar éxito sin Stripe | ALTO |
| Crear sesión premium | Debe crear sesión válida | CRÍTICO |
| Reutilizar cliente existente | Debe usar stripe_cliente_id | MEDIO |
| Validar metadata | Debe incluir usuario_id, plan, periodo | ALTO |
| Headers CORS | Debe incluir Access-Control-Allow-Origin | MEDIO |

### Tests de Integración (Stripe API)

| Test | Descripción | Prioridad |
|------|-------------|-----------|
| Conexión a API | Debe conectar exitosamente | CRÍTICO |
| Crear cliente | Debe crear customer en Stripe | ALTO |
| Crear sesión checkout | Debe crear checkout session | CRÍTICO |
| Crear suscripción | Debe crear subscription activa | CRÍTICO |
| Cancelar suscripción | Debe cancelar al final de período | ALTO |
| Reactivar suscripción | Debe remover cancelación | MEDIO |
| Tarjeta exitosa | Debe aceptar 4242... | ALTO |
| Performance API | Debe responder en < 1s | MEDIO |

### Tests E2E (Flujos Completos)

| Test | Descripción | Prioridad |
|------|-------------|-----------|
| Usuario nuevo → Premium | Flujo completo de compra | CRÍTICO |
| Upgrade Premium → Profesional | Cambio de plan | ALTO |
| Plan anual con descuento | Verificar 20% descuento | ALTO |
| Plan básico gratuito | Sin procesamiento de pago | MEDIO |
| Pago en USD | Moneda alternativa | MEDIO |
| Cancelar y reactivar | Gestión de suscripción | ALTO |
| Renovación automática | Invoice payment succeeded | CRÍTICO |
| Pago fallido → Downgrade | Degradar a básico | ALTO |

### Tests de Seguridad

| Test | Descripción | Prioridad |
|------|-------------|-----------|
| Webhook sin firma | Debe rechazar | CRÍTICO |
| Webhook firma inválida | Debe rechazar | CRÍTICO |
| Timestamp antiguo (replay) | Debe rechazar | CRÍTICO |
| Eventos duplicados | Idempotencia | CRÍTICO |
| Autenticación requerida | 401 sin token | CRÍTICO |
| Suplantación de usuario | Prevenir | CRÍTICO |
| SQL Injection | Sanitizar entrada | CRÍTICO |
| Claves API expuestas | No en frontend | CRÍTICO |
| Validar origen CORS | Solo dominios permitidos | ALTO |
| Logging seguro | No loguear PII | ALTO |

### Tests de Manejo de Errores

| Test | Descripción | Prioridad |
|------|-------------|-----------|
| Tarjeta fondos insuficientes | Mensaje claro al usuario | ALTO |
| Tarjeta rechazada | Traducir error | ALTO |
| CVC incorrecto | Guiar al usuario | MEDIO |
| Tarjeta expirada | Sugerir actualización | MEDIO |
| Timeout de red | Reintentar | ALTO |
| Error 500 de Stripe | Manejo graceful | ALTO |
| Webhook llega tarde | Reconciliar | ALTO |
| Webhook duplicado | Detectar | CRÍTICO |
| Pago recurrente falla | Notificar usuario | ALTO |
| Estado inconsistente | Sincronizar con Stripe | ALTO |

---

## Priorización

### CRÍTICO (Bloquean producción)
- ✅ Autenticación y autorización
- ✅ Verificación de firma de webhooks
- ✅ Procesamiento de pagos exitosos
- ✅ Creación de suscripciones
- ✅ Prevención de fraude y ataques
- ✅ Protección de claves API
- ✅ Idempotencia de eventos

**Cobertura mínima requerida: 100%**

### ALTO (Afectan experiencia de usuario)
- ✅ Manejo de errores de tarjeta
- ✅ Cancelación de suscripciones
- ✅ Renovaciones automáticas
- ✅ Upgrades/downgrades de plan
- ✅ Webhooks que llegan tarde
- ✅ Mensajes de error claros

**Cobertura mínima requerida: 90%**

### MEDIO (Mejoras incrementales)
- ✅ Performance de API
- ✅ Logs y auditoría
- ✅ Validaciones adicionales
- ✅ UX optimizada

**Cobertura mínima requerida: 80%**

---

## Checklist de Validación

### Pre-Deployment

- [ ] Todos los tests críticos pasan (100%)
- [ ] Tests de seguridad pasan (100%)
- [ ] Cobertura de código > 80% en módulos críticos
- [ ] Claves de test verificadas (comienzan con `sk_test_`)
- [ ] Webhook endpoint configurado correctamente
- [ ] Variables de entorno documentadas
- [ ] Logs no contienen información sensible
- [ ] CORS configurado correctamente
- [ ] Rate limiting implementado
- [ ] Documentación actualizada

### Post-Deployment

- [ ] Webhook recibe eventos en producción
- [ ] Primer pago de prueba exitoso
- [ ] Suscripción se crea correctamente
- [ ] Cancelación funciona
- [ ] Renovación automática funciona
- [ ] Notificaciones se envían
- [ ] Logs de auditoría funcionando
- [ ] Dashboard de Stripe muestra datos correctos

### Monitoreo Continuo

- [ ] Rate de éxito de pagos > 95%
- [ ] Latencia de API < 200ms
- [ ] Webhooks procesados < 5s
- [ ] Sin errores 5xx en 24h
- [ ] Reconciliación diaria OK
- [ ] Alertas configuradas

---

## Troubleshooting

### Tests de Integración No Se Ejecutan

**Problema**: Tests se saltan con mensaje "omitidos - configura STRIPE_TEST_SECRET_KEY"

**Solución**:
```bash
# Verificar que la variable está configurada
echo $STRIPE_TEST_SECRET_KEY

# Debe comenzar con sk_test_
# Si no está configurada:
export STRIPE_TEST_SECRET_KEY=sk_test_tu_clave_aqui
```

### Error: "Firma Inválida" en Webhooks

**Problema**: Los webhooks fallan con "Firma inválida"

**Solución**:
1. Verifica que `STRIPE_WEBHOOK_SECRET` es correcto
2. Debe comenzar con `whsec_test_`
3. En Stripe Dashboard, verifica que el endpoint usa la misma URL

### Tests Fallan con Error de Conexión

**Problema**: "ECONNREFUSED" o timeouts

**Solución**:
1. Verifica tu conexión a internet
2. Verifica que Stripe API está disponible: https://status.stripe.com
3. Aumenta el timeout en Jest config:
   ```javascript
   jest.setTimeout(30000); // 30 segundos
   ```

### Tarjetas de Test No Funcionan

**Problema**: Tarjetas de test son rechazadas

**Solución**:
1. Verifica que estás en Test Mode en Stripe
2. Usa tarjetas de la lista oficial: https://stripe.com/docs/testing
3. Verifica que no hay restricciones en tu cuenta

### Error: "No Such Customer"

**Problema**: Cliente no se encuentra en Stripe

**Solución**:
1. Verifica que estás usando la misma clave API para crear y consultar
2. Verifica que estás en el mismo entorno (test vs live)
3. El cliente debe haber sido creado exitosamente antes

---

## Tarjetas de Test de Stripe

Para testing, usa estas tarjetas (nunca uses tarjetas reales):

| Número | Resultado | Uso |
|--------|-----------|-----|
| `4242 4242 4242 4242` | Éxito | Happy path |
| `4000 0025 0000 3155` | Requiere 3D Secure | Auth testing |
| `4000 0000 0000 9995` | Fondos insuficientes | Error testing |
| `4000 0000 0000 0002` | Rechazada genérica | Error testing |
| `4000 0000 0000 0127` | CVC incorrecto | Validación |
| `4000 0000 0000 0069` | Expirada | Validación |

**Nota**: Usa cualquier CVC (ej: 123), fecha futura, y cualquier código postal.

---

## Reportar Bugs

Si encuentras un bug en los tests o en el sistema de pagos:

1. **No hagas commit de datos sensibles** (claves reales, emails reales)
2. Crea un issue con:
   - Descripción del problema
   - Pasos para reproducir
   - Output de los tests
   - Variables de entorno (enmascaradas)
3. Etiqueta como `bug`, `payments`, o `stripe`

---

## Referencias

- [Stripe API Docs](https://stripe.com/docs/api)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

## Changelog

### v1.0.0 (2024-10-24)
- ✅ Suite completa de tests implementada
- ✅ 240+ casos de prueba
- ✅ Tests unitarios, integración, E2E, seguridad, errores
- ✅ Scripts de automatización
- ✅ Documentación completa
- ✅ Configuración de Stripe Test Mode
- ✅ Helpers y mocks reutilizables

---

## Mantenimiento

Esta suite de tests debe actualizarse cuando:

1. Se agreguen nuevos planes de suscripción
2. Cambie la lógica de procesamiento de pagos
3. Stripe actualice su API
4. Se implementen nuevos métodos de pago
5. Cambien las reglas de negocio

**Responsable**: QA Team
**Frecuencia de review**: Mensual
**Última actualización**: 2024-10-24

---

## Licencia

© 2024 Escuchodromo. Uso interno únicamente.
