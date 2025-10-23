/**
 * Hooks personalizados para usar Supabase en Client Components
 */

'use client'

import { useEffect, useState } from 'react'
import { obtenerClienteNavegador } from './cliente'
import type { User } from '@supabase/supabase-js'
import type { Database } from './tipos'

type Usuario = Database['public']['Tables']['Usuario']['Row']

/**
 * Hook para obtener el usuario autenticado actual
 */
export function useUsuario() {
  const [usuario, setUsuario] = useState<User | null>(null)
  const [cargando, setCargando] = useState(true)
  const supabase = obtenerClienteNavegador()

  useEffect(() => {
    // Obtener usuario inicial
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUsuario(user)
      setCargando(false)
    })

    // Suscribirse a cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuario(session?.user ?? null)
      setCargando(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  return { usuario, cargando }
}

/**
 * Hook para obtener el perfil completo del usuario desde la tabla Usuario
 */
export function usePerfilUsuario() {
  const { usuario } = useUsuario()
  const [perfil, setPerfil] = useState<Usuario | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = obtenerClienteNavegador()

  useEffect(() => {
    if (!usuario) {
      setPerfil(null)
      setCargando(false)
      return
    }

    async function cargarPerfil() {
      try {
        console.log('🔍 usePerfilUsuario - Cargando perfil para auth_id:', usuario!.id);

        const { data, error } = await supabase
          .from('Usuario')
          .select('*')
          .eq('auth_id', usuario!.id)
          .single()

        if (error) {
          console.error('❌ Error al cargar perfil:', error);
          throw error;
        }

        console.log('✅ Perfil cargado:', {
          id: data.id,
          email: data.email,
          nombre: data.nombre,
          rol: data.rol
        });

        setPerfil(data)
      } catch (err) {
        console.error('❌ Error en cargarPerfil:', err);
        setError(err as Error)
      } finally {
        setCargando(false)
      }
    }

    cargarPerfil()
  }, [usuario, supabase])

  return { perfil, cargando, error }
}

/**
 * Hook para suscribirse a mensajes en tiempo real
 */
export function useMensajesRealtime(conversacionId: string) {
  const [mensajes, setMensajes] = useState<Database['public']['Tables']['Mensaje']['Row'][]>([])
  const supabase = obtenerClienteNavegador()

  useEffect(() => {
    // Cargar mensajes iniciales
    async function cargarMensajes() {
      const { data } = await supabase
        .from('Mensaje')
        .select('*')
        .eq('conversacion_id', conversacionId)
        .order('creado_en', { ascending: true })

      if (data) {
        setMensajes(data)
      }
    }

    cargarMensajes()

    // Suscribirse a nuevos mensajes
    const canal = supabase
      .channel(`mensajes:${conversacionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Mensaje',
          filter: `conversacion_id=eq.${conversacionId}`,
        },
        (payload) => {
          setMensajes((prev) => [...prev, payload.new as Database['public']['Tables']['Mensaje']['Row']])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [conversacionId, supabase])

  return mensajes
}

/**
 * Hook para suscribirse a notificaciones en tiempo real
 */
export function useNotificacionesRealtime() {
  const { usuario } = useUsuario()
  const [notificaciones, setNotificaciones] = useState<Database['public']['Tables']['Notificacion']['Row'][]>([])
  const [noLeidas, setNoLeidas] = useState(0)
  const supabase = obtenerClienteNavegador()

  useEffect(() => {
    if (!usuario) return

    async function cargarNotificaciones() {
      // Obtener perfil del usuario
      const { data: perfilData } = await supabase
        .from('Usuario')
        .select('id')
        .eq('auth_id', usuario!.id)
        .single()

      if (!perfilData) return

      // Cargar notificaciones
      const { data } = await supabase
        .from('Notificacion')
        .select('*')
        .eq('usuario_id', perfilData.id)
        .order('creado_en', { ascending: false })
        .limit(20)

      if (data) {
        setNotificaciones(data)
        setNoLeidas(data.filter((n) => !n.leida).length)
      }
    }

    cargarNotificaciones()

    // Obtener el ID del usuario en la tabla Usuario
    supabase
      .from('Usuario')
      .select('id')
      .eq('auth_id', usuario.id)
      .single()
      .then(({ data: perfilData }) => {
        if (!perfilData) return

        // Suscribirse a nuevas notificaciones
        const canal = supabase
          .channel(`notificaciones:${perfilData.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'Notificacion',
              filter: `usuario_id=eq.${perfilData.id}`,
            },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                setNotificaciones((prev) => [payload.new as Database['public']['Tables']['Notificacion']['Row'], ...prev])
                setNoLeidas((prev) => prev + 1)
              } else if (payload.eventType === 'UPDATE') {
                setNotificaciones((prev) =>
                  prev.map((n) =>
                    n.id === payload.new.id ? (payload.new as Database['public']['Tables']['Notificacion']['Row']) : n
                  )
                )
                // Recalcular no leídas
                setNoLeidas((prev) => {
                  const notif = payload.new as Database['public']['Tables']['Notificacion']['Row']
                  return notif.leida ? Math.max(0, prev - 1) : prev
                })
              }
            }
          )
          .subscribe()

        return () => {
          supabase.removeChannel(canal)
        }
      })
  }, [usuario, supabase])

  const marcarComoLeida = async (notificacionId: string) => {
    await supabase
      .from('Notificacion')
      .update({ leida: true })
      .eq('id', notificacionId)
  }

  return { notificaciones, noLeidas, marcarComoLeida }
}
