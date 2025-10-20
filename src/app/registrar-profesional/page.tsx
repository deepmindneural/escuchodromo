'use client';

import { useState, useId } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  FaUser, FaEnvelope, FaLock, FaGraduationCap, FaIdCard,
  FaUniversity, FaBriefcase, FaFileUpload, FaCheckCircle,
  FaTimesCircle, FaHeart, FaArrowRight, FaArrowLeft,
  FaLanguage, FaDollarSign, FaFileAlt, FaCheck
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
    preview?: string;
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

const PASOS_INFO = [
  { numero: 1, titulo: 'Cuenta', descripcion: 'Información personal' },
  { numero: 2, titulo: 'Profesional', descripcion: 'Credenciales y experiencia' },
  { numero: 3, titulo: 'Documentos', descripcion: 'Verificación y términos' },
];

export default function PaginaRegistrarProfesional() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const formId = useId();

  const [paso, setPaso] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [documentosCargando, setDocumentosCargando] = useState<Record<number, boolean>>({});

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

    if (errores.especialidades) {
      setErrores(prev => ({ ...prev, especialidades: '' }));
    }
  };

  const handleIdiomaToggle = (idioma: string) => {
    setFormData(prev => ({
      ...prev,
      idiomas: prev.idiomas.includes(idioma)
        ? prev.idiomas.filter(i => i !== idioma)
        : [...prev.idiomas, idioma]
    }));
  };

  const handleFileChange = async (index: number, file: File | null) => {
    if (!file) {
      setFormData(prev => ({
        ...prev,
        documentos: prev.documentos.map((doc, i) =>
          i === index ? { ...doc, archivo: null, preview: undefined } : doc
        )
      }));
      return;
    }

    // Validar tamaño (10MB máximo)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('El archivo no debe superar 10MB');
      return;
    }

    // Validar tipo
    const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!tiposPermitidos.includes(file.type)) {
      toast.error('Solo se permiten archivos PDF, JPG o PNG');
      return;
    }

    setDocumentosCargando(prev => ({ ...prev, [index]: true }));

    // Generar preview para imágenes
    let preview: string | undefined;
    if (file.type.startsWith('image/')) {
      preview = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    setFormData(prev => ({
      ...prev,
      documentos: prev.documentos.map((doc, i) =>
        i === index ? { ...doc, archivo: file, preview } : doc
      )
    }));

    setDocumentosCargando(prev => ({ ...prev, [index]: false }));

    if (errores.documentos) {
      setErrores(prev => ({ ...prev, documentos: '' }));
    }

    toast.success(`${file.name} cargado correctamente`);
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast.error('Por favor, completa todos los campos requeridos');
    }
  };

  const anteriorPaso = () => {
    setPaso(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarPaso(3)) return;

    setCargando(true);

    try {
      // Subir documentos
      toast('Subiendo documentos de validación...', { icon: '📄' });

      const documentosParaSubir = formData.documentos
        .filter((doc) => doc.archivo !== null)
        .map((doc) => ({
          archivo: doc.archivo!,
          tipo: doc.tipo as 'licencia' | 'titulo' | 'cedula' | 'certificado',
        }));

      const { subirDocumentosProfesionales, registrarProfesional } = await import(
        '@/lib/utils/registro-profesional'
      );

      const documentosSubidos = await subirDocumentosProfesionales(
        documentosParaSubir,
        formData.email,
        (actual, total) => {
          toast(`Subiendo documento ${actual} de ${total}...`, { icon: '⏳' });
        }
      );

      toast.success('Documentos subidos exitosamente');

      // Registrar profesional
      toast('Creando tu cuenta profesional...', { icon: '👨‍⚕️' });

      const apellido = formData.nombre.split(' ').slice(1).join(' ') || '';
      const nombreSolo = formData.nombre.split(' ')[0];

      const datosRegistro = {
        email: formData.email,
        password: formData.contrasena,
        nombre: nombreSolo,
        apellido: apellido,
        telefono: '',
        titulo_profesional: formData.tituloProfesional,
        numero_licencia: formData.numeroLicencia,
        universidad: formData.universidad,
        anos_experiencia: formData.anosExperiencia,
        especialidades: formData.especialidades,
        idiomas: formData.idiomas,
        tarifa_por_sesion: formData.tarifaPorSesion,
        moneda: formData.moneda as 'COP' | 'USD',
        biografia: formData.biografia,
        documentos: documentosSubidos,
        acepta_terminos: formData.aceptaTerminos,
      };

      const resultado = await registrarProfesional(datosRegistro);

      if (!resultado.success) {
        throw new Error(resultado.error || 'Error al registrar profesional');
      }

      toast.success(
        resultado.mensaje ||
          '¡Registro completado! Tu perfil está en revisión. Te notificaremos cuando sea aprobado.',
        { duration: 5000 }
      );

      setTimeout(() => {
        router.push('/iniciar-sesion?mensaje=registro_profesional_exitoso');
      }, 2000);
    } catch (error) {
      console.error('Error en registro profesional:', error);
      toast.error(
        error instanceof Error ? error.message : 'Error al registrar profesional. Intenta nuevamente.',
        { duration: 5000 }
      );
    } finally {
      setCargando(false);
    }
  };

  // Configuración de animaciones respetando prefers-reduced-motion
  const animacionPaso = {
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: prefersReducedMotion ? 0 : -20 },
    transition: { duration: prefersReducedMotion ? 0 : 0.4, ease: 'easeOut' }
  };

  const renderPaso1 = () => (
    <motion.div {...animacionPaso} className="space-y-6" role="group" aria-labelledby="paso-1-titulo">
      <div className="text-center mb-8">
        <h2 id="paso-1-titulo" className="text-3xl font-bold text-gray-900 mb-3">
          Bienvenido a Escuchodromo
        </h2>
        <p className="text-lg text-gray-600">
          Comencemos creando tu cuenta profesional. Tu información está protegida y segura.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label htmlFor={`${formId}-nombre`} className="block text-sm font-semibold text-gray-700 mb-2">
            Nombre completo <span className="text-esperanza-600" aria-label="requerido">*</span>
          </label>
          <div className="relative">
            <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input
              id={`${formId}-nombre`}
              name="nombre"
              type="text"
              value={formData.nombre}
              onChange={handleChange}
              onBlur={(e) => {
                if (e.target.value.trim() && !errores.nombre) {
                  toast.success('Nombre guardado', { duration: 1500, icon: '✓' });
                }
              }}
              className={`pl-12 w-full px-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-calma-100 transition-all ${
                errores.nombre
                  ? 'border-red-400 focus:border-red-500'
                  : formData.nombre.trim()
                  ? 'border-esperanza-400 focus:border-esperanza-500'
                  : 'border-gray-300 focus:border-calma-500'
              }`}
              placeholder="Dr. Juan Pérez García"
              aria-required="true"
              aria-invalid={!!errores.nombre}
              aria-describedby={errores.nombre ? `${formId}-nombre-error` : undefined}
            />
            {formData.nombre.trim() && !errores.nombre && (
              <FaCheck className="absolute right-4 top-1/2 -translate-y-1/2 text-esperanza-500" aria-hidden="true" />
            )}
          </div>
          {errores.nombre && (
            <p id={`${formId}-nombre-error`} className="mt-2 text-sm text-red-600 flex items-center gap-1" role="alert">
              <FaTimesCircle aria-hidden="true" />
              {errores.nombre}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={`${formId}-email`} className="block text-sm font-semibold text-gray-700 mb-2">
            Correo electrónico profesional <span className="text-esperanza-600" aria-label="requerido">*</span>
          </label>
          <div className="relative">
            <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input
              id={`${formId}-email`}
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={(e) => {
                if (/\S+@\S+\.\S+/.test(e.target.value) && !errores.email) {
                  toast.success('Email válido', { duration: 1500, icon: '✓' });
                }
              }}
              className={`pl-12 w-full px-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-calma-100 transition-all ${
                errores.email
                  ? 'border-red-400 focus:border-red-500'
                  : /\S+@\S+\.\S+/.test(formData.email)
                  ? 'border-esperanza-400 focus:border-esperanza-500'
                  : 'border-gray-300 focus:border-calma-500'
              }`}
              placeholder="tu.nombre@ejemplo.com"
              aria-required="true"
              aria-invalid={!!errores.email}
              aria-describedby={errores.email ? `${formId}-email-error` : `${formId}-email-ayuda`}
            />
            {/\S+@\S+\.\S+/.test(formData.email) && !errores.email && (
              <FaCheck className="absolute right-4 top-1/2 -translate-y-1/2 text-esperanza-500" aria-hidden="true" />
            )}
          </div>
          {errores.email ? (
            <p id={`${formId}-email-error`} className="mt-2 text-sm text-red-600 flex items-center gap-1" role="alert">
              <FaTimesCircle aria-hidden="true" />
              {errores.email}
            </p>
          ) : (
            <p id={`${formId}-email-ayuda`} className="mt-2 text-sm text-gray-500">
              Usaremos este correo para notificaciones importantes
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor={`${formId}-contrasena`} className="block text-sm font-semibold text-gray-700 mb-2">
              Contraseña <span className="text-esperanza-600" aria-label="requerido">*</span>
            </label>
            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input
                id={`${formId}-contrasena`}
                name="contrasena"
                type="password"
                value={formData.contrasena}
                onChange={handleChange}
                className={`pl-12 w-full px-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-calma-100 transition-all ${
                  errores.contrasena
                    ? 'border-red-400 focus:border-red-500'
                    : formData.contrasena.length >= 6
                    ? 'border-esperanza-400 focus:border-esperanza-500'
                    : 'border-gray-300 focus:border-calma-500'
                }`}
                placeholder="Mínimo 6 caracteres"
                aria-required="true"
                aria-invalid={!!errores.contrasena}
                aria-describedby={errores.contrasena ? `${formId}-contrasena-error` : `${formId}-contrasena-ayuda`}
              />
            </div>
            {errores.contrasena ? (
              <p id={`${formId}-contrasena-error`} className="mt-2 text-sm text-red-600 flex items-center gap-1" role="alert">
                <FaTimesCircle aria-hidden="true" />
                {errores.contrasena}
              </p>
            ) : (
              <p id={`${formId}-contrasena-ayuda`} className="mt-2 text-sm text-gray-500">
                Mínimo 6 caracteres
              </p>
            )}
          </div>

          <div>
            <label htmlFor={`${formId}-confirmar`} className="block text-sm font-semibold text-gray-700 mb-2">
              Confirmar contraseña <span className="text-esperanza-600" aria-label="requerido">*</span>
            </label>
            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input
                id={`${formId}-confirmar`}
                name="confirmarContrasena"
                type="password"
                value={formData.confirmarContrasena}
                onChange={handleChange}
                className={`pl-12 w-full px-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-calma-100 transition-all ${
                  errores.confirmarContrasena
                    ? 'border-red-400 focus:border-red-500'
                    : formData.confirmarContrasena && formData.contrasena === formData.confirmarContrasena
                    ? 'border-esperanza-400 focus:border-esperanza-500'
                    : 'border-gray-300 focus:border-calma-500'
                }`}
                placeholder="Repite la contraseña"
                aria-required="true"
                aria-invalid={!!errores.confirmarContrasena}
                aria-describedby={errores.confirmarContrasena ? `${formId}-confirmar-error` : undefined}
              />
              {formData.confirmarContrasena && formData.contrasena === formData.confirmarContrasena && (
                <FaCheck className="absolute right-4 top-1/2 -translate-y-1/2 text-esperanza-500" aria-hidden="true" />
              )}
            </div>
            {errores.confirmarContrasena && (
              <p id={`${formId}-confirmar-error`} className="mt-2 text-sm text-red-600 flex items-center gap-1" role="alert">
                <FaTimesCircle aria-hidden="true" />
                {errores.confirmarContrasena}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderPaso2 = () => (
    <motion.div {...animacionPaso} className="space-y-6" role="group" aria-labelledby="paso-2-titulo">
      <div className="text-center mb-8">
        <h2 id="paso-2-titulo" className="text-3xl font-bold text-gray-900 mb-3">
          Tu Experiencia Profesional
        </h2>
        <p className="text-lg text-gray-600">
          Cuéntanos sobre tu formación y especialización para que los usuarios te conozcan mejor
        </p>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor={`${formId}-titulo`} className="block text-sm font-semibold text-gray-700 mb-2">
              Título Profesional <span className="text-esperanza-600" aria-label="requerido">*</span>
            </label>
            <div className="relative">
              <FaGraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input
                id={`${formId}-titulo`}
                name="tituloProfesional"
                type="text"
                value={formData.tituloProfesional}
                onChange={handleChange}
                className={`pl-12 w-full px-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-calma-100 transition-all ${
                  errores.tituloProfesional ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-calma-500'
                }`}
                placeholder="Ej: Psicólogo Clínico"
                aria-required="true"
                aria-invalid={!!errores.tituloProfesional}
                aria-describedby={errores.tituloProfesional ? `${formId}-titulo-error` : undefined}
              />
            </div>
            {errores.tituloProfesional && (
              <p id={`${formId}-titulo-error`} className="mt-2 text-sm text-red-600 flex items-center gap-1" role="alert">
                <FaTimesCircle aria-hidden="true" />
                {errores.tituloProfesional}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={`${formId}-licencia`} className="block text-sm font-semibold text-gray-700 mb-2">
              Número de Licencia <span className="text-esperanza-600" aria-label="requerido">*</span>
            </label>
            <div className="relative">
              <FaIdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input
                id={`${formId}-licencia`}
                name="numeroLicencia"
                type="text"
                value={formData.numeroLicencia}
                onChange={handleChange}
                className={`pl-12 w-full px-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-calma-100 transition-all ${
                  errores.numeroLicencia ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-calma-500'
                }`}
                placeholder="Ej: PSI-2024-12345"
                aria-required="true"
                aria-invalid={!!errores.numeroLicencia}
                aria-describedby={errores.numeroLicencia ? `${formId}-licencia-error` : undefined}
              />
            </div>
            {errores.numeroLicencia && (
              <p id={`${formId}-licencia-error`} className="mt-2 text-sm text-red-600 flex items-center gap-1" role="alert">
                <FaTimesCircle aria-hidden="true" />
                {errores.numeroLicencia}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor={`${formId}-universidad`} className="block text-sm font-semibold text-gray-700 mb-2">
              Universidad <span className="text-esperanza-600" aria-label="requerido">*</span>
            </label>
            <div className="relative">
              <FaUniversity className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input
                id={`${formId}-universidad`}
                name="universidad"
                type="text"
                value={formData.universidad}
                onChange={handleChange}
                className={`pl-12 w-full px-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-calma-100 transition-all ${
                  errores.universidad ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-calma-500'
                }`}
                placeholder="Ej: Universidad Nacional"
                aria-required="true"
                aria-invalid={!!errores.universidad}
                aria-describedby={errores.universidad ? `${formId}-universidad-error` : undefined}
              />
            </div>
            {errores.universidad && (
              <p id={`${formId}-universidad-error`} className="mt-2 text-sm text-red-600 flex items-center gap-1" role="alert">
                <FaTimesCircle aria-hidden="true" />
                {errores.universidad}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={`${formId}-experiencia`} className="block text-sm font-semibold text-gray-700 mb-2">
              Años de Experiencia <span className="text-esperanza-600" aria-label="requerido">*</span>
            </label>
            <div className="relative">
              <FaBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input
                id={`${formId}-experiencia`}
                name="anosExperiencia"
                type="number"
                min="0"
                value={formData.anosExperiencia}
                onChange={handleChange}
                className={`pl-12 w-full px-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-calma-100 transition-all ${
                  errores.anosExperiencia ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-calma-500'
                }`}
                placeholder="5"
                aria-required="true"
                aria-invalid={!!errores.anosExperiencia}
                aria-describedby={errores.anosExperiencia ? `${formId}-experiencia-error` : undefined}
              />
            </div>
            {errores.anosExperiencia && (
              <p id={`${formId}-experiencia-error`} className="mt-2 text-sm text-red-600 flex items-center gap-1" role="alert">
                <FaTimesCircle aria-hidden="true" />
                {errores.anosExperiencia}
              </p>
            )}
          </div>
        </div>

        <div>
          <label id="especialidades-label" className="block text-sm font-semibold text-gray-700 mb-3">
            Especialidades <span className="text-esperanza-600" aria-label="requerido">*</span>
          </label>
          <p className="text-sm text-gray-600 mb-3">Selecciona todas las áreas en las que trabajas</p>
          <div
            className="grid grid-cols-2 md:grid-cols-3 gap-3"
            role="group"
            aria-labelledby="especialidades-label"
            aria-required="true"
          >
            {ESPECIALIDADES_DISPONIBLES.map((especialidad) => {
              const isSelected = formData.especialidades.includes(especialidad);
              return (
                <button
                  key={especialidad}
                  type="button"
                  onClick={() => handleEspecialidadToggle(especialidad)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all focus:ring-4 focus:ring-calma-100 ${
                    isSelected
                      ? 'bg-gradient-to-br from-calma-500 to-esperanza-500 text-white shadow-md hover:shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent hover:border-calma-200'
                  }`}
                  aria-pressed={isSelected}
                >
                  {isSelected && <FaCheck className="inline mr-2" aria-hidden="true" />}
                  {especialidad}
                </button>
              );
            })}
          </div>
          {errores.especialidades && (
            <p className="mt-3 text-sm text-red-600 flex items-center gap-1" role="alert">
              <FaTimesCircle aria-hidden="true" />
              {errores.especialidades}
            </p>
          )}
          {formData.especialidades.length > 0 && !errores.especialidades && (
            <p className="mt-3 text-sm text-esperanza-700 flex items-center gap-1">
              <FaCheckCircle aria-hidden="true" />
              {formData.especialidades.length} especialidad{formData.especialidades.length > 1 ? 'es' : ''} seleccionada{formData.especialidades.length > 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div>
          <label id="idiomas-label" className="block text-sm font-semibold text-gray-700 mb-3">
            Idiomas que hablas
          </label>
          <div className="flex flex-wrap gap-3" role="group" aria-labelledby="idiomas-label">
            {IDIOMAS_DISPONIBLES.map((idioma) => {
              const isSelected = formData.idiomas.includes(idioma);
              return (
                <button
                  key={idioma}
                  type="button"
                  onClick={() => handleIdiomaToggle(idioma)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 focus:ring-4 focus:ring-calma-100 ${
                    isSelected
                      ? 'bg-serenidad-500 text-white shadow-md hover:shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-pressed={isSelected}
                >
                  <FaLanguage aria-hidden="true" />
                  {idioma}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor={`${formId}-tarifa`} className="block text-sm font-semibold text-gray-700 mb-2">
              Tarifa por Sesión <span className="text-esperanza-600" aria-label="requerido">*</span>
            </label>
            <div className="relative">
              <FaDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input
                id={`${formId}-tarifa`}
                name="tarifaPorSesion"
                type="number"
                min="0"
                step="1000"
                value={formData.tarifaPorSesion}
                onChange={handleChange}
                className={`pl-12 w-full px-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-calma-100 transition-all ${
                  errores.tarifaPorSesion ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-calma-500'
                }`}
                placeholder="100000"
                aria-required="true"
                aria-invalid={!!errores.tarifaPorSesion}
                aria-describedby={errores.tarifaPorSesion ? `${formId}-tarifa-error` : `${formId}-tarifa-ayuda`}
              />
            </div>
            {errores.tarifaPorSesion ? (
              <p id={`${formId}-tarifa-error`} className="mt-2 text-sm text-red-600 flex items-center gap-1" role="alert">
                <FaTimesCircle aria-hidden="true" />
                {errores.tarifaPorSesion}
              </p>
            ) : (
              <p id={`${formId}-tarifa-ayuda`} className="mt-2 text-sm text-gray-500">
                Precio por sesión de 50 minutos
              </p>
            )}
          </div>

          <div>
            <label htmlFor={`${formId}-moneda`} className="block text-sm font-semibold text-gray-700 mb-2">
              Moneda
            </label>
            <select
              id={`${formId}-moneda`}
              name="moneda"
              value={formData.moneda}
              onChange={handleChange}
              className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-calma-100 focus:border-calma-500 transition-all bg-white"
            >
              <option value="COP">COP (Peso Colombiano)</option>
              <option value="USD">USD (Dólar)</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor={`${formId}-biografia`} className="block text-sm font-semibold text-gray-700 mb-2">
            Biografía Profesional (opcional)
          </label>
          <textarea
            id={`${formId}-biografia`}
            name="biografia"
            value={formData.biografia}
            onChange={handleChange}
            maxLength={500}
            rows={5}
            className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-calma-100 focus:border-calma-500 transition-all resize-none"
            placeholder="Cuéntanos sobre tu enfoque terapéutico, experiencia y áreas de especialización. Esto ayudará a los usuarios a conocerte mejor."
            aria-describedby={`${formId}-biografia-contador`}
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm text-gray-500">
              Ayuda a los usuarios a conocer tu enfoque
            </p>
            <p id={`${formId}-biografia-contador`} className="text-sm text-gray-500" aria-live="polite">
              {formData.biografia.length}/500 caracteres
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderPaso3 = () => (
    <motion.div {...animacionPaso} className="space-y-6" role="group" aria-labelledby="paso-3-titulo">
      <div className="text-center mb-8">
        <h2 id="paso-3-titulo" className="text-3xl font-bold text-gray-900 mb-3">
          Verificación de Credenciales
        </h2>
        <p className="text-lg text-gray-600">
          Por último, necesitamos validar tu identidad y credenciales profesionales
        </p>
      </div>

      <div className="space-y-5">
        {formData.documentos.map((doc, index) => {
          const tienArchivo = !!doc.archivo;
          const estaCargando = documentosCargando[index];

          return (
            <div
              key={index}
              className={`border-2 rounded-xl p-5 transition-all ${
                tienArchivo
                  ? 'border-esperanza-400 bg-esperanza-50'
                  : 'border-gray-300 bg-white hover:border-calma-300'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-3 rounded-lg ${tienArchivo ? 'bg-esperanza-100' : 'bg-gray-100'}`}>
                    <FaFileAlt className={`text-xl ${tienArchivo ? 'text-esperanza-600' : 'text-gray-400'}`} aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{doc.nombre}</h3>
                    <p className="text-sm text-gray-600">PDF, JPG, PNG - Máximo 10MB</p>
                  </div>
                </div>
                <div className={`p-2 rounded-full ${tienArchivo ? 'bg-esperanza-500' : 'bg-gray-200'}`}>
                  {estaCargando ? (
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  ) : tienArchivo ? (
                    <FaCheckCircle className="text-white text-xl" aria-label="Documento cargado" />
                  ) : (
                    <FaTimesCircle className="text-gray-400 text-xl" aria-label="Documento pendiente" />
                  )}
                </div>
              </div>

              {/* Preview de imagen */}
              {doc.preview && (
                <div className="mb-4 rounded-lg overflow-hidden border-2 border-esperanza-200">
                  <img
                    src={doc.preview}
                    alt={`Vista previa de ${doc.nombre}`}
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor={`${formId}-documento-${index}`}
                  className="block"
                >
                  <input
                    id={`${formId}-documento-${index}`}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(index, e.target.files?.[0] || null)}
                    disabled={estaCargando}
                    className="w-full text-sm text-gray-700
                      file:mr-4 file:py-3 file:px-5
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-calma-50 file:text-calma-700
                      hover:file:bg-calma-100
                      file:cursor-pointer
                      file:transition-all
                      disabled:opacity-50 disabled:cursor-not-allowed
                      focus:outline-none focus:ring-4 focus:ring-calma-100"
                    aria-describedby={`${formId}-documento-${index}-info`}
                  />
                </label>

                {doc.archivo && (
                  <div id={`${formId}-documento-${index}-info`} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FaCheckCircle className="text-esperanza-500 flex-shrink-0" aria-hidden="true" />
                      <p className="text-sm text-gray-900 font-medium truncate">
                        {doc.archivo.name}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500 ml-2 flex-shrink-0">
                      {(doc.archivo.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {errores.documentos && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4" role="alert">
          <div className="flex items-start gap-3">
            <FaTimesCircle className="text-red-500 text-xl flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-red-700 font-medium">{errores.documentos}</p>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-calma-50 to-esperanza-50 border-2 border-calma-200 rounded-xl p-6">
        <h3 className="font-semibold text-calma-900 mb-3 flex items-center gap-2">
          <FaCheckCircle className="text-calma-600" aria-hidden="true" />
          Proceso de Verificación
        </h3>
        <ul className="space-y-2 text-sm text-calma-800">
          <li className="flex items-start gap-2">
            <span className="text-esperanza-600 font-bold flex-shrink-0">•</span>
            <span>Tus documentos serán revisados por nuestro equipo en 24-48 horas hábiles</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-esperanza-600 font-bold flex-shrink-0">•</span>
            <span>Recibirás un email cuando tu perfil sea aprobado y puedas comenzar</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-esperanza-600 font-bold flex-shrink-0">•</span>
            <span>Tus documentos están protegidos con encriptación y son completamente confidenciales</span>
          </li>
        </ul>
      </div>

      <div className="border-2 border-gray-200 rounded-xl p-5 bg-white">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            id={`${formId}-terminos`}
            name="aceptaTerminos"
            type="checkbox"
            checked={formData.aceptaTerminos}
            onChange={handleChange}
            className="w-5 h-5 text-calma-600 border-2 border-gray-300 rounded focus:ring-4 focus:ring-calma-100 mt-0.5 cursor-pointer"
            aria-required="true"
            aria-invalid={!!errores.aceptaTerminos}
            aria-describedby={errores.aceptaTerminos ? `${formId}-terminos-error` : undefined}
          />
          <span className="text-sm text-gray-700 leading-relaxed group-hover:text-gray-900 transition-colors">
            Acepto los{' '}
            <Link href="/terminos" className="text-calma-600 hover:text-calma-700 font-semibold underline" target="_blank">
              términos y condiciones
            </Link>{' '}
            y la{' '}
            <Link href="/privacidad" className="text-calma-600 hover:text-calma-700 font-semibold underline" target="_blank">
              política de privacidad
            </Link>.
            También confirmo que mis credenciales profesionales son válidas, están vigentes y me comprometo a brindar un servicio ético y profesional.
          </span>
        </label>
        {errores.aceptaTerminos && (
          <p id={`${formId}-terminos-error`} className="mt-3 text-sm text-red-600 flex items-center gap-1" role="alert">
            <FaTimesCircle aria-hidden="true" />
            {errores.aceptaTerminos}
          </p>
        )}
      </div>
    </motion.div>
  );

  const progresoPorcentaje = (paso / 3) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-calma-50 via-white to-esperanza-50">
      <Navegacion />
      <Toaster position="top-center" toastOptions={{
        success: { duration: 3000, iconTheme: { primary: '#16A34A', secondary: 'white' } },
        error: { duration: 4000, iconTheme: { primary: '#DC2626', secondary: 'white' } },
      }} />

      <main id="main-content" className="pt-28 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="text-center mb-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-20 h-20 bg-gradient-to-br from-calma-500 via-esperanza-500 to-serenidad-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg"
            >
              <FaHeart className="text-4xl text-white" aria-hidden="true" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
              Únete como Profesional
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-5">
              Ayuda a personas a mejorar su bienestar emocional. Únete a nuestra red de profesionales certificados.
            </p>
            <p className="text-sm text-gray-500">
              ¿Ya tienes cuenta?{' '}
              <Link href="/iniciar-sesion" className="text-calma-600 hover:text-calma-700 font-semibold underline">
                Inicia sesión aquí
              </Link>
            </p>
          </header>

          {/* Indicador de progreso mejorado */}
          <div className="mb-10" role="region" aria-label="Progreso del registro">
            {/* Barra de progreso */}
            <div className="mb-6">
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  className="h-full bg-gradient-to-r from-calma-500 to-esperanza-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progresoPorcentaje}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  role="progressbar"
                  aria-valuenow={paso}
                  aria-valuemin={1}
                  aria-valuemax={3}
                  aria-label={`Paso ${paso} de 3`}
                />
              </div>
              <p className="text-center mt-2 text-sm font-medium text-gray-600" aria-live="polite">
                Paso {paso} de 3 - {PASOS_INFO[paso - 1].titulo}
              </p>
            </div>

            {/* Indicador de pasos */}
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {PASOS_INFO.map((pasoInfo, index) => {
                const isActual = paso === pasoInfo.numero;
                const isCompletado = paso > pasoInfo.numero;

                return (
                  <div key={pasoInfo.numero} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <motion.div
                        initial={false}
                        animate={{
                          scale: isActual ? 1.1 : 1,
                        }}
                        className={`relative w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-2 transition-all shadow-md ${
                          isCompletado
                            ? 'bg-gradient-to-br from-esperanza-500 to-esperanza-600 text-white'
                            : isActual
                            ? 'bg-gradient-to-br from-calma-500 to-calma-600 text-white ring-4 ring-calma-100'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                        aria-current={isActual ? 'step' : undefined}
                      >
                        {isCompletado ? (
                          <FaCheckCircle className="text-2xl" aria-label="Completado" />
                        ) : (
                          <span>{pasoInfo.numero}</span>
                        )}
                      </motion.div>
                      <div className="text-center">
                        <p className={`text-sm font-semibold ${isActual ? 'text-calma-700' : 'text-gray-600'}`}>
                          {pasoInfo.titulo}
                        </p>
                        <p className="text-xs text-gray-500 hidden sm:block">
                          {pasoInfo.descripcion}
                        </p>
                      </div>
                    </div>
                    {index < PASOS_INFO.length - 1 && (
                      <div className={`h-1 flex-1 mx-2 rounded-full transition-all ${
                        paso > pasoInfo.numero ? 'bg-gradient-to-r from-esperanza-400 to-esperanza-500' : 'bg-gray-200'
                      }`} aria-hidden="true" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Formulario */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-2xl p-6 md:p-10 border border-gray-100"
          >
            <form onSubmit={handleSubmit} noValidate aria-label="Formulario de registro profesional">
              <AnimatePresence mode="wait">
                <div key={paso}>
                  {paso === 1 && renderPaso1()}
                  {paso === 2 && renderPaso2()}
                  {paso === 3 && renderPaso3()}
                </div>
              </AnimatePresence>

              {/* Botones de navegación */}
              <div className="mt-10 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={anteriorPaso}
                  disabled={paso === 1 || cargando}
                  className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold transition-all focus:ring-4 focus:ring-gray-200 ${
                    paso === 1 || cargando
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md'
                  }`}
                  aria-label="Ir al paso anterior"
                >
                  <FaArrowLeft aria-hidden="true" />
                  <span className="hidden sm:inline">Anterior</span>
                </button>

                {paso < 3 ? (
                  <button
                    type="button"
                    onClick={siguientePaso}
                    disabled={cargando}
                    className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-calma-500 to-esperanza-500 text-white rounded-xl font-semibold hover:shadow-xl transition-all focus:ring-4 focus:ring-calma-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Ir al siguiente paso"
                  >
                    <span>Siguiente</span>
                    <FaArrowRight aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={cargando}
                    className={`flex items-center gap-3 px-8 py-3.5 rounded-xl font-semibold transition-all focus:ring-4 focus:ring-calma-200 ${
                      cargando
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-esperanza-500 via-calma-500 to-serenidad-500 hover:shadow-xl animate-gradient-x'
                    } text-white shadow-lg`}
                    aria-label={cargando ? 'Enviando registro...' : 'Completar registro'}
                  >
                    {cargando ? (
                      <>
                        <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <FaCheckCircle className="text-xl" aria-hidden="true" />
                        <span>Completar Registro</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </motion.div>

          {/* Footer informativo */}
          <footer className="mt-8 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <FaHeart className="text-esperanza-500" aria-hidden="true" />
              <p>
                <strong>Escuchodromo</strong> - Tu información está protegida y segura
              </p>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Todos los datos son confidenciales y cumplen con normativas de protección de datos
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
