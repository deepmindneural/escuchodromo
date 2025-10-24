# Índice de Tests E2E - Escuchodromo

Guía rápida para navegar los archivos de tests.

## Documentación Principal

| Archivo | Descripción | Audiencia |
|---------|-------------|-----------|
| [README.md](./README.md) | Documentación técnica completa | Desarrolladores |
| [EJECUTAR_TESTS.md](./EJECUTAR_TESTS.md) | Guía rápida de ejecución | QA, Desarrolladores |
| [INDICE.md](./INDICE.md) | Este índice | Todos |
| [../REPORTE_TESTS_E2E.md](../REPORTE_TESTS_E2E.md) | Reporte ejecutivo | Product Owners, Managers |

## Helpers (Utilidades)

| Archivo | Funciones principales | Cuándo usar |
|---------|----------------------|-------------|
| [helpers/auth.helper.ts](./helpers/auth.helper.ts) | `iniciarSesion()`, `verificarAutenticado()`, `cerrarSesion()` | Todos los tests que requieren autenticación |
| [helpers/console.helper.ts](./helpers/console.helper.ts) | `CaptorConsola`, `capturarErroresRed()`, `obtenerResumen()` | Detectar errores de consola y HTTP |
| [helpers/supabase.helper.ts](./helpers/supabase.helper.ts) | `CaptorRPC`, `validarLlamadaRPC()`, `validarRPCExitosa()` | Validar llamadas RPC a Supabase |

## Tests por Módulo

### Dashboard de Usuario

**Archivo**: [dashboard-usuario.spec.ts](./dashboard-usuario.spec.ts)

| Test ID | Descripción | Estado |
|---------|-------------|--------|
| TC-DASH-001 | Dashboard carga sin errores | ✅ |
| TC-DASH-002 | Estadísticas visibles | ✅ |
| TC-DASH-003 | 11 accesos rápidos | ✅ |
| TC-DASH-004 | Navegación a Chat | ✅ |
| TC-DASH-005 | Navegación a Evaluaciones | ✅ |
| TC-DASH-006 | Navegación a Voz | ✅ |
| TC-DASH-007 | Navegación a Perfil | ✅ |
| TC-DASH-008 | Navegación a Citas | ✅ |
| TC-DASH-009 | Navegación a Plan de Acción | ✅ |
| TC-DASH-010 | Info de crisis visible | ✅ |
| TC-DASH-011 | **No errores 406** | ✅ |
| TC-DASH-012 | **No errores 403** | ✅ |
| TC-DASH-013 | Navegación funcional | ✅ |

**Ejecución**:
```bash
npx playwright test dashboard-usuario
```

---

### Dashboard de Profesional

**Archivo**: [dashboard-profesional.spec.ts](./dashboard-profesional.spec.ts)

| Test ID | Descripción | Estado |
|---------|-------------|--------|
| TC-PROF-001 | Redirección a login | ✅ |
| TC-PROF-002 | Usuario regular no accede | ⚠️ SKIPPED |
| TC-PROF-003 | Dashboard carga | ⚠️ SKIPPED |
| TC-PROF-004 | Métricas clave | ⚠️ SKIPPED |
| TC-PROF-005 | Tabla de pacientes | ⚠️ SKIPPED |
| TC-PROF-006 | Próximas citas | ⚠️ SKIPPED |
| TC-PROF-007 | Navegación a planes | ⚠️ SKIPPED |
| TC-PROF-008 | Navegación a pacientes | ⚠️ SKIPPED |
| TC-PROF-009 | Navegación a calendario | ⚠️ SKIPPED |
| TC-PROF-010 | Verificación suscripción | ⚠️ SKIPPED |
| TC-PROF-011 | **No errores 406** | ⚠️ SKIPPED |
| TC-PROF-012 | **No errores 403** | ⚠️ SKIPPED |
| TC-PROF-013 | Ruta existe | ✅ |

**Nota**: Tests skipped requieren usuario profesional en BD.

**Habilitar**:
1. Crear seed de profesional
2. Remover `.skip` en los tests

**Ejecución**:
```bash
npx playwright test dashboard-profesional
```

---

### Planes y Suscripciones

**Archivo**: [planes-suscripciones.spec.ts](./planes-suscripciones.spec.ts)

| Test ID | Descripción | Estado | Crítico |
|---------|-------------|--------|---------|
| TC-PLANES-001 | Página carga | ✅ | |
| TC-PLANES-002 | **RPC obtener_planes_publico exitoso** | ❌ 406 | 🔴 |
| TC-PLANES-003 | 3 planes visibles | ✅ | |
| TC-PLANES-004 | Selector COP/USD | ✅ | |
| TC-PLANES-005 | Características visibles | ✅ | |
| TC-PLANES-006 | Botones funcionales | ✅ | |
| TC-PLANES-007 | Navegación a checkout | ✅ | |
| TC-PLANES-008 | **No errores 406** | ❌ | 🔴 |
| TC-PLANES-009 | Planes profesionales | ✅ | |
| TC-PLANES-010 | Manejo de errores | ✅ | |
| TC-PLANES-011 | Toggle mensual/anual | ✅ | |
| TC-PLANES-012 | Validación datos RPC | ✅ | |

**IMPORTANTE**: TC-PLANES-002 y TC-PLANES-008 están diseñados para **detectar error 406**.

**Ejecución**:
```bash
# Todos los tests de planes
npx playwright test planes-suscripciones

# Solo el test crítico del error 406
npx playwright test -g "TC-PLANES-002"
```

---

### Navegación Completa

**Archivo**: [navegacion-dashboards.spec.ts](./navegacion-dashboards.spec.ts)

| Test ID | Descripción | Estado |
|---------|-------------|--------|
| TC-NAV-001 | Flujo completo Login → Dashboard → Planes | ✅ |
| TC-NAV-002 | Dashboard → Chat → Dashboard | ✅ |
| TC-NAV-003 | Dashboard → Evaluaciones → Dashboard | ✅ |
| TC-NAV-004 | Dashboard → Perfil → Dashboard | ✅ |
| TC-NAV-005 | Navegación persistente | ✅ |
| TC-NAV-006 | Breadcrumbs/indicadores | ✅ |
| TC-NAV-007 | Enlaces principales | ✅ |
| TC-NAV-008 | Botones atrás/adelante | ✅ |
| TC-NAV-009 | Reporte completo | ✅ |
| TC-NAV-010 | **No errores 406 acumulados** | ✅ |

**Ejecución**:
```bash
npx playwright test navegacion-dashboards
```

---

## Tests por Criticidad

### 🔴 CRÍTICOS (Error 406)

Estos tests **deben pasar** antes de production:

```bash
# Test principal del error 406
npx playwright test -g "TC-PLANES-002"

# Todos los tests de validación 406
npx playwright test -g "406"
```

### 🟡 IMPORTANTES (Funcionalidad Core)

```bash
# Dashboard de usuario completo
npx playwright test dashboard-usuario

# Navegación completa
npx playwright test navegacion-dashboards
```

### 🟢 COMPLEMENTARIOS

```bash
# Dashboard profesional (requiere seed)
npx playwright test dashboard-profesional
```

---

## Ejecución por Escenario

### Escenario 1: Validar fix del error 406

```bash
# Ejecutar solo tests relacionados con error 406
npx playwright test -g "406"
```

**Resultado esperado**: Todos pasan ✅

---

### Escenario 2: Smoke test rápido

```bash
# Solo Chromium, tests críticos
npx playwright test --project=chromium -g "TC-PLANES-002|TC-NAV-001|TC-DASH-011"
```

**Duración**: ~1 minuto

---

### Escenario 3: Suite completa antes de deploy

```bash
# Todos los tests, todos los navegadores
npm run test:e2e
```

**Duración**: ~3-5 minutos

---

### Escenario 4: Desarrollo iterativo

```bash
# Con UI para ver en tiempo real
npm run test:e2e:ui
```

Selecciona el test que quieras ver.

---

## Búsqueda Rápida

### ¿Necesitas validar...?

| Funcionalidad | Test | Comando |
|---------------|------|---------|
| Login funciona | dashboard-usuario.spec.ts | `npx playwright test dashboard-usuario -g "TC-DASH-001"` |
| Planes cargan | planes-suscripciones.spec.ts | `npx playwright test -g "TC-PLANES-001"` |
| Error 406 corregido | planes-suscripciones.spec.ts | `npx playwright test -g "TC-PLANES-002"` |
| Navegación fluida | navegacion-dashboards.spec.ts | `npx playwright test -g "TC-NAV-001"` |
| Dashboard profesional | dashboard-profesional.spec.ts | `npx playwright test dashboard-profesional` |
| RPC Supabase | planes-suscripciones.spec.ts | `npx playwright test -g "RPC"` |

### ¿Necesitas ayuda con...?

| Problema | Solución |
|----------|----------|
| Ejecutar tests | Ver [EJECUTAR_TESTS.md](./EJECUTAR_TESTS.md) |
| Entender arquitectura | Ver [README.md](./README.md) |
| Reportar a managers | Ver [../REPORTE_TESTS_E2E.md](../REPORTE_TESTS_E2E.md) |
| Crear nuevo test | Ver helpers en `e2e/helpers/` |
| Error 406 | Ver TC-PLANES-002 en `planes-suscripciones.spec.ts` |

---

## Estadísticas

- **Total archivos**: 11 (3 helpers + 8 tests)
- **Total casos de prueba**: 48
- **Cobertura**: Dashboards (26), Planes (12), Navegación (10)
- **Estado**: 41 funcionales, 7 skipped
- **Líneas de código**: ~2,578

---

## Actualizaciones Recientes

**2025-10-24**:
- ✅ Creados 3 helpers reutilizables
- ✅ Agregado dashboard-profesional.spec.ts (13 casos)
- ✅ Agregado planes-suscripciones.spec.ts (12 casos)
- ✅ Agregado navegacion-dashboards.spec.ts (10 casos)
- ✅ Documentación completa

---

## Contacto

Para preguntas sobre tests específicos:
- **Dashboard**: Ver `dashboard-usuario.spec.ts` o `dashboard-profesional.spec.ts`
- **Planes**: Ver `planes-suscripciones.spec.ts`
- **Navegación**: Ver `navegacion-dashboards.spec.ts`
- **Helpers**: Ver archivos en `helpers/`

---

**Última actualización**: 2025-10-24
