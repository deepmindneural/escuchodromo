# Corrección de Políticas RLS - Escuchodromo

## Problema Identificado

Las consultas a las tablas `Usuario` y `Suscripcion` estaban devolviendo errores **406 (Not Acceptable)** de Supabase, indicando que las políticas RLS (Row Level Security) están bloqueando las consultas.

### Errores Específicos:

1. **Suscripcion?select=plan&usuario_id=eq...&estado=eq.activa** → 406
2. **Usuario?select=id,rol&id=eq.b2c98619...** → 406

## Causa Raíz

Las políticas RLS originales eran demasiado restrictivas:

1. **Para Usuario**: La política verificaba solo `auth.uid() = auth_id`, pero cuando se consulta por `id` directamente (no por `auth_id`), la verificación fallaba.

2. **Para Suscripcion**: Las políticas no permitían consultas flexibles usando filtros como `usuario_id=eq.xxx&estado=eq.activa`.

3. **Relaciones Terapeuta-Paciente**: No había políticas para permitir que terapeutas vean datos básicos de sus pacientes.

## Solución Implementada

El archivo **`fix_rls_policies.sql`** implementa políticas RLS mejoradas que:

### ✅ Seguridad Mantenida

- **Principio de Mínimo Privilegio**: Usuarios solo acceden a sus propios datos
- **Separación de Roles**: ADMIN, TERAPEUTA, USUARIO tienen accesos diferenciados
- **Protección de PHI**: Datos sensibles protegidos según HIPAA/GDPR
- **Auditoría**: Nueva tabla `AuditoriaAcceso` para rastrear accesos

### ✅ Flexibilidad Agregada

- **Consultas por ID o auth_id**: Permite ambas formas de consulta
- **Filtros Complejos**: Soporta consultas con múltiples filtros
- **Acceso Terapeuta-Paciente**: Terapeutas ven datos de pacientes con citas activas
- **Service Role**: Edge Functions pueden gestionar datos vía webhooks

## Políticas Implementadas

### Tabla: Usuario

| Política | Descripción | Permite |
|----------|-------------|---------|
| `Usuario_ve_su_propio_perfil_mejorado` | Usuario ve su perfil | `SELECT` por `auth_id` o `id` |
| `Usuario_actualiza_su_propio_perfil_mejorado` | Usuario actualiza su perfil | `UPDATE` con validación de rol |
| `Admin_ve_todos_los_usuarios_mejorado` | Admin ve todos los usuarios | `SELECT` sin restricciones |
| `Admin_gestiona_usuarios_mejorado` | Admin gestiona usuarios | `ALL` sin restricciones |
| `Terapeuta_ve_sus_pacientes` | Terapeuta ve datos de pacientes | `SELECT` solo con citas activas |
| `Service_role_gestiona_usuarios` | Edge Functions gestionan usuarios | `ALL` para `service_role` |

### Tabla: Suscripcion

| Política | Descripción | Permite |
|----------|-------------|---------|
| `Usuario_ve_su_suscripcion_mejorado` | Usuario ve su suscripción | `SELECT` con filtros flexibles |
| `Usuario_crea_su_suscripcion_mejorado` | Usuario crea suscripción | `INSERT` solo para sí mismo |
| `Usuario_actualiza_su_suscripcion_mejorado` | Usuario actualiza suscripción | `UPDATE` con validaciones |
| `Admin_gestiona_suscripciones_mejorado` | Admin gestiona suscripciones | `ALL` sin restricciones |
| `Service_role_gestiona_suscripciones_mejorado` | Webhooks actualizan suscripciones | `ALL` para `service_role` |

## Nuevas Funcionalidades

### 1. Tabla de Auditoría

Se crea la tabla `AuditoriaAcceso` para compliance HIPAA/GDPR:

```sql
CREATE TABLE "AuditoriaAcceso" (
  id UUID PRIMARY KEY,
  usuario_auth_id UUID NOT NULL,
  usuario_rol TEXT NOT NULL,
  tabla TEXT NOT NULL,
  registro_id UUID,
  accion TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  accedido_en TIMESTAMP DEFAULT now(),
  metadata JSONB
);
```

**Solo ADMIN puede ver logs de auditoría** para proteger privacidad.

### 2. Protecciones Adicionales

- **Inmutabilidad de `usuario_id`**: No se puede cambiar el dueño de una suscripción
- **Protección de Roles**: Usuarios no pueden cambiar su propio rol
- **Validación de Relaciones**: Terapeutas solo ven pacientes con citas confirmadas/completadas

## Cómo Aplicar la Migración

### Opción 1: Via Supabase CLI (Recomendado)

```bash
# Navegar al directorio del proyecto
cd /Volumes/StarkT7/Proyectos/CLIENETS/proyectos/ESCUCHODROMO/Escuchodromo\ 2/escuchodromo

# Verificar estado de migraciones
npx supabase migration list

# Aplicar la migración
npx supabase db push
```

### Opción 2: Via SQL Editor de Supabase

1. Ir a **Supabase Dashboard** → **SQL Editor**
2. Copiar todo el contenido de `fix_rls_policies.sql`
3. Pegar en el editor
4. Ejecutar (botón "Run")

### Opción 3: Via psql

```bash
# Conectarse a la base de datos
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Ejecutar el archivo
\i supabase/migrations/fix_rls_policies.sql
```

## Verificación Post-Aplicación

### 1. Verificar que RLS está habilitado

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('Usuario', 'Suscripcion', 'AuditoriaAcceso');
```

**Resultado esperado**: `rowsecurity = true` para todas las tablas.

### 2. Verificar políticas creadas

```sql
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename IN ('Usuario', 'Suscripcion')
ORDER BY tablename, policyname;
```

**Resultado esperado**: 6 políticas para `Usuario`, 5 políticas para `Suscripcion`.

### 3. Probar consulta de Usuario

```sql
-- Como usuario autenticado
SET request.jwt.claims.sub = 'your-auth-uuid';

SELECT id, rol, nombre
FROM "Usuario"
WHERE id = 'your-user-uuid';
```

**Resultado esperado**: Retorna el usuario sin errores.

### 4. Probar consulta de Suscripcion

```sql
-- Como usuario autenticado
SELECT plan, estado
FROM "Suscripcion"
WHERE usuario_id = 'your-user-uuid' AND estado = 'activa';
```

**Resultado esperado**: Retorna la suscripción activa sin errores.

## Pruebas desde Frontend

### Test 1: Consulta de Usuario

```typescript
const { data, error } = await supabase
  .from('Usuario')
  .select('id, rol, nombre')
  .eq('id', 'user-uuid')
  .single();

// Debe retornar data sin error
console.log(data); // { id, rol, nombre }
```

### Test 2: Consulta de Suscripcion

```typescript
const { data, error } = await supabase
  .from('Suscripcion')
  .select('plan, estado, fecha_fin')
  .eq('usuario_id', 'user-uuid')
  .eq('estado', 'activa')
  .single();

// Debe retornar data sin error
console.log(data); // { plan, estado, fecha_fin }
```

### Test 3: Terapeuta ve pacientes

```typescript
// Como terapeuta autenticado
const { data: pacientes, error } = await supabase
  .from('Usuario')
  .select('id, nombre, email')
  .in('id', [
    // IDs de pacientes con citas
  ]);

// Debe retornar solo pacientes con citas activas
console.log(pacientes);
```

## Compliance y Seguridad

### HIPAA Compliance ✅

1. **Minimum Necessary Standard** (45 CFR 164.502(b))
   - Terapeutas solo ven datos necesarios de pacientes con citas

2. **Access Control** (45 CFR 164.312(a)(1))
   - RLS implementa controles de acceso técnicos

3. **Audit Controls** (45 CFR 164.308(a)(1)(ii)(D))
   - Tabla `AuditoriaAcceso` registra accesos a PHI

### GDPR Compliance ✅

1. **Data Minimization** (Art. 5(1)(c))
   - Políticas limitan datos accesibles al mínimo necesario

2. **Purpose Limitation** (Art. 5(1)(b))
   - Accesos restringidos por propósito (terapia, administración)

3. **Right of Access** (Art. 15)
   - Logs de auditoría permiten rastrear accesos

## Rollback (Si es necesario)

Si necesitas revertir los cambios:

```sql
-- Restaurar políticas originales de Usuario
DROP POLICY IF EXISTS "Usuario_ve_su_propio_perfil_mejorado" ON "Usuario";
DROP POLICY IF EXISTS "Usuario_actualiza_su_propio_perfil_mejorado" ON "Usuario";
DROP POLICY IF EXISTS "Admin_ve_todos_los_usuarios_mejorado" ON "Usuario";
DROP POLICY IF EXISTS "Admin_gestiona_usuarios_mejorado" ON "Usuario";
DROP POLICY IF EXISTS "Terapeuta_ve_sus_pacientes" ON "Usuario";
DROP POLICY IF EXISTS "Service_role_gestiona_usuarios" ON "Usuario";

-- Recrear políticas originales (ver 20250114000001_rls_policies.sql)

-- Eliminar tabla de auditoría
DROP TABLE IF EXISTS "AuditoriaAcceso";
```

## Próximos Pasos de Seguridad

1. **Implementar MFA** para roles ADMIN y TERAPEUTA
2. **Encriptar campos sensibles** con `pgp_sym_encrypt()`
3. **Configurar alertas** para accesos anómalos
4. **Rate limiting** en consultas sensibles
5. **Rotación de claves** de encriptación

## Soporte

Si tienes problemas aplicando la migración:

1. Verifica que tienes permisos de administrador en Supabase
2. Revisa los logs de Supabase para errores específicos
3. Verifica que las tablas `Usuario` y `Suscripcion` existen
4. Asegúrate de que las migraciones previas se aplicaron correctamente

## Referencias

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html)
- [GDPR Art. 5 - Principles](https://gdpr-info.eu/art-5-gdpr/)
