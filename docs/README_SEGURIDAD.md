# DOCUMENTACIÓN DE SEGURIDAD - ÁREA ADMIN
## Escuchodromo

**Última Actualización:** 2025-10-23
**Versión:** 1.0

---

## INICIO RÁPIDO

Si eres nuevo en este proyecto y necesitas implementar seguridad en el área admin:

1. **Leer primero:** `RESUMEN_EJECUTIVO_SEGURIDAD.md` (10 minutos)
2. **Implementar:** `IMPLEMENTACION_SEGURIDAD_ADMIN.md` (3-4 horas)
3. **Consultar:** `GUIA_CUMPLIMIENTO_HIPAA_GDPR.md` (cuando sea necesario)
4. **Auditar:** `AUDITORIA_SEGURIDAD_ADMIN.md` (para entender vulnerabilidades resueltas)

---

## ÍNDICE DE DOCUMENTOS

### 📋 RESUMEN_EJECUTIVO_SEGURIDAD.md
**Audiencia:** Gerencia, Product Managers, Tech Leads
**Tiempo de lectura:** 10 minutos

**Contenido:**
- Problema identificado (vulnerabilidades críticas)
- Solución implementada (4 componentes)
- Arquitectura de seguridad
- Cumplimiento HIPAA/GDPR
- Plan de implementación
- Próximos pasos

**Cuándo leerlo:**
- Antes de aprobar el proyecto
- Para entender el impacto del problema
- Para presentar a stakeholders

---

### 🔨 IMPLEMENTACION_SEGURIDAD_ADMIN.md
**Audiencia:** Desarrolladores, DevOps
**Tiempo de implementación:** 3-4 horas

**Contenido:**
- Paso 1: Aplicar migración de base de datos
- Paso 2: Desplegar Edge Functions
- Paso 3: Actualizar frontend admin
- Paso 4: Implementar acceso PHI con justificación
- Paso 5: Configurar notificaciones
- Paso 6: Pruebas y validación
- Paso 7: Deployment a producción
- Paso 8: Capacitación del equipo
- Troubleshooting

**Cuándo consultarlo:**
- Durante la implementación (guía paso a paso)
- Si encuentras errores (sección Troubleshooting)
- Para configurar entornos de desarrollo

---

### 📖 GUIA_CUMPLIMIENTO_HIPAA_GDPR.md
**Audiencia:** Security Officers, Compliance Team, Legal
**Tiempo de lectura:** 60 minutos

**Contenido:**
- Introducción al cumplimiento
- HIPAA - Administrative Safeguards (§164.308)
- HIPAA - Physical Safeguards (§164.310)
- HIPAA - Technical Safeguards (§164.312)
- GDPR - Lawfulness of Processing (Art. 6)
- GDPR - Data Subject Rights (Art. 15-20)
- GDPR - Breach Notification (Art. 33-34)
- Procedimientos operacionales
- Plan de respuesta a incidentes
- Capacitación del personal
- Checklist de seguridad (pre-producción, mensual, trimestral, anual)

**Cuándo consultarlo:**
- Para auditorías de compliance
- Al preparar certificación HIPAA/SOC 2
- Para diseñar nuevas funcionalidades (Privacy by Design)
- Después de un incidente de seguridad

---

### 🔍 AUDITORIA_SEGURIDAD_ADMIN.md
**Audiencia:** Security Engineers, Auditores
**Tiempo de lectura:** 40 minutos

**Contenido:**
- Resumen ejecutivo (Estado: ⚠️ REQUIERE MEJORAS CRÍTICAS)
- Análisis de RLS Policies actuales
  - Tabla Usuario (ALTO riesgo)
  - Tabla Pago (MEDIO riesgo)
  - Tabla Resultado (ALTO riesgo)
  - Tabla Mensaje (CRÍTICO riesgo)
- Análisis de autenticación y autorización
- Análisis de queries y Edge Functions
- Análisis de datos sensibles (encriptación, audit logging)
- Cumplimiento HIPAA/GDPR (gaps identificados)
- Resumen de vulnerabilidades por severidad
- Recomendaciones prioritarias

**Cuándo consultarlo:**
- Para entender QUÉ estaba mal antes
- Para preparar presentaciones de seguridad
- Para justificar inversión en seguridad
- Para pentest o auditorías externas

---

## ESTRUCTURA DE ARCHIVOS

```
docs/
├── README_SEGURIDAD.md                      # Este archivo
├── RESUMEN_EJECUTIVO_SEGURIDAD.md          # Resumen para gerencia
├── IMPLEMENTACION_SEGURIDAD_ADMIN.md       # Guía paso a paso
├── GUIA_CUMPLIMIENTO_HIPAA_GDPR.md         # Compliance completo
└── AUDITORIA_SEGURIDAD_ADMIN.md            # Vulnerabilidades identificadas

supabase/
├── migrations/
│   └── 20251023000000_admin_security_hardening.sql
└── functions/
    ├── admin-obtener-usuarios/index.ts
    ├── admin-gestionar-suscripcion/index.ts
    ├── admin-acceso-phi/index.ts
    └── _shared/cors.ts
```

---

## FLUJOS DE TRABAJO COMUNES

### Flujo 1: Implementar por Primera Vez

```bash
# 1. Leer resumen ejecutivo
open docs/RESUMEN_EJECUTIVO_SEGURIDAD.md

# 2. Seguir guía de implementación
open docs/IMPLEMENTACION_SEGURIDAD_ADMIN.md

# 3. Aplicar migración
npx supabase db push

# 4. Desplegar Edge Functions
npx supabase functions deploy admin-obtener-usuarios
npx supabase functions deploy admin-gestionar-suscripcion
npx supabase functions deploy admin-acceso-phi

# 5. Actualizar frontend (ver guía)

# 6. Probar en desarrollo

# 7. Desplegar a producción
```

---

### Flujo 2: Preparar Auditoría HIPAA

```bash
# 1. Revisar guía de cumplimiento
open docs/GUIA_CUMPLIMIENTO_HIPAA_GDPR.md

# 2. Ejecutar checklist pre-auditoría
# (Ver sección "Checklist de Seguridad")

# 3. Generar reporte de audit logs
psql -h DB_HOST -U postgres -d postgres -f scripts/generar_reporte_auditoria.sql

# 4. Revisar gaps pendientes
# (Ver sección "Cumplimiento HIPAA")

# 5. Documentar remediaciones
```

---

### Flujo 3: Investigar Incidente de Seguridad

```bash
# 1. Revisar audit logs
SELECT * FROM "AuditLogAdmin"
WHERE creado_en >= now() - INTERVAL '24 hours'
ORDER BY creado_en DESC;

# 2. Detectar accesos sospechosos
SELECT * FROM detectar_accesos_sospechosos(7);

# 3. Seguir plan de respuesta a incidentes
# (Ver GUIA_CUMPLIMIENTO_HIPAA_GDPR.md > Respuesta a Incidentes)

# 4. Documentar post-mortem
```

---

## GLOSARIO

**PHI (Protected Health Information):**
Información médica protegida bajo HIPAA. En Escuchodromo incluye:
- Evaluaciones psicológicas (PHQ-9, GAD-7)
- Mensajes de chat con terapeutas
- Notas de sesiones
- Historial de síntomas

**RLS (Row Level Security):**
Políticas de seguridad a nivel de fila en PostgreSQL que controlan quién puede acceder a qué datos.

**Edge Function:**
Función serverless que se ejecuta en el edge (cerca del usuario) en Deno. Usado para validación backend.

**Audit Trail:**
Registro inmutable de todas las acciones realizadas en el sistema, con quién, cuándo, qué y por qué.

**Break the Glass:**
Procedimiento de acceso de emergencia a datos sensibles (ej. usuario en crisis suicida).

**Service Role Key:**
Clave de Supabase que bypassa RLS. Solo debe usarse en backend/Edge Functions.

---

## PREGUNTAS FRECUENTES

### ¿Por qué necesitamos esto?

**Respuesta:** Escuchodromo maneja PHI (datos médicos). Las regulaciones HIPAA y GDPR requieren:
- Audit trail completo de accesos a PHI
- Restricciones de acceso (mínimo privilegio)
- Encriptación de datos sensibles
- Procedimientos de respuesta a incidentes

Sin esto, la empresa enfrenta:
- Fines de hasta $1.5M/año (HIPAA)
- Fines de hasta €20M o 4% de ingresos globales (GDPR)
- Demandas de usuarios afectados
- Pérdida de reputación

---

### ¿Cuánto tiempo toma implementar?

**Respuesta:**
- **Implementación técnica:** 3-4 horas (siguiendo IMPLEMENTACION_SEGURIDAD_ADMIN.md)
- **Testing:** 2-3 horas
- **Deployment a producción:** 1 hora
- **Capacitación de equipo:** 2 horas

**Total:** ~1 día de trabajo

---

### ¿Qué pasa si ya tengo datos en producción?

**Respuesta:**
La migración es **no destructiva**. Solo:
- Agrega nuevas tablas (`AuditLogAdmin`)
- Agrega nuevas columnas (todas opcionales)
- Mejora RLS policies (más restrictivas)

**Acción requerida:**
- Backup antes de migración (siempre)
- Probar en staging primero
- Desplegar en horario de bajo tráfico

---

### ¿Cómo sé si está funcionando?

**Respuesta:**
Ejecutar tests de validación (ver IMPLEMENTACION_SEGURIDAD_ADMIN.md > Paso 6):

```sql
-- Test 1: Audit logging funciona
SELECT COUNT(*) FROM "AuditLogAdmin"
WHERE creado_en >= now() - INTERVAL '1 hour';
-- Debe retornar > 0 si hay actividad admin

-- Test 2: RLS bloquea modificación de evaluaciones
UPDATE "Resultado" SET puntuacion = 99 WHERE id = 'UUID_PRUEBA';
-- Debe FALLAR con error RLS

-- Test 3: Acceso a mensajes requiere justificación
SELECT * FROM "Mensaje" LIMIT 1;
-- Debe FALLAR hasta registrar justificación
```

---

### ¿Qué hago si encuentro un problema?

**Respuesta:**
1. Consultar sección **Troubleshooting** en IMPLEMENTACION_SEGURIDAD_ADMIN.md
2. Revisar logs de Edge Functions:
   ```bash
   npx supabase functions logs admin-obtener-usuarios
   ```
3. Revisar logs de base de datos (errores RLS)
4. Contactar a Security Officer: security@escuchodromo.com

---

## RECURSOS ADICIONALES

### Documentación Externa
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html)
- [GDPR Full Text](https://gdpr-info.eu/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

### Herramientas
- [SSL Labs](https://www.ssllabs.com/) - Test SSL/TLS
- [OWASP ZAP](https://www.zaproxy.org/) - Vulnerability scanning
- [Supabase CLI](https://supabase.com/docs/guides/cli) - Gestión de Supabase

### Contactos
- Security Officer: security@escuchodromo.com
- Tech Lead: tech@escuchodromo.com
- Compliance: compliance@escuchodromo.com

---

## CHANGELOG

| Versión | Fecha | Cambios | Autor |
|---------|-------|---------|-------|
| 1.0 | 2025-10-23 | Creación inicial - Sistema completo de seguridad admin | Claude Code |

---

## MANTENIMIENTO

### Revisión Trimestral
- [ ] Actualizar guía de cumplimiento con nuevos requerimientos
- [ ] Revisar y actualizar checklist de seguridad
- [ ] Verificar que toda la documentación está actualizada
- [ ] Agregar nuevos FAQs basados en preguntas del equipo

### Responsable
- Security Officer

### Próxima Revisión
- **Fecha:** 2026-01-23

---

**Nota:** Esta documentación es CONFIDENCIAL y solo debe compartirse con personal autorizado que tenga necesidad de acceso (need-to-know basis) para cumplir con regulaciones HIPAA.

---

**Generado por:** Claude Code - Backend Security Engineer
**Fecha:** 2025-10-23
