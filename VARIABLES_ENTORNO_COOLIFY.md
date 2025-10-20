# 🔐 Variables de Entorno para Coolify

Guía completa de variables de entorno necesarias para el deployment de Escuchodromo en Coolify.

**Dominio:** https://escuchodromo.com/

---

## 📋 VARIABLES OBLIGATORIAS (CRÍTICAS)

### 1. Supabase (Backend)

```bash
# URL del proyecto Supabase
NEXT_PUBLIC_SUPABASE_URL=https://cvezncgcdsjntzrzztrj.supabase.co

# Clave pública (anon key)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2ZXpuY2djZHNqbnR6cnp6dHJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NjY2NjcsImV4cCI6MjA3NjA0MjY2N30.CddHpq9maykqCT9AfBAGRzidelWwdcYcWQ7pKm_81Q4

# Clave de servicio (service role) - SOLO PARA EDGE FUNCTIONS
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2ZXpuY2djZHNqbnR6cnp6dHJqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ2NjY2NywiZXhwIjoyMDc2MDQyNjY3fQ.oXTNtdzb5S316LlNguKOZzssvax--BxT1ypZBgjwRPs
```

**¿Dónde obtener?**
1. Ve a: https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/settings/api
2. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (¡Manténla secreta!)

---

### 2. Google Gemini AI (Chat y Análisis IA)

```bash
# API Key de Google Gemini (GRATIS - 1000 requests/día)
GEMINI_API_KEY=AIzaSyDgDUvZSVWz58pgBCTrgCA-uDLk0UZksYg
```

**¿Cómo obtener?**
1. Ve a: https://aistudio.google.com/apikey
2. Crea una nueva API key (o usa una existente)
3. Copia la clave completa (empieza con `AIza...`)

**Modelo usado:** `gemini-2.0-flash-exp`
**Límite gratuito:** 1,000 requests/día

---

### 3. NextAuth (Autenticación)

```bash
# URL de la aplicación
NEXTAUTH_URL=https://escuchodromo.com

# Secret para firmar JWTs
NEXTAUTH_SECRET=59aBQKq9XbTaIyWbtrN/ITcy8aeZvLsEPUvMHxfeMro=
```

**¿Cómo generar NEXTAUTH_SECRET?**
```bash
openssl rand -base64 32
```
O usa cualquier generador online: https://generate-secret.vercel.app/32

---

---

### 4. Base de Datos PostgreSQL (Opcional)

```bash
# Solo si necesitas conexión directa a la base de datos de Supabase
DATABASE_URL=postgresql://postgres:4nBShUbrGUSAr4@db.cvezncgcdsjntzrzztrj.supabase.co:5432/postgres
```

**Nota:** Normalmente NO necesitas esta variable. El cliente de Supabase usa la URL y las API keys directamente.

---

## 🔧 VARIABLES OPCIONALES (Recomendadas)

### 5. Node.js y Build

```bash
# Versión de Node.js (recomendada)
NODE_VERSION=20.11.1

# Entorno de ejecución
NODE_ENV=production

# Deshabilitar telemetría de Next.js (opcional)
NEXT_TELEMETRY_DISABLED=1
```

---

### 6. Stripe (Pagos) - OPCIONAL

Si planeas activar pagos:

```bash
# Clave publicable de Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Clave secreta de Stripe
STRIPE_SECRET_KEY=sk_live_...

# Webhook secret (para validar webhooks de Stripe)
STRIPE_WEBHOOK_SECRET=whsec_...
```

**¿Dónde obtener?**
- Dashboard de Stripe: https://dashboard.stripe.com/apikeys

---

### 7. Encriptación de Datos Médicos (PHI)

```bash
# Clave de encriptación para datos médicos sensibles
PHI_ENCRYPTION_KEY=MVESqdWxjoU6+SNKjg1FR4spKsUbuCidBcFIV+F76/E=
```

**¿Cómo generar?**
```bash
openssl rand -base64 32
```

---

## 📊 RESUMEN DE VARIABLES

### ✅ Obligatorias (6) - VALORES LISTOS
1. ✅ `NEXT_PUBLIC_SUPABASE_URL` → https://cvezncgcdsjntzrzztrj.supabase.co
2. ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` → eyJhbGciOiJIUzI1...
3. ✅ `SUPABASE_SERVICE_ROLE_KEY` → eyJhbGciOiJIUzI1...
4. ✅ `GEMINI_API_KEY` → AIzaSyDgDUvZSVWz...
5. ✅ `NEXTAUTH_SECRET` → 59aBQKq9XbTaIyWb...
6. ✅ `NEXTAUTH_URL` → https://escuchodromo.com

### ⚙️ Recomendadas (1) - VALORES LISTOS
7. ✅ `PHI_ENCRYPTION_KEY` → MVESqdWxjoU6+SNKj...

### 📦 Opcionales según features
8. ⏸️ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (si usas pagos)
9. ⏸️ `STRIPE_SECRET_KEY` (si usas pagos)
10. ⏸️ `STRIPE_WEBHOOK_SECRET` (si usas webhooks de pagos)
11. ⏸️ `DATABASE_URL` (si necesitas conexión directa a PostgreSQL)

---

## 🚀 PASOS PARA CONFIGURAR EN COOLIFY

### 1. Acceder a tu aplicación en Coolify

- Ve a tu aplicación Escuchodromo en Coolify
- Busca la sección **Environment Variables** o **Configuration**

### 2. Agregar variables una por una

Formato en Coolify:
```
NOMBRE_VARIABLE=valor_sin_comillas
```

**Ejemplo (copia y pega esto en Coolify):**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://cvezncgcdsjntzrzztrj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2ZXpuY2djZHNqbnR6cnp6dHJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NjY2NjcsImV4cCI6MjA3NjA0MjY2N30.CddHpq9maykqCT9AfBAGRzidelWwdcYcWQ7pKm_81Q4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2ZXpuY2djZHNqbnR6cnp6dHJqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ2NjY2NywiZXhwIjoyMDc2MDQyNjY3fQ.oXTNtdzb5S316LlNguKOZzssvax--BxT1ypZBgjwRPs
GEMINI_API_KEY=AIzaSyDgDUvZSVWz58pgBCTrgCA-uDLk0UZksYg
NEXTAUTH_URL=https://escuchodromo.com
NEXTAUTH_SECRET=59aBQKq9XbTaIyWbtrN/ITcy8aeZvLsEPUvMHxfeMro=
PHI_ENCRYPTION_KEY=MVESqdWxjoU6+SNKjg1FR4spKsUbuCidBcFIV+F76/E=
```

### 3. Guardar y Redeploy

1. Guarda todas las variables
2. Haz un nuevo deployment
3. Verifica los logs para confirmar que no hay errores de variables faltantes

---

## 🧪 VERIFICAR CONFIGURACIÓN

Después del deployment, verifica:

### 1. Variables de Supabase
```bash
# En el build log, busca:
✓ Compiled successfully
```

Si ves este error, faltan variables:
```
Error: @supabase/ssr: Your project's URL and API key are required
```

### 2. Variables de Gemini
Las Edge Functions en Supabase ya tienen acceso a `GEMINI_API_KEY` porque las configuraste con:
```bash
npx supabase secrets set GEMINI_API_KEY=tu_key_aqui
```

---

## ⚠️ IMPORTANTE: SEGURIDAD

### Variables que NUNCA deben estar en el código:
- ❌ `SUPABASE_SERVICE_ROLE_KEY` (solo en Coolify y Supabase)
- ❌ `NEXTAUTH_SECRET` (solo en Coolify)
- ❌ `STRIPE_SECRET_KEY` (solo en Coolify)
- ❌ `PHI_ENCRYPTION_KEY` (solo en Coolify)

### Variables públicas (pueden estar en el frontend):
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

---

## 📝 CHECKLIST

Antes de hacer deployment en Coolify:

- [ ] Configurar `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Configurar `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Configurar `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Obtener API key de Google AI Studio
- [ ] Configurar `GEMINI_API_KEY`
- [ ] Generar `NEXTAUTH_SECRET` aleatorio
- [ ] Configurar `NEXTAUTH_URL=https://escuchodromo.com`
- [ ] Generar `PHI_ENCRYPTION_KEY` aleatorio (opcional pero recomendado)
- [ ] Guardar y hacer redeploy
- [ ] Verificar logs del build
- [ ] Probar la aplicación en https://escuchodromo.com

---

## 🔗 RECURSOS

- Supabase API Settings: https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/settings/api
- Google AI Studio: https://aistudio.google.com/apikey
- Stripe Dashboard: https://dashboard.stripe.com/apikeys
- Generador de Secrets: https://generate-secret.vercel.app/32

---

**Última actualización:** 2025-10-20
**Proyecto:** Escuchodromo
**Dominio:** https://escuchodromo.com
