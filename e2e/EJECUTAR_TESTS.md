# Guía Rápida: Ejecutar Tests E2E

## Inicio Rápido (Quick Start)

### 1. Ejecutar TODOS los tests

```bash
npm run test:e2e
```

Este comando:
- Inicia automáticamente el servidor Next.js en `localhost:3000`
- Ejecuta todos los tests en paralelo
- Genera reporte HTML en `playwright-report/`

### 2. Ejecutar con interfaz visual (RECOMENDADO)

```bash
npm run test:e2e:ui
```

Beneficios:
- Ver los tests en tiempo real
- Pausar y depurar
- Ver screenshots automáticos
- Ideal para desarrollo

### 3. Ejecutar solo tests de planes (detectar error 406)

```bash
npx playwright test planes-suscripciones
```

### 4. Ejecutar solo tests de dashboards

```bash
npx playwright test dashboard-usuario
npx playwright test dashboard-profesional
npx playwright test navegacion-dashboards
```

## Modos de Ejecución

### Modo Debug (Paso a Paso)

```bash
npm run test:e2e:debug
```

Útil para:
- Ver exactamente qué está haciendo el test
- Inspeccionar elementos
- Diagnosticar fallos

### Modo Headed (Ver navegador)

```bash
npx playwright test --headed
```

### Solo en Chromium (más rápido)

```bash
npx playwright test --project=chromium
```

### Ejecutar test específico

```bash
# Por nombre de archivo
npx playwright test planes-suscripciones

# Por nombre de test
npx playwright test -g "TC-PLANES-002"

# Múltiples patrones
npx playwright test -g "TC-PLANES|TC-NAV"
```

## Escenarios Comunes

### Escenario 1: Verificar error 406 en planes

```bash
# Ejecutar solo el test crítico
npx playwright test planes-suscripciones -g "TC-PLANES-002"
```

**Resultado esperado AHORA**: ❌ FALLA (error 406)
**Resultado esperado DESPUÉS de fix**: ✅ PASA

### Escenario 2: Verificar flujo completo de navegación

```bash
npx playwright test navegacion-dashboards -g "TC-NAV-001"
```

Valida: Login → Dashboard → Planes → Regreso sin errores

### Escenario 3: Verificar dashboard de usuario funcional

```bash
npx playwright test dashboard-usuario
```

Valida: 13 casos de prueba del dashboard

### Escenario 4: Verificar accesos rápidos

```bash
npx playwright test dashboard-usuario -g "accesos rápidos"
```

## Reportes y Resultados

### Ver último reporte

```bash
npx playwright show-report
```

Abre navegador con reporte HTML detallado:
- Screenshots de fallos
- Videos de ejecución
- Traces completos

### Ver traces (grabaciones)

```bash
npx playwright show-trace trace.zip
```

## Configuración del Entorno

### Variables Requeridas

Archivo `.env` debe contener:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key_supabase
```

### Base de Datos

Debe existir usuario de prueba:

```sql
-- Usuario regular (REQUERIDO)
email: rrr@rrr.com
password: 123456

-- Admin (opcional)
email: admin@escuchodromo.com
password: 123456

-- Profesional (PENDIENTE - tests skipped sin esto)
email: profesional@escuchodromo.com
password: 123456
rol: TERAPEUTA
```

## Solución de Problemas

### Error: "Server already running"

```bash
# Detener servidor existente
lsof -ti:3000 | xargs kill -9

# Ejecutar tests de nuevo
npm run test:e2e
```

### Error: "Timeout waiting for page"

Aumentar timeout en `playwright.config.ts`:

```typescript
timeout: 60 * 1000, // 60 segundos
```

### Tests fallan pero deberían pasar

```bash
# Limpiar y reinstalar
npm ci
npx playwright install

# Ejecutar de nuevo
npm run test:e2e
```

## Integración Continua (CI)

### En GitHub Actions

```bash
npm run test:ci:e2e
```

Configuración automática:
- 1 worker (secuencial)
- 2 retries por test
- Reporter GitHub
- Screenshots/videos de fallos

## Navegadores Soportados

Por defecto, tests corren en:
- ✅ Chromium (Chrome/Edge)
- ✅ Firefox
- ✅ WebKit (Safari)
- ✅ Mobile Chrome
- ✅ Mobile Safari
- ✅ iPad

### Ejecutar solo un navegador

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Comandos Avanzados

### Ejecutar en paralelo (máximo velocidad)

```bash
npx playwright test --workers=4
```

### Ejecutar con video siempre

```bash
npx playwright test --video=on
```

### Ejecutar con screenshots de cada paso

```bash
npx playwright test --screenshot=on
```

### Actualizar screenshots baseline

```bash
npx playwright test --update-snapshots
```

## Checklist Pre-Deployment

Antes de hacer deploy, ejecutar:

```bash
# 1. Todos los tests E2E
npm run test:e2e

# 2. Verificar error 406 específicamente
npx playwright test planes-suscripciones -g "406"

# 3. Verificar navegación completa
npx playwright test navegacion-dashboards

# 4. Ver reporte
npx playwright show-report
```

✅ Todos los tests deben pasar
✅ No debe haber errores 406
✅ No debe haber errores 403

## Métricas de Éxito

### Cobertura Actual

- **Dashboard Usuario**: 13 casos de prueba ✅
- **Dashboard Profesional**: 13 casos (7 skipped - requieren seed) ⚠️
- **Planes**: 12 casos (detectan error 406) ❌
- **Navegación**: 10 casos completos ✅

### Meta de Calidad

- 0 errores 406 en producción
- 0 errores 403 no autorizados
- Tiempo de carga < 2 segundos
- 100% navegación funcional

## Próximos Pasos

1. **Corregir error 406 en RPC `obtener_planes_publico`**
   - Verificar firma de función
   - Verificar parámetros en llamada
   - Validar permisos

2. **Agregar seed de profesional**
   - Crear usuario TERAPEUTA
   - Habilitar tests skipped

3. **Expandir cobertura**
   - Tests de checkout
   - Tests de evaluaciones completas
   - Tests de chat en tiempo real

## Recursos

- [Playwright Docs](https://playwright.dev/)
- [Test Automation Best Practices](https://playwright.dev/docs/best-practices)
- [CI/CD Guide](https://playwright.dev/docs/ci)

---

**TL;DR** - Ejecuta esto para empezar:

```bash
npm run test:e2e:ui
```

Luego haz click en el test que quieras ver. ¡Así de simple!
