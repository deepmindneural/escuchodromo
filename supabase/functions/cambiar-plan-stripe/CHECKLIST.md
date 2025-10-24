# Checklist de Implementación: cambiar-plan-stripe

## Archivos Creados ✅

- [x] `index.ts` - Edge Function principal (18 KB)
- [x] `README.md` - Documentación completa (10 KB)
- [x] `cambiar-plan-stripe.test.ts` - Suite de tests (9 KB)
- [x] `CHECKLIST.md` - Este archivo

## Validación de Código ✅

### Funcionalidades Implementadas

- [x] Autenticación JWT con Supabase Auth
- [x] Validación de usuario en base de datos
- [x] Obtención de suscripción activa
- [x] Validación de plan y período
- [x] Detección automática de upgrade vs downgrade
- [x] Integración con Stripe API v2023-10-16
- [x] Actualización de suscripción en Stripe con prorrateo correcto
- [x] Actualización de registro en base de datos
- [x] Sistema de auditoría completo
- [x] Manejo de errores con reversión automática
- [x] Headers CORS configurados
- [x] Logging detallado para debugging

### Lógica de Negocio

#### UPGRADE (Prorrateo Inmediato) ✅

```typescript
proration_behavior: 'create_prorations'  // Cobra diferencia
billing_cycle_anchor: 'now'              // Nuevo período empieza ahora
estado: 'activa'                         // Cambio inmediato
```

- [x] Se cobra diferencia prorrateada al instante
- [x] Nuevo período de facturación comienza inmediatamente
- [x] Usuario tiene acceso a nuevas features de inmediato
- [x] BD refleja cambio inmediato

#### DOWNGRADE (Cambio al Final) ✅

```typescript
proration_behavior: 'none'               // Sin prorrateo
billing_cycle_anchor: 'unchanged'        // Cambio al final
estado: 'cancelar_al_final'              // Cambio pendiente
plan_pendiente: nuevo_plan               // Plan futuro
```

- [x] No se cobra adicional
- [x] Usuario mantiene plan actual hasta fin de período
- [x] Cambio se aplica al vencimiento
- [x] BD refleja estado pendiente

### Validaciones Implementadas ✅

#### Seguridad
- [x] Token JWT requerido
- [x] Usuario existe en BD
- [x] Usuario es dueño de la suscripción

#### Datos
- [x] Plan válido (premium, profesional)
- [x] Período válido (mensual, anual)
- [x] Plan diferente al actual
- [x] No permite cambio a básico
- [x] Suscripción tiene stripe_subscription_id
- [x] Suscripción de Stripe está activa

#### Stripe
- [x] Suscripción existe en Stripe
- [x] Suscripción no está cancelada
- [x] Suscripción tiene items

### Manejo de Errores ✅

#### Errores Controlados
- [x] 401 - No autorizado / Token inválido
- [x] 400 - Parámetros faltantes
- [x] 400 - Plan inválido
- [x] 400 - Mismo plan actual
- [x] 400 - Intento de cambiar a básico
- [x] 404 - Usuario no encontrado
- [x] 404 - Suscripción no encontrada
- [x] 500 - Variables de entorno faltantes
- [x] 500 - Error en Stripe API
- [x] 500 - Error al actualizar BD

#### Recuperación de Errores
- [x] Si Stripe OK pero BD falla → Revertir Stripe
- [x] Si reversión falla → Log crítico
- [x] Todos los errores se registran en auditoría

### Auditoría ✅

Cada intento registra:
- [x] Usuario y suscripción afectada
- [x] Plan y período anterior
- [x] Plan y período nuevo
- [x] Precios anterior y nuevo
- [x] Tipo de cambio (upgrade/downgrade)
- [x] Resultado (exitoso/fallido)
- [x] Mensaje de error si aplica
- [x] Timestamp

### Response Format ✅

#### Success Response (200)
```typescript
{
  success: true,
  mensaje: string,
  datos: {
    plan_anterior: string,
    periodo_anterior: string,
    plan_nuevo: string,
    periodo_nuevo: string,
    precio_nuevo: number,
    moneda: string,
    tipo_cambio: 'upgrade' | 'downgrade',
    aplicacion: 'inmediata' | 'fin_periodo',
    fecha_efectiva: string,
    fecha_proximo_pago: string
  }
}
```

#### Error Response (4xx, 5xx)
```typescript
{
  error: string,
  detalles?: string | object
}
```

### Tests ✅

- [x] Test de CORS
- [x] Test de autenticación
- [x] Tests de validación (8 casos)
- [x] Test de upgrade
- [x] Test de downgrade
- [x] Test de cambio de período
- [x] Test de estructura de response
- [x] Tests de integración con Stripe (opcionales)
- [x] Test de performance (< 5s)

## Requisitos Previos para Deployment

### 1. Variables de Entorno en Supabase

```bash
# Requeridas
STRIPE_SECRET_KEY=sk_test_xxx        # O sk_live_xxx en producción
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# Opcionales para tests
TEST_USER_JWT=eyJxxx  # Token de usuario con suscripción para tests
```

**Comandos:**
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx
supabase secrets list  # Verificar
```

### 2. Tabla de Auditoría en BD

Si no existe, crear tabla `AuditoriaSuscripcion`:

```sql
CREATE TABLE IF NOT EXISTS "AuditoriaSuscripcion" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE NOT NULL,
  suscripcion_id UUID REFERENCES "Suscripcion"(id) ON DELETE CASCADE NOT NULL,
  accion TEXT NOT NULL, -- 'cambio_plan', 'cancelacion', 'reactivacion'
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  metadata JSONB,
  creado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_auditoria_suscripcion_usuario ON "AuditoriaSuscripcion"(usuario_id);
CREATE INDEX idx_auditoria_suscripcion_fecha ON "AuditoriaSuscripcion"(creado_en DESC);
```

**Nota:** La función funcionará sin esta tabla pero no registrará auditoría.

### 3. Campos en Tabla Suscripcion

Verificar que existan estos campos:

```sql
-- Campos requeridos
stripe_subscription_id TEXT
stripe_customer_id TEXT
plan TEXT CHECK (plan IN ('basico', 'premium', 'profesional'))
periodo TEXT CHECK (periodo IN ('mensual', 'anual'))
precio FLOAT
moneda TEXT CHECK (moneda IN ('COP', 'USD'))
estado TEXT CHECK (estado IN ('activa', 'cancelada', 'pausada', 'vencida', 'cancelar_al_final'))

-- Campos opcionales para downgrade
plan_pendiente TEXT
periodo_pendiente TEXT
```

### 4. RLS Policies

Verificar que usuario pueda:
- [x] Leer su propia suscripción
- [x] Service role puede actualizar suscripciones

## Pasos de Deployment

### 1. Verificar Código Localmente

```bash
# Navegar al directorio de la función
cd supabase/functions/cambiar-plan-stripe

# Revisar código
cat index.ts

# Verificar sintaxis TypeScript (si tienes deno instalado)
deno check index.ts
```

### 2. Configurar Secrets

```bash
# Producción
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx --project-ref xxx

# Verificar
supabase secrets list --project-ref xxx
```

### 3. Deploy

```bash
# Deploy la función
supabase functions deploy cambiar-plan-stripe --project-ref xxx

# Ver logs del deploy
supabase functions logs cambiar-plan-stripe --project-ref xxx
```

### 4. Verificar Deployment

```bash
# Test básico (debería retornar 401)
curl -i --request POST \
  'https://xxx.supabase.co/functions/v1/cambiar-plan-stripe' \
  --header 'Content-Type: application/json' \
  --data '{"nuevo_plan_codigo":"premium","nuevo_periodo":"mensual"}'

# Con autenticación (reemplazar JWT_TOKEN)
curl -i --request POST \
  'https://xxx.supabase.co/functions/v1/cambiar-plan-stripe' \
  --header 'Authorization: Bearer JWT_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{"nuevo_plan_codigo":"profesional","nuevo_periodo":"anual"}'
```

### 5. Ejecutar Tests

```bash
# Configurar variables para tests
export SUPABASE_URL="https://xxx.supabase.co"
export SUPABASE_ANON_KEY="eyJxxx"
export STRIPE_SECRET_KEY="sk_test_xxx"
export TEST_USER_JWT="eyJxxx"

# Ejecutar suite de tests
deno test --allow-net --allow-env cambiar-plan-stripe.test.ts

# Solo tests de validación (rápidos)
deno test --allow-net --allow-env --filter "Validación" cambiar-plan-stripe.test.ts
```

### 6. Monitoreo Post-Deploy

```bash
# Ver logs en tiempo real
supabase functions logs cambiar-plan-stripe --project-ref xxx --follow

# Filtrar solo errores
supabase functions logs cambiar-plan-stripe --project-ref xxx | grep ERROR
```

## Integración Frontend

### Service Function

Crear en `apps/web/src/lib/servicios/suscripciones.ts`:

```typescript
export async function cambiarPlanSuscripcion(
  nuevoPlan: 'premium' | 'profesional',
  nuevoPeriodo: 'mensual' | 'anual'
) {
  const supabase = createClientComponentClient()

  const { data, error } = await supabase.functions.invoke('cambiar-plan-stripe', {
    body: { nuevo_plan_codigo: nuevoPlan, nuevo_periodo: nuevoPeriodo }
  })

  if (error) throw new Error(error.message)
  return data
}
```

### Componente UI

```typescript
// apps/web/src/app/suscripcion/cambiar/page.tsx
'use client'

import { cambiarPlanSuscripcion } from '@/lib/servicios/suscripciones'

export default function CambiarPlanPage() {
  async function handleCambiar() {
    try {
      const resultado = await cambiarPlanSuscripcion('profesional', 'anual')

      if (resultado.datos.tipo_cambio === 'upgrade') {
        toast.success('Plan actualizado inmediatamente')
      } else {
        toast.info(`Cambio programado para ${resultado.datos.fecha_efectiva}`)
      }
    } catch (error) {
      toast.error('Error al cambiar plan: ' + error.message)
    }
  }

  return <button onClick={handleCambiar}>Cambiar Plan</button>
}
```

## Casos de Uso

### 1. Usuario Hace Upgrade

**Escenario:** Usuario con Premium Mensual (COP 49,900) → Profesional Anual (COP 959,000)

**Flujo:**
1. Usuario hace clic en "Cambiar a Profesional Anual"
2. Frontend llama `cambiarPlanSuscripcion('profesional', 'anual')`
3. Edge Function:
   - Valida suscripción activa
   - Calcula que es upgrade (959,000 > 49,900)
   - Llama Stripe con `proration_behavior: 'create_prorations'`
   - Stripe cobra diferencia prorrateada
   - Actualiza BD con nuevo plan
4. Usuario recibe confirmación: "Plan actualizado inmediatamente"
5. Usuario tiene acceso instantáneo a features de Profesional

**Verificación:**
- [ ] Stripe Dashboard muestra nueva suscripción
- [ ] BD tiene `plan='profesional', periodo='anual', estado='activa'`
- [ ] Usuario ve nuevo plan en dashboard
- [ ] Tabla Auditoría tiene registro exitoso

### 2. Usuario Hace Downgrade

**Escenario:** Usuario con Profesional Anual (COP 959,000) → Premium Mensual (COP 49,900)

**Flujo:**
1. Usuario hace clic en "Cambiar a Premium Mensual"
2. Frontend llama `cambiarPlanSuscripcion('premium', 'mensual')`
3. Edge Function:
   - Valida suscripción activa
   - Calcula que es downgrade (49,900 < 959,000)
   - Llama Stripe con `proration_behavior: 'none'`
   - Stripe programa cambio para fin de período
   - Actualiza BD con estado `cancelar_al_final`
4. Usuario recibe: "Plan cambiará a Premium Mensual el 24/11/2025"
5. Usuario mantiene Profesional hasta vencimiento

**Verificación:**
- [ ] Stripe Dashboard muestra scheduled change
- [ ] BD tiene `estado='cancelar_al_final', plan_pendiente='premium'`
- [ ] Usuario ve notificación de cambio programado
- [ ] Al vencimiento, webhook aplica cambio

### 3. Usuario Cambia Período

**Escenario:** Usuario con Premium Mensual (COP 49,900) → Premium Anual (COP 479,000)

**Flujo:**
1. Usuario hace clic en "Cambiar a pago anual (ahorra 20%)"
2. Edge Function detecta que es upgrade (479,000 < 49,900 x 12)
3. Se aplica como upgrade: cambio inmediato con prorrateo
4. Usuario paga diferencia y período se reinicia

**Verificación:**
- [ ] BD tiene `periodo='anual'`
- [ ] `fecha_fin` actualizada (+1 año desde hoy)
- [ ] Stripe muestra nuevo billing cycle

## Troubleshooting

### Problema: "STRIPE_SECRET_KEY no configurada"

**Causa:** Variable de entorno no está en Supabase Secrets

**Solución:**
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_xxx --project-ref xxx
supabase functions deploy cambiar-plan-stripe --project-ref xxx
```

### Problema: "No tienes una suscripción activa"

**Causa:** Usuario no tiene registro en tabla Suscripcion con estado activo

**Solución:**
1. Verificar en BD: `SELECT * FROM "Suscripcion" WHERE usuario_id = 'xxx'`
2. Si no existe, usuario debe crear suscripción primero
3. Si existe pero estado es 'vencida', reactivar o crear nueva

### Problema: "Suscripción sin ID de Stripe"

**Causa:** Registro en BD no tiene `stripe_subscription_id`

**Solución:**
1. Si es suscripción nueva, verificar que webhook de Stripe funcione
2. Si es antigua, actualizar manualmente:
```sql
UPDATE "Suscripcion"
SET stripe_subscription_id = 'sub_xxx'
WHERE usuario_id = 'xxx'
```

### Problema: Error al revertir cambio en Stripe

**Causa:** Falla BD después de actualizar Stripe, pero reversión también falla

**Solución manual:**
1. Ver logs: `supabase functions logs cambiar-plan-stripe`
2. Identificar suscripción afectada
3. En Stripe Dashboard, revertir manualmente
4. Sincronizar BD manualmente

### Problema: Usuario reporta doble cobro

**Causa:** Usuario hizo upgrade y Stripe cobró proration + siguiente período

**Solución:**
1. Verificar en Stripe Dashboard los invoices
2. Confirmar que proration es correcto (diferencia de precio)
3. Próximo cobro debe ser en nueva fecha de renovación

## Métricas de Éxito

### KPIs a Monitorear

- **Tasa de éxito**: > 95% de requests exitosos
- **Tiempo de respuesta**: < 3 segundos promedio
- **Errores de Stripe**: < 1% de llamadas
- **Reversiones**: < 0.1% de cambios

### Queries para Analytics

```sql
-- Cambios de plan en los últimos 30 días
SELECT
  accion,
  metadata->>'tipo_cambio' as tipo,
  metadata->>'exitoso' as exitoso,
  COUNT(*) as total
FROM "AuditoriaSuscripcion"
WHERE
  accion = 'cambio_plan'
  AND creado_en > NOW() - INTERVAL '30 days'
GROUP BY accion, tipo, exitoso;

-- Usuarios que más cambian de plan
SELECT
  usuario_id,
  COUNT(*) as cambios
FROM "AuditoriaSuscripcion"
WHERE accion = 'cambio_plan'
GROUP BY usuario_id
ORDER BY cambios DESC
LIMIT 10;

-- Planes más populares después de cambio
SELECT
  datos_nuevos->>'plan' as plan_destino,
  COUNT(*) as total
FROM "AuditoriaSuscripcion"
WHERE
  accion = 'cambio_plan'
  AND metadata->>'exitoso' = 'true'
GROUP BY plan_destino
ORDER BY total DESC;
```

## Checklist Final de Deployment ✅

- [ ] Código revisado y testeado localmente
- [ ] Secrets configurados en Supabase
- [ ] Tabla AuditoriaSuscripcion existe
- [ ] Función desplegada exitosamente
- [ ] Test curl básico funciona (retorna 401)
- [ ] Test con usuario real exitoso
- [ ] Logs muestran actividad correcta
- [ ] Frontend integrado
- [ ] Documentación actualizada
- [ ] Equipo notificado del deployment

## Recursos

- **Documentación Stripe**: https://stripe.com/docs/billing/subscriptions/upgrade-downgrade
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **Código fuente**: `/supabase/functions/cambiar-plan-stripe/index.ts`
- **Tests**: `/supabase/functions/cambiar-plan-stripe/cambiar-plan-stripe.test.ts`
- **Soporte**: Revisar logs y tabla AuditoriaSuscripcion

---

**Estado**: ✅ Implementación Completa
**Versión**: 1.0.0
**Fecha**: 2025-10-24
