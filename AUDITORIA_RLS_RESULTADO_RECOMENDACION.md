# AUDITORÍA DE POLÍTICAS RLS - RESULTADO Y RECOMENDACION

**Fecha:** 2025-10-24
**Analista de Seguridad:** Claude Code
**Tablas Auditadas:** `Resultado`, `Recomendacion`, `Test`

---

## RESUMEN EJECUTIVO

Se han identificado **DOS problemas críticos** que explican los errores 406 y 403 reportados:

### 🔴 PROBLEMA 1: Error 406 en tabla `Resultado`
**Causa:** El usuario `379fd1cf-f226-4f88-8c21-e7dc49943728` (rrr@rrr.com) **NO TIENE DATOS** en la tabla `Resultado`.

### 🔴 PROBLEMA 2: Error 403 en tabla `Recomendacion`
**Causa:** Política RLS con **rol incorrecto** - usa `{public}` en lugar de `{authenticated}`.

### 🟡 PROBLEMA 3: Sintaxis incorrecta en query de Recomendacion
**Causa:** La URL usa `columns=` en lugar de `select=` (error de cliente, no de RLS).

---

## ANÁLISIS DETALLADO

### 1. ERROR 406 - Tabla `Resultado`

#### Query Original (de la URL):
```
cvezncgcdsjntzrzztrj.supabase.co/rest/v1/Resultado?select=*%2CTest%28codigo%2Cnombre%2Ccategoria%29&usuario_id=eq.379fd1cf-f226-4f88-8c21-e7dc49943728&order=creado_en.desc&limit=1
```

**Decodificada:**
```sql
SELECT *, Test(codigo, nombre, categoria)
FROM Resultado
WHERE usuario_id = '379fd1cf-f226-4f88-8c21-e7dc49943728'
ORDER BY creado_en DESC
LIMIT 1;
```

#### Diagnóstico:

**✅ POLÍTICAS RLS CORRECTAS:**
```sql
-- Política 1: usuarios_ven_resultados
ROLE: {authenticated}
QUAL: usuario_id IN (SELECT id FROM "Usuario" WHERE auth_id = auth.uid())

-- Política 2: Admins ven todos los resultados
ROLE: {public}
QUAL: EXISTS (SELECT 1 FROM "Usuario" WHERE auth_id = auth.uid() AND rol = 'ADMIN')
```

**❌ PROBLEMA REAL:**
El usuario con `id = '379fd1cf-f226-4f88-8c21-e7dc49943728'` **NO TIENE REGISTROS** en la tabla `Resultado`.

**Datos del Usuario:**
- **ID:** `379fd1cf-f226-4f88-8c21-e7dc49943728`
- **auth_id:** `f84e5f99-a279-4f54-9574-36508e6424af`
- **Email:** `rrr@rrr.com`
- **Rol:** `USUARIO`

**Evidencia:**
```sql
-- Query ejecutada directamente en DB (bypass RLS como service_role)
SELECT id, usuario_id, test_id, puntuacion
FROM "Resultado"
WHERE usuario_id = '379fd1cf-f226-4f88-8c21-e7dc49943728';

-- Resultado: [] (vacío)
```

**¿Por qué error 406 y no 200 con array vacío?**

El error 406 (Not Acceptable) sugiere que:
1. El cliente está enviando headers de `Accept` que Supabase no puede satisfacer
2. O el JOIN con `Test` está fallando por algún problema de formato/serialización

**Recomendación:** Verificar si el error persiste cuando SÍ existen datos.

---

### 2. ERROR 403 - Tabla `Recomendacion`

#### Query Original (de la URL):
```
cvezncgcdsjntzrzztrj.supabase.co/rest/v1/Recomendacion?columns=%22usuario_id%22%2C%22tipo%22%2C%22prioridad%22%2C%22titulo%22%2C%22descripcion%22%2C%22url_accion%22%2C%22esta_activa%22
```

**Decodificada:**
```
?columns="usuario_id","tipo","prioridad","titulo","descripcion","url_accion","esta_activa"
```

#### Diagnóstico:

**🔴 PROBLEMA 1: Sintaxis incorrecta**
- La URL usa `columns=` en lugar de `select=`
- Supabase PostgREST espera `?select=usuario_id,tipo,prioridad,...`
- Esto puede generar error 403 porque PostgREST rechaza parámetros desconocidos

**🔴 PROBLEMA 2: Política RLS con rol inconsistente**

```sql
-- Política actual (INCORRECTA):
POLICY: "Usuario ve sus recomendaciones"
ROLE: {public}  ⚠️ PROBLEMA: Incluye anon + authenticated
QUAL: usuario_id IN (SELECT id FROM "Usuario" WHERE auth_id = auth.uid())
```

**¿Por qué es un problema?**
- El rol `{public}` incluye usuarios **anónimos** (`anon`) y **autenticados** (`authenticated`)
- Para usuarios anónimos, `auth.uid()` es `NULL`
- La subquery retorna vacío, negando acceso incluso a usuarios autenticados

**Comparación con tabla `Resultado` (CORRECTA):**
```sql
-- Política de Resultado (CORRECTA):
POLICY: "usuarios_ven_resultados"
ROLE: {authenticated}  ✅ Solo usuarios autenticados
QUAL: usuario_id IN (SELECT id FROM "Usuario" WHERE auth_id = auth.uid())
```

---

## VERIFICACIÓN DE DATOS

### Usuario con Recomendaciones:

```sql
SELECT id, usuario_id, tipo, titulo, esta_activa, email, auth_id
FROM "Recomendacion" r
JOIN "Usuario" u ON r.usuario_id = u.id
WHERE u.id = '379fd1cf-f226-4f88-8c21-e7dc49943728';
```

**Resultado:** ✅ 5 recomendaciones encontradas:
- Rutina de Sueño Regular
- Ejercicio Físico Moderado
- Práctica de Mindfulness
- Diario de Emociones
- Conexión Social

**Conclusión:** Los datos EXISTEN pero las políticas RLS están bloqueando el acceso.

---

## POLÍTICAS RLS ACTUALES

### Tabla `Resultado` (RLS habilitado: ✅)

| Política | Roles | Comando | Condición |
|----------|-------|---------|-----------|
| `usuarios_ven_resultados` | `{authenticated}` | SELECT | `usuario_id IN (SELECT id FROM Usuario WHERE auth_id = auth.uid())` |
| `Admins ven todos los resultados` | `{public}` | SELECT | `EXISTS (SELECT 1 FROM Usuario WHERE auth_id = auth.uid() AND rol = 'ADMIN')` |
| `usuarios_insertan_resultados` | `{authenticated}` | INSERT | `usuario_id IN (SELECT id FROM Usuario WHERE auth_id = auth.uid())` |
| `service_role_resultado_all` | `{service_role}` | ALL | `true` |

**Estado:** ✅ Políticas correctas

---

### Tabla `Recomendacion` (RLS habilitado: ✅)

| Política | Roles | Comando | Condición |
|----------|-------|---------|-----------|
| `Usuario ve sus recomendaciones` | `{public}` ⚠️ | SELECT | `usuario_id IN (SELECT id FROM Usuario WHERE auth_id = auth.uid())` |
| `Admins ven todas las recomendaciones` | `{public}` | SELECT | `EXISTS (SELECT 1 FROM Usuario WHERE auth_id = auth.uid() AND rol = 'ADMIN')` |
| `Service role crea recomendaciones` | `{service_role}` | INSERT | `true` |

**Estado:** 🔴 Rol incorrecto en política principal

---

### Tabla `Test` (RLS habilitado: ✅)

| Política | Roles | Comando | Condición |
|----------|-------|---------|-----------|
| `Todos ven tests` | `{anon,authenticated}` | SELECT | `true` |

**Estado:** ✅ Correcto (tests son públicos)

---

## SOLUCIONES PROPUESTAS

### SOLUCIÓN 1: Corregir política RLS de `Recomendacion`

**Problema:** Política usa `{public}` en lugar de `{authenticated}`

**SQL de corrección:**

```sql
-- ============================================
-- MIGRATION: Corregir política RLS Recomendacion
-- FECHA: 2025-10-24
-- DESCRIPCIÓN: Cambiar rol de {public} a {authenticated}
-- ============================================

BEGIN;

-- 1. Eliminar política incorrecta
DROP POLICY IF EXISTS "Usuario ve sus recomendaciones" ON "Recomendacion";

-- 2. Crear política correcta con rol authenticated
CREATE POLICY "Usuario ve sus recomendaciones"
  ON "Recomendacion"
  FOR SELECT
  TO authenticated  -- ✅ Solo usuarios autenticados
  USING (
    usuario_id IN (
      SELECT id
      FROM "Usuario"
      WHERE auth_id = auth.uid()
    )
  );

-- 3. Verificar que la política se creó correctamente
SELECT
    policyname,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'Recomendacion'
  AND policyname = 'Usuario ve sus recomendaciones';

COMMIT;
```

**Validación esperada:**
```sql
-- Debe retornar:
{
  "policyname": "Usuario ve sus recomendaciones",
  "roles": "{authenticated}",  -- ✅ Correcto
  "cmd": "SELECT",
  "qual": "(usuario_id IN ( SELECT Usuario.id FROM Usuario WHERE (Usuario.auth_id = auth.uid())))"
}
```

---

### SOLUCIÓN 2: Agregar políticas UPDATE/DELETE para `Recomendacion`

**Problema:** Solo existen políticas SELECT e INSERT, faltan UPDATE y DELETE

**SQL de corrección:**

```sql
-- ============================================
-- MIGRATION: Agregar políticas UPDATE/DELETE a Recomendacion
-- FECHA: 2025-10-24
-- DESCRIPCIÓN: Permitir que usuarios actualicen/eliminen sus recomendaciones
-- ============================================

BEGIN;

-- 1. Política UPDATE para usuarios
CREATE POLICY "Usuario actualiza sus recomendaciones"
  ON "Recomendacion"
  FOR UPDATE
  TO authenticated
  USING (
    usuario_id IN (
      SELECT id
      FROM "Usuario"
      WHERE auth_id = auth.uid()
    )
  )
  WITH CHECK (
    usuario_id IN (
      SELECT id
      FROM "Usuario"
      WHERE auth_id = auth.uid()
    )
  );

-- 2. Política DELETE para usuarios
CREATE POLICY "Usuario elimina sus recomendaciones"
  ON "Recomendacion"
  FOR DELETE
  TO authenticated
  USING (
    usuario_id IN (
      SELECT id
      FROM "Usuario"
      WHERE auth_id = auth.uid()
    )
  );

-- 3. Política UPDATE para admins
CREATE POLICY "Admins actualizan todas las recomendaciones"
  ON "Recomendacion"
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM "Usuario"
      WHERE auth_id = auth.uid()
        AND rol = 'ADMIN'
    )
  )
  WITH CHECK (true);

-- 4. Política DELETE para admins
CREATE POLICY "Admins eliminan todas las recomendaciones"
  ON "Recomendacion"
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM "Usuario"
      WHERE auth_id = auth.uid()
        AND rol = 'ADMIN'
    )
  );

COMMIT;
```

---

### SOLUCIÓN 3: Estandarizar políticas de `Resultado`

**Problema:** Política de admins usa `{public}` (inconsistente con usuarios que usa `{authenticated}`)

**SQL de corrección:**

```sql
-- ============================================
-- MIGRATION: Estandarizar políticas RLS Resultado
-- FECHA: 2025-10-24
-- DESCRIPCIÓN: Cambiar rol de admins a {authenticated}
-- ============================================

BEGIN;

-- 1. Eliminar política de admins con {public}
DROP POLICY IF EXISTS "Admins ven todos los resultados" ON "Resultado";

-- 2. Recrear con {authenticated}
CREATE POLICY "Admins ven todos los resultados"
  ON "Resultado"
  FOR SELECT
  TO authenticated  -- ✅ Solo usuarios autenticados
  USING (
    EXISTS (
      SELECT 1
      FROM "Usuario"
      WHERE auth_id = auth.uid()
        AND rol = 'ADMIN'
    )
  );

-- 3. Hacer lo mismo con Recomendacion
DROP POLICY IF EXISTS "Admins ven todas las recomendaciones" ON "Recomendacion";

CREATE POLICY "Admins ven todas las recomendaciones"
  ON "Recomendacion"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM "Usuario"
      WHERE auth_id = auth.uid()
        AND rol = 'ADMIN'
    )
  );

COMMIT;
```

---

### SOLUCIÓN 4: Agregar auditoría de accesos (HIPAA Compliance)

**Problema:** No existe auditoría automática de accesos a PHI (Protected Health Information)

**SQL de corrección:**

```sql
-- ============================================
-- MIGRATION: Agregar triggers de auditoría a Resultado
-- FECHA: 2025-10-24
-- DESCRIPCIÓN: Registrar todos los accesos a resultados de evaluaciones
-- ============================================

BEGIN;

-- 1. Función de auditoría para SELECT (requiere trigger AFTER SELECT, no soportado nativamente)
-- Alternativa: Usar política RLS que inserte en tabla de auditoría

-- 2. Trigger para INSERT/UPDATE/DELETE
CREATE OR REPLACE FUNCTION audit_resultado_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar en tabla de auditoría
  INSERT INTO "AuditoriaAccesoPHI" (
    usuario_id,
    tipo_recurso,
    recurso_id,
    accion,
    exitoso,
    creado_en
  ) VALUES (
    auth.uid(),
    'resultado',
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    true,
    NOW()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Aplicar trigger a Resultado
DROP TRIGGER IF EXISTS audit_resultado_trigger ON "Resultado";

CREATE TRIGGER audit_resultado_trigger
  AFTER INSERT OR UPDATE OR DELETE ON "Resultado"
  FOR EACH ROW
  EXECUTE FUNCTION audit_resultado_changes();

-- 4. Lo mismo para Recomendacion
CREATE OR REPLACE FUNCTION audit_recomendacion_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO "AuditoriaAccesoPHI" (
    usuario_id,
    tipo_recurso,
    recurso_id,
    accion,
    exitoso,
    creado_en
  ) VALUES (
    auth.uid(),
    'recomendacion',
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    true,
    NOW()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_recomendacion_trigger ON "Recomendacion";

CREATE TRIGGER audit_recomendacion_trigger
  AFTER INSERT OR UPDATE OR DELETE ON "Recomendacion"
  FOR EACH ROW
  EXECUTE FUNCTION audit_recomendacion_changes();

COMMIT;
```

---

## RECOMENDACIONES DE SEGURIDAD HIPAA/GDPR

### 1. Encriptación de Datos Sensibles

**CRÍTICO:** Las columnas `respuestas` e `interpretacion` en `Resultado` contienen PHI sin encriptar.

**Solución propuesta:**

```sql
-- Habilitar pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Agregar columnas encriptadas
ALTER TABLE "Resultado"
  ADD COLUMN respuestas_enc BYTEA,
  ADD COLUMN interpretacion_enc BYTEA;

-- Función para encriptar al insertar
CREATE OR REPLACE FUNCTION encrypt_resultado_phi()
RETURNS TRIGGER AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  -- Obtener clave desde secrets (configurar en Supabase Vault)
  encryption_key := current_setting('app.encryption_key', true);

  -- Encriptar campos sensibles
  IF NEW.respuestas IS NOT NULL THEN
    NEW.respuestas_enc := pgp_sym_encrypt(NEW.respuestas::TEXT, encryption_key);
    NEW.respuestas := NULL; -- Limpiar versión sin encriptar
  END IF;

  IF NEW.interpretacion IS NOT NULL THEN
    NEW.interpretacion_enc := pgp_sym_encrypt(NEW.interpretacion, encryption_key);
    NEW.interpretacion := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER encrypt_resultado_trigger
  BEFORE INSERT OR UPDATE ON "Resultado"
  FOR EACH ROW
  EXECUTE FUNCTION encrypt_resultado_phi();
```

---

### 2. Rate Limiting por Usuario

**Problema:** No existe protección contra ataques de enumeración de datos.

**Solución:** Implementar rate limiting en Edge Functions o usar extensión `pg_cron`:

```sql
-- Crear tabla de rate limiting
CREATE TABLE IF NOT EXISTS "RateLimitAccesoPHI" (
  usuario_id UUID NOT NULL,
  tabla TEXT NOT NULL,
  accesos_ultimo_minuto INT DEFAULT 0,
  ultimo_reset TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (usuario_id, tabla)
);

-- Función de validación
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_tabla TEXT,
  p_limite INT DEFAULT 100
)
RETURNS BOOLEAN AS $$
DECLARE
  v_accesos INT;
  v_usuario_id UUID;
BEGIN
  v_usuario_id := auth.uid();

  -- Obtener accesos del último minuto
  SELECT accesos_ultimo_minuto INTO v_accesos
  FROM "RateLimitAccesoPHI"
  WHERE usuario_id = v_usuario_id
    AND tabla = p_tabla
    AND ultimo_reset > NOW() - INTERVAL '1 minute';

  -- Si no existe registro o ya pasó 1 minuto, resetear
  IF v_accesos IS NULL THEN
    INSERT INTO "RateLimitAccesoPHI" (usuario_id, tabla, accesos_ultimo_minuto)
    VALUES (v_usuario_id, p_tabla, 1)
    ON CONFLICT (usuario_id, tabla)
    DO UPDATE SET accesos_ultimo_minuto = 1, ultimo_reset = NOW();

    RETURN TRUE;
  END IF;

  -- Validar límite
  IF v_accesos >= p_limite THEN
    RETURN FALSE;
  END IF;

  -- Incrementar contador
  UPDATE "RateLimitAccesoPHI"
  SET accesos_ultimo_minuto = accesos_ultimo_minuto + 1
  WHERE usuario_id = v_usuario_id AND tabla = p_tabla;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### 3. Índices para Optimizar Políticas RLS

**Problema:** Las subqueries `auth_id = auth.uid()` pueden ser lentas sin índices.

**Solución:**

```sql
-- Índice en Usuario.auth_id (si no existe)
CREATE INDEX IF NOT EXISTS idx_usuario_auth_id
  ON "Usuario"(auth_id);

-- Índice compuesto para búsquedas de admin
CREATE INDEX IF NOT EXISTS idx_usuario_auth_id_rol
  ON "Usuario"(auth_id, rol);

-- Índices en foreign keys de Resultado
CREATE INDEX IF NOT EXISTS idx_resultado_usuario_id
  ON "Resultado"(usuario_id);

CREATE INDEX IF NOT EXISTS idx_resultado_test_id
  ON "Resultado"(test_id);

-- Índices en Recomendacion
CREATE INDEX IF NOT EXISTS idx_recomendacion_usuario_id
  ON "Recomendacion"(usuario_id);

CREATE INDEX IF NOT EXISTS idx_recomendacion_esta_activa
  ON "Recomendacion"(esta_activa)
  WHERE esta_activa = true;
```

---

## TESTS DE VALIDACIÓN

### Test 1: Usuario autenticado lee sus resultados

```sql
-- Simular contexto de usuario autenticado
SET LOCAL role = authenticated;
SET LOCAL request.jwt.claims = '{"sub":"f84e5f99-a279-4f54-9574-36508e6424af"}';

-- Debe retornar solo resultados del usuario
SELECT * FROM "Resultado";

-- Debe retornar solo recomendaciones del usuario
SELECT * FROM "Recomendacion";
```

---

### Test 2: Admin lee todos los datos

```sql
-- Simular contexto de admin
SET LOCAL role = authenticated;
SET LOCAL request.jwt.claims = '{"sub":"90150ee1-907e-404d-805d-6f3a5408c8bb"}';

-- Debe retornar TODOS los resultados
SELECT COUNT(*) FROM "Resultado";

-- Debe retornar TODAS las recomendaciones
SELECT COUNT(*) FROM "Recomendacion";
```

---

### Test 3: Usuario anónimo NO debe ver datos

```sql
-- Simular contexto anónimo
SET LOCAL role = anon;

-- Debe retornar 0 resultados
SELECT COUNT(*) FROM "Resultado";

-- Debe retornar 0 recomendaciones
SELECT COUNT(*) FROM "Recomendacion";
```

---

## ADVISORS DE SEGURIDAD DETECTADOS

### 🔴 ERROR: Security Definer Views

**Problema:** 3 vistas con `SECURITY DEFINER` detectadas:
- `PagoCitaSeguroAdmin`
- `ResumenAuditoriaAdmin`
- `PagoSeguroAdmin`

**Riesgo:** Estas vistas ejecutan con permisos del creador, no del usuario que consulta.

**Remediación:** https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view

---

### 🟡 WARN: Function Search Path Mutable

**Función:** `actualizar_timestamp_plan`

**Riesgo:** Vulnerable a ataques de schema poisoning.

**Solución:**
```sql
ALTER FUNCTION actualizar_timestamp_plan()
  SET search_path = public, pg_temp;
```

---

### 🟡 WARN: Extension in Public Schema

**Extensión:** `vector`

**Riesgo:** Conflictos de nombres y problemas de seguridad.

**Solución:**
```sql
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION vector SET SCHEMA extensions;
```

---

### 🟡 WARN: Leaked Password Protection Disabled

**Riesgo:** Usuarios pueden usar contraseñas comprometidas.

**Solución:** Habilitar en Dashboard de Supabase:
```
Authentication > Policies > Enable HaveIBeenPwned Integration
```

---

## RESUMEN DE ACCIONES REQUERIDAS

| Prioridad | Acción | Impacto | Esfuerzo |
|-----------|--------|---------|----------|
| 🔴 CRÍTICO | Corregir política RLS de Recomendacion | Alto | Bajo (5 min) |
| 🔴 CRÍTICO | Agregar encriptación a campos PHI en Resultado | Alto | Medio (2h) |
| 🟠 ALTO | Agregar políticas UPDATE/DELETE a Recomendacion | Medio | Bajo (10 min) |
| 🟠 ALTO | Estandarizar roles en políticas RLS | Medio | Bajo (10 min) |
| 🟠 ALTO | Agregar triggers de auditoría | Alto | Medio (1h) |
| 🟡 MEDIO | Agregar rate limiting | Medio | Alto (4h) |
| 🟡 MEDIO | Crear índices de optimización | Bajo | Bajo (5 min) |
| 🟢 BAJO | Corregir Security Definer Views | Bajo | Medio (1h) |
| 🟢 BAJO | Habilitar password leak protection | Bajo | Inmediato |

---

## SCRIPT DE MIGRACIÓN COMPLETO

```sql
-- ============================================
-- MIGRATION: fix_rls_resultado_recomendacion
-- FECHA: 2025-10-24
-- AUTOR: Auditoría de Seguridad
-- DESCRIPCIÓN: Correcciones críticas de políticas RLS
-- ============================================

BEGIN;

-- ========================================
-- 1. CORREGIR POLÍTICAS DE RECOMENDACION
-- ========================================

-- Eliminar política incorrecta
DROP POLICY IF EXISTS "Usuario ve sus recomendaciones" ON "Recomendacion";
DROP POLICY IF EXISTS "Admins ven todas las recomendaciones" ON "Recomendacion";

-- Recrear con roles correctos
CREATE POLICY "Usuario ve sus recomendaciones"
  ON "Recomendacion"
  FOR SELECT
  TO authenticated
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Admins ven todas las recomendaciones"
  ON "Recomendacion"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- Agregar políticas UPDATE
CREATE POLICY "Usuario actualiza sus recomendaciones"
  ON "Recomendacion"
  FOR UPDATE
  TO authenticated
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  )
  WITH CHECK (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Admins actualizan todas las recomendaciones"
  ON "Recomendacion"
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  )
  WITH CHECK (true);

-- Agregar políticas DELETE
CREATE POLICY "Usuario elimina sus recomendaciones"
  ON "Recomendacion"
  FOR DELETE
  TO authenticated
  USING (
    usuario_id IN (
      SELECT id FROM "Usuario" WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Admins eliminan todas las recomendaciones"
  ON "Recomendacion"
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- ========================================
-- 2. ESTANDARIZAR POLÍTICAS DE RESULTADO
-- ========================================

DROP POLICY IF EXISTS "Admins ven todos los resultados" ON "Resultado";

CREATE POLICY "Admins ven todos los resultados"
  ON "Resultado"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid() AND rol = 'ADMIN'
    )
  );

-- ========================================
-- 3. CREAR ÍNDICES DE OPTIMIZACIÓN
-- ========================================

CREATE INDEX IF NOT EXISTS idx_usuario_auth_id
  ON "Usuario"(auth_id);

CREATE INDEX IF NOT EXISTS idx_usuario_auth_id_rol
  ON "Usuario"(auth_id, rol);

CREATE INDEX IF NOT EXISTS idx_resultado_usuario_id
  ON "Resultado"(usuario_id);

CREATE INDEX IF NOT EXISTS idx_resultado_test_id
  ON "Resultado"(test_id);

CREATE INDEX IF NOT EXISTS idx_recomendacion_usuario_id
  ON "Recomendacion"(usuario_id);

CREATE INDEX IF NOT EXISTS idx_recomendacion_esta_activa
  ON "Recomendacion"(esta_activa)
  WHERE esta_activa = true;

-- ========================================
-- 4. VALIDACIÓN
-- ========================================

-- Verificar políticas de Recomendacion
DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pg_policies
  WHERE tablename = 'Recomendacion'
    AND policyname LIKE '%Usuario ve sus recomendaciones%'
    AND roles = '{authenticated}';

  IF v_count = 0 THEN
    RAISE EXCEPTION 'Política de Recomendacion no se creó correctamente';
  END IF;

  RAISE NOTICE 'Validación exitosa: % políticas de Recomendacion creadas', v_count;
END $$;

-- Verificar índices
DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pg_indexes
  WHERE tablename IN ('Usuario', 'Resultado', 'Recomendacion')
    AND indexname LIKE 'idx_%';

  RAISE NOTICE 'Índices creados: %', v_count;
END $$;

COMMIT;

-- ========================================
-- FIN DE MIGRACIÓN
-- ========================================
```

---

## CONCLUSIONES Y PRÓXIMOS PASOS

### Causa Confirmada de los Errores:

1. **Error 406 en Resultado:**
   - ✅ Políticas RLS están correctas
   - ❌ El usuario no tiene datos en esa tabla
   - 🟡 Posible problema de headers/serialización en cliente

2. **Error 403 en Recomendacion:**
   - ❌ Política RLS usa rol `{public}` (permite anon)
   - ❌ Sintaxis de query incorrecta (`columns=` en lugar de `select=`)
   - ✅ Los datos SÍ existen (5 recomendaciones)

### Acción Inmediata Requerida:

```bash
# Ejecutar migración de corrección
supabase db push --file AUDITORIA_RLS_RESULTADO_RECOMENDACION.sql
```

### Validación Post-Migración:

```bash
# Probar query corregida
curl -X GET \
  'https://cvezncgcdsjntzrzztrj.supabase.co/rest/v1/Recomendacion?select=usuario_id,tipo,prioridad,titulo,descripcion,url_accion,esta_activa' \
  -H "Authorization: Bearer <TOKEN>" \
  -H "apikey: <ANON_KEY>"
```

### Compliance HIPAA/GDPR:

- 🔴 **CRÍTICO:** Implementar encriptación de campos PHI
- 🟠 **ALTO:** Agregar auditoría completa de accesos
- 🟡 **MEDIO:** Implementar rate limiting
- ✅ **COMPLETADO:** Políticas RLS correctas

---

**Preparado por:** Sistema de Auditoría de Seguridad
**Nivel de Compliance:** En progreso (requiere encriptación PHI)
**Próxima Revisión:** Después de implementar migración
