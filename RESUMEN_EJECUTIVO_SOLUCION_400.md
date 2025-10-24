# Resumen Ejecutivo: Solución Errores 400 en Queries de Supabase

**Fecha:** 24 de octubre de 2025
**Estado:** ✅ Migración Completada - Frontend Pendiente
**Tiempo Estimado de Implementación Frontend:** 30-45 minutos

---

## Problema Identificado

El panel de administración presentaba **errores HTTP 400** en tres endpoints críticos debido a:

1. **Campos inexistentes** en queries PostgREST
2. **Sintaxis incorrecta** de foreign keys
3. **Estructura de datos incompatible** entre frontend y base de datos

### Errores Específicos

```
❌ /rest/v1/Usuario?select=...telefono → Campo no existe en Usuario
❌ /rest/v1/Evaluacion?select=...tipo,puntaje_total → Campos no existen
❌ /rest/v1/Conversacion?select=...tipo,duracion_segundos,emocion_detectada → Campos no existen
```

---

## Solución Implementada

### ✅ Base de Datos (COMPLETADO)

Se crearon **6 funciones RPC** en PostgreSQL con:

- **Seguridad:** Validación SECURITY DEFINER con autenticación ADMIN
- **Performance:** 6 índices optimizados
- **Mantenibilidad:** Lógica centralizada en base de datos

#### Funciones Creadas

| Función | Propósito | Permisos |
|---------|-----------|----------|
| `obtener_usuario_completo()` | Usuario + teléfono del perfil | ADMIN o propio usuario |
| `obtener_evaluaciones_admin()` | Lista evaluaciones con tipo y usuario | Solo ADMIN |
| `obtener_evaluacion_por_id()` | Evaluación específica completa | ADMIN o usuario dueño |
| `obtener_conversaciones_admin()` | Lista conversaciones con métricas | Solo ADMIN |
| `obtener_conversaciones_usuario()` | Conversaciones de un usuario | ADMIN o usuario dueño |
| `obtener_estadisticas_evaluaciones_usuario()` | Stats agregadas de evaluaciones | ADMIN o usuario dueño |

#### Ventajas de RPC vs Queries Directas

1. **Seguridad mejorada:** Validación centralizada en PostgreSQL
2. **Performance:** Un solo roundtrip en vez de múltiples queries
3. **Mantenibilidad:** Lógica de negocio en la base de datos
4. **Type safety:** Schemas bien definidos
5. **Compatibilidad:** Evita limitaciones de PostgREST

---

## Cambios Requeridos en Frontend

### 📁 Archivos Afectados (3)

| Archivo | Líneas | Cambios |
|---------|--------|---------|
| `/src/app/admin/usuarios/[id]/page.tsx` | 154, 169, 180, 284 | Reemplazar queries con RPC |
| `/src/app/admin/evaluaciones/page.tsx` | 136-154 | Usar `obtener_evaluaciones_admin()` |
| `/src/app/admin/historiales/page.tsx` | Edge Function | Actualizar queries internas |

### Ejemplo de Cambio

**ANTES (Error 400):**
```typescript
const { data } = await supabase
  .from('Usuario')
  .select('*, telefono')  // ❌ telefono no existe
  .eq('id', usuarioId);
```

**DESPUÉS (Funciona):**
```typescript
const { data } = await supabase
  .rpc('obtener_usuario_completo', {
    p_usuario_id: usuarioId
  });
const usuario = data[0];  // ✅ Incluye telefono
```

---

## Documentación Generada

Se crearon 3 archivos de documentación:

1. **REPORTE_SOLUCION_ERRORES_400_SUPABASE.md** (Análisis técnico completo)
   - Estructura real de tablas
   - Explicación detallada de cada función RPC
   - Ventajas de la solución
   - Testing y verificación

2. **CODIGO_CORREGIDO_ERRORES_400.md** (Snippets copy-paste)
   - Código exacto para reemplazar en cada archivo
   - Ejemplos de antes/después
   - Checklist de implementación
   - Testing manual

3. **RESUMEN_EJECUTIVO_SOLUCION_400.md** (Este archivo)
   - Vista de alto nivel para stakeholders
   - Plan de acción inmediato

---

## Plan de Acción Inmediato

### Paso 1: Validar Migración ✅

```sql
-- Ejecutar en Supabase SQL Editor
SELECT routine_name
FROM information_schema.routines
WHERE routine_name LIKE 'obtener_%';

-- Debe retornar 6 funciones nuevas ✅
```

### Paso 2: Actualizar Frontend (30-45 min)

1. Abrir `/src/app/admin/usuarios/[id]/page.tsx`
2. Copiar código desde `CODIGO_CORREGIDO_ERRORES_400.md`
3. Reemplazar 4 secciones (líneas 154, 169, 180, 284)
4. Guardar y probar en `/admin/usuarios/[algún-id]`

5. Abrir `/src/app/admin/evaluaciones/page.tsx`
6. Copiar código desde `CODIGO_CORREGIDO_ERRORES_400.md`
7. Reemplazar sección (líneas 136-154)
8. Guardar y probar en `/admin/evaluaciones`

9. Si existe Edge Function `obtener-historial-usuario`:
   - Actualizar queries internas a RPC
   - Probar en `/admin/historiales`

### Paso 3: Testing (15 min)

```bash
# Terminal 1: Iniciar dev server
npm run dev

# Terminal 2: Abrir navegador
open http://localhost:3000/admin/usuarios/[algún-uuid]
```

**Verificar en DevTools Network:**
- ✅ No hay errores 400 en `/rest/v1/Usuario`
- ✅ No hay errores 400 en `/rest/v1/Evaluacion`
- ✅ No hay errores 400 en `/rest/v1/Conversacion`
- ✅ Aparecen llamadas a `/rest/v1/rpc/obtener_*`

### Paso 4: Commit

```bash
git add .
git commit -m "fix(admin): solucionar errores 400 en queries usando funciones RPC

- Crear 6 funciones RPC seguras en PostgreSQL
- Actualizar queries de Usuario, Evaluacion, Conversacion
- Agregar índices de optimización
- Documentar solución completa

Resuelve: Errores 400 en panel admin
Ver: REPORTE_SOLUCION_ERRORES_400_SUPABASE.md"
```

---

## Testing de Validación

### Test SQL (Supabase Dashboard)

```sql
-- Debe funcionar SOLO si estás autenticado como ADMIN
SELECT * FROM obtener_evaluaciones_admin(10, 0);
SELECT * FROM obtener_conversaciones_admin(10, 0);

-- Si retorna error "Solo administradores pueden acceder" → ✅ Seguridad OK
```

### Test Frontend (DevTools Console)

```javascript
// Pegar en consola del navegador (autenticado como ADMIN)
const supabase = obtenerClienteNavegador();

const { data, error } = await supabase.rpc('obtener_evaluaciones_admin', {
  p_limit: 5, p_offset: 0
});

console.log('Datos:', data);
console.log('Error:', error);

// Debe retornar array con evaluaciones ✅
```

---

## Estructura de Datos Retornada

### `obtener_usuario_completo()`

```typescript
{
  id: UUID,
  nombre: string,
  email: string,
  rol: string,
  telefono: string,  // ✅ Ahora disponible
  apellido: string,
  imagen: string,
  esta_activo: boolean,
  creado_en: timestamp,
  actualizado_en: timestamp
}
```

### `obtener_evaluaciones_admin()`

```typescript
{
  id: UUID,
  tipo: string,  // ✅ De Test.codigo
  puntaje_total: number,  // ✅ De Evaluacion.puntuacion
  severidad: string,
  respuestas: JSONB,
  creado_en: timestamp,
  completado: boolean,
  usuario_id: UUID,
  usuario_nombre: string,  // ✅ JOIN incluido
  usuario_email: string,  // ✅ JOIN incluido
  test_nombre: string,
  test_codigo: string
}
```

### `obtener_conversaciones_admin()`

```typescript
{
  id: UUID,
  usuario_id: UUID,
  tipo: string,  // ✅ Calculado: 'chat'
  duracion_segundos: number,  // ✅ Calculado: actualizado_en - creado_en
  emocion_detectada: string,  // ✅ JOIN con AnalisisConversacion
  creado_en: timestamp,
  actualizado_en: timestamp,
  titulo: string,
  estado: string,
  usuario_nombre: string,
  usuario_email: string,
  cantidad_mensajes: number  // ✅ COUNT de Mensaje
}
```

---

## Monitoreo Post-Implementación

### Métricas de Éxito

- ✅ Cero errores 400 en `/rest/v1/Usuario`
- ✅ Cero errores 400 en `/rest/v1/Evaluacion`
- ✅ Cero errores 400 en `/rest/v1/Conversacion`
- ✅ Panel admin `/admin/usuarios/[id]` carga sin errores
- ✅ Panel admin `/admin/evaluaciones` carga sin errores
- ✅ Panel admin `/admin/historiales` carga sin errores

### Logs a Revisar

```bash
# Supabase Logs
# Ir a: Supabase Dashboard → Logs → Database
# Filtrar por: "ERROR"
# Debe mostrar: cero errores relacionados con "column does not exist"
```

---

## Rollback (si es necesario)

Si algo falla, revisar archivo `CODIGO_CORREGIDO_ERRORES_400.md` sección 7.

**SQL Rollback:**
```sql
DROP FUNCTION IF EXISTS obtener_usuario_completo(UUID);
DROP FUNCTION IF EXISTS obtener_evaluaciones_admin(INT, INT);
DROP FUNCTION IF EXISTS obtener_evaluacion_por_id(UUID);
DROP FUNCTION IF EXISTS obtener_conversaciones_admin(INT, INT);
DROP FUNCTION IF EXISTS obtener_conversaciones_usuario(UUID);
DROP FUNCTION IF EXISTS obtener_estadisticas_evaluaciones_usuario(UUID);
```

**Git Rollback:**
```bash
git checkout HEAD -- src/app/admin/usuarios/[id]/page.tsx
git checkout HEAD -- src/app/admin/evaluaciones/page.tsx
```

---

## Equipo Responsable

| Rol | Responsabilidad |
|-----|----------------|
| Backend Engineer | ✅ Crear funciones RPC (COMPLETADO) |
| Frontend Developer | ⏳ Actualizar queries en 3 archivos |
| QA | ⏳ Testing E2E del panel admin |
| DevOps | ⏳ Monitorear logs post-deploy |

---

## Próximos Pasos

1. ⏳ Aplicar cambios en frontend (30 min)
2. ⏳ Testing manual en dev (15 min)
3. ⏳ Code review
4. ⏳ Testing E2E automatizado
5. ⏳ Deploy a staging
6. ⏳ Monitoreo 24h
7. ⏳ Deploy a producción

---

## Impacto en Usuarios

| Usuario | Antes | Después |
|---------|-------|---------|
| Admin | ❌ Panel bloqueado con errores 400 | ✅ Panel funcional completo |
| Terapeuta | ✅ No afectado | ✅ No afectado |
| Usuario final | ✅ No afectado | ✅ No afectado |

---

## Preguntas Frecuentes

**P: ¿Por qué RPC en vez de queries directas?**
R: PostgREST tiene limitaciones con joins complejos y campos calculados. RPC centraliza la lógica y mejora seguridad.

**P: ¿Esto afecta performance?**
R: No, mejora performance al reducir roundtrips y agregar índices optimizados.

**P: ¿Es seguro?**
R: Sí, SECURITY DEFINER valida permisos ADMIN antes de retornar datos sensibles.

**P: ¿Qué pasa si un usuario normal intenta acceder?**
R: La función retorna error: "Solo administradores pueden acceder".

**P: ¿Cuánto tiempo toma implementar?**
R: Frontend: 30-45 min | Testing: 15 min | Total: ~1 hora

---

**Estado Final:** ✅ Solución lista para implementación en frontend

**Archivos de Referencia:**
- `REPORTE_SOLUCION_ERRORES_400_SUPABASE.md` → Análisis técnico completo
- `CODIGO_CORREGIDO_ERRORES_400.md` → Código copy-paste listo
- `supabase/migrations/20251024_crear_funciones_rpc_admin_queries.sql` → Migración aplicada

---

**Última actualización:** 24 de octubre de 2025
**Por:** Claude Code - Backend Security Engineer
