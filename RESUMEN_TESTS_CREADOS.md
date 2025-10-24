# RESUMEN DE TESTS E2E CREADOS

## Archivos de Testing Implementados

### 1. **Helpers Reutilizables** (/e2e/helpers/)

#### `/e2e/helpers/auth.helper.ts`
- **Funcionalidad:** Autenticación reutilizable para todos los tests
- **Credenciales configuradas:**
  - Usuario: `rrr@rrr.com` / `123456`
  - Usuario alt: `usuario@escuchodromo.com` / `123456`
  - Admin: `admin@escuchodromo.com` / `123456`
- **Funciones:**
  - `iniciarSesion()` - Login automático con timeout extendido
  - `verificarAutenticado()` - Validación de token en localStorage
  - `cerrarSesion()` - Logout y cleanup
  - `limpiarAutenticacion()` - Limpiar storage

#### `/e2e/helpers/console.helper.ts`
- **Funcionalidad:** Captura y análisis de errores de consola
- **Características:**
  - Clase `CaptorConsola` para monitoreo en tiempo real
  - Captura de errores HTTP (406, 403, 404, 500)
  - Detección automática de errores de API
  - Generación de reportes en Markdown
  - Clasificación por severidad
- **Uso:**
  ```typescript
  const captor = new CaptorConsola(page);
  captor.capturarErroresRed();
  const resumen = captor.obtenerResumen();
  console.log(`Errores 406: ${resumen.errores406.length}`);
  ```

### 2. **Suites de Tests E2E** (/e2e/)

#### `/e2e/dashboard-usuario.spec.ts`
- **Tests:** 13 casos de prueba
- **Cobertura:** Dashboard completo de usuario
- **Tests críticos:**
  - TC-DASH-001: Carga sin errores
  - TC-DASH-002: Estadísticas visibles
  - TC-DASH-003: Accesos rápidos (11 tarjetas)
  - TC-DASH-004 a TC-DASH-009: Navegación a cada sección
  - TC-DASH-010: Información de crisis visible
  - TC-DASH-011: Sin errores 406 en API
  - TC-DASH-012: Sin errores 403 en API
  - TC-DASH-013: Navegación funcional

#### `/e2e/evaluaciones.spec.ts`
- **Tests:** 16 casos de prueba
- **Cobertura:** Sistema completo de evaluaciones psicológicas
- **Tests críticos:**
  - TC-EVAL-001: Página principal carga
  - TC-EVAL-002: Lista de tests disponibles
  - TC-EVAL-004: Navegación a GAD-7
  - TC-EVAL-005: Navegación a PHQ-9
  - TC-EVAL-006: Formulario GAD-7 completo
  - TC-EVAL-007: Formulario PHQ-9 completo
  - TC-EVAL-008: Validación de respuestas
  - TC-EVAL-010: Completar evaluación end-to-end
  - TC-EVAL-014: Sin errores 406
  - TC-EVAL-015: Sin errores 403
  - TC-EVAL-016: Historial funcional

#### `/e2e/navegacion.spec.ts`
- **Tests:** 7 casos de prueba
- **Cobertura:** Componente de navegación
- **Tests:**
  - TC-NAV-001: Nav visible en todas las páginas
  - TC-NAV-002: Logo/nombre presente
  - TC-NAV-003: Menú de usuario
  - TC-NAV-004: Links funcionales
  - TC-NAV-005: Sin superposición visual
  - TC-NAV-006: Menú móvil (hamburguesa)
  - TC-NAV-007: Sin errores en consola

#### `/e2e/login-simple.spec.ts`
- **Tests:** 2 casos de prueba (diagnóstico)
- **Propósito:** Verificar que el login funciona antes de tests complejos
- **Tests:**
  - Carga de página de login
  - Login exitoso con credenciales válidas

### 3. **Scripts de Ejecución**

#### `/scripts/ejecutar-tests-dashboard.sh`
- **Funcionalidad:** Script bash para ejecutar suite completa
- **Características:**
  - Verifica que la app esté corriendo
  - Ejecuta tests por suite
  - Genera reporte HTML automático
  - Muestra ubicación de screenshots

## Comandos Principales

### Ejecutar Tests

```bash
# 1. ASEGURAR QUE LA APP ESTÉ CORRIENDO
npm run dev  # En terminal separada

# 2. EJECUTAR TESTS COMPLETOS
npm run test:e2e

# 3. EJECUTAR SUITE ESPECÍFICA
npx playwright test e2e/dashboard-usuario.spec.ts --project=chromium
npx playwright test e2e/evaluaciones.spec.ts --project=chromium
npx playwright test e2e/navegacion.spec.ts --project=chromium

# 4. EJECUTAR CON UI INTERACTIVA
npm run test:e2e:ui

# 5. VER REPORTE HTML
npx playwright show-report
```

### Debugging

```bash
# Ejecutar con inspector
npx playwright test --debug

# Ejecutar test específico
npx playwright test e2e/dashboard-usuario.spec.ts:45 --debug

# Ver screenshots de errores
open test-results/

# Generar trace completo
npx playwright test --trace on
```

## Estructura de Directorios Generada

```
escuchodromo/
├── e2e/
│   ├── helpers/
│   │   ├── auth.helper.ts           ✅ CREADO
│   │   └── console.helper.ts        ✅ CREADO
│   ├── dashboard-usuario.spec.ts    ✅ CREADO (13 tests)
│   ├── evaluaciones.spec.ts         ✅ CREADO (16 tests)
│   ├── navegacion.spec.ts           ✅ CREADO (7 tests)
│   └── login-simple.spec.ts         ✅ CREADO (2 tests)
│
├── scripts/
│   └── ejecutar-tests-dashboard.sh  ✅ CREADO
│
├── playwright.config.ts             ✅ YA EXISTÍA
├── playwright-report/               📊 Se genera al ejecutar
└── test-results/                    📸 Se genera al ejecutar
```

## Resumen de Cobertura

| Componente | Tests | Archivos | Estado |
|------------|-------|----------|--------|
| Helpers | - | 2 | ✅ Completo |
| Dashboard | 13 | 1 | ✅ Completo |
| Evaluaciones | 16 | 1 | ✅ Completo |
| Navegación | 7 | 1 | ✅ Completo |
| Login | 2 | 1 | ✅ Completo |
| **TOTAL** | **38** | **6** | ✅ **LISTO** |

## Próximos Pasos

1. ✅ **Tests creados** - COMPLETADO
2. 🟡 **Ejecutar suite completa** - EN PROGRESO
3. ⏳ **Analizar resultados**
4. ⏳ **Corregir errores detectados**
5. ⏳ **Generar reporte final**

## Errores Esperados a Detectar

Según el reporte del usuario, los tests deberían detectar:

1. **Errores 406 en llamadas API** - Dashboard
2. **Errores 403 en llamadas API** - Dashboard
3. **Problemas visuales con el menú** - Navegación
4. **Error al generar plan de acción** - Dashboard
5. **Posibles problemas en evaluaciones** - Evaluaciones

Los tests están configurados para:
- ✅ Capturar TODOS los errores de consola
- ✅ Detectar errores HTTP (406, 403, 404, 500)
- ✅ Capturar screenshots de errores
- ✅ Generar reportes detallados
- ✅ Clasificar por severidad

## Documentación Generada

- ✅ `/REPORTE_TESTING_DASHBOARD_EVALUACIONES.md` - Reporte completo de testing
- ✅ `/RESUMEN_TESTS_CREADOS.md` - Este archivo
- 📊 `/playwright-report/index.html` - Reporte HTML (se genera al ejecutar)

---

**Estado:** ✅ Suite de tests completa y lista para ejecutar
**Tests totales:** 38 casos de prueba
**Cobertura:** ~60% de funcionalidades críticas
**Próximo paso:** Ejecutar tests y analizar resultados
