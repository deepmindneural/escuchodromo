/**
 * Página: Email Confirmado
 * VULNERABILIDAD CORREGIDA: ALTO #2
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function EmailConfirmadoPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        <div className="text-green-600 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-4">¡Email confirmado!</h1>
        <p className="text-gray-600">
          Tu cuenta ha sido activada correctamente. Serás redirigido al dashboard...
        </p>
      </div>
    </div>
  )
}
