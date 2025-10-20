# 🤖 SISTEMA DE IA Y ANÁLISIS - ESCUCHODROMO

**Versión:** 2.0
**Fecha:** Enero 2025
**Estado:** COMPLETO ✅

---

## 📋 TABLA DE CONTENIDOS

1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Edge Functions Disponibles](#edge-functions-disponibles)
4. [Configuración y Despliegue](#configuración-y-despliegue)
5. [Uso de las APIs](#uso-de-las-apis)
6. [Rate Limiting y Optimización](#rate-limiting-y-optimización)
7. [Seguridad y Privacidad](#seguridad-y-privacidad)
8. [Monitoreo y Logging](#monitoreo-y-logging)
9. [Troubleshooting](#troubleshooting)
10. [Mejores Prácticas](#mejores-prácticas)

---

## 🎯 VISIÓN GENERAL

### ¿Qué hace este sistema?

El sistema de IA de Escuchodromo proporciona:

1. **Chat inteligente con memoria contextual**
   - Recuerda evaluaciones psicológicas (PHQ-9, GAD-7)
   - Mantiene contexto de conversaciones previas
   - Personaliza respuestas según el historial del usuario

2. **Detección automática de crisis**
   - Análisis en tiempo real de mensajes
   - Detección de ideación suicida
   - Creación automática de alertas urgentes

3. **Análisis post-conversación**
   - Extracción de emociones dominantes
   - Cálculo de score de bienestar
   - Identificación de temas recurrentes

4. **Dashboard de insights**
   - Métricas en tiempo real
   - Evolución emocional
   - Patrones de uso

5. **Reportes clínicos automáticos**
   - Reportes semanales y mensuales
   - Reportes pre-cita para terapeutas
   - Generación batch programada

### Tecnologías Utilizadas

- **IA:** Google Gemini 2.0 Flash (1,000 requests/día gratis)
- **Backend:** Supabase Edge Functions (Deno runtime)
- **Base de datos:** PostgreSQL con RLS
- **Rate Limiting:** SQL functions + JSONB logging

---

## 🏗️ ARQUITECTURA DEL SISTEMA

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌────────────┐  ┌────────────┐  ┌────────────┐
│  chat-ia   │  │ analisis-  │  │  insights- │
│            │  │ post-chat  │  │  dashboard │
└─────┬──────┘  └─────┬──────┘  └─────┬──────┘
      │               │               │
      └───────────────┼───────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
         ▼                         ▼
┌──────────────────┐    ┌──────────────────┐
│  GeminiClient    │    │  PostgreSQL DB   │
│  (_shared)       │    │  - 6 tablas IA   │
│                  │    │  - RLS policies  │
│  - Retry logic   │    │  - SQL functions │
│  - Rate limiting │    │                  │
│  - JSON parsing  │    │                  │
└──────────────────┘    └──────────────────┘
         │
         ▼
┌──────────────────┐
│  Gemini API      │
│  2.0 Flash       │
│  (1K calls/día)  │
└──────────────────┘
```

### Flujo de Datos

1. **Usuario envía mensaje** → Frontend
2. **Frontend llama** → `chat-ia` Edge Function
3. **chat-ia obtiene contexto** → Base de datos (evaluaciones, historial)
4. **chat-ia construye prompt** → Prompts optimizados
5. **chat-ia llama Gemini** → GeminiClient (con retry)
6. **Gemini analiza** → Respuesta personalizada
7. **Si detecta crisis** → Análisis profundo paralelo
8. **Guarda respuesta** → Base de datos
9. **Retorna al usuario** → Frontend

---

## 📦 EDGE FUNCTIONS DISPONIBLES

### 1. `chat-ia` - Chat Inteligente

**Archivo:** `supabase/functions/chat-ia/index.ts`

**Propósito:** Chat con IA usando Gemini con memoria avanzada y detección de crisis.

**Endpoint:**
```
POST /functions/v1/chat-ia
```

**Request:**
```typescript
{
  mensaje: string
  sesion_id: string
  historial?: Array<{
    rol: 'usuario' | 'asistente'
    contenido: string
  }>
}
```

**Response:**
```typescript
{
  respuesta: string
  modelo: string
  tokens_usados: number
  alerta_crisis?: {
    detectada: boolean
    nivel: 'bajo' | 'medio' | 'alto' | 'critico'
    mensaje: string
  }
}
```

**Características:**
- ✅ Memoria contextual con PHQ-9/GAD-7
- ✅ Historial de 20 mensajes
- ✅ Detección de crisis en paralelo
- ✅ Personalización según rol
- ✅ Recursos de ayuda automáticos

**Ejemplo de uso:**
```typescript
const response = await fetch(
  'https://[PROJECT].supabase.co/functions/v1/chat-ia',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`
    },
    body: JSON.stringify({
      mensaje: '¿Cómo puedo manejar mi ansiedad?',
      sesion_id: 'abc123',
      historial: []
    })
  }
)

const data = await response.json()
console.log(data.respuesta)
```

---

### 2. `analisis-post-chat` - Análisis de Conversaciones

**Archivo:** `supabase/functions/analisis-post-chat/index.ts`

**Propósito:** Analizar conversaciones completas para extraer insights clínicos.

**Endpoint:**
```
POST /functions/v1/analisis-post-chat
```

**Request:**
```typescript
{
  conversacion_id?: string
  sesion_publica_id?: string
  forzar_reanalizacion?: boolean
}
```

**Response:**
```typescript
{
  analisis: {
    emociones_dominantes: Record<string, number>
    sentimiento_promedio: number // -1 a 1
    score_bienestar: number // 0-100
    riesgo_suicidio: boolean
    nivel_urgencia: 'bajo' | 'medio' | 'alto' | 'critico'
    temas_recurrentes: string[]
    palabras_clave: string[]
    resumen_clinico: string
    recomendaciones_terapeuta: string[]
  }
  alerta_creada: boolean
  alerta_id?: string
}
```

**Características:**
- ✅ Análisis de hasta 100 mensajes
- ✅ Detección de riesgo suicida
- ✅ Generación de insights para profesionales
- ✅ Creación automática de alertas
- ✅ Cache: evita duplicados

**Ejemplo de uso:**
```typescript
const response = await fetch(
  'https://[PROJECT].supabase.co/functions/v1/analisis-post-chat',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`
    },
    body: JSON.stringify({
      conversacion_id: 'conv-123'
    })
  }
)

const data = await response.json()
console.log('Score de bienestar:', data.analisis.score_bienestar)
```

---

### 3. `alerta-urgente` - Gestión de Alertas

**Archivo:** `supabase/functions/alerta-urgente/index.ts`

**Propósito:** Gestionar alertas de crisis y notificaciones a profesionales.

**Endpoint:**
```
POST /functions/v1/alerta-urgente
```

**Request:**
```typescript
{
  alerta_id: string
  accion: 'notificar' | 'actualizar_estado' | 'asignar_profesional'
  nuevo_estado?: 'pendiente' | 'en_revision' | 'gestionada' | 'cerrada'
  profesional_asignado_id?: string
  notas?: string
}
```

**Response:**
```typescript
{
  alerta: AlertaUrgente
  notificaciones_creadas: number
  emails_enviados: number
  sms_enviados: number
  acciones: string[]
}
```

**Características:**
- ✅ Notificaciones push a profesionales
- ✅ Envío de emails (integrable con Resend/SendGrid)
- ✅ Envío de SMS para crisis críticas (integrable con Twilio)
- ✅ Gestión de estados de alerta
- ✅ Asignación de profesionales

---

### 4. `insights-dashboard` - Métricas en Tiempo Real

**Archivo:** `supabase/functions/insights-dashboard/index.ts`

**Propósito:** Generar métricas y insights para el dashboard del usuario.

**Endpoint:**
```
POST /functions/v1/insights-dashboard
```

**Request:**
```typescript
{
  usuario_id: string
  forzar_recalculo?: boolean
  periodo_dias?: number // Default: 30
}
```

**Response:**
```typescript
{
  metricas_generales: {
    total_conversaciones: number
    total_mensajes: number
    promedio_mensajes_por_conversacion: number
    dias_activo: number
    ultima_actividad: string
  }
  evolucion_emocional: {
    emociones_dominantes: Record<string, number>
    tendencia_bienestar: Array<{ fecha: string, score: number }>
    cambio_bienestar_porcentaje: number
  }
  evaluaciones: {
    phq9: {...}
    gad7: {...}
  }
  patrones_uso: {
    horarios_mas_activos: Array<{ hora: number, cantidad: number }>
    dias_semana_mas_activos: Array<{ dia: string, cantidad: number }>
  }
  temas_recurrentes: Array<{ tema: string, frecuencia: number }>
  alertas: {...}
}
```

**Características:**
- ✅ Cache de 1 hora (TTL)
- ✅ Métricas completas de uso
- ✅ Evolución emocional con gráficas
- ✅ Comparación de evaluaciones
- ✅ Patrones de uso (horarios, días)

---

### 5. `generar-reporte-clinico` - Reportes Automáticos

**Archivo:** `supabase/functions/generar-reporte-clinico/index.ts`

**Propósito:** Generar reportes clínicos semanales, mensuales o pre-cita.

**Endpoint:**
```
POST /functions/v1/generar-reporte-clinico
```

**Request:**
```typescript
{
  usuario_id: string
  tipo_reporte: 'semanal' | 'mensual' | 'pre_cita'
  cita_id?: string // Requerido para pre_cita
  dias_atras?: number // Opcional
}
```

**Response:**
```typescript
{
  reporte: {
    resumen_ejecutivo: string
    estado_emocional_actual: string
    cambios_significativos: string[]
    temas_principales: string[]
    recomendaciones_clinicas: string[]
    nivel_atencion_requerida: 'bajo' | 'medio' | 'alto'
    // ... más campos
  }
  tipo: string
  generado_en: string
  notificacion_creada: boolean
}
```

**Características:**
- ✅ Reportes semanales (7 días)
- ✅ Reportes mensuales (30 días)
- ✅ Reportes pre-cita (desde última cita)
- ✅ Notificación automática a terapeutas
- ✅ Formato clínico profesional

---

### 6. `generar-reporte-pre-cita` - Batch Pre-Citas (Cron)

**Archivo:** `supabase/functions/generar-reporte-pre-cita/index.ts`

**Propósito:** Generar reportes para citas en las próximas 24 horas.

**Cron:** `0 8 * * *` (diariamente a las 8:00 AM)

**Endpoint:**
```
POST /functions/v1/generar-reporte-pre-cita
```

**Request:** Ninguno (automático)

**Response:**
```typescript
{
  citas_procesadas: number
  reportes_generados: number
  reportes_fallidos: number
  citas: Array<{
    cita_id: string
    usuario_nombre: string
    terapeuta_nombre: string
    fecha_cita: string
    reporte_generado: boolean
  }>
}
```

**Características:**
- ✅ Ejecución automática diaria
- ✅ Busca citas próximas (24h)
- ✅ Genera reportes para cada cita
- ✅ Notifica a terapeutas
- ✅ Delay de 2s entre reportes

---

### 7. `batch-reportes-semanales` - Batch Semanal (Cron)

**Archivo:** `supabase/functions/batch-reportes-semanales/index.ts`

**Propósito:** Generar reportes semanales para todos los usuarios activos.

**Cron:** `0 6 * * 1` (todos los lunes a las 6:00 AM)

**Endpoint:**
```
POST /functions/v1/batch-reportes-semanales
```

**Request:** Ninguno (automático)

**Response:**
```typescript
{
  total_usuarios_activos: number
  reportes_generados: number
  reportes_fallidos: number
  reportes_omitidos: number
  tiempo_ejecucion_ms: number
  usuarios: Array<{
    usuario_id: string
    nombre: string
    reporte_generado: boolean
    error?: string
  }>
}
```

**Características:**
- ✅ Ejecución automática semanal
- ✅ Detecta usuarios activos (últimos 7 días)
- ✅ Procesa en lotes de 10 usuarios
- ✅ Rate limiting: 3s entre lotes
- ✅ Notifica a admins con resumen

---

## ⚙️ CONFIGURACIÓN Y DESPLIEGUE

### 1. Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```bash
# Supabase
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...

# Gemini API
GEMINI_API_KEY=AIza...
```

### 2. Aplicar Migración SQL

```bash
# Aplicar migración de base de datos
supabase db push

# O si usas CLI local
npx supabase db push
```

### 3. Desplegar Edge Functions

```bash
# Desplegar todas las funciones
supabase functions deploy chat-ia
supabase functions deploy analisis-post-chat
supabase functions deploy alerta-urgente
supabase functions deploy insights-dashboard
supabase functions deploy generar-reporte-clinico
supabase functions deploy generar-reporte-pre-cita
supabase functions deploy batch-reportes-semanales

# Verificar despliegue
supabase functions list
```

### 4. Configurar Secretos

```bash
# Configurar API key de Gemini
supabase secrets set GEMINI_API_KEY=AIza...

# Configurar URL de Supabase
supabase secrets set SUPABASE_URL=https://[PROJECT].supabase.co

# Configurar Service Role Key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 5. Configurar Cron Jobs (Opcional)

En el dashboard de Supabase:

**Dashboard → Edge Functions → Cron Jobs:**

```yaml
- name: batch-reportes-semanales
  schedule: "0 6 * * 1"  # Lunes 6:00 AM
  function: batch-reportes-semanales

- name: generar-reporte-pre-cita
  schedule: "0 8 * * *"  # Diariamente 8:00 AM
  function: generar-reporte-pre-cita
```

---

## 🚀 RATE LIMITING Y OPTIMIZACIÓN

### Límites de Gemini API

- **Tier Gratuito:** 1,000 requests/día
- **Reserva de emergencia:** 100 requests (configurado en `config.ts`)
- **Límite efectivo:** 900 requests/día para operaciones normales

### Estrategia de Rate Limiting

```typescript
// Prioridades (menor = mayor prioridad)
prioridad: {
  crisis: 1,      // Siempre permitido (hasta límite absoluto)
  chat: 2,        // Alta prioridad
  analisis: 3,    // Media prioridad
  reportes: 4     // Baja prioridad
}
```

### Optimizaciones Implementadas

1. **Análisis solo para usuarios registrados** → Ahorra 60% de llamadas
2. **Cache de insights (1 hora)** → Reduce llamadas repetidas
3. **Batch con delays** → Evita saturar API
4. **Retry logic exponencial** → Maneja errores de red
5. **Verificación de duplicados** → Evita reanálisis innecesarios

### Consumo Estimado

```
- Chat IA: ~200 llamadas/día
- Análisis de crisis: ~100 llamadas/día
- Análisis post-chat: ~20 llamadas/día
- Reportes semanales: ~50 llamadas/semana
- Reportes pre-cita: ~10 llamadas/día

TOTAL: ~330 llamadas/día
MARGEN: 67% disponible
```

---

## 🔐 SEGURIDAD Y PRIVACIDAD

### Row Level Security (RLS)

Todas las tablas tienen políticas RLS:

```sql
-- Ejemplo: AnalisisConversacion
CREATE POLICY "usuarios_pueden_ver_sus_analisis"
ON "AnalisisConversacion"
FOR SELECT
USING (
  conversacion_id IN (
    SELECT id FROM "Conversacion" WHERE usuario_id = auth.uid()
  )
);

CREATE POLICY "profesionales_pueden_ver_analisis_asignados"
ON "AnalisisConversacion"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "AsignacionUsuarioProfesional" a
    JOIN "Conversacion" c ON c.usuario_id = a.usuario_id
    WHERE c.id = conversacion_id
    AND a.profesional_id = auth.uid()
    AND a.activo = true
  )
);
```

### Datos Sensibles

- **PHQ-9/GAD-7:** Solo accesibles por usuario propietario y profesionales asignados
- **Alertas urgentes:** Solo profesionales y admins
- **Reportes clínicos:** Solo terapeutas asignados
- **Logs de Gemini:** Solo admins

### Anonimización

Para usuarios públicos (sin registro):
- Se usa `sesion_publica_id` en lugar de `usuario_id`
- No se guardan datos personales
- Análisis limitado sin contexto histórico

---

## 📊 MONITOREO Y LOGGING

### Logs Disponibles

1. **LogGeminiAPI** - Todas las llamadas a Gemini
   ```sql
   SELECT * FROM "LogGeminiAPI"
   WHERE DATE(creado_en) = CURRENT_DATE
   ORDER BY creado_en DESC;
   ```

2. **AlertaUrgente** - Todas las crisis detectadas
   ```sql
   SELECT * FROM "AlertaUrgente"
   WHERE estado = 'pendiente'
   ORDER BY nivel_urgencia DESC, creado_en DESC;
   ```

3. **Estadísticas de uso**
   ```sql
   SELECT obtener_llamadas_gemini_hoy();
   ```

### Métricas Recomendadas

- **Tasa de crisis:** % de conversaciones con alerta
- **Tiempo de respuesta:** Latencia promedio de Gemini
- **Score de bienestar promedio:** Tendencia general
- **Uso de API:** Llamadas diarias vs límite

### Alertas Recomendadas

```sql
-- Alertas críticas sin gestionar (> 1 hora)
SELECT * FROM "AlertaUrgente"
WHERE nivel_urgencia = 'critico'
AND estado = 'pendiente'
AND creado_en < NOW() - INTERVAL '1 hour';

-- Uso de API cerca del límite (> 90%)
SELECT
  obtener_llamadas_gemini_hoy() as llamadas_hoy,
  1000 as limite,
  (obtener_llamadas_gemini_hoy()::float / 1000 * 100) as porcentaje_uso;
```

---

## 🔧 TROUBLESHOOTING

### Error: "Rate limit alcanzado"

**Causa:** Se alcanzó el límite diario de Gemini (1,000 calls)

**Solución:**
1. Verificar consumo: `SELECT obtener_llamadas_gemini_hoy();`
2. Esperar hasta el siguiente día (reset a medianoche UTC)
3. Si es urgente, aumentar tier de Gemini

### Error: "No se pudo parsear respuesta de Gemini"

**Causa:** Respuesta de Gemini no es JSON válido

**Solución:**
1. Ver logs: `supabase functions logs chat-ia`
2. Revisar prompt en `_shared/prompts.ts`
3. Ajustar instrucciones de formato JSON en el prompt

### Error: "Timeout en llamada a Gemini"

**Causa:** Timeout de 30s excedido

**Solución:**
1. Reducir tamaño del prompt (menos mensajes en historial)
2. Aumentar timeout en `config.ts`
3. Verificar conectividad de Supabase

### Las alertas no se envían

**Causa:** Notificaciones no configuradas o error en email/SMS

**Solución:**
1. Verificar preferencias del profesional
2. Configurar servicio de email (Resend/SendGrid)
3. Configurar servicio de SMS (Twilio)
4. Ver tabla `Notificacion` para logs

---

## ✅ MEJORES PRÁCTICAS

### Desarrollo

1. **Siempre usar tipos TypeScript** (`_shared/tipos.ts`)
2. **Reutilizar GeminiClient** (no crear instancias nuevas)
3. **Usar prompts de `_shared/prompts.ts`** (no hardcodear)
4. **Loguear todas las operaciones importantes**
5. **Manejar errores gracefully** (fallbacks)

### Producción

1. **Monitorear uso de API diariamente**
2. **Revisar alertas críticas cada hora**
3. **Hacer backup de la base de datos semanalmente**
4. **Revisar logs de errores diariamente**
5. **Actualizar prompts basándose en feedback**

### Prompts

1. **Ser específico y claro**
2. **Incluir ejemplos en el prompt**
3. **Solicitar formato JSON explícitamente**
4. **Agregar instrucciones de seguridad**
5. **Iterar basándose en resultados**

### Testing

```typescript
// Test de chat-ia
const testChat = async () => {
  const response = await fetch('http://localhost:54321/functions/v1/chat-ia', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`
    },
    body: JSON.stringify({
      mensaje: 'Hola, me siento triste',
      sesion_id: 'test-123',
      historial: []
    })
  })

  const data = await response.json()
  console.log(data)
}
```

---

## 📞 SOPORTE

### Recursos

- **Documentación Gemini:** https://ai.google.dev/docs
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
- **Row Level Security:** https://supabase.com/docs/guides/auth/row-level-security

### Contacto

- **Equipo de desarrollo:** [tu-email@escuchodromo.com]
- **Issues:** GitHub repository
- **Slack:** #escuchodromo-ia

---

**Última actualización:** Enero 2025
**Autor:** Equipo Escuchodromo
**Versión:** 2.0
