/**
 * =====================================================
 * COMPONENTE: Password Strength Meter
 * =====================================================
 * Indicador visual de fortaleza de contraseña con
 * validación en tiempo real y mensajes de ayuda.
 *
 * VULNERABILIDAD CORREGIDA: ALTO #1
 * Muestra feedback inmediato al usuario sobre la
 * fortaleza de su contraseña y requisitos faltantes.
 * =====================================================
 */

'use client'

import { useState, useEffect } from 'react'
import {
  validarContrasena,
  mensajeFortaleza,
  colorFortaleza,
  colorBarraFortaleza,
  REQUISITOS_CONTRASENA,
  type ResultadoValidacionContrasena,
} from '@/lib/utils/validarContrasena'

interface PasswordStrengthMeterProps {
  contrasena: string
  datosUsuario?: {
    nombre?: string
    email?: string
    apellido?: string
  }
  mostrarRequisitos?: boolean
  className?: string
}

export function PasswordStrengthMeter({
  contrasena,
  datosUsuario,
  mostrarRequisitos = true,
  className = '',
}: PasswordStrengthMeterProps) {
  const [resultado, setResultado] = useState<ResultadoValidacionContrasena>({
    valida: false,
    errores: [],
    fortaleza: 'muy_debil',
    puntuacion: 0,
  })

  useEffect(() => {
    if (contrasena.length > 0) {
      const validacion = validarContrasena(contrasena, datosUsuario)
      setResultado(validacion)
    } else {
      setResultado({
        valida: false,
        errores: [],
        fortaleza: 'muy_debil',
        puntuacion: 0,
      })
    }
  }, [contrasena, datosUsuario])

  // No mostrar nada si no hay contraseña
  if (contrasena.length === 0) {
    return null
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Barra de progreso */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${colorBarraFortaleza(resultado.fortaleza)}`}
          style={{ width: `${resultado.puntuacion}%` }}
        />
      </div>

      {/* Mensaje de fortaleza */}
      <p className={`text-sm font-medium ${colorFortaleza(resultado.fortaleza)}`}>
        {mensajeFortaleza(resultado.fortaleza)} ({resultado.puntuacion}/100)
      </p>

      {/* Lista de requisitos (opcional) */}
      {mostrarRequisitos && (
        <div className="mt-3 space-y-1">
          <p className="text-xs font-medium text-gray-700">Requisitos:</p>
          <ul className="text-xs space-y-0.5">
            <RequisitoItem
              cumplido={contrasena.length >= REQUISITOS_CONTRASENA.longitudMinima}
              texto={`Mínimo ${REQUISITOS_CONTRASENA.longitudMinima} caracteres`}
            />
            <RequisitoItem cumplido={/[A-Z]/.test(contrasena)} texto="Al menos una mayúscula" />
            <RequisitoItem cumplido={/[a-z]/.test(contrasena)} texto="Al menos una minúscula" />
            <RequisitoItem cumplido={/[0-9]/.test(contrasena)} texto="Al menos un número" />
            <RequisitoItem
              cumplido={new RegExp(`[${REQUISITOS_CONTRASENA.caracteresEspeciales.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`).test(
                contrasena
              )}
              texto={`Al menos un carácter especial (${REQUISITOS_CONTRASENA.caracteresEspeciales})`}
            />
          </ul>
        </div>
      )}

      {/* Errores específicos */}
      {resultado.errores.length > 0 && (
        <div className="mt-2 space-y-1">
          {resultado.errores.map((error, index) => (
            <p key={index} className="text-xs text-red-600 flex items-start gap-1">
              <span className="text-red-500">•</span>
              <span>{error}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

interface RequisitoItemProps {
  cumplido: boolean
  texto: string
}

function RequisitoItem({ cumplido, texto }: RequisitoItemProps) {
  return (
    <li className={`flex items-center gap-2 ${cumplido ? 'text-green-600' : 'text-gray-500'}`}>
      {cumplido ? (
        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeWidth="2" />
        </svg>
      )}
      <span>{texto}</span>
    </li>
  )
}
