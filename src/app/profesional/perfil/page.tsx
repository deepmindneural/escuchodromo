'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  Camera,
  Award,
  Clock,
  Linkedin,
  Link as LinkIcon,
  Shield,
  AlertCircle,
  Eye,
  CheckCircle2,
  SparklesIcon,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/lib/componentes/ui/button';
import { obtenerClienteNavegador } from '@/lib/supabase/cliente';
import {
  obtenerPerfilProfesional,
  actualizarPerfilProfesional,
  type PerfilProfesionalCompleto,
  type ActualizarPerfilProfesionalInput,
} from '@/lib/supabase/queries/profesional';
import toast, { Toaster } from 'react-hot-toast';

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

  // Estados adicionales
  const [fotoPerfil, setFotoPerfil] = useState<string>('');
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [certificaciones, setCertificaciones] = useState<string[]>(['']);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [sitioWeb, setSitioWeb] = useState('');
  const [disponibilidadHoraria, setDisponibilidadHoraria] = useState<string>('');
  const [perfilVerificado] = useState(false);

  // Estado para mostrar vista previa
  const [mostrandoVista, setMostrandoVista] = useState(false);

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

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen');
      return;
    }

    // Validar tamaño (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen no debe superar 2MB');
      return;
    }

    setSubiendoFoto(true);

    try {
      // Convertir a base64 para preview (en producción, subir a Supabase Storage)
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPerfil(reader.result as string);
        toast.success('Foto de perfil actualizada');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error al subir foto:', error);
      toast.error('Error al subir la foto');
    } finally {
      setSubiendoFoto(false);
    }
  };

  const agregarCertificacion = () => {
    setCertificaciones([...certificaciones, '']);
  };

  const eliminarCertificacion = (index: number) => {
    const nuevas = certificaciones.filter((_, i) => i !== index);
    setCertificaciones(nuevas.length > 0 ? nuevas : ['']);
  };

  const actualizarCertificacion = (index: number, valor: string) => {
    const nuevas = [...certificaciones];
    nuevas[index] = valor;
    setCertificaciones(nuevas);
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

  const calcularCompletitudPerfil = () => {
    let completitud = 0;
    const campos = [
      tituloProfesional,
      numeroLicencia,
      universidad,
      anosExperiencia > 0,
      especialidades.length > 0,
      biografia,
      idiomas.length > 0,
      tarifaPorSesion > 0,
    ];

    campos.forEach((campo) => {
      if (campo) completitud += 12.5;
    });

    return Math.round(completitud);
  };

  const completitud = calcularCompletitudPerfil();

  // Animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-calma-50/50 via-white to-esperanza-50/50 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="relative mx-auto mb-6">
            <div className="w-20 h-20 border-4 border-calma-200 border-t-calma-600 rounded-full animate-spin" />
            <User className="w-8 h-8 text-calma-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-gray-700 text-lg font-medium">Cargando perfil...</p>
          <p className="text-gray-500 text-sm mt-2">Preparando tu información</p>
        </motion.div>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-calma-50/50 via-white to-esperanza-50/50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl border border-red-200 p-8 text-center max-w-md"
        >
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error al cargar perfil</h2>
          <p className="text-gray-600 mb-6">No se pudo cargar el perfil profesional</p>
          <Button onClick={() => router.back()} className="w-full">
            Volver
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-calma-50/50 via-white to-esperanza-50/50">
      <Toaster position="top-right" />

      {/* Header con gradiente */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative bg-gradient-to-r from-calma-600 via-calma-500 to-esperanza-500 text-white shadow-2xl overflow-hidden"
      >
        {/* Patrón decorativo de fondo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg"
                >
                  <User className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl md:text-4xl font-bold tracking-tight"
                  >
                    Mi Perfil Profesional
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-white/90 text-base md:text-lg mt-1"
                  >
                    Actualiza tu información profesional y mantén tu perfil al día
                  </motion.p>
                </div>
              </div>
              {perfilVerificado && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-2 ml-18"
                >
                  <Shield className="w-5 h-5 text-green-300" />
                  <span className="text-sm text-white/90 font-medium">
                    Perfil Verificado
                  </span>
                </motion.div>
              )}
            </div>

            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, type: 'spring' }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMostrandoVista(!mostrandoVista)}
              className="px-6 py-3.5 bg-white text-calma-700 font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all focus:outline-none focus:ring-4 focus:ring-white/50 flex items-center gap-2 group"
            >
              <Eye className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>{mostrandoVista ? 'Editar perfil' : 'Vista previa'}</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Contenido principal */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <div className="space-y-6">
          {/* Estadísticas del Perfil con diseño mejorado */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-calma-500 to-calma-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Pacientes</p>
                  <p className="text-2xl font-bold text-gray-900">{perfil.total_pacientes}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-esperanza-500 to-esperanza-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Citas</p>
                  <p className="text-2xl font-bold text-gray-900">{perfil.total_citas}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Calificación</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {perfil.calificacion_promedio?.toFixed(1) || 'N/A'}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-serenidad-500 to-serenidad-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Completitud</p>
                  <p className="text-2xl font-bold text-gray-900">{completitud}%</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Barra de progreso de completitud */}
          {completitud < 100 && (
            <motion.div
              variants={itemVariants}
              className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-2xl p-6 shadow-lg"
            >
              <div className="flex items-start gap-4">
                <TrendingUp className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Completa tu perfil
                  </h3>
                  <p className="text-gray-700 mb-3">
                    Un perfil completo aumenta tu visibilidad y confianza con los pacientes
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${completitud}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-gradient-to-r from-calma-500 to-esperanza-500 rounded-full shadow-inner"
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {completitud}% completado
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Foto de Perfil */}
          <motion.section
            variants={itemVariants}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Foto de Perfil</h2>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-calma-500 to-esperanza-600 flex items-center justify-center text-white text-4xl font-bold overflow-hidden ring-4 ring-calma-100 group-hover:ring-calma-200 transition-all shadow-xl">
                  {fotoPerfil ? (
                    <img src={fotoPerfil} alt="Foto de perfil" className="w-full h-full object-cover" />
                  ) : (
                    perfil?.nombre?.charAt(0)?.toUpperCase() || 'P'
                  )}
                </div>
                <label
                  htmlFor="foto-upload"
                  className="absolute bottom-0 right-0 w-12 h-12 bg-gradient-to-br from-calma-500 to-calma-600 rounded-full flex items-center justify-center cursor-pointer hover:from-calma-600 hover:to-calma-700 transition-all shadow-xl border-4 border-white group-hover:scale-110"
                >
                  <Camera className="h-5 w-5 text-white" />
                  <input
                    id="foto-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleUploadFoto}
                    className="hidden"
                    disabled={subiendoFoto}
                  />
                </label>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {perfil?.nombre || 'Profesional'}
                </h3>
                <p className="text-base text-gray-600 mb-3">{tituloProfesional || 'Título profesional'}</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-calma-50 text-calma-700 rounded-xl text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Formatos: JPG, PNG. Tamaño máximo: 2MB</span>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Información Personal */}
          <motion.section
            variants={itemVariants}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-calma-500 to-calma-600 rounded-xl shadow-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Información Personal</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Título Profesional <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={tituloProfesional}
                  onChange={(e) => setTituloProfesional(e.target.value)}
                  placeholder="Ej: Psicólogo Clínico"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-calma-500 focus:border-calma-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Número de Licencia
                </label>
                <input
                  type="text"
                  value={numeroLicencia}
                  onChange={(e) => setNumeroLicencia(e.target.value)}
                  placeholder="Ej: PSI-12345"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-calma-500 focus:border-calma-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Universidad
                </label>
                <input
                  type="text"
                  value={universidad}
                  onChange={(e) => setUniversidad(e.target.value)}
                  placeholder="Ej: Universidad Nacional"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-calma-500 focus:border-calma-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Años de Experiencia
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={anosExperiencia}
                  onChange={(e) => setAnosExperiencia(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-calma-500 focus:border-calma-500 transition-all"
                />
              </div>
            </div>
          </motion.section>

          {/* Especialidades */}
          <motion.section
            variants={itemVariants}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Especialidades <span className="text-red-500">*</span>
              </h2>
            </div>

            <div className="flex flex-wrap gap-3">
              {ESPECIALIDADES_DISPONIBLES.map((esp) => (
                <motion.button
                  key={esp}
                  type="button"
                  onClick={() => toggleEspecialidad(esp)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all shadow-md ${
                    especialidades.includes(esp)
                      ? 'bg-gradient-to-r from-calma-600 to-calma-700 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {especialidades.includes(esp) && (
                    <CheckCircle2 className="w-4 h-4 inline mr-2" />
                  )}
                  {esp}
                </motion.button>
              ))}
            </div>

            <p className="text-sm text-gray-600 mt-4 flex items-center gap-2">
              <SparklesIcon className="w-4 h-4" />
              Seleccionadas: {especialidades.length}
            </p>
          </motion.section>

          {/* Biografía */}
          <motion.section
            variants={itemVariants}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-serenidad-500 to-serenidad-600 rounded-xl shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Biografía</h2>
            </div>

            <textarea
              value={biografia}
              onChange={(e) => setBiografia(e.target.value)}
              placeholder="Cuéntanos sobre tu experiencia, enfoque terapéutico y qué te apasiona de tu trabajo..."
              rows={6}
              maxLength={1000}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-calma-500 focus:border-calma-500 resize-none transition-all"
            />
            <div className="flex justify-between items-center mt-3">
              <p className="text-sm text-gray-500">
                Máximo 1000 caracteres
              </p>
              <p className="text-sm font-medium text-gray-700">
                {biografia.length}/1000
              </p>
            </div>
          </motion.section>

          {/* Idiomas */}
          <motion.section
            variants={itemVariants}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-esperanza-500 to-esperanza-600 rounded-xl shadow-lg">
                <Languages className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Idiomas</h2>
            </div>

            <div className="flex flex-wrap gap-3">
              {IDIOMAS_DISPONIBLES.map((idioma) => (
                <motion.button
                  key={idioma}
                  type="button"
                  onClick={() => toggleIdioma(idioma)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all shadow-md ${
                    idiomas.includes(idioma)
                      ? 'bg-gradient-to-r from-esperanza-600 to-esperanza-700 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {idiomas.includes(idioma) && (
                    <CheckCircle2 className="w-4 h-4 inline mr-2" />
                  )}
                  {idioma}
                </motion.button>
              ))}
            </div>
          </motion.section>

          {/* Tarifa */}
          <motion.section
            variants={itemVariants}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Tarifa por Sesión <span className="text-red-500">*</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Monto
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={tarifaPorSesion}
                  onChange={(e) => setTarifaPorSesion(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-calma-500 focus:border-calma-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Moneda
                </label>
                <select
                  value={moneda}
                  onChange={(e) => setMoneda(e.target.value as 'COP' | 'USD')}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-calma-500 focus:border-calma-500 transition-all"
                >
                  <option value="COP">COP (Pesos Colombianos)</option>
                  <option value="USD">USD (Dólares)</option>
                </select>
              </div>
            </div>

            <div className="mt-6 p-5 bg-gradient-to-r from-calma-50 to-esperanza-50 rounded-xl border-2 border-calma-100">
              <p className="text-base text-gray-800">
                <span className="font-bold">Tarifa actual:</span>{' '}
                <span className="text-2xl font-bold text-calma-700">
                  {tarifaPorSesion.toLocaleString()} {moneda}
                </span>
              </p>
            </div>
          </motion.section>

          {/* Certificaciones */}
          <motion.section
            variants={itemVariants}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg">
                <Award className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Certificaciones y Formación</h2>
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {certificaciones.map((cert, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={cert}
                      onChange={(e) => actualizarCertificacion(index, e.target.value)}
                      placeholder="Ej: Certificación en Terapia Cognitivo-Conductual"
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-calma-500 focus:border-calma-500 transition-all"
                    />
                    {certificaciones.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => eliminarCertificacion(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-2"
                      >
                        Eliminar
                      </Button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <motion.button
              type="button"
              onClick={agregarCertificacion}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-calma-600 to-calma-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              + Agregar Certificación
            </motion.button>
          </motion.section>

          {/* Disponibilidad Horaria */}
          <motion.section
            variants={itemVariants}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-serenidad-500 to-serenidad-600 rounded-xl shadow-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Disponibilidad Horaria</h2>
            </div>

            <textarea
              value={disponibilidadHoraria}
              onChange={(e) => setDisponibilidadHoraria(e.target.value)}
              placeholder="Ej: Lunes a Viernes: 9:00 AM - 6:00 PM&#10;Sábados: 10:00 AM - 2:00 PM"
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-calma-500 focus:border-calma-500 resize-none transition-all"
            />
            <p className="text-sm text-gray-600 mt-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Indica tu horario general de disponibilidad para citas
            </p>
          </motion.section>

          {/* Enlaces Profesionales */}
          <motion.section
            variants={itemVariants}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl shadow-lg">
                <LinkIcon className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Enlaces Profesionales</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Linkedin className="h-5 w-5 inline mr-2 text-blue-600" />
                  LinkedIn
                </label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/tu-perfil"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-calma-500 focus:border-calma-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <LinkIcon className="h-5 w-5 inline mr-2 text-gray-600" />
                  Sitio Web Personal
                </label>
                <input
                  type="url"
                  value={sitioWeb}
                  onChange={(e) => setSitioWeb(e.target.value)}
                  placeholder="https://tu-sitio-web.com"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-calma-500 focus:border-calma-500 transition-all"
                />
              </div>
            </div>
          </motion.section>

          {/* Botones de acción fijos en la parte inferior */}
          <motion.div
            variants={itemVariants}
            className="sticky bottom-0 z-10 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6"
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/profesional/dashboard')}
                disabled={guardando}
                className="px-8 py-4 bg-white text-gray-700 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-4 focus:ring-gray-200 disabled:opacity-50"
              >
                Cancelar
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGuardar}
                disabled={guardando}
                className="px-8 py-4 bg-gradient-to-r from-calma-600 to-esperanza-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-4 focus:ring-calma-300 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {guardando ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    Guardar Cambios
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
