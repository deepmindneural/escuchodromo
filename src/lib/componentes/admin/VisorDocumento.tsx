'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import {
  FileText,
  Download,
  CheckCircle,
  XCircle,
  ExternalLink,
  File,
  Image as ImageIcon
} from 'lucide-react';

interface Documento {
  id: string;
  tipo: string;
  nombre: string;
  descripcion: string;
  url_archivo: string;
  nombre_archivo: string;
  verificado: boolean;
  verificado_por: string | null;
  verificado_en: string | null;
  notas_verificacion: string;
  creado_en: string;
}

interface VisorDocumentoProps {
  documento: Documento;
  onVerificar: (verificado: boolean) => void;
}

const tiposDocumento: Record<string, { nombre: string; icono: any }> = {
  licencia: { nombre: 'Licencia Profesional', icono: FileText },
  titulo: { nombre: 'Título Universitario', icono: FileText },
  cedula: { nombre: 'Cédula de Identidad', icono: FileText },
  certificado: { nombre: 'Certificado', icono: FileText },
  otro: { nombre: 'Otro Documento', icono: File }
};

export default function VisorDocumento({ documento, onVerificar }: VisorDocumentoProps) {
  const [cargando, setCargando] = useState(false);
  const [vistaPrevia, setVistaPrevia] = useState(true);

  const tipoInfo = tiposDocumento[documento.tipo] || tiposDocumento.otro;
  const IconoTipo = tipoInfo.icono;

  // Determinar si es imagen o PDF
  const esImagen = documento.url_archivo?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const esPDF = documento.url_archivo?.match(/\.pdf$/i);

  const handleDescargar = () => {
    window.open(documento.url_archivo, '_blank');
  };

  const handleVerificar = async (verificado: boolean) => {
    setCargando(true);
    try {
      await onVerificar(verificado);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${
            documento.verificado ? 'bg-green-100' : 'bg-gray-100'
          }`}>
            <IconoTipo className={`h-6 w-6 ${
              documento.verificado ? 'text-green-600' : 'text-gray-600'
            }`} />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{tipoInfo.nombre}</h4>
            <p className="text-sm text-gray-600 mt-1">{documento.nombre}</p>
            {documento.descripcion && (
              <p className="text-sm text-gray-500 mt-1">{documento.descripcion}</p>
            )}
          </div>
        </div>

        {/* Estado de verificación */}
        <div>
          {documento.verificado ? (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Verificado</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-yellow-600">
              <XCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Pendiente</span>
            </div>
          )}
        </div>
      </div>

      {/* Vista previa del documento */}
      {vistaPrevia && (
        <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
          {esImagen ? (
            <div className="relative bg-gray-50 flex items-center justify-center p-4">
              <img
                src={documento.url_archivo}
                alt={documento.nombre}
                className="max-w-full max-h-96 object-contain rounded"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  setVistaPrevia(false);
                }}
              />
            </div>
          ) : esPDF ? (
            <div className="relative bg-gray-50" style={{ height: '500px' }}>
              <iframe
                src={documento.url_archivo}
                className="w-full h-full"
                title={documento.nombre}
                onError={() => setVistaPrevia(false)}
              />
            </div>
          ) : (
            <div className="bg-gray-50 p-8 text-center">
              <File className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Vista previa no disponible para este tipo de archivo
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={handleDescargar}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir en nueva pestaña
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Información adicional */}
      <div className="space-y-2 mb-4 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Archivo:</span>
          <span className="font-medium text-gray-900">{documento.nombre_archivo}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Subido el:</span>
          <span className="font-medium text-gray-900">
            {new Date(documento.creado_en).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
        </div>
        {documento.verificado && documento.verificado_en && (
          <div className="flex justify-between text-gray-600">
            <span>Verificado el:</span>
            <span className="font-medium text-green-700">
              {new Date(documento.verificado_en).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        )}
      </div>

      {/* Notas de verificación */}
      {documento.notas_verificacion && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Nota:</strong> {documento.notas_verificacion}
          </p>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={handleDescargar}
        >
          <Download className="h-4 w-4 mr-2" />
          Descargar
        </Button>

        {documento.verificado ? (
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => handleVerificar(false)}
            disabled={cargando}
          >
            <XCircle className="h-4 w-4 mr-2" />
            {cargando ? 'Procesando...' : 'Remover Verificación'}
          </Button>
        ) : (
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={() => handleVerificar(true)}
            disabled={cargando}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {cargando ? 'Verificando...' : 'Verificar'}
          </Button>
        )}
      </div>
    </div>
  );
}
