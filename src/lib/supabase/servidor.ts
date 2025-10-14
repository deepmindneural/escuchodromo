/**
 * Cliente Supabase para Server Components, API Routes y Server Actions
 * Maneja cookies del servidor
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './tipos'

export async function crearClienteServidor() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // La operación set puede fallar en Server Components
            // Esto es normal cuando se llama desde un Server Component
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // La operación remove puede fallar en Server Components
          }
        },
      },
    }
  )
}

/**
 * Cliente Supabase con Service Role para operaciones administrativas
 * SOLO usar en Server Components, API Routes o Edge Functions
 * NUNCA exponer en el cliente
 */
export function crearClienteServicioServidor() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get() {
          return undefined
        },
        set() {},
        remove() {},
      },
    }
  )
}
