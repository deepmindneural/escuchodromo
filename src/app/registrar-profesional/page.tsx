'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUser, FaEnvelope, FaLock, FaGraduationCap, FaIdCard,
  FaUniversity, FaBriefcase, FaFileUpload, FaCheckCircle,
  FaTimesCircle, FaHeart, FaArrowRight, FaArrowLeft,
  FaLanguage, FaDollarSign, FaFileAlt
} from 'react-icons/fa';
import { toast, Toaster } from 'react-hot-toast';
import Navegacion from '../../lib/componentes/layout/Navegacion';

interface FormularioProfesional {
  // Datos de usuario
  nombre: string;
  email: string;
  contrasena: string;
  confirmarContrasena: string;

  // Datos profesionales
  tituloProfesional: string;
  numeroLicencia: string;
  universidad: string;
  anosExperiencia: number;
  especialidades: string[];
  biografia: string;
  idiomas: string[];

  // Tarifa
  tarifaPorSesion: number;
  moneda: string;

  // Documentos
  documentos: Array<{
    tipo: string;
    archivo: File | null;
    nombre: string;
  }>;

  // Términos
  aceptaTerminos: boolean;
}

const ESPECIALIDADES_DISPONIBLES = [
  'Ansiedad',
  'Depresión',
  'Estrés',
  'Terapia de Pareja',
  'Terapia Familiar',
  'Terapia Cognitivo-Conductual',
  'Psicoanálisis',
  'Trastornos Alimenticios',
  'Adicciones',
  'Trauma',
  'Duelo',
  'Autoestima',
  'Mindfulness',
  'Neuropsicología'
];

const IDIOMAS_DISPONIBLES = ['Español', 'Inglés', 'Francés', 'Portugués', 'Alemán'];

export default function PaginaRegistrarProfesional() {
  const router = useRouter();
  const [paso, setPaso] = useState(1);
  const [cargando, setCargando] = useState(false);

  const [formData, setFormData] = useState<FormularioProfesional>({
    nombre: '',
    email: '',
    contrasena: '',
    confirmarContrasena: '',
    tituloProfesional: '',
    numeroLicencia: '',
    universidad: '',
    anosExperiencia: 0,
    especialidades: [],
    biografia: '',
    idiomas: ['Español'],
    tarifaPorSesion: 0,
    moneda: 'COP',
    documentos: [
      { tipo: 'titulo', archivo: null, nombre: 'Título Profesional' },
      { tipo: 'licencia', archivo: null, nombre: 'Licencia Profesional' },
      { tipo: 'cedula', archivo: null, nombre: 'Cédula de Identidad' },
    ],
    aceptaTerminos: false,
  });

  const [errores, setErrores] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));

    if (errores[name]) {
      setErrores(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleEspecialidadToggle = (especialidad: string) => {
    setFormData(prev => ({
      ...prev,
      especialidades: prev.especialidades.includes(especialidad)
        ? prev.especialidades.filter(e => e !== especialidad)
        : [...prev.especialidades, especialidad]
    }));
  };

  const handleIdiomaToggle = (idioma: string) => {
    setFormData(prev => ({
      ...prev,
      idiomas: prev.idiomas.includes(idioma)
        ? prev.idiomas.filter(i => i !== idioma)
        : [...prev.idiomas, idioma]
    }));
  };

  const handleFileChange = (index: number, file: File | null) => {
    setFormData(prev => ({
      ...prev,
      documentos: prev.documentos.map((doc, i) =>
        i === index ? { ...doc, archivo: file } : doc
      )
    }));
  };

  const validarPaso = (pasoActual: number): boolean => {
    const nuevosErrores: Record<string, string> = {};

    if (pasoActual === 1) {
      if (!formData.nombre.trim()) nuevosErrores.nombre = 'El nombre es requerido';
      if (!formData.email.trim()) {
        nuevosErrores.email = 'El email es requerido';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        nuevosErrores.email = 'Email inválido';
      }
      if (!formData.contrasena) {
        nuevosErrores.contrasena = 'La contraseña es requerida';
      } else if (formData.contrasena.length < 6) {
        nuevosErrores.contrasena = 'La contraseña debe tener al menos 6 caracteres';
      }
      if (formData.contrasena !== formData.confirmarContrasena) {
        nuevosErrores.confirmarContrasena = 'Las contraseñas no coinciden';
      }
    }

    if (pasoActual === 2) {
      if (!formData.tituloProfesional.trim()) nuevosErrores.tituloProfesional = 'El título profesional es requerido';
      if (!formData.numeroLicencia.trim()) nuevosErrores.numeroLicencia = 'El número de licencia es requerido';
      if (!formData.universidad.trim()) nuevosErrores.universidad = 'La universidad es requerida';
      if (formData.anosExperiencia < 0) nuevosErrores.anosExperiencia = 'Los años de experiencia deben ser positivos';
      if (formData.especialidades.length === 0) nuevosErrores.especialidades = 'Selecciona al menos una especialidad';
      if (formData.tarifaPorSesion <= 0) nuevosErrores.tarifaPorSesion = 'La tarifa debe ser mayor a 0';
    }

    if (pasoActual === 3) {
      const documentosFaltantes = formData.documentos.filter(doc => !doc.archivo);
      if (documentosFaltantes.length > 0) {
        nuevosErrores.documentos = `Faltan documentos: ${documentosFaltantes.map(d => d.nombre).join(', ')}`;
      }
      if (!formData.aceptaTerminos) {
        nuevosErrores.aceptaTerminos = 'Debes aceptar los términos y condiciones';
      }
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const siguientePaso = () => {
    if (validarPaso(paso)) {
      setPaso(prev => Math.min(prev + 1, 3));
    }
  };

  const anteriorPaso = () => {
    setPaso(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarPaso(3)) return;

    setCargando(true);

    try {
      // TODO: Implementar registro completo con Supabase
      // 1. Crear usuario con rol TERAPEUTA
      // 2. Subir documentos a Supabase Storage
      // 3. Crear registro en PerfilProfesional
      // 4. Crear registros en DocumentoProfesional

      toast.success('¡Registro enviado! Tu perfil será revisado por nuestro equipo en 24-48 horas.');

      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al registrar profesional');
    } finally {
      setCargando(false);
    }
  };

  const renderPaso1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Información Personal</h3>
        <p className="text-gray-600">Comencemos con tus datos básicos</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nombre completo *
        </label>
        <div className="relative">
          <FaUser className="absolute left-3 top-3 text-gray-400" />
          <input
            name="nombre"
            type="text"
            value={formData.nombre}
            onChange={handleChange}
            className={`pl-10 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errores.nombre ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Dr. Juan Pérez"
          />
        </div>
        {errores.nombre && <p className="mt-1 text-sm text-red-600">{errores.nombre}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Correo electrónico *
        </label>
        <div className="relative">
          <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className={`pl-10 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errores.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="tu@email.com"
          />
        </div>
        {errores.email && <p className="mt-1 text-sm text-red-600">{errores.email}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contraseña *
        </label>
        <div className="relative">
          <FaLock className="absolute left-3 top-3 text-gray-400" />
          <input
            name="contrasena"
            type="password"
            value={formData.contrasena}
            onChange={handleChange}
            className={`pl-10 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errores.contrasena ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="••••••••"
          />
        </div>
        {errores.contrasena && <p className="mt-1 text-sm text-red-600">{errores.contrasena}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Confirmar contraseña *
        </label>
        <div className="relative">
          <FaLock className="absolute left-3 top-3 text-gray-400" />
          <input
            name="confirmarContrasena"
            type="password"
            value={formData.confirmarContrasena}
            onChange={handleChange}
            className={`pl-10 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errores.confirmarContrasena ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="••••••••"
          />
        </div>
        {errores.confirmarContrasena && <p className="mt-1 text-sm text-red-600">{errores.confirmarContrasena}</p>}
      </div>
    </div>
  );

  const renderPaso2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Información Profesional</h3>
        <p className="text-gray-600">Cuéntanos sobre tu experiencia y especialización</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Título Profesional *
          </label>
          <div className="relative">
            <FaGraduationCap className="absolute left-3 top-3 text-gray-400" />
            <input
              name="tituloProfesional"
              type="text"
              value={formData.tituloProfesional}
              onChange={handleChange}
              className={`pl-10 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errores.tituloProfesional ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Psicólogo Clínico"
            />
          </div>
          {errores.tituloProfesional && <p className="mt-1 text-sm text-red-600">{errores.tituloProfesional}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número de Licencia *
          </label>
          <div className="relative">
            <FaIdCard className="absolute left-3 top-3 text-gray-400" />
            <input
              name="numeroLicencia"
              type="text"
              value={formData.numeroLicencia}
              onChange={handleChange}
              className={`pl-10 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errores.numeroLicencia ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="PSI-2024-12345"
            />
          </div>
          {errores.numeroLicencia && <p className="mt-1 text-sm text-red-600">{errores.numeroLicencia}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Universidad *
          </label>
          <div className="relative">
            <FaUniversity className="absolute left-3 top-3 text-gray-400" />
            <input
              name="universidad"
              type="text"
              value={formData.universidad}
              onChange={handleChange}
              className={`pl-10 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errores.universidad ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Universidad Nacional"
            />
          </div>
          {errores.universidad && <p className="mt-1 text-sm text-red-600">{errores.universidad}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Años de Experiencia *
          </label>
          <div className="relative">
            <FaBriefcase className="absolute left-3 top-3 text-gray-400" />
            <input
              name="anosExperiencia"
              type="number"
              min="0"
              value={formData.anosExperiencia}
              onChange={handleChange}
              className={`pl-10 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errores.anosExperiencia ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="5"
            />
          </div>
          {errores.anosExperiencia && <p className="mt-1 text-sm text-red-600">{errores.anosExperiencia}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Especialidades * (selecciona al menos una)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {ESPECIALIDADES_DISPONIBLES.map((especialidad) => (
            <button
              key={especialidad}
              type="button"
              onClick={() => handleEspecialidadToggle(especialidad)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                formData.especialidades.includes(especialidad)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {especialidad}
            </button>
          ))}
        </div>
        {errores.especialidades && <p className="mt-1 text-sm text-red-600">{errores.especialidades}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Idiomas
        </label>
        <div className="flex flex-wrap gap-2">
          {IDIOMAS_DISPONIBLES.map((idioma) => (
            <button
              key={idioma}
              type="button"
              onClick={() => handleIdiomaToggle(idioma)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                formData.idiomas.includes(idioma)
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FaLanguage className="inline mr-1" />
              {idioma}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tarifa por Sesión *
          </label>
          <div className="relative">
            <FaDollarSign className="absolute left-3 top-3 text-gray-400" />
            <input
              name="tarifaPorSesion"
              type="number"
              min="0"
              step="1000"
              value={formData.tarifaPorSesion}
              onChange={handleChange}
              className={`pl-10 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errores.tarifaPorSesion ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="100000"
            />
          </div>
          {errores.tarifaPorSesion && <p className="mt-1 text-sm text-red-600">{errores.tarifaPorSesion}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Moneda
          </label>
          <select
            name="moneda"
            value={formData.moneda}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="COP">COP (Peso Colombiano)</option>
            <option value="USD">USD (Dólar)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Biografía Profesional (opcional)
        </label>
        <textarea
          name="biografia"
          value={formData.biografia}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Cuéntanos sobre tu enfoque terapéutico, experiencia y áreas de especialización..."
        />
        <p className="mt-1 text-sm text-gray-500">{formData.biografia.length}/500 caracteres</p>
      </div>
    </div>
  );

  const renderPaso3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Documentos de Validación</h3>
        <p className="text-gray-600">Sube tus credenciales para verificación</p>
      </div>

      <div className="space-y-4">
        {formData.documentos.map((doc, index) => (
          <div key={index} className="border border-gray-300 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FaFileAlt className="text-blue-500 text-xl" />
                <div>
                  <h4 className="font-medium text-gray-900">{doc.nombre}</h4>
                  <p className="text-sm text-gray-500">PDF, JPG, PNG (Máx. 10MB)</p>
                </div>
              </div>
              {doc.archivo ? (
                <FaCheckCircle className="text-green-500 text-2xl" />
              ) : (
                <FaTimesCircle className="text-gray-300 text-2xl" />
              )}
            </div>

            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleFileChange(index, e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-600
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                cursor-pointer"
            />

            {doc.archivo && (
              <p className="mt-2 text-sm text-green-600">
                ✓ {doc.archivo.name} ({(doc.archivo.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
        ))}
      </div>

      {errores.documentos && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{errores.documentos}</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Proceso de Verificación</h4>
        <ul className="space-y-1 text-sm text-blue-700">
          <li>• Tus documentos serán revisados por nuestro equipo en 24-48 horas</li>
          <li>• Recibirás un email cuando tu perfil sea aprobado</li>
          <li>• Tus documentos están protegidos y son confidenciales</li>
        </ul>
      </div>

      <div>
        <label className="flex items-start">
          <input
            name="aceptaTerminos"
            type="checkbox"
            checked={formData.aceptaTerminos}
            onChange={handleChange}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
          />
          <span className="ml-3 text-sm text-gray-700">
            Acepto los{' '}
            <Link href="/terminos" className="text-blue-600 hover:text-blue-700 font-medium">
              términos y condiciones
            </Link>{' '}
            y la{' '}
            <Link href="/privacidad" className="text-blue-600 hover:text-blue-700 font-medium">
              política de privacidad
            </Link>.
            También confirmo que mis credenciales profesionales son válidas y están vigentes.
          </span>
        </label>
        {errores.aceptaTerminos && <p className="mt-1 text-sm text-red-600">{errores.aceptaTerminos}</p>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Navegacion />
      <Toaster position="top-center" />

      <div className="pt-28 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaHeart className="text-3xl text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Únete como Profesional
            </h1>
            <p className="text-lg text-gray-600">
              Ayuda a personas a mejorar su bienestar emocional
            </p>
            <div className="mt-4">
              <span className="text-sm text-gray-500">
                ¿Ya tienes cuenta?{' '}
                <Link href="/iniciar-sesion" className="text-blue-600 hover:text-blue-700 font-medium">
                  Inicia sesión aquí
                </Link>
              </span>
            </div>
          </div>

          {/* Indicador de pasos */}
          <div className="mb-8">
            <div className="flex items-center justify-between max-w-md mx-auto">
              {[1, 2, 3].map((num) => (
                <div key={num} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      paso >= num
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {num}
                  </div>
                  {num < 3 && (
                    <div
                      className={`w-20 h-1 mx-2 ${
                        paso > num ? 'bg-blue-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between max-w-md mx-auto mt-2">
              <span className="text-xs text-gray-600">Cuenta</span>
              <span className="text-xs text-gray-600">Profesional</span>
              <span className="text-xs text-gray-600">Documentos</span>
            </div>
          </div>

          {/* Formulario */}
          <motion.div
            key={paso}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                {paso === 1 && renderPaso1()}
                {paso === 2 && renderPaso2()}
                {paso === 3 && renderPaso3()}
              </AnimatePresence>

              {/* Botones */}
              <div className="mt-8 flex items-center justify-between">
                <button
                  type="button"
                  onClick={anteriorPaso}
                  disabled={paso === 1}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium ${
                    paso === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <FaArrowLeft />
                  Anterior
                </button>

                {paso < 3 ? (
                  <button
                    type="button"
                    onClick={siguientePaso}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600"
                  >
                    Siguiente
                    <FaArrowRight />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={cargando}
                    className={`flex items-center gap-2 px-8 py-3 rounded-lg font-medium ${
                      cargando
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:shadow-xl'
                    } text-white`}
                  >
                    {cargando ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <FaCheckCircle />
                        Completar Registro
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </motion.div>

          {/* Info adicional */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Escuchodromo • Tu información está protegida y segura
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
