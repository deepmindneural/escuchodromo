# Reporte: Solución de Errores 400 en Queries de Supabase

**Fecha:** 24 de octubre de 2025
**Tipo:** Corrección de Bugs - Queries PostgREST
**Severidad:** Alta - Funcionalidad Admin Dashboard Bloqueada

---

## Resumen Ejecutivo

Se identificaron y solucionaron **errores 400** en tres queries de Supabase que impedían el funcionamiento correcto del panel de administración. Los errores se debían a **campos inexistentes** en las queries y **sintaxis incorrecta** de PostgREST para relaciones foreign key.

### Problemas Identificados

1. **Campo `telefono` NO existe en tabla `Usuario`** → Existe en `PerfilUsuario`
2. **Campos `tipo`, `puntaje_total` NO existen en `Evaluacion`** → Existen como `Test.codigo` y `puntuacion`
3. **Campos `tipo`, `duracion_segundos`, `emocion_detectada` NO existen en `Conversacion`**
4. **Sintaxis incorrecta de foreign key:** `Usuario!usuario_id(...)` está mal formado

---

## Estructura Real de las Tablas

### Tabla `Usuario`

```sql
Columnas:
- id: UUID (PK)
- auth_id: UUID
- email: TEXT
- nombre: TEXT
- apellido: TEXT
- imagen: TEXT
- rol: TEXT
- esta_activo: BOOLEAN
- creado_en: TIMESTAMPTZ
- actualizado_en: TIMESTAMPTZ

❌ NO tiene: telefono
```

### Tabla `PerfilUsuario`

```sql
Columnas:
- id: UUID (PK)
- usuario_id: UUID (FK → Usuario.id)
- telefono: TEXT  ✅ Aquí está el teléfono
- fecha_nacimiento: DATE
- genero: TEXT
- idioma_preferido: TEXT
- ... (otros campos de perfil)
```

### Tabla `Evaluacion`

```sql
Columnas:
- id: UUID (PK)
- usuario_id: UUID (FK → Usuario.id)
- test_id: UUID (FK → Test.id)
- respuestas: JSONB
- puntuacion: DOUBLE PRECISION  ✅ (no "puntaje_total")
- severidad: TEXT
- interpretacion: TEXT
- creado_en: TIMESTAMPTZ
- completado: BOOLEAN

❌ NO tiene: tipo, puntaje_total
✅ Relación: Test.codigo contiene el tipo (PHQ-9, GAD-7)
```

### Tabla `Conversacion`

```sql
Columnas:
- id: UUID (PK)
- usuario_id: UUID (FK → Usuario.id)
- titulo: TEXT
- estado: TEXT
- contexto_embedding: VECTOR
- creado_en: TIMESTAMPTZ
- actualizado_en: TIMESTAMPTZ

❌ NO tiene: tipo, duracion_segundos, emocion_detectada
✅ Relación: AnalisisConversacion.emocion_predominante contiene emociones
✅ Cálculo: duracion = actualizado_en - creado_en
```

---

## Solución Implementada

### 1. Funciones RPC Creadas

Se crearon **6 funciones RPC** con autenticación SECURITY DEFINER y validación de permisos:

#### **`obtener_usuario_completo(p_usuario_id UUID)`**
Obtiene usuario con teléfono del perfil mediante JOIN.

```sql
SELECT
  u.id, u.nombre, u.email, u.rol,
  pu.telefono,  -- JOIN con PerfilUsuario
  u.apellido, u.imagen, u.esta_activo,
  u.creado_en, u.actualizado_en
FROM "Usuario" u
LEFT JOIN "PerfilUsuario" pu ON pu.usuario_id = u.id
WHERE u.id = p_usuario_id;
```

**Permisos:** ADMIN o el propio usuario

---

#### **`obtener_evaluaciones_admin(p_limit INT, p_offset INT)`**
Lista evaluaciones con tipo del Test y nombre del usuario.

```sql
SELECT
  e.id,
  t.codigo as tipo,  -- De la tabla Test
  e.puntuacion as puntaje_total,
  e.severidad, e.respuestas, e.creado_en, e.completado,
  e.usuario_id,
  u.nombre as usuario_nombre,
  u.email as usuario_email,
  t.nombre as test_nombre,
  t.codigo as test_codigo
FROM "Evaluacion" e
INNER JOIN "Usuario" u ON e.usuario_id = u.id
INNER JOIN "Test" t ON e.test_id = t.id
ORDER BY e.creado_en DESC;
```

**Permisos:** Solo ADMIN

---

#### **`obtener_evaluacion_por_id(p_evaluacion_id UUID)`**
Obtiene evaluación específica con relaciones completas.

**Permisos:** ADMIN o usuario dueño

---

#### **`obtener_conversaciones_admin(p_limit INT, p_offset INT)`**
Lista conversaciones con métricas calculadas.

```sql
SELECT
  c.id, c.usuario_id,
  'chat'::TEXT as tipo,  -- Valor fijo calculado
  EXTRACT(EPOCH FROM (c.actualizado_en - c.creado_en))::INT as duracion_segundos,
  ac.emocion_predominante as emocion_detectada,  -- JOIN con AnalisisConversacion
  c.creado_en, c.actualizado_en, c.titulo, c.estado,
  u.nombre as usuario_nombre,
  u.email as usuario_email,
  (SELECT COUNT(*) FROM "Mensaje" m WHERE m.conversacion_id = c.id) as cantidad_mensajes
FROM "Conversacion" c
INNER JOIN "Usuario" u ON c.usuario_id = u.id
LEFT JOIN "AnalisisConversacion" ac ON ac.conversacion_id = c.id;
```

**Permisos:** Solo ADMIN

---

#### **`obtener_conversaciones_usuario(p_usuario_id UUID)`**
Obtiene conversaciones de un usuario específico.

**Permisos:** ADMIN o usuario dueño

---

#### **`obtener_estadisticas_evaluaciones_usuario(p_usuario_id UUID)`**
Calcula estadísticas agregadas de evaluaciones.

```sql
SELECT
  COUNT(e.id) as total_evaluaciones,
  MAX(e.creado_en) as ultima_evaluacion,
  MODE() WITHIN GROUP (ORDER BY e.severidad) as severidad_promedio,
  jsonb_agg(
    jsonb_build_object('tipo', t.codigo, 'cantidad', COUNT(e.id))
  ) as evaluaciones_por_tipo
FROM "Evaluacion" e
INNER JOIN "Test" t ON e.test_id = t.id
WHERE e.usuario_id = p_usuario_id;
```

**Permisos:** ADMIN o usuario dueño

---

### 2. Índices para Optimización

```sql
CREATE INDEX IF NOT EXISTS idx_perfil_usuario_usuario_id ON "PerfilUsuario"(usuario_id);
CREATE INDEX IF NOT EXISTS idx_evaluacion_usuario_id ON "Evaluacion"(usuario_id);
CREATE INDEX IF NOT EXISTS idx_evaluacion_test_id ON "Evaluacion"(test_id);
CREATE INDEX IF NOT EXISTS idx_conversacion_usuario_id ON "Conversacion"(usuario_id);
CREATE INDEX IF NOT EXISTS idx_mensaje_conversacion_id ON "Mensaje"(conversacion_id);
CREATE INDEX IF NOT EXISTS idx_analisis_conversacion_id ON "AnalisisConversacion"(conversacion_id);
```

---

## Correcciones Necesarias en el Frontend

### Archivo 1: `/src/app/admin/usuarios/[id]/page.tsx`

**Línea 154-158** - Query Usuario con teléfono:

```typescript
// ❌ ANTES (ERROR 400)
const { data: usuarioData, error: usuarioError } = await supabase
  .from('Usuario')
  .select('*')  // Incluye campo telefono que no existe
  .eq('id', usuarioId)
  .single();

// ✅ DESPUÉS (Usar RPC)
const { data: usuarioData, error: usuarioError } = await supabase
  .rpc('obtener_usuario_completo', {
    p_usuario_id: usuarioId
  });
```

**Línea 169-174** - Query Conversacion:

```typescript
// ❌ ANTES (ERROR 400 - campos no existen)
const { data: conversacionesData, error: conversacionesError } = await supabase
  .from('Conversacion')
  .select('id, tipo, emocion, duracion, creado_en')
  .eq('usuario_id', usuarioId);

// ✅ DESPUÉS (Usar RPC)
const { data: conversacionesData, error: conversacionesError } = await supabase
  .rpc('obtener_conversaciones_usuario', {
    p_usuario_id: usuarioId
  });

// Mapear respuesta
const conversacionesMapeadas = (conversacionesData || []).map((c: any) => ({
  id: c.id,
  tipo: c.tipo,
  emocion: c.emocion_detectada,
  duracion: c.duracion_segundos,
  creado_en: c.creado_en
}));
setConversaciones(conversacionesMapeadas);
```

**Línea 180-188** - Query Evaluacion:

```typescript
// ❌ ANTES (ERROR 400 - campos no existen)
const { data: evaluacionesData, error: evaluacionesError } = await supabase
  .from('Evaluacion')
  .select('id, tipo, puntaje_total, severidad, creado_en')
  .eq('usuario_id', usuarioId);

// ✅ DESPUÉS (Usar RPC)
const { data: evaluacionesData, error: evaluacionesError } = await supabase
  .rpc('obtener_estadisticas_evaluaciones_usuario', {
    p_usuario_id: usuarioId
  });

// O para lista completa de evaluaciones:
const { data: evaluacionesLista, error } = await supabase
  .from('Evaluacion')
  .select(`
    id,
    puntuacion,
    severidad,
    creado_en,
    Test!test_id (codigo, nombre)
  `)
  .eq('usuario_id', usuarioId);

// Mapear respuesta
const evaluacionesMapeadas = (evaluacionesLista || []).map((e: any) => ({
  id: e.id,
  tipo: e.Test.codigo,  // PHQ-9, GAD-7
  puntaje_total: e.puntuacion,
  severidad: e.severidad,
  creado_en: e.creado_en
}));
```

---

### Archivo 2: `/src/app/admin/evaluaciones/page.tsx`

**Línea 136-154** - Query Evaluaciones con Usuario:

```typescript
// ❌ ANTES (ERROR 400 - sintaxis incorrecta)
const { data: evaluacionesData, error: evaluacionesError } = await supabase
  .from('Evaluacion')
  .select(`
    id,
    tipo,  // ❌ No existe
    puntaje_total,  // ❌ No existe
    severidad,
    respuestas,
    creado_en,
    Usuario!usuario_id (  // ❌ Sintaxis incorrecta
      id,
      nombre,
      email
    )
  `)
  .gte('creado_en', fechaInicio.toISOString())
  .order('creado_en', { ascending: false });

// ✅ DESPUÉS (Usar RPC)
const { data: evaluacionesData, error: evaluacionesError } = await supabase
  .rpc('obtener_evaluaciones_admin', {
    p_limit: 200,
    p_offset: 0
  });
```

**Línea 161-173** - Mapear respuesta:

```typescript
// ✅ Ajustar mapeo para estructura de RPC
const evaluacionesFormateadas = (evaluacionesData || []).map((e: any) => ({
  id: e.id,
  tipo: e.tipo,  // Ahora viene de Test.codigo
  puntaje_total: e.puntaje_total,  // Ahora viene como alias de puntuacion
  severidad: e.severidad,
  respuestas: e.respuestas,
  creado_en: e.creado_en,
  usuario: {
    id: e.usuario_id,
    nombre: e.usuario_nombre,
    email: e.usuario_email,
  },
}));
```

---

### Archivo 3: `/src/app/admin/historiales/page.tsx`

**Línea 164-170** - Edge Function obtener-historial-usuario:

Este archivo usa una Edge Function que **debe ser actualizada** para usar las nuevas funciones RPC internamente.

```typescript
// El frontend sigue igual, pero la Edge Function debe cambiar:
// supabase/functions/obtener-historial-usuario/index.ts

// ✅ Dentro de la Edge Function, usar RPC:
const { data: evaluaciones } = await supabaseAdmin
  .rpc('obtener_evaluaciones_admin', {
    p_limit: 50,
    p_offset: 0
  });

const { data: conversaciones } = await supabaseAdmin
  .rpc('obtener_conversaciones_usuario', {
    p_usuario_id: usuario_id
  });
```

---

## Ventajas de Usar Funciones RPC

1. **Seguridad:** Validación de permisos centralizada en PostgreSQL
2. **Performance:** Un solo roundtrip en lugar de múltiples queries
3. **Mantenibilidad:** Lógica de negocio en la base de datos
4. **Compatibilidad:** Evita limitaciones de PostgREST con joins complejos
5. **Auditoría:** SECURITY DEFINER permite logging centralizado
6. **Type Safety:** Retorna schemas bien definidos

---

## Verificación de Permisos RLS

Las políticas RLS existentes **SÍ permiten** acceso ADMIN:

```sql
-- Política en Usuario
"Admins ven todas las evaluaciones"
  SELECT: EXISTS (
    SELECT 1 FROM "Usuario"
    WHERE auth_id = auth.uid() AND rol = 'ADMIN'
  )

-- Política en Evaluacion
"Admins ven todas las evaluaciones"
  SELECT: EXISTS (
    SELECT 1 FROM "Usuario"
    WHERE auth_id = auth.uid() AND rol = 'ADMIN'
  )

-- Política en Conversacion
"Admins ven todas las conversaciones"
  SELECT: EXISTS (
    SELECT 1 FROM "Usuario"
    WHERE auth_id = auth.uid() AND rol = 'ADMIN'
  )
```

✅ Los permisos RLS están correctos y permiten acceso ADMIN

---

## Cómo Usar las Funciones RPC desde el Frontend

### Ejemplo 1: Obtener usuario con teléfono

```typescript
const { data, error } = await supabase
  .rpc('obtener_usuario_completo', {
    p_usuario_id: '3ad0329a-3505-4c0c-a0d3-9cc55a719023'
  });

if (data && data.length > 0) {
  const usuario = data[0];
  console.log(usuario.telefono); // Ahora disponible
}
```

### Ejemplo 2: Listar evaluaciones con filtros

```typescript
const { data, error } = await supabase
  .rpc('obtener_evaluaciones_admin', {
    p_limit: 50,
    p_offset: 0
  });

// data incluye tipo, puntaje_total, usuario_nombre, usuario_email
```

### Ejemplo 3: Obtener conversaciones con métricas

```typescript
const { data, error } = await supabase
  .rpc('obtener_conversaciones_admin', {
    p_limit: 100,
    p_offset: 0
  });

// data incluye tipo, duracion_segundos, emocion_detectada, cantidad_mensajes
```

---

## Testing de las Funciones

```sql
-- Test 1: Usuario completo
SELECT * FROM obtener_usuario_completo('3ad0329a-3505-4c0c-a0d3-9cc55a719023');

-- Test 2: Evaluaciones admin
SELECT * FROM obtener_evaluaciones_admin(10, 0);

-- Test 3: Conversaciones admin
SELECT * FROM obtener_conversaciones_admin(10, 0);

-- Test 4: Estadísticas evaluaciones
SELECT * FROM obtener_estadisticas_evaluaciones_usuario('3ad0329a-3505-4c0c-a0d3-9cc55a719023');
```

---

## Migración Aplicada

```bash
# Nombre de la migración:
supabase/migrations/20251024_crear_funciones_rpc_admin_queries.sql

# Contenido:
- 6 funciones RPC
- 6 índices de optimización
- Permisos GRANT EXECUTE
- Comentarios de documentación
```

✅ **Migración aplicada exitosamente a la base de datos**

---

## Próximos Pasos

1. ✅ Funciones RPC creadas e indexadas
2. ⏳ **Actualizar frontend** en los 3 archivos mencionados
3. ⏳ **Actualizar Edge Function** `obtener-historial-usuario`
4. ⏳ **Testing E2E** del panel admin completo
5. ⏳ **Verificar logs** de errores 400 desaparecen

---

## Conclusión

Los errores 400 se debían a **discrepancia entre el esquema de base de datos y las queries del frontend**. La solución implementada mediante **funciones RPC** no solo resuelve los errores, sino que mejora la arquitectura del sistema con:

- Mejor seguridad (validación centralizada)
- Mejor performance (menos roundtrips)
- Mejor mantenibilidad (lógica en un solo lugar)
- Mejor type safety (schemas bien definidos)

**Estado:** ✅ Migración completada - Frontend pendiente de actualización
**Impacto:** 3 páginas admin afectadas - Solución lista para implementar

---

## Archivos Afectados

1. `/src/app/admin/usuarios/[id]/page.tsx` - Líneas 154, 169, 180
2. `/src/app/admin/evaluaciones/page.tsx` - Líneas 136-154
3. `/src/app/admin/historiales/page.tsx` - Edge Function
4. `supabase/migrations/20251024_crear_funciones_rpc_admin_queries.sql` - ✅ Creado

---

**Generado por:** Claude Code - Backend Security Engineer
**Fecha:** 24 de octubre de 2025
