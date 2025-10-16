# Configuración de Stripe para Escuchodromo

## ✅ Estado Actual

- ✅ Edge Functions desplegados (3)
  - `crear-checkout-stripe`
  - `webhook-stripe`
  - `gestionar-suscripcion`
- ✅ Página de pago actualizada
- ✅ Tablas de base de datos creadas (Suscripcion, Pago)
- ⚠️ **FALTA:** Configurar credenciales de Stripe

---

## 🔧 Pasos para Activar Stripe

### 1. Crear Cuenta de Stripe

1. Ve a https://stripe.com
2. Haz clic en "Sign Up" / "Registrarse"
3. Completa el registro con tu información
4. Verifica tu email

### 2. Obtener las API Keys

1. Inicia sesión en Stripe Dashboard: https://dashboard.stripe.com
2. Ve a **Developers > API keys**
3. Encontrarás dos keys:
   - **Publishable key** (comienza con `pk_test_...` en modo test)
   - **Secret key** (comienza con `sk_test_...` en modo test)

**⚠️ IMPORTANTE:** Al principio estarás en modo **Test**. Esto es perfecto para desarrollo.

### 3. Configurar Variables de Entorno en Supabase

1. Ve a tu proyecto de Supabase: https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj
2. Ve a **Settings > Edge Functions > Secrets**
3. Agrega las siguientes variables:

```
STRIPE_SECRET_KEY=sk_test_tu_clave_aqui
```

**Cómo agregar:**
- Click en "Add new secret"
- Name: `STRIPE_SECRET_KEY`
- Value: Tu secret key de Stripe (comienza con `sk_test_`)
- Click "Save"

### 4. Configurar Webhook en Stripe

Este paso es CRÍTICO para que los pagos se registren en tu base de datos.

1. En Stripe Dashboard, ve a **Developers > Webhooks**
2. Click en "Add endpoint"
3. En "Endpoint URL", ingresa:
   ```
   https://cvezncgcdsjntzrzztrj.supabase.co/functions/v1/webhook-stripe
   ```
4. En "Events to send", selecciona estos eventos:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

5. Click en "Add endpoint"
6. Una vez creado, verás el **Signing secret** (comienza con `whsec_...`)
7. Cópialo y agrégalo a Supabase como variable de entorno:

```
STRIPE_WEBHOOK_SECRET=whsec_tu_webhook_secret_aqui
```

### 5. Crear las Tablas en la Base de Datos

Ejecuta el SQL en el SQL Editor de Supabase:

1. Ve a https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/sql/new
2. Copia y pega el contenido de: `scripts/crear_tablas_stripe.sql`
3. Click en "Run"

---

## 🧪 Probar en Modo Test

Stripe proporciona tarjetas de prueba para que puedas probar sin cargos reales:

### Tarjetas de Prueba

```
✅ Pago Exitoso:
Número: 4242 4242 4242 4242
Fecha: Cualquier fecha futura (ej: 12/28)
CVV: Cualquier 3 dígitos (ej: 123)

❌ Pago Declinado:
Número: 4000 0000 0000 0002
Fecha: Cualquier fecha futura
CVV: Cualquier 3 dígitos

💳 Requiere Autenticación 3D:
Número: 4000 0027 6000 3184
Fecha: Cualquier fecha futura
CVV: Cualquier 3 dígitos
```

### Flujo de Prueba

1. Ve a `/precios` en tu aplicación
2. Selecciona un plan (Premium o Profesional)
3. Completa el formulario de facturación
4. Click en "Continuar al Pago Seguro"
5. Usa una tarjeta de prueba
6. Completa el pago
7. Verifica:
   - ✅ Redirección a página de confirmación
   - ✅ Registro en tabla `Suscripcion`
   - ✅ Registro en tabla `Pago`
   - ✅ Evento recibido en Stripe Dashboard

---

## 🚀 Pasar a Producción

Cuando estés listo para recibir pagos reales:

### 1. Activar Cuenta en Stripe

1. En Stripe Dashboard, completa la sección "Activate your account"
2. Proporciona:
   - Información de negocio
   - Información bancaria (para recibir pagos)
   - Documentos de identificación

### 2. Cambiar a Claves de Producción

1. En Stripe Dashboard, cambia el toggle de "Test mode" a "Production mode"
2. Ve a **Developers > API keys**
3. Copia las nuevas claves (comienzan con `pk_live_` y `sk_live_`)
4. Actualiza en Supabase:
   - `STRIPE_SECRET_KEY=sk_live_...`

### 3. Actualizar Webhook

1. Crea un nuevo webhook para producción (misma URL, mismos eventos)
2. Actualiza `STRIPE_WEBHOOK_SECRET` con el nuevo signing secret de producción

### 4. Verificar Todo Funciona

Haz un pago de prueba real con tu propia tarjeta (te puedes reembolsar después).

---

## 📊 Monitorear Pagos

### En Stripe Dashboard

- **Payments:** Ver todos los pagos
- **Subscriptions:** Ver suscripciones activas/canceladas
- **Customers:** Ver clientes
- **Events:** Log de todos los eventos del webhook

### En Supabase

Consulta las tablas directamente:

```sql
-- Ver todas las suscripciones
SELECT * FROM "Suscripcion" ORDER BY creado_en DESC;

-- Ver todos los pagos
SELECT * FROM "Pago" ORDER BY creado_en DESC;

-- Suscripciones activas
SELECT u.nombre, u.email, s.*
FROM "Suscripcion" s
JOIN "Usuario" u ON s.usuario_id = u.id
WHERE s.estado = 'activa';
```

---

## ⚠️ Problemas Comunes

### "STRIPE_SECRET_KEY no configurada"
- Verifica que agregaste la variable en Supabase
- Asegúrate de que el nombre sea exacto: `STRIPE_SECRET_KEY`
- Redespliega las funciones después de agregar secrets

### Webhook no recibe eventos
- Verifica que la URL sea correcta
- Revisa que seleccionaste todos los eventos necesarios
- Verifica `STRIPE_WEBHOOK_SECRET` en Supabase
- Mira los logs en Stripe Dashboard > Webhooks

### Pago se completa pero no se registra
- Revisa los logs del webhook en Supabase Functions
- Verifica que el metadata tenga usuario_id, plan, periodo
- Asegúrate de que las tablas Suscripcion y Pago existen

---

## 🔒 Seguridad

### Buenas Prácticas

1. **NUNCA** compartas tu `sk_live_` key
2. **NUNCA** uses la key de producción en desarrollo
3. **SIEMPRE** valida webhooks con el signing secret
4. **ROTa** las keys si sospechas que fueron expuestas

### Verificación de Webhook

El Edge Function ya valida automáticamente la firma del webhook usando `STRIPE_WEBHOOK_SECRET`.

---

## 💰 Precios Configurados

Los precios están definidos en el Edge Function `crear-checkout-stripe/index.ts`:

```typescript
const PRECIOS = {
  premium: {
    mensual: { COP: 49900, USD: 12 },
    anual: { COP: 479000, USD: 115 }
  },
  profesional: {
    mensual: { COP: 99900, USD: 24 },
    anual: { COP: 959000, USD: 230 }
  }
}
```

Para cambiar precios, edita ese archivo y redesplega:
```bash
npx supabase functions deploy crear-checkout-stripe
```

---

## 📞 Soporte

### Stripe
- Documentación: https://stripe.com/docs
- Soporte: https://support.stripe.com

### Supabase Edge Functions
- Docs: https://supabase.com/docs/guides/functions
- Secrets: https://supabase.com/docs/guides/functions/secrets

---

## ✅ Checklist Final

Antes de lanzar a producción:

- [ ] Cuenta de Stripe activada y verificada
- [ ] Información bancaria agregada en Stripe
- [ ] `STRIPE_SECRET_KEY` de producción configurada en Supabase
- [ ] `STRIPE_WEBHOOK_SECRET` de producción configurada en Supabase
- [ ] Webhook de producción creado y funcionando
- [ ] Tablas `Suscripcion` y `Pago` creadas en base de datos
- [ ] Pago de prueba real completado exitosamente
- [ ] Verificado que suscripción se registra en BD
- [ ] Verificado que webhook recibe eventos
- [ ] Política de reembolsos definida
- [ ] Términos y condiciones actualizados

---

**Fecha:** 16 de Octubre, 2025
**Proyecto:** Escuchodromo
**Versión:** 1.0
