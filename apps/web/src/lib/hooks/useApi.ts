'use client';

import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface ApiResponse<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

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
      // Asegurar que la URL tenga el prefijo correcto
      const apiUrl = url.startsWith('http') ? url : `http://localhost:3333/api${url.startsWith('/') ? url : `/${url}`}`;
      
      const defaultOptions: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      };

      // Agregar token si existe
      const token = localStorage.getItem('token');
      if (token) {
        defaultOptions.headers = {
          ...defaultOptions.headers,
          'Authorization': `Bearer ${token}`,
        };
      }

      const response = await fetch(apiUrl, defaultOptions);

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
      
      // Mostrar toast solo para errores críticos, no para errores esperados
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