# 🏥 APLICAR MIGRACIÓN: SISTEMA DE PROFESIONALES Y CITAS

**Fecha**: 20 de Enero, 2025
**Responsable**: Claude Code
**Estado**: ⚠️ Pendiente de aplicar

---

## 📋 **RESUMEN**

Esta migración agrega el sistema completo de:
- ✅ **Registro de profesionales** (psicólogos, terapeutas)
- ✅ **Carga y validación de documentos** (títulos, licencias)
- ✅ **Sistema de citas** (agendamiento entre pacientes y profesionales)
- ✅ **Sistema de suscripciones** (planes de pago)
- ✅ **Calificaciones** de profesionales
- ✅ **Horarios** de disponibilidad
- ✅ **Supabase Storage** para documentos

---

## 🗂️ **ARCHIVOS DE MIGRACIÓN**

### 1. `20250120000000_profesionales_y_citas.sql`
**Tablas creadas**:
- `PerfilProfesional` - Información de profesionales
- `DocumentoProfesional` - Documentos de validación
- `HorarioProfesional` - Disponibilidad horaria
- `Cita` - Citas agendadas
- `Suscripcion` - Gestión de planes
- `CalificacionProfesional` - Reseñas y calificaciones

### 2. `20250120000001_rls_profesionales_citas.sql`
**Seguridad (RLS)**:
- Políticas para cada tabla
- Permisos por rol (USUARIO, TERAPEUTA, ADMIN)
- Políticas de Service Role para Edge Functions

### 3. `20250120000002_storage_documentos.sql`
**Storage**:
- Bucket `documentos-profesionales` (privado, 10MB)
- Bucket `avatares` (público, 2MB)
- Políticas de acceso por usuario

---

## 🚀 **INSTRUCCIONES DE APLICACIÓN**

### **Opción 1: Dashboard de Supabase (Recomendada)**

1. **Ir al Dashboard de Supabase**
   ```
   https://app.supabase.com/project/TU_PROJECT_ID/editor
   ```

2. **Ir a SQL Editor**
   - Click en "SQL Editor" en el menú lateral
   - Click en "+ New Query"

3. **Aplicar las 3 migraciones en orden**:

   **Paso 1**: Copiar y ejecutar `20250120000000_profesionales_y_citas.sql`
   ```sql
   -- Copiar TODO el contenido del archivo y ejecutar
   ```

   **Paso 2**: Copiar y ejecutar `20250120000001_rls_profesionales_citas.sql`
   ```sql
   -- Copiar TODO el contenido del archivo y ejecutar
   ```

   **Paso 3**: Copiar y ejecutar `20250120000002_storage_documentos.sql`
   ```sql
   -- Copiar TODO el contenido del archivo y ejecutar
   ```

4. **Verificar en la consola** que no haya errores

---

### **Opción 2: Supabase CLI**

Si tienes Supabase CLI instalado:

```bash
# Navegar al directorio del proyecto
cd /path/to/escuchodromo

# Aplicar migraciones
supabase db push

# O aplicar manualmente
supabase db execute -f supabase/migrations/20250120000000_profesionales_y_citas.sql
supabase db execute -f supabase/migrations/20250120000001_rls_profesionales_citas.sql
supabase db execute -f supabase/migrations/20250120000002_storage_documentos.sql
```

---

### **Opción 3: psql (PostgreSQL CLI)**

Si tienes acceso directo a PostgreSQL:

```bash
# Obtener la URL de conexión desde Supabase Dashboard > Settings > Database

# Ejecutar migraciones
psql "postgresql://..." < supabase/migrations/20250120000000_profesionales_y_citas.sql
psql "postgresql://..." < supabase/migrations/20250120000001_rls_profesionales_citas.sql
psql "postgresql://..." < supabase/migrations/20250120000002_storage_documentos.sql
```

---

## ✅ **VERIFICACIÓN POST-MIGRACIÓN**

Después de aplicar, verificar que las tablas existen:

```sql
-- Ejecutar en SQL Editor de Supabase
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'PerfilProfesional',
    'DocumentoProfesional',
    'HorarioProfesional',
    'Cita',
    'Suscripcion',
    'CalificacionProfesional'
  )
ORDER BY table_name;
```

**Resultado esperado**: 6 tablas

---

Verificar que los buckets de Storage existen:

```sql
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id IN ('documentos-profesionales', 'avatares');
```

**Resultado esperado**: 2 buckets

---

## 🔧 **CONFIGURACIÓN POST-MIGRACIÓN**

### 1. Configurar variables de entorno

Actualizar `.env.local` o `.env`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Storage
NEXT_PUBLIC_SUPABASE_STORAGE_URL=https://TU_PROJECT_ID.supabase.co/storage/v1
```

### 2. Verificar Storage en Dashboard

1. Ir a **Storage** en Supabase Dashboard
2. Verificar que existen:
   - ✅ `documentos-profesionales` (privado)
   - ✅ `avatares` (público)

---

## 🎯 **DATOS DE PRUEBA (OPCIONAL)**

Para probar el sistema, puedes insertar datos de prueba:

```sql
-- Crear un usuario terapeuta de prueba
INSERT INTO "Usuario" (email, nombre, rol, esta_activo)
VALUES ('terapeuta@ejemplo.com', 'Dr. Juan Pérez', 'TERAPEUTA', true)
RETURNING id;

-- Usar el ID del usuario para crear su perfil profesional
INSERT INTO "PerfilProfesional" (
  usuario_id,
  titulo_profesional,
  numero_licencia,
  universidad,
  anos_experiencia,
  especialidades,
  biografia,
  tarifa_por_sesion,
  perfil_aprobado,
  documentos_verificados
) VALUES (
  'ID_DEL_USUARIO_ANTERIOR',
  'Psicólogo Clínico',
  'PSI-2024-12345',
  'Universidad Nacional de Colombia',
  10,
  ARRAY['Ansiedad', 'Depresión', 'Terapia Cognitivo-Conductual'],
  'Psicólogo clínico con 10 años de experiencia en tratamiento de trastornos de ansiedad y depresión.',
  100000,
  true,
  true
);

-- Crear horarios de ejemplo (Lunes a Viernes 9am-5pm)
INSERT INTO "HorarioProfesional" (
  perfil_profesional_id,
  dia_semana,
  hora_inicio,
  hora_fin,
  duracion_sesion,
  activo
)
SELECT
  pp.id,
  dia,
  '09:00'::TIME,
  '17:00'::TIME,
  60,
  true
FROM "PerfilProfesional" pp
CROSS JOIN generate_series(1, 5) AS dia
WHERE pp.numero_licencia = 'PSI-2024-12345';
```

---

## ⚠️ **IMPORTANTE**

1. **Backup**: Antes de aplicar, hacer backup de la base de datos
2. **Ambiente de prueba**: Probar primero en un proyecto de desarrollo
3. **Service Role**: Las Edge Functions necesitan `SUPABASE_SERVICE_ROLE_KEY` para gestionar suscripciones
4. **Storage**: Verificar que los límites de tamaño sean adecuados para tu plan de Supabase

---

## 📞 **SOPORTE**

Si encuentras errores:

1. Verificar los logs del SQL Editor
2. Verificar que la extensión `uuid-ossp` esté habilitada
3. Verificar permisos de RLS en Supabase Dashboard > Authentication > Policies
4. Consultar documentación de Supabase: https://supabase.com/docs

---

## 📊 **PRÓXIMOS PASOS**

Después de aplicar esta migración:

1. ✅ Implementar formulario de registro de profesionales
2. ✅ Implementar componente de carga de documentos
3. ✅ Implementar calendario de citas
4. ✅ Implementar dashboard de profesionales
5. ✅ Implementar panel de administración para aprobar profesionales

---

**¿Listo para aplicar?** 🚀
Sigue las instrucciones de **Opción 1** (Dashboard) para comenzar.
