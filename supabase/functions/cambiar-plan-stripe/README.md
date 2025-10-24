# Edge Function: cambiar-plan-stripe

## Descripción

Edge Function para permitir a usuarios con suscripción activa cambiar su plan en Stripe. Maneja automáticamente:

- **UPGRADE** (ej: Premium → Profesional): Prorrateo inmediato, cobro de diferencia, cambio efectivo al instante
- **DOWNGRADE** (ej: Profesional → Premium): Sin prorrateo, cambio efectivo al final del período actual
- **CAMBIO DE PERÍODO** (mensual ↔ anual): Mismo comportamiento que upgrade/downgrade según precio

## Requisitos

### Variables de Entorno (Supabase Secrets)

```bash
STRIPE_SECRET_KEY=sk_test_xxx
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
```

### Permisos de BD

El usuario debe tener una suscripción activa con:
- `estado IN ('activa', 'cancelar_al_final')`
- `stripe_subscription_id` válido

## Endpoint

```
POST https://xxx.supabase.co/functions/v1/cambiar-plan-stripe
```

## Request

### Headers

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Body

```json
{
  "nuevo_plan_codigo": "profesional",
  "nuevo_periodo": "anual"
}
```

**Parámetros:**

- `nuevo_plan_codigo` (required): `"basico" | "premium" | "profesional"`
- `nuevo_periodo` (required): `"mensual" | "anual"`

## Response

### Success (200)

**Upgrade Inmediato:**
```json
{
  "success": true,
  "mensaje": "Plan actualizado a profesional anual. El cambio es efectivo inmediatamente.",
  "datos": {
    "plan_anterior": "premium",
    "periodo_anterior": "mensual",
    "plan_nuevo": "profesional",
    "periodo_nuevo": "anual",
    "precio_nuevo": 959000,
    "moneda": "COP",
    "tipo_cambio": "upgrade",
    "aplicacion": "inmediata",
    "fecha_efectiva": "2025-10-24T12:00:00.000Z",
    "fecha_proximo_pago": "2026-10-24T12:00:00.000Z"
  }
}
```

**Downgrade al Final del Período:**
```json
{
  "success": true,
  "mensaje": "Plan cambiará a premium mensual al final del período actual (24/11/2025).",
  "datos": {
    "plan_anterior": "profesional",
    "periodo_anterior": "anual",
    "plan_nuevo": "premium",
    "periodo_nuevo": "mensual",
    "precio_nuevo": 49900,
    "moneda": "COP",
    "tipo_cambio": "downgrade",
    "aplicacion": "fin_periodo",
    "fecha_efectiva": "2025-11-24T12:00:00.000Z",
    "fecha_proximo_pago": "2025-11-24T12:00:00.000Z"
  }
}
```

### Errores

**401 - No Autorizado:**
```json
{
  "error": "No autorizado - Token requerido"
}
```

**400 - Mismo Plan:**
```json
{
  "error": "Ya tienes el plan premium mensual. No hay cambios que aplicar."
}
```

**404 - Sin Suscripción:**
```json
{
  "error": "No tienes una suscripción activa. Por favor crea una suscripción primero."
}
```

**400 - Plan Básico:**
```json
{
  "error": "No puedes cambiar a plan básico. Para cancelar tu suscripción, usa la opción de cancelar."
}
```

**500 - Error Stripe:**
```json
{
  "error": "Error al actualizar suscripción en Stripe",
  "detalles": "No such subscription: sub_xxx"
}
```

## Flujo de Negocio

### UPGRADE (Precio Mayor)

1. Usuario solicita cambio a plan de mayor precio
2. Se valida suscripción activa en BD
3. Se obtiene suscripción de Stripe
4. Se actualiza suscripción en Stripe con:
   - `proration_behavior: 'create_prorations'` → Cobra diferencia prorrateada
   - `billing_cycle_anchor: 'now'` → Nuevo período comienza ahora
5. Se actualiza registro en BD:
   - `plan` y `periodo` cambian inmediatamente
   - `estado = 'activa'`
   - `fecha_fin` se actualiza al nuevo período
6. Usuario tiene acceso inmediato a nuevas features
7. Se registra en auditoría

### DOWNGRADE (Precio Menor)

1. Usuario solicita cambio a plan de menor precio
2. Se valida suscripción activa en BD
3. Se obtiene suscripción de Stripe
4. Se actualiza suscripción en Stripe con:
   - `proration_behavior: 'none'` → Sin prorrateo
   - `billing_cycle_anchor: 'unchanged'` → Cambio al final del período actual
5. Se actualiza registro en BD:
   - `estado = 'cancelar_al_final'`
   - `plan_pendiente = nuevo_plan`
   - `periodo_pendiente = nuevo_periodo`
   - `fecha_fin` se mantiene igual
6. Usuario mantiene acceso actual hasta fin de período
7. Al vencimiento, Stripe Webhook aplicará el nuevo plan
8. Se registra en auditoría

## Validaciones

### Antes de Cambiar Plan

- ✅ Usuario autenticado con JWT válido
- ✅ Usuario existe en BD
- ✅ Suscripción activa existe
- ✅ Suscripción tiene `stripe_subscription_id`
- ✅ Nuevo plan es válido (`premium` o `profesional`)
- ✅ Nuevo plan es diferente al actual
- ✅ Suscripción de Stripe está activa (no cancelada)

### Durante el Proceso

- ✅ Stripe API responde correctamente
- ✅ Actualización en BD se completa
- ✅ Si falla BD, se revierte cambio en Stripe

## Manejo de Errores

### Errores Recuperables

- **Validación fallida**: Retorna 400 con mensaje específico
- **Suscripción no encontrada**: Retorna 404
- **Plan inválido**: Retorna 400

### Errores Críticos

- **Falla Stripe + BD OK**: Usuario queda con plan nuevo en Stripe pero registro viejo en BD
  - **Solución**: Webhook de Stripe sincronizará eventualmente

- **Falla BD + Stripe OK**: Usuario tiene plan nuevo en Stripe pero registro viejo en BD
  - **Solución**: Se intenta revertir Stripe automáticamente
  - **Si falla revertir**: Log crítico, requiere intervención manual

- **Ambos fallan**: Retorna 500, no hay cambios

### Auditoría

Todos los intentos (exitosos y fallidos) se registran en tabla `AuditoriaSuscripcion` con:
- Usuario y suscripción afectada
- Plan anterior y nuevo
- Tipo de cambio (upgrade/downgrade)
- Resultado (exitoso/fallido)
- Mensaje de error si aplica

## Casos Edge

### 1. Usuario Cancela Suscripción Durante Cambio

Si el usuario cancela justo cuando cambia de plan:
- El cambio se aplica normalmente
- La cancelación prevalece sobre el cambio
- Usuario mantiene plan actual hasta fin de período

### 2. Falla de Pago Durante Upgrade

Si el usuario no tiene fondos para prorrateo inmediato:
- Stripe rechaza la actualización
- Se retorna error 500 con mensaje de Stripe
- Suscripción actual se mantiene intacta

### 3. Cambio Múltiple Rápido

Si el usuario cambia de plan múltiples veces seguidas:
- Cada cambio sobrescribe el anterior
- Solo el último cambio queda vigente
- Stripe maneja prorrateo acumulativo automáticamente

### 4. Suscripción Vencida o Pausada

Si `estado NOT IN ('activa', 'cancelar_al_final')`:
- Retorna error 404
- Usuario debe reactivar suscripción primero

## Deployment

### 1. Configurar Secrets

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx
```

### 2. Desplegar Function

```bash
supabase functions deploy cambiar-plan-stripe
```

### 3. Verificar Deployment

```bash
curl -i --location --request POST \
  'https://xxx.supabase.co/functions/v1/cambiar-plan-stripe' \
  --header 'Authorization: Bearer JWT_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{"nuevo_plan_codigo":"premium","nuevo_periodo":"mensual"}'
```

## Testing

### Test Local

```bash
# Iniciar función localmente
supabase functions serve cambiar-plan-stripe --env-file .env.local

# Hacer request de prueba
curl -i --location --request POST \
  'http://localhost:54321/functions/v1/cambiar-plan-stripe' \
  --header 'Authorization: Bearer eyJxxx' \
  --header 'Content-Type: application/json' \
  --data '{
    "nuevo_plan_codigo": "profesional",
    "nuevo_periodo": "anual"
  }'
```

### Test de Upgrade

```typescript
const { data, error } = await supabase.functions.invoke('cambiar-plan-stripe', {
  body: {
    nuevo_plan_codigo: 'profesional',
    nuevo_periodo: 'anual'
  }
})

// Verificar cambio inmediato
expect(data.datos.aplicacion).toBe('inmediata')
expect(data.datos.tipo_cambio).toBe('upgrade')
```

### Test de Downgrade

```typescript
const { data, error } = await supabase.functions.invoke('cambiar-plan-stripe', {
  body: {
    nuevo_plan_codigo: 'premium',
    nuevo_periodo: 'mensual'
  }
})

// Verificar cambio al final del período
expect(data.datos.aplicacion).toBe('fin_periodo')
expect(data.datos.tipo_cambio).toBe('downgrade')
```

## Integración Frontend

### Ejemplo con Supabase Client

```typescript
// apps/web/src/lib/servicios/suscripciones.ts

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export async function cambiarPlanSuscripcion(
  nuevoPlan: 'premium' | 'profesional',
  nuevoPeriodo: 'mensual' | 'anual'
) {
  const supabase = createClientComponentClient()

  const { data, error } = await supabase.functions.invoke('cambiar-plan-stripe', {
    body: {
      nuevo_plan_codigo: nuevoPlan,
      nuevo_periodo: nuevoPeriodo
    }
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}
```

### Uso en Componente

```typescript
// apps/web/src/app/suscripcion/cambiar-plan/page.tsx

'use client'

import { useState } from 'react'
import { cambiarPlanSuscripcion } from '@/lib/servicios/suscripciones'

export default function CambiarPlanPage() {
  const [loading, setLoading] = useState(false)

  async function handleCambiarPlan() {
    setLoading(true)
    try {
      const resultado = await cambiarPlanSuscripcion('profesional', 'anual')

      if (resultado.datos.tipo_cambio === 'upgrade') {
        alert('¡Plan actualizado! Tienes acceso inmediato.')
      } else {
        alert(`Plan cambiará al final del período: ${resultado.datos.fecha_efectiva}`)
      }

      // Recargar página o navegar
      window.location.href = '/dashboard'
    } catch (error) {
      alert('Error al cambiar plan: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleCambiarPlan} disabled={loading}>
      {loading ? 'Procesando...' : 'Cambiar a Profesional Anual'}
    </button>
  )
}
```

## Monitoreo

### Logs en Supabase Dashboard

1. Ir a `Edge Functions` → `cambiar-plan-stripe`
2. Ver `Logs` tab
3. Filtrar por errores: `level:error`

### Métricas Importantes

- **Tasa de éxito**: % de cambios exitosos vs fallidos
- **Tiempo promedio**: Debe ser < 3 segundos
- **Errores de Stripe**: Monitorear fallos de API
- **Reversiones**: Cuántas veces se revierte un cambio

## Mantenimiento

### Actualizar Precios

Si cambian los precios, actualizar constante `PRECIOS` en `index.ts`:

```typescript
const PRECIOS = {
  premium: {
    mensual: { COP: 59900, USD: 14 }, // Nuevo precio
    anual: { COP: 599000, USD: 140 }
  },
  // ...
}
```

### Agregar Nuevo Plan

1. Agregar plan a BD en tabla `Plan`
2. Actualizar constante `PRECIOS`
3. Actualizar tipos TypeScript
4. Desplegar nueva versión

## Soporte

Para problemas con esta Edge Function:

1. Revisar logs en Supabase Dashboard
2. Verificar que secrets estén configurados
3. Validar que webhook de Stripe esté funcionando
4. Revisar tabla `AuditoriaSuscripcion` para historial

---

**Última actualización**: 2025-10-24
**Versión**: 1.0.0
