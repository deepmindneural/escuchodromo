'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '../ui/button';
import { X, CheckCircle, Send } from 'lucide-react';

interface ModalAprobarProps {
  abierto: boolean;
  onCerrar: () => void;
  onAprobar: (notas: string, enviarEmail: boolean) => void;
  nombreProfesional: string;
}

export default function ModalAprobar({
  abierto,
  onCerrar,
  onAprobar,
  nombreProfesional
}: ModalAprobarProps) {
  const [notas, setNotas] = useState('');
  const [enviarEmail, setEnviarEmail] = useState(true);
  const [procesando, setProcesando] = useState(false);

  const handleAprobar = async () => {
    setProcesando(true);
    try {
      await onAprobar(notas, enviarEmail);
      // Resetear estado
      setNotas('');
      setEnviarEmail(true);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <Dialog.Root open={abierto} onOpenChange={onCerrar}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-full max-w-md z-50"
          aria-describedby="modal-description"
        >
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-xl font-semibold text-gray-900">
              Aprobar Profesional
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description id="modal-description" className="text-gray-600 mb-6">
            Estás a punto de aprobar el perfil de <strong>{nombreProfesional}</strong>.
            Esta acción cambiará su rol a TERAPEUTA y le permitirá comenzar a atender pacientes.
          </Dialog.Description>

          <div className="space-y-4">
            {/* Campo de notas */}
            <div>
              <label
                htmlFor="notas-aprobacion"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Notas de aprobación (opcional)
              </label>
              <textarea
                id="notas-aprobacion"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={4}
                placeholder="Escribe cualquier nota o comentario sobre esta aprobación..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
              />
            </div>

            {/* Checkbox para enviar email */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="enviar-email"
                className="mt-1 h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                checked={enviarEmail}
                onChange={(e) => setEnviarEmail(e.target.checked)}
              />
              <label htmlFor="enviar-email" className="text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  <span className="font-medium">Enviar email de notificación</span>
                </div>
                <p className="text-gray-600 mt-1">
                  El profesional recibirá un correo informándole que su perfil ha sido aprobado
                </p>
              </label>
            </div>

            {/* Advertencia */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Al aprobar, todos los documentos serán marcados como verificados
                y el usuario podrá acceder a las funcionalidades de terapeuta.
              </p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onCerrar}
              disabled={procesando}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              className="flex-1"
              onClick={handleAprobar}
              disabled={procesando}
            >
              {procesando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Aprobando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar Aprobación
                </>
              )}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
