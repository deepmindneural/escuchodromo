# Solución: Recursión Infinita en Políticas RLS de Usuario

**Fecha:** 24 de octubre de 2025
**Severidad:** CRÍTICA - Panel Admin completamente bloqueado
**Estado:** ✅ RESUELTO

---

## Problema Identificado

El middleware de Next.js no podía obtener el rol del usuario debido a un error de **recursión infinita** en las políticas RLS (Row Level Security) de la tabla `Usuario`.

### Error en Consola

```javascript
❌ [Middleware] Error obteniendo rol: {
  message: 'infinite recursion detected in policy for relation "Usuario"',
  code: '42P17',
  auth_id: '90150ee1-907e-404d-805d-6f3a5408c8bb'
}

🔒 Middleware - Ruta: /admin/ia - Usuario: 90150ee1-... - Rol: null
🚫 Acceso denegado a /admin para rol: null
```

### Causa Raíz

Tres políticas RLS causaban recursión infinita al intentar verificar si un usuario era ADMIN:

1. **`Admin_ve_todos_los_usuarios`** (SELECT)
2. **`Admin actualiza usuarios con restricciones`** (UPDATE)
3. **`Admin crea usuarios con validacion`** (INSERT)

Todas estas políticas tenían el mismo problema:

```sql
-- ❌ POLÍTICA RECURSIVA (MAL)
CREATE POLICY "Admin_ve_todos_los_usuarios" ON "Usuario"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Usuario" u_admin  -- ⚠️ Esto causa RECURSIÓN
      WHERE u_admin.auth_id = auth.uid() AND u_admin.rol = 'ADMIN'
    )
  );
```

### ¿Por qué causaba recursión?

```
1. Middleware ejecuta: SELECT rol FROM Usuario WHERE auth_id = '...'
   ↓
2. PostgreSQL activa RLS y evalúa la política
   ↓
3. La política ejecuta: SELECT 1 FROM Usuario WHERE rol = 'ADMIN'
   ↓
4. PostgreSQL activa RLS de nuevo (para el SELECT interno)
   ↓
5. VUELVE AL PASO 3 → RECURSIÓN INFINITA ♾️
```

---

## Solución Implementada

### 1. Función `SECURITY DEFINER` que Bypasea RLS

Creamos una función PostgreSQL con privilegios elevados que obtiene el rol **SIN activar RLS**:

```sql
CREATE OR REPLACE FUNCTION obtener_rol_usuario_actual()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER              -- ✅ Se ejecuta como postgres, NO activa RLS
SET search_path = public, pg_temp
STABLE                         -- ✅ PostgreSQL cachea el resultado
AS $$
DECLARE
  v_rol TEXT;
BEGIN
  -- Obtener rol directamente SIN activar RLS
  SELECT rol INTO v_rol
  FROM "Usuario"
  WHERE auth_id = auth.uid()
  LIMIT 1;

  RETURN COALESCE(v_rol, 'USUARIO');
END;
$$;
```

**¿Por qué funciona?**
- `SECURITY DEFINER` ejecuta la función con privilegios del dueño (postgres)
- Al tener privilegios elevados, **bypasea RLS completamente**
- No hay SELECT recursivo → **No hay recursión**

### 2. Nuevas Políticas NO RECURSIVAS

Eliminamos las 3 políticas recursivas y creamos 3 nuevas que usan la función:

#### Política 1: SELECT (Admins ven todos los usuarios)

```sql
CREATE POLICY "admin_select_todos_usuarios_no_recursion" ON "Usuario"
  FOR SELECT
  TO authenticated
  USING (
    obtener_rol_usuario_actual() = 'ADMIN'  -- ✅ Usa función, NO recursión
  );
```

#### Política 2: UPDATE (Admins actualizan usuarios)

```sql
CREATE POLICY "admin_update_usuarios_no_recursion" ON "Usuario"
  FOR UPDATE
  TO authenticated
  USING (
    obtener_rol_usuario_actual() = 'ADMIN'
  )
  WITH CHECK (
    -- No puede cambiar su propio rol
    (id != (SELECT id FROM "Usuario" WHERE auth_id = auth.uid()) OR
     rol = (SELECT rol FROM "Usuario" WHERE auth_id = auth.uid()))
  );
```

**Nota:** El SELECT en `WITH CHECK` **NO causa recursión** porque:
- El `USING` ya pasó (usando la función no recursiva)
- Este SELECT es solo para comparar valores, no para validar permisos iniciales

#### Política 3: INSERT (Admins crean usuarios)

```sql
CREATE POLICY "admin_insert_usuarios_no_recursion" ON "Usuario"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    obtener_rol_usuario_actual() = 'ADMIN'
    AND (
      rol != 'ADMIN'
      OR
      EXISTS (
        SELECT 1 FROM "AuditLogAdmin"
        WHERE accion = 'crear_admin_autorizado'
        AND creado_en >= NOW() - INTERVAL '5 minutes'
      )
    )
  );
```

---

## Migración Aplicada

**Archivo:** `supabase/migrations/20251024_fix_rls_recursion_usuario.sql`

**Contenido:**
1. ✅ Función `obtener_rol_usuario_actual()` con SECURITY DEFINER
2. ✅ DROP de 3 políticas recursivas
3. ✅ CREATE de 3 políticas NO recursivas
4. ✅ Permisos GRANT EXECUTE para authenticated y anon
5. ✅ Comentarios y documentación

---

## Verificación

### SQL - Políticas Actuales

```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'Usuario'
ORDER BY policyname;
```

**Resultado:**
```
✅ admin_insert_usuarios_no_recursion      | INSERT
✅ admin_select_todos_usuarios_no_recursion | SELECT
✅ admin_update_usuarios_no_recursion      | UPDATE
✅ Service_role_gestiona_usuarios          | ALL
✅ delete_propio_perfil                    | DELETE
✅ insert_propio_perfil                    | INSERT
✅ select_profesionales_publicos           | SELECT
✅ select_propio_perfil                    | SELECT
✅ update_propio_perfil                    | UPDATE
✅ usuarios_pueden_leer_su_propio_rol      | SELECT
```

### Middleware - Sin Errores de Recursión

**Antes:**
```javascript
❌ [Middleware] Error obteniendo rol: {
  message: 'infinite recursion detected in policy for relation "Usuario"',
  code: '42P17'
}
```

**Después:**
```javascript
✅ [Middleware] Rol obtenido: ADMIN - Usuario: 90150ee1-...
✅ Acceso permitido a: /admin/ia para rol: ADMIN
```

---

## Diagrama de Flujo

### ANTES (con recursión ❌)

```
Middleware: SELECT rol FROM Usuario
    ↓
RLS evalúa política
    ↓
Política: SELECT FROM Usuario WHERE rol = 'ADMIN'
    ↓
RLS evalúa política (de nuevo)
    ↓
♾️ RECURSIÓN INFINITA
```

### DESPUÉS (sin recursión ✅)

```
Middleware: SELECT rol FROM Usuario
    ↓
RLS evalúa política
    ↓
Política: obtener_rol_usuario_actual()
    ↓
Función SECURITY DEFINER bypasea RLS
    ↓
✅ Retorna 'ADMIN' sin recursión
```

---

## Impacto

| Componente | Antes | Después |
|------------|-------|---------|
| Panel Admin | ❌ Bloqueado (error 42P17) | ✅ Funcional |
| Middleware | ❌ No puede obtener rol | ✅ Obtiene rol correctamente |
| Usuarios ADMIN | ❌ No pueden acceder | ✅ Acceso completo |
| Usuarios normales | ✅ No afectados | ✅ No afectados |

---

## Seguridad

### ¿Es seguro usar SECURITY DEFINER?

**SÍ**, porque:

1. **Contexto limitado:** La función solo lee el rol del usuario autenticado (`auth.uid()`)
2. **Sin parámetros externos:** No acepta `usuario_id` como parámetro (usa siempre `auth.uid()`)
3. **Retorna solo 1 campo:** Solo el rol (TEXT), no datos sensibles
4. **STABLE cache:** PostgreSQL cachea el resultado durante la transacción
5. **search_path fijo:** Previene ataques de namespace hijacking

### Defense in Depth

La seguridad sigue siendo multi-capa:

```
1. Frontend: Middleware verifica rol antes de permitir acceso
2. RLS Policies: Políticas NO recursivas validan permisos
3. RPC Functions: SECURITY DEFINER valida ADMIN en cada función
4. Audit Logs: Registran acciones ADMIN sensibles
```

---

## Archivos Afectados

1. **Nueva migración:**
   - `supabase/migrations/20251024_fix_rls_recursion_usuario.sql`

2. **Archivos sin cambios (funcionan con la solución):**
   - `src/middleware.ts` - Usa SELECT directo (ahora funciona)
   - `src/lib/supabase/middleware.ts` - Obtiene rol sin errores

---

## Testing

### Test 1: Función devuelve rol correcto

```sql
SELECT obtener_rol_usuario_actual();
-- Resultado: 'ADMIN' | 'TERAPEUTA' | 'USUARIO'
```

### Test 2: Políticas NO causan recursión

```sql
-- Como usuario ADMIN autenticado
SELECT * FROM "Usuario" LIMIT 10;
-- ✅ Debe funcionar sin error 42P17
```

### Test 3: Middleware obtiene rol

```bash
# Iniciar servidor
npm run dev

# Navegar como ADMIN a:
http://localhost:3000/admin/ia

# Verificar en terminal:
✅ [Middleware] Rol obtenido: ADMIN
✅ Acceso permitido a: /admin/ia para rol: ADMIN
```

---

## Rollback (si es necesario)

**NO RECOMENDADO** - Causará recursión de nuevo

```sql
-- Revertir migración
DROP POLICY IF EXISTS "admin_select_todos_usuarios_no_recursion" ON "Usuario";
DROP POLICY IF EXISTS "admin_update_usuarios_no_recursion" ON "Usuario";
DROP POLICY IF EXISTS "admin_insert_usuarios_no_recursion" ON "Usuario";
DROP FUNCTION IF EXISTS obtener_rol_usuario_actual();
```

---

## Lecciones Aprendidas

### ❌ NO hacer:

1. **NO usar SELECT dentro de políticas RLS sobre la misma tabla**
   ```sql
   -- ❌ MAL - Causa recursión
   USING (EXISTS (SELECT 1 FROM "Usuario" WHERE rol = 'ADMIN'))
   ```

2. **NO confiar en `auth.jwt()` directamente**
   - El JWT puede contener claims desactualizados
   - Mejor consultar la base de datos con SECURITY DEFINER

### ✅ SÍ hacer:

1. **Usar funciones SECURITY DEFINER para bypass controlado de RLS**
   ```sql
   -- ✅ BIEN - No causa recursión
   USING (obtener_rol_usuario_actual() = 'ADMIN')
   ```

2. **Usar `auth.uid()` directamente cuando sea posible**
   ```sql
   -- ✅ BIEN - auth.uid() NO consulta tablas
   USING (auth.uid() = auth_id)
   ```

3. **Marcar funciones como STABLE para mejor performance**
   - PostgreSQL cachea el resultado durante la transacción
   - Evita múltiples consultas innecesarias

---

## Referencias

- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [SECURITY DEFINER Functions](https://www.postgresql.org/docs/current/sql-createfunction.html)

---

**Estado Final:** ✅ RESUELTO - Recursión infinita eliminada
**Migración:** Aplicada exitosamente a Supabase
**Middleware:** Funciona sin errores
**Panel Admin:** Totalmente funcional

---

**Generado por:** Claude Code - Backend Security Engineer
**Fecha:** 24 de octubre de 2025
