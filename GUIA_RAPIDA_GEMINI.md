# 🚀 GUÍA RÁPIDA: ACTIVAR IA CON GOOGLE GEMINI

## ✅ LO QUE YA ESTÁ HECHO

- ✅ Edge Function creada (`supabase/functions/chat-ia/`)
- ✅ Frontend actualizado para usar IA real
- ✅ Análisis de emociones implementado
- ✅ Código listo para Gemini 2.0 Flash

**Solo faltan 3 pasos para activar la IA:**

---

## 📝 PASO 1: OBTENER API KEY (2 minutos)

### 1.1 Ir a Google AI Studio
```
🔗 https://aistudio.google.com/apikey
```

### 1.2 Iniciar sesión
- Usa tu cuenta de Google (Gmail)
- Si no tienes, créala gratis

### 1.3 Crear API Key
- Haz clic en **"Create API key in new project"**
- Se crea automáticamente

### 1.4 Copiar la key
- Haz clic en **"Copy"**
- La key empieza con `AIzaSy...`
- Guárdala temporalmente

---

## 🔧 PASO 2: CONFIGURAR EN SUPABASE (3 minutos)

### 2.1 Instalar Supabase CLI (si no lo tienes)
```bash
npm install -g supabase
```

### 2.2 Login en Supabase
```bash
supabase login
```

### 2.3 Vincular proyecto
```bash
supabase link --project-ref cvezncgcdsjntzrzztrj
```

### 2.4 Configurar API Key
```bash
# Reemplaza AIzaSy... con tu key real
supabase secrets set GEMINI_API_KEY=AIzaSy_tu_key_aqui
```

### 2.5 Verificar
```bash
supabase secrets list

# Deberías ver:
# GEMINI_API_KEY | ••••••••
```

---

## 🚀 PASO 3: DESPLEGAR (1 minuto)

### 3.1 Desplegar Edge Function
```bash
# Desde la raíz del proyecto
supabase functions deploy chat-ia
```

Verás algo como:
```
✅ Deploying function chat-ia
✅ Function deployed successfully
   URL: https://cvezncgcdsjntzrzztrj.supabase.co/functions/v1/chat-ia
```

### 3.2 Verificar deployment
```bash
supabase functions list

# Deberías ver:
# chat-ia | deployed | v1
```

---

## 🎉 PASO 4: PROBAR (1 minuto)

### 4.1 Iniciar aplicación
```bash
npm run dev
```

### 4.2 Ir al chat
```
http://localhost:3000/chat
```

### 4.3 Enviar mensaje
Escribe: "Hola, me siento un poco ansioso"

Deberías recibir una respuesta empática de la IA en ~2 segundos ⚡

---

## ✅ ¡LISTO! TU IA YA ESTÁ FUNCIONANDO

### 📊 Lo que tienes ahora:

- ✅ **IA real** con Google Gemini 2.0 Flash
- ✅ **1,000 requests/día** completamente gratis
- ✅ **Análisis de emociones** automático
- ✅ **Historial de conversación** (últimos 8 mensajes)
- ✅ **Respuestas naturales** en español
- ✅ **Guardado automático** en Supabase

---

## 🐛 TROUBLESHOOTING

### Error: "GEMINI_API_KEY no configurada"

**Solución:**
```bash
# 1. Verificar que configuraste el secret
supabase secrets list

# 2. Si no aparece, configúralo de nuevo
supabase secrets set GEMINI_API_KEY=AIzaSy...

# 3. Re-desplegar
supabase functions deploy chat-ia
```

### Error: "API key not valid"

**Solución:**
```bash
# 1. Verificar que copiaste la key completa (empieza con AIzaSy)
# 2. Crear nueva key en https://aistudio.google.com/apikey
# 3. Configurarla de nuevo
supabase secrets set GEMINI_API_KEY=AIzaSy_nueva_key
```

### La IA no responde en el chat

**Solución:**
```bash
# 1. Ver logs de la función
supabase functions logs chat-ia

# 2. Verificar que está desplegada
supabase functions list

# 3. Re-desplegar si es necesario
supabase functions deploy chat-ia
```

### Error: "429 Too Many Requests"

**Causa:** Excediste el límite de 1,000 requests/día

**Solución:**
- Esperar hasta mañana (límite se resetea a medianoche Pacific Time)
- Los límites son muy generosos para desarrollo

---

## 📈 MONITOREO

### Ver logs en tiempo real
```bash
supabase functions logs chat-ia --follow
```

### Ver uso en Google AI Studio
```
https://aistudio.google.com/app/apikey
```

Verás:
- Requests realizadas hoy
- Tokens consumidos
- Límites restantes

---

## 🎯 LÍMITES DEL TIER GRATUITO

| Métrica | Límite | Resetea |
|---------|--------|---------|
| **Requests/día** | 1,000 | Diario (medianoche PT) |
| **Requests/minuto** | 15 | Por minuto |
| **Tokens/minuto** | 250,000 | Por minuto |
| **Costo** | $0.00 | Siempre gratis |

**Suficiente para:**
- 100+ usuarios activos por día
- ~30,000 mensajes por mes
- Validar tu MVP sin costo

---

## 🔐 SEGURIDAD

### ✅ Buenas prácticas implementadas:

- ✅ API Key en el servidor (Edge Function)
- ✅ NO expuesta en el frontend
- ✅ Supabase maneja la autenticación
- ✅ CORS configurado correctamente

### ⚠️ Importante:

- **NUNCA** pongas `GEMINI_API_KEY` en variables `NEXT_PUBLIC_*`
- **NUNCA** la incluyas en el código del frontend
- **NUNCA** la subas a GitHub (ya está en .gitignore)

---

## 📚 RECURSOS

**Google AI Studio:**
- Dashboard: https://aistudio.google.com
- API Keys: https://aistudio.google.com/apikey
- Documentación: https://ai.google.dev/gemini-api/docs

**Supabase:**
- Dashboard: https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj
- Functions: https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/functions
- Logs: Dentro de Functions → chat-ia

---

## 🎨 PERSONALIZACIÓN

### Cambiar modelo (archivo: `supabase/functions/chat-ia/index.ts:85`)

```typescript
// Modelo actual (recomendado)
gemini-2.0-flash-exp

// Alternativas:
gemini-2.5-flash       // Más rápido
gemini-2.5-pro        // Más inteligente (límites más bajos)
```

### Ajustar temperatura (línea 98)

```typescript
temperature: 0.7   // 0.0 = Predecible, 1.0 = Creativo
```

### Modificar prompt del sistema (línea 52)

```typescript
let contexto = `Eres Escuchodromo...
// 👈 Modifica esto para cambiar la personalidad
```

---

## 📞 SOPORTE

**Si tienes problemas:**

1. **Ver logs:**
   ```bash
   supabase functions logs chat-ia
   ```

2. **Verificar configuración:**
   ```bash
   supabase secrets list
   supabase functions list
   ```

3. **Re-desplegar:**
   ```bash
   supabase functions deploy chat-ia --no-verify-jwt
   ```

---

## ✅ CHECKLIST COMPLETO

- [ ] Obtener API Key de Gemini
- [ ] Instalar Supabase CLI
- [ ] Login en Supabase (`supabase login`)
- [ ] Vincular proyecto (`supabase link`)
- [ ] Configurar secret (`supabase secrets set GEMINI_API_KEY=...`)
- [ ] Desplegar función (`supabase functions deploy chat-ia`)
- [ ] Probar en aplicación (`npm run dev` → `/chat`)
- [ ] Verificar logs (`supabase functions logs chat-ia`)

---

**🎉 ¡Disfruta de tu IA completamente GRATIS!**

**Fecha:** 15 de Octubre, 2025
**Modelo:** Gemini 2.0 Flash (experimental)
**Costo:** $0.00 forever
