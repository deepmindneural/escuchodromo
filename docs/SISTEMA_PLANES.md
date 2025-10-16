# Sistema de Verificación de Planes

Este documento explica cómo usar el sistema de verificación de planes y restricción de características según la suscripción del usuario.

## Estructura

### Archivos principales

1. **`src/lib/planes.ts`**: Funciones utilitarias para verificar planes
2. **`src/lib/hooks/usePlanUsuario.ts`**: Hook de React para usar en componentes
3. **`src/lib/componentes/plan/RestriccionPlan.tsx`**: Componente para restringir acceso a características
4. **`src/lib/componentes/plan/InfoPlan.tsx`**: Componente para mostrar información del plan del usuario

## Planes Disponibles

### Gratis (null)
- 10 mensajes de chat por mes
- 1 evaluación por mes
- Historial de 7 días
- Características: chat_basico, evaluaciones_basicas

### Básico
- 100 mensajes de chat por mes
- 5 evaluaciones por mes
- Historial de 30 días
- Características: chat_basico, evaluaciones_basicas, recomendaciones_ia, historial_completo

### Premium
- Chat ilimitado
- Evaluaciones ilimitadas
- Historial de 365 días
- Exportar reportes en PDF
- Características: chat_ilimitado, evaluaciones_basicas, evaluaciones_avanzadas, recomendaciones_ia, analisis_emocional, voz_interactiva, historial_completo, exportar_reportes

### Profesional
- Todo lo de Premium
- Soporte prioritario
- 4 sesiones terapéuticas al mes
- Historial de 730 días (2 años)
- Características adicionales: soporte_prioritario, sesiones_terapeuticas

## Uso en Componentes

### 1. Verificar plan del usuario

```tsx
import { usePlanUsuario } from '@/lib/hooks/usePlanUsuario';

export default function MiComponente() {
  const { planInfo, cargando } = usePlanUsuario();

  if (cargando) return <div>Cargando...</div>;

  return (
    <div>
      <h2>Tu plan: {planInfo?.plan || 'Gratis'}</h2>
      <p>Mensajes disponibles: {planInfo?.limites.mensajesChat}</p>
    </div>
  );
}
```

### 2. Restringir acceso a una característica

```tsx
import RestriccionPlan from '@/lib/componentes/plan/RestriccionPlan';

export default function BotonVoz() {
  return (
    <RestriccionPlan
      caracteristica="voz_interactiva"
      planRequerido="premium"
      mensajePersonalizado="La interacción por voz está disponible en el plan Premium"
    >
      <button className="btn-voz">
        Activar Voz
      </button>
    </RestriccionPlan>
  );
}
```

### 3. Verificar si puede realizar una acción

```tsx
import { usePlanUsuario } from '@/lib/hooks/usePlanUsuario';
import { toast } from 'react-hot-toast';

export default function BotonEnviarMensaje() {
  const { puedeHacerAccion } = usePlanUsuario();

  const enviarMensaje = async () => {
    const { puede, limite, usado } = await puedeHacerAccion('mensaje');

    if (!puede) {
      toast.error(`Has alcanzado el límite de ${limite} mensajes al mes. Has usado ${usado}.`);
      return;
    }

    // Enviar mensaje...
  };

  return <button onClick={enviarMensaje}>Enviar</button>;
}
```

### 4. Verificar acceso a característica específica

```tsx
import { tieneAccesoCaracteristica } from '@/lib/planes';

async function verificarAcceso() {
  const tieneAcceso = await tieneAccesoCaracteristica('exportar_reportes');

  if (!tieneAcceso) {
    alert('Necesitas el plan Premium para exportar reportes');
    return;
  }

  // Exportar reporte...
}
```

### 5. Mostrar información del plan

```tsx
import InfoPlan from '@/lib/componentes/plan/InfoPlan';

export default function PerfilUsuario() {
  return (
    <div>
      <h1>Mi Perfil</h1>
      <InfoPlan />
    </div>
  );
}
```

### 6. Bloquear sin blur (más sutil)

```tsx
import { BloquearSinPlan } from '@/lib/componentes/plan/RestriccionPlan';
import { toast } from 'react-hot-toast';

export default function FuncionAvanzada() {
  return (
    <BloquearSinPlan
      caracteristica="analisis_emocional"
      onIntentarUsar={() => {
        toast.error('Esta función requiere plan Premium');
      }}
    >
      <button className="btn">
        Análisis Emocional Avanzado
      </button>
    </BloquearSinPlan>
  );
}
```

## Funciones Utilitarias

### obtenerPlanUsuario()
Obtiene toda la información del plan del usuario actual.

```tsx
import { obtenerPlanUsuario } from '@/lib/planes';

const planInfo = await obtenerPlanUsuario();
console.log(planInfo.plan); // 'basico' | 'premium' | 'profesional' | null
console.log(planInfo.caracteristicas); // Array de características
console.log(planInfo.limites); // Objeto con límites
```

### tieneAccesoCaracteristica()
Verifica si el usuario tiene acceso a una característica específica.

```tsx
import { tieneAccesoCaracteristica } from '@/lib/planes';

const tieneAcceso = await tieneAccesoCaracteristica('voz_interactiva');
if (tieneAcceso) {
  // Mostrar botón de voz
}
```

### puedeRealizarAccion()
Verifica si el usuario puede realizar una acción según sus límites.

```tsx
import { puedeRealizarAccion } from '@/lib/planes';

const resultado = await puedeRealizarAccion('evaluacion');
console.log(resultado.puede); // true o false
console.log(resultado.limite); // número o 'ilimitado'
console.log(resultado.usado); // cantidad usada este mes
```

### obtenerNombrePlan()
Obtiene el nombre legible del plan.

```tsx
import { obtenerNombrePlan } from '@/lib/planes';

console.log(obtenerNombrePlan('premium')); // "Premium"
console.log(obtenerNombrePlan(null)); // "Gratis"
```

### obtenerPrecioPlan()
Obtiene el precio del plan en COP o USD.

```tsx
import { obtenerPrecioPlan } from '@/lib/planes';

console.log(obtenerPrecioPlan('premium', 'COP')); // 59900
console.log(obtenerPrecioPlan('premium', 'USD')); // 14.99
```

## Características Disponibles

- `chat_basico`: Chat con límite de mensajes
- `chat_ilimitado`: Chat sin límites
- `evaluaciones_basicas`: PHQ-9, GAD-7
- `evaluaciones_avanzadas`: Tests adicionales
- `recomendaciones_ia`: Recomendaciones personalizadas con IA
- `analisis_emocional`: Análisis emocional avanzado
- `voz_interactiva`: Interacción por voz
- `historial_completo`: Acceso completo al historial
- `exportar_reportes`: Exportar en PDF
- `soporte_prioritario`: Soporte prioritario
- `sesiones_terapeuticas`: Sesiones con terapeutas

## Ejemplos de Integración

### En la página de Chat

```tsx
// src/app/chat/page.tsx
import { puedeRealizarAccion } from '@/lib/planes';

async function enviarMensaje(mensaje: string) {
  // Verificar límite antes de enviar
  const { puede, limite, usado } = await puedeRealizarAccion('mensaje');

  if (!puede) {
    toast.error(`Has alcanzado tu límite de ${limite} mensajes al mes.`);
    toast.info('Actualiza a Premium para chat ilimitado', {
      duration: 5000,
    });
    return;
  }

  // Enviar mensaje a la API...
}
```

### En la página de Evaluaciones

```tsx
// src/app/evaluaciones/page.tsx
import { puedeRealizarAccion } from '@/lib/planes';

async function iniciarEvaluacion() {
  const { puede, limite, usado } = await puedeRealizarAccion('evaluacion');

  if (!puede) {
    toast.error(`Has realizado ${usado} de ${limite} evaluaciones este mes.`);
    return;
  }

  // Iniciar evaluación...
}
```

### En el botón de exportar PDF

```tsx
// src/app/evaluaciones/resultado/[id]/page.tsx
import RestriccionPlan from '@/lib/componentes/plan/RestriccionPlan';

<RestriccionPlan
  caracteristica="exportar_reportes"
  planRequerido="premium"
>
  <button onClick={descargarPDF}>
    Descargar PDF
  </button>
</RestriccionPlan>
```

## Notas Importantes

1. **RLS en Supabase**: Las políticas RLS deben permitir que los usuarios lean su propia información de suscripción.

2. **Caché**: El hook `usePlanUsuario` solo consulta una vez al montar. Para recargar, usa la función `recargar()`.

3. **Límites mensuales**: Los límites se calculan desde el día 1 del mes actual.

4. **Usuarios sin autenticar**: Siempre retornan plan `null` (gratis).

5. **Manejo de errores**: Si hay error al obtener el plan, se asume plan gratis por seguridad.
