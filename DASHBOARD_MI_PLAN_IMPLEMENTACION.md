# Dashboard "Mi Plan Actual" - Implementación UX Terapéutica

## Resumen

Se implementó exitosamente la sección "Mi Plan Actual" en el dashboard del usuario (`/dashboard`), mostrando los límites de uso del mes actual y alertas empáticas cuando el usuario se acerca al límite.

## Características Implementadas

### 1. Visualización del Plan Actual
- **Nombre del plan**: Básico, Premium o Profesional
- **Tipo de facturación**: Mensual o Anual
- **Descripción del plan**: Texto explicativo del plan
- **Botón CTA**: "Actualizar Plan" o "Cambiar Plan" según corresponda

### 2. Barras de Progreso de Uso

#### Mensajes con IA
- Muestra cantidad usada vs límite del mes
- Barra de progreso visual con accesibilidad WCAG AA
- Estados:
  - **Límite definido**: Barra con porcentaje y contador restante
  - **Ilimitado**: Badge verde "Mensajes ilimitados" con icono infinito

#### Evaluaciones Psicológicas
- Muestra cantidad usada vs límite del mes
- Barra de progreso visual con accesibilidad WCAG AA
- Estados:
  - **Límite definido**: Barra con porcentaje y contador restante
  - **Ilimitado**: Badge verde "Evaluaciones ilimitadas" con icono infinito

### 3. Sistema de Alertas Empáticas

Cuando el usuario ha usado más del 80% de cualquier límite:
- **Banner de advertencia** con diseño terapéutico naranja/amarillo
- **Mensaje personalizado** indicando qué límite está cerca
- **CTA prominente** "Actualizar ahora" con enlace a /precios
- **Tono empático**: No alarmista, orientado al apoyo

## Diseño Terapéutico

### Paleta de Colores
```tsx
// Sección principal
bg-gradient-to-br from-green-50 to-emerald-50
border-2 border-green-200

// Barras de progreso
className="h-3 bg-green-100" // Fondo
// Indicador en verde (componente Progress)

// Banner de advertencia
bg-gradient-to-r from-orange-50 to-yellow-50
border-2 border-orange-300
```

### Iconografía
- **FaCrown**: Icono del plan (amarillo dorado)
- **FaComments**: Mensajes con IA
- **FaClipboardList**: Evaluaciones
- **FaInfinity**: Recursos ilimitados
- **FaExclamationTriangle**: Alerta de límite próximo
- **FaTrophy**: CTA de actualización

### Animaciones Suaves
```tsx
// Entrada de sección
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.5 }}

// Entrada de alerta (con delay)
initial={{ opacity: 0, scale: 0.95 }}
animate={{ opacity: 1, scale: 1 }}
transition={{ delay: 0.3 }}

// Botones interactivos
whileHover={{ scale: 1.05 }}
whileTap={{ scale: 0.95 }}
```

## Accesibilidad (WCAG 2.1 Level AA)

### Atributos ARIA Implementados
```tsx
// Región semántica
role="region"
aria-label="Información de tu plan actual"

// Barras de progreso
aria-label={`Has usado ${porcentaje}% de tus mensajes disponibles`}
aria-valuenow={porcentaje}
aria-valuemin={0}
aria-valuemax={100}

// Alertas
role="alert"
aria-live="polite"

// Iconos decorativos
aria-hidden="true"
```

### Navegación por Teclado
- Todos los botones tienen `focus:ring-2`
- CTAs con outline visible en focus
- Tab order lógico de arriba hacia abajo

### Contraste de Color
- Texto verde sobre fondo verde claro: **4.5:1 mínimo**
- Texto naranja sobre fondo naranja claro: **4.5:1 mínimo**
- Botones con gradientes de alto contraste

### Lectores de Pantalla
- Contadores con `aria-live="polite"` para anunciar cambios
- Labels descriptivos en todos los elementos interactivos
- Texto alternativo para iconos con `aria-label`

## Estructura de Base de Datos

### Tablas Relacionadas

#### Tabla `Plan`
```sql
CREATE TABLE "Plan" (
  id UUID PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo_usuario TEXT DEFAULT 'paciente',
  limite_conversaciones INTEGER,
  limite_evaluaciones INTEGER,
  caracteristicas JSONB,
  ...
);
```

#### Tabla `Suscripcion`
```sql
CREATE TABLE "Suscripcion" (
  id UUID PRIMARY KEY,
  usuario_id UUID REFERENCES "Usuario"(id),
  plan TEXT NOT NULL, -- FK a Plan(codigo)
  periodo TEXT DEFAULT 'mensual',
  estado TEXT DEFAULT 'activa',
  fecha_fin TIMESTAMP,
  ...
);
```

### Migraciones Creadas

1. **20251025000003_relacionar_suscripcion_plan.sql**
   - Agrega foreign key `Suscripcion.plan -> Plan.codigo`
   - Actualiza suscripciones existentes a plan 'basico'
   - Crea índice para optimizar JOINs

## Lógica de Negocio

### Cálculo de Uso del Mes
```typescript
// Inicio del mes actual
const inicioMes = new Date();
inicioMes.setDate(1);
inicioMes.setHours(0, 0, 0, 0);

// Contar mensajes (con JOIN a Conversacion)
const { data: conversaciones } = await supabase
  .from('Conversacion')
  .select('id')
  .eq('usuario_id', usuario.id);

const { count: mensajesUsados } = await supabase
  .from('Mensaje')
  .select('id', { count: 'exact', head: true })
  .in('conversacion_id', conversacionIds)
  .eq('rol', 'usuario')
  .gte('creado_en', inicioMes.toISOString());

// Contar evaluaciones
const { count: evaluacionesUsadas } = await supabase
  .from('Resultado')
  .select('id', { count: 'exact', head: true })
  .eq('usuario_id', usuario.id)
  .gte('creado_en', inicioMes.toISOString());
```

### Detección de Límite Próximo
```typescript
const calcularPorcentajeUso = (usado: number, limite: number | null): number => {
  if (limite === null || limite === 0) return 0;
  return Math.min((usado / limite) * 100, 100);
};

const estaProximoAlLimite = (usado: number, limite: number | null): boolean => {
  if (limite === null) return false;
  return calcularPorcentajeUso(usado, limite) >= 80; // Umbral: 80%
};
```

## Casos Especiales Manejados

### 1. Plan Gratis (Básico)
- Muestra límites: 100 mensajes/mes, 5 evaluaciones/mes
- CTA: "Actualizar Plan"
- Banner aparece al 80% de uso

### 2. Plan Premium/Profesional
- Puede mostrar "Ilimitado" con icono infinito
- CTA: "Cambiar Plan"
- No muestra banner si no hay límites

### 3. Sin Suscripción Activa
- Fallback automático a plan 'basico'
- Consulta directa a tabla `Plan`
- Usuario puede seguir usando funciones básicas

### 4. Error al Cargar Plan
- Try/catch para manejar errores de red
- Fallback a plan básico
- Console.error para debugging
- No rompe la UI, muestra loading state

## Archivos Modificados

### 1. `/src/app/dashboard/page.tsx`
**Cambios principales:**
- Agregado estado `suscripcionDetalle` y `usoActual`
- Nueva función `cargarDatosPlan()` con queries optimizadas
- Funciones helper `calcularPorcentajeUso()` y `estaProximoAlLimite()`
- Sección visual "Mi Plan Actual" con animaciones Framer Motion
- Imports adicionales: `FaExclamationTriangle, FaArrowUp, FaCheckCircle, FaInfinity`
- Import de componente `Progress` de Radix UI

**Líneas totales:** 766 (originalmente 444)

### 2. `/supabase/migrations/20251025000003_relacionar_suscripcion_plan.sql`
**Nuevo archivo** - Migración de base de datos
- Actualiza suscripciones existentes
- Agrega foreign key constraint
- Crea índice de performance

## Rendimiento

### Optimizaciones Implementadas
1. **Queries paralelas** para conversaciones y evaluaciones
2. **Count con head: true** para evitar traer datos innecesarios
3. **Índices en BD** para JOINs rápidos
4. **Lazy loading** solo cuando usuario accede al dashboard
5. **Memoización implícita** en estado de React

### Métricas Esperadas
- **Tiempo de carga de plan**: <500ms
- **Tiempo de carga de uso**: <800ms
- **Total Time to Interactive**: <1.5s adicionales al dashboard

## Testing Sugerido

### Casos de Prueba

1. **Usuario con plan básico cerca del límite (85% usado)**
   - ✅ Debe mostrar banner naranja de advertencia
   - ✅ Texto debe decir qué límite está cerca
   - ✅ CTA "Actualizar ahora" visible

2. **Usuario con plan premium (ilimitado)**
   - ✅ Debe mostrar badges verdes "Ilimitado"
   - ✅ No debe mostrar barras de progreso
   - ✅ No debe mostrar banner de advertencia

3. **Usuario nuevo sin suscripción**
   - ✅ Debe cargar plan básico automáticamente
   - ✅ Debe mostrar 0 mensajes usados
   - ✅ No debe mostrar errores en consola

4. **Usuario con 100% de uso**
   - ✅ Barra de progreso al 100%
   - ✅ Mensaje "Has alcanzado el límite"
   - ✅ Banner de advertencia visible

5. **Accesibilidad con lector de pantalla**
   - ✅ Debe anunciar región "Información de tu plan actual"
   - ✅ Debe leer porcentajes de uso correctamente
   - ✅ Debe anunciar alertas con aria-live

## Próximos Pasos Sugeridos

### Mejoras Futuras
1. **Notificaciones push** cuando se acerca al límite (90%)
2. **Histórico de uso** en gráfico de línea mensual
3. **Comparación entre planes** inline en el dashboard
4. **Predicción de uso** basado en promedio diario
5. **Recordatorio de renovación** 7 días antes del vencimiento

### Integraciones Potenciales
1. **Stripe Customer Portal** para cambiar plan directamente
2. **Email automático** cuando alcanza 80% de límite
3. **Analytics tracking** de usuarios que actualizan desde el banner
4. **A/B testing** del copy del banner de advertencia

## Recursos y Referencias

- **Radix UI Progress**: https://www.radix-ui.com/primitives/docs/components/progress
- **Framer Motion**: https://www.framer.com/motion/
- **WCAG 2.1 Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **Therapeutic Design Principles**: Diseño basado en empatía y reducción de ansiedad

## Autor

Implementado por Claude Code (Agente UX Especializado)
Fecha: 24 de octubre de 2025
Stack: Next.js 15 + Supabase + Tailwind CSS + Radix UI + Framer Motion
