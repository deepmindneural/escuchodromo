# Guía de Testing de Accesibilidad - Escuchodromo

## Objetivo

Esta guía proporciona instrucciones paso a paso para verificar que todas las interfaces implementadas cumplan con los estándares de accesibilidad WCAG 2.1 Level AA.

## Herramientas Necesarias

### 1. Extensiones de Navegador

#### Chrome/Edge
- **axe DevTools** (gratuita): https://www.deque.com/axe/devtools/
- **WAVE** (gratuita): https://wave.webaim.org/extension/
- **Lighthouse** (incluida en Chrome DevTools)

#### Firefox
- **axe DevTools** (gratuita)
- **WAVE** (gratuita)

### 2. Screen Readers

#### Windows
- **NVDA** (gratuito): https://www.nvaccess.org/download/
  - Atajos principales:
    - `Insert + Down Arrow`: Leer desde el cursor
    - `Insert + B`: Leer todo
    - `Tab`: Navegar entre elementos interactivos
    - `H`: Navegar entre encabezados

#### macOS/iOS
- **VoiceOver** (incluido en el sistema)
  - Activar: `Cmd + F5`
  - Atajos principales:
    - `VO + A`: Leer desde el cursor
    - `VO + Right Arrow`: Siguiente elemento
    - `VO + Space`: Activar elemento
    - `VO + U`: Rotor de navegación

#### Android
- **TalkBack** (incluido en el sistema)
  - Activar en Configuración > Accesibilidad

### 3. Herramientas de Contraste

- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Colour Contrast Analyser**: https://www.tpgi.com/color-contrast-checker/

---

## Checklist de Pruebas por Página

### 1. Página de Reservas (/profesionales/[id]/reservar)

#### Test 1: Navegación por Teclado
- [ ] Puedes llegar a todos los elementos interactivos con `Tab`
- [ ] El focus es visible en cada elemento (anillo azul)
- [ ] Puedes navegar el calendario con flechas
- [ ] `Enter` y `Space` activan botones y selecciones
- [ ] `Escape` cierra el modal de confirmación

#### Test 2: Screen Reader
- [ ] El calendario anuncia "Calendario de reservas"
- [ ] Cada día anuncia su fecha, disponibilidad y estado
- [ ] Los slots anuncian hora y disponibilidad
- [ ] El modal anuncia su contenido completo
- [ ] Los errores de validación se anuncian claramente

#### Test 3: Contraste
- [ ] Texto sobre fondo blanco: mínimo 4.5:1
- [ ] Días del calendario seleccionados: contraste adecuado
- [ ] Botones de acción: texto legible

#### Test 4: Responsive
- [ ] En mobile (375px), todos los elementos son accesibles
- [ ] Touch targets mínimo 44x44px
- [ ] Calendario se adapta correctamente

#### Test 5: Reducción de Movimiento
- [ ] Abrir DevTools > Rendering > Emulate CSS prefers-reduced-motion
- [ ] Verificar que animaciones se deshabilitan

---

### 2. Dashboard Profesional (/profesional/dashboard)

#### Test 1: Navegación por Teclado
- [ ] Puedes navegar toda la tabla con `Tab`
- [ ] Puedes ordenar columnas con `Enter`
- [ ] El dropdown de acciones se abre con `Space`
- [ ] Los filtros son accesibles por teclado

#### Test 2: Screen Reader
- [ ] Las métricas anuncian su valor y tendencia
- [ ] La tabla anuncia headers correctamente
- [ ] Los indicadores emocionales anuncian su estado
- [ ] Las próximas citas se leen en orden

#### Test 3: Contraste
- [ ] Indicadores emocionales: no solo color
  - Verde + círculo
  - Amarillo + triángulo
  - Rojo + cuadrado
- [ ] Texto en cards: contraste 4.5:1
- [ ] Links y botones: contraste 3:1

#### Test 4: Responsive
- [ ] Tabla se convierte en cards en mobile
- [ ] Cards son tocables (44x44px mínimo)
- [ ] Métricas en grid 1 col mobile, 2 tablet, 4 desktop

#### Test 5: Sorting y Filtros
- [ ] El sorting se anuncia al screen reader
- [ ] El filtro por estado funciona correctamente
- [ ] Los cambios en la tabla se anuncian

---

### 3. Progreso del Paciente (/pacientes/[id]/progreso)

#### Test 1: Navegación por Teclado
- [ ] Puedes alternar entre gráfica y tabla con `Tab + Enter`
- [ ] Los tabs Semanal/Mensual son accesibles
- [ ] El timeline es navegable
- [ ] Las alertas son accesibles

#### Test 2: Screen Reader
- [ ] La gráfica tiene descripción alternativa
- [ ] La tabla de datos se lee correctamente
- [ ] Las alertas anuncian su nivel (info, advertencia, crítico)
- [ ] El timeline anuncia cada evento cronológicamente

#### Test 3: Contraste
- [ ] Líneas de gráfica: azul y morado con contraste
- [ ] Rangos de severidad: colores distinguibles
- [ ] Alertas: no solo color (icono + texto)

#### Test 4: Responsive
- [ ] Gráficas se adaptan en mobile
- [ ] Timeline mantiene legibilidad
- [ ] Tabs se apilan correctamente

#### Test 5: Tabla Alternativa
- [ ] Toggle "Ver datos" muestra tabla accesible
- [ ] Tabla tiene headers apropiados
- [ ] Datos coinciden con la gráfica

---

## Tests Automatizados

### Lighthouse (Chrome DevTools)

1. Abrir Chrome DevTools (`F12`)
2. Ir a pestaña "Lighthouse"
3. Seleccionar "Accessibility"
4. Click en "Analyze page load"

**Objetivo**: Score de 95+ en todas las páginas

### axe DevTools

1. Instalar extensión
2. Abrir la página a testear
3. Click en icono de axe
4. Click en "Scan All of my page"

**Objetivo**: 0 issues críticos, 0 issues moderados

### Comandos CLI (opcional)

```bash
# Instalar axe-cli
npm install -g @axe-core/cli

# Correr test en una URL
axe http://localhost:3000/profesionales/123/reservar

# Generar reporte
axe http://localhost:3000/profesional/dashboard --save report.json
```

---

## Tests Manuales Críticos

### Test de Teclado Completo (sin mouse)

1. Desconectar o no usar el mouse
2. Navegar toda la página solo con teclado:
   - `Tab` para avanzar
   - `Shift + Tab` para retroceder
   - `Enter` o `Space` para activar
   - `Escape` para cerrar modales
   - Flechas para calendarios y listas

**Criterio de éxito**: Completar flujo completo sin mouse

### Test de Screen Reader

#### Flujo de Reserva
1. Activar NVDA o VoiceOver
2. Navegar a /profesionales/[id]/reservar
3. Escuchar toda la página (`Insert + Down`)
4. Verificar que se anuncia:
   - Nombre del profesional
   - Opciones de duración con precios
   - Opciones de modalidad con descripciones
   - Calendario con disponibilidad
   - Slots disponibles
   - Campos de formulario con labels
   - Resumen de reserva

#### Dashboard Profesional
1. Navegar a /profesional/dashboard
2. Verificar que se anuncia:
   - Cada métrica con su valor
   - Headers de tabla
   - Estado emocional de cada paciente (no solo color)
   - Próximas citas con detalles

#### Progreso del Paciente
1. Navegar a /pacientes/[id]/progreso
2. Verificar que se anuncia:
   - Descripción de la gráfica
   - Tabla alternativa de datos
   - Cada hito en el timeline
   - Alertas con su nivel de severidad

---

## Tests de Contraste

### Manual (recomendado)

1. Abrir https://webaim.org/resources/contrastchecker/
2. Para cada combinación de texto/fondo:
   - Tomar color del texto (inspector de navegador)
   - Tomar color del fondo
   - Verificar ratio

**Ratios mínimos**:
- Texto normal (< 18pt): 4.5:1
- Texto grande (≥ 18pt): 3:1
- Componentes interactivos: 3:1

### Con Extensión

1. Instalar "WAVE" extension
2. Abrir página
3. Click en icono WAVE
4. Ver sección "Contrast Errors"

**Objetivo**: 0 errores de contraste

---

## Tests de Responsive

### Breakpoints a Probar

1. **Mobile**: 375px (iPhone SE)
2. **Mobile Large**: 414px (iPhone Plus)
3. **Tablet**: 768px (iPad)
4. **Desktop**: 1024px
5. **Large Desktop**: 1920px

### Cómo Probar

Chrome DevTools:
1. `F12` → Click en icono de dispositivo móvil
2. Seleccionar dispositivo o ingresar dimensión custom
3. Verificar:
   - Todos los elementos son accesibles
   - Touch targets ≥ 44x44px
   - No hay scroll horizontal
   - Texto legible (min 16px)

---

## Tests de Reducción de Movimiento

### Activar en Sistema

**macOS**:
- System Preferences > Accessibility > Display > Reduce motion

**Windows**:
- Settings > Ease of Access > Display > Show animations in Windows

**En Navegador** (para testing rápido):
1. Abrir DevTools (`F12`)
2. `Cmd/Ctrl + Shift + P`
3. Buscar "Rendering"
4. Marcar "Emulate CSS prefers-reduced-motion"

### Qué Verificar

- [ ] Transiciones se deshabilitan o reducen a < 0.3s
- [ ] Animaciones de entrada no distraen
- [ ] Gráficas no animan (Recharts)
- [ ] Modales aparecen sin fade-in
- [ ] Scrolls no tienen smooth behavior

---

## Checklist de Cumplimiento WCAG 2.1 AA

### Perceptible
- [ ] **1.1.1**: Todas las imágenes tienen alt text apropiado
- [ ] **1.3.1**: Uso correcto de HTML semántico (headers, lists, tables)
- [ ] **1.3.2**: Orden de lectura lógico
- [ ] **1.4.3**: Contraste mínimo 4.5:1
- [ ] **1.4.4**: Texto redimensionable hasta 200%
- [ ] **1.4.10**: Sin scroll horizontal en 320px
- [ ] **1.4.11**: Contraste de componentes no textuales 3:1

### Operable
- [ ] **2.1.1**: Toda funcionalidad accesible por teclado
- [ ] **2.1.2**: Sin trampas de teclado
- [ ] **2.2.1**: Sin límites de tiempo (o ajustables)
- [ ] **2.4.3**: Orden de focus lógico
- [ ] **2.4.6**: Headers y labels descriptivos
- [ ] **2.4.7**: Focus visible
- [ ] **2.5.5**: Touch targets mínimo 44x44px

### Comprensible
- [ ] **3.1.1**: Idioma de página definido (es)
- [ ] **3.2.1**: Focus no causa cambios de contexto inesperados
- [ ] **3.2.2**: Inputs no causan cambios de contexto automáticos
- [ ] **3.3.1**: Errores identificados claramente
- [ ] **3.3.2**: Labels o instrucciones presentes
- [ ] **3.3.3**: Sugerencias de error proporcionadas

### Robusto
- [ ] **4.1.2**: Nombres, roles y valores disponibles para tecnologías asistivas
- [ ] **4.1.3**: Mensajes de estado programáticos (aria-live)

---

## Reporte de Issues

### Template de Issue

```markdown
## Tipo de Issue
[ ] Contraste insuficiente
[ ] No navegable por teclado
[ ] Screen reader no anuncia correctamente
[ ] Touch target muy pequeño
[ ] Otro: _____________

## Ubicación
Página: /profesionales/[id]/reservar
Componente: CalendarioMensual
Línea aprox: 123

## Descripción
[Descripción detallada del problema]

## Pasos para Reproducir
1.
2.
3.

## Comportamiento Esperado
[Qué debería suceder]

## Comportamiento Actual
[Qué sucede actualmente]

## Criterio WCAG Afectado
2.4.7 Focus Visible (Level AA)

## Screenshots
[Si aplica]

## Severidad
[ ] Crítico (bloquea uso)
[ ] Alto (afecta experiencia)
[ ] Medio (mejora recomendada)
[ ] Bajo (nice to have)
```

---

## Métricas de Éxito

### Cuantitativas
- **Lighthouse Accessibility Score**: ≥ 95
- **axe Issues Críticos**: 0
- **axe Issues Moderados**: 0
- **Errores de Contraste**: 0
- **Elementos no accesibles por teclado**: 0

### Cualitativas
- **Tiempo para completar reserva (solo teclado)**: < 3 minutos
- **Tiempo para navegar dashboard (solo teclado)**: < 2 minutos
- **Satisfacción de usuarios con screen readers**: ≥ 4/5

---

## Próximos Pasos

1. **Implementar**: Tests automatizados en CI/CD
   ```yaml
   # .github/workflows/a11y.yml
   name: Accessibility Tests
   on: [push, pull_request]
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - run: npm install
         - run: npm run build
         - run: npm run test:a11y
   ```

2. **Crear**: Suite de tests E2E con Playwright
   ```typescript
   // e2e/reservas.spec.ts
   test('reservar cita solo con teclado', async ({ page }) => {
     await page.goto('/profesionales/123/reservar');
     // Navegar solo con Tab, Enter, Space
   });
   ```

3. **Integrar**: axe-core en tests de componentes
   ```typescript
   import { axe } from 'jest-axe';

   test('CalendarioMensual es accesible', async () => {
     const { container } = render(<CalendarioMensual {...props} />);
     const results = await axe(container);
     expect(results).toHaveNoViolations();
   });
   ```

4. **Documentar**: Crear guía de accesibilidad para desarrolladores

---

## Recursos Adicionales

### Documentación
- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
- **MDN Accessibility**: https://developer.mozilla.org/en-US/docs/Web/Accessibility
- **WebAIM**: https://webaim.org/

### Cursos
- **Web Accessibility by Google** (Udacity, gratuito)
- **Accessibility Fundamentals** (Deque University)

### Comunidad
- **A11y Slack**: https://web-a11y.slack.com/
- **Reddit /r/accessibility**: https://reddit.com/r/accessibility

---

**Última actualización**: 20 de octubre de 2025
