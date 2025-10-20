# Documentación de Componentes UI - Escuchodromo

## Tabla de Contenidos

1. [Componentes de Reservas](#componentes-de-reservas)
2. [Componentes de Dashboard](#componentes-de-dashboard)
3. [Componentes de Progreso](#componentes-de-progreso)
4. [Utilidades y Hooks](#utilidades-y-hooks)
5. [Ejemplos de Uso](#ejemplos-de-uso)

---

## Componentes de Reservas

### CalendarioMensual

**Ubicación**: `src/lib/componentes/CalendarioMensual.tsx`

**Propósito**: Calendario mensual accesible para selección de fechas con disponibilidad.

**Props**:
```typescript
interface CalendarioMensualProps {
  fechaSeleccionada: Date | null;
  onSeleccionarFecha: (fecha: Date) => void;
  fechasConDisponibilidad?: Date[];
  fechaMinima?: Date;
  fechaMaxima?: Date;
}
```

**Características de Accesibilidad**:
- Navegación con flechas de teclado
- ARIA labels completos (`role="grid"`, `role="gridcell"`)
- Indicadores visuales + iconos (no solo color)
- Focus visible
- Respeta `prefers-reduced-motion`

**Ejemplo**:
```tsx
import { CalendarioMensual } from '@/lib/componentes/CalendarioMensual';

function PaginaReserva() {
  const [fecha, setFecha] = useState<Date | null>(null);
  const [fechasDisponibles, setFechasDisponibles] = useState<Date[]>([
    new Date(2025, 9, 21),
    new Date(2025, 9, 22),
    new Date(2025, 9, 24),
  ]);

  return (
    <CalendarioMensual
      fechaSeleccionada={fecha}
      onSeleccionarFecha={setFecha}
      fechasConDisponibilidad={fechasDisponibles}
      fechaMinima={new Date()}
    />
  );
}
```

---

### SlotsDisponibles

**Ubicación**: `src/lib/componentes/SlotsDisponibles.tsx`

**Propósito**: Muestra horarios disponibles para reserva con estados visuales claros.

**Props**:
```typescript
interface SlotsDisponiblesProps {
  slots: SlotHorario[];
  slotSeleccionado: SlotHorario | null;
  onSeleccionarSlot: (slot: SlotHorario) => void;
  duracionSesion: number;
  mensajeSinSlots?: string;
}

interface SlotHorario {
  hora_inicio: string; // "14:30"
  hora_fin: string; // "15:30"
  disponible: boolean;
  duracion_disponible: number; // minutos
}
```

**Características de Accesibilidad**:
- Radio group semántico
- Touch targets 44x44px
- Estados claros: disponible/ocupado/seleccionado
- No depende solo de color

**Ejemplo**:
```tsx
import { SlotsDisponibles } from '@/lib/componentes/SlotsDisponibles';

function PaginaReserva() {
  const [slotSeleccionado, setSlotSeleccionado] = useState<SlotHorario | null>(null);
  const slots: SlotHorario[] = [
    { hora_inicio: '09:00', hora_fin: '10:00', disponible: true, duracion_disponible: 60 },
    { hora_inicio: '10:00', hora_fin: '11:00', disponible: false, duracion_disponible: 0 },
    { hora_inicio: '14:00', hora_fin: '14:30', disponible: true, duracion_disponible: 30 },
  ];

  return (
    <SlotsDisponibles
      slots={slots}
      slotSeleccionado={slotSeleccionado}
      onSeleccionarSlot={setSlotSeleccionado}
      duracionSesion={60}
    />
  );
}
```

---

### SelectorDuracion

**Ubicación**: `src/lib/componentes/SelectorDuracion.tsx`

**Propósito**: Selector de duración de sesión con precios.

**Props**:
```typescript
interface SelectorDuracionProps {
  duracionSeleccionada: number;
  onCambiarDuracion: (duracion: number) => void;
  opciones?: OpcionDuracion[];
  moneda?: string;
}

interface OpcionDuracion {
  valor: number; // minutos
  precio: number;
  etiqueta?: string;
}
```

**Ejemplo**:
```tsx
<SelectorDuracion
  duracionSeleccionada={60}
  onCambiarDuracion={(duracion) => setDuracion(duracion)}
  opciones={[
    { valor: 30, precio: 80000, etiqueta: 'Sesión corta' },
    { valor: 60, precio: 150000, etiqueta: 'Sesión completa' },
  ]}
  moneda="COP"
/>
```

---

### SelectorModalidad

**Ubicación**: `src/lib/componentes/SelectorModalidad.tsx`

**Propósito**: Selector de modalidad (virtual/presencial).

**Props**:
```typescript
type Modalidad = 'VIRTUAL' | 'PRESENCIAL';

interface SelectorModalidadProps {
  modalidadSeleccionada: Modalidad;
  onCambiarModalidad: (modalidad: Modalidad) => void;
  direccionPresencial?: string;
}
```

**Ejemplo**:
```tsx
<SelectorModalidad
  modalidadSeleccionada="VIRTUAL"
  onCambiarModalidad={(modalidad) => setModalidad(modalidad)}
  direccionPresencial="Calle 123 #45-67, Bogotá"
/>
```

---

### ModalConfirmacion

**Ubicación**: `src/lib/componentes/ModalConfirmacion.tsx`

**Propósito**: Modal accesible para confirmar reserva.

**Props**:
```typescript
interface ModalConfirmacionProps {
  abierto: boolean;
  onCerrar: () => void;
  onConfirmar: () => void;
  datos: DatosConfirmacion;
  cargando?: boolean;
}
```

**Características**:
- Usa Radix UI Dialog
- Focus trap automático
- Cierre con ESC
- Overlay semi-transparente

**Ejemplo**:
```tsx
<ModalConfirmacion
  abierto={modalAbierto}
  onCerrar={() => setModalAbierto(false)}
  onConfirmar={confirmarReserva}
  cargando={reservando}
  datos={{
    profesional: { nombre: 'Juan', apellido: 'Pérez', especialidad: 'Psicología' },
    fecha: 'Viernes 25 de Octubre',
    hora: '14:30',
    duracion: 60,
    modalidad: 'VIRTUAL',
    precio: 150000,
  }}
/>
```

---

## Componentes de Dashboard

### GridMetricas

**Ubicación**: `src/lib/componentes/GridMetricas.tsx`

**Propósito**: Grid responsive de tarjetas de métricas con mini gráficas.

**Props**:
```typescript
interface GridMetricasProps {
  metricas: Metrica[];
  columnas?: 2 | 3 | 4;
}

interface Metrica {
  id: string;
  titulo: string;
  valor: number | string;
  cambio?: { valor: number; porcentaje: number; tipo: 'positivo' | 'negativo' | 'neutral' };
  icono?: React.ReactNode;
  datosGrafica?: number[];
  tendencia?: 'positiva' | 'negativa' | 'neutral';
  descripcionGrafica?: string;
  colorGrafica?: string;
}
```

**Ejemplo**:
```tsx
import { GridMetricas } from '@/lib/componentes/GridMetricas';
import { UserGroupIcon } from '@heroicons/react/24/outline';

const metricas = [
  {
    id: 'pacientes',
    titulo: 'Pacientes activos',
    valor: 24,
    cambio: { valor: 3, porcentaje: 14, tipo: 'positivo' as const },
    icono: <UserGroupIcon className="w-6 h-6" />,
    datosGrafica: [18, 20, 21, 24],
    tendencia: 'positiva' as const,
  },
];

<GridMetricas metricas={metricas} columnas={4} />
```

---

### TablaPacientes

**Ubicación**: `src/lib/componentes/TablaPacientes.tsx`

**Propósito**: Tabla responsive y accesible de pacientes con filtros y sorting.

**Props**:
```typescript
interface TablaPacientesProps {
  pacientes: Paciente[];
  onClickPaciente: (paciente: Paciente) => void;
  cargando?: boolean;
}

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  foto?: string;
  ultimoContacto: Date;
  estadoEmocional: 'ESTABLE' | 'ALERTA' | 'CRITICO';
  progreso: number; // 0-100
  sesionesCompletadas: number;
  sesionesProgramadas: number;
}
```

**Características**:
- Tabla semántica en desktop
- Stack de cards en mobile
- Sorting por columna
- Filtros por estado emocional

**Ejemplo**:
```tsx
<TablaPacientes
  pacientes={pacientes}
  onClickPaciente={(paciente) => router.push(`/pacientes/${paciente.id}/progreso`)}
/>
```

---

### IndicadorEmocional

**Ubicación**: `src/lib/componentes/IndicadorEmocional.tsx`

**Propósito**: Indicador visual accesible de estado emocional (NO solo color).

**Props**:
```typescript
type EstadoEmocional = 'ESTABLE' | 'ALERTA' | 'CRITICO';

interface IndicadorEmocionalProps {
  estado: EstadoEmocional;
  descripcion?: string;
  mostrarTooltip?: boolean;
  tamanio?: 'sm' | 'md' | 'lg';
}
```

**Diseño**:
- **ESTABLE**: Verde + círculo + "Estable"
- **ALERTA**: Amarillo + triángulo + "Alerta"
- **CRITICO**: Rojo + cuadrado + "Crítico"

**Ejemplo**:
```tsx
<IndicadorEmocional
  estado="ALERTA"
  descripcion="El paciente presenta cambios que requieren atención"
  tamanio="md"
/>

// Versión solo icono (para tablas)
<IndicadorEmocionalIcono estado="CRITICO" />
```

---

### ProximasCitas

**Ubicación**: `src/lib/componentes/ProximasCitas.tsx`

**Propósito**: Lista de próximas citas con acciones rápidas.

**Props**:
```typescript
interface ProximasCitasProps {
  citas: Cita[];
  onCancelar?: (citaId: string) => void;
  onReprogramar?: (citaId: string) => void;
  onIniciarSesion?: (citaId: string) => void;
  cargando?: boolean;
  limite?: number;
}
```

**Ejemplo**:
```tsx
<ProximasCitas
  citas={citasProximas}
  onCancelar={handleCancelar}
  onReprogramar={handleReprogramar}
  onIniciarSesion={handleIniciar}
  limite={5}
/>
```

---

## Componentes de Progreso

### GraficaEvolucion

**Ubicación**: `src/lib/componentes/GraficaEvolucion.tsx`

**Propósito**: Line chart con tabla alternativa para progreso clínico.

**Props**:
```typescript
interface GraficaEvolucionProps {
  datos: PuntoEvolucion[];
  titulo?: string;
  descripcion: string;
  altura?: number;
}

interface PuntoEvolucion {
  fecha: Date;
  phq9?: number;
  gad7?: number;
}
```

**Características**:
- Dos líneas: PHQ-9 (azul) y GAD-7 (morado)
- Rangos de severidad coloreados
- Toggle para mostrar tabla de datos accesible
- Respeta `prefers-reduced-motion`

**Ejemplo**:
```tsx
const datos: PuntoEvolucion[] = [
  { fecha: new Date(2025, 7, 1), phq9: 18, gad7: 16 },
  { fecha: new Date(2025, 8, 1), phq9: 12, gad7: 13 },
  { fecha: new Date(2025, 9, 1), phq9: 7, gad7: 9 },
];

<GraficaEvolucion
  datos={datos}
  descripcion="Evolución de indicadores PHQ-9 y GAD-7 en los últimos 3 meses"
/>
```

---

### TimelineHitos

**Ubicación**: `src/lib/componentes/TimelineHitos.tsx`

**Propósito**: Línea de tiempo de eventos importantes.

**Props**:
```typescript
interface TimelineHitosProps {
  hitos: Hito[];
  titulo?: string;
}

interface Hito {
  id: string;
  tipo: 'evaluacion' | 'sesion' | 'cambio_tratamiento';
  fecha: Date;
  titulo: string;
  descripcion?: string;
}
```

**Ejemplo**:
```tsx
const hitos: Hito[] = [
  {
    id: '1',
    tipo: 'evaluacion',
    fecha: new Date(2025, 7, 1),
    titulo: 'Evaluación inicial PHQ-9',
    descripcion: 'PHQ-9: 18 (Moderadamente severo)',
  },
  {
    id: '2',
    tipo: 'sesion',
    fecha: new Date(2025, 7, 8),
    titulo: 'Primera sesión terapéutica',
  },
];

<TimelineHitos hitos={hitos} />
```

---

### VistaComparativa

**Ubicación**: `src/lib/componentes/VistaComparativa.tsx`

**Propósito**: Gráficas comparativas con toggle semanal/mensual.

**Props**:
```typescript
interface VistaComparativaProps {
  datosSemanales: DatosComparativos[];
  datosMensuales: DatosComparativos[];
  titulo?: string;
  descripcion?: string;
}

interface DatosComparativos {
  periodo: string;
  phq9: number;
  gad7: number;
}
```

**Ejemplo**:
```tsx
const semanal = [
  { periodo: 'Sem 1', phq9: 12, gad7: 13 },
  { periodo: 'Sem 2', phq9: 10, gad7: 11 },
];

const mensual = [
  { periodo: 'Mes 1', phq9: 18, gad7: 16 },
  { periodo: 'Mes 2', phq9: 12, gad7: 13 },
];

<VistaComparativa
  datosSemanales={semanal}
  datosMensuales={mensual}
/>
```

---

### AlertaCritica

**Ubicación**: `src/lib/componentes/AlertaCritica.tsx`

**Propósito**: Alerta accesible con 3 niveles de severidad.

**Props**:
```typescript
type TipoAlerta = 'info' | 'advertencia' | 'critico';

interface AlertaCriticaProps {
  tipo: TipoAlerta;
  mensaje: string;
  descripcion?: string;
  accion?: { texto: string; onClick: () => void };
  onCerrar?: () => void;
}
```

**Diseño**:
- **info**: Azul + icono info (ℹ️)
- **advertencia**: Amarillo + icono triángulo (⚠️)
- **critico**: Rojo + icono círculo exclamación (🚨)

**Ejemplo**:
```tsx
<AlertaCritica
  tipo="critico"
  mensaje="Indicadores de riesgo elevado"
  descripcion="El paciente presenta puntuaciones que requieren atención inmediata."
  accion={{
    texto: 'Contactar paciente',
    onClick: () => handleContactar(),
  }}
/>

// Lista de alertas
<ListaAlertas
  alertas={[
    { id: '1', tipo: 'info', mensaje: 'Progreso positivo', fecha: new Date() },
  ]}
/>
```

---

## Utilidades y Hooks

### useMediaQuery / usePrefersReducedMotion

**Ubicación**: `src/lib/hooks/useMediaQuery.ts`

**Propósito**: Detectar media queries y preferencias de usuario.

**Ejemplo**:
```tsx
import { usePrefersReducedMotion } from '@/lib/hooks/useMediaQuery';

function MiComponente() {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
    >
      Contenido
    </motion.div>
  );
}
```

---

### Utilidades de Fechas

**Ubicación**: `src/lib/utils/fechas.ts`

**Funciones Disponibles**:
```typescript
// Formateo
formatearFecha(fecha: Date, formato?: string): string
formatearFechaCorta(fecha: Date): string // "20/10/2025"
formatearHora(fecha: Date): string // "14:30"
formatearFechaHora(fecha: Date): string // "20 de Octubre a las 14:30"

// Navegación
mesAnterior(fecha: Date): Date
mesSiguiente(fecha: Date): Date
obtenerDiasDelMes(fecha: Date): Date[]

// Comparación
esMismoDia(fecha1: Date, fecha2: Date): boolean
esHoy(fecha: Date): boolean
esMismoMes(fecha1: Date, fecha2: Date): boolean

// API
formatearParaAPI(fecha: Date): string // "2025-10-20"
combinarFechaHora(fecha: Date, hora: string): Date
```

**Ejemplo**:
```tsx
import { formatearFechaHora, esMismoDia } from '@/lib/utils/fechas';

const ahora = new Date();
const otraFecha = new Date(2025, 9, 25);

console.log(formatearFechaHora(ahora)); // "20 de Octubre a las 14:30"
console.log(esMismoDia(ahora, otraFecha)); // false
```

---

## Ejemplos de Uso Completo

### Ejemplo 1: Página de Reserva Completa

```tsx
'use client';

import { useState } from 'react';
import { CalendarioMensual } from '@/lib/componentes/CalendarioMensual';
import { SlotsDisponibles, SlotHorario } from '@/lib/componentes/SlotsDisponibles';
import { SelectorDuracion } from '@/lib/componentes/SelectorDuracion';
import { SelectorModalidad, Modalidad } from '@/lib/componentes/SelectorModalidad';
import { ModalConfirmacion } from '@/lib/componentes/ModalConfirmacion';

export default function PaginaReserva() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(null);
  const [slotSeleccionado, setSlotSeleccionado] = useState<SlotHorario | null>(null);
  const [duracion, setDuracion] = useState(60);
  const [modalidad, setModalidad] = useState<Modalidad>('VIRTUAL');
  const [modalAbierto, setModalAbierto] = useState(false);

  const slots: SlotHorario[] = [
    { hora_inicio: '09:00', hora_fin: '10:00', disponible: true, duracion_disponible: 60 },
    { hora_inicio: '14:00', hora_fin: '15:00', disponible: true, duracion_disponible: 60 },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Paso 1: Duración */}
      <section>
        <h2 className="text-xl font-bold mb-4">1. Duración de la sesión</h2>
        <SelectorDuracion
          duracionSeleccionada={duracion}
          onCambiarDuracion={setDuracion}
        />
      </section>

      {/* Paso 2: Modalidad */}
      <section>
        <h2 className="text-xl font-bold mb-4">2. Modalidad</h2>
        <SelectorModalidad
          modalidadSeleccionada={modalidad}
          onCambiarModalidad={setModalidad}
        />
      </section>

      {/* Paso 3: Fecha */}
      <section>
        <h2 className="text-xl font-bold mb-4">3. Fecha</h2>
        <CalendarioMensual
          fechaSeleccionada={fechaSeleccionada}
          onSeleccionarFecha={setFechaSeleccionada}
        />
      </section>

      {/* Paso 4: Horario */}
      {fechaSeleccionada && (
        <section>
          <h2 className="text-xl font-bold mb-4">4. Horario</h2>
          <SlotsDisponibles
            slots={slots}
            slotSeleccionado={slotSeleccionado}
            onSeleccionarSlot={setSlotSeleccionado}
            duracionSesion={duracion}
          />
        </section>
      )}

      {/* Botón Confirmar */}
      {fechaSeleccionada && slotSeleccionado && (
        <button
          onClick={() => setModalAbierto(true)}
          className="w-full px-6 py-3 bg-calma-600 text-white rounded-lg hover:bg-calma-700"
        >
          Confirmar reserva
        </button>
      )}

      {/* Modal Confirmación */}
      <ModalConfirmacion
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        onConfirmar={() => console.log('Reservar')}
        datos={{
          profesional: { nombre: 'Juan', apellido: 'Pérez' },
          fecha: 'Viernes 25 de Octubre',
          hora: slotSeleccionado?.hora_inicio || '',
          duracion,
          modalidad,
          precio: duracion === 30 ? 80000 : 150000,
        }}
      />
    </div>
  );
}
```

---

### Ejemplo 2: Dashboard Profesional

```tsx
'use client';

import { GridMetricas, Metrica } from '@/lib/componentes/GridMetricas';
import { TablaPacientes, Paciente } from '@/lib/componentes/TablaPacientes';
import { ProximasCitas, Cita } from '@/lib/componentes/ProximasCitas';

export default function DashboardProfesional() {
  const metricas: Metrica[] = [
    {
      id: 'pacientes',
      titulo: 'Pacientes activos',
      valor: 24,
      cambio: { valor: 3, porcentaje: 14, tipo: 'positivo' },
      datosGrafica: [18, 20, 21, 24],
    },
  ];

  const pacientes: Paciente[] = [
    {
      id: '1',
      nombre: 'María',
      apellido: 'González',
      ultimoContacto: new Date(),
      estadoEmocional: 'ESTABLE',
      progreso: 75,
      sesionesCompletadas: 8,
      sesionesProgramadas: 12,
    },
  ];

  const citas: Cita[] = [
    {
      id: '1',
      paciente: { nombre: 'María', apellido: 'González' },
      fecha: new Date(),
      duracion: 60,
      modalidad: 'VIRTUAL',
      estado: 'CONFIRMADA',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Métricas */}
      <GridMetricas metricas={metricas} columnas={4} />

      {/* Grid: Tabla + Citas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <TablaPacientes
            pacientes={pacientes}
            onClickPaciente={(p) => console.log('Click', p.id)}
          />
        </div>
        <div>
          <ProximasCitas
            citas={citas}
            onIniciarSesion={(id) => console.log('Iniciar', id)}
          />
        </div>
      </div>
    </div>
  );
}
```

---

## Paleta de Colores de Referencia

```css
/* Calma (Azules) */
bg-calma-50   /* Fondos suaves */
bg-calma-100  /* Fondos de cards */
text-calma-600 /* Texto principal */
bg-calma-600  /* Botones primarios */
bg-calma-700  /* Hover de botones */

/* Esperanza (Verdes) */
bg-esperanza-50  /* Fondos de éxito */
text-esperanza-700 /* Texto de éxito */
bg-esperanza-600 /* Botones secundarios */

/* Alerta (Rojos/Naranjas) */
bg-alerta-50  /* Fondos de error */
text-alerta-700 /* Texto de error */
bg-alerta-600 /* Botones de peligro */

/* Calidez (Amarillos) */
bg-calidez-50  /* Fondos de advertencia */
text-calidez-700 /* Texto de advertencia */

/* Serenidad (Morados) */
bg-serenidad-50  /* Fondos alternativos */
text-serenidad-700 /* Texto alternativo */
```

---

## Mejores Prácticas

### 1. Siempre Incluir ARIA Labels
```tsx
// ❌ Mal
<button onClick={handleClick}>
  <XIcon />
</button>

// ✅ Bien
<button onClick={handleClick} aria-label="Cerrar">
  <XIcon aria-hidden="true" />
</button>
```

### 2. No Depender Solo de Color
```tsx
// ❌ Mal
<div className="bg-red-500">Error</div>

// ✅ Bien
<div className="bg-alerta-50 border-2 border-alerta-500">
  <ExclamationCircleIcon className="text-alerta-600" />
  <span>Error</span>
</div>
```

### 3. Focus Visible
```tsx
// ✅ Siempre incluir
className="focus:outline-none focus:ring-2 focus:ring-calma-500"
```

### 4. Touch Targets
```tsx
// ✅ Mínimo 44x44px
className="min-h-[44px] min-w-[44px] p-3"
```

### 5. Respetar Preferencias de Usuario
```tsx
const prefersReducedMotion = usePrefersReducedMotion();

<motion.div
  animate={{ opacity: 1 }}
  transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
/>
```

---

## Recursos Adicionales

- **Figma Design System**: (Próximamente)
- **Storybook**: (Próximamente)
- **Tests E2E**: Ver `e2e/` directory
- **Guía de Accesibilidad**: `GUIA_TESTING_ACCESIBILIDAD.md`

---

**Última actualización**: 20 de octubre de 2025
**Versión**: 1.0.0
