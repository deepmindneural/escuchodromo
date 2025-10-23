# Análisis de Accesibilidad - Área Profesional
## Escuchodromo - Especialista UX/UI Accesibilidad

**Fecha:** 23 de octubre de 2025
**Páginas auditadas:**
1. `/profesional/perfil` - Perfil del Profesional
2. `/profesional/calendario` - Calendario de Citas
3. `/profesional/pacientes` - Gestión de Pacientes

**Estándar:** WCAG 2.1 Nivel AA (mínimo)
**Contexto:** Interfaz para profesionales de salud mental que gestionan pacientes en estados vulnerables

---

## 1. PERFIL DEL PROFESIONAL (`/profesional/perfil/page.tsx`)

### Problemas Críticos de Accesibilidad

#### 1.1 Formularios sin labels explícitos asociados
**Severidad:** CRÍTICA
**WCAG:** 1.3.1, 3.3.2, 4.1.2

**Problema:**
```tsx
// Líneas 435-441
<input
  type="text"
  value={tituloProfesional}
  onChange={(e) => setTituloProfesional(e.target.value)}
  placeholder="Ej: Psicólogo Clínico"
  className="..."
/>
```

Los inputs NO tienen el atributo `id` ni están asociados con `<label htmlFor="...">`. Los lectores de pantalla no pueden anunciar correctamente qué campo se está editando.

**Impacto:**
- Usuarios de lectores de pantalla no saben qué campo están completando
- Imposible navegar eficientemente con tecnologías asistivas
- Falla automática en validadores WCAG

**Solución:**
```tsx
<label htmlFor="titulo-profesional" className="block text-sm font-medium text-gray-700 mb-2">
  Título Profesional <span className="text-red-500">*</span>
</label>
<input
  id="titulo-profesional"
  type="text"
  value={tituloProfesional}
  onChange={(e) => setTituloProfesional(e.target.value)}
  placeholder="Ej: Psicólogo Clínico"
  aria-required="true"
  aria-invalid={!tituloProfesional.trim()}
  className="..."
/>
```

#### 1.2 Validación de errores sin anuncios accesibles
**Severidad:** CRÍTICA
**WCAG:** 3.3.1, 3.3.3

**Problema:**
```tsx
// Líneas 228-236
if (!tituloProfesional.trim()) {
  toast.error('El título profesional es obligatorio');
  return;
}
```

Los errores solo se muestran en toast visual. No hay:
- `aria-live` region para anunciar errores
- Mensajes de error inline debajo de campos
- Focus automático al primer campo con error

**Impacto:**
- Usuarios de lectores de pantalla pierden mensajes críticos
- Usuarios con discapacidades cognitivas no ven relación campo-error
- Frustración y abandono del formulario

**Solución:**
```tsx
// Estado de errores
const [errores, setErrores] = useState<Record<string, string>>({});

// Validación con errores inline
if (!tituloProfesional.trim()) {
  setErrores(prev => ({ ...prev, tituloProfesional: 'El título profesional es obligatorio' }));
  document.getElementById('titulo-profesional')?.focus();
  return;
}

// UI
<div>
  <label htmlFor="titulo-profesional">...</label>
  <input
    id="titulo-profesional"
    aria-invalid={!!errores.tituloProfesional}
    aria-describedby={errores.tituloProfesional ? "error-titulo" : undefined}
    ...
  />
  {errores.tituloProfesional && (
    <p id="error-titulo" role="alert" className="mt-1 text-sm text-red-600">
      {errores.tituloProfesional}
    </p>
  )}
</div>
```

#### 1.3 Botones de toggle sin estados ARIA
**Severidad:** ALTA
**WCAG:** 4.1.2

**Problema:**
```tsx
// Líneas 499-511
<button
  key={esp}
  type="button"
  onClick={() => toggleEspecialidad(esp)}
  className={...}
>
  {esp}
</button>
```

Botones de especialidades/idiomas no comunican su estado (seleccionado/no seleccionado) a tecnologías asistivas.

**Impacto:**
- Usuarios de lectores de pantalla no saben qué especialidades están seleccionadas
- Confusión sobre el estado del formulario

**Solución:**
```tsx
<button
  key={esp}
  type="button"
  role="checkbox"
  aria-checked={especialidades.includes(esp)}
  onClick={() => toggleEspecialidad(esp)}
  className={...}
>
  <span className="sr-only">
    {especialidades.includes(esp) ? 'Seleccionada' : 'No seleccionada'}:
  </span>
  {esp}
</button>
```

#### 1.4 Upload de foto sin accesibilidad
**Severidad:** ALTA
**WCAG:** 2.1.1, 4.1.2

**Problema:**
```tsx
// Líneas 393-406
<label
  htmlFor="foto-upload"
  className="... cursor-pointer"
>
  <Camera className="h-5 w-5 text-gray-600" />
  <input
    id="foto-upload"
    type="file"
    accept="image/*"
    onChange={handleUploadFoto}
    className="hidden"
    disabled={subiendoFoto}
  />
</label>
```

El botón de cámara:
- No tiene texto descriptivo (solo icono)
- No anuncia el propósito al usuario
- No indica que es un botón clickeable

**Solución:**
```tsx
<label
  htmlFor="foto-upload"
  className="... cursor-pointer"
  aria-label="Cambiar foto de perfil"
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      document.getElementById('foto-upload')?.click();
    }
  }}
>
  <Camera className="h-5 w-5 text-gray-600" aria-hidden="true" />
  <span className="sr-only">Cambiar foto de perfil</span>
  <input
    id="foto-upload"
    type="file"
    accept="image/*"
    onChange={handleUploadFoto}
    className="hidden"
    disabled={subiendoFoto}
    aria-label="Seleccionar archivo de imagen para foto de perfil"
  />
</label>
```

#### 1.5 Estados de carga sin contexto
**Severidad:** MEDIA
**WCAG:** 4.1.3

**Problema:**
```tsx
// Líneas 278-287
if (cargando) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-calma-600 mx-auto mb-4" />
        <p className="text-gray-600">Cargando perfil...</p>
      </div>
    </div>
  );
}
```

El spinner no tiene `role="status"` ni `aria-live` para anunciar el estado de carga.

**Solución:**
```tsx
if (cargando) {
  return (
    <div
      className="flex items-center justify-center min-h-[60vh]"
      role="status"
      aria-live="polite"
      aria-label="Cargando perfil profesional"
    >
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-calma-600 mx-auto mb-4" aria-hidden="true" />
        <p className="text-gray-600">Cargando perfil...</p>
      </div>
    </div>
  );
}
```

#### 1.6 Textarea sin contador de caracteres accesible
**Severidad:** MEDIA
**WCAG:** 1.3.1, 4.1.2

**Problema:**
```tsx
// Líneas 528-543
<textarea
  value={biografia}
  onChange={(e) => setBiografia(e.target.value)}
  placeholder="..."
  rows={6}
  maxLength={1000}
  className="..."
/>
<div className="flex justify-between items-center mt-2">
  <p className="text-xs text-gray-500">Máximo 1000 caracteres</p>
  <p className="text-xs text-gray-500">{biografia.length}/1000</p>
</div>
```

El contador visual no se anuncia a lectores de pantalla mientras el usuario escribe.

**Solución:**
```tsx
<div>
  <label htmlFor="biografia" className="...">Biografía</label>
  <textarea
    id="biografia"
    value={biografia}
    onChange={(e) => setBiografia(e.target.value)}
    placeholder="..."
    rows={6}
    maxLength={1000}
    aria-describedby="biografia-contador biografia-ayuda"
    className="..."
  />
  <div className="flex justify-between items-center mt-2">
    <p id="biografia-ayuda" className="text-xs text-gray-500">
      Máximo 1000 caracteres
    </p>
    <p
      id="biografia-contador"
      className="text-xs text-gray-500"
      aria-live="polite"
      aria-atomic="true"
    >
      {biografia.length}/1000 caracteres
    </p>
  </div>
</div>
```

#### 1.7 Certificaciones dinámicas sin anuncios
**Severidad:** MEDIA
**WCAG:** 4.1.3

**Problema:**
```tsx
// Líneas 206-213
const agregarCertificacion = () => {
  setCertificaciones([...certificaciones, '']);
};

const eliminarCertificacion = (index: number) => {
  const nuevas = certificaciones.filter((_, i) => i !== index);
  setCertificaciones(nuevas.length > 0 ? nuevas : ['']);
};
```

Agregar/eliminar certificaciones no anuncia el cambio a lectores de pantalla.

**Solución:**
```tsx
const agregarCertificacion = () => {
  setCertificaciones([...certificaciones, '']);
  toast.success('Campo de certificación agregado');
};

const eliminarCertificacion = (index: number) => {
  const nuevas = certificaciones.filter((_, i) => i !== index);
  setCertificaciones(nuevas.length > 0 ? nuevas : ['']);
  toast.success('Certificación eliminada');
};

// UI con región live
<div aria-live="polite" aria-atomic="false">
  {certificaciones.map((cert, index) => (
    <div key={index} className="flex gap-2">
      <label htmlFor={`cert-${index}`} className="sr-only">
        Certificación {index + 1}
      </label>
      <input
        id={`cert-${index}`}
        type="text"
        value={cert}
        onChange={(e) => actualizarCertificacion(index, e.target.value)}
        placeholder="Ej: Certificación en Terapia Cognitivo-Conductual"
        aria-label={`Certificación ${index + 1}`}
        className="..."
      />
      {certificaciones.length > 1 && (
        <Button
          type="button"
          variant="outline"
          onClick={() => eliminarCertificacion(index)}
          aria-label={`Eliminar certificación ${index + 1}`}
          className="..."
        >
          Eliminar
        </Button>
      )}
    </div>
  ))}
</div>
```

### Problemas de UX Terapéutica

#### 1.8 Animaciones sin respeto a preferencias de movimiento
**Severidad:** ALTA
**WCAG:** 2.3.3

**Problema:**
```tsx
// Líneas 372-376
<motion.section
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className="..."
>
```

Las animaciones de Framer Motion no verifican `prefers-reduced-motion`.

**Impacto:**
- Usuarios con discapacidades vestibulares pueden experimentar náuseas
- Usuarios con TDAH pueden distraerse

**Solución:**
```tsx
// Hook personalizado
const usePrefersReducedMotion = () => {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
};

// Uso en componente
const prefersReducedMotion = usePrefersReducedMotion();

<motion.section
  initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
  className="..."
>
```

#### 1.9 Secciones sin landmarks ARIA
**Severidad:** MEDIA
**WCAG:** 1.3.1

**Problema:**
Las secciones del formulario no tienen roles ARIA o elementos semánticos que permitan navegación rápida.

**Solución:**
```tsx
<section aria-labelledby="seccion-info-personal" className="...">
  <h2 id="seccion-info-personal" className="...">Información Personal</h2>
  ...
</section>

<section aria-labelledby="seccion-especialidades" className="...">
  <h2 id="seccion-especialidades" className="...">Especialidades</h2>
  ...
</section>
```

### Resumen de Mejoras Necesarias - Perfil

| Problema | Severidad | WCAG | Estimación |
|----------|-----------|------|------------|
| Labels de formulario | CRÍTICA | 1.3.1, 3.3.2 | 2h |
| Validación accesible | CRÍTICA | 3.3.1, 3.3.3 | 3h |
| Botones toggle sin estado | ALTA | 4.1.2 | 1h |
| Upload foto sin accesibilidad | ALTA | 2.1.1, 4.1.2 | 1h |
| Animaciones sin prefers-reduced-motion | ALTA | 2.3.3 | 1h |
| Estados de carga sin contexto | MEDIA | 4.1.3 | 30min |
| Contador caracteres no accesible | MEDIA | 1.3.1, 4.1.2 | 30min |
| Certificaciones dinámicas sin anuncios | MEDIA | 4.1.3 | 1h |
| Secciones sin landmarks | MEDIA | 1.3.1 | 30min |

**Total estimado:** 10.5 horas

---

## 2. CALENDARIO (`/profesional/calendario/page.tsx`)

### Problemas Críticos de Accesibilidad

#### 2.1 Grid de calendario sin navegación por teclado
**Severidad:** CRÍTICA
**WCAG:** 2.1.1, 4.1.2

**Problema:**
```tsx
// Líneas 287-338
<div className="grid grid-cols-7 gap-2">
  {dias.map((fecha, index) => {
    const citasDelDia = obtenerCitasPorDia(fecha);
    const esHoyDia = esHoy(fecha);

    return (
      <div key={index} className={clsx(...)}>
        {fecha && (
          <>
            <div className={clsx(...)}>{fecha.getDate()}</div>
            <div className="space-y-1">
              {citasDelDia.slice(0, 3).map((cita) => (
                <button
                  key={cita.id}
                  onClick={() => setCitaSeleccionada(cita)}
                  className="..."
                >
                  {formatearHora(cita.fecha_hora)} - {cita.paciente.nombre}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  })}
</div>
```

**Problemas:**
- Las celdas del calendario no son focuseables
- No hay navegación con flechas (arriba/abajo/izquierda/derecha)
- No hay atributos ARIA para grid de calendario
- Usuarios de teclado no pueden navegar las fechas

**Impacto:**
- Imposible usar el calendario sin mouse
- Usuarios de lectores de pantalla no pueden entender la estructura
- Fallo crítico de accesibilidad

**Solución:**
```tsx
// Implementar patrón ARIA Grid
<div
  role="grid"
  aria-labelledby="titulo-calendario"
  className="grid grid-cols-7 gap-2"
>
  {/* Encabezado */}
  <div role="row">
    {DIAS_SEMANA.map((dia) => (
      <div key={dia} role="columnheader" aria-label={dia}>
        {dia}
      </div>
    ))}
  </div>

  {/* Filas de días */}
  {diasPorSemana.map((semana, semanaIdx) => (
    <div key={semanaIdx} role="row">
      {semana.map((fecha, diaIdx) => (
        <div
          key={diaIdx}
          role="gridcell"
          tabIndex={esDiaSeleccionado(fecha) ? 0 : -1}
          aria-selected={esDiaSeleccionado(fecha)}
          aria-label={formatearFechaCompleta(fecha)}
          onKeyDown={(e) => manejarTecladoCalendario(e, fecha)}
          className="..."
        >
          {/* Contenido de la celda */}
        </div>
      ))}
    </div>
  ))}
</div>

// Handler de teclado
const manejarTecladoCalendario = (e: React.KeyboardEvent, fecha: Date) => {
  switch (e.key) {
    case 'ArrowLeft':
      e.preventDefault();
      navegarDia(fecha, -1);
      break;
    case 'ArrowRight':
      e.preventDefault();
      navegarDia(fecha, 1);
      break;
    case 'ArrowUp':
      e.preventDefault();
      navegarDia(fecha, -7);
      break;
    case 'ArrowDown':
      e.preventDefault();
      navegarDia(fecha, 7);
      break;
    case 'Enter':
    case ' ':
      e.preventDefault();
      seleccionarDia(fecha);
      break;
  }
};
```

#### 2.2 Modal sin focus trap
**Severidad:** CRÍTICA
**WCAG:** 2.1.2, 2.4.3

**Problema:**
```tsx
// Líneas 357-428
{citaSeleccionada && (
  <div
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    onClick={() => setCitaSeleccionada(null)}
  >
    <div
      className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="text-xl font-bold text-gray-900 mb-4">Detalle de Cita</h3>
      {/* ... contenido ... */}
      <button
        onClick={() => setCitaSeleccionada(null)}
        className="..."
      >
        Cerrar
      </button>
    </div>
  </div>
)}
```

**Problemas:**
- El focus no queda atrapado dentro del modal
- La tecla ESC no cierra el modal
- El focus no regresa al elemento que abrió el modal al cerrar
- No hay `role="dialog"` ni `aria-modal="true"`

**Impacto:**
- Usuarios de teclado pueden salir del modal sin querer
- Confusión sobre dónde está el focus
- Contenido inaccesible detrás del modal permanece accesible

**Solución:**
```tsx
// Hook para focus trap
const useFocusTrap = (isOpen: boolean) => {
  const firstFocusableRef = useRef<HTMLElement | null>(null);
  const lastFocusableRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      firstFocusableRef.current?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setCitaSeleccionada(null);
        }

        if (e.key === 'Tab') {
          const focusableElements = document.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        previousFocusRef.current?.focus();
      };
    }
  }, [isOpen]);

  return { firstFocusableRef, lastFocusableRef };
};

// Uso en modal
{citaSeleccionada && (
  <div
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    onClick={() => setCitaSeleccionada(null)}
    role="presentation"
    aria-hidden="true"
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-cita"
      className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
      onClick={(e) => e.stopPropagation()}
    >
      <h3 id="titulo-modal-cita" className="text-xl font-bold text-gray-900 mb-4">
        Detalle de Cita
      </h3>
      {/* ... contenido ... */}
      <button
        ref={firstFocusableRef}
        onClick={() => setCitaSeleccionada(null)}
        className="..."
      >
        Cerrar
      </button>
    </div>
  </div>
)}
```

#### 2.3 Botones de navegación sin labels descriptivos
**Severidad:** ALTA
**WCAG:** 2.4.4, 4.1.2

**Problema:**
```tsx
// Líneas 253-258
<button
  onClick={mesAnterior}
  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
  aria-label="Mes anterior"
>
  <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
</button>
```

El `aria-label` es correcto, pero falta contexto: ¿mes anterior a cuál?

**Solución:**
```tsx
<button
  onClick={mesAnterior}
  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
  aria-label={`Ir a ${MESES[(fechaActual.getMonth() - 1 + 12) % 12]} ${
    fechaActual.getMonth() === 0 ? fechaActual.getFullYear() - 1 : fechaActual.getFullYear()
  }`}
>
  <ChevronLeftIcon className="w-6 h-6 text-gray-600" aria-hidden="true" />
</button>
```

#### 2.4 Citas sin información accesible de estado
**Severidad:** ALTA
**WCAG:** 1.3.1, 1.4.1

**Problema:**
```tsx
// Líneas 318-326
{citasDelDia.slice(0, 3).map((cita) => (
  <button
    key={cita.id}
    onClick={() => setCitaSeleccionada(cita)}
    className="w-full text-left px-2 py-1 bg-calma-600 text-white text-xs rounded hover:bg-calma-700 transition-colors truncate"
  >
    {formatearHora(cita.fecha_hora)} - {cita.paciente.nombre}
  </button>
))}
```

**Problemas:**
- No se anuncia el estado de la cita (confirmada, cancelada, completada)
- No se anuncia la modalidad (virtual/presencial)
- El texto truncado puede ocultar información importante

**Solución:**
```tsx
{citasDelDia.slice(0, 3).map((cita) => (
  <button
    key={cita.id}
    onClick={() => setCitaSeleccionada(cita)}
    aria-label={`Cita ${cita.modalidad === 'VIRTUAL' ? 'virtual' : 'presencial'} con ${cita.paciente.nombre} ${cita.paciente.apellido} a las ${formatearHora(cita.fecha_hora)}, estado: ${cita.estado}`}
    className="w-full text-left px-2 py-1 bg-calma-600 text-white text-xs rounded hover:bg-calma-700 transition-colors truncate"
  >
    <span aria-hidden="true">
      {formatearHora(cita.fecha_hora)} - {cita.paciente.nombre}
    </span>
    <span className="sr-only">
      , {cita.modalidad === 'VIRTUAL' ? 'sesión virtual' : 'sesión presencial'}
    </span>
  </button>
))}
```

#### 2.5 Leyenda sin asociación semántica
**Severidad:** MEDIA
**WCAG:** 1.3.1

**Problema:**
```tsx
// Líneas 341-353
<div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
  <div className="flex items-center gap-6 text-sm">
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 bg-calma-50 border-2 border-calma-600 rounded"></div>
      <span className="text-gray-600">Día actual</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 bg-calma-600 rounded"></div>
      <span className="text-gray-600">Cita agendada</span>
    </div>
  </div>
</div>
```

La leyenda no está semánticamente asociada con el calendario.

**Solución:**
```tsx
<div
  role="region"
  aria-labelledby="leyenda-calendario"
  className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4"
>
  <h3 id="leyenda-calendario" className="sr-only">Leyenda del calendario</h3>
  <div className="flex items-center gap-6 text-sm" role="list">
    <div className="flex items-center gap-2" role="listitem">
      <div
        className="w-4 h-4 bg-calma-50 border-2 border-calma-600 rounded"
        aria-hidden="true"
      ></div>
      <span className="text-gray-600">Día actual</span>
    </div>
    <div className="flex items-center gap-2" role="listitem">
      <div
        className="w-4 h-4 bg-calma-600 rounded"
        aria-hidden="true"
      ></div>
      <span className="text-gray-600">Cita agendada</span>
    </div>
  </div>
</div>
```

### Resumen de Mejoras Necesarias - Calendario

| Problema | Severidad | WCAG | Estimación |
|----------|-----------|------|------------|
| Grid calendario sin navegación teclado | CRÍTICA | 2.1.1, 4.1.2 | 4h |
| Modal sin focus trap | CRÍTICA | 2.1.2, 2.4.3 | 2h |
| Botones navegación sin contexto | ALTA | 2.4.4, 4.1.2 | 30min |
| Citas sin información estado | ALTA | 1.3.1, 1.4.1 | 1h |
| Leyenda sin asociación semántica | MEDIA | 1.3.1 | 30min |

**Total estimado:** 8 horas

---

## 3. PACIENTES (`/profesional/pacientes/page.tsx`)

### Problemas Críticos de Accesibilidad

#### 3.1 Estados emocionales solo con color
**Severidad:** CRÍTICA
**WCAG:** 1.4.1

**Problema:**
```tsx
// Líneas 182-193
const obtenerColorEstado = (estado?: 'ESTABLE' | 'ALERTA' | 'CRITICO') => {
  switch (estado) {
    case 'ESTABLE':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'ALERTA':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'CRITICO':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};
```

El estado emocional se comunica principalmente por color. Aunque hay iconos, no son suficientemente distintivos.

**Impacto:**
- Usuarios daltónicos no pueden distinguir estados
- En impresión blanco/negro se pierde toda la información
- Falla automática WCAG 1.4.1

**Solución:**
```tsx
const obtenerInfoEstado = (estado?: 'ESTABLE' | 'ALERTA' | 'CRITICO') => {
  switch (estado) {
    case 'ESTABLE':
      return {
        color: 'bg-green-100 text-green-800 border-green-300',
        icono: <CheckCircleIcon className="w-4 h-4" />,
        texto: 'Estable',
        patron: 'bg-[url("/patterns/stable.svg")]', // Patrón de puntos
      };
    case 'ALERTA':
      return {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icono: <ExclamationTriangleIcon className="w-4 h-4" />,
        texto: 'En alerta',
        patron: 'bg-[url("/patterns/warning.svg")]', // Patrón de rayas
      };
    case 'CRITICO':
      return {
        color: 'bg-red-100 text-red-800 border-red-300',
        icono: <ExclamationTriangleIcon className="w-4 h-4 fill-current" />,
        texto: 'Crítico',
        patron: 'bg-[url("/patterns/critical.svg")]', // Patrón de cuadrícula
      };
    default:
      return {
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        icono: null,
        texto: 'Sin datos',
        patron: '',
      };
  }
};

// Uso
const infoEstado = obtenerInfoEstado(paciente.estado_emocional);
<span className={clsx(
  'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border',
  infoEstado.color,
  infoEstado.patron
)}>
  {infoEstado.icono}
  <span className="font-semibold">{infoEstado.texto}</span>
</span>
```

#### 3.2 Búsqueda sin feedback de resultados
**Severidad:** ALTA
**WCAG:** 3.3.4, 4.1.3

**Problema:**
```tsx
// Líneas 305-316
<div className="relative">
  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
  <input
    type="text"
    placeholder="Buscar por nombre o email..."
    value={busqueda}
    onChange={(e) => setBusqueda(e.target.value)}
    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-calma-500"
  />
</div>
```

**Problemas:**
- No hay anuncio de cuántos resultados se encontraron
- No hay feedback al usuario sobre el estado de búsqueda
- Los resultados cambian sin anuncio a lectores de pantalla

**Solución:**
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
      type="text"
      role="searchbox"
      placeholder="Buscar por nombre o email..."
      value={busqueda}
      onChange={(e) => setBusqueda(e.target.value)}
      aria-describedby="resultados-busqueda"
      className="..."
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

#### 3.3 Filtros sin labels asociados
**Severidad:** ALTA
**WCAG:** 1.3.1, 4.1.2

**Problema:**
```tsx
// Líneas 318-331
<div className="flex items-center gap-2">
  <FunnelIcon className="w-5 h-5 text-gray-400" />
  <select
    value={filtroEstado}
    onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-calma-500"
  >
    <option value="TODOS">Todos los estados</option>
    <option value="ESTABLE">Estables</option>
    <option value="ALERTA">En alerta</option>
    <option value="CRITICO">Críticos</option>
  </select>
</div>
```

Los selectores no tienen labels asociados.

**Solución:**
```tsx
<div className="flex items-center gap-2">
  <FunnelIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
  <label htmlFor="filtro-estado" className="sr-only">
    Filtrar pacientes por estado emocional
  </label>
  <select
    id="filtro-estado"
    value={filtroEstado}
    onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
    aria-label="Filtrar por estado emocional"
    className="..."
  >
    <option value="TODOS">Todos los estados</option>
    <option value="ESTABLE">Estables</option>
    <option value="ALERTA">En alerta</option>
    <option value="CRITICO">Críticos</option>
  </select>
</div>

<div className="flex items-center gap-2">
  <ArrowsUpDownIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
  <label htmlFor="ordenar-por" className="sr-only">
    Ordenar pacientes por
  </label>
  <select
    id="ordenar-por"
    value={ordenarPor}
    onChange={(e) => setOrdenarPor(e.target.value as OrdenarPor)}
    aria-label="Ordenar pacientes"
    className="..."
  >
    <option value="ultimaCita">Última cita</option>
    <option value="nombre">Nombre</option>
    <option value="progreso">Progreso</option>
    <option value="totalCitas">Total de citas</option>
  </select>
  <button
    onClick={() => setOrdenAscendente(!ordenAscendente)}
    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
    aria-label={`Cambiar a orden ${ordenAscendente ? 'descendente' : 'ascendente'}`}
    aria-pressed={ordenAscendente}
  >
    <ArrowsUpDownIcon
      className={clsx('w-5 h-5', ordenAscendente ? 'rotate-180' : '')}
      aria-hidden="true"
    />
  </button>
</div>
```

#### 3.4 Cards de paciente sin estructura semántica
**Severidad:** ALTA
**WCAG:** 1.3.1, 4.1.2

**Problema:**
```tsx
// Líneas 371-451
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {pacientesFiltrados.map((paciente) => (
    <div
      key={paciente.id}
      onClick={() => router.push(`/pacientes/${paciente.id}/progreso`)}
      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-calma-500 transition-all cursor-pointer"
    >
      {/* Contenido del card */}
    </div>
  ))}
</div>
```

**Problemas:**
- Divs clickeables en lugar de elementos semánticos
- No hay estructura de lista
- No hay anuncio claro de que son links interactivos

**Solución:**
```tsx
<ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
  {pacientesFiltrados.map((paciente) => (
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
        aria-label={`Ver detalles de ${paciente.nombre} ${paciente.apellido || ''}, estado ${obtenerInfoEstado(paciente.estado_emocional).texto}`}
        className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-calma-500 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-calma-500 focus:ring-offset-2"
      >
        {/* Contenido del card con headings apropiados */}
        <h3 className="font-semibold text-gray-900 truncate">
          {paciente.nombre} {paciente.apellido || ''}
        </h3>
        {/* ... resto del contenido ... */}
      </article>
    </li>
  ))}
</ul>
```

#### 3.5 Progreso visual sin texto alternativo
**Severidad:** ALTA
**WCAG:** 1.1.1, 1.4.1

**Problema:**
```tsx
// Líneas 420-432
{paciente.progreso !== undefined && (
  <div className="mb-4">
    <div className="flex justify-between text-sm mb-1">
      <span className="text-gray-600">Progreso</span>
      <span className="font-medium text-gray-900">{paciente.progreso}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="bg-calma-600 h-2 rounded-full transition-all"
        style={{ width: `${paciente.progreso}%` }}
      />
    </div>
  </div>
)}
```

La barra de progreso es solo visual, no tiene atributos ARIA.

**Solución:**
```tsx
{paciente.progreso !== undefined && (
  <div className="mb-4">
    <div className="flex justify-between text-sm mb-1">
      <span id={`label-progreso-${paciente.id}`} className="text-gray-600">
        Progreso del tratamiento
      </span>
      <span
        id={`valor-progreso-${paciente.id}`}
        className="font-medium text-gray-900"
        aria-live="polite"
      >
        {paciente.progreso}%
      </span>
    </div>
    <div
      role="progressbar"
      aria-labelledby={`label-progreso-${paciente.id}`}
      aria-valuenow={paciente.progreso}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-describedby={`valor-progreso-${paciente.id}`}
      className="w-full bg-gray-200 rounded-full h-2"
    >
      <div
        className="bg-calma-600 h-2 rounded-full transition-all"
        style={{ width: `${paciente.progreso}%` }}
      />
    </div>
  </div>
)}
```

#### 3.6 Estadísticas sin contexto semántico
**Severidad:** MEDIA
**WCAG:** 1.3.1

**Problema:**
```tsx
// Líneas 256-298
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <div className="bg-white border border-gray-200 rounded-lg p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">Total Pacientes</p>
        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
      </div>
      <UserGroupIcon className="w-8 h-8 text-gray-400" />
    </div>
  </div>
  {/* ... más estadísticas ... */}
</div>
```

Las estadísticas no tienen estructura semántica ni labels descriptivos.

**Solución:**
```tsx
<section
  aria-labelledby="titulo-estadisticas"
  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
>
  <h2 id="titulo-estadisticas" className="sr-only">
    Resumen estadístico de pacientes
  </h2>

  <div
    role="region"
    aria-label="Total de pacientes"
    className="bg-white border border-gray-200 rounded-lg p-4"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600" aria-hidden="true">Total Pacientes</p>
        <p className="text-2xl font-bold text-gray-900">
          <span className="sr-only">Total de pacientes: </span>
          {stats.total}
        </p>
      </div>
      <UserGroupIcon className="w-8 h-8 text-gray-400" aria-hidden="true" />
    </div>
  </div>

  {/* Repetir patrón para cada estadística con colores distintivos */}
</section>
```

### Resumen de Mejoras Necesarias - Pacientes

| Problema | Severidad | WCAG | Estimación |
|----------|-----------|------|------------|
| Estados solo con color | CRÍTICA | 1.4.1 | 2h |
| Búsqueda sin feedback | ALTA | 3.3.4, 4.1.3 | 1h |
| Filtros sin labels | ALTA | 1.3.1, 4.1.2 | 1h |
| Cards sin estructura semántica | ALTA | 1.3.1, 4.1.2 | 2h |
| Progreso sin ARIA | ALTA | 1.1.1, 1.4.1 | 1h |
| Estadísticas sin contexto | MEDIA | 1.3.1 | 1h |

**Total estimado:** 8 horas

---

## RESUMEN GENERAL

### Problemas Transversales

1. **Falta de hooks de accesibilidad comunes**
   - useFocusTrap
   - usePrefersReducedMotion
   - useKeyboardNavigation
   - useAnnouncer (para anuncios a lectores de pantalla)

2. **Inconsistencia en uso de ARIA**
   - Algunos componentes tienen ARIA, otros no
   - Falta documentación interna de patrones ARIA

3. **Colores terapéuticos bien definidos pero mal aplicados**
   - Tailwind config excelente con ratios de contraste documentados
   - Falta usar patrones/texturas para complementar color

4. **Animaciones sin control de preferencias**
   - Framer Motion usado sin verificar prefers-reduced-motion
   - Falta hook global para respetar preferencias

### Estimación Total

| Página | Horas Estimadas |
|--------|-----------------|
| Perfil | 10.5h |
| Calendario | 8h |
| Pacientes | 8h |
| Hooks comunes | 4h |
| Testing & QA | 6h |
| **TOTAL** | **36.5 horas** |

### Prioridades de Implementación

**Fase 1 - Crítico (16h):**
1. Labels y validación de formularios (Perfil)
2. Navegación por teclado en calendario
3. Focus trap en modales
4. Estados emocionales sin dependencia de color

**Fase 2 - Alto (12h):**
5. Hooks de accesibilidad comunes
6. Botones toggle con estados ARIA
7. Búsqueda con feedback
8. Cards con estructura semántica

**Fase 3 - Medio (8.5h):**
9. Animaciones con prefers-reduced-motion
10. Contadores accesibles
11. Estadísticas con contexto
12. Leyendas semánticas

### Herramientas de Testing Recomendadas

1. **Automatizadas:**
   - axe DevTools
   - Lighthouse (Accessibility audit)
   - WAVE browser extension

2. **Manuales:**
   - Navegación solo con teclado
   - NVDA/JAWS (lectores de pantalla)
   - Simulador de daltonismo (Chrome DevTools)
   - Zoom al 200% (WCAG 1.4.4)

3. **Usuarios reales:**
   - Test con profesionales que usen tecnologías asistivas
   - Feedback de terapeutas sobre fatiga visual/cognitiva

---

## PRÓXIMOS PASOS

1. ✅ Crear este documento de análisis
2. 🔄 Implementar hooks comunes de accesibilidad
3. 🔄 Refactorizar página Perfil
4. 🔄 Refactorizar página Calendario
5. 🔄 Refactorizar página Pacientes
6. ⏳ Crear guías de navegación por teclado
7. ⏳ Testing exhaustivo con herramientas
8. ⏳ Documentación de patrones accesibles

**Contacto para revisión:** Coordinarse con arquitecto-web-fullstack para alineación visual y funcional.
