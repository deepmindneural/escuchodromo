'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  GraduationCap,
  FileText,
  DollarSign,
  Languages,
  Save,
  Loader2,
  Star,
  Users,
  Calendar,
} from 'lucide-react';
import { Button } from '@/lib/componentes/ui/button';
import { obtenerClienteNavegador } from '@/lib/supabase/cliente';
import {
  obtenerPerfilProfesional,
  actualizarPerfilProfesional,
  type PerfilProfesionalCompleto,
  type ActualizarPerfilProfesionalInput,
} from '@/lib/supabase/queries/profesional';
import toast from 'react-hot-toast';

const ESPECIALIDADES_DISPONIBLES = [
  'Psicología Clínica',
  'Terapia Cognitivo-Conductual',
  'Psicoterapia',
  'Ansiedad',
  'Depresión',
  'Estrés',
  'Trauma',
  'Relaciones',
  'Autoestima',
  'Duelo',
  'Adicciones',
  'Trastornos Alimentarios',
];

const IDIOMAS_DISPONIBLES = [
  'Español',
  'Inglés',
  'Francés',
  'Portugués',
  'Italiano',
  'Alemán',
];

/**
 * Página de Perfil Profesional
 *
 * Permite al profesional editar su información personal, especialidades,
 * biografía, tarifa y otros datos del perfil.
 */
export default function PerfilProfesional() {
  const router = useRouter();
  const supabase = obtenerClienteNavegador();

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<PerfilProfesionalCompleto | null>(null);

  // Estados del formulario
  const [tituloProfesional, setTituloProfesional] = useState('');
  const [numeroLicencia, setNumeroLicencia] = useState('');
  const [universidad, setUniversidad] = useState('');
  const [anosExperiencia, setAnosExperiencia] = useState<number>(0);
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [biografia, setBiografia] = useState('');
  const [idiomas, setIdiomas] = useState<string[]>([]);
  const [tarifaPorSesion, setTarifaPorSesion] = useState<number>(0);
  const [moneda, setMoneda] = useState<'COP' | 'USD'>('COP');

  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/iniciar-sesion');
        return;
      }

      // Obtener usuario_id desde auth_id
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('Usuario')
        .select('id, rol')
        .eq('auth_id', session.user.id)
        .single();

      if (usuarioError || !usuarioData) {
        toast.error('Error al cargar datos del usuario');
        return;
      }

      if (usuarioData.rol !== 'TERAPEUTA' && usuarioData.rol !== 'ADMIN') {
        router.push('/dashboard');
        return;
      }

      setUsuarioId(usuarioData.id);

      // Obtener perfil profesional
      const { data: perfilData, error: perfilError } =
        await obtenerPerfilProfesional(usuarioData.id);

      if (perfilError || !perfilData) {
        toast.error('Error al cargar perfil profesional');
        return;
      }

      setPerfil(perfilData);
      // Cargar datos en el formulario
      setTituloProfesional(perfilData.titulo_profesional || '');
      setNumeroLicencia(perfilData.numero_licencia || '');
      setUniversidad(perfilData.universidad || '');
      setAnosExperiencia(perfilData.anos_experiencia || 0);
      setEspecialidades(perfilData.especialidades || []);
      setBiografia(perfilData.biografia || '');
      setIdiomas(perfilData.idiomas || []);
      setTarifaPorSesion(perfilData.tarifa_por_sesion || 0);
      setMoneda(perfilData.moneda || 'COP');
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      toast.error('Error al cargar perfil');
    } finally {
      setCargando(false);
    }
  };

  const toggleEspecialidad = (especialidad: string) => {
    if (especialidades.includes(especialidad)) {
      setEspecialidades(especialidades.filter((e) => e !== especialidad));
    } else {
      setEspecialidades([...especialidades, especialidad]);
    }
  };

  const toggleIdioma = (idioma: string) => {
    if (idiomas.includes(idioma)) {
      setIdiomas(idiomas.filter((i) => i !== idioma));
    } else {
      setIdiomas([...idiomas, idioma]);
    }
  };

  const handleGuardar = async () => {
    if (!usuarioId) {
      toast.error('Error: Usuario no identificado');
      return;
    }

    // Validaciones
    if (!tituloProfesional.trim()) {
      toast.error('El título profesional es obligatorio');
      return;
    }

    if (especialidades.length === 0) {
      toast.error('Selecciona al menos una especialidad');
      return;
    }

    if (tarifaPorSesion <= 0) {
      toast.error('La tarifa debe ser mayor a 0');
      return;
    }

    setGuardando(true);

    try {
      const datosActualizados: ActualizarPerfilProfesionalInput = {
        titulo_profesional: tituloProfesional,
        numero_licencia: numeroLicencia || null,
        universidad: universidad || null,
        anos_experiencia: anosExperiencia,
        especialidades,
        biografia: biografia || null,
        idiomas,
        tarifa_por_sesion: tarifaPorSesion,
        moneda,
      };

      const { data, error } = await actualizarPerfilProfesional(
        usuarioId,
        datosActualizados
      );

      if (error) {
        toast.error('Error al actualizar perfil');
        return;
      }

      setPerfil(data);
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error('Error al guardar cambios');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-calma-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700">No se pudo cargar el perfil profesional</p>
          <Button onClick={() => router.back()} className="mt-4">
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Perfil Profesional</h1>
        <p className="text-gray-600">
          Actualiza tu información profesional y mantén tu perfil al día
        </p>
      </div>

      {/* Estadísticas del Perfil */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-calma-50 rounded-lg">
              <Users className="h-6 w-6 text-calma-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Pacientes</p>
              <p className="text-2xl font-bold text-gray-900">{perfil.total_pacientes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Citas</p>
              <p className="text-2xl font-bold text-gray-900">{perfil.total_citas}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 rounded-lg">
              <Star className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Calificación</p>
              <p className="text-2xl font-bold text-gray-900">
                {perfil.calificacion_promedio?.toFixed(1) || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="space-y-6">
        {/* Información Personal */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-calma-50 rounded-lg">
              <User className="h-5 w-5 text-calma-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Información Personal</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título Profesional <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={tituloProfesional}
                onChange={(e) => setTituloProfesional(e.target.value)}
                placeholder="Ej: Psicólogo Clínico"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-calma-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Licencia
              </label>
              <input
                type="text"
                value={numeroLicencia}
                onChange={(e) => setNumeroLicencia(e.target.value)}
                placeholder="Ej: PSI-12345"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-calma-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Universidad
              </label>
              <input
                type="text"
                value={universidad}
                onChange={(e) => setUniversidad(e.target.value)}
                placeholder="Ej: Universidad Nacional"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-calma-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Años de Experiencia
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={anosExperiencia}
                onChange={(e) => setAnosExperiencia(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-calma-500 focus:border-transparent"
              />
            </div>
          </div>
        </section>

        {/* Especialidades */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-50 rounded-lg">
              <GraduationCap className="h-5 w-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Especialidades <span className="text-red-500">*</span>
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {ESPECIALIDADES_DISPONIBLES.map((esp) => (
              <button
                key={esp}
                type="button"
                onClick={() => toggleEspecialidad(esp)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  especialidades.includes(esp)
                    ? 'bg-calma-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {esp}
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Seleccionadas: {especialidades.length}
          </p>
        </section>

        {/* Biografía */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Biografía</h2>
          </div>

          <textarea
            value={biografia}
            onChange={(e) => setBiografia(e.target.value)}
            placeholder="Cuéntanos sobre tu experiencia, enfoque terapéutico y qué te apasiona de tu trabajo..."
            rows={6}
            maxLength={1000}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-calma-500 focus:border-transparent resize-none"
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500">
              Máximo 1000 caracteres
            </p>
            <p className="text-xs text-gray-500">
              {biografia.length}/1000
            </p>
          </div>
        </section>

        {/* Idiomas */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-50 rounded-lg">
              <Languages className="h-5 w-5 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Idiomas</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {IDIOMAS_DISPONIBLES.map((idioma) => (
              <button
                key={idioma}
                type="button"
                onClick={() => toggleIdioma(idioma)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  idiomas.includes(idioma)
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {idioma}
              </button>
            ))}
          </div>
        </section>

        {/* Tarifa */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Tarifa por Sesión <span className="text-red-500">*</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={tarifaPorSesion}
                onChange={(e) => setTarifaPorSesion(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-calma-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Moneda
              </label>
              <select
                value={moneda}
                onChange={(e) => setMoneda(e.target.value as 'COP' | 'USD')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-calma-500 focus:border-transparent"
              >
                <option value="COP">COP (Pesos Colombianos)</option>
                <option value="USD">USD (Dólares)</option>
              </select>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Tarifa actual:</span>{' '}
              {tarifaPorSesion.toLocaleString()} {moneda}
            </p>
          </div>
        </section>

        {/* Botones de acción */}
        <div className="flex gap-4 justify-end">
          <Button
            variant="outline"
            onClick={() => router.push('/profesional/dashboard')}
            disabled={guardando}
          >
            Cancelar
          </Button>
          <Button onClick={handleGuardar} disabled={guardando}>
            {guardando ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
