/**
 * Hook useApi - Migrado a Supabase
 * Ya no se usa para llamadas REST, ahora Supabase maneja todo directamente
 * Se mantiene para compatibilidad con código legacy
 */

'use client';

import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { obtenerClienteNavegador } from '../supabase/cliente';
import {
  registrarUsuario,
  iniciarSesion as loginSupabase,
  cerrarSesion as logoutSupabase,
  obtenerUsuarioActual,
} from '../supabase/auth';

interface ApiResponse<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook genérico para operaciones (legacy)
 * NOTA: Preferir usar Supabase directamente en lugar de este hook
 */
export function useApi<T>() {
  const [state, setState] = useState<ApiResponse<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (
    url: string,
    options: RequestInit = {}
  ): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Para mantener compatibilidad, si aún se usan Edge Functions o APIs externas
      const response = await fetch(url, options);

      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;

        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Si no se puede parsear el JSON, usar el mensaje por defecto
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      setState({ data, loading: false, error: null });
      return data;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error de conexión';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));

      if (!errorMessage.includes('404') && !errorMessage.includes('401')) {
        toast.error(errorMessage);
      }

      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// Hooks legacy (mantener para compatibilidad)
export function usePost<T>() {
  const api = useApi<T>();

  const post = useCallback(async (url: string, data: any) => {
    return api.execute(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }, [api]);

  return {
    ...api,
    post,
  };
}

export function usePut<T>() {
  const api = useApi<T>();

  const put = useCallback(async (url: string, data: any) => {
    return api.execute(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }, [api]);

  return {
    ...api,
    put,
  };
}

export function useDelete<T>() {
  const api = useApi<T>();

  const delete_ = useCallback(async (url: string) => {
    return api.execute(url, {
      method: 'DELETE',
    });
  }, [api]);

  return {
    ...api,
    delete: delete_,
  };
}

/**
 * Hook para autenticación con Supabase
 * Reemplaza las llamadas al backend NestJS
 */
export function useAuth() {
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email: string, contrasena: string) => {
    setLoading(true);
    try {
      const resultado = await loginSupabase({ email, password: contrasena });
      toast.success('Sesión iniciada correctamente');
      return resultado;
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error al iniciar sesión';
      toast.error(mensaje);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const registro = useCallback(async (datosRegistro: {
    email: string;
    contrasena?: string;
    password?: string;
    nombre?: string;
  }) => {
    setLoading(true);
    try {
      // Normalizar campo password/contrasena
      const password = datosRegistro.password || datosRegistro.contrasena || '';

      const resultado = await registrarUsuario({
        email: datosRegistro.email,
        password,
        nombre: datosRegistro.nombre,
      });

      toast.success('Cuenta creada correctamente');
      return resultado;
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error al registrar';
      toast.error(mensaje);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const cerrarSesion = useCallback(async () => {
    setLoading(true);
    try {
      await logoutSupabase();
      toast.success('Sesión cerrada');
      window.location.href = '/';
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error al cerrar sesión';
      toast.error(mensaje);
    } finally {
      setLoading(false);
    }
  }, []);

  const obtenerUsuarioLocal = useCallback(async () => {
    const user = await obtenerUsuarioActual();

    if (!user) return null;

    // Obtener datos completos del usuario desde la tabla Usuario
    const supabase = obtenerClienteNavegador();
    const { data } = await supabase
      .from('Usuario')
      .select('*')
      .eq('auth_id', user.id)
      .single();

    return data;
  }, []);

  return {
    login,
    registro,
    cerrarSesion,
    obtenerUsuarioLocal,
    loading,
  };
}