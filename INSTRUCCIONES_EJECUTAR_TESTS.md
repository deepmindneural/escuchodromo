# INSTRUCCIONES PARA EJECUTAR TESTS E2E

## ANTES DE EMPEZAR

### 1. Verificar que la aplicación esté corriendo

```bash
# En una terminal, ejecutar:
npm run dev

# Esperar a que muestre:
# ✓ Ready in X ms
# - Local: http://localhost:3000
```

### 2. Verificar que se puede acceder

```bash
# En otra terminal:
curl http://localhost:3000

# Debe devolver HTML (código 200)
```

## EJECUTAR TESTS

### Opción 1: Ejecutar TODO (Recomendado)

```bash
# Ejecutar todas las suites de tests
npx playwright test --project=chromium --reporter=list,html

# Al terminar, automáticamente abre el reporte HTML
npx playwright show-report
```

### Opción 2: Ejecutar por Suite

```bash
# Solo Dashboard
npx playwright test e2e/dashboard-usuario.spec.ts --project=chromium --reporter=list

# Solo Evaluaciones
npx playwright test e2e/evaluaciones.spec.ts --project=chromium --reporter=list

# Solo Navegación
npx playwright test e2e/navegacion.spec.ts --project=chromium --reporter=list

# Solo Login (test rápido)
npx playwright test e2e/login-simple.spec.ts --project=chromium --reporter=list
```

### Opción 3: Modo Interactivo (UI)

```bash
# Abre una interfaz gráfica para ejecutar tests
npx playwright test --ui
```

### Opción 4: Modo Debug

```bash
# Ejecutar con inspector paso a paso
npx playwright test --debug

# Debug de un test específico
npx playwright test e2e/dashboard-usuario.spec.ts:41 --debug
```

## VER RESULTADOS

### Reporte HTML

```bash
# Generar y abrir reporte
npx playwright show-report
```

El reporte muestra:
- ✅ Tests que pasaron (verde)
- ❌ Tests que fallaron (rojo)
- ⏭️ Tests que se saltearon (amarillo)
- 📸 Screenshots de errores
- 🎥 Videos de tests fallidos
- 📊 Estadísticas de ejecución

### Screenshots de Errores

```bash
# Ver screenshots
open test-results/

# Estructura:
# test-results/
#   ├── dashboard-usuario-TC-DASH-001/
#   │   ├── test-failed-1.png
#   │   └── video.webm
#   └── evaluaciones-TC-EVAL-001/
#       ├── test-failed-1.png
#       └── video.webm
```

### Logs en Consola

Durante la ejecución, verás:

```
🔍 Verificando aplicación...
✅ Aplicación corriendo

📊 Ejecutando tests...

  ✓ TC-DASH-001: Debe cargar el dashboard sin errores (2.3s)
  ✓ TC-DASH-002: Debe mostrar estadísticas del usuario (1.8s)
  ❌ TC-DASH-011: No debe tener errores 406 en llamadas API (3.1s)

📊 RESUMEN DE ERRORES:
   - Total errores: 3
   - Errores 406: 2
   - Errores 403: 1
   - Errores 404: 0
   - Errores API: 3
```

## ANALIZAR ERRORES DETECTADOS

### Paso 1: Ver Reporte HTML

```bash
npx playwright show-report
```

En el reporte:
1. Click en test FALLIDO (rojo)
2. Ver screenshot del momento del error
3. Ver trace completo de la ejecución
4. Copiar stack trace del error

### Paso 2: Ver Errores de Consola

Los tests capturan automáticamente:
- ❌ Errores JavaScript
- ⚠️ Warnings
- 🔴 Errores HTTP (406, 403, 404, 500)
- 🌐 Requests fallidos

Buscar en los logs:

```
[CONSOLE ERROR] HTTP 406: Not Acceptable - https://...
[CONSOLE ERROR] Failed to load resource: the server responded with a status of 403
[REQUEST FAILED] http://localhost:3000/api/... - net::ERR_ABORTED
```

### Paso 3: Priorizar Fixes

Usar `REPORTE_TESTING_DASHBOARD_EVALUACIONES.md` para:
1. Ver errores por severidad (🔴 Crítico, 🟠 Alto, 🟡 Medio)
2. Identificar archivos afectados
3. Ver acciones requeridas específicas

## TROUBLESHOOTING

### Error: "Aplicación no está corriendo"

```bash
# Verificar puerto 3000
lsof -i :3000

# Si está ocupado, matar proceso
kill -9 <PID>

# Iniciar app nuevamente
npm run dev
```

### Error: "Timeout waiting for navigation"

**Causa:** La app tarda mucho en cargar o hay redirección infinita

**Solución:**
1. Verificar logs del servidor (`npm run dev`)
2. Verificar que Supabase esté configurado (archivo `.env`)
3. Aumentar timeout en `playwright.config.ts`:
   ```typescript
   timeout: 60000, // 60 segundos
   ```

### Error: "Element not found"

**Causa:** El selector ha cambiado o el elemento no existe

**Solución:**
1. Ejecutar con `--debug` para ver el DOM
2. Actualizar selector en el test
3. Agregar `data-testid` al componente:
   ```tsx
   <button data-testid="boton-enviar">Enviar</button>
   ```

### Error: "Authentication failed"

**Causa:** Usuario `rrr@rrr.com` no existe en BD o password incorrecto

**Solución:**
1. Verificar en Supabase que el usuario existe
2. Si no existe, crearlo:
   ```sql
   INSERT INTO "User" (email, password, rol)
   VALUES ('rrr@rrr.com', '<password_hash>', 'USUARIO');
   ```
3. O usar credenciales alternativas en `e2e/helpers/auth.helper.ts`

### Tests muy lentos

**Optimizaciones:**

```bash
# Ejecutar solo en Chromium (más rápido)
npx playwright test --project=chromium

# Ejecutar en paralelo (solo si no hay problemas de estado)
npx playwright test --workers=4

# Deshabilitar videos (más rápido)
npx playwright test --config playwright.config.ts \
  --reporter=list \
  --retries=0
```

## CONFIGURACIÓN AVANZADA

### Ejecutar en modo headless

```bash
# Por defecto es headless, pero para ver el navegador:
npx playwright test --headed
```

### Ejecutar en diferentes navegadores

```bash
# Firefox
npx playwright test --project=firefox

# Safari (WebKit)
npx playwright test --project=webkit

# Todos
npx playwright test --project=chromium --project=firefox --project=webkit
```

### Generar trace completo

```bash
# Útil para debugging profundo
npx playwright test --trace on

# Ver trace
npx playwright show-trace test-results/.../trace.zip
```

## CHECKLIST DE EJECUCIÓN

- [ ] Aplicación corriendo en `http://localhost:3000`
- [ ] Variables de entorno configuradas (`.env`)
- [ ] Supabase accesible
- [ ] Usuario `rrr@rrr.com` existe en BD
- [ ] Tests GAD-7 y PHQ-9 existen en tabla `Test`
- [ ] Ejecutar: `npx playwright test --project=chromium`
- [ ] Revisar reporte HTML
- [ ] Capturar screenshots de errores
- [ ] Priorizar fixes según severidad
- [ ] Documentar errores encontrados

## PRÓXIMOS PASOS DESPUÉS DE EJECUTAR

1. **Abrir reporte HTML:**
   ```bash
   npx playwright show-report
   ```

2. **Tomar screenshots de errores importantes**

3. **Revisar `REPORTE_TESTING_DASHBOARD_EVALUACIONES.md`**

4. **Crear issues/tickets para cada error detectado**

5. **Priorizar según:**
   - 🔴 CRÍTICO: Errores 406/403, login fallido, evaluaciones no cargan
   - 🟠 ALTO: Navegación rota, plan de acción falla
   - 🟡 MEDIO: Problemas visuales, elementos faltantes

6. **Ejecutar tests nuevamente después de cada fix**

---

**Listo para ejecutar:** ✅
**Tiempo estimado:** 3-5 minutos para toda la suite
**Tests totales:** 38 casos de prueba
