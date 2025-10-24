# Quick Start: Desplegar cambiar-plan-stripe

Guía rápida de 5 minutos para desplegar la Edge Function.

---

## 1. Verificar Requisitos (1 min)

```bash
# Verificar que tienes Supabase CLI
supabase --version

# Verificar que estás logueado
supabase projects list
```

Si no tienes Supabase CLI:
```bash
npm install -g supabase
supabase login
```

---

## 2. Configurar Secrets (1 min)

```bash
# Ir al proyecto
cd /Volumes/StarkT7/Proyectos/CLIENETS/proyectos/ESCUCHODROMO/Escuchodromo\ 2/escuchodromo

# Configurar Stripe key
supabase secrets set STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXX

# Verificar
supabase secrets list
```

**Importante:** Usa `sk_test_` para staging y `sk_live_` para producción.

---

## 3. Desplegar Function (1 min)

```bash
# Desplegar
supabase functions deploy cambiar-plan-stripe

# Verificar deployment
supabase functions list
```

Deberías ver algo como:
```
┌────────────────────────┬──────────┬─────────┐
│ NAME                   │ VERSION  │ STATUS  │
├────────────────────────┼──────────┼─────────┤
│ cambiar-plan-stripe    │ 1        │ ACTIVE  │
└────────────────────────┴──────────┴─────────┘
```

---

## 4. Test Básico (1 min)

```bash
# Test sin autenticación (debe retornar 401)
curl -i --request POST \
  'https://TU_PROJECT_REF.supabase.co/functions/v1/cambiar-plan-stripe' \
  --header 'Content-Type: application/json' \
  --data '{"nuevo_plan_codigo":"premium","nuevo_periodo":"mensual"}'
```

**Respuesta esperada:**
```json
HTTP/1.1 401 Unauthorized
{"error":"No autorizado - Token requerido"}
```

✅ Si ves 401, la función está funcionando correctamente.

---

## 5. Test con Autenticación (1 min)

Necesitas un JWT token válido. Opciones:

### Opción A: Desde el Frontend
```typescript
// En tu app Next.js
const supabase = createClientComponentClient()
const { data: { session } } = await supabase.auth.getSession()
console.log('Token:', session?.access_token)
```

### Opción B: Test directo
```bash
# Reemplaza JWT_TOKEN con un token real
curl -i --request POST \
  'https://TU_PROJECT_REF.supabase.co/functions/v1/cambiar-plan-stripe' \
  --header 'Authorization: Bearer JWT_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{
    "nuevo_plan_codigo": "profesional",
    "nuevo_periodo": "anual"
  }'
```

**Respuestas posibles:**

✅ **200 OK - Cambio exitoso:**
```json
{
  "success": true,
  "mensaje": "Plan actualizado a profesional anual...",
  "datos": { ... }
}
```

⚠️ **404 - Sin suscripción:**
```json
{
  "error": "No tienes una suscripción activa..."
}
```

❌ **400 - Error de validación:**
```json
{
  "error": "Mismo plan actual / Plan inválido / etc."
}
```

---

## 6. Verificar Logs (30 seg)

```bash
# Ver logs en tiempo real
supabase functions logs cambiar-plan-stripe --follow

# Ver últimos logs
supabase functions logs cambiar-plan-stripe --limit 20

# Solo errores
supabase functions logs cambiar-plan-stripe | grep ERROR
```

---

## Problemas Comunes

### ❌ "STRIPE_SECRET_KEY no configurada"

**Causa:** Secret no está configurado

**Solución:**
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_xxx
supabase functions deploy cambiar-plan-stripe
```

### ❌ "No autorizado"

**Causa:** Token JWT inválido o expirado

**Solución:**
- Obtener nuevo token desde frontend
- Verificar que el usuario existe en BD

### ❌ "No tienes una suscripción activa"

**Causa:** Usuario no tiene registro en tabla Suscripcion

**Solución:**
```sql
-- Verificar en Supabase SQL Editor
SELECT * FROM "Suscripcion" WHERE usuario_id = 'user-id-here';

-- Si no existe, el usuario debe crear una suscripción primero
```

### ❌ Function no se despliega

**Causa:** Error de sintaxis o archivo faltante

**Solución:**
```bash
# Verificar sintaxis TypeScript
cd supabase/functions/cambiar-plan-stripe
deno check index.ts

# Si hay error, revisar output y corregir
```

---

## Siguiente Paso: Integrar en Frontend

Una vez que la función esté desplegada y funcional, integrarla en el frontend:

### 1. Crear servicio
```typescript
// apps/web/src/lib/servicios/suscripciones.ts
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

### 2. Usar en componente
```typescript
// En página de cambio de plan
async function handleCambiar() {
  try {
    const resultado = await cambiarPlanSuscripcion('profesional', 'anual')
    toast.success(resultado.mensaje)
  } catch (error) {
    toast.error('Error al cambiar plan')
  }
}
```

Ver `EJEMPLOS_FRONTEND.md` para código completo.

---

## Archivos de Referencia

- **`index.ts`** - Código principal (601 líneas)
- **`README.md`** - Documentación completa
- **`CHECKLIST.md`** - Checklist exhaustivo
- **`EJEMPLOS_FRONTEND.md`** - Ejemplos de integración
- **`cambiar-plan-stripe.test.ts`** - Tests
- **`RESUMEN_IMPLEMENTACION.md`** - Overview completo

---

## Comandos Útiles

```bash
# Redesplegar después de cambios
supabase functions deploy cambiar-plan-stripe

# Ver logs en tiempo real
supabase functions logs cambiar-plan-stripe --follow

# Listar todas las functions
supabase functions list

# Ver secrets configurados (sin mostrar valores)
supabase secrets list

# Actualizar un secret
supabase secrets set STRIPE_SECRET_KEY=nuevo_valor

# Ver información del proyecto
supabase projects list
```

---

## Checklist de Deployment ✅

- [ ] Supabase CLI instalado y configurado
- [ ] Secret `STRIPE_SECRET_KEY` configurado
- [ ] Function desplegada exitosamente
- [ ] Test básico (401) funciona
- [ ] Test con autenticación funciona
- [ ] Logs muestran actividad correcta
- [ ] Tabla `Suscripcion` tiene datos de prueba
- [ ] Frontend preparado para integración

---

## Recursos Adicionales

- **Supabase Docs:** https://supabase.com/docs/guides/functions
- **Stripe Docs:** https://stripe.com/docs/billing/subscriptions/upgrade-downgrade
- **Deno Docs:** https://deno.land/manual
- **Código en GitHub:** [Link al repo]

---

**Tiempo total estimado:** 5 minutos
**Dificultad:** Baja
**Estado:** ✅ Listo para deployment

---

¿Problemas? Revisa `README.md` o `CHECKLIST.md` para más detalles.
