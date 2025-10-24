# Guía Rápida: Operaciones CRUD de ADMIN

**Fecha:** 2025-10-24
**Versión:** 1.0
**Para:** Desarrolladores Frontend - Admin Dashboard

---

## Índice

1. [Funciones RPC Disponibles](#1-funciones-rpc-disponibles)
2. [Ejemplos de Código Frontend](#2-ejemplos-de-código-frontend)
3. [Manejo de Errores](#3-manejo-de-errores)
4. [Validaciones de Justificación](#4-validaciones-de-justificación)
5. [Componentes UI Recomendados](#5-componentes-ui-recomendados)

---

## 1. Funciones RPC Disponibles

### 1.1 Listar Evaluaciones

```typescript
admin_listar_evaluaciones(
  p_usuario_id?: UUID,
  p_limite?: INTEGER = 50,
  p_offset?: INTEGER = 0,
  p_justificacion: TEXT  // OBLIGATORIO
)

// Retorna:
{
  id: UUID
  usuario_id: UUID
  test_id: UUID
  puntuacion: number
  severidad: string
  interpretacion: string
  completado: boolean
  creado_en: timestamp
  usuario_email: string
  usuario_nombre: string
}[]
```

### 1.2 Actualizar Evaluación

```typescript
admin_actualizar_evaluacion(
  p_evaluacion_id: UUID,
  p_interpretacion?: TEXT,
  p_severidad?: TEXT,
  p_completado?: BOOLEAN,
  p_justificacion: TEXT  // OBLIGATORIO, min 20 chars
)

// Retorna: boolean
```

### 1.3 Eliminar Evaluación

```typescript
admin_eliminar_evaluacion(
  p_evaluacion_id: UUID,
  p_justificacion: TEXT  // OBLIGATORIO, min 30 chars
)

// Retorna: boolean
```

### 1.4 Desactivar Usuario (Soft Delete)

```typescript
admin_desactivar_usuario(
  p_usuario_id: UUID,
  p_justificacion: TEXT  // OBLIGATORIO, min 20 chars
)

// Retorna: boolean
```

---

## 2. Ejemplos de Código Frontend

### 2.1 Listar Evaluaciones de un Usuario

```typescript
// src/app/admin/evaluaciones/page.tsx

import { createClient } from '@/lib/supabase/client';

async function listarEvaluaciones(usuarioId: string) {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('admin_listar_evaluaciones', {
    p_usuario_id: usuarioId,
    p_limite: 20,
    p_offset: 0,
    p_justificacion: 'Revisión de historial de evaluaciones para seguimiento terapéutico'
  });

  if (error) {
    console.error('Error al listar evaluaciones:', error);
    return null;
  }

  return data;
}

// Uso en componente
export default function EvaluacionesPage() {
  const [evaluaciones, setEvaluaciones] = useState([]);

  useEffect(() => {
    async function cargar() {
      const data = await listarEvaluaciones('uuid-del-usuario');
      if (data) setEvaluaciones(data);
    }
    cargar();
  }, []);

  return (
    <div>
      {evaluaciones.map((eval) => (
        <EvaluacionCard key={eval.id} evaluacion={eval} />
      ))}
    </div>
  );
}
```

### 2.2 Actualizar Evaluación con Modal de Justificación

```typescript
// src/app/admin/evaluaciones/[id]/editar.tsx

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface ActualizarEvaluacionProps {
  evaluacionId: string;
  severidadActual: string;
}

export function FormularioActualizarEvaluacion({
  evaluacionId,
  severidadActual
}: ActualizarEvaluacionProps) {
  const [severidad, setSeveridad] = useState(severidadActual);
  const [justificacion, setJustificacion] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar justificación en frontend
    if (justificacion.length < 20) {
      toast.error('La justificación debe tener al menos 20 caracteres');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase.rpc('admin_actualizar_evaluacion', {
      p_evaluacion_id: evaluacionId,
      p_severidad: severidad,
      p_justificacion: justificacion
    });

    setLoading(false);

    if (error) {
      toast.error(`Error: ${error.message}`);
      return;
    }

    toast.success('Evaluación actualizada correctamente');
    // Actualizar UI o redirigir
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="severidad" className="block text-sm font-medium">
          Severidad
        </label>
        <select
          id="severidad"
          value={severidad}
          onChange={(e) => setSeveridad(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300"
        >
          <option value="minima">Mínima</option>
          <option value="leve">Leve</option>
          <option value="moderada">Moderada</option>
          <option value="severa">Severa</option>
        </select>
      </div>

      <div>
        <label htmlFor="justificacion" className="block text-sm font-medium">
          Justificación (mínimo 20 caracteres) *
        </label>
        <textarea
          id="justificacion"
          value={justificacion}
          onChange={(e) => setJustificacion(e.target.value)}
          rows={4}
          required
          minLength={20}
          placeholder="Explica la razón del cambio, incluyendo contexto clínico si aplica..."
          className="mt-1 block w-full rounded-md border-gray-300"
        />
        <p className="mt-1 text-xs text-gray-500">
          {justificacion.length}/20 caracteres mínimos
        </p>
      </div>

      <button
        type="submit"
        disabled={loading || justificacion.length < 20}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Actualizando...' : 'Actualizar Evaluación'}
      </button>
    </form>
  );
}
```

### 2.3 Eliminar Evaluación con Confirmación

```typescript
// src/app/admin/evaluaciones/[id]/eliminar.tsx

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Modal } from '@/lib/componentes/ui/Modal';

interface EliminarEvaluacionProps {
  evaluacionId: string;
  onEliminado: () => void;
}

export function BotonEliminarEvaluacion({
  evaluacionId,
  onEliminado
}: EliminarEvaluacionProps) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [justificacion, setJustificacion] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEliminar = async () => {
    // Validar justificación (mínimo 30 chars para DELETE)
    if (justificacion.length < 30) {
      toast.error('La justificación debe tener al menos 30 caracteres para eliminar');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase.rpc('admin_eliminar_evaluacion', {
      p_evaluacion_id: evaluacionId,
      p_justificacion: justificacion
    });

    setLoading(false);

    if (error) {
      toast.error(`Error al eliminar: ${error.message}`);
      return;
    }

    toast.success('Evaluación eliminada correctamente');
    setModalAbierto(false);
    onEliminado();
  };

  return (
    <>
      <button
        onClick={() => setModalAbierto(true)}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
      >
        Eliminar Evaluación
      </button>

      <Modal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title="Eliminar Evaluación"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <p className="text-sm text-red-800">
              ⚠️ Esta acción es irreversible. La evaluación se eliminará permanentemente
              de la base de datos.
            </p>
          </div>

          <div>
            <label htmlFor="justificacion-delete" className="block text-sm font-medium">
              Justificación Detallada (mínimo 30 caracteres) *
            </label>
            <textarea
              id="justificacion-delete"
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
              rows={5}
              required
              minLength={30}
              placeholder="Explica detalladamente por qué es necesario eliminar esta evaluación. Incluye: razón, contexto, y referencia a ticket/caso si aplica..."
              className="mt-1 block w-full rounded-md border-gray-300"
            />
            <p className="mt-1 text-xs text-gray-500">
              {justificacion.length}/30 caracteres mínimos
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setModalAbierto(false)}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              onClick={handleEliminar}
              disabled={loading || justificacion.length < 30}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Eliminando...' : 'Confirmar Eliminación'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
```

### 2.4 Desactivar Usuario

```typescript
// src/app/admin/usuarios/[id]/desactivar.tsx

import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

async function desactivarUsuario(usuarioId: string, justificacion: string) {
  // Validar justificación
  if (justificacion.length < 20) {
    toast.error('La justificación debe tener al menos 20 caracteres');
    return false;
  }

  const supabase = createClient();

  const { data, error } = await supabase.rpc('admin_desactivar_usuario', {
    p_usuario_id: usuarioId,
    p_justificacion: justificacion
  });

  if (error) {
    // Manejar errores específicos
    if (error.message.includes('no puede desactivarse a sí mismo')) {
      toast.error('No puedes desactivar tu propia cuenta de administrador');
    } else {
      toast.error(`Error: ${error.message}`);
    }
    return false;
  }

  toast.success('Usuario desactivado correctamente');
  return true;
}

// Uso en componente
export function BotonDesactivarUsuario({ usuarioId }: { usuarioId: string }) {
  const [justificacion, setJustificacion] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDesactivar = async () => {
    setLoading(true);
    const exito = await desactivarUsuario(usuarioId, justificacion);
    setLoading(false);

    if (exito) {
      // Actualizar UI o redirigir
    }
  };

  return (
    <div className="space-y-4">
      <textarea
        value={justificacion}
        onChange={(e) => setJustificacion(e.target.value)}
        placeholder="Justificación de desactivación (mínimo 20 caracteres)..."
        rows={3}
        className="w-full rounded-md border-gray-300"
      />
      <button
        onClick={handleDesactivar}
        disabled={loading || justificacion.length < 20}
        className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
      >
        {loading ? 'Desactivando...' : 'Desactivar Usuario'}
      </button>
    </div>
  );
}
```

---

## 3. Manejo de Errores

### 3.1 Errores Comunes

| Código de Error | Causa | Solución |
|-----------------|-------|----------|
| `Solo administradores pueden...` | Usuario no tiene rol ADMIN | Verificar autenticación y permisos |
| `Justificación obligatoria de mínimo X caracteres` | Justificación muy corta | Aumentar longitud de justificación |
| `Un administrador no puede desactivarse a sí mismo` | Auto-desactivación | Usar otra cuenta ADMIN |
| `Evaluación no encontrada` | ID inválido o ya eliminado | Verificar existencia antes de operar |
| `new row violates row-level security policy` | Ventana de justificación expirada | Registrar nueva justificación |

### 3.2 Ejemplo de Manejo de Errores

```typescript
async function ejecutarOperacionSegura<T>(
  operacion: () => Promise<{ data: T | null; error: any }>
) {
  try {
    const { data, error } = await operacion();

    if (error) {
      // Errores de validación
      if (error.message.includes('Justificación obligatoria')) {
        toast.error('Justificación insuficiente. Revisa la longitud mínima.');
        return null;
      }

      // Errores de permisos
      if (error.message.includes('Solo administradores')) {
        toast.error('No tienes permisos para esta operación');
        // Redirigir a login o página de error
        return null;
      }

      // Errores de RLS (ventana expirada)
      if (error.message.includes('row-level security')) {
        toast.error('Tu sesión de justificación expiró. Intenta nuevamente.');
        return null;
      }

      // Error genérico
      toast.error(`Error inesperado: ${error.message}`);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error en operación admin:', err);
    toast.error('Error de red. Verifica tu conexión.');
    return null;
  }
}

// Uso:
const evaluaciones = await ejecutarOperacionSegura(() =>
  supabase.rpc('admin_listar_evaluaciones', {
    p_usuario_id: 'uuid',
    p_limite: 50,
    p_offset: 0,
    p_justificacion: 'Revisión de historial clínico'
  })
);
```

---

## 4. Validaciones de Justificación

### 4.1 Longitudes Mínimas

| Operación | Longitud Mínima | Razón |
|-----------|-----------------|-------|
| Listar evaluaciones | 10 caracteres | Operación de lectura menos crítica |
| Actualizar evaluación | 20 caracteres | Modificación de PHI requiere justificación clara |
| Eliminar evaluación | 30 caracteres | Operación destructiva requiere detalle |
| Desactivar usuario | 20 caracteres | Afecta acceso pero no elimina datos |

### 4.2 Ejemplos de Justificaciones Válidas

**BUENAS:**
```
✅ "Corrección de severidad tras revisión clínica del 2025-10-20. Paciente mostró mejoría significativa según PHQ-9. Ticket: MED-4567"
(115 caracteres - muy detallada)

✅ "Eliminación de evaluación duplicada por error de red durante mantenimiento del 2025-10-19. Evaluación original conservada: uuid-abc-123"
(125 caracteres - incluye contexto y referencia)

✅ "Actualización de interpretación según nueva guía clínica DSM-5-TR publicada en octubre 2025"
(89 caracteres - justificación clínica clara)

✅ "Usuario solicitó eliminación de cuenta vía email del 2025-10-20. Ticket de soporte: SUPPORT-8901"
(89 caracteres - incluye evidencia y ticket)
```

**MALAS:**
```
❌ "Actualizar evaluación"
(21 caracteres - muy vaga, no explica razón)

❌ "Corrección de datos"
(19 caracteres - menos de mínimo 20)

❌ "Test"
(4 caracteres - claramente insuficiente)

❌ "aaaaaaaaaaaaaaaaaaaaa"
(21 caracteres - relleno sin sentido)
```

### 4.3 Componente de Validación

```typescript
// src/lib/componentes/admin/ValidadorJustificacion.tsx

interface ValidadorJustificacionProps {
  valor: string;
  minimoCaracteres: number;
  onChange: (valor: string) => void;
}

export function ValidadorJustificacion({
  valor,
  minimoCaracteres,
  onChange
}: ValidadorJustificacionProps) {
  const esValida = valor.length >= minimoCaracteres;
  const colorBorde = esValida ? 'border-green-500' : 'border-gray-300';
  const colorTexto = esValida ? 'text-green-600' : 'text-gray-500';

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Justificación (obligatorio)
      </label>

      <textarea
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className={`w-full rounded-md border-2 ${colorBorde} focus:ring-2 focus:ring-blue-500`}
        placeholder={`Explica detalladamente la razón de esta acción (mínimo ${minimoCaracteres} caracteres)...`}
      />

      <div className="flex items-center justify-between">
        <p className={`text-xs ${colorTexto}`}>
          {valor.length} / {minimoCaracteres} caracteres
          {esValida && ' ✓'}
        </p>

        {!esValida && valor.length > 0 && (
          <p className="text-xs text-red-600">
            Faltan {minimoCaracteres - valor.length} caracteres
          </p>
        )}
      </div>

      {/* Ayuda contextual */}
      <details className="text-xs text-gray-600">
        <summary className="cursor-pointer font-medium">
          ¿Qué debo incluir en la justificación?
        </summary>
        <ul className="mt-2 ml-4 list-disc space-y-1">
          <li>Razón específica de la acción</li>
          <li>Contexto clínico o técnico si aplica</li>
          <li>Referencia a ticket de soporte (si existe)</li>
          <li>Fecha del evento relacionado</li>
        </ul>
      </details>
    </div>
  );
}
```

---

## 5. Componentes UI Recomendados

### 5.1 Modal de Justificación Reutilizable

```typescript
// src/lib/componentes/admin/ModalJustificacion.tsx

import { useState } from 'react';
import { Modal } from '@/lib/componentes/ui/Modal';
import { ValidadorJustificacion } from './ValidadorJustificacion';

interface ModalJustificacionProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmar: (justificacion: string) => Promise<void>;
  titulo: string;
  descripcion: string;
  minimoCaracteres?: number;
  tipoOperacion: 'actualizar' | 'eliminar' | 'desactivar';
}

export function ModalJustificacion({
  isOpen,
  onClose,
  onConfirmar,
  titulo,
  descripcion,
  minimoCaracteres = 20,
  tipoOperacion
}: ModalJustificacionProps) {
  const [justificacion, setJustificacion] = useState('');
  const [loading, setLoading] = useState(false);

  const colorBoton = {
    actualizar: 'bg-blue-600 hover:bg-blue-700',
    eliminar: 'bg-red-600 hover:bg-red-700',
    desactivar: 'bg-orange-600 hover:bg-orange-700'
  }[tipoOperacion];

  const handleConfirmar = async () => {
    if (justificacion.length < minimoCaracteres) return;

    setLoading(true);
    try {
      await onConfirmar(justificacion);
      setJustificacion(''); // Limpiar al éxito
      onClose();
    } catch (error) {
      console.error('Error en operación:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={titulo}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{descripcion}</p>

        {tipoOperacion === 'eliminar' && (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <p className="text-xs text-red-800">
              ⚠️ Esta acción es irreversible. Los datos se eliminarán permanentemente.
            </p>
          </div>
        )}

        <ValidadorJustificacion
          valor={justificacion}
          minimoCaracteres={minimoCaracteres}
          onChange={setJustificacion}
        />

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={loading || justificacion.length < minimoCaracteres}
            className={`flex-1 text-white py-2 px-4 rounded disabled:opacity-50 ${colorBoton}`}
          >
            {loading ? 'Procesando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
```

### 5.2 Uso del Modal de Justificación

```typescript
// src/app/admin/evaluaciones/page.tsx

import { ModalJustificacion } from '@/lib/componentes/admin/ModalJustificacion';
import { createClient } from '@/lib/supabase/client';

export default function GestionEvaluaciones() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [evaluacionSeleccionada, setEvaluacionSeleccionada] = useState<string | null>(null);

  const handleEliminarEvaluacion = async (justificacion: string) => {
    if (!evaluacionSeleccionada) return;

    const supabase = createClient();
    const { error } = await supabase.rpc('admin_eliminar_evaluacion', {
      p_evaluacion_id: evaluacionSeleccionada,
      p_justificacion: justificacion
    });

    if (error) throw error;

    toast.success('Evaluación eliminada correctamente');
    // Recargar lista
  };

  return (
    <>
      {/* ... lista de evaluaciones ... */}

      <ModalJustificacion
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onConfirmar={handleEliminarEvaluacion}
        titulo="Eliminar Evaluación"
        descripcion="Proporciona una justificación detallada para eliminar esta evaluación."
        minimoCaracteres={30}
        tipoOperacion="eliminar"
      />
    </>
  );
}
```

---

## 6. Checklist de Implementación

Antes de desplegar a producción, verifica:

- [ ] Todas las funciones RPC están probadas en desarrollo
- [ ] Los mensajes de error son claros y en español
- [ ] Los campos de justificación tienen validación tanto en frontend como backend
- [ ] Los modales de confirmación muestran advertencias apropiadas para operaciones destructivas
- [ ] Los logs de auditoría se están generando correctamente (verificar en `AuditLogAdmin`)
- [ ] Los usuarios reciben feedback visual cuando las operaciones tienen éxito o fallan
- [ ] Las longitudes mínimas de justificación están documentadas en la UI
- [ ] Se implementó manejo de errores para ventanas de justificación expiradas
- [ ] Los componentes son accesibles (WCAG 2.1 AA)
- [ ] Se agregaron tests E2E para flujos críticos de eliminación

---

## 7. FAQ

**P: ¿Qué pasa si mi ventana de justificación expira mientras completo el formulario?**

R: Deberás enviar el formulario nuevamente. La justificación se registrará automáticamente al hacer clic en "Confirmar", y luego se ejecutará la operación. Si tarda más de 10 minutos (UPDATE) o 5 minutos (DELETE), deberás reintentar.

**P: ¿Puedo reutilizar la misma justificación para múltiples operaciones?**

R: No es recomendable. Cada operación debe tener su propia justificación específica que explique exactamente por qué se está realizando esa acción en particular.

**P: ¿Cómo puedo ver el historial de cambios que he realizado?**

R: Los logs están en la tabla `AuditLogAdmin`. Se puede crear una página de auditoría para que cada admin vea su propio historial.

**P: ¿Por qué no puedo eliminar usuarios, solo desactivarlos?**

R: Por política de seguridad y compliance HIPAA/GDPR. Los datos de usuarios deben conservarse para auditoría. La desactivación (soft delete) permite recuperar la cuenta si es necesario y mantiene integridad referencial.

**P: ¿Qué pasa si intento eliminar una evaluación que tiene referencias en otras tablas?**

R: Dependiendo de las constraints de foreign key, la operación puede fallar. Deberás verificar y eliminar las referencias primero, o usar CASCADE si está configurado.

---

**FIN DE LA GUÍA**

*Para consultas técnicas: dev@escuchodromo.com*
*Para reportes de seguridad: security@escuchodromo.com*
