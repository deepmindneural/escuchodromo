# Quick Start - Tests E2E

Empieza a usar los tests E2E en **menos de 5 minutos**.

## 1. Instalación (Solo la primera vez)

```bash
# Ya está instalado en package.json, solo asegúrate:
npm install

# Instalar navegadores de Playwright (solo primera vez)
npx playwright install
```

## 2. Ejecutar Tests

### Opción A: Con Interfaz Visual (RECOMENDADO)

```bash
npm run test:e2e:ui
```

**Ventajas**:
- Ver tests en tiempo real
- Pausar y depurar
- Inspeccionar elementos
- Screenshots automáticos

### Opción B: En Terminal

```bash
npm run test:e2e
```

**Ventajas**:
- Más rápido
- Mejor para CI/CD
- Reporte HTML al final

## 3. Ver Resultados

Después de ejecutar los tests, abre el reporte:

```bash
npx playwright show-report
```

## 4. Tests Específicos

### Validar el error 406 (CRÍTICO)

```bash
npx playwright test -g "TC-PLANES-002"
```

**Resultado esperado AHORA**: ❌ Falla (error 406)
**Resultado esperado DESPUÉS del fix**: ✅ Pasa

### Validar dashboard de usuario

```bash
npx playwright test dashboard-usuario
```

### Validar navegación completa

```bash
npx playwright test navegacion-dashboards
```

## 5. Próximos Pasos

- Lee [README.md](./README.md) para documentación completa
- Lee [EJECUTAR_TESTS.md](./EJECUTAR_TESTS.md) para comandos avanzados
- Lee [INDICE.md](./INDICE.md) para navegar todos los tests
- Lee [../REPORTE_TESTS_E2E.md](../REPORTE_TESTS_E2E.md) para reporte ejecutivo

## Comandos Más Usados

```bash
# UI interactiva
npm run test:e2e:ui

# Todos los tests
npm run test:e2e

# Solo tests críticos (error 406)
npx playwright test -g "406"

# Solo Chromium (más rápido)
npx playwright test --project=chromium

# Ver último reporte
npx playwright show-report
```

## Solución de Problemas

### Error: "Server already running on port 3000"

```bash
# Detener el servidor
lsof -ti:3000 | xargs kill -9

# Ejecutar de nuevo
npm run test:e2e
```

### Tests muy lentos

```bash
# Ejecutar solo en Chromium
npx playwright test --project=chromium

# O con menos workers
npx playwright test --workers=1
```

### No encuentras un test

```bash
# Buscar por ID
npx playwright test -g "TC-PLANES-002"

# Buscar por palabra clave
npx playwright test -g "login"
npx playwright test -g "dashboard"
```

## FAQs

**P: ¿Cuánto tardan los tests?**
R: ~1-2 min (Chromium solo) o ~3-5 min (todos los navegadores)

**P: ¿Necesito tener el servidor corriendo?**
R: No, Playwright lo inicia automáticamente

**P: ¿Cómo veo qué está haciendo el test?**
R: Usa `npm run test:e2e:ui` para ver en tiempo real

**P: ¿Cómo depuro un test que falla?**
R: Usa `npm run test:e2e:debug` y haz click en el test

**P: ¿Dónde están los screenshots?**
R: En `playwright-report/` después de ejecutar tests

**P: ¿Puedo ejecutar solo un test?**
R: Sí: `npx playwright test -g "TC-PLANES-002"`

## Contacto

Si tienes dudas:
1. Lee la documentación en `e2e/README.md`
2. Revisa el índice en `e2e/INDICE.md`
3. Consulta el reporte ejecutivo en `REPORTE_TESTS_E2E.md`

---

**TL;DR**:

```bash
# Instalar (solo una vez)
npx playwright install

# Ejecutar
npm run test:e2e:ui

# ¡Listo!
```
