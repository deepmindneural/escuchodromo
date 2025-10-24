# AUDITORÍA UX: USUARIO FREE EN DASHBOARD

**Fecha:** 24 de octubre de 2025
**Archivo auditado:** `/src/app/dashboard/page.tsx`
**Problema reportado:** Usuario FREE no puede navegar en el dashboard
**Estado del problema:** ❌ NO CONFIRMADO - El código actual NO bloquea la navegación

---

## DIAGNÓSTICO PRINCIPAL

Después de analizar el código completo del dashboard, **NO he encontrado un bloqueo de navegación para usuarios FREE**. Todas las tarjetas de funcionalidad (12 en total) son visibles y clicables sin importar el plan del usuario.

### ✅ LO QUE ESTÁ BIEN IMPLEMENTADO

#### 1. **Todas las tarjetas son siempre visibles** (líneas 560-758)
```typescript
// NO hay condicionales como:
// if (suscripcion) { mostrar_tarjetas(); }

// Todas las tarjetas se renderizan directamente:
<Link href="/chat">
  <motion.div>...</motion.div>
</Link>
<Link href="/voz">
  <motion.div>...</motion.div>
</Link>
// ... etc (12 tarjetas en total)
```

✅ **Resultado:** Usuario FREE ve todas las opciones de navegación.

#### 2. **Sistema de límites es informativo, no bloqueante** (líneas 307-480)
- La sección "Mi Plan Actual" muestra información del plan
- NO bloquea el acceso al resto del dashboard
- Si no hay plan, usa fallback al plan "basico"

✅ **Resultado:** La ausencia de plan no oculta funcionalidades.

#### 3. **Manejo correcto de estados de carga**
```typescript
if (cargando || !usuario) {
  return <LoadingScreen />; // Solo mientras carga
}
```

✅ **Resultado:** Loading apropiado sin bloqueos permanentes.

---

## POSIBLES CAUSAS DEL PROBLEMA REPORTADO

Si un usuario reporta que "no puede navegar", estas son las causas más probables:

### 1. **Plan "basico" no existe en la base de datos** (CRÍTICO)

**Línea 135:**
```typescript
let codigoPlan = suscripcion?.plan || 'basico';
```

**Línea 154-164:**
```typescript
const planBasico = planesDisponibles?.find((p: any) => p.codigo === 'basico');
```

**Problema:** El código asume que existe un plan con `codigo = 'basico'` o `codigo = 'gratis'`.

**Verificación necesaria:**
```sql
-- Ejecutar en Supabase
SELECT codigo, nombre, esta_activo
FROM "Plan"
WHERE tipo_usuario = 'paciente'
  AND moneda = 'COP'
  AND esta_activo = true;
```

**Si no hay planes:** La sección "Mi Plan Actual" no se muestra, pero las tarjetas siguen visibles.

---

### 2. **Función RPC retorna vacía**

**Líneas 138-142:**
```typescript
const { data: planesDisponibles, error: errorPlanes } = await supabase
  .rpc('obtener_planes_publico', {
    p_tipo_usuario: 'paciente',
    p_moneda: 'COP'
  });
```

**Condiciones para que `obtener_planes_publico` retorne planes:**
- `tipo_usuario = 'paciente'`
- `moneda = 'COP'`
- `esta_activo = true`

**Si falla:** `planesDisponibles` es `[]` o `null`, pero NO debería afectar las tarjetas de navegación.

---

### 3. **Estado de carga infinito**

Si `cargandoPlan` nunca se resuelve:
- La sección "Mi Plan Actual" no se muestra (línea 307)
- Pero las tarjetas de navegación SÍ se muestran (línea 560)

**Impacto:** Bajo - solo afecta visibilidad de info del plan.

---

### 4. **Middleware bloqueando rutas internas**

El problema podría estar en el middleware de autenticación, no en el dashboard:

**Revisar:**
```typescript
// middleware.ts o similar
// ¿Hay bloqueos para rutas /chat, /evaluaciones, etc?
```

---

## MEJORAS PROPUESTAS PARA UX DE USUARIO FREE

Aunque el código actual NO bloquea, propongo estas mejoras para hacer la experiencia más clara y ética (principio de salud mental):

### MEJORA 1: Badges visuales de tipo de funcionalidad

**Antes (actual):**
```jsx
<h3>Chat con IA</h3>
<p>Habla con nuestra IA sobre cómo te sientes</p>
```

**Después (propuesto):**
```jsx
<span className="absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
  Gratis
</span>
<h3>Chat con IA</h3>
<p>Habla con nuestra IA sobre cómo te sientes</p>
```

**Beneficios:**
- Usuario sabe de inmediato qué es gratis
- Transparencia total sobre límites
- Reduce ansiedad sobre cargos inesperados

---

### MEJORA 2: Banner de bienvenida para usuario FREE

**Agregar antes de las tarjetas (líneas 307+):**

```jsx
{esPlanFree && (
  <motion.div className="mb-8 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
    <div className="flex items-start gap-4">
      <FaHeart className="text-2xl text-blue-600" />
      <div>
        <h2 className="text-xl font-bold text-blue-900 mb-2">
          Estás usando el Plan Gratuito
        </h2>
        <p className="text-blue-800 text-sm mb-3">
          Tienes acceso a funcionalidades básicas para comenzar tu viaje de bienestar emocional.
          Todas las secciones están disponibles, pero algunas tienen límites de uso mensuales.
        </p>
        <Link href="/precios">
          <button className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
            Ver Planes Premium
          </button>
        </Link>
      </div>
    </div>
  </motion.div>
)}
```

**Beneficios:**
- Comunica claramente el estado del usuario
- NO culpabiliza por usar plan FREE
- Incentiva upgrade sin bloquear acceso

---

### MEJORA 3: Manejo explícito de error en carga de plan

**Agregar después de la sección "Mi Plan" (línea 480+):**

```jsx
{!cargandoPlan && errorCargaPlan && (
  <motion.div
    className="mb-8 rounded-xl border-2 border-yellow-200 bg-yellow-50 p-6"
    role="alert"
  >
    <div className="flex items-start gap-3">
      <FaExclamationTriangle className="text-yellow-600 text-xl" />
      <div>
        <h3 className="text-lg font-semibold text-yellow-900 mb-1">
          No pudimos cargar tu información de plan
        </h3>
        <p className="text-yellow-800 text-sm mb-3">
          Puedes seguir usando todas las funcionalidades básicas del dashboard.
          Si el problema persiste, contáctanos.
        </p>
        <Link href="/precios">
          <span className="text-yellow-700 hover:text-yellow-900 font-medium text-sm underline">
            Ver planes disponibles
          </span>
        </Link>
      </div>
    </div>
  </motion.div>
)}
```

**Beneficios:**
- Transparencia sobre problemas técnicos
- No deja al usuario sin información
- Mantiene acceso a funcionalidades

---

### MEJORA 4: Sistema de configuración de funcionalidades

**Agregar constante al inicio del archivo:**

```typescript
// Configuración de funcionalidades: qué requiere plan premium
const FUNCIONALIDADES_CONFIG = {
  // Funcionalidades FREE (siempre disponibles)
  free: [
    'chat', 'evaluaciones', 'perfil', 'animo', 'progreso'
  ],
  // Funcionalidades con límites
  limitadas: [
    'voz', 'mis-citas', 'recomendaciones', 'plan-accion'
  ],
  // Funcionalidades Premium (requieren plan de pago)
  premium: [
    'pagos', 'evaluaciones/historial'
  ]
};
```

**Funciones helper:**

```typescript
const obtenerBadgeFuncionalidad = (ruta: string): { texto: string; color: string } | null => {
  if (FUNCIONALIDADES_CONFIG.free.includes(ruta)) {
    return { texto: 'Gratis', color: 'bg-green-100 text-green-700' };
  }
  if (FUNCIONALIDADES_CONFIG.limitadas.includes(ruta)) {
    return { texto: 'Limitado', color: 'bg-yellow-100 text-yellow-700' };
  }
  if (FUNCIONALIDADES_CONFIG.premium.includes(ruta)) {
    return { texto: 'Premium', color: 'bg-purple-100 text-purple-700' };
  }
  return null;
};
```

**Beneficios:**
- Fácil mantenimiento de qué es gratis/premium
- Visualización clara para el usuario
- Un solo lugar para cambiar configuración

---

## CHECKLIST DE ACCESIBILIDAD EMOCIONAL

### ✅ Principios cumplidos actualmente:

- [x] No bloquear completamente por falta de pago
- [x] Mostrar todas las opciones de navegación
- [x] Sistema de límites informativo
- [x] Loading states apropiados
- [x] Fallback a plan básico

### ⚠️ Principios para mejorar:

- [ ] Comunicar claramente qué es gratis/premium
- [ ] Banner de bienvenida para usuario FREE
- [ ] Badges visuales en tarjetas
- [ ] Manejo explícito de errores de carga
- [ ] Sistema centralizado de configuración de funcionalidades

---

## RECOMENDACIONES DE IMPLEMENTACIÓN

### PRIORIDAD ALTA (Implementar ya):

1. **Agregar banner de bienvenida para usuario FREE**
   - Reduce confusión sobre qué pueden hacer
   - Comunicación transparente de límites
   - Archivo: `/src/app/dashboard/page.tsx`

2. **Verificar existencia de plan "basico" en base de datos**
   - SQL: `SELECT * FROM "Plan" WHERE codigo = 'basico' AND esta_activo = true;`
   - Si no existe, crear plan básico con límites apropiados
   - Migración: `/supabase/migrations/crear_plan_basico.sql`

3. **Agregar manejo de error de carga de plan**
   - Mostrar mensaje amigable si falla
   - No dejar usuario sin información

### PRIORIDAD MEDIA (Próxima iteración):

4. **Implementar badges en tarjetas**
   - "Gratis", "Limitado", "Premium"
   - Usar sistema de configuración centralizado

5. **Agregar estado `esPlanFree`**
   - Determinar automáticamente basado en plan
   - Condicionar mensajes y badges

### PRIORIDAD BAJA (Mejoras futuras):

6. **Modal de upgrade al hacer clic en funcionalidad premium**
   - Solo si usuario FREE intenta acceder a premium
   - Explicar beneficios específicos del upgrade
   - NO bloquear, solo informar

---

## CÓDIGO MEJORADO COMPLETO

He creado un archivo con todas las mejoras implementadas:

**Archivo:** `/src/app/dashboard/page-mejorado.tsx`

**Cambios incluidos:**
- ✅ Banner de bienvenida para usuario FREE
- ✅ Badges en todas las tarjetas
- ✅ Sistema de configuración de funcionalidades
- ✅ Manejo de error de carga de plan
- ✅ Estado `esPlanFree` automático
- ✅ Fallbacks completos si falla carga de planes

**Para implementar:**
```bash
# Respaldar archivo actual
cp src/app/dashboard/page.tsx src/app/dashboard/page-backup.tsx

# Reemplazar con versión mejorada
cp src/app/dashboard/page-mejorado.tsx src/app/dashboard/page.tsx

# Probar con usuario FREE
npm run dev
```

---

## TESTS RECOMENDADOS

### 1. **Test con usuario sin suscripción activa**
```typescript
// __tests__/dashboard/usuario-free.test.tsx
describe('Dashboard para usuario FREE', () => {
  it('debe mostrar todas las tarjetas de navegación', () => {
    // Simular usuario sin suscripción
    // Verificar que las 12 tarjetas están visibles
  });

  it('debe mostrar banner de bienvenida FREE', () => {
    // Verificar presencia del banner
  });

  it('debe mostrar badges en tarjetas', () => {
    // Verificar "Gratis", "Limitado", "Premium"
  });
});
```

### 2. **Test de carga fallida de plan**
```typescript
it('debe manejar error de carga de plan gracefully', async () => {
  // Simular error en obtener_planes_publico
  // Verificar que dashboard sigue funcional
  // Verificar mensaje de error visible
});
```

### 3. **Test E2E con Playwright**
```typescript
// e2e/dashboard-free-user.spec.ts
test('usuario FREE puede navegar a todas las secciones', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'usuario-free@test.com');
  await page.fill('[name="password"]', '123456');
  await page.click('button[type="submit"]');

  await page.waitForURL('/dashboard');

  // Verificar visibilidad de todas las tarjetas
  await expect(page.locator('text=Chat con IA')).toBeVisible();
  await expect(page.locator('text=Evaluaciones')).toBeVisible();
  // ... etc (12 tarjetas)

  // Hacer clic en cada una y verificar navegación
  await page.click('text=Chat con IA');
  await expect(page).toHaveURL('/chat');
});
```

---

## MIGRACIÓN SQL RECOMENDADA

Si el plan "basico" no existe, crear con esta migración:

**Archivo:** `/supabase/migrations/20251025_crear_plan_basico_free.sql`

```sql
-- ==========================================
-- MIGRACIÓN: Crear plan básico FREE
-- ==========================================
-- Fecha: 2025-10-25
-- Propósito: Garantizar que todos los usuarios tengan un plan básico disponible
-- ==========================================

-- Insertar plan básico FREE si no existe
INSERT INTO "Plan" (
  codigo,
  nombre,
  descripcion,
  tipo_usuario,
  precio_mensual,
  precio_anual,
  moneda,
  caracteristicas,
  limite_conversaciones,
  limite_evaluaciones,
  acceso_terapeutas,
  limite_pacientes,
  limite_horas_sesion,
  acceso_analytics,
  verificado,
  destacado_busqueda,
  prioridad_soporte,
  esta_activo,
  destacado,
  orden_visualizacion
) VALUES (
  'basico',
  'Plan Básico',
  'Acceso a funcionalidades básicas de la plataforma para comenzar tu viaje de bienestar emocional',
  'paciente',
  0.00,
  0.00,
  'COP',
  '[
    {"nombre": "Chat con IA (20 mensajes/mes)", "incluido": true},
    {"nombre": "Evaluaciones básicas (3/mes)", "incluido": true},
    {"nombre": "Registro de ánimo ilimitado", "incluido": true},
    {"nombre": "Visualización de progreso", "incluido": true},
    {"nombre": "Acceso a recomendaciones básicas", "incluido": true},
    {"nombre": "Soporte por email", "incluido": true},
    {"nombre": "Acceso a terapeutas", "incluido": false},
    {"nombre": "Evaluaciones ilimitadas", "incluido": false},
    {"nombre": "Mensajes ilimitados", "incluido": false},
    {"nombre": "Análisis de voz avanzado", "incluido": false}
  ]'::jsonb,
  20,  -- límite de mensajes con IA
  3,   -- límite de evaluaciones
  false,
  NULL,
  NULL,
  false,
  false,
  false,
  'basica',
  true,  -- plan activo
  false,
  1      -- primer plan en orden de visualización
)
ON CONFLICT (codigo) DO NOTHING;

-- Comentario
COMMENT ON COLUMN "Plan".codigo IS 'El código "basico" es el plan FREE por defecto para todos los usuarios nuevos';
```

**Aplicar migración:**
```bash
# Desarrollo
supabase db push

# Producción (a través de Supabase Dashboard)
# O usando CLI con credenciales de producción
```

---

## CONCLUSIÓN

**Estado del problema reportado:** ❌ NO CONFIRMADO

El código actual del dashboard (`/src/app/dashboard/page.tsx`) **NO bloquea la navegación para usuarios FREE**. Todas las tarjetas de funcionalidad son visibles y clicables.

**Posibles causas reales del problema:**
1. Plan "basico" no existe en base de datos (verificar con SQL)
2. Middleware bloqueando rutas internas
3. Error de red al cargar datos del plan
4. Confusión del usuario sobre qué puede usar (UX poco clara)

**Recomendación principal:**
Implementar las mejoras propuestas (especialmente banner de bienvenida y badges) para hacer la experiencia más transparente, aunque técnicamente no haya bloqueo.

**Archivo con mejoras completas:**
`/src/app/dashboard/page-mejorado.tsx`

---

**Próximos pasos:**
1. ✅ Verificar existencia de plan "basico" en base de datos
2. ✅ Implementar banner de bienvenida FREE
3. ✅ Agregar badges a tarjetas
4. ✅ Crear tests E2E para usuario FREE
5. ✅ Documentar funcionalidades por plan

---

**Principio de diseño para salud mental:**
> "En una aplicación de apoyo emocional, NUNCA se debe bloquear completamente el acceso por falta de pago. Los límites de uso son apropiados, pero el usuario siempre debe poder navegar y ver qué opciones tiene disponibles."

✅ **Este principio SE CUMPLE en el código actual.**
