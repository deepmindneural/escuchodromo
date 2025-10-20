# 📦 Comandos para desplegar Edge Functions

## 🚀 Opción 1: Desplegar TODAS las funciones (Recomendado)

```bash
./deploy-edge-functions.sh
```

Este script desplegará las **22 Edge Functions** automáticamente.

---

## 🔧 Opción 2: Comandos individuales

### Pre-requisito: Login y Link

```bash
# Login a Supabase (solo la primera vez)
npx supabase login

# Link al proyecto
npx supabase link --project-ref cvezncgcdsjntzrzztrj
```

---

## 📅 SISTEMA DE RESERVAS (4 funciones)

```bash
# 1. Reservar cita (con validación, encriptación y rate limiting)
npx supabase functions deploy reservar-cita --no-verify-jwt

# 2. Consultar disponibilidad de profesional
npx supabase functions deploy disponibilidad-profesional --no-verify-jwt

# 3. Tracking de progreso del paciente
npx supabase functions deploy progreso-paciente --no-verify-jwt

# 4. Webhook de Stripe con idempotencia
npx supabase functions deploy webhook-stripe --no-verify-jwt
```

---

## 👥 GESTIÓN DE PROFESIONALES (5 funciones)

```bash
# 5. Listar y buscar profesionales
npx supabase functions deploy listar-profesionales --no-verify-jwt

# 6. Registrar nuevo profesional (con validaciones)
npx supabase functions deploy registrar-profesional --no-verify-jwt

# 7. Subir documentos de profesional (PDF, JPG, PNG)
npx supabase functions deploy subir-documento-profesional --no-verify-jwt

# 8. Configurar horarios de disponibilidad
npx supabase functions deploy configurar-disponibilidad --no-verify-jwt

# 9. Obtener horarios configurados
npx supabase functions deploy obtener-disponibilidad --no-verify-jwt
```

---

## 🤖 INTELIGENCIA ARTIFICIAL (7 funciones)

```bash
# 10. Chat principal con Gemini AI
npx supabase functions deploy chat-ia --no-verify-jwt

# 11. Análisis post-sesión automático
npx supabase functions deploy analisis-post-chat --no-verify-jwt

# 12. Detección de crisis y alertas urgentes
npx supabase functions deploy alerta-urgente --no-verify-jwt

# 13. Insights para dashboard del profesional
npx supabase functions deploy insights-dashboard --no-verify-jwt

# 14. Generar reportes clínicos
npx supabase functions deploy generar-reporte-clinico --no-verify-jwt

# 15. Generar resumen pre-cita
npx supabase functions deploy generar-reporte-pre-cita --no-verify-jwt

# 16. Generación batch de reportes semanales
npx supabase functions deploy batch-reportes-semanales --no-verify-jwt
```

---

## 📊 EVALUACIONES (2 funciones)

```bash
# 17. Procesar evaluaciones PHQ-9 y GAD-7
npx supabase functions deploy procesar-evaluacion --no-verify-jwt

# 18. Generar recomendaciones personalizadas con IA
npx supabase functions deploy generar-recomendaciones --no-verify-jwt
```

---

## 💳 PAGOS Y SUSCRIPCIONES (2 funciones)

```bash
# 19. Crear sesión de checkout en Stripe
npx supabase functions deploy crear-checkout-stripe --no-verify-jwt

# 20. Gestionar suscripciones
npx supabase functions deploy gestionar-suscripcion --no-verify-jwt
```

---

## 🔧 UTILIDADES (2 funciones)

```bash
# 21. Obtener historial completo del usuario
npx supabase functions deploy obtener-historial-usuario --no-verify-jwt

# 22. Enviar formulario de contacto
npx supabase functions deploy enviar-contacto --no-verify-jwt
```

---

## 🔐 CONFIGURAR SECRETS (IMPORTANTE)

Después de desplegar las funciones, configura los secrets necesarios:

```bash
# 1. Clave de encriptación para PHI (datos médicos)
npx supabase secrets set PHI_ENCRYPTION_KEY=$(openssl rand -base64 32)

# 2. Stripe Webhook Secret (obtenerlo de Stripe Dashboard)
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_tu_secret_aqui

# 3. Gemini API Key (para funciones de IA)
npx supabase secrets set GEMINI_API_KEY=tu_api_key_aqui

# 4. Verificar secrets configurados
npx supabase secrets list
```

---

## 📋 VERIFICAR DESPLIEGUE

```bash
# Listar todas las funciones desplegadas
npx supabase functions list

# Ver logs de una función específica
npx supabase functions logs reservar-cita

# Ver logs en tiempo real
npx supabase functions logs reservar-cita --follow
```

---

## 🧪 PROBAR FUNCIONES

```bash
# Invocar una función localmente para testing
npx supabase functions serve reservar-cita

# Probar con curl
curl -i --location --request POST \
  'http://localhost:54321/functions/v1/reservar-cita' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "profesional_id": "test-id",
    "fecha_hora": "2025-10-25T10:00:00Z",
    "duracion": 60,
    "modalidad": "virtual",
    "motivo_consulta": "Consulta de prueba"
  }'
```

---

## ⚠️ TROUBLESHOOTING

### Error: "Not logged in"
```bash
npx supabase login
```

### Error: "Project not linked"
```bash
npx supabase link --project-ref cvezncgcdsjntzrzztrj
```

### Error: "Function already exists"
- Es normal, simplemente se actualiza la función existente

### Error: "Invalid JWT"
- Usa el flag `--no-verify-jwt` para desarrollo
- Para producción, configura correctamente JWT en Supabase

### Redesplegar una función específica
```bash
npx supabase functions deploy nombre-funcion --no-verify-jwt
```

---

## 📊 RESUMEN

**Total de funciones:** 22

- ✅ **4** Sistema de Reservas (CORE)
- ✅ **5** Gestión de Profesionales
- ✅ **7** Inteligencia Artificial (Gemini)
- ✅ **2** Evaluaciones Psicológicas
- ✅ **2** Pagos y Suscripciones
- ✅ **2** Utilidades

**Secrets requeridos:** 3
- `PHI_ENCRYPTION_KEY` (obligatorio)
- `STRIPE_WEBHOOK_SECRET` (obligatorio si usas pagos)
- `GEMINI_API_KEY` (obligatorio para funciones de IA)

---

## 🎯 URLs de las funciones desplegadas

Todas las funciones estarán disponibles en:

```
https://cvezncgcdsjntzrzztrj.supabase.co/functions/v1/<nombre-funcion>
```

Ejemplo:
```
https://cvezncgcdsjntzrzztrj.supabase.co/functions/v1/reservar-cita
```

---

**Fecha de actualización:** 2025-10-20
**Proyecto:** Escuchodromo
**Proyecto ID:** cvezncgcdsjntzrzztrj
