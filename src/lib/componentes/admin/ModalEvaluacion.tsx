'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/modal';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { toast } from 'react-hot-toast';
import { Search, FileText, User, AlertCircle } from 'lucide-react';

interface Evaluacion {
  id: string;
  tipo: string;
  puntaje_total: number;
  severidad: string;
  respuestas: any;
  creado_en: string;
  usuario: {
    id: string;
    nombre: string;
    email: string;
  };
}

interface ModalEvaluacionProps {
  abierto: boolean;
  onCerrar: () => void;
  onExito: () => void;
  evaluacion?: Evaluacion | null; // Si se proporciona, es edición
}

interface FormularioDatos {
  usuarioId: string;
  usuarioNombre: string;
  tipo: string;
  respuestas: number[];
  justificacion: string;
}

// Preguntas según tipo
const PREGUNTAS_PHQ9 = [
  'Poco interés o placer en hacer cosas',
  'Sentirse desanimado/a, deprimido/a o sin esperanza',
  'Problemas para quedarse o permanecer dormido/a, o dormir demasiado',
  'Sentirse cansado/a o tener poca energía',
  'Poco apetito o comer en exceso',
  'Sentirse mal con usted mismo/a, o sentir que es un fracaso',
  'Problemas para concentrarse',
  'Moverse o hablar tan lento que otras personas lo notaron',
  'Pensamientos de que estaría mejor muerto/a',
];

const PREGUNTAS_GAD7 = [
  'Sentirse nervioso/a, ansioso/a o con los nervios de punta',
  'No ser capaz de parar o controlar la preocupación',
  'Preocuparse demasiado por diferentes cosas',
  'Dificultad para relajarse',
  'Estar tan inquieto/a que es difícil permanecer sentado/a',
  'Molestarse o irritarse fácilmente',
  'Sentir miedo como si algo terrible fuera a suceder',
];

const OPCIONES_RESPUESTA = [
  { valor: 0, etiqueta: 'Para nada' },
  { valor: 1, etiqueta: 'Varios días' },
  { valor: 2, etiqueta: 'Más de la mitad de los días' },
  { valor: 3, etiqueta: 'Casi todos los días' },
];

/**
 * ModalEvaluacion - Modal para crear o editar evaluaciones
 *
 * Para crear:
 * - Seleccionar usuario
 * - Seleccionar tipo (PHQ-9, GAD-7)
 * - Responder preguntas
 *
 * Para editar:
 * - Solo permite modificar severidad/notas
 * - Requiere justificación (min 20 chars)
 */
export function ModalEvaluacion({
  abierto,
  onCerrar,
  onExito,
  evaluacion,
}: ModalEvaluacionProps) {
  const esEdicion = !!evaluacion;
  const [cargando, setCargando] = useState(false);
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [usuariosSugeridos, setUsuariosSugeridos] = useState<any[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  const [formulario, setFormulario] = useState<FormularioDatos>({
    usuarioId: '',
    usuarioNombre: '',
    tipo: 'PHQ-9',
    respuestas: Array(9).fill(0),
    justificacion: '',
  });

  // Inicializar formulario
  useEffect(() => {
    if (evaluacion) {
      // Modo edición
      let respuestasArray = [];
      try {
        if (typeof evaluacion.respuestas === 'string') {
          respuestasArray = JSON.parse(evaluacion.respuestas);
        } else if (Array.isArray(evaluacion.respuestas)) {
          respuestasArray = evaluacion.respuestas;
        }
      } catch (error) {
        respuestasArray = [];
      }

      setFormulario({
        usuarioId: evaluacion.usuario.id,
        usuarioNombre: evaluacion.usuario.nombre,
        tipo: evaluacion.tipo,
        respuestas: respuestasArray,
        justificacion: '',
      });
    } else {
      // Modo creación
      setFormulario({
        usuarioId: '',
        usuarioNombre: '',
        tipo: 'PHQ-9',
        respuestas: Array(9).fill(0),
        justificacion: '',
      });
    }
  }, [evaluacion, abierto]);

  // Buscar usuarios
  useEffect(() => {
    if (!esEdicion && busquedaUsuario.length >= 2) {
      buscarUsuarios();
    } else {
      setUsuariosSugeridos([]);
      setMostrarSugerencias(false);
    }
  }, [busquedaUsuario, esEdicion]);

  const buscarUsuarios = async () => {
    try {
      const response = await fetch(
        `/api/admin/usuarios/buscar?q=${encodeURIComponent(busquedaUsuario)}`
      );
      const data = await response.json();

      if (response.ok) {
        setUsuariosSugeridos(data.usuarios || []);
        setMostrarSugerencias(true);
      }
    } catch (error) {
      console.error('Error al buscar usuarios:', error);
    }
  };

  const seleccionarUsuario = (usuario: any) => {
    setFormulario((prev) => ({
      ...prev,
      usuarioId: usuario.id,
      usuarioNombre: usuario.nombre || usuario.email,
    }));
    setBusquedaUsuario(usuario.nombre || usuario.email);
    setMostrarSugerencias(false);
  };

  const handleCambioTipo = (nuevoTipo: string) => {
    const numPreguntas = nuevoTipo === 'PHQ-9' ? 9 : 7;
    setFormulario((prev) => ({
      ...prev,
      tipo: nuevoTipo,
      respuestas: Array(numPreguntas).fill(0),
    }));
  };

  const handleCambioRespuesta = (index: number, valor: number) => {
    setFormulario((prev) => {
      const nuevasRespuestas = [...prev.respuestas];
      nuevasRespuestas[index] = valor;
      return {
        ...prev,
        respuestas: nuevasRespuestas,
      };
    });
  };

  const calcularPuntaje = () => {
    return formulario.respuestas.reduce((sum, val) => sum + val, 0);
  };

  const calcularSeveridad = (puntaje: number, tipo: string) => {
    if (tipo === 'PHQ-9') {
      if (puntaje <= 4) return 'sin sintomas';
      if (puntaje <= 9) return 'leve';
      if (puntaje <= 14) return 'moderada';
      if (puntaje <= 19) return 'moderadamente severa';
      return 'severa';
    } else {
      // GAD-7
      if (puntaje <= 4) return 'sin sintomas';
      if (puntaje <= 9) return 'leve';
      if (puntaje <= 14) return 'moderada';
      return 'severa';
    }
  };

  const validarFormulario = (): boolean => {
    if (!esEdicion && !formulario.usuarioId) {
      toast.error('Debes seleccionar un usuario');
      return false;
    }

    if (esEdicion && formulario.justificacion.trim().length < 20) {
      toast.error('La justificación debe tener al menos 20 caracteres');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    setCargando(true);

    try {
      if (esEdicion) {
        // Editar evaluación
        const puntaje = calcularPuntaje();
        const severidad = calcularSeveridad(puntaje, formulario.tipo);

        const response = await fetch('/api/admin/evaluaciones/editar', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            evaluacionId: evaluacion!.id,
            respuestas: formulario.respuestas,
            puntaje_total: puntaje,
            severidad,
            justificacion: formulario.justificacion,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error al actualizar evaluación');
        }

        toast.success('Evaluación actualizada exitosamente');
        onExito();
        onCerrar();
      } else {
        // Crear evaluación
        const puntaje = calcularPuntaje();
        const severidad = calcularSeveridad(puntaje, formulario.tipo);

        const response = await fetch('/api/admin/evaluaciones/crear', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            usuarioId: formulario.usuarioId,
            tipo: formulario.tipo,
            respuestas: formulario.respuestas,
            puntaje_total: puntaje,
            severidad,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error al crear evaluación');
        }

        toast.success('Evaluación creada exitosamente');
        onExito();
        onCerrar();
      }
    } catch (error: any) {
      console.error('Error al guardar evaluación:', error);
      toast.error(error.message || 'Error al guardar evaluación');
    } finally {
      setCargando(false);
    }
  };

  const preguntas = formulario.tipo === 'PHQ-9' ? PREGUNTAS_PHQ9 : PREGUNTAS_GAD7;
  const puntajeActual = calcularPuntaje();
  const puntajeMaximo = formulario.tipo === 'PHQ-9' ? 27 : 21;

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={esEdicion ? 'Editar Evaluación' : 'Crear Nueva Evaluación'}
      tamano="xl"
      cerrarAlClickearFondo={!cargando}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selección de usuario (solo en creación) */}
        {!esEdicion && (
          <div>
            <Label htmlFor="usuario">
              Usuario <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="usuario"
                type="text"
                value={busquedaUsuario}
                onChange={(e) => setBusquedaUsuario(e.target.value)}
                disabled={cargando}
                placeholder="Buscar usuario por nombre o email..."
                className="pl-10"
              />
              {mostrarSugerencias && usuariosSugeridos.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {usuariosSugeridos.map((usuario) => (
                    <button
                      key={usuario.id}
                      type="button"
                      onClick={() => seleccionarUsuario(usuario)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                    >
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-medium text-sm">{usuario.nombre || 'Sin nombre'}</p>
                        <p className="text-xs text-gray-500">{usuario.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Usuario seleccionado (en edición) */}
        {esEdicion && (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-600" />
              <div>
                <p className="text-sm font-medium">{evaluacion.usuario.nombre}</p>
                <p className="text-xs text-gray-500">{evaluacion.usuario.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tipo de evaluación */}
        <div>
          <Label htmlFor="tipo">
            Tipo de Evaluación <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formulario.tipo}
            onValueChange={handleCambioTipo}
            disabled={cargando || esEdicion}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PHQ-9">PHQ-9 (Depresión)</SelectItem>
              <SelectItem value="GAD-7">GAD-7 (Ansiedad)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Puntaje actual */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Puntaje Total</span>
            <span className="text-2xl font-bold text-gray-900">
              {puntajeActual} <span className="text-sm text-gray-500">/ {puntajeMaximo}</span>
            </span>
          </div>
          <div className="mt-2">
            <span className="text-xs text-gray-600">
              Severidad: <strong>{calcularSeveridad(puntajeActual, formulario.tipo)}</strong>
            </span>
          </div>
        </div>

        {/* Preguntas */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-600" />
            Preguntas
          </h3>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {preguntas.map((pregunta, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-semibold text-teal-700">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 mb-3">{pregunta}</p>
                    <Select
                      value={formulario.respuestas[index]?.toString() || '0'}
                      onValueChange={(value) => handleCambioRespuesta(index, parseInt(value))}
                      disabled={cargando}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPCIONES_RESPUESTA.map((opcion) => (
                          <SelectItem key={opcion.valor} value={opcion.valor.toString()}>
                            {opcion.etiqueta} ({opcion.valor} {opcion.valor === 1 ? 'punto' : 'puntos'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Justificación (solo en edición) */}
        {esEdicion && (
          <div>
            <Label htmlFor="justificacion">
              Justificación del Cambio <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="justificacion"
              value={formulario.justificacion}
              onChange={(e) =>
                setFormulario((prev) => ({ ...prev, justificacion: e.target.value }))
              }
              disabled={cargando}
              placeholder="Explica por qué estás modificando esta evaluación (mínimo 20 caracteres)..."
              className="mt-1 min-h-[100px]"
              required
            />
            <div className="flex items-center gap-2 mt-1">
              {formulario.justificacion.length < 20 && (
                <AlertCircle className="w-4 h-4 text-orange-500" />
              )}
              <p className="text-xs text-gray-500">
                {formulario.justificacion.length} / 20 caracteres mínimos
              </p>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCerrar} disabled={cargando}>
            Cancelar
          </Button>
          <Button type="submit" disabled={cargando}>
            {cargando ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {esEdicion ? 'Guardando...' : 'Creando...'}
              </>
            ) : esEdicion ? (
              'Guardar Cambios'
            ) : (
              'Crear Evaluación'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
