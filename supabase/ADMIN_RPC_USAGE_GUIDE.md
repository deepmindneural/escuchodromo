# Guía de Uso: Funciones RPC Admin Seguras

Esta guía documenta cómo usar las funciones RPC admin desde el frontend de Next.js para las páginas de administración.

---

## Tabla de Contenidos
1. [Configuración Inicial](#configuración-inicial)
2. [Detalles de Usuario](#detalles-de-usuario)
3. [Detalles de Profesional](#detalles-de-profesional)
4. [Gestión de Evaluaciones](#gestión-de-evaluaciones)
5. [Manejo de Errores](#manejo-de-errores)
6. [Buenas Prácticas](#buenas-prácticas)

---

## Configuración Inicial

### Cliente Supabase

```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### Tipos TypeScript

```typescript
// types/admin.ts
export interface DetallesUsuario {
  usuario: {
    id: string;
    email: string;
    nombre: string | null;
    apellido: string | null;
    imagen: string | null;
    rol: 'USUARIO' | 'TERAPEUTA' | 'ADMIN';
    esta_activo: boolean;
    creado_en: string;
    actualizado_en: string;
  };
  perfil: {
    id: string;
    telefono: string | null;
    fecha_nacimiento: string | null;
    genero: string | null;
    idioma_preferido: string;
    moneda: string;
    // ... otros campos
  } | null;
  estadisticas: {
    total_conversaciones: number;
    conversaciones_activas: number;
    total_mensajes: number;
    total_evaluaciones: number;
    evaluaciones_completadas: number;
    total_pagos: number;
    pagos_completados: number;
    monto_total_pagado: number;
    total_citas: number;
    citas_completadas: number;
    citas_pendientes: number;
  };
  suscripcion_activa: any | null;
  ultima_conversacion: any | null;
  ultimos_pagos: any[] | null;
}

export interface DetallesProfesional {
  usuario: {
    id: string;
    email: string;
    nombre: string | null;
    apellido: string | null;
    rol: string;
    esta_activo: boolean;
  };
  perfil_profesional: any;
  documentos: any[] | null;
  horarios: any[] | null;
  estadisticas: {
    total_citas: number;
    citas_completadas: number;
    citas_pendientes: number;
    citas_canceladas: number;
    total_pacientes_unicos: number;
    calificacion_promedio: number;
    total_calificaciones: number;
  };
  ultimas_citas: any[] | null;
  calificaciones_recientes: any[] | null;
}
```

---

## Detalles de Usuario

### Página: `/admin/usuarios/[id]`

#### Implementación Básica

```typescript
// app/admin/usuarios/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { DetallesUsuario } from '@/types/admin';

export default function DetallesUsuarioPage() {
  const params = useParams();
  const usuarioId = params.id as string;

  const [detalles, setDetalles] = useState<DetallesUsuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obtenerDetalles();
  }, [usuarioId]);

  async function obtenerDetalles() {
    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc(
        'admin_obtener_detalles_usuario',
        {
          p_usuario_id: usuarioId,
          p_justificacion: 'Consulta de detalles de usuario desde panel administrativo'
        }
      );

      if (rpcError) throw rpcError;

      setDetalles(data);
    } catch (err: any) {
      console.error('Error al obtener detalles:', err);
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Cargando...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!detalles) return <div>Usuario no encontrado</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Información del Usuario */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Información del Usuario</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-500">Email</label>
            <p className="font-medium">{detalles.usuario.email}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Nombre Completo</label>
            <p className="font-medium">
              {detalles.usuario.nombre} {detalles.usuario.apellido}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Rol</label>
            <p className="font-medium">{detalles.usuario.rol}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Estado</label>
            <p className="font-medium">
              {detalles.usuario.esta_activo ? (
                <span className="text-green-600">Activo</span>
              ) : (
                <span className="text-red-600">Inactivo</span>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Estadísticas */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Estadísticas</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded">
            <p className="text-3xl font-bold text-blue-600">
              {detalles.estadisticas.total_conversaciones}
            </p>
            <p className="text-sm text-gray-600">Conversaciones</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded">
            <p className="text-3xl font-bold text-green-600">
              {detalles.estadisticas.total_evaluaciones}
            </p>
            <p className="text-sm text-gray-600">Evaluaciones</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded">
            <p className="text-3xl font-bold text-purple-600">
              ${detalles.estadisticas.monto_total_pagado.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Total Pagado</p>
          </div>
        </div>
      </section>

      {/* Últimos Pagos */}
      {detalles.ultimos_pagos && detalles.ultimos_pagos.length > 0 && (
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Últimos Pagos</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Fecha</th>
                <th className="text-left p-2">Monto</th>
                <th className="text-left p-2">Estado</th>
                <th className="text-left p-2">Método</th>
              </tr>
            </thead>
            <tbody>
              {detalles.ultimos_pagos.map((pago) => (
                <tr key={pago.id} className="border-b">
                  <td className="p-2">
                    {new Date(pago.creado_en).toLocaleDateString()}
                  </td>
                  <td className="p-2">
                    {pago.monto.toLocaleString()} {pago.moneda}
                  </td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        pago.estado === 'completado'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {pago.estado}
                    </span>
                  </td>
                  <td className="p-2">{pago.metodo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
```

#### Implementación con React Query

```typescript
// hooks/useDetallesUsuario.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { DetallesUsuario } from '@/types/admin';

export function useDetallesUsuario(usuarioId: string, justificacion?: string) {
  return useQuery<DetallesUsuario>({
    queryKey: ['admin', 'usuarios', usuarioId, 'detalles'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        'admin_obtener_detalles_usuario',
        {
          p_usuario_id: usuarioId,
          p_justificacion:
            justificacion ||
            'Consulta de detalles de usuario desde panel administrativo'
        }
      );

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1
  });
}

// Uso en componente
import { useDetallesUsuario } from '@/hooks/useDetallesUsuario';

function DetallesUsuarioPage() {
  const { data, isLoading, error } = useDetallesUsuario(usuarioId);

  if (isLoading) return <Loading />;
  if (error) return <Error error={error} />;
  if (!data) return <NotFound />;

  return <DetallesUsuarioView detalles={data} />;
}
```

---

## Detalles de Profesional

### Página: `/admin/profesionales/[id]`

```typescript
// app/admin/profesionales/[id]/page.tsx
import { supabase } from '@/lib/supabase/client';
import { DetallesProfesional } from '@/types/admin';

async function obtenerDetallesProfesional(
  profesionalId: string
): Promise<DetallesProfesional> {
  const { data, error } = await supabase.rpc(
    'admin_obtener_detalles_profesional',
    {
      p_profesional_id: profesionalId,
      p_justificacion:
        'Consulta de detalles de profesional desde panel administrativo'
    }
  );

  if (error) throw error;
  return data;
}

export default async function DetallesProfesionalPage({
  params
}: {
  params: { id: string };
}) {
  const detalles = await obtenerDetallesProfesional(params.id);

  return (
    <div className="p-6 space-y-6">
      {/* Información del Profesional */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Información del Profesional</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-500">Nombre</label>
            <p className="font-medium">
              {detalles.usuario.nombre} {detalles.usuario.apellido}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Email</label>
            <p className="font-medium">{detalles.usuario.email}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Título Profesional</label>
            <p className="font-medium">
              {detalles.perfil_profesional.titulo_profesional}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Licencia</label>
            <p className="font-medium">
              {detalles.perfil_profesional.numero_licencia}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Estado de Aprobación</label>
            <p className="font-medium">
              {detalles.perfil_profesional.perfil_aprobado ? (
                <span className="text-green-600">Aprobado</span>
              ) : (
                <span className="text-yellow-600">Pendiente</span>
              )}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Documentos Verificados</label>
            <p className="font-medium">
              {detalles.perfil_profesional.documentos_verificados ? (
                <span className="text-green-600">Sí</span>
              ) : (
                <span className="text-red-600">No</span>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Estadísticas */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Estadísticas</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded">
            <p className="text-3xl font-bold text-blue-600">
              {detalles.estadisticas.total_citas}
            </p>
            <p className="text-sm text-gray-600">Total Citas</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded">
            <p className="text-3xl font-bold text-green-600">
              {detalles.estadisticas.citas_completadas}
            </p>
            <p className="text-sm text-gray-600">Completadas</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded">
            <p className="text-3xl font-bold text-purple-600">
              {detalles.estadisticas.total_pacientes_unicos}
            </p>
            <p className="text-sm text-gray-600">Pacientes Únicos</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded">
            <p className="text-3xl font-bold text-yellow-600">
              {detalles.estadisticas.calificacion_promedio.toFixed(1)} ⭐
            </p>
            <p className="text-sm text-gray-600">Calificación</p>
          </div>
        </div>
      </section>

      {/* Documentos Profesionales */}
      {detalles.documentos && detalles.documentos.length > 0 && (
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Documentos Profesionales</h2>
          <div className="space-y-3">
            {detalles.documentos.map((doc) => (
              <div
                key={doc.id}
                className="flex justify-between items-center p-3 border rounded"
              >
                <div>
                  <p className="font-medium">{doc.tipo_documento}</p>
                  <p className="text-sm text-gray-500">
                    Subido: {new Date(doc.fecha_subida).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      doc.verificado
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {doc.verificado ? 'Verificado' : 'Pendiente'}
                  </span>
                  <a
                    href={doc.url_documento}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Ver Documento
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
```

---

## Gestión de Evaluaciones

### Listar Evaluaciones

```typescript
// app/admin/evaluaciones/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Evaluacion {
  id: string;
  usuario_id: string;
  usuario_email: string;
  usuario_nombre: string;
  test_id: string;
  puntuacion: number;
  severidad: string;
  interpretacion: string | null;
  completado: boolean;
  creado_en: string;
}

export default function EvaluacionesPage() {
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [limite, setLimite] = useState(50);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    cargarEvaluaciones();
  }, [usuarioId, limite, offset]);

  async function cargarEvaluaciones() {
    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc(
        'admin_listar_evaluaciones',
        {
          p_usuario_id: usuarioId,
          p_limite: limite,
          p_offset: offset,
          p_justificacion:
            'Consulta de listado de evaluaciones desde panel administrativo'
        }
      );

      if (rpcError) throw rpcError;

      setEvaluaciones(data || []);
    } catch (err: any) {
      console.error('Error al cargar evaluaciones:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Evaluaciones</h1>

      {/* Tabla de Evaluaciones */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4">Usuario</th>
              <th className="text-left p-4">Puntuación</th>
              <th className="text-left p-4">Severidad</th>
              <th className="text-left p-4">Fecha</th>
              <th className="text-left p-4">Estado</th>
              <th className="text-left p-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {evaluaciones.map((eval) => (
              <tr key={eval.id} className="border-t">
                <td className="p-4">
                  <div>
                    <p className="font-medium">{eval.usuario_nombre}</p>
                    <p className="text-sm text-gray-500">{eval.usuario_email}</p>
                  </div>
                </td>
                <td className="p-4">
                  <span className="font-bold text-lg">{eval.puntuacion}</span>
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      eval.severidad === 'severa'
                        ? 'bg-red-100 text-red-800'
                        : eval.severidad === 'moderada'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {eval.severidad}
                  </span>
                </td>
                <td className="p-4">
                  {new Date(eval.creado_en).toLocaleDateString()}
                </td>
                <td className="p-4">
                  {eval.completado ? (
                    <span className="text-green-600">Completada</span>
                  ) : (
                    <span className="text-yellow-600">Pendiente</span>
                  )}
                </td>
                <td className="p-4">
                  <button
                    onClick={() => verDetalles(eval.id)}
                    className="text-blue-600 hover:underline mr-3"
                  >
                    Ver
                  </button>
                  <button
                    onClick={() => editarEvaluacion(eval)}
                    className="text-orange-600 hover:underline mr-3"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => confirmarEliminar(eval)}
                    className="text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Paginación */}
        <div className="p-4 border-t flex justify-between items-center">
          <button
            onClick={() => setOffset(Math.max(0, offset - limite))}
            disabled={offset === 0}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600">
            Mostrando {offset + 1} - {offset + evaluaciones.length}
          </span>
          <button
            onClick={() => setOffset(offset + limite)}
            disabled={evaluaciones.length < limite}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Actualizar Evaluación

```typescript
async function actualizarEvaluacion(
  evaluacionId: string,
  cambios: {
    interpretacion?: string;
    severidad?: string;
    completado?: boolean;
  },
  justificacion: string
) {
  const { data, error } = await supabase.rpc('admin_actualizar_evaluacion', {
    p_evaluacion_id: evaluacionId,
    p_interpretacion: cambios.interpretacion || null,
    p_severidad: cambios.severidad || null,
    p_completado: cambios.completado ?? null,
    p_justificacion: justificacion
  });

  if (error) {
    console.error('Error al actualizar evaluación:', error);
    throw error;
  }

  return data;
}

// Ejemplo de uso en componente
function EditarEvaluacionDialog({ evaluacion, onClose, onSuccess }) {
  const [severidad, setSeveridad] = useState(evaluacion.severidad);
  const [interpretacion, setInterpretacion] = useState(
    evaluacion.interpretacion || ''
  );
  const [justificacion, setJustificacion] = useState('');
  const [loading, setLoading] = useState(false);

  async function guardar() {
    if (justificacion.length < 20) {
      alert('La justificación debe tener al menos 20 caracteres');
      return;
    }

    try {
      setLoading(true);

      await actualizarEvaluacion(
        evaluacion.id,
        { severidad, interpretacion },
        justificacion
      );

      onSuccess();
      onClose();
    } catch (error) {
      alert('Error al actualizar: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Editar Evaluación</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Severidad</label>
            <select
              value={severidad}
              onChange={(e) => setSeveridad(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="minima">Mínima</option>
              <option value="leve">Leve</option>
              <option value="moderada">Moderada</option>
              <option value="moderadamente_severa">Moderadamente Severa</option>
              <option value="severa">Severa</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Interpretación
            </label>
            <textarea
              value={interpretacion}
              onChange={(e) => setInterpretacion(e.target.value)}
              className="w-full border rounded p-2"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Justificación (mínimo 20 caracteres) *
            </label>
            <textarea
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
              className="w-full border rounded p-2"
              rows={3}
              placeholder="Ej: Corrección de severidad según nueva interpretación clínica del terapeuta"
            />
            <p className="text-xs text-gray-500 mt-1">
              {justificacion.length} / 20 caracteres
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={guardar}
              disabled={loading || justificacion.length < 20}
              className="flex-1 bg-blue-600 text-white py-2 rounded disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-300 py-2 rounded"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Eliminar Evaluación

```typescript
async function eliminarEvaluacion(evaluacionId: string, justificacion: string) {
  const { data, error } = await supabase.rpc('admin_eliminar_evaluacion', {
    p_evaluacion_id: evaluacionId,
    p_justificacion: justificacion
  });

  if (error) {
    console.error('Error al eliminar evaluación:', error);
    throw error;
  }

  return data;
}

// Componente de confirmación
function ConfirmarEliminarDialog({ evaluacion, onClose, onSuccess }) {
  const [justificacion, setJustificacion] = useState('');
  const [loading, setLoading] = useState(false);

  async function eliminar() {
    if (justificacion.length < 30) {
      alert('La justificación debe tener al menos 30 caracteres para eliminar');
      return;
    }

    if (
      !confirm(
        '¿Estás seguro de eliminar esta evaluación? Esta acción NO se puede deshacer.'
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await eliminarEvaluacion(evaluacion.id, justificacion);
      onSuccess();
      onClose();
    } catch (error) {
      alert('Error al eliminar: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-red-600">
          ⚠️ Eliminar Evaluación
        </h2>

        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-red-800">
            Esta acción eliminará permanentemente los datos de la evaluación PHQ-9/GAD-7
            del paciente <strong>{evaluacion.usuario_nombre}</strong>.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Justificación Detallada (mínimo 30 caracteres) *
            </label>
            <textarea
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
              className="w-full border rounded p-2"
              rows={4}
              placeholder="Ej: Eliminación solicitada por paciente ejerciendo derecho GDPR al olvido. Ticket: GDPR-2025-001234. Aprobado por: Dr. Juan Pérez"
            />
            <p className="text-xs text-gray-500 mt-1">
              {justificacion.length} / 30 caracteres
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={eliminar}
              disabled={loading || justificacion.length < 30}
              className="flex-1 bg-red-600 text-white py-2 rounded disabled:opacity-50"
            >
              {loading ? 'Eliminando...' : 'Eliminar Definitivamente'}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-300 py-2 rounded"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## Manejo de Errores

### Errores Comunes

```typescript
// utils/handleRpcError.ts
export function handleRpcError(error: any): string {
  // Error de autenticación
  if (error.message.includes('No autorizado')) {
    return 'No tienes permisos para realizar esta acción. Solo los administradores pueden acceder.';
  }

  // Error de justificación
  if (error.message.includes('Justificación obligatoria')) {
    return 'Debes proporcionar una justificación válida para esta acción.';
  }

  if (error.message.includes('mínimo 10 caracteres')) {
    return 'La justificación debe tener al menos 10 caracteres.';
  }

  if (error.message.includes('mínimo 20 caracteres')) {
    return 'La justificación debe tener al menos 20 caracteres (PHI crítico).';
  }

  if (error.message.includes('mínimo 30 caracteres')) {
    return 'La justificación para eliminar debe tener al menos 30 caracteres detallados.';
  }

  // Error de recurso no encontrado
  if (error.message.includes('no encontrado')) {
    return 'El recurso solicitado no existe.';
  }

  // Error genérico
  return error.message || 'Error desconocido al procesar la solicitud.';
}

// Uso en componentes
try {
  const data = await supabase.rpc('admin_obtener_detalles_usuario', { ... });
} catch (error) {
  const mensajeAmigable = handleRpcError(error);
  toast.error(mensajeAmigable);
}
```

### Hook de Manejo de Errores

```typescript
// hooks/useRpcMutation.ts
import { useMutation } from '@tanstack/react-query';
import { handleRpcError } from '@/utils/handleRpcError';
import { toast } from 'sonner';

export function useRpcMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData) => void;
    onError?: (error: string) => void;
  }
) {
  return useMutation<TData, any, TVariables>({
    mutationFn,
    onSuccess: (data) => {
      toast.success('Operación completada exitosamente');
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      const mensaje = handleRpcError(error);
      toast.error(mensaje);
      options?.onError?.(mensaje);
    }
  });
}

// Uso
const actualizarMutation = useRpcMutation(
  ({ evaluacionId, cambios, justificacion }) =>
    actualizarEvaluacion(evaluacionId, cambios, justificacion),
  {
    onSuccess: () => {
      queryClient.invalidateQueries(['evaluaciones']);
    }
  }
);

// En el componente
await actualizarMutation.mutateAsync({
  evaluacionId: '...',
  cambios: { severidad: 'moderada' },
  justificacion: '...'
});
```

---

## Buenas Prácticas

### 1. Siempre Proporcionar Justificación Clara

```typescript
// ❌ MAL - Justificación genérica
const justificacion = 'Ver usuario';

// ✅ BIEN - Justificación específica
const justificacion =
  'Revisión de cuenta de usuario para investigar reporte de error en suscripción. Ticket: SUP-2025-12345';
```

### 2. Validar Justificación en el Frontend

```typescript
function validarJustificacion(
  texto: string,
  minimoCaracteres: number
): { valida: boolean; error?: string } {
  if (!texto || texto.trim().length === 0) {
    return { valida: false, error: 'La justificación es obligatoria' };
  }

  if (texto.trim().length < minimoCaracteres) {
    return {
      valida: false,
      error: `La justificación debe tener al menos ${minimoCaracteres} caracteres`
    };
  }

  if (texto.toLowerCase().includes('test')) {
    return {
      valida: false,
      error: 'La justificación no puede ser de prueba en producción'
    };
  }

  return { valida: true };
}
```

### 3. Cachear Resultados Apropiadamente

```typescript
// React Query con tiempo de stale apropiado
const { data } = useQuery({
  queryKey: ['admin', 'usuario', usuarioId],
  queryFn: () => obtenerDetallesUsuario(usuarioId),
  staleTime: 5 * 60 * 1000, // 5 minutos - datos admin no cambian frecuentemente
  cacheTime: 10 * 60 * 1000 // 10 minutos en cache
});
```

### 4. Mostrar Loading States

```typescript
function DetallesUsuario({ usuarioId }) {
  const { data, isLoading, error } = useDetallesUsuario(usuarioId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Cargando detalles del usuario...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4">
        <p className="text-red-800">Error: {handleRpcError(error)}</p>
      </div>
    );
  }

  return <DetallesView detalles={data} />;
}
```

### 5. Implementar Confirmaciones para Acciones Destructivas

```typescript
async function eliminarConConfirmacion(evaluacion, justificacion) {
  // Confirmación 1: Diálogo explicativo
  const confirmar1 = await mostrarDialogoConfirmacion({
    titulo: '¿Eliminar Evaluación?',
    mensaje: `Esto eliminará permanentemente la evaluación de ${evaluacion.usuario_nombre}.`,
    tipo: 'destructivo'
  });

  if (!confirmar1) return;

  // Confirmación 2: Escribir "ELIMINAR" para confirmar
  const confirmar2 = await mostrarDialogoTextoConfirmacion({
    titulo: 'Confirmar Eliminación',
    mensaje: 'Escribe ELIMINAR para confirmar esta acción irreversible:',
    textoEsperado: 'ELIMINAR'
  });

  if (!confirmar2) return;

  // Proceder con eliminación
  await eliminarEvaluacion(evaluacion.id, justificacion);
}
```

### 6. Logging de Acciones Admin

```typescript
// Wrapper que registra todas las acciones admin
async function ejecutarAccionAdmin<T>(
  accion: string,
  fn: () => Promise<T>,
  metadata?: any
): Promise<T> {
  const inicio = Date.now();

  try {
    console.log(`[ADMIN] Iniciando: ${accion}`, metadata);

    const resultado = await fn();

    console.log(`[ADMIN] Completado: ${accion} (${Date.now() - inicio}ms)`);

    return resultado;
  } catch (error) {
    console.error(`[ADMIN] Error en: ${accion}`, error);
    throw error;
  }
}

// Uso
const detalles = await ejecutarAccionAdmin(
  'obtener_detalles_usuario',
  () => supabase.rpc('admin_obtener_detalles_usuario', { ... }),
  { usuarioId }
);
```

---

## Recursos Adicionales

- [Documentación de Supabase RPC](https://supabase.com/docs/guides/database/functions)
- [Auditoría de Seguridad Completa](./SECURITY_AUDIT_ADMIN_RLS.md)
- [Guía de Compliance HIPAA/GDPR](./COMPLIANCE_GUIDE.md)

---

**Última Actualización**: 2025-10-24
**Autor**: Claude (Backend Security Engineer)
