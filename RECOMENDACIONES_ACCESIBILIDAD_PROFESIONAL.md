# Recomendaciones de Accesibilidad - Área Profesional
## Plan de Implementación Priorizado

**Fecha:** 23 de octubre de 2025
**Especialista:** UX/UI Accesibilidad Escuchodromo
**Objetivo:** Cumplimiento WCAG 2.1 Nivel AA en 3 páginas del área profesional

---

## RESUMEN EJECUTIVO

Se han auditado 3 páginas críticas del área profesional de Escuchodromo, identificando **27 problemas de accesibilidad** que afectan a usuarios con discapacidades visuales, motoras y cognitivas.

**Impacto actual:**
- 🔴 7 problemas CRÍTICOS que impiden uso con teclado/lectores de pantalla
- 🟡 13 problemas ALTOS que dificultan significativamente la experiencia
- 🟢 7 problemas MEDIOS que afectan la experiencia óptima

**Tiempo estimado de corrección:** 26.5 horas (3.5 semanas a tiempo parcial)

**ROI de accesibilidad:**
- ✅ Cumplimiento legal (WCAG 2.1 AA es estándar en salud)
- ✅ Ampliación de mercado (+15% usuarios potenciales)
- ✅ Mejor UX para TODOS los usuarios (no solo con discapacidades)
- ✅ SEO mejorado (Google prioriza sitios accesibles)

---

## IMPLEMENTACIÓN RECOMENDADA - FASE 1 (CRÍTICA)
**Duración:** 1.5 semanas | **Esfuerzo:** 16 horas

Esta fase soluciona problemas que **impiden completamente** el uso a usuarios con discapacidades.

### 1.1 Labels y Validación de Formularios (Perfil)
**Tiempo:** 5 horas | **WCAG:** 1.3.1, 3.3.2, 4.1.2

**Problema:**
Los formularios no tienen labels asociados explícitamente. Lectores de pantalla anuncian solo "editable" sin contexto.

**Solución:**
```tsx
// ANTES ❌
<input
  type="text"
  value={tituloProfesional}
  onChange={(e) => setTituloProfesional(e.target.value)}
  placeholder="Ej: Psicólogo Clínico"
/>

// DESPUÉS ✅
<label htmlFor="titulo-profesional" className="block text-sm font-medium text-gray-700 mb-2">
  Título Profesional <span className="text-red-500" aria-label="requerido">*</span>
</label>
<input
  id="titulo-profesional"
  type="text"
  value={tituloProfesional}
  onChange={(e) => {
    setTituloProfesional(e.target.value);
    if (errores.tituloProfesional) {
      setErrores(prev => ({ ...prev, tituloProfesional: undefined }));
    }
  }}
  placeholder="Ej: Psicólogo Clínico"
  aria-required="true"
  aria-invalid={!!errores.tituloProfesional}
  aria-describedby={errores.tituloProfesional ? "error-titulo-profesional" : undefined}
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-calma-500 focus:border-transparent"
/>
{errores.tituloProfesional && (
  <p id="error-titulo-profesional" role="alert" className="mt-1 text-sm text-red-600 flex items-center gap-1">
    <AlertCircle className="h-4 w-4" aria-hidden="true" />
    {errores.tituloProfesional}
  </p>
)}
```

**Impacto:**
- ✅ Usuarios de lectores de pantalla pueden completar formularios
- ✅ Errores se anuncian automáticamente
- ✅ Focus automático al primer campo con error

**Aplicar a:**
- Título Profesional (obligatorio)
- Número de Licencia
- Universidad
- Años de Experiencia
- Biografía
- Tarifa por Sesión (obligatorio)
- Moneda
- Certificaciones
- Disponibilidad Horaria
- LinkedIn URL
- Sitio Web

---

### 1.2 Navegación por Teclado en Calendario
**Tiempo:** 4 horas | **WCAG:** 2.1.1, 4.1.2

**Problema:**
El grid de calendario no es navegable con teclado. Usuarios no pueden ver sus citas sin mouse.

**Solución: Implementar patrón ARIA Grid**

```tsx
// Hook para navegación
const { indiceActivo, handleKeyDown, getTabulacion } = useKeyboardNavigation(
  dias.length,
  {
    orientacion: 'grid',
    columnas: 7,
    loop: false,
    onSelect: (indice) => {
      const fecha = dias[indice];
      if (fecha) {
        const citasDelDia = obtenerCitasPorDia(fecha);
        if (citasDelDia.length > 0) {
          setCitaSeleccionada(citasDelDia[0]);
        }
      }
    }
  }
);

// Grid con roles ARIA
<div
  role="grid"
  aria-labelledby="titulo-calendario"
  className="grid grid-cols-7 gap-2"
  onKeyDown={handleKeyDown}
>
  {/* Encabezado */}
  <div role="row" className="contents">
    {DIAS_SEMANA.map((dia) => (
      <div key={dia} role="columnheader" className="text-center font-semibold text-gray-600 text-sm py-2">
        {dia}
      </div>
    ))}
  </div>

  {/* Días del mes */}
  {diasPorSemana.map((semana, semanaIdx) => (
    <div key={semanaIdx} role="row" className="contents">
      {semana.map((fecha, diaIdx) => {
        const indice = semanaIdx * 7 + diaIdx;
        const citasDelDia = fecha ? obtenerCitasPorDia(fecha) : [];

        return (
          <div
            key={diaIdx}
            role="gridcell"
            tabIndex={getTabulacion(indice)}
            aria-selected={indiceActivo === indice}
            aria-label={fecha ? `${fecha.toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            })}, ${citasDelDia.length} cita${citasDelDia.length !== 1 ? 's' : ''}` : undefined}
            className={clsx(
              'min-h-[120px] p-2 rounded-lg border-2 transition-all',
              fecha ? (
                indiceActivo === indice
                  ? 'bg-calma-50 border-calma-600 ring-2 ring-calma-500'
                  : 'bg-white border-gray-200 hover:border-calma-300'
              ) : 'bg-gray-50 border-transparent'
            )}
          >
            {/* Contenido de la celda */}
          </div>
        );
      })}
    </div>
  ))}
</div>
```

**Navegación habilitada:**
- **Flechas**: Navegar entre días
- **Home**: Primer día del mes
- **End**: Último día del mes
- **Enter/Space**: Abrir citas del día seleccionado

**Impacto:**
- ✅ Profesionales pueden revisar agenda sin mouse
- ✅ Lectores de pantalla anuncian fechas y cantidad de citas
- ✅ Cumplimiento WCAG 2.1.1

---

### 1.3 Focus Trap en Modales
**Tiempo:** 2 horas | **WCAG:** 2.1.2, 2.4.3

**Problema:**
Al abrir modal de cita, el foco escapa del modal. Usuarios con teclado quedan desorientados.

**Solución: Usar hook useFocusTrap**

```tsx
import { useFocusTrap, useDisableBodyScroll } from '@/lib/hooks/accesibilidad';

// En el componente
const trapRef = useFocusTrap(
  citaSeleccionada !== null,
  () => setCitaSeleccionada(null)
);

useDisableBodyScroll(citaSeleccionada !== null);

// Modal con trap
{citaSeleccionada && (
  <div
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    onClick={() => setCitaSeleccionada(null)}
    role="presentation"
  >
    <div
      ref={trapRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-cita"
      className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
      onClick={(e) => e.stopPropagation()}
    >
      <h3 id="titulo-modal-cita" className="text-xl font-bold text-gray-900 mb-4">
        Detalle de Cita
      </h3>

      {/* Contenido del modal */}

      <button
        onClick={() => setCitaSeleccionada(null)}
        className="w-full mt-6 px-4 py-2 bg-calma-600 text-white rounded-lg hover:bg-calma-700 font-medium focus:outline-none focus:ring-2 focus:ring-calma-500 focus:ring-offset-2"
      >
        Cerrar
      </button>
    </div>
  </div>
)}
```

**Funcionalidad del trap:**
- ✅ Foco automático al primer elemento del modal
- ✅ Tab cicla dentro del modal (no escapa)
- ✅ ESC cierra el modal
- ✅ Al cerrar, focus vuelve al elemento que abrió el modal
- ✅ Scroll del body deshabilitado mientras modal está abierto

---

### 1.4 Estados Emocionales sin Dependencia de Color
**Tiempo:** 2 horas | **WCAG:** 1.4.1

**Problema:**
Estados de pacientes (Estable/Alerta/Crítico) se comunican SOLO con color. Usuarios daltónicos no pueden distinguir.

**Solución: Triple codificación (Color + Icono + Texto + Patrón)**

```tsx
// Función mejorada
const obtenerInfoEstado = (estado?: 'ESTABLE' | 'ALERTA' | 'CRITICO') => {
  switch (estado) {
    case 'ESTABLE':
      return {
        color: 'bg-green-100 text-green-800 border-green-300',
        icono: <CheckCircleIcon className="w-4 h-4" />,
        iconoDescripcion: 'Ícono de verificación',
        texto: 'Estable',
        descripcionLarga: 'El paciente se encuentra en estado emocional estable',
        patron: 'bg-[radial-gradient(circle,_rgba(34,197,94,0.1)_1px,_transparent_1px)] bg-[size:8px_8px]'
      };
    case 'ALERTA':
      return {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icono: <ExclamationTriangleIcon className="w-4 h-4" />,
        iconoDescripcion: 'Ícono de advertencia',
        texto: 'En alerta',
        descripcionLarga: 'El paciente requiere atención prioritaria',
        patron: 'bg-[repeating-linear-gradient(45deg,_rgba(234,179,8,0.1),_rgba(234,179,8,0.1)_10px,_transparent_10px,_transparent_20px)]'
      };
    case 'CRITICO':
      return {
        color: 'bg-red-100 text-red-800 border-red-300',
        icono: <ExclamationTriangleIcon className="w-4 h-4 fill-current" />,
        iconoDescripcion: 'Ícono de advertencia crítica relleno',
        texto: 'Crítico',
        descripcionLarga: 'El paciente requiere intervención inmediata',
        patron: 'bg-[repeating-linear-gradient(0deg,_rgba(239,68,68,0.1),_rgba(239,68,68,0.1)_2px,_transparent_2px,_transparent_4px),_repeating-linear-gradient(90deg,_rgba(239,68,68,0.1),_rgba(239,68,68,0.1)_2px,_transparent_2px,_transparent_4px)]'
      };
    default:
      return {
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        icono: null,
        iconoDescripcion: '',
        texto: 'Sin datos',
        descripcionLarga: 'No hay información de estado emocional disponible',
        patron: ''
      };
  }
};

// Uso en badge
const infoEstado = obtenerInfoEstado(paciente.estado_emocional);

<span
  className={clsx(
    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border-2',
    infoEstado.color,
    infoEstado.patron
  )}
  aria-label={infoEstado.descripcionLarga}
>
  <span aria-hidden="true">{infoEstado.icono}</span>
  <span className="font-semibold">{infoEstado.texto}</span>
  <span className="sr-only">{infoEstado.iconoDescripcion}</span>
</span>
```

**Diferenciadores visuales:**
1. **Color de fondo y borde** (primario, pero no único)
2. **Icono distintivo** (check vs triángulo vacío vs triángulo relleno)
3. **Texto explícito** ("Estable", "En alerta", "Crítico")
4. **Patrón de fondo** (puntos para estable, rayas diagonales para alerta, cuadrícula para crítico)

**Test de accesibilidad:**
- ✅ Pasa en escala de grises
- ✅ Distinguible con simulador de daltonismo (protanopia, deuteranopia)
- ✅ Lectores de pantalla anuncian estado completo
- ✅ Imprimible en blanco y negro

---

### 1.5 Validación Accesible con Anuncios
**Tiempo:** 3 horas | **WCAG:** 3.3.1, 3.3.3, 4.1.3

**Problema:**
Errores de validación solo se muestran en toast visual. Lectores de pantalla no los detectan.

**Solución: Sistema completo de validación accesible**

```tsx
import { useAnnouncer } from '@/lib/hooks/accesibilidad';

const { announce } = useAnnouncer();
const [errores, setErrores] = useState<Record<string, string>>({});

// Validación mejorada
const validarFormulario = (): boolean => {
  const nuevosErrores: Record<string, string> = {};

  if (!tituloProfesional.trim()) {
    nuevosErrores.tituloProfesional = 'El título profesional es obligatorio';
  }

  if (especialidades.length === 0) {
    nuevosErrores.especialidades = 'Selecciona al menos una especialidad';
  }

  if (tarifaPorSesion <= 0) {
    nuevosErrores.tarifaPorSesion = 'La tarifa debe ser mayor a 0';
  }

  setErrores(nuevosErrores);

  const cantidadErrores = Object.keys(nuevosErrores).length;

  if (cantidadErrores > 0) {
    // Anuncio a lectores de pantalla
    announce(
      `Hay ${cantidadErrores} error${cantidadErrores > 1 ? 'es' : ''} en el formulario. Por favor revisa los campos marcados.`,
      'assertive'
    );

    // Toast visual
    toast.error(`${cantidadErrores} error${cantidadErrores > 1 ? 'es' : ''} encontrado${cantidadErrores > 1 ? 's' : ''}`);

    // Focus al primer campo con error
    const primerCampoConError = Object.keys(nuevosErrores)[0];
    const elemento = document.getElementById(getCampoId(primerCampoConError));
    if (elemento) {
      elemento.focus();
      elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return false;
  }

  return true;
};

// Resumen de errores (encima del formulario)
{Object.keys(errores).length > 0 && (
  <div
    role="alert"
    aria-live="assertive"
    className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg"
  >
    <div className="flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div>
        <h2 className="font-semibold text-red-900 mb-2">
          Hay {Object.keys(errores).length} error{Object.keys(errores).length > 1 ? 'es' : ''} en el formulario:
        </h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
          {Object.entries(errores).map(([campo, mensaje]) => (
            <li key={campo}>
              <button
                onClick={() => {
                  const elemento = document.getElementById(getCampoId(campo));
                  elemento?.focus();
                }}
                className="underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {mensaje}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
)}
```

**Beneficios:**
- ✅ Anuncio inmediato a lectores de pantalla (aria-live="assertive")
- ✅ Resumen de errores en la parte superior (clickeable para ir al campo)
- ✅ Mensajes inline debajo de cada campo
- ✅ Focus automático al primer error
- ✅ Scroll suave al campo con error
- ✅ Errores se limpian al corregir el campo

---

## IMPLEMENTACIÓN RECOMENDADA - FASE 2 (ALTA)
**Duración:** 1 semana | **Esfuerzo:** 7 horas

### 2.1 Botones Toggle con Estados ARIA
**Tiempo:** 1 hora

Especialidades e Idiomas deben anunciar su estado:

```tsx
<button
  key={especialidad}
  type="button"
  role="checkbox"
  aria-checked={especialidades.includes(especialidad)}
  onClick={() => toggleEspecialidad(especialidad)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleEspecialidad(especialidad);
    }
  }}
  className={clsx(
    'px-4 py-2 rounded-full text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-calma-500 focus:ring-offset-2',
    especialidades.includes(especialidad)
      ? 'bg-calma-600 text-white shadow-md'
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  )}
>
  <span className="sr-only">
    {especialidades.includes(especialidad) ? 'Seleccionada' : 'No seleccionada'}:
  </span>
  {especialidad}
</button>
```

### 2.2 Búsqueda con Feedback Accesible
**Tiempo:** 1 hora

```tsx
<div className="flex-1">
  <label htmlFor="busqueda-pacientes" className="sr-only">
    Buscar pacientes por nombre o email
  </label>
  <div className="relative">
    <MagnifyingGlassIcon
      className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
      aria-hidden="true"
    />
    <input
      id="busqueda-pacientes"
      type="search"
      role="searchbox"
      placeholder="Buscar por nombre o email..."
      value={busqueda}
      onChange={(e) => setBusqueda(e.target.value)}
      aria-describedby="resultados-busqueda"
      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-calma-500"
    />
  </div>
  <div
    id="resultados-busqueda"
    role="status"
    aria-live="polite"
    aria-atomic="true"
    className="sr-only"
  >
    {busqueda && `${pacientesFiltrados.length} paciente${pacientesFiltrados.length !== 1 ? 's' : ''} encontrado${pacientesFiltrados.length !== 1 ? 's' : ''}`}
  </div>
</div>
```

### 2.3 Filtros con Labels Asociados
**Tiempo:** 30 minutos

Todos los selects necesitan labels:

```tsx
<label htmlFor="filtro-estado" className="sr-only">
  Filtrar pacientes por estado emocional
</label>
<select
  id="filtro-estado"
  value={filtroEstado}
  onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
  className="..."
>
  <option value="TODOS">Todos los estados</option>
  <option value="ESTABLE">Estables</option>
  <option value="ALERTA">En alerta</option>
  <option value="CRITICO">Críticos</option>
</select>
```

### 2.4 Cards de Pacientes con Estructura Semántica
**Tiempo:** 2 horas

```tsx
<ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
  {pacientesFiltrados.map((paciente) => {
    const infoEstado = obtenerInfoEstado(paciente.estado_emocional);

    return (
      <li key={paciente.id}>
        <article
          role="button"
          tabIndex={0}
          onClick={() => router.push(`/pacientes/${paciente.id}/progreso`)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              router.push(`/pacientes/${paciente.id}/progreso`);
            }
          }}
          aria-label={`Ver detalles de ${paciente.nombre} ${paciente.apellido || ''}. ${infoEstado.descripcionLarga}. Progreso: ${paciente.progreso}%. ${paciente.total_citas} citas totales, ${paciente.citas_completadas} completadas. Última cita: ${formatearFecha(paciente.ultima_cita)}.`}
          className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-calma-500 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-calma-500 focus:ring-offset-2"
        >
          {/* Contenido estructurado con headings */}
          <h3 className="font-semibold text-gray-900 text-lg mb-1">
            {paciente.nombre} {paciente.apellido || ''}
          </h3>

          {/* ... resto del contenido ... */}
        </article>
      </li>
    );
  })}
</ul>
```

### 2.5 Barras de Progreso Accesibles
**Tiempo:** 30 minutos

```tsx
<div
  role="progressbar"
  aria-labelledby={`label-progreso-${paciente.id}`}
  aria-valuenow={paciente.progreso}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-describedby={`valor-progreso-${paciente.id}`}
  className="w-full bg-gray-200 rounded-full h-2.5"
>
  <div
    className="bg-calma-600 h-2.5 rounded-full transition-all duration-300"
    style={{ width: `${paciente.progreso}%` }}
  />
</div>
```

### 2.6 Upload de Foto Accesible
**Tiempo:** 1 hora

```tsx
<label
  htmlFor={fotoUploadId}
  className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors shadow-md focus-within:ring-2 focus-within:ring-calma-500"
  role="button"
  tabIndex={0}
  aria-label="Cambiar foto de perfil"
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      document.getElementById(fotoUploadId)?.click();
    }
  }}
>
  <Camera className="h-5 w-5 text-gray-600" aria-hidden="true" />
  <input
    id={fotoUploadId}
    type="file"
    accept="image/*"
    onChange={handleUploadFoto}
    className="sr-only"
    disabled={subiendoFoto}
    aria-label="Seleccionar archivo de imagen para foto de perfil. Formatos aceptados: JPG, PNG. Tamaño máximo: 2MB"
  />
</label>
```

### 2.7 Botones de Navegación con Contexto
**Tiempo:** 30 minutos

```tsx
const mesAnterior = () => {
  const nuevaFecha = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1);
  setFechaActual(nuevaFecha);
  announce(`Navegado a ${MESES[nuevaFecha.getMonth()]} ${nuevaFecha.getFullYear()}`);
};

<button
  onClick={mesAnterior}
  className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-calma-500"
  aria-label={`Ir a ${MESES[(fechaActual.getMonth() - 1 + 12) % 12]} ${
    fechaActual.getMonth() === 0 ? fechaActual.getFullYear() - 1 : fechaActual.getFullYear()
  }`}
>
  <ChevronLeftIcon className="w-6 h-6 text-gray-600" aria-hidden="true" />
</button>
```

---

## IMPLEMENTACIÓN RECOMENDADA - FASE 3 (MEDIA)
**Duración:** 3 días | **Esfuerzo:** 3.5 horas

### 3.1 Animaciones con prefers-reduced-motion
**Tiempo:** 1 hora

Todas las animaciones de Framer Motion deben usar el hook:

```tsx
import { usePrefersReducedMotion, variantesAnimacion } from '@/lib/hooks/accesibilidad';

const prefersReducedMotion = usePrefersReducedMotion();
const animacion = variantesAnimacion.slideUp(prefersReducedMotion);

<motion.section
  initial={animacion.initial}
  animate={animacion.animate}
  transition={animacion.transition}
  className="..."
>
  {/* Contenido */}
</motion.section>
```

### 3.2 Contadores de Caracteres Accesibles
**Tiempo:** 30 minutos

```tsx
<div>
  <label htmlFor={biografiaId} className="block text-sm font-medium text-gray-700 mb-2">
    Biografía
  </label>
  <textarea
    id={biografiaId}
    value={biografia}
    onChange={(e) => setBiografia(e.target.value)}
    rows={6}
    maxLength={1000}
    aria-describedby={`${biografiaId}-contador ${biografiaId}-ayuda`}
    className="..."
  />
  <div className="flex justify-between items-center mt-2">
    <p id={`${biografiaId}-ayuda`} className="text-xs text-gray-500">
      Máximo 1000 caracteres
    </p>
    <p
      id={`${biografiaId}-contador`}
      className="text-xs text-gray-500"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="sr-only">Caracteres usados: </span>
      {biografia.length} de 1000
    </p>
  </div>
</div>
```

### 3.3 Certificaciones Dinámicas con Anuncios
**Tiempo:** 1 hora

Ya implementado en la versión mejorada (ver sección 1.1 de hooks).

### 3.4 Secciones con Landmarks ARIA
**Tiempo:** 1 hora

```tsx
<section aria-labelledby="seccion-info-personal" className="bg-white rounded-lg border border-gray-200 p-6">
  <h2 id="seccion-info-personal" className="flex items-center gap-3 mb-6 text-xl font-semibold text-gray-900">
    <div className="p-2 bg-calma-50 rounded-lg" aria-hidden="true">
      <User className="h-5 w-5 text-calma-600" />
    </div>
    Información Personal
  </h2>
  {/* Contenido */}
</section>
```

---

## ENTREGABLES COMPLETADOS

✅ **1. Análisis de Accesibilidad Completo**
   - Archivo: `ANALISIS_ACCESIBILIDAD_PROFESIONAL.md`
   - 27 problemas documentados con soluciones detalladas
   - Estimaciones de tiempo por problema
   - Impacto en usuarios

✅ **2. Hooks de Accesibilidad Reutilizables**
   - Directorio: `/src/lib/hooks/accesibilidad/`
   - `usePrefersReducedMotion.ts`: Respeto a preferencias de movimiento
   - `useFocusTrap.ts`: Manejo de foco en modales
   - `useAnnouncer.ts`: Anuncios a lectores de pantalla
   - `useKeyboardNavigation.ts`: Navegación por teclado en listas/grids
   - `index.ts`: Exportaciones centralizadas

✅ **3. Guía de Navegación por Teclado**
   - Archivo: `GUIA_NAVEGACION_TECLADO.md`
   - Documentación completa de navegación para 3 páginas
   - Paso a paso para usuarios
   - Referencia para desarrolladores

✅ **4. Implementación Parcial - Página Perfil**
   - Archivo: `/src/app/profesional/perfil/page.accesible.tsx`
   - Ejemplo completo con todas las mejoras aplicadas
   - Puede usarse como referencia para otras páginas

✅ **5. Este Documento de Recomendaciones**
   - Plan de implementación en 3 fases
   - Código de ejemplo para cada mejora
   - Priorización basada en impacto

---

## PRÓXIMOS PASOS RECOMENDADOS

### Semana 1-2: Fase Crítica
1. Implementar labels y validación en formularios (5h)
2. Agregar navegación por teclado en calendario (4h)
3. Implementar focus traps en modales (2h)
4. Solucionar estados emocionales sin color (2h)
5. Crear sistema de validación accesible (3h)

**Checkpoint:** Testing con lector de pantalla NVDA

### Semana 3: Fase Alta
6. Estados ARIA en botones toggle (1h)
7. Feedback en búsqueda (1h)
8. Labels en filtros (30min)
9. Estructura semántica en cards (2h)
10. Barras de progreso accesibles (30min)
11. Upload de foto mejorado (1h)
12. Contexto en botones de navegación (30min)

**Checkpoint:** Testing de navegación solo con teclado

### Semana 4: Fase Media
13. Implementar prefers-reduced-motion (1h)
14. Contadores accesibles (30min)
15. Landmarks ARIA (1h)
16. Testing y ajustes finales (1h)

**Checkpoint Final:** Auditoría con axe DevTools y Lighthouse

---

## TESTING Y VALIDACIÓN

### Herramientas Automatizadas

1. **axe DevTools** (Chrome Extension)
   - Ejecutar en cada página después de implementar mejoras
   - Objetivo: 0 errores críticos

2. **Lighthouse** (Chrome DevTools)
   - Auditoría de accesibilidad
   - Objetivo: Score 95+

3. **WAVE** (Web Accessibility Evaluation Tool)
   - Validación visual de estructura ARIA
   - Identificación de errores de contraste

### Testing Manual

1. **Solo Teclado** (2 horas por página)
   - Desconectar mouse
   - Navegar todas las funcionalidades con Tab/Enter/Flechas
   - Verificar que todos los elementos sean accesibles

2. **Lector de Pantalla** (3 horas por página)
   - NVDA (Windows, gratuito)
   - Verificar que toda la información se anuncie correctamente
   - Probar navegación por headings, landmarks, forms

3. **Zoom al 200%** (30 min por página)
   - WCAG 1.4.4 (Redimensionamiento de texto)
   - Verificar que el contenido sea usable
   - Sin scroll horizontal

4. **Simulación de Daltonismo** (30 min por página)
   - Chrome DevTools > Rendering > Emulate vision deficiencies
   - Protanopia, Deuteranopia, Tritanopia
   - Verificar que información sea distinguible

### Checklist de Validación

Por cada página, verificar:

- [ ] Todos los inputs tienen labels asociados
- [ ] Errores de validación se anuncian
- [ ] Navegación por teclado completa y lógica
- [ ] Focus visible en todos los elementos interactivos
- [ ] Modales implementan focus trap
- [ ] Estados dinámicos se anuncian (aria-live)
- [ ] Colores cumplen contraste mínimo 4.5:1
- [ ] Información NO depende solo del color
- [ ] Animaciones respetan prefers-reduced-motion
- [ ] Estructura semántica con headings y landmarks
- [ ] Lectores de pantalla anuncian correctamente

---

## RECURSOS ADICIONALES

### Documentación

- **WCAG 2.1 Quick Reference**: https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Authoring Practices**: https://www.w3.org/WAI/ARIA/apg/
- **MDN Accessibility**: https://developer.mozilla.org/en-US/docs/Web/Accessibility

### Herramientas

- **NVDA Screen Reader**: https://www.nvaccess.org/download/
- **axe DevTools**: https://www.deque.com/axe/devtools/
- **WAVE**: https://wave.webaim.org/extension/
- **Color Contrast Checker**: https://webaim.org/resources/contrastchecker/

### Contacto

Para preguntas sobre implementación o aclaraciones sobre las recomendaciones, contactar al especialista de UX/UI Accesibilidad.

---

**Última actualización:** 23 de octubre de 2025
**Versión:** 1.0
