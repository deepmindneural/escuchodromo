# ✅ CHECKLIST DE IMPLEMENTACIÓN - SISTEMA DE RESERVAS

## 📋 PROGRESO

**Completado:** 0/8 pasos principales

---

## PASO 1: Crear Tablas Base (⏱️ 3 min)

- [ ] Abrir SQL Editor: https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/sql/new
- [ ] Copiar contenido de `CREAR_TABLAS_FALTANTES.sql`
- [ ] Pegar en SQL Editor
- [ ] Click en RUN
- [ ] Confirmar mensaje: "✅ 10 TABLAS CREADAS EXITOSAMENTE"

**Si hay errores:**
- [ ] Copiar mensaje de error completo
- [ ] Revisar PASOS_APLICAR_MIGRACIONES.md sección "Problemas"

---

## PASO 2: Verificar Creación (⏱️ 1 min)

- [ ] Copiar contenido de `VERIFICAR_MIGRACION_COMPLETA.sql`
- [ ] Pegar en SQL Editor
- [ ] Click en RUN
- [ ] Confirmar: "✅ TODAS LAS TABLAS CREADAS CORRECTAMENTE"

**Deberías ver:**
- [ ] 18 tablas existentes
- [ ] PerfilProfesional ✅
- [ ] DocumentoProfesional ✅
- [ ] HorarioProfesional ✅
- [ ] Cita ✅
- [ ] CalificacionProfesional ✅
- [ ] NotaSesionEncriptada ✅
- [ ] AuditoriaAccesoPHI ✅
- [ ] ConsentimientoDetallado ✅
- [ ] StripeEvento ✅
- [ ] PagoCita ✅

---

## PASO 3: Aplicar RLS (⏱️ 2 min)

- [ ] Abrir `migrations/20250120000001_rls_profesionales_citas.sql`
- [ ] Copiar TODO el contenido
- [ ] Pegar en SQL Editor
- [ ] Click en RUN
- [ ] Confirmar sin errores

**Qué hace:**
- [ ] Habilita RLS en tablas sensibles
- [ ] Crea políticas de acceso por rol
- [ ] Protege datos de pacientes

---

## PASO 4: Seguridad - Encriptación (⏱️ 2 min)

- [ ] Abrir `migrations/20251020000000_encriptacion_phi.sql`
- [ ] Copiar contenido completo
- [ ] Pegar en SQL Editor
- [ ] Click en RUN
- [ ] Confirmar funciones creadas:
  - [ ] encriptar_nota_sesion()
  - [ ] desencriptar_nota_sesion()

---

## PASO 5: Seguridad - Auditoría (⏱️ 2 min)

- [ ] Abrir `migrations/20251020000001_auditoria_phi.sql`
- [ ] Copiar contenido completo
- [ ] Pegar en SQL Editor
- [ ] Click en RUN
- [ ] Confirmar funciones creadas:
  - [ ] registrar_acceso_phi()
  - [ ] detectar_accesos_sospechosos()

---

## PASO 6: Seguridad - Consentimientos (⏱️ 2 min)

- [ ] Abrir `migrations/20251020000002_consentimientos_granulares.sql`
- [ ] Copiar contenido completo
- [ ] Pegar en SQL Editor
- [ ] Click en RUN
- [ ] Confirmar funciones creadas:
  - [ ] verificar_consentimiento()
  - [ ] otorgar_consentimiento()
  - [ ] revocar_consentimiento()
  - [ ] consentimientos_proximos_vencer()

---

## PASO 7: Seguridad - Stripe Idempotencia (⏱️ 1 min)

- [ ] Abrir `migrations/20251020000003_stripe_idempotencia.sql`
- [ ] Copiar contenido completo
- [ ] Pegar en SQL Editor
- [ ] Click en RUN
- [ ] Confirmar funciones creadas:
  - [ ] registrar_stripe_evento()
  - [ ] procesar_pago_cita()

---

## PASO 8: Configurar Clave de Encriptación (⏱️ 3 min) ⚠️ CRÍTICO

- [ ] Abrir terminal
- [ ] Ejecutar: `openssl rand -base64 32`
- [ ] Copiar la clave generada
- [ ] **GUARDAR LA CLAVE EN GESTOR DE CONTRASEÑAS** ⚠️
- [ ] Ir a: https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/settings/vault
- [ ] Click "New Secret"
- [ ] Name: `PHI_ENCRYPTION_KEY`
- [ ] Value: [pegar clave]
- [ ] Click "Add Secret"

**⚠️ IMPORTANTE:**
- [ ] Clave guardada en gestor de contraseñas seguro
- [ ] NUNCA compartir esta clave
- [ ] NUNCA hacer commit de esta clave a Git

---

## PASO 9: Verificar Migraciones (⏱️ 1 min)

- [ ] Ejecutar de nuevo `VERIFICAR_MIGRACION_COMPLETA.sql`
- [ ] Confirmar resultados:
  - [ ] 18 tablas ✅
  - [ ] 11 funciones ✅
  - [ ] 16 tablas con RLS ✅
  - [ ] 30+ políticas RLS ✅
  - [ ] Mensaje: "✅✅✅ MIGRACIÓN COMPLETADA EXITOSAMENTE"

---

## PASO 10: Desplegar Edge Functions (⏱️ 5 min)

### 10.1 Configurar Supabase CLI
- [ ] Ejecutar: `npx supabase login`
- [ ] Ejecutar: `npx supabase link --project-ref cvezncgcdsjntzrzztrj`

### 10.2 Desplegar Funciones
- [ ] `npx supabase functions deploy reservar-cita`
- [ ] `npx supabase functions deploy disponibilidad-profesional`
- [ ] `npx supabase functions deploy progreso-paciente`
- [ ] `npx supabase functions deploy webhook-stripe`

### 10.3 Configurar Secrets
- [ ] Generar nueva clave: `openssl rand -base64 32`
- [ ] Ejecutar: `npx supabase secrets set PHI_ENCRYPTION_KEY=[clave]`
- [ ] (Más tarde) `npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...`

---

## PASO 11: Configurar Stripe Webhook (⏱️ 3 min)

- [ ] Ir a: https://dashboard.stripe.com/webhooks
- [ ] Click "Add endpoint"
- [ ] URL: `https://cvezncgcdsjntzrzztrj.supabase.co/functions/v1/webhook-stripe`
- [ ] Seleccionar eventos:
  - [ ] checkout.session.completed
  - [ ] payment_intent.succeeded
  - [ ] payment_intent.payment_failed
  - [ ] invoice.paid
  - [ ] invoice.payment_failed
- [ ] Click "Add endpoint"
- [ ] Copiar "Signing secret" (whsec_...)
- [ ] Ejecutar: `npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...`

---

## PASO 12: Verificación Final (⏱️ 2 min)

### Database
- [ ] Ejecutar `VERIFICAR_MIGRACION_COMPLETA.sql`
- [ ] Todas las verificaciones pasan ✅

### Edge Functions
- [ ] Ir a: https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/functions
- [ ] Confirmar 4 funciones desplegadas:
  - [ ] reservar-cita
  - [ ] disponibilidad-profesional
  - [ ] progreso-paciente
  - [ ] webhook-stripe

### Secrets
- [ ] Ir a: https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/settings/vault
- [ ] Confirmar secrets configurados:
  - [ ] PHI_ENCRYPTION_KEY
  - [ ] STRIPE_WEBHOOK_SECRET (si ya configuraste Stripe)

---

## PASO 13: Pruebas Básicas (⏱️ 5 min)

### Test 1: Verificar Tablas
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```
- [ ] 18 tablas listadas

### Test 2: Verificar RLS
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('Cita', 'PerfilProfesional', 'NotaSesionEncriptada');
```
- [ ] Todas con rowsecurity = 't'

### Test 3: Test Edge Function (reservar-cita)
```bash
curl -X POST \
  'https://cvezncgcdsjntzrzztrj.supabase.co/functions/v1/reservar-cita' \
  -H 'Authorization: Bearer [TU_ANON_KEY]' \
  -H 'Content-Type: application/json' \
  -d '{
    "profesional_id": "test",
    "fecha_hora": "2025-10-25T10:00:00Z",
    "duracion": 60,
    "modalidad": "virtual"
  }'
```
- [ ] Respuesta recibida (aunque sea error de autenticación - confirma que funciona)

---

## NOTAS Y ERRORES

### Errores Encontrados
```
[Anota aquí cualquier error que encuentres]




```

### Soluciones Aplicadas
```
[Anota aquí cómo resolviste los errores]




```

### Observaciones
```
[Cualquier observación importante]




```

---

## ✅ IMPLEMENTACIÓN COMPLETADA

- [ ] Todos los pasos completados
- [ ] Sin errores pendientes
- [ ] Verificaciones finales pasan
- [ ] Edge Functions desplegadas
- [ ] Secrets configurados
- [ ] Stripe webhook funcionando

**Fecha de finalización:** ___________________

**Tiempo total invertido:** ___________ minutos

---

## 🎯 PRÓXIMOS PASOS (POST-IMPLEMENTACIÓN)

### Frontend
- [ ] Integrar componentes de reserva en la interfaz
- [ ] Conectar dashboard del profesional
- [ ] Implementar visualización de progreso del paciente
- [ ] Probar flujo completo de reserva

### Testing
- [ ] Pruebas de encriptación
- [ ] Pruebas de auditoría
- [ ] Pruebas de consentimientos
- [ ] Pruebas de pagos con Stripe (modo test)

### Monitoreo
- [ ] Configurar alertas de accesos sospechosos
- [ ] Revisar logs de auditoría semanalmente
- [ ] Monitorear errores en Edge Functions

### Documentación
- [ ] Documentar flujos de usuario
- [ ] Crear manual para profesionales
- [ ] Crear manual para pacientes
- [ ] Documentar procedimientos de emergencia

---

**Última actualización:** 2025-10-20
**Versión:** 1.0
