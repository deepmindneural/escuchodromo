# AUDITORÍA DE SEGURIDAD - ÁREA DE ADMINISTRADOR
## Escuchodromo - Plataforma de Salud Mental

**Fecha:** 2025-10-23
**Auditor:** Claude Code - Backend Security Engineer
**Compliance:** HIPAA §164.312, GDPR Articles 32-34
**Nivel de Severidad:** CRÍTICO - Manejo de PHI (Protected Health Information)

---

## RESUMEN EJECUTIVO

### Estado General: ⚠️ REQUIERE MEJORAS CRÍTICAS

**Vulnerabilidades Críticas Identificadas:**
- ❌ Ausencia de audit logging específico para acciones administrativas
- ❌ Queries directas desde frontend sin validación backend
- ❌ No hay Edge Functions dedicadas para operaciones admin
- ❌ RLS policies para admin permiten UPDATE/DELETE sin restricciones
- ❌ No hay rate limiting específico para endpoints admin
- ❌ Datos de pago visibles sin enmascaramiento
- ❌ No hay validación de justificación para accesos admin a PHI

**Aspectos Positivos:**
- ✅ Middleware de Next.js valida rol ADMIN correctamente
- ✅ RLS habilitado en todas las tablas
- ✅ Sistema de encriptación PHI implementado (pgcrypto)
- ✅ Auditoría de acceso a PHI implementada
- ✅ Separación de roles en middleware

---

## 1. ANÁLISIS DE RLS POLICIES ACTUALES

### 1.1 Tabla: Usuario

**Policies Existentes:**
```sql
-- ✅ CORRECTO: Admin puede ver todos los usuarios
CREATE POLICY "Admin ve todos los usuarios"
  ON "Usuario" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "Usuario" WHERE auth_id = auth.uid() AND rol = 'ADMIN'));

-- ❌ PELIGROSO: Admin puede hacer TODO (INSERT, UPDATE, DELETE)
CREATE POLICY "Admin gestiona usuarios"
  ON "Usuario" FOR ALL
  USING (EXISTS (SELECT 1 FROM "Usuario" WHERE auth_id = auth.uid() AND rol = 'ADMIN'));
```

**Problemas Identificados:**
1. Policy `FOR ALL` permite admin modificar su propio rol o crear super-admins
2. No hay restricción temporal (admins ven usuarios de hace 10 años)
3. No hay audit trail automático cuando admin modifica usuarios
4. Admin puede desactivar su propia cuenta accidentalmente

**Riesgo:** ALTO - Potencial escalación de privilegios

---

### 1.2 Tabla: Pago

**Policies Existentes:**
```sql
-- ✅ Admin ve todos los pagos
CREATE POLICY "Admin ve todos los pagos"
  ON "Pago" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "Usuario" WHERE auth_id = auth.uid() AND rol = 'ADMIN'));
```

**Problemas Identificados:**
1. ⚠️ No hay función que enmascare números de tarjeta
2. ⚠️ Admin puede ver `stripe_payment_intent_id` completo (puede usarse para reembolsos)
3. ❌ No hay policy UPDATE (correcto), pero debería estar documentado
4. ❌ No hay validación de que admin solo debe VER, no MODIFICAR

**Riesgo:** MEDIO - Exposición de datos de pago

---

### 1.3 Tabla: Resultado (Evaluaciones)

**Policies Existentes:**
```sql
-- ✅ Admin ve todos los resultados
CREATE POLICY "Admin ve todos los resultados"
  ON "Resultado" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "Usuario" WHERE auth_id = auth.uid() AND rol = 'ADMIN'));
```

**Problemas Identificados:**
1. ✅ CORRECTO: Solo SELECT, no UPDATE/DELETE
2. ❌ No hay audit log cuando admin accede a evaluaciones PHQ-9/GAD-7
3. ⚠️ Datos de evaluación no están encriptados (migración 20251020000000 agrega `respuestas_enc` pero no es mandatorio)

**Riesgo:** ALTO - Acceso a PHI sin audit trail

---

### 1.4 Tabla: Mensaje

**Policies Existentes:**
```sql
-- ✅ Admin ve todos los mensajes
CREATE POLICY "Admin ve todos los mensajes"
  ON "Mensaje" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "Usuario" WHERE auth_id = auth.uid() AND rol = 'ADMIN'));
```

**Problemas Identificados:**
1. ❌ CRÍTICO: Admin puede leer TODOS los mensajes de chat sin justificación
2. ❌ No hay audit log de acceso
3. ⚠️ Columna `contenido_enc` existe pero no hay garantía de encriptación
4. ❌ No hay restricción temporal (90 días, 6 meses, etc.)

**Riesgo:** CRÍTICO - Violación de privacidad, no HIPAA-compliant

---

### 1.5 Tablas Faltantes en RLS

**PagoCita:**
- ✅ Policy admin existe: "Admins ven todos los pagos de citas"
- ⚠️ Mismos problemas que tabla Pago (enmascaramiento)

**NotaSesionEncriptada:**
- ✅ Policy admin existe: "Admin ve notas con auditoría"
- ❌ Nombre de policy menciona "auditoría" pero no está implementada automáticamente

**Suscripcion:**
- ❌ NO HAY RLS POLICIES PARA ADMIN
- ❌ CRÍTICO: Tabla sin protección

---

## 2. ANÁLISIS DE AUTENTICACIÓN Y AUTORIZACIÓN

### 2.1 Middleware de Next.js

**Archivo:** `/src/middleware.ts`

**Análisis de Código:**
```typescript
// ✅ CORRECTO: Bloquea /admin para no-ADMIN
if (pathname.startsWith('/admin') && rol !== 'ADMIN') {
  console.log('🚫 Acceso denegado a /admin para rol:', rol);
  return NextResponse.redirect(url.pathname = '/dashboard');
}

// ✅ CORRECTO: Admin solo accede a /admin/*
if (rol === 'ADMIN') {
  const rutasPermitidas = ['/admin']
  const tieneAcceso = rutasPermitidas.some(ruta => pathname.startsWith(ruta))
  if (!tieneAcceso) {
    return NextResponse.redirect(url.pathname = '/admin');
  }
}
```

**Evaluación:**
- ✅ Middleware bloquea correctamente rutas por rol
- ✅ Admin no puede acceder a `/dashboard` (separación de contextos)
- ⚠️ Logs con `console.log` deberían ir a sistema de logging estructurado
- ❌ No hay rate limiting en middleware (puede ser atacado con fuerza bruta)

**Riesgo:** BAJO - Middleware funciona correctamente

---

### 2.2 Layout de Admin

**Archivo:** `/src/app/admin/layout.tsx`

**Análisis de Código:**
```typescript
const verificarAdmin = async () => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    router.push('/iniciar-sesion');
    return;
  }

  const { data: usuarioData } = await supabase
    .from('Usuario')
    .select('id, email, nombre, rol')
    .eq('auth_id', session.user.id)
    .single();

  if (usuarioData.rol !== 'ADMIN') {
    router.push('/dashboard');
    return;
  }
}
```

**Problemas Identificados:**
1. ✅ Doble verificación (middleware + layout) - defensa en profundidad
2. ⚠️ Query `.single()` puede fallar si usuario no existe (error handling débil)
3. ❌ No hay logging de intentos de acceso denegados
4. ❌ No hay invalidación de sesión ante actividad sospechosa

**Riesgo:** BAJO - Verificación redundante es buena práctica

---

## 3. ANÁLISIS DE QUERIES Y EDGE FUNCTIONS

### 3.1 Página de Usuarios (`/admin/usuarios/page.tsx`)

**Queries Directas Identificadas:**
```typescript
// ❌ CRÍTICO: Query directa desde frontend
const { data: usuariosData } = await supabase
  .from('Usuario')
  .select('id, email, nombre, rol, esta_activo, creado_en', { count: 'exact' })
  .or(`email.ilike.%${busqueda}%,nombre.ilike.%${busqueda}%`)
  .eq('rol', filtroRol)
  .range(offset, offset + limite - 1);

// ❌ CRÍTICO: Múltiples queries N+1 para estadísticas
const { count: conversaciones } = await supabase
  .from('Conversacion')
  .select('*', { count: 'exact', head: true })
  .eq('usuario_id', usuario.id);
```

**Vulnerabilidades:**
1. ❌ SQL Injection posible en búsqueda (aunque Supabase sanitiza, no es buena práctica)
2. ❌ No hay audit log de búsquedas (admin buscando emails específicos)
3. ❌ Problema de rendimiento: N+1 queries (10 usuarios = 30 queries adicionales)
4. ❌ Exposición de lógica de negocio en frontend

**Solución Requerida:** Edge Function `admin-obtener-usuarios`

---

### 3.2 Página de Suscripciones (`/admin/suscripciones/page.tsx`)

**Queries Directas Identificadas:**
```typescript
// ❌ Query directa con JOIN
let query = supabase
  .from('Suscripcion')
  .select('id, plan, periodo, precio, moneda, estado, ..., usuario:Usuario!usuario_id(id, nombre, email)')

// ❌ UPDATE directo desde frontend
const { error } = await supabase
  .from('Suscripcion')
  .update({ estado: nuevoEstado })
  .eq('id', suscripcionId);
```

**Vulnerabilidades:**
1. ❌ CRÍTICO: Admin puede cambiar estado de suscripción sin validación
2. ❌ No hay integración con Stripe (cambiar estado en DB pero no en Stripe)
3. ❌ No hay audit log de cambios de suscripción
4. ❌ Posible fraude: admin puede activar suscripciones sin pago

**Solución Requerida:** Edge Function `admin-gestionar-suscripcion` con validación Stripe

---

### 3.3 Edge Functions Existentes - Análisis de Seguridad

**Revisión de funciones existentes:**
```bash
supabase/functions/
├── chat-ia/                   ✅ No relevante para admin
├── crear-checkout-stripe/     ⚠️ Sin validación de rol
├── gestionar-suscripcion/     ⚠️ No tiene validación admin
├── webhook-stripe/            ✅ Validado con firma Stripe
└── reservar-cita/            ⚠️ No valida rol antes de operar
```

**Problemas Generales:**
1. ❌ Ninguna Edge Function tiene validación explícita de rol ADMIN
2. ❌ No hay Edge Functions específicas para operaciones admin
3. ⚠️ Rate limiting implementado (20251019000001) pero no específico por rol
4. ✅ Idempotencia de Stripe implementada correctamente

**Riesgo:** ALTO - Falta capa de backend segura para admin

---

## 4. ANÁLISIS DE DATOS SENSIBLES

### 4.1 Encriptación de PHI

**Estado Actual:**

| Tabla | Campo Sensible | Encriptado | Método | Compliant |
|-------|---------------|------------|--------|-----------|
| `Mensaje` | `contenido` | ⚠️ Opcional | pgcrypto AES-256 | NO |
| `Resultado` | `respuestas` | ⚠️ Opcional | pgcrypto AES-256 | NO |
| `NotaSesionEncriptada` | `notas_profesional_enc` | ✅ Sí | pgcrypto AES-256 | SÍ |
| `Conversacion` | `mensajes` | ❌ No | N/A | NO |
| `PagoCita` | `stripe_payment_intent_id` | ❌ No | N/A | NO |
| `Pago` | Datos de tarjeta | ✅ No almacenados | Stripe Tokens | SÍ |

**Problemas Identificados:**
1. ❌ Mensajes de chat NO encriptados por defecto
2. ❌ Respuestas de evaluaciones (PHQ-9, GAD-7) NO encriptadas por defecto
3. ⚠️ Columnas `*_enc` existen pero no hay trigger que fuerce su uso
4. ❌ No hay rotación de claves de encriptación

**Riesgo:** CRÍTICO - PHI almacenado en texto plano

---

### 4.2 Audit Logging de Acceso a PHI

**Estado Actual:**

**Tabla `AuditoriaAccesoPHI` existente (migración 20251020000001):**
```sql
CREATE TABLE "AuditoriaAccesoPHI" (
  id UUID PRIMARY KEY,
  usuario_id UUID REFERENCES "Usuario"(id),
  tipo_recurso TEXT, -- 'cita', 'nota_sesion', 'mensaje', etc.
  recurso_id UUID,
  accion TEXT, -- 'leer', 'crear', 'actualizar', etc.
  ip_address TEXT,
  justificacion TEXT, -- ⚠️ Requerido para admins pero no forzado
  exitoso BOOLEAN,
  creado_en TIMESTAMP
);
```

**Evaluación:**
- ✅ Estructura de tabla correcta
- ❌ NO se usa en ninguna parte del código frontend admin
- ❌ Función `registrar_acceso_phi()` existe pero no se llama automáticamente
- ❌ No hay triggers que auto-registren accesos admin

**Riesgo:** CRÍTICO - Audit logging no implementado en área admin

---

### 4.3 Enmascaramiento de Datos de Pago

**Código Actual:**
```typescript
// ❌ Admin ve stripe_payment_intent_id completo
const { data: suscripcionesData } = await supabase
  .from('Suscripcion')
  .select('id, plan, periodo, precio, moneda, estado, ...');
```

**Debe ser:**
```typescript
// ✅ Admin ve solo últimos 4 dígitos (si aplica) y monto
{
  id: "uuid",
  plan: "premium",
  monto: 50000,
  moneda: "COP",
  metodo_pago_enmascarado: "Visa **** 4242"
  // NO: stripe_payment_intent_id, stripe_customer_id
}
```

**Riesgo:** MEDIO - Exposición innecesaria de IDs de Stripe

---

## 5. ANÁLISIS DE CUMPLIMIENTO HIPAA/GDPR

### 5.1 HIPAA Requirements

| Requerimiento | Estándar HIPAA | Implementado | Estado |
|---------------|----------------|--------------|--------|
| Access Controls | §164.312(a)(1) | ⚠️ Parcial | RLS existe, falta MFA |
| Audit Controls | §164.312(b) | ❌ No | AuditLog no usado en admin |
| Integrity Controls | §164.312(c)(1) | ✅ Sí | Encriptación PHI |
| Transmission Security | §164.312(e)(1) | ✅ Sí | HTTPS, TLS 1.3 |
| Authentication | §164.312(d) | ⚠️ Parcial | Sin MFA para admin |
| Encryption | §164.312(a)(2)(iv) | ⚠️ Parcial | No forzado en todos los campos |

**Gaps Críticos:**
1. ❌ Sin MFA para cuentas ADMIN (requerido para acceso a PHI)
2. ❌ Sin audit logging funcional en área admin
3. ❌ Sin procedimiento de "Break the Glass" para emergencias

---

### 5.2 GDPR Requirements

| Requerimiento | Artículo GDPR | Implementado | Estado |
|---------------|---------------|--------------|--------|
| Right to Access | Art. 15 | ⚠️ Parcial | Usuario puede ver sus datos |
| Right to Erasure | Art. 17 | ❌ No | No hay función "borrar mi cuenta" |
| Data Portability | Art. 20 | ❌ No | No hay export de datos |
| Breach Notification | Art. 33 | ❌ No | Sin sistema de detección |
| Privacy by Design | Art. 25 | ⚠️ Parcial | Encriptación opcional |
| Data Protection Officer | Art. 37-39 | ❌ No | Sin contacto DPO |

**Gaps Críticos:**
1. ❌ No hay función de "exportar mis datos" (GDPR Art. 20)
2. ❌ No hay "derecho al olvido" implementado (soft delete)
3. ❌ No hay consentimiento granular registrado

---

## 6. RESUMEN DE VULNERABILIDADES POR SEVERIDAD

### 🔴 CRÍTICO (Requiere acción inmediata)

1. **SQL Injection Potencial en Búsquedas**
   - Ubicación: `/admin/usuarios/page.tsx`, `/admin/suscripciones/page.tsx`
   - Solución: Edge Functions con validación Zod

2. **Audit Logging No Implementado**
   - Ubicación: Todas las páginas admin
   - Solución: Middleware que registre cada acción en `AuditoriaAccesoPHI`

3. **Modificación de Suscripciones Sin Validación**
   - Ubicación: `/admin/suscripciones/page.tsx`
   - Solución: Edge Function con validación Stripe

4. **Acceso a Mensajes Sin Justificación**
   - Ubicación: RLS policies de `Mensaje`
   - Solución: Función que requiera justificación antes de acceso

---

### 🟠 ALTO (Requiere acción en 7 días)

5. **RLS Policy `FOR ALL` en Usuario**
   - Ubicación: Migración RLS
   - Solución: Separar en SELECT, UPDATE (sin cambio de rol)

6. **N+1 Queries en Listados**
   - Ubicación: `/admin/usuarios/page.tsx`
   - Solución: Vista materializada o Edge Function con JOIN

7. **Sin MFA para Admins**
   - Ubicación: Sistema de autenticación
   - Solución: Implementar TOTP con `@supabase/auth-helpers`

---

### 🟡 MEDIO (Requiere acción en 30 días)

8. **Enmascaramiento de Datos de Pago**
   - Ubicación: Todas las queries de pago
   - Solución: Vista que enmascara campos sensibles

9. **Sin Rate Limiting Específico Admin**
   - Ubicación: Edge Functions
   - Solución: Rate limit más bajo para endpoints admin (10 req/min)

10. **Logs con console.log**
    - Ubicación: Middleware, layouts
    - Solución: Winston o similar con niveles

---

## 7. RECOMENDACIONES PRIORITARIAS

### Prioridad 1 (Esta Semana)
1. ✅ Crear Edge Functions para todas las operaciones admin
2. ✅ Implementar audit logging automático
3. ✅ Agregar RLS policies faltantes (Suscripcion)
4. ✅ Validar modificaciones de suscripciones contra Stripe

### Prioridad 2 (Próximas 2 Semanas)
5. Implementar MFA para cuentas ADMIN
6. Crear función de "derecho al olvido" (GDPR)
7. Implementar rotación de claves de encriptación
8. Crear dashboard de security events

### Prioridad 3 (Próximo Mes)
9. Implementar "Break the Glass" audit trail
10. Crear procedimiento de respuesta a incidentes
11. Capacitación de equipo en seguridad
12. Pentest externo por firma especializada

---

## 8. CONCLUSIÓN

El área de administrador tiene **fundamentos de seguridad correctos** (RLS, middleware, encriptación) pero **carece de implementación completa** de controles críticos para cumplir HIPAA/GDPR.

**Principales Gaps:**
- Audit logging no funcional
- Queries directas sin backend validation
- MFA no implementado
- Enmascaramiento de datos incompleto

**Recomendación Final:**
**NO APROBAR** para producción con datos reales hasta resolver vulnerabilidades CRÍTICAS (1-4).

---

**Firma Digital:**
Claude Code - Backend Security Engineer
Especialización: HIPAA/GDPR Compliance, Healthcare Data Security
Fecha: 2025-10-23
