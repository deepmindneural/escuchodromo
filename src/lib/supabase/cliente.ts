/**
 * Cliente Supabase para Browser (Client Components)
 * Usa cookies para persistir la sesión
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './tipos'

export function crearClienteNavegador() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Instancia singleton para usar en componentes cliente
let clienteNavegador: ReturnType<typeof crearClienteNavegador> | null = null

export function obtenerClienteNavegador() {
  if (!clienteNavegador) {
    clienteNavegador = crearClienteNavegador()
  }
  return clienteNavegador
}

// Exportación por defecto
export default obtenerClienteNavegador
