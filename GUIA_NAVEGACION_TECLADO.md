# Guía de Navegación por Teclado
## Área Profesional - Escuchodromo

**Versión:** 1.0
**Fecha:** 23 de octubre de 2025
**Para:** Profesionales de salud mental y usuarios de tecnologías asistivas

---

## INTRODUCCIÓN

Esta guía documenta la navegación completa por teclado para las tres páginas principales del área profesional. Todas las funcionalidades están disponibles sin necesidad de mouse, cumpliendo con WCAG 2.1.1 (Teclado - Nivel A).

### Teclado Estándar Requerido

- **Tab**: Navegar al siguiente elemento interactivo
- **Shift + Tab**: Navegar al elemento interactivo anterior
- **Enter** o **Space**: Activar botones y links
- **Escape**: Cerrar modales y overlays
- **Flechas**: Navegar dentro de componentes específicos (calendarios, listas)

### Indicadores Visuales

Todos los elementos focuseables muestran un **anillo azul** (ring-2 ring-calma-500) al recibir el foco. Este indicador cumple con contraste mínimo 3:1 según WCAG 2.4.7.

---

## 1. PERFIL DEL PROFESIONAL (`/profesional/perfil`)

### Estructura General

```
┌─────────────────────────────────────────┐
│ [Skip Link]                             │
│ ├─ Header                               │
│ ├─ Estadísticas (3 tarjetas)            │
│ ├─ Resumen de Errores (si existen)      │
│ └─ Formulario Principal                 │
│    ├─ Foto de Perfil                    │
│    ├─ Información Personal (4 campos)   │
│    ├─ Especialidades (12 checkboxes)    │
│    ├─ Biografía (textarea)              │
│    ├─ Idiomas (6 checkboxes)            │
│    ├─ Tarifa (2 campos)                 │
│    ├─ Certificaciones (dinámico)        │
│    ├─ Disponibilidad Horaria (textarea) │
│    ├─ Enlaces Profesionales (2 campos)  │
│    └─ Botones de Acción                 │
└─────────────────────────────────────────┘
```

### Navegación Paso a Paso

#### Inicio de Página

1. **Tab 1**: Skip link "Saltar al contenido principal"
   - **Enter**: Salta directamente al formulario (útil para lectores de pantalla)

2. **Tab 2-4**: Estadísticas (solo informativas, pasa a través)

#### Foto de Perfil

3. **Tab 5**: Botón "Cambiar foto de perfil"
   - **Enter** o **Space**: Abre selector de archivos del sistema
   - **Anuncio de lector de pantalla**: "Cambiar foto de perfil, botón. Formatos: JPG, PNG. Tamaño máximo: 2MB"

#### Información Personal

4. **Tab 6**: Input "Título Profesional" (campo obligatorio)
   - **Escribir texto**
   - Si vacío al guardar → Focus automático y mensaje de error
   - **Anuncio**: "Título profesional, campo requerido, editable"

5. **Tab 7**: Input "Número de Licencia"
   - **Anuncio**: "Número de Licencia, editable"

6. **Tab 8**: Input "Universidad"

7. **Tab 9**: Input "Años de Experiencia" (tipo número)
   - **Flechas arriba/abajo**: Incrementar/decrementar valor

#### Especialidades (Checkboxes)

8. **Tab 10-21**: 12 botones de especialidades
   - **Enter** o **Space**: Seleccionar/deseleccionar
   - **Anuncio al seleccionar**: "Psicología Clínica seleccionada, checkbox marcado"
   - **Anuncio al deseleccionar**: "Psicología Clínica deseleccionada, checkbox no marcado"
   - Visual: Fondo azul cuando seleccionado (bg-calma-600)
   - **IMPORTANTE**: Al menos una especialidad debe estar seleccionada

#### Biografía

22. **Tab 22**: Textarea "Biografía"
    - **Escribir texto** (máximo 1000 caracteres)
    - **Anuncio**: "Biografía, editable, máximo 1000 caracteres, actualmente X de 1000 caracteres"
    - El contador se actualiza en vivo (aria-live="polite")

#### Idiomas

23. **Tab 23-28**: 6 botones de idiomas
    - Mismo comportamiento que especialidades
    - **Enter** o **Space**: Toggle selección

#### Tarifa

29. **Tab 29**: Input "Monto" (tipo número, campo obligatorio)
    - **Flechas arriba/abajo**: Incrementar en pasos de 1000

30. **Tab 30**: Select "Moneda"
    - **Flechas arriba/abajo**: Cambiar entre COP y USD
    - **Enter**: Abrir dropdown
    - **Escape**: Cerrar dropdown

#### Certificaciones (Dinámicas)

31. **Tab 31**: Primer campo de certificación
    - Si hay múltiples certificaciones, cada una tiene:
      - Input de texto
      - Botón "Eliminar" (si hay más de una)

32. **Tab N**: Botón "+ Agregar Certificación"
    - **Enter**: Agrega un nuevo campo
    - **Anuncio**: "Campo de certificación agregado"

#### Disponibilidad Horaria

33. **Tab N+1**: Textarea "Disponibilidad Horaria"

#### Enlaces Profesionales

34. **Tab N+2**: Input "LinkedIn URL"
    - Validación de URL automática

35. **Tab N+3**: Input "Sitio Web Personal"

#### Botones de Acción

36. **Tab N+4**: Botón "Cancelar"
    - **Enter**: Vuelve al dashboard sin guardar

37. **Tab N+5**: Botón "Guardar Cambios"
    - **Enter**: Valida y guarda el formulario
    - Si hay errores:
      - Focus automático al primer campo con error
      - Scroll suave al elemento
      - Resumen de errores en la parte superior
      - **Anuncio**: "Hay X errores en el formulario. Por favor revisa los campos marcados"
    - Si es exitoso:
      - **Anuncio**: "Perfil actualizado correctamente"

### Atajos de Navegación Rápida (Lectores de Pantalla)

Los lectores de pantalla pueden usar:

- **H** (heading): Navegar entre secciones:
  - H1: "Mi Perfil Profesional"
  - H2: "Estadísticas del perfil" (visualmente oculto)
  - H2: "Foto de Perfil"
  - H2: "Información Personal"
  - H2: "Especialidades"
  - etc.

- **R** (region): Saltar entre regiones ARIA:
  - Estadísticas
  - Formulario principal
  - Cada sección del formulario

- **B** (button): Navegar entre todos los botones

- **E** (edit field): Saltar entre campos de formulario

---

## 2. CALENDARIO (`/profesional/calendario`)

### Estructura General

```
┌─────────────────────────────────────────┐
│ Header                                  │
│ ├─ Título "Mi Calendario"               │
│ └─ Botón "Volver al Dashboard"          │
│                                         │
│ Selector de Mes                         │
│ ├─ [←] Mes Anterior                     │
│ ├─ "Octubre 2025"                       │
│ └─ [→] Mes Siguiente                    │
│                                         │
│ Grid de Calendario (7x5-6)              │
│ ├─ Encabezados: Dom, Lun, Mar...        │
│ └─ Celdas de días con citas             │
│                                         │
│ Leyenda                                 │
│ └─ Códigos de color explicados          │
│                                         │
│ [Modal de Cita] (cuando se abre)        │
└─────────────────────────────────────────┘
```

### Navegación Paso a Paso

#### Header

1. **Tab 1**: Botón "Volver al Dashboard"
   - **Enter**: Navega a /profesional/dashboard

#### Selector de Mes

2. **Tab 2**: Botón "Mes anterior"
   - **Enter**: Navega a septiembre 2025
   - **Anuncio**: "Ir a Septiembre 2025"

3. **Tab 3**: Botón "Mes siguiente"
   - **Enter**: Navega a noviembre 2025
   - **Anuncio**: "Ir a Noviembre 2025"

#### Grid de Calendario (Navegación Mejorada)

El calendario implementa el patrón **ARIA Grid** con navegación completa por teclado:

4. **Tab 4**: Primera celda focuseable del calendario (día actual o día 1)
   - **Estado inicial**: El día actual está enfocado automáticamente

**Navegación dentro del calendario:**

- **Flecha Derecha**: Avanzar un día
- **Flecha Izquierda**: Retroceder un día
- **Flecha Abajo**: Avanzar una semana (7 días)
- **Flecha Arriba**: Retroceder una semana (7 días)
- **Home**: Ir al primer día del mes
- **End**: Ir al último día del mes
- **Enter** o **Space**: Seleccionar el día enfocado

**Anuncios al navegar:**
- "Lunes 23 de octubre de 2025, 2 citas agendadas"
- "Martes 24 de octubre de 2025, sin citas"

**Acceso a citas individuales:**

5. **Enter** en un día con citas: Abre lista de citas del día
   - **Tab**: Navegar entre citas
   - **Enter** en una cita: Abre modal de detalle

#### Modal de Detalle de Cita (Focus Trap Activo)

Cuando se abre un modal:

6. **Focus automático**: Se mueve al primer elemento del modal (título)

7. **Tab**: Navegar dentro del modal solamente:
   - Título "Detalle de Cita"
   - Información del paciente (solo lectura)
   - Fecha y hora (solo lectura)
   - Duración (solo lectura)
   - Modalidad (solo lectura)
   - Botón "Cerrar"

8. **Tab después del último elemento**: Vuelve al primero (bucle cerrado)

9. **Shift + Tab**: Navegación inversa dentro del modal

10. **Escape**: Cierra el modal y restaura el focus al botón que lo abrió

11. **Enter** en "Cerrar": Cierra el modal

**Anuncios del modal:**
- Al abrir: "Detalle de cita, diálogo modal"
- Al cerrar: "Modal cerrado"

### Navegación Alternativa (Lectores de Pantalla)

- **D** (landmark): Navegar entre:
  - Banner (header)
  - Navigation
  - Main (contenido principal)
  - Region (leyenda)

- **T** (table/grid): Ir directamente al grid del calendario

- **B** (button): Saltar entre:
  - Volver al Dashboard
  - Mes Anterior
  - Mes Siguiente
  - Botones de citas
  - Cerrar modal

---

## 3. PACIENTES (`/profesional/pacientes`)

### Estructura General

```
┌─────────────────────────────────────────┐
│ Header                                  │
│ └─ Título + Botón Volver                │
│                                         │
│ Estadísticas (4 tarjetas)               │
│ ├─ Total Pacientes                      │
│ ├─ Estables                             │
│ ├─ En Alerta                            │
│ └─ Críticos                             │
│                                         │
│ Filtros y Búsqueda                      │
│ ├─ Input Búsqueda                       │
│ ├─ Select Filtro por Estado             │
│ ├─ Select Ordenar por                   │
│ └─ Botón Toggle Orden Asc/Desc          │
│                                         │
│ Grid de Pacientes (3 columnas)          │
│ └─ Cards de pacientes (clickeables)     │
└─────────────────────────────────────────┘
```

### Navegación Paso a Paso

#### Header

1. **Tab 1**: Botón "Volver al Dashboard"

#### Estadísticas

2. **Tab 2-5**: 4 tarjetas de estadísticas (solo informativas, pasan a través)
   - **Anuncio**: "Total de pacientes: 15, región"

#### Búsqueda y Filtros

3. **Tab 6**: Input "Buscar pacientes por nombre o email"
   - **Escribir**: Filtra pacientes en tiempo real
   - **Anuncio al escribir**: "12 pacientes encontrados" (debounce 500ms)
   - **Role**: searchbox
   - **Aria-describedby**: "resultados-busqueda" (región live)

4. **Tab 7**: Select "Filtrar por estado emocional"
   - **Opciones**:
     - Todos los estados
     - Estables (verde)
     - En alerta (amarillo)
     - Críticos (rojo)
   - **Flechas arriba/abajo**: Cambiar filtro
   - **Enter**: Abrir/cerrar dropdown
   - **Anuncio al cambiar**: "Mostrando 8 pacientes estables"

5. **Tab 8**: Select "Ordenar pacientes por"
   - **Opciones**:
     - Última cita
     - Nombre
     - Progreso
     - Total de citas
   - **Anuncio al cambiar**: "Pacientes ordenados por nombre"

6. **Tab 9**: Botón "Toggle orden ascendente/descendente"
   - **Enter**: Cambia entre ascendente y descendente
   - **Aria-pressed**: true/false
   - **Anuncio**: "Cambiado a orden ascendente" / "Cambiado a orden descendente"

#### Grid de Pacientes

7. **Tab 10+**: Cards de pacientes (dinámico según filtros)

Cada card de paciente:

- **Tab**: Focaliza el card completo (como botón)
- **Enter** o **Space**: Navega a `/pacientes/{id}/progreso`
- **Anuncio detallado**:
  ```
  "María González, paciente. Estado: Estable.
   Progreso: 65%. Total de citas: 12. Completadas: 10.
   Última cita: 15 de octubre de 2025.
   Presione Enter para ver detalles completos."
  ```

**Indicadores visuales del card:**

- **Estado Estable**: Borde verde + ícono check
- **Estado Alerta**: Borde amarillo + ícono advertencia
- **Estado Crítico**: Borde rojo + ícono advertencia relleno

**NO SOLO COLOR**: Cada estado incluye:
- Icono distintivo
- Texto explícito ("Estable", "En alerta", "Crítico")
- Patrón de fondo sutil (puntos, rayas, cuadrícula)

### Navegación sin Resultados

Si la búsqueda/filtros no devuelven resultados:

- **Tab** pasa directamente del último filtro al footer
- **Anuncio**: "No se encontraron pacientes. Intenta ajustar los filtros de búsqueda"
- Mensaje visual centrado con icono informativo

### Atajos de Navegación Rápida

- **R** (region): Saltar entre:
  - Estadísticas
  - Filtros
  - Lista de pacientes

- **H** (heading):
  - H1: "Mis Pacientes"
  - H2: "Resumen estadístico de pacientes" (sr-only)
  - H3: Nombre de cada paciente en cards

- **B** (button): Navegar entre:
  - Volver al Dashboard
  - Toggle de orden
  - Cada card de paciente

---

## PATRONES GENERALES APLICADOS

### 1. Focus Management

**Indicador de foco consistente:**
```css
focus:outline-none
focus:ring-2
focus:ring-calma-500
focus:ring-offset-2
```

**Contraste mínimo**: 3:1 (cumple WCAG 2.4.7)

### 2. Skip Links

Todas las páginas incluyen:
```html
<a href="#main-content" class="sr-only focus:not-sr-only">
  Saltar al contenido principal
</a>
```

Al presionar **Tab** como primera acción, este link aparece visualmente.

### 3. Estados Disabled

Elementos deshabilitados:
- **No reciben focus** (tabindex omitido)
- **Aria-disabled="true"**
- **Visual**: Opacidad 50%, cursor not-allowed
- **Anuncio**: "Botón Guardar, deshabilitado"

### 4. Loading States

Durante carga:
- **Role="status"**
- **Aria-live="polite"**
- **Aria-label descriptivo**
- Spinner con aria-hidden="true" (decorativo)

### 5. Mensajes de Error

- **Role="alert"** para errores críticos
- **Aria-live="assertive"** para validación inmediata
- **Aria-invalid="true"** en campos con error
- **Aria-describedby** vincula campo con mensaje de error

---

## TESTING DE NAVEGACIÓN

### Checklist de Validación

Para cada página, verificar:

- [ ] **Tab Order**: El orden de tabulación es lógico y sigue el flujo visual
- [ ] **Focus Visible**: Todos los elementos interactivos muestran indicador de foco
- [ ] **Keyboard-Only**: Todas las funciones son accesibles solo con teclado
- [ ] **No Focus Traps**: El usuario nunca queda atrapado sin poder salir
- [ ] **Skip Links**: Funcionan correctamente y son visibles al enfocar
- [ ] **Modals**: Implementan focus trap y restauran foco al cerrar
- [ ] **Dropdowns**: Se abren/cierran con Enter/Escape
- [ ] **Custom Controls**: (calendarios, sliders) tienen navegación con flechas
- [ ] **Screen Reader**: Todos los elementos se anuncian apropiadamente

### Herramientas Recomendadas

1. **Navegación Manual**: Usar solo teclado durante 10 minutos
2. **NVDA/JAWS**: Validar anuncios de lectores de pantalla
3. **axe DevTools**: Auditoría automatizada de accesibilidad
4. **Lighthouse**: Puntaje mínimo 95 en accesibilidad

---

## SOPORTE Y RECURSOS

### Para Usuarios

Si encuentras problemas de navegación:
1. Presiona **F5** para recargar la página
2. Verifica que JavaScript esté habilitado
3. Contacta soporte técnico: soporte@escuchodromo.com

### Para Desarrolladores

Documentación adicional:
- WCAG 2.1 Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/
- Código fuente de hooks: `/src/lib/hooks/accesibilidad/`

---

**Última actualización:** 23 de octubre de 2025
**Próxima revisión:** Cada vez que se agregue/modifique funcionalidad

**Mantenido por:** Especialista UX/UI Accesibilidad - Escuchodromo
