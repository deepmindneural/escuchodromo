# Aplicar Migraciones a Supabase

## Paso 1: Acceder al SQL Editor de Supabase

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto: `cvezncgcdsjntzrzztrj`
3. En el menú lateral, haz clic en **SQL Editor**

## Paso 2: Aplicar Migración del Schema

1. Haz clic en **New Query**
2. Copia todo el contenido del archivo `supabase/migrations/20250114000000_initial_schema.sql`
3. Pégalo en el editor
4. Haz clic en **Run** (botón abajo a la derecha)
5. Verifica que no haya errores en la consola

**Resultado esperado**: Deberías ver un mensaje de éxito y las 15 tablas creadas.

## Paso 3: Aplicar RLS Policies

1. Haz clic en **New Query** nuevamente
2. Copia todo el contenido del archivo `supabase/migrations/20250114000001_rls_policies.sql`
3. Pégalo en el editor
4. Haz clic en **Run**
5. Verifica que no haya errores

**Resultado esperado**: Las políticas de seguridad RLS estarán activas en todas las tablas.

## Paso 4: Aplicar Seed Data (Opcional)

1. Haz clic en **New Query**
2. Copia el contenido del archivo `supabase/seed.sql`
3. Pégalo en el editor
4. Haz clic en **Run**

**Resultado esperado**: Las pruebas psicológicas PHQ-9 y GAD-7 estarán disponibles.

## Paso 5: Crear Usuarios de Prueba

1. Ve a **Authentication** > **Users** en el menú lateral
2. Haz clic en **Add User** > **Create new user**
3. Crea el usuario normal:
   - Email: `usuario@escuchodromo.com`
   - Password: `123456`
   - Auto Confirm User: ✅ (marcado)
4. Copia el UUID del usuario creado
5. Ve al **SQL Editor** y ejecuta:

```sql
-- Insertar usuario normal en la tabla Usuario
INSERT INTO "Usuario" (auth_id, email, nombre, rol)
VALUES
  ('UUID-COPIADO-AQUI', 'usuario@escuchodromo.com', 'Usuario Demo', 'USUARIO');

-- Crear perfil para el usuario
INSERT INTO "PerfilUsuario" (usuario_id, idioma_preferido, moneda, zona_horaria, consentimiento_datos)
SELECT
  id,
  'es',
  'COP',
  'America/Bogota',
  true
FROM "Usuario"
WHERE email = 'usuario@escuchodromo.com';
```

6. Repite el proceso para crear el admin:
   - Email: `admin@escuchodromo.com`
   - Password: `123456`
   - Rol: `ADMIN`

```sql
-- Insertar admin en la tabla Usuario
INSERT INTO "Usuario" (auth_id, email, nombre, rol)
VALUES
  ('UUID-DEL-ADMIN-AQUI', 'admin@escuchodromo.com', 'Admin Demo', 'ADMIN');

-- Crear perfil para el admin
INSERT INTO "PerfilUsuario" (usuario_id, idioma_preferido, moneda, zona_horaria, consentimiento_datos)
SELECT
  id,
  'es',
  'COP',
  'America/Bogota',
  true
FROM "Usuario"
WHERE email = 'admin@escuchodromo.com';
```

## Paso 6: Verificar la Instalación

1. Ve a **Table Editor** en el menú lateral
2. Deberías ver todas estas tablas:
   - Usuario
   - PerfilUsuario
   - Sesion
   - RegistroAnimo
   - Conversacion
   - Mensaje
   - Prueba
   - Pregunta
   - Resultado
   - Recomendacion
   - Pago
   - Notificacion
   - ArchivoAdjunto
   - SesionPublica
   - MensajePublico

3. Haz clic en cada tabla para verificar:
   - ✅ RLS está habilitado (icono de escudo verde)
   - ✅ Las políticas están activas

## Paso 7: Verificar Realtime

1. Ve a **Database** > **Replication** en el menú lateral
2. Verifica que estas tablas estén en Realtime:
   - Mensaje
   - Notificacion
   - MensajePublico

## Notas Importantes

- **No uses el servicio de migraciones automáticas de Supabase** por ahora, ya que tenemos archivos SQL personalizados
- Las migraciones se aplicarán en el orden correcto: schema → RLS → seed
- Si encuentras errores, revisa los mensajes de error en la consola del SQL Editor
- Las políticas RLS protegen automáticamente todos los datos según el rol del usuario

## Troubleshooting

### Error: "extension vector does not exist"
**Solución**: Contacta al soporte de Supabase para habilitar la extensión `pgvector` en tu proyecto.

### Error: "relation already exists"
**Solución**: Ya aplicaste las migraciones. Puedes omitir este paso.

### Error al crear usuario: "duplicate key value violates unique constraint"
**Solución**: El usuario ya existe. Usa un email diferente o elimina el usuario anterior.
