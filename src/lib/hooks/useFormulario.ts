'use client';

import { useState, useCallback } from 'react';

export interface ReglasValidacion {
  [campo: string]: {
    requerido?: boolean;
    minLength?: number;
    maxLength?: number;
    patron?: RegExp;
    personalizado?: (valor: any) => string | null;
    mensaje?: string;
  };
}

export interface EstadoFormulario<T> {
  valores: T;
  errores: Record<keyof T, string>;
  tocado: Record<keyof T, boolean>;
  cargando: boolean;
  enviado: boolean;
}

export function useFormulario<T extends Record<string, any>>(
  valoresIniciales: T,
  reglas?: ReglasValidacion
) {
  const [estado, setEstado] = useState<EstadoFormulario<T>>({
    valores: valoresIniciales,
    errores: {} as Record<keyof T, string>,
    tocado: {} as Record<keyof T, boolean>,
    cargando: false,
    enviado: false,
  });

  const validarCampo = useCallback((nombre: keyof T, valor: any): string => {
    if (!reglas || !reglas[nombre as string]) return '';

    const regla = reglas[nombre as string];
    
    // Validación requerido
    if (regla.requerido && (!valor || (typeof valor === 'string' && !valor.trim()))) {
      return regla.mensaje || `${String(nombre)} es requerido`;
    }

    // Si no hay valor y no es requerido, no validar más
    if (!valor && !regla.requerido) return '';

    // Validación longitud mínima
    if (regla.minLength && typeof valor === 'string' && valor.length < regla.minLength) {
      return regla.mensaje || `${String(nombre)} debe tener al menos ${regla.minLength} caracteres`;
    }

    // Validación longitud máxima
    if (regla.maxLength && typeof valor === 'string' && valor.length > regla.maxLength) {
      return regla.mensaje || `${String(nombre)} no puede tener más de ${regla.maxLength} caracteres`;
    }

    // Validación patrón
    if (regla.patron && typeof valor === 'string' && !regla.patron.test(valor)) {
      return regla.mensaje || `${String(nombre)} no tiene el formato correcto`;
    }

    // Validación personalizada
    if (regla.personalizado) {
      const resultado = regla.personalizado(valor);
      if (resultado) return resultado;
    }

    return '';
  }, [reglas]);

  const validarTodo = useCallback((): boolean => {
    const nuevosErrores: Record<keyof T, string> = {} as Record<keyof T, string>;
    let esValido = true;

    Object.keys(estado.valores).forEach((nombre) => {
      const error = validarCampo(nombre as keyof T, estado.valores[nombre as keyof T]);
      if (error) {
        nuevosErrores[nombre as keyof T] = error;
        esValido = false;
      }
    });

    setEstado(prev => ({
      ...prev,
      errores: nuevosErrores,
      tocado: Object.keys(prev.valores).reduce((acc, key) => ({
        ...acc,
        [key]: true
      }), {} as Record<keyof T, boolean>)
    }));

    return esValido;
  }, [estado.valores, validarCampo]);

  const handleCambio = useCallback((nombre: keyof T, valor: any) => {
    setEstado(prev => {
      const nuevosValores = { ...prev.valores, [nombre]: valor };
      const error = validarCampo(nombre, valor);
      
      return {
        ...prev,
        valores: nuevosValores,
        errores: {
          ...prev.errores,
          [nombre]: error
        },
        tocado: {
          ...prev.tocado,
          [nombre]: true
        }
      };
    });
  }, [validarCampo]);

  const handleSubmit = useCallback((callback: (valores: T) => Promise<void> | void) => {
    return async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!validarTodo()) return;

      setEstado(prev => ({ ...prev, cargando: true, enviado: true }));

      try {
        await callback(estado.valores);
      } catch (error) {
        console.error('Error en formulario:', error);
      } finally {
        setEstado(prev => ({ ...prev, cargando: false }));
      }
    };
  }, [estado.valores, validarTodo]);

  const reset = useCallback(() => {
    setEstado({
      valores: valoresIniciales,
      errores: {} as Record<keyof T, string>,
      tocado: {} as Record<keyof T, boolean>,
      cargando: false,
      enviado: false,
    });
  }, [valoresIniciales]);

  const setCargando = useCallback((cargando: boolean) => {
    setEstado(prev => ({ ...prev, cargando }));
  }, []);

  return {
    valores: estado.valores,
    errores: estado.errores,
    tocado: estado.tocado,
    cargando: estado.cargando,
    enviado: estado.enviado,
    handleCambio,
    handleSubmit,
    validarTodo,
    reset,
    setCargando,
  };
}