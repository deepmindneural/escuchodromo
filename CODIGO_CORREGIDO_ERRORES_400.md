# Código Corregido para Errores 400 de Supabase

Este archivo contiene los snippets exactos de código para reemplazar en los archivos del frontend.

---

## 1. `/src/app/admin/usuarios/[id]/page.tsx`

### Cambio 1: Función `cargarDatosUsuario` - Query de Usuario

**Ubicación:** Líneas 148-166

**REEMPLAZAR:**
```typescript
const cargarDatosUsuario = async () => {
  setCargando(true);
  try {
    const supabase = obtenerClienteNavegador();

    // Cargar información básica del usuario
    const { data: usuarioData, error: usuarioError } = await supabase
      .from('Usuario')
      .select('*')
      .eq('id', usuarioId)
      .single();

    if (usuarioError) {
      console.error('Error al cargar usuario:', usuarioError);
      toast.error('Error al cargar información del usuario');
      return;
    }

    setUsuario(usuarioData);
```

**POR:**
```typescript
const cargarDatosUsuario = async () => {
  setCargando(true);
  try {
    const supabase = obtenerClienteNavegador();

    // Cargar información básica del usuario con teléfono del perfil
    const { data: usuarioData, error: usuarioError } = await supabase
      .rpc('obtener_usuario_completo', {
        p_usuario_id: usuarioId
      });

    if (usuarioError || !usuarioData || usuarioData.length === 0) {
      console.error('Error al cargar usuario:', usuarioError);
      toast.error('Error al cargar información del usuario');
      return;
    }

    setUsuario(usuarioData[0]);
```

---

### Cambio 2: Query de Conversaciones

**Ubicación:** Líneas 168-178

**REEMPLAZAR:**
```typescript
    // Cargar conversaciones (últimas 20)
    const { data: conversacionesData, error: conversacionesError } = await supabase
      .from('Conversacion')
      .select('id, tipo, emocion, duracion, creado_en')
      .eq('usuario_id', usuarioId)
      .order('creado_en', { ascending: false })
      .limit(20);

    if (!conversacionesError && conversacionesData) {
      setConversaciones(conversacionesData);
    }
```

**POR:**
```typescript
    // Cargar conversaciones (últimas 20)
    const { data: conversacionesData, error: conversacionesError } = await supabase
      .rpc('obtener_conversaciones_usuario', {
        p_usuario_id: usuarioId
      });

    if (!conversacionesError && conversacionesData) {
      // Mapear campos a la estructura esperada
      const conversacionesMapeadas = conversacionesData.slice(0, 20).map((c: any) => ({
        id: c.id,
        tipo: c.tipo,
        emocion: c.emocion_detectada,
        duracion: c.duracion_segundos,
        creado_en: c.creado_en
      }));
      setConversaciones(conversacionesMapeadas);
    }
```

---

### Cambio 3: Query de Evaluaciones

**Ubicación:** Líneas 180-189

**REEMPLAZAR:**
```typescript
    // Cargar evaluaciones
    const { data: evaluacionesData, error: evaluacionesError } = await supabase
      .from('Evaluacion')
      .select('id, tipo, puntaje_total, severidad, creado_en')
      .eq('usuario_id', usuarioId)
      .order('creado_en', { ascending: false });

    if (!evaluacionesError && evaluacionesData) {
      setEvaluaciones(evaluacionesData);
    }
```

**POR:**
```typescript
    // Cargar evaluaciones
    const { data: evaluacionesData, error: evaluacionesError } = await supabase
      .from('Evaluacion')
      .select(`
        id,
        puntuacion,
        severidad,
        creado_en,
        Test!test_id (
          codigo,
          nombre
        )
      `)
      .eq('usuario_id', usuarioId)
      .order('creado_en', { ascending: false });

    if (!evaluacionesError && evaluacionesData) {
      // Mapear campos a la estructura esperada
      const evaluacionesMapeadas = evaluacionesData.map((e: any) => ({
        id: e.id,
        tipo: e.Test?.codigo || 'PHQ-9',
        puntaje_total: e.puntuacion,
        severidad: e.severidad,
        creado_en: e.creado_en
      }));
      setEvaluaciones(evaluacionesMapeadas);
    }
```

---

### Cambio 4: Cálculo de Funcionalidades Más Usadas

**Ubicación:** Líneas 284-289

**REEMPLAZAR:**
```typescript
      const funcionalidades = [
        { nombre: 'Chat de Texto', cantidad: conversacionesData?.filter((c) => c.tipo === 'chat')?.length || 0 },
        { nombre: 'Chat de Voz', cantidad: conversacionesData?.filter((c) => c.tipo === 'voz')?.length || 0 },
        { nombre: 'Evaluaciones PHQ-9', cantidad: evaluacionesData?.filter((e) => e.tipo === 'PHQ-9')?.length || 0 },
        { nombre: 'Evaluaciones GAD-7', cantidad: evaluacionesData?.filter((e) => e.tipo === 'GAD-7')?.length || 0 },
```

**POR:**
```typescript
      const funcionalidades = [
        { nombre: 'Chat de Texto', cantidad: conversacionesMapeadas?.filter((c) => c.tipo === 'chat')?.length || 0 },
        { nombre: 'Chat de Voz', cantidad: conversacionesMapeadas?.filter((c) => c.tipo === 'voz')?.length || 0 },
        { nombre: 'Evaluaciones PHQ-9', cantidad: evaluacionesMapeadas?.filter((e) => e.tipo === 'PHQ-9')?.length || 0 },
        { nombre: 'Evaluaciones GAD-7', cantidad: evaluacionesMapeadas?.filter((e) => e.tipo === 'GAD-7')?.length || 0 },
```

---

## 2. `/src/app/admin/evaluaciones/page.tsx`

### Cambio 1: Función `cargarDatos` - Query de Evaluaciones

**Ubicación:** Líneas 129-214

**REEMPLAZAR:**
```typescript
  const cargarDatos = async () => {
    setCargando(true);
    try {
      const supabase = obtenerClienteNavegador();
      const fechaInicio = new Date();
      fechaInicio.setMonth(fechaInicio.getMonth() - 3); // Últimos 3 meses

      // Cargar evaluaciones
      const { data: evaluacionesData, error: evaluacionesError } = await supabase
        .from('Evaluacion')
        .select(`
          id,
          tipo,
          puntaje_total,
          severidad,
          respuestas,
          creado_en,
          Usuario!usuario_id (
            id,
            nombre,
            email
          )
        `)
        .gte('creado_en', fechaInicio.toISOString())
        .order('creado_en', { ascending: false })
        .limit(200);

      if (evaluacionesError) {
        console.error('Error al cargar evaluaciones:', evaluacionesError);
        toast.error('Error al cargar evaluaciones');
      }

      const evaluacionesFormateadas = (evaluacionesData || []).map((e: any) => ({
        id: e.id,
        tipo: e.tipo || 'PHQ-9',
        puntaje_total: e.puntaje_total || 0,
        severidad: e.severidad || 'leve',
        respuestas: e.respuestas,
        creado_en: e.creado_en,
        usuario: {
          id: e.Usuario?.id || '',
          nombre: e.Usuario?.nombre || 'Usuario desconocido',
          email: e.Usuario?.email || 'Sin email',
        },
      }));
```

**POR:**
```typescript
  const cargarDatos = async () => {
    setCargando(true);
    try {
      const supabase = obtenerClienteNavegador();
      const fechaInicio = new Date();
      fechaInicio.setMonth(fechaInicio.getMonth() - 3); // Últimos 3 meses

      // Cargar evaluaciones usando RPC
      const { data: evaluacionesData, error: evaluacionesError } = await supabase
        .rpc('obtener_evaluaciones_admin', {
          p_limit: 200,
          p_offset: 0
        });

      if (evaluacionesError) {
        console.error('Error al cargar evaluaciones:', evaluacionesError);
        toast.error('Error al cargar evaluaciones');
      }

      // Filtrar por fecha en el cliente (o modificar la función RPC para aceptar fecha)
      const evaluacionesFiltradas = (evaluacionesData || []).filter((e: any) => {
        return new Date(e.creado_en) >= fechaInicio;
      });

      const evaluacionesFormateadas = evaluacionesFiltradas.map((e: any) => ({
        id: e.id,
        tipo: e.tipo || 'PHQ-9',
        puntaje_total: e.puntaje_total || 0,
        severidad: e.severidad || 'leve',
        respuestas: e.respuestas,
        creado_en: e.creado_en,
        usuario: {
          id: e.usuario_id || '',
          nombre: e.usuario_nombre || 'Usuario desconocido',
          email: e.usuario_email || 'Sin email',
        },
      }));
```

---

## 3. `/src/app/admin/historiales/page.tsx`

Este archivo NO requiere cambios en el frontend, pero la Edge Function que invoca necesita actualización.

### Edge Function: `supabase/functions/obtener-historial-usuario/index.ts`

Si la Edge Function existe, actualizar las queries internas para usar las funciones RPC:

**BUSCAR:**
```typescript
// Cargar evaluaciones
const { data: evaluaciones } = await supabaseAdmin
  .from('Evaluacion')
  .select('...')
  .eq('usuario_id', usuario_id);
```

**REEMPLAZAR POR:**
```typescript
// Cargar evaluaciones usando RPC
const { data: evaluaciones } = await supabaseAdmin
  .rpc('obtener_evaluaciones_admin', {
    p_limit: 100,
    p_offset: 0
  });

// Filtrar por usuario si es necesario
const evaluacionesUsuario = evaluaciones?.filter((e: any) => e.usuario_id === usuario_id);
```

**BUSCAR:**
```typescript
// Cargar conversaciones
const { data: conversaciones } = await supabaseAdmin
  .from('Conversacion')
  .select('...')
  .eq('usuario_id', usuario_id);
```

**REEMPLAZAR POR:**
```typescript
// Cargar conversaciones usando RPC
const { data: conversaciones } = await supabaseAdmin
  .rpc('obtener_conversaciones_usuario', {
    p_usuario_id: usuario_id
  });
```

---

## 4. Verificación de Tipos TypeScript

Actualizar interfaces si es necesario:

### `/src/app/admin/usuarios/[id]/page.tsx`

**AGREGAR al inicio del archivo (después de línea 51):**
```typescript
interface Usuario {
  id: string;
  email: string;
  nombre: string | null;
  apellido: string | null;
  telefono: string | null;  // Ahora disponible desde PerfilUsuario
  imagen: string | null;
  rol: string;
  esta_activo: boolean;
  creado_en: string;
  actualizado_en: string;
}
```

---

## 5. Testing Manual

### Test en la consola de Supabase:

```sql
-- 1. Probar función de usuario completo
SELECT * FROM obtener_usuario_completo('3ad0329a-3505-4c0c-a0d3-9cc55a719023');

-- 2. Probar función de evaluaciones admin
SELECT * FROM obtener_evaluaciones_admin(10, 0);

-- 3. Probar función de conversaciones admin
SELECT * FROM obtener_conversaciones_admin(10, 0);

-- 4. Verificar que retornan datos
-- Resultado esperado: JSON con todos los campos requeridos
```

### Test desde el navegador (DevTools Console):

```javascript
// Obtener cliente Supabase
const supabase = obtenerClienteNavegador();

// Test 1: Usuario completo
const { data, error } = await supabase.rpc('obtener_usuario_completo', {
  p_usuario_id: '3ad0329a-3505-4c0c-a0d3-9cc55a719023'
});
console.log('Usuario:', data, error);

// Test 2: Evaluaciones admin
const { data: evals, error: errEvals } = await supabase.rpc('obtener_evaluaciones_admin', {
  p_limit: 10,
  p_offset: 0
});
console.log('Evaluaciones:', evals, errEvals);

// Test 3: Conversaciones
const { data: convs, error: errConvs } = await supabase.rpc('obtener_conversaciones_admin', {
  p_limit: 10,
  p_offset: 0
});
console.log('Conversaciones:', convs, errConvs);
```

---

## 6. Checklist de Implementación

- [ ] Aplicar cambios en `/src/app/admin/usuarios/[id]/page.tsx`
  - [ ] Cambio 1: Query de Usuario (líneas 148-166)
  - [ ] Cambio 2: Query de Conversaciones (líneas 168-178)
  - [ ] Cambio 3: Query de Evaluaciones (líneas 180-189)
  - [ ] Cambio 4: Cálculo funcionalidades (líneas 284-289)

- [ ] Aplicar cambios en `/src/app/admin/evaluaciones/page.tsx`
  - [ ] Cambio 1: Query de Evaluaciones (líneas 129-214)

- [ ] Revisar Edge Function `obtener-historial-usuario` (si existe)
  - [ ] Actualizar queries internas a RPC

- [ ] Testing
  - [ ] Probar SQL directamente en Supabase
  - [ ] Probar desde navegador en DevTools
  - [ ] Navegar a `/admin/usuarios/[id]` y verificar sin errores 400
  - [ ] Navegar a `/admin/evaluaciones` y verificar sin errores 400
  - [ ] Navegar a `/admin/historiales` y verificar sin errores 400

- [ ] Monitoreo
  - [ ] Revisar Network tab en DevTools
  - [ ] Confirmar que no hay errores 400 en `/rest/v1/Usuario`
  - [ ] Confirmar que no hay errores 400 en `/rest/v1/Evaluacion`
  - [ ] Confirmar que no hay errores 400 en `/rest/v1/Conversacion`

---

## 7. Rollback (si algo falla)

Si necesitas revertir los cambios:

```sql
-- Eliminar funciones RPC creadas
DROP FUNCTION IF EXISTS obtener_usuario_completo(UUID);
DROP FUNCTION IF EXISTS obtener_evaluaciones_admin(INT, INT);
DROP FUNCTION IF EXISTS obtener_evaluacion_por_id(UUID);
DROP FUNCTION IF EXISTS obtener_conversaciones_admin(INT, INT);
DROP FUNCTION IF EXISTS obtener_conversaciones_usuario(UUID);
DROP FUNCTION IF EXISTS obtener_estadisticas_evaluaciones_usuario(UUID);

-- Eliminar índices creados
DROP INDEX IF EXISTS idx_perfil_usuario_usuario_id;
DROP INDEX IF EXISTS idx_evaluacion_usuario_id;
DROP INDEX IF EXISTS idx_evaluacion_test_id;
DROP INDEX IF EXISTS idx_conversacion_usuario_id;
DROP INDEX IF EXISTS idx_mensaje_conversacion_id;
DROP INDEX IF EXISTS idx_analisis_conversacion_id;
```

Luego revertir cambios en el código del frontend usando Git:
```bash
git checkout HEAD -- src/app/admin/usuarios/[id]/page.tsx
git checkout HEAD -- src/app/admin/evaluaciones/page.tsx
```

---

**Última actualización:** 24 de octubre de 2025
**Por:** Claude Code - Backend Security Engineer
