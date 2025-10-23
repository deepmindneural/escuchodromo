# Guía de Diseño Unificado - Panel Admin Escuchodromo

## Problema Identificado

El panel de administración tenía **inconsistencias graves** en diseño:
- Headers diferentes en cada página
- Tarjetas de estadísticas con estructuras distintas
- Loading states implementados de forma diferente
- Sin componentes reutilizables
- Mezcla de estilos y colores sin sistema

## Solución: Sistema de Componentes Unificado

Se crearon **8 componentes base** que TODAS las páginas admin deben usar:

### 1. AdminHeader

**Ubicación:** `src/lib/componentes/admin/AdminHeader.tsx`

```tsx
import { AdminHeader } from '@/lib/componentes/admin';
import { Users } from 'lucide-react';

<AdminHeader
  titulo="Gestión de Usuarios"
  descripcion="Administra los usuarios de la plataforma"
  icono={<Users />}
  acciones={<Button>Crear Usuario</Button>}
/>
```

**Características:**
- Header sticky con backdrop blur
- Gradiente sutil de fondo
- Responsive (columna en mobile, fila en desktop)
- Animación de entrada suave

---

### 2. AdminStatCard

**Ubicación:** `src/lib/componentes/admin/AdminStatCard.tsx`

```tsx
import { AdminStatCard } from '@/lib/componentes/admin';
import { Users } from 'lucide-react';

<AdminStatCard
  titulo="Total Usuarios"
  valor={1234}
  icono={Users}
  color="from-blue-400 to-blue-600"
  cambio={15}
  tendencia="up"
  formato="numero"
  delay={0.1}
/>
```

**Formatos disponibles:**
- `"numero"`: CountUp animado
- `"moneda"`: Intl.NumberFormat con COP/USD
- `"porcentaje"`: CountUp con sufijo %

**Características:**
- Animación de entrada (fade + scale)
- Hover effect (elevación + escala icono)
- Gradiente personalizable
- Línea decorativa inferior en hover
- Indicador de tendencia (up/down)

---

### 3. AdminCard

**Ubicación:** `src/lib/componentes/admin/AdminCard.tsx`

```tsx
import { AdminCard } from '@/lib/componentes/admin';
import { Search } from 'lucide-react';

<AdminCard
  titulo="Datos Recientes"
  icono={<Search />}
  acciones={<Button>Ver más</Button>}
  delay={0.2}
>
  {/* Contenido */}
</AdminCard>
```

**Características:**
- Header opcional con título e icono
- Slot para acciones en header
- Animación configurable
- Hover effect (sombra)
- Padding consistente

---

### 4. AdminFilters

**Ubicación:** `src/lib/componentes/admin/AdminFilters.tsx`

```tsx
import { AdminFilters } from '@/lib/componentes/admin';
import { Input, Select } from '@/lib/componentes/ui';

<AdminFilters titulo="Filtros de búsqueda">
  <Input placeholder="Buscar..." />
  <Select>...</Select>
  <Button>Aplicar</Button>
  <Button variant="outline">Limpiar</Button>
</AdminFilters>
```

**Características:**
- Grid responsive (1 col mobile → 4 cols desktop)
- Icono de búsqueda automático
- Gap consistente

---

### 5. AdminTableWrapper

**Ubicación:** `src/lib/componentes/admin/AdminTableWrapper.tsx`

```tsx
import { AdminTableWrapper, AdminEmptyState } from '@/lib/componentes/admin';
import { Table } from '@/lib/componentes/ui/table';

<AdminTableWrapper
  titulo="Lista de Usuarios"
  vacio={usuarios.length === 0}
  cargando={cargando}
  emptyStateProps={{
    tipo: 'filtros',
    accion: {
      texto: 'Limpiar filtros',
      onClick: () => limpiarFiltros()
    }
  }}
>
  <Table>...</Table>
</AdminTableWrapper>
```

**Características:**
- Maneja estados vacío/cargando automáticamente
- Overflow-x-auto para tablas grandes
- Integrado con AdminEmptyState

---

### 6. AdminEmptyState

**Ubicación:** `src/lib/componentes/admin/AdminEmptyState.tsx`

```tsx
import { AdminEmptyState } from '@/lib/componentes/admin';

<AdminEmptyState
  tipo="busqueda" // 'busqueda' | 'datos' | 'filtros'
  titulo="No se encontraron resultados"
  descripcion="Intenta ajustar los términos de búsqueda"
  accion={{
    texto: 'Limpiar búsqueda',
    onClick: () => setBusqueda(''),
    icono: <X />
  }}
/>
```

**Tipos predefinidos:**
- `busqueda`: Para resultados de búsqueda vacíos
- `filtros`: Para filtros sin coincidencias
- `datos`: Para secciones sin datos

**Características:**
- Icono animado (flotación suave)
- Contenido personalizable
- Acción opcional

---

### 7. AdminPagination

**Ubicación:** `src/lib/componentes/admin/AdminPagination.tsx`

```tsx
import { AdminPagination } from '@/lib/componentes/admin';

<AdminPagination
  paginaActual={pagina}
  totalPaginas={10}
  total={250}
  limite={25}
  onCambiarPagina={setPagina}
  tipo="usuarios"
/>
```

**Características:**
- Texto descriptivo ("Mostrando 1-25 de 250 usuarios")
- Botones prev/next con iconos
- Badge destacado con página actual
- Se oculta automáticamente si totalPaginas ≤ 1

---

### 8. AdminLoadingState

**Ubicación:** `src/lib/componentes/admin/AdminLoadingState.tsx`

```tsx
import { AdminLoadingState } from '@/lib/componentes/admin';

if (cargando) {
  return <AdminLoadingState mensaje="Cargando usuarios..." />;
}
```

**Características:**
- Spinner con rotación infinita (Loader2 de lucide)
- Fondo con gradiente sutil
- Mensaje personalizable
- Atributos ARIA para accesibilidad

---

## Sistema de Colores

### Paleta Terapéutica (tailwind.config.js)

```js
colors: {
  calma: { 500: '#0EA5E9', 600: '#0284C7' },      // Azules tranquilos
  esperanza: { 500: '#22C55E', 600: '#16A34A' },  // Verdes naturales
  calidez: { 500: '#F59E0B', 600: '#D97706' },    // Naranjas cálidos
  serenidad: { 500: '#A855F7', 600: '#9333EA' }   // Morados serenos
}
```

### Colores por Tipo de Componente

**Tarjetas de estadísticas (AdminStatCard):**
```tsx
// Usuarios, datos principales
color="from-blue-400 to-blue-600"

// Métricas positivas, activos
color="from-green-400 to-green-600"

// Métricas neutrales
color="from-purple-400 to-purple-600"

// Alertas, ingresos
color="from-orange-400 to-orange-600"

// Problemas, cancelaciones
color="from-red-400 to-red-600"
```

**Planes (AdminStatCard o tarjetas personalizadas):**
```tsx
// Básico
color="from-blue-400 to-blue-600"

// Premium
color="from-purple-400 to-purple-600"

// Profesional
color="from-orange-400 to-orange-600"
```

---

## Estructura de Página Estándar

```tsx
'use client';

import { useState, useEffect } from 'react';
import {
  AdminHeader,
  AdminStatCard,
  AdminCard,
  AdminFilters,
  AdminTableWrapper,
  AdminPagination,
  AdminLoadingState
} from '@/lib/componentes/admin';
import { Toaster } from 'react-hot-toast';

export default function PaginaAdmin() {
  const [cargando, setCargando] = useState(true);

  if (cargando) {
    return <AdminLoadingState mensaje="Cargando datos..." />;
  }

  return (
    <>
      <Toaster position="top-center" />

      {/* 1. HEADER STICKY */}
      <AdminHeader
        titulo="Título de la Página"
        descripcion="Descripción breve"
        icono={<IconoLucide />}
        acciones={<Button>Acción Principal</Button>}
      />

      {/* 2. CONTENEDOR PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        
        {/* 3. TARJETAS DE ESTADÍSTICAS (4 columnas) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AdminStatCard {...} delay={0} />
          <AdminStatCard {...} delay={0.1} />
          <AdminStatCard {...} delay={0.2} />
          <AdminStatCard {...} delay={0.3} />
        </div>

        {/* 4. GRÁFICOS (2 columnas) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <AdminCard titulo="Gráfico 1" delay={0.4}>
            <ResponsiveContainer>...</ResponsiveContainer>
          </AdminCard>
          <AdminCard titulo="Gráfico 2" delay={0.5}>
            <ResponsiveContainer>...</ResponsiveContainer>
          </AdminCard>
        </div>

        {/* 5. FILTROS */}
        <AdminFilters>
          <Input placeholder="Buscar..." />
          <Select>...</Select>
          <Button variant="outline">Limpiar</Button>
        </AdminFilters>

        {/* 6. TABLA */}
        <AdminTableWrapper
          titulo="Lista de Datos"
          vacio={datos.length === 0}
          emptyStateProps={{ tipo: 'filtros' }}
        >
          <Table>...</Table>
        </AdminTableWrapper>

        {/* 7. PAGINACIÓN */}
        <AdminPagination
          paginaActual={pagina}
          totalPaginas={totalPaginas}
          total={total}
          limite={limite}
          onCambiarPagina={setPagina}
          tipo="elementos"
        />
      </main>
    </>
  );
}
```

---

## Animaciones y Delays

**Sistema de delays escalonados:**
```tsx
// Tarjetas de estadísticas (4 elementos)
<AdminStatCard delay={0} />
<AdminStatCard delay={0.1} />
<AdminStatCard delay={0.2} />
<AdminStatCard delay={0.3} />

// Gráficos y cards secundarios
<AdminCard delay={0.4} />
<AdminCard delay={0.5} />
```

**Regla:** Incrementar en **0.1s** por cada elemento del mismo tipo.

---

## Responsive Design

Todos los componentes usan breakpoints consistentes:

```css
/* Mobile first */
grid-cols-1          /* < 768px */
md:grid-cols-2       /* ≥ 768px */
lg:grid-cols-4       /* ≥ 1024px */
```

**Tarjetas de estadísticas:**
- Mobile: 1 columna
- Tablet (md): 2 columnas
- Desktop (lg): 4 columnas

**Gráficos:**
- Mobile: 1 columna
- Desktop (lg): 2 columnas

---

## Accesibilidad

**Todos los componentes incluyen:**
- Atributos ARIA apropiados (`role`, `aria-label`, `aria-live`)
- Contraste mínimo WCAG AA (4.5:1)
- Estados de hover/focus visibles
- Navegación por teclado funcional
- Mensajes de loading descriptivos

---

## Migración de Páginas Existentes

### Checklist por página:

- [ ] Reemplazar header manual por `<AdminHeader>`
- [ ] Convertir tarjetas de stats a `<AdminStatCard>`
- [ ] Envolver gráficos en `<AdminCard>`
- [ ] Filtros dentro de `<AdminFilters>`
- [ ] Tablas en `<AdminTableWrapper>`
- [ ] Paginación con `<AdminPagination>`
- [ ] Loading con `<AdminLoadingState>`
- [ ] Estados vacíos con `<AdminEmptyState>`

### Ejemplo de migración:

**ANTES:**
```tsx
{cargando ? (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="w-16 h-16 border-4 border-teal-500 ..."></div>
  </div>
) : (...)}
```

**DESPUÉS:**
```tsx
if (cargando) {
  return <AdminLoadingState mensaje="Cargando usuarios..." />;
}
```

---

## Notas Importantes

1. **Imports:** Siempre usar el barrel export `@/lib/componentes/admin`
2. **Colores:** Respetar la paleta terapéutica definida
3. **Spacing:** Usar `mb-8` entre secciones principales, `mb-6` entre secundarias
4. **Max-width:** Container principal siempre `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
5. **Toaster:** Siempre incluir `<Toaster position="top-center" />`

---

## Próximos Pasos

1. Migrar página dashboard principal (`/admin/page.tsx`)
2. Migrar página usuarios (`/admin/usuarios/page.tsx`)
3. Migrar página suscripciones (`/admin/suscripciones/page.tsx`)
4. Migrar página pagos (`/admin/pagos/page.tsx`)
5. Migrar página planes (`/admin/planes/page.tsx`)

