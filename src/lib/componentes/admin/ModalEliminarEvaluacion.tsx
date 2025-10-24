'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { toast } from 'react-hot-toast';
import { AlertTriangle, Trash2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Evaluacion {
  id: string;
  tipo: string;
  puntaje_total: number;
  severidad: string;
  creado_en: string;
  usuario: {
    id: string;
    nombre: string;
    email: string;
  };
}

interface ModalEliminarEvaluacionProps {
  abierto: boolean;
  onCerrar: () => void;
  onExito: () => void;
  evaluacion: Evaluacion | null;
}

/**
 * ModalEliminarEvaluacion - Modal para eliminar una evaluación
 *
 * Características:
 * - Muestra advertencia de eliminación permanente
 * - Requiere justificación (mínimo 30 caracteres) para compliance
 * - Muestra información de la evaluación a eliminar
 * - Usa RPC admin_eliminar_evaluacion
 */
export function ModalEliminarEvaluacion({
  abierto,
  onCerrar,
  onExito,
  evaluacion,
}: ModalEliminarEvaluacionProps) {
  const [cargando, setCargando] = useState(false);
  const [justificacion, setJustificacion] = useState('');

  const validarJustificacion = (): boolean => {
    if (justificacion.trim().length < 30) {
      toast.error('La justificación debe tener al menos 30 caracteres');
      return false;
    }
    return true;
  };

  const handleEliminar = async () => {
    if (!evaluacion || !validarJustificacion()) {
      return;
    }

    setCargando(true);

    try {
      const response = await fetch('/api/admin/evaluaciones/eliminar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluacionId: evaluacion.id,
          justificacion: justificacion.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar evaluación');
      }

      toast.success('Evaluación eliminada exitosamente');
      setJustificacion('');
      onExito();
      onCerrar();
    } catch (error: any) {
      console.error('Error al eliminar evaluación:', error);
      toast.error(error.message || 'Error al eliminar evaluación');
    } finally {
      setCargando(false);
    }
  };

  const handleCerrar = () => {
    setJustificacion('');
    onCerrar();
  };

  if (!evaluacion) return null;

  return (
    <Modal
      abierto={abierto}
      onCerrar={handleCerrar}
      titulo="Eliminar Evaluación"
      tamano="md"
      cerrarAlClickearFondo={!cargando}
    >
      <div className="space-y-6">
        {/* Advertencia */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                Advertencia: Eliminación Permanente
              </h3>
              <p className="text-sm text-red-700 mb-3">
                Esta acción <strong>no se puede deshacer</strong>. La evaluación y todas sus
                respuestas serán eliminadas permanentemente de la base de datos.
              </p>
              <div className="bg-white rounded-lg p-3 border border-red-200">
                <p className="text-sm text-gray-600 mb-1">Por motivos de compliance y auditoría:</p>
                <ul className="text-xs text-gray-600 list-disc list-inside space-y-1">
                  <li>Debes proporcionar una justificación de al menos 30 caracteres</li>
                  <li>La justificación quedará registrada en los logs del sistema</li>
                  <li>Esta acción es irreversible y afecta datos sensibles de salud</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Información de la evaluación */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-gray-600" />
            Evaluación a Eliminar
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Usuario:</span>
              <span className="text-sm font-medium text-gray-900">
                {evaluacion.usuario.nombre}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Email:</span>
              <span className="text-sm font-medium text-gray-900">
                {evaluacion.usuario.email}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tipo:</span>
              <span className="text-sm font-medium text-gray-900">{evaluacion.tipo}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Puntaje:</span>
              <span className="text-sm font-medium text-gray-900">
                {evaluacion.puntaje_total}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Severidad:</span>
              <span className="text-sm font-medium text-gray-900 capitalize">
                {evaluacion.severidad}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Fecha:</span>
              <span className="text-sm font-medium text-gray-900">
                {format(new Date(evaluacion.creado_en), 'dd MMM yyyy HH:mm', { locale: es })}
              </span>
            </div>
          </div>
        </div>

        {/* Campo de justificación */}
        <div>
          <Label htmlFor="justificacion" className="flex items-center gap-2">
            Justificación <span className="text-red-500">*</span>
            {justificacion.length < 30 && (
              <span className="text-xs text-orange-600 font-normal">
                (mínimo 30 caracteres)
              </span>
            )}
          </Label>
          <Textarea
            id="justificacion"
            value={justificacion}
            onChange={(e) => setJustificacion(e.target.value)}
            disabled={cargando}
            placeholder="Explica detalladamente por qué es necesario eliminar esta evaluación. Ejemplo: Evaluación duplicada por error del sistema, paciente solicitó eliminación de datos, datos ingresados incorrectamente..."
            className="mt-2 min-h-[120px]"
            required
          />
          <div className="flex items-center gap-2 mt-2">
            {justificacion.length > 0 && justificacion.length < 30 && (
              <AlertCircle className="w-4 h-4 text-orange-500" />
            )}
            <p
              className={`text-xs ${
                justificacion.length >= 30 ? 'text-green-600' : 'text-gray-500'
              }`}
            >
              {justificacion.length} / 30 caracteres mínimos
            </p>
          </div>
        </div>

        {/* Confirmación adicional */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900 mb-1">
                ¿Estás completamente seguro?
              </p>
              <p className="text-xs text-yellow-700">
                Una vez eliminada, no podrás recuperar esta evaluación ni sus respuestas. Si
                tienes dudas, considera contactar al responsable del área antes de proceder.
              </p>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleCerrar} disabled={cargando}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleEliminar}
            disabled={cargando || justificacion.trim().length < 30}
            className="bg-red-600 hover:bg-red-700"
          >
            {cargando ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar Permanentemente
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
