/**
 * Hook: Timeout por Inactividad
 * VULNERABILIDAD CORREGIDA: ALTO #6
 */

'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function useInactivityTimeout(timeoutMinutes: number = 30) {
  const router = useRouter()

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      toast.info('Sesión cerrada por inactividad')
      router.push('/iniciar-sesion')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }, [router])

  useEffect(() => {
    let timeout: NodeJS.Timeout

    const resetTimeout = () => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        logout()
      }, timeoutMinutes * 60 * 1000)
    }

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']

    events.forEach((event) => {
      document.addEventListener(event, resetTimeout)
    })

    resetTimeout()

    return () => {
      clearTimeout(timeout)
      events.forEach((event) => {
        document.removeEventListener(event, resetTimeout)
      })
    }
  }, [timeoutMinutes, logout])
}
