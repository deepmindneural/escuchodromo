# 🚀 GUÍA DE DESPLIEGUE - SISTEMA IA

## ✅ PASO 1: EJECUTAR MIGRACIÓN SQL (Base de Datos)

### Archivo:
```
supabase/migrations/20250121000000_ia_analytics.sql
```

### Qué hace:
Crea 6 tablas nuevas en tu base de datos:
- AnalisisConversacion
- ReporteSemanal
- ReporteMensual
- InsightDashboard
- AlertaUrgente
- LogGeminiAPI

### Cómo ejecutarlo:

**OPCIÓN A - SQL Editor de Supabase (MÁS FÁCIL):**
1. Ve a: https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/sql/new
2. Abre el archivo: `supabase/migrations/20250121000000_ia_analytics.sql`
3. Copia TODO el contenido (Cmd+A, Cmd+C)
4. Pega en el SQL Editor (Cmd+V)
5. Presiona botón "Run" o F5
6. Debe decir "Success"

**OPCIÓN B - Desde terminal (si no funciona la A):**
```bash
# Ya intentamos esto pero hubo problemas de conexión
npx supabase db push --include-all
```

---

## ✅ PASO 2: CONFIGURAR API KEY DE GEMINI

### Obtener tu API Key:
1. Ve a: https://aistudio.google.com/apikey
2. Crea una nueva API key (es GRATIS)
3. Copia la key (ejemplo: AIzaSy...)

### Configurar en Supabase:
```bash
# Opción A - Desde terminal
npx supabase secrets set GEMINI_API_KEY=AIzaSy_tu_key_aqui

# Opción B - Desde Dashboard de Supabase
# https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/settings/vault
# Agregar nuevo secret:
# Name: GEMINI_API_KEY
# Value: AIzaSy_tu_key_aqui
```

---

## ✅ PASO 3: DESPLEGAR EDGE FUNCTIONS

### 7 Edge Functions a desplegar:

```bash
# 1. Chat IA mejorado (YA EXISTÍA, pero lo mejoré)
npx supabase functions deploy chat-ia

# 2. Análisis post-conversación
npx supabase functions deploy analisis-post-chat

# 3. Gestión de alertas
npx supabase functions deploy alerta-urgente

# 4. Dashboard de insights
npx supabase functions deploy insights-dashboard

# 5. Reportes clínicos
npx supabase functions deploy generar-reporte-clinico

# 6. Reportes pre-cita (Cron diario)
npx supabase functions deploy generar-reporte-pre-cita

# 7. Batch reportes semanales (Cron semanal)
npx supabase functions deploy batch-reportes-semanales
```

### O todas de una vez:
```bash
npx supabase functions deploy chat-ia && \
npx supabase functions deploy analisis-post-chat && \
npx supabase functions deploy alerta-urgente && \
npx supabase functions deploy insights-dashboard && \
npx supabase functions deploy generar-reporte-clinico && \
npx supabase functions deploy generar-reporte-pre-cita && \
npx supabase functions deploy batch-reportes-semanales
```

---

## ✅ PASO 4: VERIFICAR DESPLIEGUE

```bash
# Listar todas las funciones desplegadas
npx supabase functions list

# Deberías ver:
# - chat-ia (updated)
# - analisis-post-chat (new)
# - alerta-urgente (new)
# - insights-dashboard (new)
# - generar-reporte-clinico (new)
# - generar-reporte-pre-cita (new)
# - batch-reportes-semanales (new)
```

---

## ✅ PASO 5: PROBAR LAS FUNCIONES

### Test 1: Chat IA
```bash
curl -X POST https://cvezncgcdsjntzrzztrj.supabase.co/functions/v1/chat-ia \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_ANON_KEY" \
  -d '{
    "mensaje": "Hola, me siento un poco triste hoy",
    "sesion_id": "test-123",
    "historial": []
  }'
```

### Test 2: Verificar tablas creadas
Ve al SQL Editor y ejecuta:
```sql
-- Ver todas las tablas de IA
SELECT table_name
FROM information_schema.tables
WHERE table_name IN (
  'AnalisisConversacion',
  'ReporteSemanal',
  'ReporteMensual',
  'InsightDashboard',
  'AlertaUrgente',
  'LogGeminiAPI'
);
```

---

## ✅ PASO 6 (OPCIONAL): CONFIGURAR CRON JOBS

Para que los reportes se generen automáticamente:

### Dashboard de Supabase:
1. Ve a: https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/functions
2. Click en "Cron Jobs"
3. Agregar:

**Cron 1 - Reportes Pre-Cita:**
- Function: `generar-reporte-pre-cita`
- Schedule: `0 8 * * *` (Diariamente 8:00 AM)

**Cron 2 - Reportes Semanales:**
- Function: `batch-reportes-semanales`
- Schedule: `0 6 * * 1` (Lunes 6:00 AM)

---

## 📊 RESUMEN DE ARCHIVOS

### NO NECESITAS EJECUTAR:
- ❌ `supabase/functions/_shared/*.ts` - Se usan automáticamente por las Edge Functions
- ❌ `README_IA_SYSTEM.md` - Solo documentación
- ❌ `PROMPTS_GEMINI.md` - Solo documentación

### SÍ NECESITAS EJECUTAR:
- ✅ `supabase/migrations/20250121000000_ia_analytics.sql` - PASO 1
- ✅ Configurar GEMINI_API_KEY - PASO 2
- ✅ Desplegar 7 Edge Functions - PASO 3

---

## 🔧 TROUBLESHOOTING

### Error: "Tabla ya existe"
- Es normal si ya corriste migraciones antes
- La migración tiene `CREATE TABLE IF NOT EXISTS`
- Solo ejecuta el SQL completo y debería funcionar

### Error: "Connection refused"
- Usa la OPCIÓN A (SQL Editor) en lugar de terminal

### Error: "API key inválida"
- Verifica que copiaste correctamente la key de Gemini
- Debe empezar con: AIzaSy...

---

## 📞 SIGUIENTE PASO

Una vez completados los PASOS 1-3, ejecuta esto para verificar:

```bash
# Ver logs de una función
npx supabase functions logs chat-ia
```

Y prueba el chat desde tu aplicación frontend.
