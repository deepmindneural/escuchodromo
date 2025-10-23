# AUDITORÍA COMPLETA DE ACCESIBILIDAD Y UX - PANEL DE ADMINISTRADOR

**Proyecto:** Escuchodromo - Plataforma de Salud Mental
**Área auditada:** Panel de Administrador
**Fecha:** 23 de octubre de 2025
**Auditor:** Especialista UX/Accesibilidad
**Estándar:** WCAG 2.1 Nivel AA

---

## TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Archivos Auditados](#archivos-auditados)
3. [Hallazgos Críticos](#hallazgos-críticos)
4. [Auditoría Detallada por Página](#auditoría-detallada-por-página)
5. [Patrones UX Recomendados](#patrones-ux-recomendados)
6. [Lista de Verificación WCAG 2.1 AA](#lista-de-verificación-wcag-21-aa)
7. [Guía de Navegación por Teclado](#guía-de-navegación-por-teclado)
8. [Recomendaciones Priorizadas](#recomendaciones-priorizadas)
9. [Wireframes y Mockups](#wireframes-y-mockups)

---

## RESUMEN EJECUTIVO

### Estado General

**Puntuación de Accesibilidad Estimada:** 68/100

**Puntuación de UX para Administradores:** 62/100

### Fortalezas Identificadas

1. ✅ Componentes de AlertasCriticas con ARIA completo y excelente implementación
2. ✅ Uso de Radix UI en modales (accesibles por defecto)
3. ✅ Feedback visual claro en estados de carga
4. ✅ Breadcrumbs implícitos en navegación
5. ✅ Paginación implementada en tablas
6. ✅ Búsqueda en tiempo real funcional

### Problemas Críticos

1. 🔴 **CRÍTICO:** Falta de focus trap en modales personalizados
2. 🔴 **CRÍTICO:** Tablas sin ARIA labels en headers
3. 🔴 **CRÍTICO:** Acciones destructivas sin confirmación modal
4. 🔴 **CRÍTICO:** Selectores inline sin labels asociados
5. 🟡 **ALTO:** Loading spinners agresivos (no terapéuticos)
6. 🟡 **ALTO:** Falta de navegación por teclado en tablas
7. 🟡 **ALTO:** Búsqueda sin debounce optimizado
8. 🟡 **ALTO:** Sin indicadores de ordenamiento en columnas
9. 🟡 **MEDIO:** Falta de skip links
10. 🟡 **MEDIO:** Estados de error no anunciados

---

## ARCHIVOS AUDITADOS

### Páginas Principales

1. `/src/app/admin/layout.tsx` - Layout del panel admin
2. `/src/app/admin/page.tsx` - Dashboard principal
3. `/src/app/admin/usuarios/page.tsx` - Gestión de usuarios
4. `/src/app/admin/suscripciones/page.tsx` - Gestión de suscripciones
5. `/src/app/admin/profesionales/page.tsx` - Lista de profesionales
6. `/src/app/admin/profesionales/[id]/page.tsx` - Detalle de profesional
7. `/src/app/admin/historiales/page.tsx` - Historiales de usuarios

### Componentes Compartidos

1. `/src/lib/componentes/admin/AlertasCriticas.tsx`
2. `/src/lib/componentes/admin/ModalAprobar.tsx`
3. `/src/lib/componentes/admin/VisorDocumento.tsx`

---

## HALLAZGOS CRÍTICOS

### 1. Layout del Administrador (`/src/app/admin/layout.tsx`)

#### 🔴 CRÍTICOS

**1.1. Sidebar sin ARIA navigation landmark**
```tsx
// ❌ PROBLEMA (línea 122-181)
<aside className={cn("fixed top-0 left-0 z-50...")}>
  <nav className="flex-1 p-4 overflow-y-auto">
    <ul className="space-y-1">
```

**Impacto:** Lectores de pantalla no identifican correctamente la navegación.

**Solución:**
```tsx
// ✅ CORRECCIÓN
<aside
  role="complementary"
  aria-label="Navegación principal del administrador"
  className={cn("fixed top-0 left-0 z-50...")}
>
  <nav aria-label="Menú de administrador">
    <ul role="list">
```

---

**1.2. Links de navegación sin indicador de página activa**
```tsx
// ❌ PROBLEMA (línea 152-159)
<Link
  href={item.href}
  className="flex items-center gap-3..."
>
```

**Impacto:** Usuarios no saben en qué página están.

**Solución:**
```tsx
// ✅ CORRECCIÓN
const rutaActual = usePathname();

<Link
  href={item.href}
  aria-current={rutaActual === item.href ? 'page' : undefined}
  className={cn(
    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
    rutaActual === item.href
      ? "bg-calma-500 text-white font-semibold"
      : "text-gray-700 hover:bg-calma-100 hover:text-calma-700"
  )}
>
```

---

**1.3. Overlay de móvil no es focus trap**
```tsx
// ❌ PROBLEMA (línea 113-119)
<div
  className={cn("fixed inset-0 z-50 bg-black/30...")}
  onClick={() => setMenuAbierto(false)}
/>
```

**Impacto:** El foco puede escapar del sidebar móvil.

**Solución:** Usar Radix Dialog o implementar focus trap manual.

---

**1.4. Botón de cerrar sin label accesible**
```tsx
// ❌ PROBLEMA (línea 137-143)
<Button
  variant="ghost"
  size="icon"
  className="lg:hidden..."
  onClick={() => setMenuAbierto(false)}
>
  <X className="h-5 w-5" />
</Button>
```

**Solución:**
```tsx
// ✅ CORRECCIÓN
<Button
  variant="ghost"
  size="icon"
  aria-label="Cerrar menú de navegación"
  className="lg:hidden..."
  onClick={() => setMenuAbierto(false)}
>
  <X className="h-5 w-5" aria-hidden="true" />
</Button>
```

---

### 2. Dashboard Principal (`/src/app/admin/page.tsx`)

#### 🔴 CRÍTICOS

**2.1. Gráficos sin descripción textual**
```tsx
// ❌ PROBLEMA (línea 418-433)
<ApexChart
  options={opcionesApexChart}
  series={seriesApexChart}
  type="area"
  height="100%"
/>
```

**Impacto:** Usuarios con lectores de pantalla no acceden a los datos.

**Solución:**
```tsx
// ✅ CORRECCIÓN
<div role="img" aria-labelledby="grafico-actividad-titulo grafico-actividad-desc">
  <h3 id="grafico-actividad-titulo" className="sr-only">
    Gráfico de actividad en tiempo real
  </h3>
  <p id="grafico-actividad-desc" className="sr-only">
    Muestra la actividad de conversaciones y usuarios activos durante las últimas 24 horas.
    Conversaciones: pico de 85 a las 16:00. Usuarios activos: pico de 75 a las 16:00.
  </p>
  <ApexChart
    options={opcionesApexChart}
    series={seriesApexChart}
    type="area"
    height="100%"
  />
</div>
```

---

**2.2. Tarjetas de estadísticas sin contexto semántico**
```tsx
// ❌ PROBLEMA (línea 363-404)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
  {tarjetasEstadisticas.map((tarjeta, index) => (
    <motion.div key={tarjeta.titulo}...>
```

**Solución:**
```tsx
// ✅ CORRECCIÓN
<div
  role="region"
  aria-labelledby="estadisticas-heading"
  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
>
  <h2 id="estadisticas-heading" className="sr-only">
    Estadísticas generales del sistema
  </h2>
  {tarjetasEstadisticas.map((tarjeta, index) => (
    <article
      key={tarjeta.titulo}
      aria-labelledby={`stat-${index}-titulo`}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
    >
      <h3 id={`stat-${index}-titulo`} className="text-sm font-medium text-gray-600 mb-1">
        {tarjeta.titulo}
      </h3>
      <p className="text-3xl font-bold text-gray-900">
        <span aria-label={`${tarjeta.valor} ${tarjeta.titulo}`}>
          <CountUp end={tarjeta.valor} duration={2} suffix={tarjeta.sufijo} />
        </span>
      </p>
      <div
        className="flex items-center mt-2"
        role="status"
        aria-label={`Cambio de ${tarjeta.tendencia === 'up' ? 'aumento' : 'disminución'} de ${Math.abs(tarjeta.cambio)} hoy`}
      >
```

---

**2.3. Loading state no terapéutico**
```tsx
// ❌ PROBLEMA (línea 328-330)
<div
  className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"
  aria-hidden="true"
></div>
```

**Impacto:** Spinner agresivo, no calma.

**Solución:**
```tsx
// ✅ CORRECCIÓN (patrón terapéutico)
<div className="flex items-center gap-3 text-calma-500">
  <div
    className="w-2 h-2 rounded-full bg-current animate-pulse"
    style={{ animationDelay: '0ms' }}
    aria-hidden="true"
  />
  <div
    className="w-2 h-2 rounded-full bg-current animate-pulse"
    style={{ animationDelay: '150ms' }}
    aria-hidden="true"
  />
  <div
    className="w-2 h-2 rounded-full bg-current animate-pulse"
    style={{ animationDelay: '300ms' }}
    aria-hidden="true"
  />
  <span className="sr-only">Cargando estadísticas...</span>
</div>
```

---

### 3. Gestión de Usuarios (`/src/app/admin/usuarios/page.tsx`)

#### 🔴 CRÍTICOS

**3.1. Tabla sin ARIA labels en headers**
```tsx
// ❌ PROBLEMA (línea 314-322)
<TableHeader>
  <TableRow>
    <TableHead>Usuario</TableHead>
    <TableHead>Rol</TableHead>
    <TableHead>Estado</TableHead>
```

**Solución:**
```tsx
// ✅ CORRECCIÓN
<Table role="table" aria-label="Tabla de usuarios del sistema">
  <TableHeader>
    <TableRow role="row">
      <TableHead role="columnheader" aria-sort="none">
        <button
          onClick={() => ordenarPor('nombre')}
          className="flex items-center gap-2 hover:text-calma-600"
          aria-label="Ordenar por nombre de usuario"
        >
          Usuario
          <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
        </button>
      </TableHead>
```

---

**3.2. Select inline sin label**
```tsx
// ❌ PROBLEMA (línea 377-389)
<Select
  value={usuario.rol}
  onValueChange={(value) => cambiarRol(usuario.id, value)}
>
  <SelectTrigger className="w-32">
    <SelectValue />
  </SelectTrigger>
```

**Solución:**
```tsx
// ✅ CORRECCIÓN
<Select
  value={usuario.rol}
  onValueChange={(value) => cambiarRol(usuario.id, value)}
>
  <SelectTrigger
    className="w-32"
    aria-label={`Cambiar rol de ${usuario.nombre || usuario.email}`}
  >
    <SelectValue />
  </SelectTrigger>
```

---

**3.3. Cambio de estado sin confirmación**
```tsx
// ❌ PROBLEMA (línea 177-214)
const toggleEstado = async (usuarioId: string) => {
  // Sin confirmación modal
  const { error } = await supabase
    .from('Usuario')
    .update({ esta_activo: !usuario.esta_activo })
```

**Impacto:** Acción destructiva sin salvaguarda.

**Solución:**
```tsx
// ✅ CORRECCIÓN
const toggleEstado = async (usuarioId: string, usuarioNombre: string, activo: boolean) => {
  const accion = activo ? 'desactivar' : 'activar';
  const confirmado = await mostrarDialogoConfirmacion({
    titulo: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} usuario?`,
    mensaje: `Estás a punto de ${accion} a ${usuarioNombre}. ${
      !activo
        ? 'El usuario podrá acceder nuevamente al sistema.'
        : 'El usuario NO podrá iniciar sesión hasta que lo reactives.'
    }`,
    textoConfirmar: accion.charAt(0).toUpperCase() + accion.slice(1),
    tipoConfirmar: activo ? 'destructive' : 'default'
  });

  if (!confirmado) return;

  // Proceder con la actualización...
};
```

---

**3.4. Búsqueda sin debounce**
```tsx
// ❌ PROBLEMA (línea 252-254)
onChange={(e) => {
  setBusqueda(e.target.value);
  setPaginaActual(1);
}}
```

**Impacto:** Cada tecla dispara una query a la BD.

**Solución:**
```tsx
// ✅ CORRECCIÓN
import { useDebouncedCallback } from 'use-debounce';

const actualizarBusqueda = useDebouncedCallback(
  (valor: string) => {
    setBusqueda(valor);
    setPaginaActual(1);
  },
  500 // 500ms de debounce
);

<Input
  placeholder="Buscar por email o nombre..."
  defaultValue={busqueda}
  onChange={(e) => actualizarBusqueda(e.target.value)}
  aria-label="Buscar usuarios por nombre o correo electrónico"
  className="pl-9"
/>
```

---

**3.5. Filtros sin indicador visual de activos**
```tsx
// ❌ PROBLEMA (línea 260-293)
// No hay badge o contador de filtros activos
```

**Solución:**
```tsx
// ✅ CORRECCIÓN
const filtrosActivos = [filtroRol, filtroEstado, busqueda].filter(Boolean).length;

<CardHeader>
  <div className="flex items-center justify-between">
    <CardTitle>Filtros</CardTitle>
    {filtrosActivos > 0 && (
      <div
        className="px-3 py-1 bg-calma-100 text-calma-700 rounded-full text-sm font-medium"
        role="status"
        aria-live="polite"
      >
        {filtrosActivos} {filtrosActivos === 1 ? 'filtro activo' : 'filtros activos'}
      </div>
    )}
  </div>
</CardHeader>
```

---

### 4. Gestión de Suscripciones (`/src/app/admin/suscripciones/page.tsx`)

#### 🔴 CRÍTICOS

**4.1. Tarjetas de estadísticas sin live region**
```tsx
// ❌ PROBLEMA (línea 214-261)
<div className="grid gap-4 md:grid-cols-4">
  <Card>
    <CardContent>
      <div className="text-2xl font-bold">{paginacion?.total || 0}</div>
```

**Solución:**
```tsx
// ✅ CORRECCIÓN
<div
  className="text-2xl font-bold"
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  <span className="sr-only">Total de suscripciones: </span>
  {paginacion?.total || 0}
</div>
```

---

**4.2. Selector de estado inline sin confirmación**
```tsx
// ❌ PROBLEMA (línea 398-412)
<Select
  value={suscripcion.estado}
  onValueChange={(value) => cambiarEstado(suscripcion.id, value)}
>
```

**Impacto:** Cambiar estado de suscripción es acción crítica (afecta pagos).

**Solución:** Agregar modal de confirmación similar al de usuarios.

---

**4.3. Formateo de precios sin contexto**
```tsx
// ❌ PROBLEMA (línea 384-387)
<span className="font-medium">
  {formatearPrecio(suscripcion.precio, suscripcion.moneda)}
</span>
```

**Solución:**
```tsx
// ✅ CORRECCIÓN
<span
  className="font-medium"
  aria-label={`Precio: ${formatearPrecio(suscripcion.precio, suscripcion.moneda)} ${suscripcion.moneda} ${suscripcion.periodo}`}
>
  {formatearPrecio(suscripcion.precio, suscripcion.moneda)}
  <span className="text-xs text-gray-500 ml-1">/{suscripcion.periodo}</span>
</span>
```

---

### 5. Gestión de Profesionales (`/src/app/admin/profesionales/page.tsx`)

#### 🔴 CRÍTICOS

**5.1. Botones de aprobar/rechazar sin confirmación**
```tsx
// ❌ PROBLEMA (línea 403-418)
<Button
  variant="default"
  size="sm"
  onClick={() => aprobarRapido(profesional.id, profesional.usuario.id)}
>
  <CheckCircle className="h-4 w-4 mr-1" />
  Aprobar
</Button>
```

**Impacto:** Aprobación rápida sin revisión puede ser peligrosa.

**Solución:**
```tsx
// ✅ CORRECCIÓN
<Button
  variant="default"
  size="sm"
  onClick={() => {
    setModalConfirmacion({
      tipo: 'aprobar',
      profesionalId: profesional.id,
      usuarioId: profesional.usuario.id,
      nombre: profesional.usuario.nombre
    });
  }}
  aria-label={`Aprobar perfil de ${profesional.usuario.nombre}`}
>
  <CheckCircle className="h-4 w-4 mr-1" aria-hidden="true" />
  Aprobar
</Button>

// Modal de confirmación
{modalConfirmacion && (
  <ModalConfirmacionAprobacion
    abierto={true}
    profesional={modalConfirmacion}
    onConfirmar={() => {
      aprobarRapido(modalConfirmacion.profesionalId, modalConfirmacion.usuarioId);
      setModalConfirmacion(null);
    }}
    onCancelar={() => setModalConfirmacion(null)}
  />
)}
```

---

**5.2. Tabla sin teclado navigation**
```tsx
// ❌ PROBLEMA: No hay manejo de teclado para navegar entre filas
```

**Solución:** Implementar roving tabindex pattern:

```tsx
const [filaActiva, setFilaActiva] = useState(0);

const manejarTecladoTabla = (e: React.KeyboardEvent, index: number) => {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      setFilaActiva(Math.min(index + 1, profesionales.length - 1));
      break;
    case 'ArrowUp':
      e.preventDefault();
      setFilaActiva(Math.max(index - 1, 0));
      break;
    case 'Enter':
    case ' ':
      e.preventDefault();
      // Abrir detalle del profesional
      router.push(`/admin/profesionales/${profesionales[index].id}`);
      break;
  }
};

<TableRow
  key={profesional.id}
  tabIndex={index === filaActiva ? 0 : -1}
  onKeyDown={(e) => manejarTecladoTabla(e, index)}
  ref={index === filaActiva ? filaActivaRef : null}
>
```

---

### 6. Detalle de Profesional (`/src/app/admin/profesionales/[id]/page.tsx`)

#### 🔴 CRÍTICOS

**6.1. Tabs sin ARIA correcto**
```tsx
// ❌ PROBLEMA (línea 461-484)
<Tabs.Root value={tabActiva} onValueChange={setTabActiva}>
  <Tabs.List className="flex gap-2 border-b border-gray-200">
    <Tabs.Trigger value="informacion"...>
```

**Nota:** Radix Tabs ya incluye ARIA, pero falta role="tablist" visual feedback.

**Mejora:**
```tsx
// ✅ MEJORA
<Tabs.Root value={tabActiva} onValueChange={setTabActiva}>
  <Tabs.List
    className="flex gap-2 border-b border-gray-200"
    aria-label="Información del profesional"
  >
    <Tabs.Trigger
      value="informacion"
      className={cn(
        "px-4 py-2 text-sm font-medium transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-calma-500 focus:ring-offset-2",
        "data-[state=active]:text-calma-600 data-[state=active]:border-b-2 data-[state=active]:border-calma-600",
        "data-[state=inactive]:text-gray-600 hover:text-gray-900"
      )}
    >
      <User className="h-4 w-4 inline mr-2" aria-hidden="true" />
      Información
      <span className="sr-only"> del profesional</span>
    </Tabs.Trigger>
```

---

**6.2. Textarea de notas sin auto-save**
```tsx
// ❌ PROBLEMA (línea 612-627)
<textarea
  className="w-full px-4 py-2..."
  rows={4}
  placeholder="Escribe notas internas..."
  value={notasAdmin}
  onChange={(e) => setNotasAdmin(e.target.value)}
/>
<Button onClick={guardarNotas} disabled={guardandoNotas}>
```

**Impacto:** Admin puede perder notas si no guarda manualmente.

**Solución:**
```tsx
// ✅ CORRECCIÓN
const guardarNotasAutomatico = useDebouncedCallback(
  async (notas: string) => {
    try {
      await supabase
        .from('PerfilProfesional')
        .update({ notas_admin: notas })
        .eq('id', profesionalId);

      toast.success('Notas guardadas automáticamente', { duration: 1500 });
    } catch (error) {
      console.error('Error al auto-guardar:', error);
    }
  },
  3000
);

<div className="relative">
  <label htmlFor="notas-admin" className="block text-sm font-medium text-gray-700 mb-2">
    Notas del Administrador
    <span className="ml-2 text-xs text-gray-500">(Se guardan automáticamente)</span>
  </label>
  <textarea
    id="notas-admin"
    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-calma-500"
    rows={4}
    placeholder="Escribe notas internas sobre este profesional..."
    value={notasAdmin}
    onChange={(e) => {
      setNotasAdmin(e.target.value);
      guardarNotasAutomatico(e.target.value);
    }}
    aria-describedby="notas-hint"
  />
  <p id="notas-hint" className="sr-only">
    Las notas se guardan automáticamente después de dejar de escribir
  </p>
</div>
```

---

**6.3. Visor de documentos sin navegación por teclado**
```tsx
// ❌ PROBLEMA: PDF iframe puede atrapar el foco
```

**Solución:**
```tsx
// ✅ CORRECCIÓN
<div className="relative">
  <button
    className="absolute top-2 right-2 z-10 px-3 py-2 bg-white shadow-lg rounded-lg"
    onClick={cerrarVisor}
    aria-label="Cerrar visor de documento"
  >
    <X className="h-4 w-4" aria-hidden="true" />
  </button>
  <div
    className="relative bg-gray-50"
    style={{ height: '500px' }}
    role="document"
    aria-label={documento.nombre}
  >
    <iframe
      src={documento.url_archivo}
      className="w-full h-full"
      title={documento.nombre}
      tabIndex={-1}
      onError={() => setVistaPrevia(false)}
    />
  </div>
  <div className="mt-4 text-center text-sm text-gray-600">
    <p>
      <kbd className="px-2 py-1 bg-gray-100 rounded border">Esc</kbd> para cerrar visor
    </p>
  </div>
</div>
```

---

### 7. Historiales (`/src/app/admin/historiales/page.tsx`)

#### 🟡 ADVERTENCIAS

**7.1. Lista de usuarios muy larga sin virtualización**
```tsx
// ⚠️ PROBLEMA (línea 272-304)
<div className="space-y-2 max-h-[600px] overflow-y-auto">
  {usuariosFiltrados.map((usuario) => (
```

**Impacto:** Con 1000+ usuarios, puede causar lag.

**Solución:** Implementar scroll infinito o paginación:

```tsx
// ✅ CORRECCIÓN
import { useInView } from 'react-intersection-observer';

const USUARIOS_POR_PAGINA = 20;
const [paginaUsuarios, setPaginaUsuarios] = useState(1);
const { ref, inView } = useInView();

useEffect(() => {
  if (inView && usuariosMostrados < usuariosFiltrados.length) {
    setPaginaUsuarios(prev => prev + 1);
  }
}, [inView]);

const usuariosMostrados = usuariosFiltrados.slice(0, paginaUsuarios * USUARIOS_POR_PAGINA);

<div className="space-y-2 max-h-[600px] overflow-y-auto" role="list">
  {usuariosMostrados.map((usuario) => (
    <motion.button key={usuario.id} role="listitem"...>
  ))}
  <div ref={ref} className="h-4" /> {/* Sentinel para infinite scroll */}
</div>
```

---

**7.2. Tabs sin contador de items**
```tsx
// ⚠️ PROBLEMA (línea 378-390)
<button onClick={() => setVistaActiva(vista)}>
  {vista.charAt(0).toUpperCase() + vista.slice(1)}
</button>
```

**Solución:**
```tsx
// ✅ CORRECCIÓN
const contadores = {
  evaluaciones: historial?.total_evaluaciones || 0,
  conversaciones: historial?.total_conversaciones || 0,
  recomendaciones: historial?.total_recomendaciones || 0
};

<button
  onClick={() => setVistaActiva(vista)}
  className={...}
  aria-label={`${vista}: ${contadores[vista]} items`}
>
  {vista.charAt(0).toUpperCase() + vista.slice(1)}
  <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full text-xs">
    {contadores[vista]}
  </span>
</button>
```

---

### 8. Componente AlertasCriticas

#### ✅ EXCELENTE IMPLEMENTACIÓN

Este componente es un **ejemplo perfecto** de accesibilidad:

1. ✅ ARIA labels completos
2. ✅ Live regions para anuncios
3. ✅ Navegación por teclado
4. ✅ Indicadores visuales múltiples (no solo color)
5. ✅ Focus management correcto
6. ✅ Animaciones respetan prefers-reduced-motion (implícito en Framer Motion)

**Única mejora sugerida:**

```tsx
// 💡 MEJORA OPCIONAL: Agregar atajos de teclado
const manejarAtajos = (e: KeyboardEvent) => {
  if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    // Aprobar todas las alertas revisadas
  }
};

useEffect(() => {
  window.addEventListener('keydown', manejarAtajos);
  return () => window.removeEventListener('keydown', manejarAtajos);
}, []);
```

---

### 9. Componente ModalAprobar

#### 🟡 ADVERTENCIAS

**9.1. Modal sin escape key handler explícito**

Radix Dialog maneja ESC por defecto, pero falta documentación visual.

**Mejora:**
```tsx
// ✅ MEJORA
<Dialog.Content ...>
  <div className="absolute top-2 right-2 text-xs text-gray-500">
    <kbd className="px-2 py-1 bg-gray-100 rounded border">Esc</kbd> para cerrar
  </div>
```

---

### 10. Componente VisorDocumento

#### 🟡 ADVERTENCIAS

**10.1. Imagen sin manejo de error accesible**
```tsx
// ⚠️ PROBLEMA (línea 108-116)
<img
  src={documento.url_archivo}
  alt={documento.nombre}
  onError={(e) => {
    e.currentTarget.style.display = 'none';
    setVistaPrevia(false);
  }}
/>
```

**Solución:**
```tsx
// ✅ CORRECCIÓN
const [errorCarga, setErrorCarga] = useState(false);

{errorCarga ? (
  <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" aria-hidden="true" />
    <p className="text-red-700 font-medium">Error al cargar la imagen</p>
    <p className="text-sm text-red-600 mt-1">
      El archivo podría estar dañado o no disponible
    </p>
    <Button
      variant="outline"
      size="sm"
      className="mt-4"
      onClick={() => window.open(documento.url_archivo, '_blank')}
    >
      Intentar abrir en nueva pestaña
    </Button>
  </div>
) : (
  <img
    src={documento.url_archivo}
    alt={documento.nombre}
    onError={() => setErrorCarga(true)}
  />
)}
```

---

## PATRONES UX RECOMENDADOS

### 1. Tabla Profesional con Ordenamiento

```tsx
import { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface ColumnaSorteable<T> {
  id: keyof T;
  label: string;
  sortable?: boolean;
  render: (item: T) => React.ReactNode;
}

type OrdenDireccion = 'asc' | 'desc' | null;

function TablaSorteable<T extends Record<string, any>>({
  datos,
  columnas,
  idClave
}: {
  datos: T[];
  columnas: ColumnaSorteable<T>[];
  idClave: keyof T;
}) {
  const [ordenPor, setOrdenPor] = useState<keyof T | null>(null);
  const [ordenDireccion, setOrdenDireccion] = useState<OrdenDireccion>(null);

  const toggleOrden = (columnaId: keyof T) => {
    if (ordenPor === columnaId) {
      // Ciclar: asc -> desc -> null
      setOrdenDireccion(prev =>
        prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'
      );
      if (ordenDireccion === 'desc') {
        setOrdenPor(null);
      }
    } else {
      setOrdenPor(columnaId);
      setOrdenDireccion('asc');
    }
  };

  const datosSorteados = React.useMemo(() => {
    if (!ordenPor || !ordenDireccion) return datos;

    return [...datos].sort((a, b) => {
      const valorA = a[ordenPor];
      const valorB = b[ordenPor];

      if (typeof valorA === 'string' && typeof valorB === 'string') {
        return ordenDireccion === 'asc'
          ? valorA.localeCompare(valorB, 'es')
          : valorB.localeCompare(valorA, 'es');
      }

      if (typeof valorA === 'number' && typeof valorB === 'number') {
        return ordenDireccion === 'asc' ? valorA - valorB : valorB - valorA;
      }

      return 0;
    });
  }, [datos, ordenPor, ordenDireccion]);

  const obtenerIconoOrden = (columnaId: keyof T) => {
    if (ordenPor !== columnaId) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" aria-hidden="true" />;
    }
    return ordenDireccion === 'asc' ? (
      <ArrowUp className="h-4 w-4 text-calma-600" aria-hidden="true" />
    ) : (
      <ArrowDown className="h-4 w-4 text-calma-600" aria-hidden="true" />
    );
  };

  const obtenerAriaSort = (columnaId: keyof T): 'ascending' | 'descending' | 'none' => {
    if (ordenPor !== columnaId) return 'none';
    return ordenDireccion === 'asc' ? 'ascending' : 'descending';
  };

  return (
    <Table role="table" aria-label="Tabla de datos con ordenamiento">
      <TableHeader>
        <TableRow role="row">
          {columnas.map((columna) => (
            <TableHead
              key={String(columna.id)}
              role="columnheader"
              aria-sort={columna.sortable ? obtenerAriaSort(columna.id) : undefined}
            >
              {columna.sortable ? (
                <button
                  onClick={() => toggleOrden(columna.id)}
                  className="flex items-center gap-2 hover:text-calma-600 transition-colors focus:outline-none focus:underline"
                  aria-label={`Ordenar por ${columna.label}${
                    ordenPor === columna.id
                      ? `, actualmente ordenado ${
                          ordenDireccion === 'asc' ? 'ascendentemente' : 'descendentemente'
                        }`
                      : ''
                  }`}
                >
                  {columna.label}
                  {obtenerIconoOrden(columna.id)}
                </button>
              ) : (
                columna.label
              )}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {datosSorteados.map((dato) => (
          <TableRow key={String(dato[idClave])} role="row">
            {columnas.map((columna) => (
              <TableCell key={String(columna.id)} role="cell">
                {columna.render(dato)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// USO:
const columnas: ColumnaSorteable<Usuario>[] = [
  {
    id: 'nombre',
    label: 'Nombre',
    sortable: true,
    render: (usuario) => usuario.nombre
  },
  {
    id: 'email',
    label: 'Email',
    sortable: true,
    render: (usuario) => usuario.email
  },
  {
    id: 'creado_en',
    label: 'Fecha Registro',
    sortable: true,
    render: (usuario) => formatearFecha(usuario.creado_en)
  }
];

<TablaSorteable datos={usuarios} columnas={columnas} idClave="id" />
```

---

### 2. Modal de Confirmación de Acciones Destructivas

```tsx
import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface ModalConfirmacionProps {
  abierto: boolean;
  onCerrar: () => void;
  onConfirmar: () => void;
  tipo: 'destructive' | 'warning' | 'info';
  titulo: string;
  mensaje: string;
  datosDestacados?: { label: string; valor: string }[];
  textoConfirmar?: string;
  textoCancelar?: string;
}

export function ModalConfirmacion({
  abierto,
  onCerrar,
  onConfirmar,
  tipo,
  titulo,
  mensaje,
  datosDestacados,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar'
}: ModalConfirmacionProps) {
  const [procesando, setProcesando] = useState(false);

  const configuracion = {
    destructive: {
      icono: AlertTriangle,
      colorIcono: 'text-red-600',
      bgIcono: 'bg-red-100',
      colorBoton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      colorBorde: 'border-red-200'
    },
    warning: {
      icono: AlertTriangle,
      colorIcono: 'text-yellow-600',
      bgIcono: 'bg-yellow-100',
      colorBoton: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
      colorBorde: 'border-yellow-200'
    },
    info: {
      icono: CheckCircle,
      colorIcono: 'text-blue-600',
      bgIcono: 'bg-blue-100',
      colorBoton: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      colorBorde: 'border-blue-200'
    }
  };

  const config = configuracion[tipo];
  const Icono = config.icono;

  const handleConfirmar = async () => {
    setProcesando(true);
    try {
      await onConfirmar();
      onCerrar();
    } finally {
      setProcesando(false);
    }
  };

  return (
    <Dialog.Root open={abierto} onOpenChange={onCerrar}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-full max-w-md z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          aria-describedby="modal-description"
        >
          {/* Icono y título */}
          <div className="flex items-start gap-4 mb-4">
            <div className={`p-3 rounded-full ${config.bgIcono} flex-shrink-0`}>
              <Icono className={`h-6 w-6 ${config.colorIcono}`} aria-hidden="true" />
            </div>
            <div className="flex-1">
              <Dialog.Title className="text-xl font-semibold text-gray-900 mb-2">
                {titulo}
              </Dialog.Title>
              <Dialog.Description id="modal-description" className="text-gray-600">
                {mensaje}
              </Dialog.Description>
            </div>
          </div>

          {/* Datos destacados */}
          {datosDestacados && datosDestacados.length > 0 && (
            <div className={`border ${config.colorBorde} rounded-lg p-4 mb-4 bg-gray-50`}>
              <div className="space-y-2">
                {datosDestacados.map((dato, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{dato.label}:</span>
                    <span className="font-medium text-gray-900">{dato.valor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Advertencia adicional para acciones destructivas */}
          {tipo === 'destructive' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800">
                <strong>Advertencia:</strong> Esta acción no se puede deshacer.
              </p>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3">
            <Dialog.Close asChild>
              <Button
                variant="outline"
                className="flex-1"
                disabled={procesando}
                autoFocus={tipo === 'destructive'} // Focus en cancelar si es destructivo
              >
                {textoCancelar}
              </Button>
            </Dialog.Close>
            <Button
              className={`flex-1 text-white ${config.colorBoton}`}
              onClick={handleConfirmar}
              disabled={procesando}
              autoFocus={tipo !== 'destructive'} // Focus en confirmar si NO es destructivo
            >
              {procesando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Procesando...
                </>
              ) : (
                textoConfirmar
              )}
            </Button>
          </div>

          {/* Hint de teclado */}
          <div className="mt-4 text-center text-xs text-gray-500">
            <kbd className="px-2 py-1 bg-gray-100 rounded border">Esc</kbd> para cancelar
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// USO:
const [modalAbierto, setModalAbierto] = useState(false);

<ModalConfirmacion
  abierto={modalAbierto}
  onCerrar={() => setModalAbierto(false)}
  onConfirmar={async () => {
    await desactivarUsuario(usuarioId);
    toast.success('Usuario desactivado');
  }}
  tipo="destructive"
  titulo="¿Desactivar usuario?"
  mensaje="El usuario no podrá iniciar sesión hasta que lo reactives."
  datosDestacados={[
    { label: 'Usuario', valor: usuario.nombre },
    { label: 'Email', valor: usuario.email },
    { label: 'Último acceso', valor: formatearFecha(usuario.ultimo_acceso) }
  ]}
  textoConfirmar="Desactivar"
/>
```

---

### 3. Búsqueda Avanzada con Filtros

```tsx
import { Search, X, Filter, ChevronDown } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import * as Collapsible from '@radix-ui/react-collapsible';

interface FiltrosBusquedaProps {
  busqueda: string;
  onBusquedaChange: (valor: string) => void;
  filtros: {
    id: string;
    label: string;
    tipo: 'select' | 'multiselect' | 'daterange';
    opciones?: { value: string; label: string }[];
    valor: any;
    onChange: (valor: any) => void;
  }[];
  resultadosCount: number;
  onLimpiar: () => void;
}

export function FiltrosBusqueda({
  busqueda,
  onBusquedaChange,
  filtros,
  resultadosCount,
  onLimpiar
}: FiltrosBusquedaProps) {
  const [busquedaLocal, setBusquedaLocal] = useState(busqueda);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  const busquedaDebounced = useDebouncedCallback(
    (valor: string) => {
      onBusquedaChange(valor);
    },
    500
  );

  const handleBusquedaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setBusquedaLocal(valor);
    busquedaDebounced(valor);
  };

  const filtrosActivos = filtros.filter(f => {
    if (Array.isArray(f.valor)) return f.valor.length > 0;
    return f.valor !== '' && f.valor !== null && f.valor !== undefined;
  }).length;

  const tieneAlgunFiltro = busqueda || filtrosActivos > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-calma-600" aria-hidden="true" />
            Búsqueda y Filtros
          </CardTitle>
          {tieneAlgunFiltro && (
            <div className="flex items-center gap-3">
              <div
                className="px-3 py-1 bg-calma-100 text-calma-700 rounded-full text-sm font-medium"
                role="status"
                aria-live="polite"
              >
                {resultadosCount} {resultadosCount === 1 ? 'resultado' : 'resultados'}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onLimpiar}
                className="text-gray-600 hover:text-gray-900"
                aria-label="Limpiar todos los filtros"
              >
                <X className="h-4 w-4 mr-1" aria-hidden="true" />
                Limpiar
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Búsqueda principal */}
        <div className="relative">
          <label htmlFor="busqueda-principal" className="sr-only">
            Buscar en la tabla
          </label>
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <Input
            id="busqueda-principal"
            type="text"
            placeholder="Buscar..."
            value={busquedaLocal}
            onChange={handleBusquedaChange}
            className="pl-10 pr-10"
            aria-describedby={busquedaLocal ? 'busqueda-resultados' : undefined}
          />
          {busquedaLocal && (
            <button
              onClick={() => {
                setBusquedaLocal('');
                onBusquedaChange('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Anuncio de resultados para lectores de pantalla */}
        {busquedaLocal && (
          <div
            id="busqueda-resultados"
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            {resultadosCount} {resultadosCount === 1 ? 'resultado encontrado' : 'resultados encontrados'}
          </div>
        )}

        {/* Filtros colapsables */}
        <Collapsible.Root open={filtrosAbiertos} onOpenChange={setFiltrosAbiertos}>
          <Collapsible.Trigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between"
              aria-expanded={filtrosAbiertos}
            >
              <span className="flex items-center gap-2">
                Filtros avanzados
                {filtrosActivos > 0 && (
                  <span className="px-2 py-0.5 bg-calma-100 text-calma-700 rounded-full text-xs font-medium">
                    {filtrosActivos}
                  </span>
                )}
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  filtrosAbiertos ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </Button>
          </Collapsible.Trigger>
          <Collapsible.Content className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtros.map((filtro) => (
                <div key={filtro.id}>
                  <label
                    htmlFor={`filtro-${filtro.id}`}
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {filtro.label}
                  </label>
                  {filtro.tipo === 'select' && (
                    <Select value={filtro.valor} onValueChange={filtro.onChange}>
                      <SelectTrigger id={`filtro-${filtro.id}`}>
                        <SelectValue placeholder={`Seleccionar ${filtro.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos</SelectItem>
                        {filtro.opciones?.map((opcion) => (
                          <SelectItem key={opcion.value} value={opcion.value}>
                            {opcion.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {/* Implementar otros tipos de filtros según necesidad */}
                </div>
              ))}
            </div>
          </Collapsible.Content>
        </Collapsible.Root>
      </CardContent>
    </Card>
  );
}
```

---

### 4. Paginación Accesible

```tsx
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginacionAccesibleProps {
  paginaActual: number;
  totalPaginas: number;
  totalItems: number;
  itemsPorPagina: number;
  onCambioPagina: (pagina: number) => void;
  labelSingular?: string;
  labelPlural?: string;
}

export function PaginacionAccesible({
  paginaActual,
  totalPaginas,
  totalItems,
  itemsPorPagina,
  onCambioPagina,
  labelSingular = 'item',
  labelPlural = 'items'
}: PaginacionAccesibleProps) {
  const primerItem = (paginaActual - 1) * itemsPorPagina + 1;
  const ultimoItem = Math.min(paginaActual * itemsPorPagina, totalItems);

  const generarBotonesNumeros = () => {
    const botones: number[] = [];
    const rangoVisible = 2; // Cuántos números mostrar a cada lado de la página actual

    // Siempre mostrar primera página
    botones.push(1);

    // Calcular rango de páginas a mostrar
    const rangoInicio = Math.max(2, paginaActual - rangoVisible);
    const rangoFin = Math.min(totalPaginas - 1, paginaActual + rangoVisible);

    // Agregar "..." si hay gap después de la primera página
    if (rangoInicio > 2) {
      botones.push(-1); // -1 representa "..."
    }

    // Agregar páginas del rango
    for (let i = rangoInicio; i <= rangoFin; i++) {
      botones.push(i);
    }

    // Agregar "..." si hay gap antes de la última página
    if (rangoFin < totalPaginas - 1) {
      botones.push(-2); // -2 representa "..."
    }

    // Siempre mostrar última página (si hay más de 1)
    if (totalPaginas > 1) {
      botones.push(totalPaginas);
    }

    return botones;
  };

  const botonesNumeros = generarBotonesNumeros();

  return (
    <nav
      role="navigation"
      aria-label="Paginación"
      className="flex flex-col sm:flex-row items-center justify-between gap-4"
    >
      {/* Información de items */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="text-sm text-gray-600"
      >
        Mostrando <span className="font-medium text-gray-900">{primerItem}</span> a{' '}
        <span className="font-medium text-gray-900">{ultimoItem}</span> de{' '}
        <span className="font-medium text-gray-900">{totalItems}</span>{' '}
        {totalItems === 1 ? labelSingular : labelPlural}
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center gap-2">
        {/* Ir a primera página */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onCambioPagina(1)}
          disabled={paginaActual === 1}
          aria-label="Ir a la primera página"
        >
          <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
        </Button>

        {/* Página anterior */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onCambioPagina(paginaActual - 1)}
          disabled={paginaActual === 1}
          aria-label="Ir a la página anterior"
        >
          <ChevronLeft className="h-4 w-4 mr-1" aria-hidden="true" />
          Anterior
        </Button>

        {/* Números de página */}
        <div className="hidden sm:flex items-center gap-1">
          {botonesNumeros.map((numero, index) => {
            if (numero < 0) {
              // Mostrar "..."
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-gray-400" aria-hidden="true">
                  ...
                </span>
              );
            }

            const esActual = numero === paginaActual;

            return (
              <Button
                key={numero}
                variant={esActual ? 'default' : 'outline'}
                size="icon"
                onClick={() => onCambioPagina(numero)}
                aria-label={`Ir a la página ${numero}`}
                aria-current={esActual ? 'page' : undefined}
                className={cn(
                  esActual && 'bg-calma-500 text-white hover:bg-calma-600'
                )}
              >
                {numero}
              </Button>
            );
          })}
        </div>

        {/* Selector de página en móvil */}
        <div className="sm:hidden">
          <Select
            value={String(paginaActual)}
            onValueChange={(valor) => onCambioPagina(Number(valor))}
          >
            <SelectTrigger className="w-24" aria-label="Seleccionar página">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((numero) => (
                <SelectItem key={numero} value={String(numero)}>
                  Pág. {numero}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Página siguiente */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onCambioPagina(paginaActual + 1)}
          disabled={paginaActual === totalPaginas}
          aria-label="Ir a la página siguiente"
        >
          Siguiente
          <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
        </Button>

        {/* Ir a última página */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onCambioPagina(totalPaginas)}
          disabled={paginaActual === totalPaginas}
          aria-label="Ir a la última página"
        >
          <ChevronsRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
```

---

### 5. Loading States Terapéuticos

```tsx
import { motion } from 'framer-motion';

// Spinner de puntos suaves
export function LoadingPuntos({ mensaje = 'Cargando...' }: { mensaje?: string }) {
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <div className="flex items-center gap-3">
        {[0, 150, 300].map((delay, index) => (
          <motion.div
            key={index}
            className="w-3 h-3 rounded-full bg-calma-500"
            animate={
              prefersReducedMotion
                ? {}
                : {
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5]
                  }
            }
            transition={
              prefersReducedMotion
                ? {}
                : {
                    duration: 1.5,
                    repeat: Infinity,
                    delay: delay / 1000
                  }
            }
            aria-hidden="true"
          />
        ))}
      </div>
      <p className="text-sm text-gray-600">{mensaje}</p>
      <span className="sr-only" role="status" aria-live="polite">
        {mensaje}
      </span>
    </div>
  );
}

// Skeleton calmado
export function SkeletonCalmado({ lineas = 3 }: { lineas?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Cargando contenido">
      {Array.from({ length: lineas }).map((_, index) => (
        <div
          key={index}
          className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-md animate-pulse"
          style={{ width: `${100 - index * 10}%` }}
          aria-hidden="true"
        />
      ))}
      <span className="sr-only">Cargando...</span>
    </div>
  );
}

// Loading overlay para acciones
export function LoadingOverlay({ mensaje }: { mensaje: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm">
        <LoadingPuntos mensaje={mensaje} />
      </div>
    </motion.div>
  );
}
```

---

## LISTA DE VERIFICACIÓN WCAG 2.1 AA

### Perceivable (Perceptible)

#### 1.1 Text Alternatives

- [ ] **1.1.1 Non-text Content (A)**
  - ✅ AlertasCriticas: Iconos con aria-hidden
  - ❌ Dashboard: Gráficos sin texto alternativo
  - ❌ Usuarios: Badges sin contexto textual
  - **Acción:** Agregar descripciones textuales a todos los gráficos

#### 1.2 Time-based Media

- ✅ **N/A** - No hay contenido multimedia

#### 1.3 Adaptable

- [ ] **1.3.1 Info and Relationships (A)**
  - ❌ Tablas sin roles ARIA completos
  - ❌ Formularios con labels faltantes
  - ❌ Listas sin role="list"
  - **Acción:** Auditar toda la estructura semántica

- [ ] **1.3.2 Meaningful Sequence (A)**
  - ✅ Orden de lectura correcto en general
  - ❌ Modal puede romper secuencia sin focus trap
  - **Acción:** Implementar focus management

- [ ] **1.3.3 Sensory Characteristics (A)**
  - ✅ No se usa solo color para información
  - ✅ Se complementa con iconos y texto
  - **OK**

- [ ] **1.3.4 Orientation (AA)**
  - ✅ Funciona en portrait y landscape
  - **OK**

- [ ] **1.3.5 Identify Input Purpose (AA)**
  - ❌ Inputs sin autocomplete attributes
  - **Acción:** Agregar autocomplete="email", autocomplete="name", etc.

#### 1.4 Distinguishable

- [ ] **1.4.1 Use of Color (A)**
  - ✅ Estados tienen iconos + color
  - **OK**

- [ ] **1.4.2 Audio Control (A)**
  - ✅ **N/A** - Sin audio automático

- [ ] **1.4.3 Contrast (Minimum) (AA)**
  - ✅ Colores terapéuticos cumplen 4.5:1
  - ⚠️ Verificar badges y estados
  - **Acción:** Auditar todos los badges con herramienta de contraste

- [ ] **1.4.4 Resize Text (AA)**
  - ✅ Usa rem/em, no px fijos
  - **OK**

- [ ] **1.4.5 Images of Text (AA)**
  - ✅ No hay imágenes de texto
  - **OK**

- [ ] **1.4.10 Reflow (AA)**
  - ✅ Responsive hasta 320px
  - **OK**

- [ ] **1.4.11 Non-text Contrast (AA)**
  - ❌ Bordes de inputs pueden tener contraste bajo
  - **Acción:** Asegurar 3:1 en bordes de formularios

- [ ] **1.4.12 Text Spacing (AA)**
  - ✅ No hay restricciones de espaciado
  - **OK**

- [ ] **1.4.13 Content on Hover or Focus (AA)**
  - ❌ Tooltips pueden no ser dismissable
  - **Acción:** Implementar tooltips accesibles

---

### Operable (Operable)

#### 2.1 Keyboard Accessible

- [ ] **2.1.1 Keyboard (A)**
  - ❌ Tablas no navegables por teclado
  - ❌ Algunos botones sin focus visible
  - **Acción:** Implementar roving tabindex en tablas

- [ ] **2.1.2 No Keyboard Trap (A)**
  - ❌ Modales sin focus trap
  - ❌ iframes de documentos pueden atrapar foco
  - **Acción:** Implementar focus trap en todos los modales

- [ ] **2.1.4 Character Key Shortcuts (A)**
  - ✅ No hay atajos de una sola tecla
  - **OK**

#### 2.2 Enough Time

- [ ] **2.2.1 Timing Adjustable (A)**
  - ✅ No hay límites de tiempo
  - **OK**

- [ ] **2.2.2 Pause, Stop, Hide (A)**
  - ⚠️ Animaciones de Framer Motion
  - **Acción:** Verificar que respetan prefers-reduced-motion

#### 2.3 Seizures and Physical Reactions

- [ ] **2.3.1 Three Flashes or Below (A)**
  - ✅ No hay flashes
  - **OK**

#### 2.4 Navigable

- [ ] **2.4.1 Bypass Blocks (A)**
  - ❌ No hay skip links
  - **Acción:** Agregar "Saltar al contenido"

- [ ] **2.4.2 Page Titled (A)**
  - ⚠️ Verificar títulos de página
  - **Acción:** Asegurar <title> únicos y descriptivos

- [ ] **2.4.3 Focus Order (A)**
  - ✅ Orden de foco lógico
  - **OK**

- [ ] **2.4.4 Link Purpose (A)**
  - ❌ Algunos links solo dicen "Ver"
  - **Acción:** Agregar contexto a aria-label

- [ ] **2.4.5 Multiple Ways (AA)**
  - ✅ Menú + breadcrumbs
  - **OK**

- [ ] **2.4.6 Headings and Labels (AA)**
  - ❌ Faltan headings en algunas secciones
  - **Acción:** Agregar estructura de headings correcta

- [ ] **2.4.7 Focus Visible (AA)**
  - ⚠️ Focus puede ser poco visible en algunos elementos
  - **Acción:** Mejorar estilos de focus con ring-2 ring-calma-500

#### 2.5 Input Modalities

- [ ] **2.5.1 Pointer Gestures (A)**
  - ✅ No requiere gestos complejos
  - **OK**

- [ ] **2.5.2 Pointer Cancellation (A)**
  - ✅ Click se dispara en mouseup
  - **OK**

- [ ] **2.5.3 Label in Name (A)**
  - ✅ Labels visibles coinciden con accesibles
  - **OK**

- [ ] **2.5.4 Motion Actuation (A)**
  - ✅ No requiere movimiento del dispositivo
  - **OK**

---

### Understandable (Comprensible)

#### 3.1 Readable

- [ ] **3.1.1 Language of Page (A)**
  - ⚠️ Verificar <html lang="es">
  - **Acción:** Asegurar lang en todas las páginas

- [ ] **3.1.2 Language of Parts (AA)**
  - ✅ Todo en español
  - **OK**

#### 3.2 Predictable

- [ ] **3.2.1 On Focus (A)**
  - ✅ Focus no cambia contexto
  - **OK**

- [ ] **3.2.2 On Input (A)**
  - ❌ Selectores inline cambian estado sin confirmación
  - **Acción:** Agregar modales de confirmación

- [ ] **3.2.3 Consistent Navigation (AA)**
  - ✅ Sidebar consistente en todas las páginas
  - **OK**

- [ ] **3.2.4 Consistent Identification (AA)**
  - ✅ Iconos y botones consistentes
  - **OK**

#### 3.3 Input Assistance

- [ ] **3.3.1 Error Identification (A)**
  - ⚠️ Errores de formulario no siempre claros
  - **Acción:** Mejorar mensajes de error

- [ ] **3.3.2 Labels or Instructions (A)**
  - ❌ Algunos inputs sin labels
  - **Acción:** Agregar labels a todos los inputs

- [ ] **3.3.3 Error Suggestion (AA)**
  - ❌ No hay sugerencias de corrección
  - **Acción:** Agregar hints de corrección

- [ ] **3.3.4 Error Prevention (Legal, Financial, Data) (AA)**
  - ❌ Acciones destructivas sin confirmación
  - **Acción:** Implementar modales de confirmación

---

### Robust (Robusto)

#### 4.1 Compatible

- [ ] **4.1.1 Parsing (A)**
  - ✅ HTML válido (React genera válido)
  - **OK**

- [ ] **4.1.2 Name, Role, Value (A)**
  - ❌ Algunos componentes sin roles ARIA
  - **Acción:** Auditar todos los componentes custom

- [ ] **4.1.3 Status Messages (AA)**
  - ❌ Toasts sin live regions
  - **Acción:** Asegurar role="status" en notificaciones

---

## GUÍA DE NAVEGACIÓN POR TECLADO

### Atajos Globales Recomendados

```tsx
// hooks/useAtajosTeclado.ts
import { useEffect } from 'react';

export function useAtajosTeclado() {
  useEffect(() => {
    const manejarAtajo = (e: KeyboardEvent) => {
      const esModificador = e.ctrlKey || e.metaKey;

      // Alt + N: Ir a navegación
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        document.querySelector<HTMLElement>('nav a')?.focus();
      }

      // Alt + S: Ir a búsqueda
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('[type="search"], [role="search"] input')?.focus();
      }

      // Alt + C: Ir a contenido principal
      if (e.altKey && e.key === 'c') {
        e.preventDefault();
        document.querySelector<HTMLElement>('main')?.focus();
      }

      // Ctrl/Cmd + K: Búsqueda rápida (estándar en admin panels)
      if (esModificador && e.key === 'k') {
        e.preventDefault();
        // Abrir modal de búsqueda global
      }

      // ?: Mostrar ayuda de atajos
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        // No activar si estamos en un input
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

        e.preventDefault();
        // Mostrar modal de atajos
      }
    };

    window.addEventListener('keydown', manejarAtajo);
    return () => window.removeEventListener('keydown', manejarAtajo);
  }, []);
}
```

### Navegación en Tablas

**Patrón recomendado:**

- `Tab`: Entrar/salir de la tabla
- `↑/↓`: Navegar entre filas
- `←/→`: Navegar entre celdas (opcional)
- `Enter` o `Espacio`: Activar acción de la fila
- `Home`: Ir a primera fila
- `End`: Ir a última fila
- `Page Up`: Subir 10 filas
- `Page Down`: Bajar 10 filas

```tsx
// Implementación en componente de tabla
const [filaActiva, setFilaActiva] = useState(0);
const [celdaActiva, setCeldaActiva] = useState(0);

const manejarTecladoTabla = (e: React.KeyboardEvent) => {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      setFilaActiva(prev => Math.min(prev + 1, datos.length - 1));
      break;
    case 'ArrowUp':
      e.preventDefault();
      setFilaActiva(prev => Math.max(prev - 1, 0));
      break;
    case 'Home':
      e.preventDefault();
      setFilaActiva(0);
      break;
    case 'End':
      e.preventDefault();
      setFilaActiva(datos.length - 1);
      break;
    case 'PageDown':
      e.preventDefault();
      setFilaActiva(prev => Math.min(prev + 10, datos.length - 1));
      break;
    case 'PageUp':
      e.preventDefault();
      setFilaActiva(prev => Math.max(prev - 10, 0));
      break;
    case 'Enter':
    case ' ':
      e.preventDefault();
      // Ejecutar acción principal de la fila
      onAccionPrincipal(datos[filaActiva]);
      break;
  }
};

// En el render
<TableRow
  tabIndex={index === filaActiva ? 0 : -1}
  onKeyDown={manejarTecladoTabla}
  ref={index === filaActiva ? filaActivaRef : null}
  data-fila-activa={index === filaActiva}
  className={cn(
    index === filaActiva && "ring-2 ring-calma-500 ring-inset"
  )}
>
```

### Navegación en Modales

**Comportamiento esperado:**

1. Al abrir: Focus en primer elemento focusable (o botón de cancelar si es destructivo)
2. `Tab`: Ciclar entre elementos del modal (focus trap)
3. `Shift + Tab`: Ciclar hacia atrás
4. `Esc`: Cerrar modal
5. Al cerrar: Devolver focus al elemento que abrió el modal

Radix Dialog hace esto automáticamente, pero verificar:

```tsx
<Dialog.Content
  onOpenAutoFocus={(e) => {
    // Si es acción destructiva, enfocar "Cancelar"
    if (tipo === 'destructive') {
      e.preventDefault();
      botonCancelarRef.current?.focus();
    }
  }}
  onCloseAutoFocus={(e) => {
    // Restaurar focus al botón que abrió
    // Radix hace esto por defecto
  }}
>
```

### Skip Links

Agregar al inicio del layout:

```tsx
// components/SkipLinks.tsx
export function SkipLinks() {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className="fixed top-4 left-4 z-[9999] px-4 py-2 bg-calma-600 text-white rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-calma-500 focus:ring-offset-2"
      >
        Saltar al contenido principal
      </a>
      <a
        href="#sidebar-nav"
        className="fixed top-4 left-4 z-[9999] px-4 py-2 bg-calma-600 text-white rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-calma-500 focus:ring-offset-2"
      >
        Ir a navegación
      </a>
      <a
        href="#busqueda"
        className="fixed top-4 left-4 z-[9999] px-4 py-2 bg-calma-600 text-white rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-calma-500 focus:ring-offset-2"
      >
        Ir a búsqueda
      </a>
    </div>
  );
}

// En layout.tsx
<body>
  <SkipLinks />
  <aside id="sidebar-nav">...</aside>
  <main id="main-content">...</main>
</body>
```

---

## RECOMENDACIONES PRIORIZADAS

### URGENTE (Implementar en Sprint 1)

#### 1. Agregar modales de confirmación a acciones destructivas

**Archivos afectados:**
- `/src/app/admin/usuarios/page.tsx`
- `/src/app/admin/suscripciones/page.tsx`
- `/src/app/admin/profesionales/page.tsx`

**Esfuerzo:** 8 horas
**Impacto:** CRÍTICO - Previene errores costosos

#### 2. Implementar ARIA completo en tablas

**Archivos afectados:**
- Todos los archivos con `<Table>`

**Esfuerzo:** 4 horas
**Impacto:** ALTO - Mejora accesibilidad significativamente

#### 3. Agregar labels a todos los selectores inline

**Archivos afectados:**
- `/src/app/admin/usuarios/page.tsx` (Select de rol y estado)
- `/src/app/admin/suscripciones/page.tsx` (Select de estado de suscripción)

**Esfuerzo:** 2 horas
**Impacto:** MEDIO - Requerido para WCAG AA

#### 4. Implementar debounce en búsquedas

**Archivos afectados:**
- Todas las páginas con búsqueda

**Esfuerzo:** 3 horas
**Impacto:** MEDIO - Reduce carga en BD

---

### ALTO (Implementar en Sprint 2)

#### 5. Agregar ordenamiento a columnas de tablas

**Archivos afectados:**
- Todas las páginas con tablas

**Esfuerzo:** 12 horas (crear componente reutilizable)
**Impacto:** ALTO - Mejora productividad de admins

#### 6. Implementar navegación por teclado en tablas

**Archivos afectados:**
- Todas las páginas con tablas

**Esfuerzo:** 8 horas
**Impacto:** ALTO - Requerido para accesibilidad completa

#### 7. Reemplazar spinners con loading states terapéuticos

**Archivos afectados:**
- Todos los archivos con spinners

**Esfuerzo:** 4 horas
**Impacto:** MEDIO - Alineación con identidad terapéutica

#### 8. Agregar auto-save a formularios de notas

**Archivos afectados:**
- `/src/app/admin/profesionales/[id]/page.tsx`

**Esfuerzo:** 3 horas
**Impacto:** MEDIO - Previene pérdida de datos

---

### MEDIO (Implementar en Sprint 3)

#### 9. Agregar skip links

**Archivos afectados:**
- `/src/app/admin/layout.tsx`

**Esfuerzo:** 2 horas
**Impacto:** MEDIO - Mejora navegación por teclado

#### 10. Implementar indicadores visuales de filtros activos

**Archivos afectados:**
- Todas las páginas con filtros

**Esfuerzo:** 4 horas
**Impacto:** MEDIO - Mejora UX

#### 11. Agregar descripciones textuales a gráficos

**Archivos afectados:**
- `/src/app/admin/page.tsx`

**Esfuerzo:** 3 horas
**Impacto:** MEDIO - Requerido para accesibilidad

#### 12. Mejorar tooltips con accessibility

**Archivos afectados:**
- Componentes con iconos sin texto

**Esfuerzo:** 6 horas (crear componente Tooltip accesible)
**Impacto:** MEDIO

---

### BAJO (Backlog)

#### 13. Implementar scroll infinito en lista de usuarios (historiales)

**Esfuerzo:** 6 horas
**Impacto:** BAJO - Optimización de rendimiento

#### 14. Agregar atajos de teclado globales

**Esfuerzo:** 8 horas
**Impacto:** BAJO - Nice to have

#### 15. Mejorar animaciones para prefers-reduced-motion

**Esfuerzo:** 4 horas
**Impacto:** BAJO - Framer Motion ya maneja esto parcialmente

---

## WIREFRAMES Y MOCKUPS

### Wireframe 1: Tabla de Usuarios Mejorada

```
┌─────────────────────────────────────────────────────────────────────────┐
│  GESTIÓN DE USUARIOS                                          [+ Nuevo] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  FILTROS Y BÚSQUEDA                               [3 filtros activos] X │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ 🔍 [Buscar por nombre o email...              ] [Limpiar]          │ │
│  │                                                                     │ │
│  │ ▼ Filtros avanzados                                                │ │
│  │   [Todos los roles ▼]  [Todos los estados ▼]  [Última act. ▼]     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Mostrando 1-10 de 247 usuarios                                         │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ USUARIO ↑      ROL        ESTADO    ÚLTIMA ACTIVIDAD    ACCIONES   │ │
│  ├────────────────────────────────────────────────────────────────────┤ │
│  │ 👤 Ana García   [USUARIO▼] ● Activa  Hace 2 horas      [Editar]   │ │
│  │    ana@email.com  3 conv, 2 eval, 1 pago                [••• ▼]   │ │
│  ├────────────────────────────────────────────────────────────────────┤ │
│  │ 👤 Carlos Ruiz  [ADMIN▼]   ○ Inactivo Hace 1 día        [Editar]   │ │
│  │    carlos@em...   0 conv, 0 eval, 0 pago                [••• ▼]   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  [‹‹ Primera] [‹ Anterior] [1] [2] 3 [4] [5] [Siguiente ›] [Última ››] │
└─────────────────────────────────────────────────────────────────────────┘

CARACTERÍSTICAS:
- Búsqueda prominente con icono
- Contador de filtros activos visible
- Botón "Limpiar filtros" accesible
- Columnas ordenables (indicador ↑↓)
- Estadísticas inline (conversaciones, evaluaciones, pagos)
- Menú de acciones desplegable (•••)
- Paginación completa con números y navegación rápida
- Focus visible en fila activa (borde azul)
```

---

### Wireframe 2: Modal de Confirmación

```
                      ┌─────────────────────────────────┐
                      │  ⚠️  ¿Desactivar usuario?      │
                      ├─────────────────────────────────┤
                      │                                 │
                      │  El usuario no podrá iniciar    │
                      │  sesión hasta que lo reactives. │
                      │                                 │
                      │  ┌───────────────────────────┐  │
                      │  │ Usuario:  Ana García      │  │
                      │  │ Email:    ana@email.com   │  │
                      │  │ Último:   Hace 2 horas    │  │
                      │  └───────────────────────────┘  │
                      │                                 │
                      │  ⚠️ Esta acción no se puede     │
                      │     deshacer.                   │
                      │                                 │
                      │  [ESC para cerrar]              │
                      │                                 │
                      │  [ Cancelar ]  [Desactivar] ⚠️  │
                      └─────────────────────────────────┘

CARACTERÍSTICAS:
- Icono grande de advertencia
- Mensaje claro de consecuencias
- Datos del usuario destacados
- Advertencia de irreversibilidad
- Hint de teclado (ESC)
- Focus inicial en "Cancelar" (seguro)
- Botón de confirmación con color destructivo
- Backdrop con blur
```

---

### Wireframe 3: Detalle de Profesional con Tabs

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ‹ Volver    DR. JUAN PÉREZ                         [✓ Aprobado]       │
│             Psicólogo Clínico                                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [📄 Información]  [📎 Documentos (3)]  [📅 Horarios]                   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                          │
│  INFORMACIÓN PERSONAL              INFORMACIÓN PROFESIONAL              │
│  ┌────────────────────────────┐  ┌────────────────────────────────┐   │
│  │ Email:    juan@email.com   │  │ Título:     Psicología Clínica │   │
│  │ Teléfono: +57 300 123 4567 │  │ Universidad: Universidad XYZ   │   │
│  │ Rol:      TERAPEUTA        │  │ Licencia:    PSI-12345         │   │
│  └────────────────────────────┘  │ Experiencia: 8 años            │   │
│                                   └────────────────────────────────┘   │
│                                                                          │
│  ESPECIALIDADES                    IDIOMAS                              │
│  [Ansiedad] [Depresión] [TEPT]    [Español] [Inglés]                   │
│                                                                          │
│  BIOGRAFÍA                                                               │
│  Psicólogo clínico con 8 años de experiencia...                        │
│                                                                          │
│  NOTAS DEL ADMINISTRADOR           (Se guardan automáticamente)         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ Documentos verificados el 20/10/2025.                          │    │
│  │ Profesional altamente calificado.                              │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

CARACTERÍSTICAS:
- Breadcrumb implícito con botón "Volver"
- Estado de aprobación prominente
- Tabs con contadores
- Layout de dos columnas
- Tags para especialidades e idiomas
- Auto-save en notas (sin botón guardar necesario)
- Información organizada en cards
```

---

### Wireframe 4: Dashboard con Estadísticas

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PANEL DE CONTROL                              Bienvenido, Administrador│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ⚠️ CASOS CRÍTICOS URGENTES (2 casos)                        [Expandir] │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  🔴 María López - PHQ-9: 22 puntos - Riesgo alto - hace 1 día          │
│      Acción: URGENTE: Contacto inmediato. Posible ideación suicida.    │
│      [Ver Historial]  [Marcar Revisado]                                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                          │
│  ESTADÍSTICAS GENERALES                                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │ 👥           │ │ 💬           │ │ 📋           │ │ 📈           │  │
│  │ 2,543        │ │ 187          │ │ 1,234        │ │ 87%          │  │
│  │ Usuarios     │ │ Conversac.   │ │ Evaluaciones │ │ Retención    │  │
│  │ +23 hoy ↑    │ │ +12 hoy ↑    │ │ -5 hoy ↓     │ │ +3% ↑        │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │
│                                                                          │
│  ACTIVIDAD EN TIEMPO REAL          CRECIMIENTO DE USUARIOS             │
│  ┌────────────────────────────┐  ┌────────────────────────────┐        │
│  │     📊                      │  │      📈                     │        │
│  │  Gráfico de líneas...      │  │   Gráfico de área...       │        │
│  │  (Ver versión textual)     │  │   (Ver versión textual)    │        │
│  └────────────────────────────┘  └────────────────────────────┘        │
│                                                                          │
│  ACCIONES RÁPIDAS                                                       │
│  [👥 Usuarios] [👨‍⚕️ Profesionales] [💳 Suscripciones] [📊 Historiales] │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

CARACTERÍSTICAS:
- AlertasCriticas expandible en la parte superior
- Tarjetas de estadísticas con iconos grandes
- Cambios con indicadores de tendencia (↑↓)
- Gráficos con link a "versión textual"
- Acciones rápidas como grid de botones grandes
- Paleta de colores terapéuticos
- Loading con puntos suaves, no spinners agresivos
```

---

## CONCLUSIONES Y PRÓXIMOS PASOS

### Resumen de Hallazgos

El panel de administrador de Escuchodromo tiene una **base sólida** con algunos componentes ejemplares (como AlertasCriticas), pero requiere mejoras significativas en:

1. **Accesibilidad:** Falta ARIA completo, navegación por teclado y confirmaciones
2. **UX para Admins:** Faltan ordenamiento, filtros visuales y atajos de productividad
3. **Prevención de Errores:** Acciones destructivas sin confirmación
4. **Consistencia:** Loading states no terapéuticos, tooltips inconsistentes

### Priorización Recomendada

**Sprint 1 (2 semanas):**
- Modales de confirmación
- ARIA en tablas
- Labels en selectores
- Debounce en búsquedas

**Sprint 2 (2 semanas):**
- Ordenamiento de columnas
- Navegación por teclado
- Loading terapéuticos
- Auto-save

**Sprint 3 (1 semana):**
- Skip links
- Indicadores de filtros
- Descripciones de gráficos
- Tooltips accesibles

### Métricas de Éxito

Después de implementar estas mejoras, medir:

1. **Lighthouse Accessibility Score:** Objetivo 95+
2. **Tiempo promedio para completar tareas admin:** Reducción del 30%
3. **Errores accidentales:** Reducción del 90%
4. **Quejas de usabilidad:** Reducción del 80%
5. **Cumplimiento WCAG 2.1 AA:** 100%

---

## RECURSOS ADICIONALES

### Herramientas Recomendadas

1. **axe DevTools** (Chrome/Firefox): Auditoría automática de accesibilidad
2. **NVDA** (Windows) / **VoiceOver** (Mac): Lectores de pantalla para testing
3. **Contrast Checker**: https://webaim.org/resources/contrastchecker/
4. **WAVE**: https://wave.webaim.org/
5. **React DevTools**: Para inspeccionar componentes

### Documentación de Referencia

1. **WCAG 2.1 Quick Reference**: https://www.w3.org/WAI/WCAG21/quickref/
2. **Radix UI Accessibility**: https://www.radix-ui.com/primitives/docs/overview/accessibility
3. **ARIA Authoring Practices**: https://www.w3.org/WAI/ARIA/apg/
4. **Inclusive Components**: https://inclusive-components.design/

### Testing Checklist

Antes de dar por completada cada página:

- [ ] Probar con teclado únicamente (sin mouse)
- [ ] Probar con lector de pantalla (NVDA/VoiceOver)
- [ ] Probar en móvil (touch targets, responsive)
- [ ] Probar con zoom 200%
- [ ] Probar con modo de alto contraste
- [ ] Validar HTML con W3C Validator
- [ ] Auditar con axe DevTools
- [ ] Verificar performance en Lighthouse

---

**FIN DE LA AUDITORÍA**

Este documento debe ser actualizado conforme se implementen las mejoras y se descubran nuevos hallazgos.
