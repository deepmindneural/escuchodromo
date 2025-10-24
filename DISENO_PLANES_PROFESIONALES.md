# DISEÑO DE SISTEMA DE PLANES PARA PROFESIONALES

**Fecha:** 2025-10-24
**Agente:** Claude (Agente 3 - Diseño de Arquitectura)
**Estado:** DISEÑO COMPLETO - PENDIENTE APROBACIÓN

---

## 1. ANÁLISIS DEL SISTEMA ACTUAL

### 1.1. Esquema de Base de Datos Existente

#### Tabla `PerfilProfesional`
Según la migración `20250120000000_profesionales_y_citas.sql`, la tabla existe con:

```sql
CREATE TABLE "PerfilProfesional" (
  id UUID PRIMARY KEY,
  usuario_id UUID REFERENCES "Usuario"(id) UNIQUE NOT NULL,

  -- Información profesional
  titulo_profesional TEXT NOT NULL,
  numero_licencia TEXT NOT NULL UNIQUE,
  universidad TEXT,
  anos_experiencia INTEGER DEFAULT 0,
  especialidades TEXT[],
  biografia TEXT,
  idiomas TEXT[] DEFAULT ARRAY['es'],

  -- Verificación y aprobación
  documentos_verificados BOOLEAN DEFAULT false,
  perfil_aprobado BOOLEAN DEFAULT false,
  aprobado_por UUID REFERENCES "Usuario"(id),
  aprobado_en TIMESTAMP,
  notas_admin TEXT,

  -- Tarifa
  tarifa_por_sesion FLOAT,
  moneda TEXT DEFAULT 'COP',

  -- Estadísticas
  total_pacientes INTEGER DEFAULT 0,
  total_citas INTEGER DEFAULT 0,
  calificacion_promedio FLOAT DEFAULT 0,

  -- Metadata
  creado_en TIMESTAMP DEFAULT now(),
  actualizado_en TIMESTAMP DEFAULT now()
);
```

#### Tabla `Suscripcion` (Actual - Solo Pacientes)
```sql
CREATE TABLE "Suscripcion" (
  id UUID PRIMARY KEY,
  usuario_id UUID REFERENCES "Usuario"(id) UNIQUE NOT NULL,

  -- Plan (actualmente: basico, premium, profesional)
  plan TEXT NOT NULL CHECK (plan IN ('basico', 'premium', 'profesional')),
  periodo TEXT NOT NULL DEFAULT 'mensual',

  -- Estado y fechas
  estado TEXT NOT NULL DEFAULT 'activa',
  fecha_inicio TIMESTAMP DEFAULT now(),
  fecha_fin TIMESTAMP NOT NULL,

  -- Integración con Stripe
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  ...
);
```

### 1.2. Sistema de Planes para Usuarios (Pacientes)

**Archivo:** `/src/lib/planes.ts`

```typescript
export type TipoPlan = 'basico' | 'premium' | 'profesional' | null;

const limitesPorPlan = {
  null: {
    mensajesChat: 10,
    evaluacionesMes: 1,
    sesionesTerapeuticas: 0
  },
  basico: {
    mensajesChat: 100,
    evaluacionesMes: 5,
    sesionesTerapeuticas: 0
  },
  premium: {
    mensajesChat: 'ilimitado',
    evaluacionesMes: 'ilimitado',
    sesionesTerapeuticas: 0
  },
  profesional: {
    mensajesChat: 'ilimitado',
    evaluacionesMes: 'ilimitado',
    sesionesTerapeuticas: 4  // Para PACIENTES
  }
};
```

**Precios actuales (usuarios):**
- Básico: $29,900 COP / $7.99 USD
- Premium: $59,900 COP / $14.99 USD
- Profesional: $129,900 COP / $32.99 USD

### 1.3. Hallazgos Clave

1. **Campo faltante:** `PerfilProfesional` NO tiene campo `suscripcion_activa` o similar
2. **Confusión de nombres:** El plan "profesional" en `Suscripcion` es para PACIENTES, no profesionales
3. **Relación 1:1:** `Suscripcion.usuario_id` tiene constraint UNIQUE - solo una suscripción activa por usuario
4. **No hay diferenciación:** No existe forma de distinguir suscripciones de pacientes vs. profesionales

---

## 2. PROPUESTA DE PLANES PARA PROFESIONALES

### 2.1. Definición de Planes

#### Plan 1: INICIAL (Starter)
**Precio:** $69,900 COP / $17.99 USD / mes
**Público objetivo:** Psicólogos recién graduados o freelancers individuales

**Características:**
- ✅ Hasta **10 pacientes activos** simultáneos
- ✅ **20 horas de sesión/mes** (registro y gestión)
- ✅ Dashboard básico de métricas
- ✅ Agenda digital y recordatorios automáticos
- ✅ Historial clínico básico por paciente
- ✅ Notas de sesión privadas
- ✅ Videollamadas integradas (hasta 20 sesiones/mes)
- ❌ Sin prioridad en listado de búsqueda
- ❌ Sin analytics avanzados
- ❌ Sin insignia verificado

#### Plan 2: CRECIMIENTO (Growth)
**Precio:** $149,900 COP / $39.99 USD / mes
**Público objetivo:** Profesionales establecidos con consulta regular

**Características:**
- ✅ Hasta **50 pacientes activos** simultáneos
- ✅ **80 horas de sesión/mes**
- ✅ Dashboard avanzado con analytics
- ✅ Agenda ilimitada + integraciones (Google Calendar)
- ✅ Historial clínico completo con timeline
- ✅ Notas de sesión + plantillas personalizadas
- ✅ Videollamadas ilimitadas
- ✅ **Prioridad media** en listado de búsqueda
- ✅ **Insignia "Verificado"**
- ✅ Reportes mensuales de progreso de pacientes
- ✅ Exportar datos en PDF/CSV
- ❌ Sin prioridad máxima
- ❌ Sin API para integraciones

#### Plan 3: PROFESIONAL PLUS (Enterprise)
**Precio:** $299,900 COP / $79.99 USD / mes
**Público objetivo:** Clínicas, centros de salud mental, profesionales high-volume

**Características:**
- ✅ **Pacientes ilimitados**
- ✅ **Sesiones ilimitadas**
- ✅ Dashboard completo con BI (Business Intelligence)
- ✅ Agenda multi-calendario (para equipos)
- ✅ Historial clínico + integraciones con EHR externos
- ✅ Notas avanzadas + AI-assisted summaries (opcional)
- ✅ Videollamadas ilimitadas + grabación (con consentimiento)
- ✅ **Prioridad MÁXIMA** en listado (aparece primero)
- ✅ **Insignia "Destacado Premium"**
- ✅ Analytics predictivos y recomendaciones IA
- ✅ Exportar + API para integraciones
- ✅ **Soporte prioritario 24/7**
- ✅ **Asistente de IA** para generar reportes clínicos
- ✅ **Facturación automatizada** para pacientes

#### Plan 4: TRIAL (Prueba Gratuita)
**Precio:** GRATIS por 14 días
**Características:**
- ✅ Hasta **3 pacientes activos**
- ✅ **10 horas de sesión** durante el trial
- ✅ Todas las funciones de plan INICIAL
- ⏱️ **Se convierte automáticamente a INICIAL** después de 14 días (requiere pago)
- ❌ Sin insignias

### 2.2. Tabla Comparativa

| Característica | Trial | Inicial | Crecimiento | Plus |
|---|---|---|---|---|
| **Precio/mes (COP)** | Gratis 14d | $69,900 | $149,900 | $299,900 |
| **Precio/mes (USD)** | Gratis 14d | $17.99 | $39.99 | $79.99 |
| **Pacientes activos** | 3 | 10 | 50 | Ilimitado |
| **Horas sesión/mes** | 10 | 20 | 80 | Ilimitado |
| **Videollamadas** | 10 | 20 | Ilimitado | Ilimitado + grabación |
| **Analytics** | Básico | Básico | Avanzado | BI completo + IA |
| **Prioridad búsqueda** | ❌ | ❌ | Media | Máxima |
| **Insignias** | ❌ | ❌ | Verificado | Destacado Premium |
| **Soporte** | Email | Email | Email + chat | Prioritario 24/7 |
| **API** | ❌ | ❌ | ❌ | ✅ |
| **IA Assistant** | ❌ | ❌ | ❌ | ✅ |

---

## 3. DISEÑO DE ARQUITECTURA DE BASE DE DATOS

### 3.1. Opción Recomendada: Misma Tabla `Suscripcion` con `tipo_usuario`

**Razón:**
- Evita duplicación de lógica de pagos/facturación
- Mantiene sincronización con Stripe
- Facilita auditoría y reportes globales

#### Migración Propuesta

```sql
-- ==========================================
-- MIGRACIÓN: SOPORTE PARA SUSCRIPCIONES DE PROFESIONALES
-- Fecha: 2025-10-24
-- ==========================================

-- 1. Agregar columna tipo_usuario a Suscripcion
ALTER TABLE "Suscripcion"
  ADD COLUMN tipo_usuario TEXT NOT NULL DEFAULT 'paciente'
  CHECK (tipo_usuario IN ('paciente', 'profesional'));

-- 2. Crear índice para consultas eficientes
CREATE INDEX idx_suscripcion_tipo_usuario ON "Suscripcion"(tipo_usuario);
CREATE INDEX idx_suscripcion_tipo_estado ON "Suscripcion"(tipo_usuario, estado);

-- 3. Actualizar CHECK constraint del plan para incluir planes de profesionales
ALTER TABLE "Suscripcion"
  DROP CONSTRAINT IF EXISTS "Suscripcion_plan_check";

ALTER TABLE "Suscripcion"
  ADD CONSTRAINT "Suscripcion_plan_check"
  CHECK (
    (tipo_usuario = 'paciente' AND plan IN ('basico', 'premium', 'profesional_paciente')) OR
    (tipo_usuario = 'profesional' AND plan IN ('trial', 'inicial', 'crecimiento', 'plus'))
  );

-- 4. Remover constraint UNIQUE en usuario_id para permitir
--    una suscripción de paciente Y una de profesional
ALTER TABLE "Suscripcion"
  DROP CONSTRAINT IF EXISTS "Suscripcion_usuario_id_key";

-- 5. Crear constraint UNIQUE compuesto
ALTER TABLE "Suscripcion"
  ADD CONSTRAINT suscripcion_usuario_tipo_unico
  UNIQUE (usuario_id, tipo_usuario);

-- 6. Agregar campos específicos para profesionales
ALTER TABLE "Suscripcion"
  ADD COLUMN limite_pacientes INTEGER,           -- NULL = ilimitado
  ADD COLUMN limite_horas_mes INTEGER,           -- NULL = ilimitado
  ADD COLUMN prioridad_listado TEXT DEFAULT 'ninguna'
    CHECK (prioridad_listado IN ('ninguna', 'media', 'maxima')),
  ADD COLUMN insignia TEXT DEFAULT 'ninguna'
    CHECK (insignia IN ('ninguna', 'verificado', 'destacado_premium')),
  ADD COLUMN acceso_api BOOLEAN DEFAULT false,
  ADD COLUMN acceso_ia_assistant BOOLEAN DEFAULT false;

-- 7. Agregar campo de tracking de uso
ALTER TABLE "Suscripcion"
  ADD COLUMN uso_mes_actual JSONB DEFAULT '{
    "pacientes_activos": 0,
    "horas_sesion_usadas": 0,
    "ultima_actualizacion": null
  }';

-- 8. Agregar relación opcional con PerfilProfesional
ALTER TABLE "PerfilProfesional"
  ADD COLUMN suscripcion_profesional_id UUID REFERENCES "Suscripcion"(id);

CREATE INDEX idx_perfil_profesional_suscripcion
  ON "PerfilProfesional"(suscripcion_profesional_id);

-- 9. Comentarios para documentación
COMMENT ON COLUMN "Suscripcion".tipo_usuario IS
  'Tipo de usuario: paciente (acceso a IA/chat) o profesional (panel terapeutas)';
COMMENT ON COLUMN "Suscripcion".limite_pacientes IS
  'Límite de pacientes activos para profesionales (NULL = ilimitado)';
COMMENT ON COLUMN "Suscripcion".uso_mes_actual IS
  'Tracking de uso mensual para validar límites del plan';
```

### 3.2. Nueva Tabla: `LimitesPlan` (Configuración Dinámica)

En lugar de hardcodear límites en código, usamos tabla de configuración:

```sql
CREATE TABLE "LimitesPlan" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo_usuario TEXT NOT NULL CHECK (tipo_usuario IN ('paciente', 'profesional')),
  codigo_plan TEXT NOT NULL,

  -- Configuración de límites
  limite_pacientes INTEGER,           -- Solo para profesionales
  limite_horas_mes INTEGER,           -- Solo para profesionales
  limite_mensajes INTEGER,            -- Solo para pacientes
  limite_evaluaciones INTEGER,        -- Solo para pacientes
  limite_sesiones_terapeuticas INTEGER, -- Para pacientes

  -- Features booleanas
  acceso_api BOOLEAN DEFAULT false,
  acceso_ia_assistant BOOLEAN DEFAULT false,
  exportar_reportes BOOLEAN DEFAULT false,
  soporte_prioritario BOOLEAN DEFAULT false,
  videollamada_grabacion BOOLEAN DEFAULT false,

  -- Metadata
  prioridad_listado TEXT DEFAULT 'ninguna',
  insignia TEXT DEFAULT 'ninguna',

  -- Control
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT now(),
  actualizado_en TIMESTAMP DEFAULT now(),

  UNIQUE(tipo_usuario, codigo_plan)
);

-- Seed de planes para profesionales
INSERT INTO "LimitesPlan"
  (tipo_usuario, codigo_plan, limite_pacientes, limite_horas_mes, prioridad_listado, insignia, acceso_api, acceso_ia_assistant)
VALUES
  ('profesional', 'trial', 3, 10, 'ninguna', 'ninguna', false, false),
  ('profesional', 'inicial', 10, 20, 'ninguna', 'ninguna', false, false),
  ('profesional', 'crecimiento', 50, 80, 'media', 'verificado', false, false),
  ('profesional', 'plus', NULL, NULL, 'maxima', 'destacado_premium', true, true);
```

---

## 4. FLUJOS DE USUARIO

### 4.1. Flujo de Onboarding para Nuevos Profesionales

```
┌─────────────────────────────────────────────────────────────┐
│ 1. REGISTRO INICIAL                                         │
│    Usuario se registra → Selecciona "Soy Profesional"      │
│    ↓                                                         │
│    Se crea Usuario con rol='TERAPEUTA'                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. COMPLETAR PERFIL PROFESIONAL                             │
│    • Subir título profesional                               │
│    • Número de licencia                                     │
│    • Especialidades                                         │
│    • Biografía                                              │
│    ↓                                                         │
│    Se crea PerfilProfesional (perfil_aprobado=false)        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. ACTIVAR TRIAL AUTOMÁTICO (14 días)                       │
│    ✅ Se crea Suscripcion:                                  │
│       - plan='trial'                                        │
│       - tipo_usuario='profesional'                          │
│       - fecha_fin = now() + 14 días                         │
│       - estado='activa'                                     │
│    ↓                                                         │
│    Profesional puede empezar a usar la plataforma           │
│    (límite: 3 pacientes, 10 horas)                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. VERIFICACIÓN POR ADMIN (Paralelo)                        │
│    Admin revisa documentos en /admin/profesionales/[id]     │
│    ↓                                                         │
│    Si aprueba: perfil_aprobado=true, documentos_verificados=true│
│    Si rechaza: Notifica al profesional con motivo           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. FIN DEL TRIAL (Día 14)                                   │
│    Opciones:                                                │
│    A) Profesional compra plan → Redirige a /checkout       │
│    B) No compra → Suscripción pasa a estado='vencida'      │
│                   Acceso bloqueado (modo read-only)         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. CHECKOUT Y ACTIVACIÓN                                    │
│    Profesional elige plan (Inicial/Crecimiento/Plus)        │
│    ↓                                                         │
│    Se crea checkout session en Stripe                       │
│    ↓                                                         │
│    Webhook de Stripe actualiza Suscripcion:                 │
│    - plan='inicial|crecimiento|plus'                        │
│    - estado='activa'                                        │
│    - stripe_subscription_id                                 │
│    ↓                                                         │
│    ✅ Acceso completo según plan                            │
└─────────────────────────────────────────────────────────────┘
```

### 4.2. Validación de Límites (Middleware)

Crear función RPC `validar_limite_profesional`:

```sql
CREATE OR REPLACE FUNCTION validar_limite_profesional(
  p_profesional_id UUID,
  p_tipo_limite TEXT -- 'pacientes' | 'horas'
)
RETURNS JSONB AS $$
DECLARE
  v_suscripcion RECORD;
  v_limites RECORD;
  v_uso_actual JSONB;
  v_resultado JSONB;
BEGIN
  -- 1. Obtener suscripción activa del profesional
  SELECT s.* INTO v_suscripcion
  FROM "Suscripcion" s
  WHERE s.usuario_id = p_profesional_id
    AND s.tipo_usuario = 'profesional'
    AND s.estado = 'activa'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'permitido', false,
      'motivo', 'sin_suscripcion_activa'
    );
  END IF;

  -- 2. Obtener límites del plan
  SELECT lp.* INTO v_limites
  FROM "LimitesPlan" lp
  WHERE lp.tipo_usuario = 'profesional'
    AND lp.codigo_plan = v_suscripcion.plan
    AND lp.activo = true;

  -- 3. Obtener uso actual
  v_uso_actual := v_suscripcion.uso_mes_actual;

  -- 4. Validar según tipo de límite
  IF p_tipo_limite = 'pacientes' THEN
    -- Si limite_pacientes es NULL = ilimitado
    IF v_limites.limite_pacientes IS NULL THEN
      RETURN jsonb_build_object('permitido', true, 'ilimitado', true);
    END IF;

    -- Verificar si alcanzó el límite
    IF (v_uso_actual->>'pacientes_activos')::INTEGER >= v_limites.limite_pacientes THEN
      RETURN jsonb_build_object(
        'permitido', false,
        'motivo', 'limite_alcanzado',
        'limite', v_limites.limite_pacientes,
        'usado', (v_uso_actual->>'pacientes_activos')::INTEGER
      );
    END IF;

    RETURN jsonb_build_object('permitido', true, 'disponible',
      v_limites.limite_pacientes - (v_uso_actual->>'pacientes_activos')::INTEGER
    );

  ELSIF p_tipo_limite = 'horas' THEN
    IF v_limites.limite_horas_mes IS NULL THEN
      RETURN jsonb_build_object('permitido', true, 'ilimitado', true);
    END IF;

    IF (v_uso_actual->>'horas_sesion_usadas')::INTEGER >= v_limites.limite_horas_mes THEN
      RETURN jsonb_build_object(
        'permitido', false,
        'motivo', 'limite_horas_alcanzado',
        'limite', v_limites.limite_horas_mes,
        'usado', (v_uso_actual->>'horas_sesion_usadas')::INTEGER
      );
    END IF;

    RETURN jsonb_build_object('permitido', true);
  END IF;

  RETURN jsonb_build_object('permitido', false, 'motivo', 'tipo_limite_invalido');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 5. CASOS EDGE Y MANEJO DE EXCEPCIONES

### 5.1. ¿Qué pasa si profesional cancela su suscripción?

**Escenario:** Profesional tiene 15 pacientes activos, cancela suscripción.

**Comportamiento:**
1. **Modo gracia (7 días):**
   - Suscripción pasa a `estado='cancelar_al_final'`
   - Profesional sigue teniendo acceso hasta `fecha_fin`
   - Se muestra banner: "Tu plan expira en X días"

2. **Al vencer (fecha_fin alcanzada):**
   - Suscripción pasa a `estado='vencida'`
   - **Pacientes existentes NO se eliminan**
   - Profesional entra en **modo solo lectura**:
     - ✅ Puede VER historial de pacientes
     - ✅ Puede VER citas pasadas
     - ❌ NO puede agendar nuevas citas
     - ❌ NO puede aceptar nuevos pacientes

3. **Reactivación:**
   - Si reactiva antes de 30 días: Recupera acceso completo
   - Si pasa 30 días: Datos archivados, requiere contacto con soporte

### 5.2. ¿Qué pasa si profesional alcanza límite de pacientes?

**Escenario:** Plan Inicial (10 pacientes), ya tiene 10, nuevo paciente intenta agendar.

**Comportamiento:**
1. Sistema valida límite con `validar_limite_profesional()`
2. Si alcanzó límite:
   - ❌ Rechaza nueva reserva de cita
   - ✉️ Envía notificación al profesional: "Has alcanzado el límite de pacientes. Actualiza tu plan"
   - 🔔 Muestra modal al paciente: "Este profesional no tiene disponibilidad. Busca otro profesional"

**UI en panel profesional:**
```tsx
// En /profesional/pacientes
<AlertWarning>
  Has alcanzado tu límite de pacientes (10/10).
  <Button href="/profesional/planes">Actualizar Plan</Button>
</AlertWarning>
```

### 5.3. ¿Qué pasa si profesional downgrade su plan?

**Escenario:** Profesional está en plan Crecimiento (50 pacientes), tiene 30 pacientes, hace downgrade a Inicial (10 pacientes).

**Comportamiento:**
1. **Validación en checkout:**
   ```typescript
   const { count: pacientesActivos } = await supabase
     .from('Cita')
     .select('paciente_id', { count: 'exact' })
     .eq('profesional_id', profesionalId)
     .in('estado', ['confirmada', 'pendiente'])
     .gte('fecha_hora', new Date().toISOString());

   if (pacientesActivos > nuevoLimite) {
     throw new Error(
       `No puedes hacer downgrade. Tienes ${pacientesActivos} pacientes activos,
        el plan Inicial solo permite 10.`
     );
   }
   ```

2. **Si se permite:**
   - Actualiza `Suscripcion.plan`
   - NO afecta pacientes existentes
   - Bloquea aceptar MÁS pacientes hasta bajar de 10

### 5.4. Profesional no aprobado por admin

**Escenario:** Profesional registrado, perfil completado, pero admin no ha aprobado.

**Comportamiento:**
1. **Acceso durante trial:**
   - ✅ Puede usar plataforma (con límites de trial)
   - ⚠️ No aparece en búsqueda pública de profesionales
   - ⚠️ Solo puede compartir link directo

2. **Mensaje en dashboard:**
   ```tsx
   <AlertInfo>
     Tu perfil está en revisión. Puedes usar la plataforma durante tu trial,
     pero no aparecerás en búsquedas hasta que un administrador apruebe tus
     documentos (aprox. 24-48hrs).
   </AlertInfo>
   ```

3. **Tras aprobación:**
   - `perfil_aprobado=true`
   - Aparece en listado público
   - Recibe email: "¡Tu perfil ha sido aprobado!"

---

## 6. PLAN DE IMPLEMENTACIÓN

### Fase 1: Base de Datos (1-2 días)
- [ ] Ejecutar migración de esquema de suscripciones
- [ ] Crear tabla `LimitesPlan` con seed de planes
- [ ] Crear función RPC `validar_limite_profesional`
- [ ] Crear función RPC `actualizar_uso_mensual`
- [ ] Agregar políticas RLS para nuevas columnas
- [ ] Testing de migraciones en ambiente staging

### Fase 2: Backend - Lógica de Negocio (2-3 días)
- [ ] Crear Edge Function `checkout-plan-profesional`
- [ ] Crear webhook handler para eventos Stripe de profesionales
- [ ] Implementar middleware de validación de límites
- [ ] Crear cron job para resetear `uso_mes_actual` cada mes
- [ ] Crear cron job para vencer trials automáticamente
- [ ] Testing de funciones serverless

### Fase 3: Frontend - UI (3-4 días)
- [ ] Crear página `/profesional/planes` con comparación
- [ ] Crear componente `LimiteBanner` para mostrar uso
- [ ] Crear página `/profesional/planes/checkout/[plan]`
- [ ] Modificar sidebar para mostrar estado de suscripción
- [ ] Crear modal de upgrade cuando alcanza límites
- [ ] Testing de flujos de usuario

### Fase 4: Integración con Stripe (2 días)
- [ ] Crear productos en Stripe para planes de profesionales
  - `prod_trial_profesional`
  - `prod_inicial_profesional`
  - `prod_crecimiento_profesional`
  - `prod_plus_profesional`
- [ ] Configurar prices para COP y USD
- [ ] Configurar webhooks en Stripe dashboard
- [ ] Testing de checkout y webhooks

### Fase 5: Admin Panel (1-2 días)
- [ ] Crear página `/admin/suscripciones-profesionales`
- [ ] Agregar filtro "Tipo de Usuario" en `/admin/suscripciones`
- [ ] Crear vista de métricas de planes profesionales
- [ ] Agregar acción "Extender Trial" manual
- [ ] Testing de panel admin

### Fase 6: Testing E2E y QA (2-3 días)
- [ ] Test: Registro → Trial → Compra → Uso
- [ ] Test: Alcanzar límites → Upgrade
- [ ] Test: Downgrade con validación
- [ ] Test: Cancelación → Vencimiento → Reactivación
- [ ] Test: Webhooks de Stripe (todos los eventos)
- [ ] Testing de carga y performance

### Fase 7: Documentación (1 día)
- [ ] Actualizar CLAUDE.md con nueva arquitectura
- [ ] Crear guía de usuario para profesionales
- [ ] Documentar API de planes en Swagger/Postman
- [ ] Crear FAQ sobre planes y facturación

**TIEMPO TOTAL ESTIMADO: 12-17 días hábiles**

---

## 7. CONSIDERACIONES DE SEGURIDAD

### 7.1. Row Level Security (RLS)

```sql
-- Profesionales solo ven sus propias suscripciones
CREATE POLICY "Profesionales ven solo su suscripcion profesional"
  ON "Suscripcion"
  FOR SELECT
  USING (
    auth.uid() = (
      SELECT auth_id FROM "Usuario" WHERE id = usuario_id
    )
    AND tipo_usuario = 'profesional'
  );

-- Admins ven todas
CREATE POLICY "Admins ven todas las suscripciones"
  ON "Suscripcion"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- Profesionales no pueden modificar directamente
CREATE POLICY "Solo webhooks modifican suscripciones"
  ON "Suscripcion"
  FOR UPDATE
  USING (false); -- Solo service_role puede actualizar
```

### 7.2. Validación de Integridad

```typescript
// Middleware en Edge Function reservar-cita
const validarDisponibilidadProfesional = async (profesionalId: string) => {
  const { data: validacion } = await supabase
    .rpc('validar_limite_profesional', {
      p_profesional_id: profesionalId,
      p_tipo_limite: 'pacientes'
    });

  if (!validacion.permitido) {
    throw new Error(`Profesional alcanzó límite de pacientes: ${validacion.motivo}`);
  }

  return true;
};
```

### 7.3. Rate Limiting

- **Checkout:** Máx 3 intentos por hora por usuario
- **Validación de límites:** Cache de 5 minutos
- **Actualización de uso:** Batch updates cada 15 minutos

---

## 8. MÉTRICAS Y ANALYTICS

### 8.1. KPIs a Trackear

```sql
CREATE VIEW "MetricasPlanesProfesionales" AS
SELECT
  plan,
  COUNT(*) as total_suscriptores,
  SUM(CASE WHEN estado = 'activa' THEN 1 ELSE 0 END) as activas,
  AVG(precio) as precio_promedio,
  SUM(precio) as mrr_mensual, -- Monthly Recurring Revenue
  AVG(EXTRACT(EPOCH FROM (now() - fecha_inicio))/86400) as dias_promedio_retencion
FROM "Suscripcion"
WHERE tipo_usuario = 'profesional'
GROUP BY plan;
```

### 8.2. Eventos a Registrar

```typescript
// En AnalyticsLog (crear nueva tabla)
eventos = [
  'profesional_registro_iniciado',
  'profesional_perfil_completado',
  'profesional_trial_activado',
  'profesional_trial_vencido',
  'profesional_compro_plan',
  'profesional_upgrade_plan',
  'profesional_downgrade_plan',
  'profesional_cancelo_suscripcion',
  'profesional_alcanzo_limite_pacientes',
  'profesional_alcanzo_limite_horas'
];
```

---

## 9. PREGUNTAS PENDIENTES PARA STAKEHOLDER

1. **Precios:** ¿Los precios propuestos son competitivos para el mercado colombiano?
2. **Trial:** ¿14 días es suficiente? ¿Debería ser 30 días?
3. **Aprobación:** ¿Se debe bloquear acceso hasta aprobación o permitir trial antes de aprobar?
4. **Límites:** ¿Qué pasa con pacientes "inactivos" (sin cita en 3+ meses)? ¿Cuentan para el límite?
5. **Facturación:** ¿Se requiere facturación electrónica automática (DIAN)?
6. **Descuentos:** ¿Habrá descuentos por pago anual? ej: -20%
7. **Insignias:** ¿Cómo se determina quién obtiene "Destacado Premium"? ¿Solo por plan o también por calificaciones?

---

## 10. DIAGRAMA DE FLUJO DE DATOS

```
┌─────────────┐
│   USUARIO   │ (rol=TERAPEUTA)
│  (Registro) │
└──────┬──────┘
       │
       ↓
┌─────────────────────┐
│ PerfilProfesional   │ (perfil_aprobado=false)
│ - titulo            │
│ - licencia          │
│ - especialidades    │
└──────┬──────────────┘
       │
       ↓
┌─────────────────────┐
│   Suscripcion       │ (TRIAL)
│ - plan='trial'      │
│ - tipo='profesional'│
│ - estado='activa'   │
│ - fecha_fin=+14d    │
└──────┬──────────────┘
       │
       ↓
┌─────────────────────┐
│  LimitesPlan        │ (config)
│ - limite_pacientes:3│
│ - limite_horas:10   │
└──────┬──────────────┘
       │
       ↓ (Día 14)
┌─────────────────────┐
│   Checkout Page     │
│   /planes/checkout  │
└──────┬──────────────┘
       │
       ↓
┌─────────────────────┐
│   Stripe Checkout   │
│   Session           │
└──────┬──────────────┘
       │
       ↓ (Webhook)
┌─────────────────────┐
│ UPDATE Suscripcion  │
│ - plan='inicial'    │
│ - stripe_id=xxx     │
│ - estado='activa'   │
└──────┬──────────────┘
       │
       ↓
┌─────────────────────┐
│  PROFESIONAL ACTIVO │
│  Acceso completo    │
└─────────────────────┘
```

---

## CONCLUSIÓN

Este diseño proporciona:

1. ✅ **Separación clara** entre suscripciones de pacientes y profesionales
2. ✅ **Escalabilidad** con tabla de configuración dinámica
3. ✅ **Seguridad** con validaciones en múltiples capas
4. ✅ **Flexibilidad** para agregar/modificar planes sin cambiar código
5. ✅ **UX fluida** con trial automático y validaciones en tiempo real
6. ✅ **Integración robusta** con Stripe para facturación

**Próximos pasos:** Esperar aprobación de stakeholder para iniciar implementación.

---

**Firmado:** Claude (Agente 3)
**Fecha:** 2025-10-24
**Estado:** DISEÑO COMPLETO ✅
