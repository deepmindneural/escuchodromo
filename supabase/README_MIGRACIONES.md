# 🗂️ GUÍA RÁPIDA DE MIGRACIONES - ESCUCHODROMO

## ✅ Estado Actual: SCRIPTS LISTOS PARA EJECUTAR

Todas las migraciones y scripts necesarios han sido creados y están listos para ser aplicados manualmente a través del Supabase SQL Editor.

---

## 📁 Archivos Disponibles

### 🎯 Scripts de Aplicación

| Archivo | Propósito | Cuándo Usar |
|---------|-----------|-------------|
| **PASOS_APLICAR_MIGRACIONES.md** | Guía completa paso a paso | 👉 **EMPIEZA AQUÍ** |
| **CREAR_TABLAS_FALTANTES.sql** | Crea las 10 tablas faltantes | Paso 1 |
| **VERIFICAR_MIGRACION_COMPLETA.sql** | Verifica que todo esté correcto | Después de cada paso |
| **VER_ESTRUCTURA_COMPLETA.sql** | Diagnóstico de estructura actual | Cuando necesites ver el estado |
| **ARREGLAR_SUSCRIPCION.sql** | Agrega columnas a Suscripcion | Si Suscripcion está incompleta |
| **LIMPIAR_Y_REAPLICAR.sql** | Reset completo | ⚠️ Solo si algo sale muy mal |

### 🔐 Migraciones de Seguridad (en orden)

| # | Archivo | Descripción |
|---|---------|-------------|
| 1️⃣ | `20251020000000_encriptacion_phi.sql` | Encriptación AES-256 para PHI |
| 2️⃣ | `20251020000001_auditoria_phi.sql` | Auditoría HIPAA completa |
| 3️⃣ | `20251020000002_consentimientos_granulares.sql` | Consentimientos GDPR |
| 4️⃣ | `20251020000003_stripe_idempotencia.sql` | Pagos seguros Stripe |

### 🔧 Edge Functions

| Función | Ruta | Propósito |
|---------|------|-----------|
| **reservar-cita** | `functions/reservar-cita/` | Sistema de reservas seguro |
| **disponibilidad-profesional** | `functions/disponibilidad-profesional/` | Consulta de horarios |
| **progreso-paciente** | `functions/progreso-paciente/` | Tracking automático |
| **webhook-stripe** | `functions/webhook-stripe/` | Webhook Stripe mejorado |

---

## 🚀 INICIO RÁPIDO

### Opción 1: Ejecución Rápida (Recomendada)

```bash
# 1. Abrir SQL Editor
open "https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/sql/new"

# 2. Copiar contenido de CREAR_TABLAS_FALTANTES.sql
# 3. Pegar en SQL Editor
# 4. Click en RUN
# 5. Verificar con VERIFICAR_MIGRACION_COMPLETA.sql
```

### Opción 2: Guía Completa Paso a Paso

Lee **PASOS_APLICAR_MIGRACIONES.md** para instrucciones detalladas.

---

## 📊 Estado de la Base de Datos

### Tablas Existentes (7/18)
- ✅ Usuario
- ✅ PerfilUsuario
- ✅ Evaluacion
- ✅ Resultado
- ✅ Mensaje
- ✅ Conversacion
- ✅ Pago
- ✅ Suscripcion

### Tablas Faltantes (10)
- ❌ PerfilProfesional
- ❌ DocumentoProfesional
- ❌ HorarioProfesional
- ❌ Cita
- ❌ CalificacionProfesional
- ❌ NotaSesionEncriptada
- ❌ AuditoriaAccesoPHI
- ❌ ConsentimientoDetallado
- ❌ StripeEvento
- ❌ PagoCita

**Total esperado:** 18 tablas
**Progreso:** 39% (7/18)

---

## ⚡ Accesos Rápidos

### Supabase Dashboard
- **SQL Editor:** https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/sql/new
- **Table Editor:** https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/editor
- **Secrets:** https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/settings/vault
- **Functions:** https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/functions

### Documentación
- **Guía de migraciones:** PASOS_APLICAR_MIGRACIONES.md
- **Verificación:** VERIFICAR_MIGRACION_COMPLETA.sql
- **Diagnóstico:** VER_ESTRUCTURA_COMPLETA.sql

---

## 🎯 Checklist de Implementación

### Fase 1: Estructura Base
- [ ] Ejecutar `CREAR_TABLAS_FALTANTES.sql`
- [ ] Verificar con `VERIFICAR_MIGRACION_COMPLETA.sql`
- [ ] Confirmar 18 tablas creadas

### Fase 2: Seguridad y Permisos
- [ ] Aplicar RLS: `20250120000001_rls_profesionales_citas.sql`
- [ ] Encriptación: `20251020000000_encriptacion_phi.sql`
- [ ] Auditoría: `20251020000001_auditoria_phi.sql`
- [ ] Consentimientos: `20251020000002_consentimientos_granulares.sql`
- [ ] Stripe: `20251020000003_stripe_idempotencia.sql`

### Fase 3: Configuración
- [ ] Generar `PHI_ENCRYPTION_KEY` con `openssl rand -base64 32`
- [ ] Guardar en Supabase Secrets
- [ ] Configurar variables de entorno Edge Functions

### Fase 4: Edge Functions
- [ ] Desplegar `reservar-cita`
- [ ] Desplegar `disponibilidad-profesional`
- [ ] Desplegar `progreso-paciente`
- [ ] Actualizar `webhook-stripe`

### Fase 5: Verificación Final
- [ ] Ejecutar `VERIFICAR_MIGRACION_COMPLETA.sql`
- [ ] Confirmar 18 tablas
- [ ] Confirmar 11 funciones
- [ ] Confirmar RLS activo
- [ ] Confirmar 30+ políticas RLS

---

## 🔍 Troubleshooting

### ❌ Error: "relation already exists"
✅ **Solución:** La tabla ya fue creada. Es seguro ignorar este error.

### ❌ Error: "column does not exist"
✅ **Solución:** Ejecuta `ARREGLAR_SUSCRIPCION.sql` para agregar columnas faltantes.

### ❌ Error: "foreign key constraint"
✅ **Solución:** Las tablas se están creando en el orden incorrecto. Usa `CREAR_TABLAS_FALTANTES.sql` que ya tiene el orden correcto.

### ❌ Error: "function already exists"
✅ **Solución:** Cambia `CREATE FUNCTION` por `CREATE OR REPLACE FUNCTION`.

### ⚠️ No puedo conectar con psql
✅ **Solución:** Usa el SQL Editor en el dashboard de Supabase (ya está configurado).

---

## 📝 Notas Importantes

### Seguridad
- ⚠️ **NUNCA** compartas `PHI_ENCRYPTION_KEY`
- ⚠️ **NUNCA** commits secrets a Git
- ⚠️ Usa `SUPABASE_SERVICE_ROLE_KEY` solo en el backend
- ✅ La `ANON_KEY` es segura para el frontend con RLS

### Orden de Ejecución
1. **Primero:** Tablas base (CREAR_TABLAS_FALTANTES.sql)
2. **Segundo:** RLS y políticas
3. **Tercero:** Funciones de seguridad (encriptación, auditoría)
4. **Cuarto:** Edge Functions
5. **Quinto:** Verificación completa

### Datos Sensibles (PHI)
Estas tablas contienen datos médicos protegidos:
- `NotaSesionEncriptada` - Notas de terapia
- `Mensaje` - Conversaciones paciente-terapeuta
- `Resultado` - Resultados de evaluaciones psicológicas
- `Cita` - Detalles de citas médicas

**Todas deben tener RLS activo y encriptación configurada.**

---

## 🆘 Soporte

Si encuentras problemas:

1. **Revisa el log de errores** del SQL Editor
2. **Ejecuta** `VERIFICAR_MIGRACION_COMPLETA.sql` para diagnóstico
3. **Consulta** `VER_ESTRUCTURA_COMPLETA.sql` para ver el estado actual
4. **Lee** PASOS_APLICAR_MIGRACIONES.md para guía detallada

---

## ✅ Siguiente Paso

👉 **Abre:** `PASOS_APLICAR_MIGRACIONES.md` y sigue las instrucciones paso a paso.

---

**Última actualización:** 2025-10-20
**Versión:** 1.0
**Estado:** ✅ Listo para ejecutar
