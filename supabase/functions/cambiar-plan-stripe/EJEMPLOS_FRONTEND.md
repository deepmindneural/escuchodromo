# Ejemplos de Integración Frontend

Ejemplos completos de cómo integrar la Edge Function `cambiar-plan-stripe` en el frontend de Next.js.

## 1. Service Layer

### `/apps/web/src/lib/servicios/suscripciones.ts`

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// ==========================================
// TIPOS
// ==========================================

export type PlanCodigo = 'basico' | 'premium' | 'profesional'
export type Periodo = 'mensual' | 'anual'
export type TipoCambio = 'upgrade' | 'downgrade'
export type Aplicacion = 'inmediata' | 'fin_periodo'

export interface ResultadoCambioPlan {
  success: boolean
  mensaje: string
  datos: {
    plan_anterior: PlanCodigo
    periodo_anterior: Periodo
    plan_nuevo: PlanCodigo
    periodo_nuevo: Periodo
    precio_nuevo: number
    moneda: 'COP' | 'USD'
    tipo_cambio: TipoCambio
    aplicacion: Aplicacion
    fecha_efectiva: string
    fecha_proximo_pago: string | null
  }
}

export interface ErrorCambioPlan {
  error: string
  detalles?: string
}

// ==========================================
// FUNCIONES
// ==========================================

/**
 * Cambia el plan de suscripción del usuario actual
 *
 * @param nuevoPlan - Plan destino (premium | profesional)
 * @param nuevoPeriodo - Período de facturación (mensual | anual)
 * @returns Resultado del cambio con detalles
 * @throws Error si falla la operación
 */
export async function cambiarPlanSuscripcion(
  nuevoPlan: PlanCodigo,
  nuevoPeriodo: Periodo
): Promise<ResultadoCambioPlan> {
  const supabase = createClientComponentClient()

  try {
    const { data, error } = await supabase.functions.invoke<ResultadoCambioPlan>(
      'cambiar-plan-stripe',
      {
        body: {
          nuevo_plan_codigo: nuevoPlan,
          nuevo_periodo: nuevoPeriodo
        }
      }
    )

    if (error) {
      throw new Error(error.message)
    }

    if (!data || !data.success) {
      throw new Error('Respuesta inválida del servidor')
    }

    return data

  } catch (error) {
    console.error('[cambiarPlanSuscripcion] Error:', error)

    if (error instanceof Error) {
      throw error
    }

    throw new Error('Error desconocido al cambiar plan')
  }
}

/**
 * Calcula el precio de un plan específico
 */
export function calcularPrecioPlan(
  plan: PlanCodigo,
  periodo: Periodo,
  moneda: 'COP' | 'USD'
): number {
  const PRECIOS = {
    basico: {
      mensual: { COP: 0, USD: 0 },
      anual: { COP: 0, USD: 0 }
    },
    premium: {
      mensual: { COP: 49900, USD: 12 },
      anual: { COP: 479000, USD: 115 }
    },
    profesional: {
      mensual: { COP: 99900, USD: 24 },
      anual: { COP: 959000, USD: 230 }
    }
  }

  return PRECIOS[plan][periodo][moneda]
}

/**
 * Determina si un cambio es upgrade o downgrade
 */
export function determinarTipoCambio(
  planActual: PlanCodigo,
  periodoActual: Periodo,
  planNuevo: PlanCodigo,
  periodoNuevo: Periodo,
  moneda: 'COP' | 'USD'
): TipoCambio {
  const precioActual = calcularPrecioPlan(planActual, periodoActual, moneda)
  const precioNuevo = calcularPrecioPlan(planNuevo, periodoNuevo, moneda)

  return precioNuevo > precioActual ? 'upgrade' : 'downgrade'
}

/**
 * Formatea precio con separador de miles
 */
export function formatearPrecio(precio: number, moneda: 'COP' | 'USD'): string {
  if (moneda === 'COP') {
    return `$${precio.toLocaleString('es-CO')} COP`
  }
  return `$${precio.toFixed(2)} USD`
}
```

## 2. Hook Personalizado

### `/apps/web/src/lib/hooks/useCambiarPlan.ts`

```typescript
import { useState } from 'react'
import { cambiarPlanSuscripcion, type PlanCodigo, type Periodo, type ResultadoCambioPlan } from '@/lib/servicios/suscripciones'

export interface UseCambiarPlanReturn {
  cambiarPlan: (nuevoPlan: PlanCodigo, nuevoPeriodo: Periodo) => Promise<void>
  loading: boolean
  error: string | null
  resultado: ResultadoCambioPlan | null
  resetear: () => void
}

/**
 * Hook para manejar cambio de plan con estado
 */
export function useCambiarPlan(): UseCambiarPlanReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<ResultadoCambioPlan | null>(null)

  const cambiarPlan = async (nuevoPlan: PlanCodigo, nuevoPeriodo: Periodo) => {
    setLoading(true)
    setError(null)
    setResultado(null)

    try {
      const res = await cambiarPlanSuscripcion(nuevoPlan, nuevoPeriodo)
      setResultado(res)
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al cambiar plan'
      setError(mensaje)
    } finally {
      setLoading(false)
    }
  }

  const resetear = () => {
    setLoading(false)
    setError(null)
    setResultado(null)
  }

  return { cambiarPlan, loading, error, resultado, resetear }
}
```

## 3. Componente de Confirmación

### `/apps/web/src/lib/componentes/ModalConfirmarCambioPlan.tsx`

```typescript
'use client'

import { useState } from 'react'
import { determinarTipoCambio, formatearPrecio, calcularPrecioPlan } from '@/lib/servicios/suscripciones'
import type { PlanCodigo, Periodo } from '@/lib/servicios/suscripciones'

interface Props {
  planActual: PlanCodigo
  periodoActual: Periodo
  planNuevo: PlanCodigo
  periodoNuevo: Periodo
  moneda: 'COP' | 'USD'
  onConfirmar: () => void
  onCancelar: () => void
  loading?: boolean
}

export function ModalConfirmarCambioPlan({
  planActual,
  periodoActual,
  planNuevo,
  periodoNuevo,
  moneda,
  onConfirmar,
  onCancelar,
  loading = false
}: Props) {
  const tipoCambio = determinarTipoCambio(
    planActual,
    periodoActual,
    planNuevo,
    periodoNuevo,
    moneda
  )

  const precioActual = calcularPrecioPlan(planActual, periodoActual, moneda)
  const precioNuevo = calcularPrecioPlan(planNuevo, periodoNuevo, moneda)
  const diferencia = Math.abs(precioNuevo - precioActual)

  const esUpgrade = tipoCambio === 'upgrade'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">
          {esUpgrade ? '🚀 Mejorar Plan' : '📉 Cambiar Plan'}
        </h2>

        <div className="space-y-4 mb-6">
          {/* Plan actual */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Plan actual:</span>
            <span className="font-semibold">
              {planActual.charAt(0).toUpperCase() + planActual.slice(1)} {periodoActual}
            </span>
          </div>

          {/* Precio actual */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Precio actual:</span>
            <span className="font-semibold">{formatearPrecio(precioActual, moneda)}</span>
          </div>

          <div className="border-t pt-4">
            {/* Plan nuevo */}
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Plan nuevo:</span>
              <span className="font-semibold text-blue-600">
                {planNuevo.charAt(0).toUpperCase() + planNuevo.slice(1)} {periodoNuevo}
              </span>
            </div>

            {/* Precio nuevo */}
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-600">Precio nuevo:</span>
              <span className="font-semibold text-blue-600">
                {formatearPrecio(precioNuevo, moneda)}
              </span>
            </div>
          </div>

          {/* Diferencia */}
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-sm">
              {esUpgrade ? (
                <>
                  <strong>Cobro inmediato:</strong> Se te cobrará{' '}
                  <strong className="text-blue-600">{formatearPrecio(diferencia, moneda)}</strong>{' '}
                  de forma prorrateada. El cambio es efectivo inmediatamente.
                </>
              ) : (
                <>
                  <strong>Cambio programado:</strong> Tu plan cambiará al final del período
                  actual. Mantendrás tu plan actual hasta entonces.{' '}
                  <strong className="text-green-600">
                    Ahorrarás {formatearPrecio(diferencia, moneda)}
                  </strong>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={onCancelar}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Procesando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

## 4. Página Completa de Cambio de Plan

### `/apps/web/src/app/suscripcion/cambiar/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useCambiarPlan } from '@/lib/hooks/useCambiarPlan'
import { ModalConfirmarCambioPlan } from '@/lib/componentes/ModalConfirmarCambioPlan'
import { formatearPrecio, calcularPrecioPlan } from '@/lib/servicios/suscripciones'
import type { PlanCodigo, Periodo } from '@/lib/servicios/suscripciones'
import { toast } from 'sonner' // O tu librería de toasts

interface SuscripcionActual {
  plan: PlanCodigo
  periodo: Periodo
  precio: number
  moneda: 'COP' | 'USD'
  estado: string
}

export default function CambiarPlanPage() {
  const supabase = createClientComponentClient()

  // Estado
  const [suscripcionActual, setSuscripcionActual] = useState<SuscripcionActual | null>(null)
  const [cargando, setCargando] = useState(true)
  const [planSeleccionado, setPlanSeleccionado] = useState<{
    plan: PlanCodigo
    periodo: Periodo
  } | null>(null)

  // Hook de cambio de plan
  const { cambiarPlan, loading, error, resultado, resetear } = useCambiarPlan()

  // ==========================================
  // EFECTOS
  // ==========================================

  // Cargar suscripción actual
  useEffect(() => {
    async function cargarSuscripcion() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('No autenticado')

        const { data: usuario } = await supabase
          .from('Usuario')
          .select('id')
          .eq('auth_id', user.id)
          .single()

        if (!usuario) throw new Error('Usuario no encontrado')

        const { data: suscripcion } = await supabase
          .from('Suscripcion')
          .select('plan, periodo, precio, moneda, estado')
          .eq('usuario_id', usuario.id)
          .eq('estado', 'activa')
          .single()

        if (suscripcion) {
          setSuscripcionActual(suscripcion as SuscripcionActual)
        }
      } catch (error) {
        console.error('Error al cargar suscripción:', error)
        toast.error('Error al cargar tu suscripción')
      } finally {
        setCargando(false)
      }
    }

    cargarSuscripcion()
  }, [supabase])

  // Manejar resultado exitoso
  useEffect(() => {
    if (resultado) {
      const esUpgrade = resultado.datos.tipo_cambio === 'upgrade'

      if (esUpgrade) {
        toast.success('¡Plan actualizado exitosamente!', {
          description: 'Ahora tienes acceso a todas las nuevas funciones.'
        })
      } else {
        toast.info('Cambio de plan programado', {
          description: `Tu plan cambiará el ${new Date(resultado.datos.fecha_efectiva).toLocaleDateString('es-CO')}`
        })
      }

      // Recargar página después de 2 segundos
      setTimeout(() => {
        window.location.href = '/suscripcion'
      }, 2000)
    }
  }, [resultado])

  // Manejar error
  useEffect(() => {
    if (error) {
      toast.error('Error al cambiar plan', {
        description: error
      })
    }
  }, [error])

  // ==========================================
  // HANDLERS
  // ==========================================

  function handleSeleccionarPlan(plan: PlanCodigo, periodo: Periodo) {
    // Validar que no sea el mismo plan
    if (
      suscripcionActual &&
      suscripcionActual.plan === plan &&
      suscripcionActual.periodo === periodo
    ) {
      toast.error('Ya tienes este plan activo')
      return
    }

    // Validar que no sea plan básico
    if (plan === 'basico') {
      toast.error('Para cancelar tu suscripción, ve a Configuración')
      return
    }

    setPlanSeleccionado({ plan, periodo })
  }

  async function handleConfirmarCambio() {
    if (!planSeleccionado) return

    await cambiarPlan(planSeleccionado.plan, planSeleccionado.periodo)
    setPlanSeleccionado(null)
  }

  function handleCancelarCambio() {
    setPlanSeleccionado(null)
    resetear()
  }

  // ==========================================
  // RENDER
  // ==========================================

  if (cargando) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Cargando...</div>
      </div>
    )
  }

  if (!suscripcionActual) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>No tienes una suscripción activa</p>
          <a href="/precios" className="text-blue-600 hover:underline mt-4 inline-block">
            Ver planes disponibles
          </a>
        </div>
      </div>
    )
  }

  const moneda = suscripcionActual.moneda

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-2">Cambiar Plan</h1>
      <p className="text-gray-600 mb-8">
        Plan actual: <strong>{suscripcionActual.plan}</strong> ({suscripcionActual.periodo})
      </p>

      {/* Grid de planes */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Premium */}
        <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-2xl font-bold mb-2">Premium</h2>
          <p className="text-gray-600 mb-4">Para usuarios que buscan apoyo personalizado</p>

          <div className="space-y-4 mb-6">
            {/* Mensual */}
            <div className="border rounded p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Mensual</span>
                <span className="text-2xl font-bold">
                  {formatearPrecio(calcularPrecioPlan('premium', 'mensual', moneda), moneda)}
                </span>
              </div>
              <button
                onClick={() => handleSeleccionarPlan('premium', 'mensual')}
                disabled={
                  loading ||
                  (suscripcionActual.plan === 'premium' && suscripcionActual.periodo === 'mensual')
                }
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {suscripcionActual.plan === 'premium' && suscripcionActual.periodo === 'mensual'
                  ? 'Plan Actual'
                  : 'Seleccionar'}
              </button>
            </div>

            {/* Anual */}
            <div className="border rounded p-4 bg-green-50">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="font-semibold">Anual</span>
                  <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded">
                    Ahorra 20%
                  </span>
                </div>
                <span className="text-2xl font-bold">
                  {formatearPrecio(calcularPrecioPlan('premium', 'anual', moneda), moneda)}
                </span>
              </div>
              <button
                onClick={() => handleSeleccionarPlan('premium', 'anual')}
                disabled={
                  loading ||
                  (suscripcionActual.plan === 'premium' && suscripcionActual.periodo === 'anual')
                }
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {suscripcionActual.plan === 'premium' && suscripcionActual.periodo === 'anual'
                  ? 'Plan Actual'
                  : 'Seleccionar'}
              </button>
            </div>
          </div>

          <ul className="space-y-2 text-sm">
            <li>✅ Chat IA ilimitado</li>
            <li>✅ Evaluaciones periódicas</li>
            <li>✅ Recomendaciones personalizadas</li>
            <li>✅ Historial completo</li>
          </ul>
        </div>

        {/* Profesional */}
        <div className="border-2 border-purple-500 rounded-lg p-6 hover:shadow-lg transition-shadow relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
            Más Popular
          </div>

          <h2 className="text-2xl font-bold mb-2 mt-2">Profesional</h2>
          <p className="text-gray-600 mb-4">Para quienes necesitan acompañamiento experto</p>

          <div className="space-y-4 mb-6">
            {/* Mensual */}
            <div className="border rounded p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Mensual</span>
                <span className="text-2xl font-bold">
                  {formatearPrecio(calcularPrecioPlan('profesional', 'mensual', moneda), moneda)}
                </span>
              </div>
              <button
                onClick={() => handleSeleccionarPlan('profesional', 'mensual')}
                disabled={
                  loading ||
                  (suscripcionActual.plan === 'profesional' &&
                    suscripcionActual.periodo === 'mensual')
                }
                className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {suscripcionActual.plan === 'profesional' &&
                suscripcionActual.periodo === 'mensual'
                  ? 'Plan Actual'
                  : 'Seleccionar'}
              </button>
            </div>

            {/* Anual */}
            <div className="border rounded p-4 bg-purple-50">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="font-semibold">Anual</span>
                  <span className="ml-2 text-xs bg-purple-600 text-white px-2 py-1 rounded">
                    Ahorra 20%
                  </span>
                </div>
                <span className="text-2xl font-bold">
                  {formatearPrecio(calcularPrecioPlan('profesional', 'anual', moneda), moneda)}
                </span>
              </div>
              <button
                onClick={() => handleSeleccionarPlan('profesional', 'anual')}
                disabled={
                  loading ||
                  (suscripcionActual.plan === 'profesional' && suscripcionActual.periodo === 'anual')
                }
                className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {suscripcionActual.plan === 'profesional' && suscripcionActual.periodo === 'anual'
                  ? 'Plan Actual'
                  : 'Seleccionar'}
              </button>
            </div>
          </div>

          <ul className="space-y-2 text-sm">
            <li>✅ Todo de Premium</li>
            <li>✅ Sesiones con psicólogos</li>
            <li>✅ Agenda flexible</li>
            <li>✅ Reportes clínicos</li>
            <li>✅ Soporte prioritario</li>
          </ul>
        </div>
      </div>

      {/* Modal de confirmación */}
      {planSeleccionado && (
        <ModalConfirmarCambioPlan
          planActual={suscripcionActual.plan}
          periodoActual={suscripcionActual.periodo}
          planNuevo={planSeleccionado.plan}
          periodoNuevo={planSeleccionado.periodo}
          moneda={moneda}
          onConfirmar={handleConfirmarCambio}
          onCancelar={handleCancelarCambio}
          loading={loading}
        />
      )}
    </div>
  )
}
```

## 5. Componente de Notificación de Cambio Pendiente

### `/apps/web/src/lib/componentes/AlertaCambioPendiente.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface SuscripcionConCambioPendiente {
  plan: string
  periodo: string
  plan_pendiente: string | null
  periodo_pendiente: string | null
  fecha_fin: string
}

export function AlertaCambioPendiente() {
  const supabase = createClientComponentClient()
  const [cambioPendiente, setCambioPendiente] = useState<SuscripcionConCambioPendiente | null>(
    null
  )

  useEffect(() => {
    async function verificarCambioPendiente() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: usuario } = await supabase
          .from('Usuario')
          .select('id')
          .eq('auth_id', user.id)
          .single()

        if (!usuario) return

        const { data: suscripcion } = await supabase
          .from('Suscripcion')
          .select('plan, periodo, plan_pendiente, periodo_pendiente, fecha_fin')
          .eq('usuario_id', usuario.id)
          .eq('estado', 'cancelar_al_final')
          .single()

        if (suscripcion && suscripcion.plan_pendiente) {
          setCambioPendiente(suscripcion as SuscripcionConCambioPendiente)
        }
      } catch (error) {
        console.error('Error al verificar cambio pendiente:', error)
      }
    }

    verificarCambioPendiente()
  }, [supabase])

  if (!cambioPendiente) return null

  const fechaFin = new Date(cambioPendiente.fecha_fin)
  const fechaFormateada = fechaFin.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-yellow-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            <strong>Cambio de plan programado:</strong> Tu suscripción cambiará a{' '}
            <strong>
              {cambioPendiente.plan_pendiente} {cambioPendiente.periodo_pendiente}
            </strong>{' '}
            el <strong>{fechaFormateada}</strong>. Mantendrás tu plan actual hasta entonces.
          </p>
        </div>
      </div>
    </div>
  )
}
```

## 6. Uso en Layout o Dashboard

### `/apps/web/src/app/dashboard/layout.tsx`

```typescript
import { AlertaCambioPendiente } from '@/lib/componentes/AlertaCambioPendiente'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <nav>{/* Tu navbar */}</nav>

      <main className="container mx-auto px-4 py-8">
        {/* Mostrar alerta si hay cambio pendiente */}
        <AlertaCambioPendiente />

        {children}
      </main>
    </div>
  )
}
```

## Resumen

Estos ejemplos proporcionan:

1. **Service Layer** completo con tipos TypeScript
2. **Hook personalizado** para manejo de estado
3. **Modal de confirmación** con cálculo de diferencias
4. **Página completa** con grid de planes
5. **Componente de alerta** para cambios pendientes
6. **Integración en layout** para visibilidad global

Todo el código está en **español**, sigue las **mejores prácticas de Next.js 15**, y utiliza **TypeScript estricto** para máxima seguridad de tipos.
