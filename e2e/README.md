# Suite de Tests E2E - Escuchodromo

Esta carpeta contiene tests automatizados End-to-End (E2E) usando Playwright para validar flujos completos de usuario en la plataforma Escuchodromo.

## Estructura de Tests

```
e2e/
├── helpers/                          # Utilidades reutilizables
│   ├── auth.helper.ts               # Funciones de autenticación y login
│   ├── console.helper.ts            # Captura de errores de consola y red
│   └── supabase.helper.ts           # Validación de llamadas RPC a Supabase
│
├── dashboard-usuario.spec.ts         # Tests del dashboard de usuario
├── dashboard-profesional.spec.ts     # Tests del dashboard de profesional
├── planes-suscripciones.spec.ts      # Tests de página de planes
├── navegacion-dashboards.spec.ts     # Tests de navegación completa
├── evaluaciones.spec.ts              # Tests de evaluaciones psicológicas
├── navegacion.spec.ts                # Tests de navegación general
├── login-simple.spec.ts              # Tests de login básico
└── README.md                         # Esta documentación
```

## Objetivos de los Tests

### 1. Detección de Errores Críticos

Los tests están diseñados para **detectar y prevenir** errores críticos:

- **Error 406 (Not Acceptable)**: Llamadas RPC a Supabase con parámetros incorrectos
- **Error 403 (Forbidden)**: Problemas de permisos y autenticación
- **Error 404 (Not Found)**: Recursos o rutas faltantes
- **Errores de consola**: JavaScript errors, warnings, failed requests

### 2. Validación de Flujos Completos

#### Dashboard de Usuario (`dashboard-usuario.spec.ts`)
- Login y redirección correcta
- Carga de estadísticas sin errores
- Navegación entre secciones
- Accesos rápidos funcionales

#### Dashboard de Profesional (`dashboard-profesional.spec.ts`)
- Acceso restringido por rol
- Métricas de pacientes
- Gestión de citas
- Navegación a planes profesionales

#### Planes y Suscripciones (`planes-suscripciones.spec.ts`)
- **CRÍTICO**: Carga de planes vía RPC `obtener_planes_publico`
- Validación de respuesta sin error 406
- Visualización de 3 planes mínimo
- Toggle mensual/anual
- Botones de selección funcionales

#### Navegación Completa (`navegacion-dashboards.spec.ts`)
- Flujo: Login → Dashboard → Planes → Regreso
- Navegación entre secciones sin errores acumulados
- Persistencia de navegación (header, breadcrumbs)
- Botones adelante/atrás del navegador

## Casos de Prueba Clave

### Error 406 en RPC (Casos Críticos)

```typescript
// TC-PLANES-002: Debe llamar RPC obtener_planes_publico exitosamente
test('TC-PLANES-002', async ({ page }) => {
  const resultadoRPC = await validarLlamadaRPC(page, 'obtener_planes_publico');

  // DEBE FALLAR si hay error 406
  expect(resultadoRPC.codigo).not.toBe(406);
  expect(resultadoRPC.exito).toBe(true);
});
```

### Navegación Sin Errores

```typescript
// TC-NAV-001: Flujo completo sin errores 406
test('TC-NAV-001', async ({ page }) => {
  await iniciarSesion(page, CREDENCIALES_PRUEBA.usuario);
  await page.goto('/dashboard');
  await page.goto('/precios');

  // No debe haber errores acumulados
  expect(totalErrores406).toBe(0);
});
```

## Ejecución de Tests

### Comandos Disponibles

```bash
# Ejecutar todos los tests E2E
npm run test:e2e

# Ejecutar con interfaz visual (recomendado para desarrollo)
npm run test:e2e:ui

# Ejecutar en modo debug (paso a paso)
npm run test:e2e:debug

# Ejecutar solo tests de planes (ejemplo)
npx playwright test planes-suscripciones

# Ejecutar solo un test específico
npx playwright test planes-suscripciones -g "TC-PLANES-002"
```

### Ejecución en CI/CD

```bash
# En GitHub Actions
npm run test:ci:e2e
```

## Configuración

### Requisitos Previos

1. **Aplicación corriendo**: Los tests inician automáticamente el servidor Next.js
2. **Base de datos seeded**: Debe existir usuario `rrr@rrr.com` con contraseña `123456`
3. **Variables de entorno**: Archivo `.env` configurado correctamente

### Credenciales de Prueba

Definidas en `helpers/auth.helper.ts`:

```typescript
export const CREDENCIALES_PRUEBA = {
  usuario: {
    email: 'rrr@rrr.com',
    password: '123456'
  },
  admin: {
    email: 'admin@escuchodromo.com',
    password: '123456'
  }
};
```

**IMPORTANTE**: Actualmente no existe credencial de profesional. Se requiere:

```sql
-- TODO: Crear en seed
INSERT INTO "Usuario" (email, rol, ...) VALUES
  ('profesional@escuchodromo.com', 'TERAPEUTA', ...);
```

## Helpers (Utilidades)

### 1. Auth Helper (`auth.helper.ts`)

```typescript
import { iniciarSesion, CREDENCIALES_PRUEBA, verificarAutenticado } from './helpers/auth.helper';

// Uso
await iniciarSesion(page, CREDENCIALES_PRUEBA.usuario);
await verificarAutenticado(page);
```

### 2. Console Helper (`console.helper.ts`)

Captura todos los errores de consola y red:

```typescript
import { CaptorConsola } from './helpers/console.helper';

const captor = new CaptorConsola(page);
captor.capturarErroresRed();

// Al final del test
const resumen = captor.obtenerResumen();
expect(resumen.errores406.length).toBe(0);
```

### 3. Supabase Helper (`supabase.helper.ts`)

Valida llamadas RPC específicas:

```typescript
import { CaptorRPC, validarLlamadaRPC } from './helpers/supabase.helper';

// Capturar todas las llamadas RPC
const captorRPC = new CaptorRPC(page);

// O validar una llamada específica
const resultado = await validarLlamadaRPC(page, 'obtener_planes_publico');
expect(resultado.exito).toBe(true);
```

## Interpretación de Resultados

### Tests que DEBEN FALLAR Actualmente

Estos tests están marcados para **documentar bugs conocidos**:

- `TC-PLANES-002`: Error 406 en `obtener_planes_publico`
- `TC-PLANES-008`: No debe tener errores 406 en carga de planes

**Una vez corregido el error 406, estos tests deben PASAR** y servir como regression tests.

### Tests Skipped (`.skip`)

Tests en `dashboard-profesional.spec.ts` están marcados como `.skip` porque:
- Requieren credencial de profesional en la BD
- Están listos para ejecutarse una vez se agregue el seed

Para habilitarlos:
1. Crear usuario profesional en seed
2. Actualizar credenciales en `auth.helper.ts`
3. Remover `.skip` de los tests

### Reporte de Errores

Los tests generan reportes detallados en consola:

```
📊 RESUMEN DE ERRORES:
   - Errores consola: 2
   - Errores RPC: 1
   - Errores 406: 1
   - RPC exitosos: 5

🔴 ERRORES 406 DETECTADOS EN RPC:
   1. obtener_planes_publico
      Error: function obtener_planes_publico(p_tipo_usuario => "paciente", p_moneda => "COP") does not exist
```

## Mejores Prácticas

### 1. Nombrado de Tests

```typescript
test('TC-[MODULO]-[NUM]: Descripción clara del caso', async ({ page }) => {
  // TC-PLANES-002: Segundo test del módulo de planes
});
```

### 2. Assertions Claras

```typescript
// ❌ Malo
expect(result).toBeTruthy();

// ✅ Bueno
expect(resumenRPC.errores406.length).toBe(0);
```

### 3. Logging Útil

```typescript
console.log('\n📊 ANÁLISIS DE DATOS RPC:');
console.log(`   - Total planes: ${planes.length}`);
```

### 4. Timeouts Apropiados

```typescript
// Para operaciones de red lentas
await page.waitForLoadState('networkidle', { timeout: 10000 });

// Para animaciones
await page.waitForTimeout(1000);
```

## Troubleshooting

### Test Falla: "Timeout esperando RPC"

**Problema**: La función RPC no responde en el tiempo esperado

**Solución**:
1. Verificar que la función RPC existe en Supabase
2. Verificar permisos de la función (debe ser pública si se llama sin auth)
3. Incrementar timeout: `validarLlamadaRPC(page, 'funcion', 20000)`

### Test Falla: "Error 406 Not Acceptable"

**Problema**: Parámetros incorrectos en llamada RPC

**Solución**:
1. Verificar firma de la función RPC en Supabase
2. Validar que los parámetros coinciden:
   ```sql
   -- En Supabase
   CREATE FUNCTION obtener_planes_publico(
     p_tipo_usuario TEXT,
     p_moneda TEXT
   )

   -- En frontend
   .rpc('obtener_planes_publico', {
     p_tipo_usuario: 'paciente',  // ✅ Coincide
     p_moneda: 'COP'              // ✅ Coincide
   })
   ```

### Test Falla: "No se encontró elemento"

**Problema**: Selector no localiza el elemento

**Solución**:
1. Usar Playwright Inspector: `npm run test:e2e:debug`
2. Verificar que la página cargó completamente
3. Usar selectores más robustos:
   ```typescript
   // ❌ Frágil
   page.locator('.plan-card')

   // ✅ Robusto
   page.getByRole('button', { name: /seleccionar/i })
   page.getByTestId('plan-card')
   ```

## Mantenimiento

### Actualizar Tests Cuando...

1. **Cambia el diseño UI**: Actualizar selectores
2. **Cambia la navegación**: Actualizar flujos en `navegacion-dashboards.spec.ts`
3. **Nueva función RPC**: Agregar validación en `supabase.helper.ts`
4. **Nuevo rol de usuario**: Agregar credenciales y tests específicos

### Code Coverage

Los tests E2E complementan (no reemplazan) tests unitarios:

- **Unit tests**: Lógica de negocio, funciones puras
- **Integration tests**: Interacción entre módulos
- **E2E tests**: Flujos completos de usuario

Meta: 80% cobertura combinada.

## Recursos Adicionales

- [Playwright Docs](https://playwright.dev/)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Tests](https://playwright.dev/docs/debug)
- [CI/CD Integration](https://playwright.dev/docs/ci)

## Contribuir

Al agregar nuevos tests:

1. Seguir la convención de nombrado `TC-[MODULO]-[NUM]`
2. Agregar logging útil con emojis para claridad
3. Validar errores 406 y 403 explícitamente
4. Documentar casos edge y limitaciones conocidas
5. Actualizar este README si es relevante

## Contacto

Para preguntas sobre los tests E2E, contactar al equipo de QA o abrir un issue en el repositorio.

---

**Última actualización**: 2025-10-24
**Versión de Playwright**: 1.48.2
