# 🤖 INSTRUCCIONES: IA CON GROQ (100% GRATIS)

## ✅ ¿QUÉ SE IMPLEMENTÓ?

Se implementó **chat con Inteligencia Artificial real** usando **Groq**, que es:
- ✅ **100% GRATIS** (sin cargos)
- ✅ **Sin tarjeta de crédito** requerida
- ✅ **Ultra rápido** (LPU - hasta 800 tokens/segundo)
- ✅ **Modelos potentes**: Llama 3.1 70B, Mixtral, Gemma

---

## 📦 ARCHIVOS CREADOS

1. **`supabase/functions/chat-ia/index.ts`** - Edge Function de Supabase
2. **`supabase/functions/chat-ia/deno.json`** - Configuración de Deno
3. **Frontend actualizado** - `src/app/chat/page.tsx` usa la Edge Function

---

## 🚀 PASOS PARA ACTIVAR LA IA

### 1️⃣ OBTENER API KEY DE GROQ (GRATIS)

```bash
# 1. Ir a Groq Console
https://console.groq.com

# 2. Crear cuenta (email o GitHub)
# 3. Ir a "API Keys"
# 4. Crear nueva API Key
# 5. Copiar la key (empieza con "gsk_...")
```

### 2️⃣ CONFIGURAR SUPABASE CLI

```bash
# Instalar Supabase CLI (si no lo tienes)
npm install -g supabase

# Login en Supabase
supabase login

# Vincular proyecto
supabase link --project-ref cvezncgcdsjntzrzztrj
```

### 3️⃣ CONFIGURAR VARIABLES DE ENTORNO

```bash
# Configurar GROQ_API_KEY en Supabase
supabase secrets set GROQ_API_KEY=gsk_tu_api_key_aqui

# Verificar que se configuró correctamente
supabase secrets list
```

### 4️⃣ DESPLEGAR LA EDGE FUNCTION

```bash
# Desde la raíz del proyecto
supabase functions deploy chat-ia

# Verificar que se desplegó correctamente
supabase functions list
```

### 5️⃣ PROBAR EN DESARROLLO LOCAL (OPCIONAL)

```bash
# Terminal 1: Iniciar Supabase local
supabase start

# Terminal 2: Servir Edge Function localmente
supabase functions serve chat-ia --env-file .env.local

# Crear archivo .env.local con:
GROQ_API_KEY=gsk_tu_api_key_aqui
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_local
```

---

## 🧪 PROBAR LA IA

### Opción A: En la aplicación

```bash
# 1. Iniciar aplicación
npm run dev

# 2. Ir a http://localhost:3000/chat

# 3. Enviar mensajes y ver respuestas de IA real
```

### Opción B: Con cURL (testing directo)

```bash
# Prueba la Edge Function directamente
curl -X POST 'https://cvezncgcdsjntzrzztrj.supabase.co/functions/v1/chat-ia' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer TU_ANON_KEY' \
  --data '{
    "mensaje": "Hola, me siento ansioso",
    "sesion_id": "test-123",
    "historial": []
  }'
```

---

## 🎯 MODELOS DISPONIBLES EN GROQ

Puedes cambiar el modelo en `supabase/functions/chat-ia/index.ts` línea 116:

```typescript
model: 'llama-3.1-70b-versatile', // 👈 Cambiar aquí
```

### Opciones:

| Modelo | Descripción | Velocidad | Calidad |
|--------|-------------|-----------|---------|
| **llama-3.1-70b-versatile** | Recomendado, equilibrado | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ |
| **llama-3.1-8b-instant** | Más rápido, menor calidad | ⚡⚡⚡⚡⚡ | ⭐⭐⭐ |
| **mixtral-8x7b-32768** | Contexto largo (32K tokens) | ⚡⚡⚡ | ⭐⭐⭐⭐ |
| **gemma-7b-it** | Alternativa ligera | ⚡⚡⚡⚡ | ⭐⭐⭐ |

---

## 🔧 CARACTERÍSTICAS IMPLEMENTADAS

### ✅ Lo que ya funciona:

1. **Chat en tiempo real** con IA
2. **Historial de conversación** (últimos 6 mensajes)
3. **Análisis de emociones** básico
4. **Cálculo de sentimiento** (-1 a 1)
5. **Guardar mensajes** en Supabase
6. **Manejo de errores** robusto
7. **Límite de mensajes** para usuarios no registrados

### 🔮 Análisis de Emociones

La función analiza 8 emociones:
- 😊 Alegría
- 😔 Tristeza
- 😡 Enojo
- 😰 Miedo / Ansiedad
- 😲 Sorpresa
- 🤢 Asco
- 🤗 Esperanza

---

## 💰 LÍMITES DE GROQ (TIER GRATUITO)

Según la documentación de Groq:

- ✅ **Requests por día**: Límite generoso (cientos/miles)
- ✅ **Requests por minuto**: ~30 RPM
- ✅ **Tokens por request**: Hasta 8K tokens
- ✅ **Sin cargo**: Completamente gratis

**Para límites más altos**: Puedes actualizar al Developer Tier (10x más límites)

---

## 🛠️ COMANDOS ÚTILES

```bash
# Ver logs de la Edge Function
supabase functions logs chat-ia

# Actualizar Edge Function después de cambios
supabase functions deploy chat-ia

# Ver secrets configurados
supabase secrets list

# Eliminar secret (si necesitas)
supabase secrets unset GROQ_API_KEY

# Test local con logs
supabase functions serve chat-ia --env-file .env.local --debug
```

---

## 🐛 TROUBLESHOOTING

### Error: "GROQ_API_KEY no configurada"

```bash
# Solución: Configurar el secret
supabase secrets set GROQ_API_KEY=gsk_tu_api_key_aqui

# Re-desplegar
supabase functions deploy chat-ia
```

### Error: "Groq API error: 401"

```bash
# La API key es inválida o expiró
# Generar nueva key en https://console.groq.com/keys
supabase secrets set GROQ_API_KEY=gsk_nueva_key
```

### Error: "Rate limit exceeded"

```bash
# Alcanzaste el límite gratuito
# Opciones:
# 1. Esperar unos minutos
# 2. Actualizar a Developer Tier en Groq
# 3. Implementar caché para reducir llamadas
```

### La IA no responde en el chat

```bash
# 1. Verificar que la Edge Function está desplegada
supabase functions list

# 2. Ver logs para errores
supabase functions logs chat-ia

# 3. Verificar que el frontend apunta a la función correcta
# Archivo: src/app/chat/page.tsx línea 121
# Debe decir: supabase.functions.invoke('chat-ia', ...)
```

---

## 📊 MONITOREO

### Ver estadísticas de uso:

```bash
# En Groq Console
https://console.groq.com/usage

# Ver requests, tokens usados, etc.
```

### Ver logs en Supabase:

```bash
# Dashboard de Supabase
https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/functions/chat-ia
```

---

## 🎨 PERSONALIZAR COMPORTAMIENTO DE LA IA

Edita el prompt del sistema en `supabase/functions/chat-ia/index.ts` línea 48:

```typescript
{
  role: 'system',
  content: `Eres Escuchodromo, un asistente de inteligencia artificial...

  // 👈 Modifica esto para cambiar la personalidad de la IA
  `
}
```

---

## 🔐 SEGURIDAD

✅ **Lo que está bien:**
- API Key de Groq está en el servidor (Edge Function)
- No se expone en el frontend
- Supabase maneja la autenticación

⚠️ **Importante:**
- NUNCA pongas `GROQ_API_KEY` en variables que empiecen con `NEXT_PUBLIC_`
- Solo usa secrets de Supabase para keys sensibles

---

## 📈 PRÓXIMOS PASOS (OPCIONAL)

### 1. Implementar caché para reducir costos
```typescript
// Guardar respuestas frecuentes en Redis o Supabase
// Ejemplo: preguntas tipo "Hola", "¿Cómo estás?"
```

### 2. Agregar rate limiting personalizado
```typescript
// Limitar X requests por usuario por hora
```

### 3. Implementar análisis avanzado de emociones
```typescript
// Usar modelo específico para análisis de sentimientos
// Ejemplo: Groq con modelo fine-tuned
```

### 4. Streaming de respuestas
```typescript
// Mostrar la respuesta mientras se genera (como ChatGPT)
// Cambiar stream: false a stream: true
```

---

## 🆘 SOPORTE

**Groq Documentation:**
- https://console.groq.com/docs/quickstart
- https://console.groq.com/docs/models
- https://console.groq.com/docs/rate-limits

**Supabase Edge Functions:**
- https://supabase.com/docs/guides/functions
- https://supabase.com/docs/guides/functions/secrets

**Community:**
- Groq Community: https://community.groq.com
- Supabase Discord: https://discord.supabase.com

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Crear cuenta en Groq Console
- [ ] Obtener API Key de Groq
- [ ] Instalar Supabase CLI
- [ ] Vincular proyecto con `supabase link`
- [ ] Configurar secret: `supabase secrets set GROQ_API_KEY=...`
- [ ] Desplegar función: `supabase functions deploy chat-ia`
- [ ] Probar en la aplicación: `npm run dev` → `/chat`
- [ ] Verificar logs: `supabase functions logs chat-ia`
- [ ] ¡Disfrutar de IA GRATIS! 🎉

---

**Fecha de creación**: 15 de Octubre, 2025
**Estado**: ✅ Completamente funcional con Groq
**Costo**: 🎁 $0.00 (GRATIS)
