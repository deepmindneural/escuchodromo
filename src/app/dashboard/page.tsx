'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FaChartLine, FaComments, FaCrown, FaTrophy, FaRobot, FaMicrophone,
  FaClipboardList, FaChartBar, FaBullseye, FaUser, FaTasks, FaCreditCard,
  FaHistory, FaUserMd, FaCalendar, FaFileAlt, FaUsers, FaHeart
} from 'react-icons/fa';
import { Boton } from '../../lib/componentes/ui/boton';
import Navegacion from '../../lib/componentes/layout/Navegacion';
import Footer from '../../lib/componentes/layout/Footer';
import { useUsuario, usePerfilUsuario } from '../../lib/supabase/hooks';
import { cerrarSesion as cerrarSesionSupabase } from '../../lib/supabase/auth';

export default function PaginaDashboard() {
  const router = useRouter();
  const { usuario: authUsuario, cargando: cargandoAuth } = useUsuario();
  const { perfil, cargando: cargandoPerfil } = usePerfilUsuario();
  const [estadisticas, setEstadisticas] = useState({
    totalEvaluaciones: 0,
    totalConversaciones: 0,
    ultimaEvaluacion: null as any,
    planActual: 'Gratis' as string,
  });

  const cargando = cargandoAuth || cargandoPerfil;
  const usuario = perfil;

  useEffect(() => {
    if (!cargandoAuth && !authUsuario) {
      router.push('/iniciar-sesion');
    }
  }, [authUsuario, cargandoAuth, router]);

  useEffect(() => {
    if (usuario?.id) {
      cargarEstadisticas();
    }
  }, [usuario?.id]);

  const cargarEstadisticas = async () => {
    if (!usuario?.id) return;

    try {
      const { obtenerClienteNavegador } = await import('../../lib/supabase/cliente');
      const supabase = obtenerClienteNavegador();

      // Contar evaluaciones
      const { count: totalEvaluaciones } = await supabase
        .from('Resultado')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', usuario.id);

      // Contar conversaciones
      const { count: totalConversaciones } = await supabase
        .from('Conversacion')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', usuario.id);

      // Obtener plan actual
      const { data: suscripcion } = await supabase
        .from('Suscripcion')
        .select('plan')
        .eq('usuario_id', usuario.id)
        .eq('estado', 'activa')
        .single();

      setEstadisticas({
        totalEvaluaciones: totalEvaluaciones || 0,
        totalConversaciones: totalConversaciones || 0,
        ultimaEvaluacion: null,
        planActual: suscripcion?.plan || 'Gratis',
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const handleCerrarSesion = async () => {
    try {
      await cerrarSesionSupabase();
      router.push('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navegacion />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
        {/* Header con información del usuario */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                ¡Hola, {usuario?.nombre || 'Usuario'}! 👋
              </h1>
              <p className="text-white/90 text-lg">
                Bienvenido a tu espacio de bienestar emocional
              </p>
              <div className="mt-4 flex items-center gap-4 text-sm">
                <span className="bg-white/20 px-3 py-1 rounded-full">
                  Plan: {estadisticas.planActual}
                </span>
                <span className="bg-white/20 px-3 py-1 rounded-full">
                  {usuario?.email}
                </span>
              </div>
            </div>
            <Link href="/perfil">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-white text-teal-600 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                Ver mi perfil completo
              </motion.button>
            </Link>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <FaClipboardList className="text-3xl" />
              </div>
              <span className="text-4xl font-bold">{estadisticas.totalEvaluaciones}</span>
            </div>
            <p className="text-white/90 text-lg font-medium mb-2">Evaluaciones</p>
            <Link href="/evaluaciones/historial" className="text-white/80 text-sm hover:text-white transition-colors inline-flex items-center gap-2">
              Ver historial <FaChartLine />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl shadow-xl p-6 text-white hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <FaComments className="text-3xl" />
              </div>
              <span className="text-4xl font-bold">{estadisticas.totalConversaciones}</span>
            </div>
            <p className="text-white/90 text-lg font-medium mb-2">Conversaciones</p>
            <Link href="/chat" className="text-white/80 text-sm hover:text-white transition-colors inline-flex items-center gap-2">
              Iniciar chat <FaRobot />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-xl p-6 text-white hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <FaCrown className="text-3xl" />
              </div>
              <span className="text-2xl font-bold">{estadisticas.planActual}</span>
            </div>
            <p className="text-white/90 text-lg font-medium mb-2">Mi Plan</p>
            <Link href="/precios" className="text-white/80 text-sm hover:text-white transition-colors inline-flex items-center gap-2">
              Mejorar plan <FaTrophy />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-xl p-6 text-white hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <FaChartBar className="text-3xl" />
              </div>
              <FaHeart className="text-4xl animate-pulse" />
            </div>
            <p className="text-white/90 text-lg font-medium mb-2">Progreso</p>
            <Link href="/progreso" className="text-white/80 text-sm hover:text-white transition-colors inline-flex items-center gap-2">
              Ver métricas <FaChartLine />
            </Link>
          </motion.div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Accesos Rápidos</h2>

        {/* Dashboard específico por rol */}
        {usuario?.rol === 'USUARIO' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/chat">
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-teal-200"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-xl flex items-center justify-center mb-4">
                  <FaRobot className="text-3xl text-teal-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Chat con IA
                </h3>
                <p className="text-gray-600 text-sm">
                  Habla con nuestra IA sobre cómo te sientes
                </p>
              </motion.div>
            </Link>

            <Link href="/voz">
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-purple-200"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center mb-4">
                  <FaMicrophone className="text-3xl text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Hablar por Voz
                </h3>
                <p className="text-gray-600 text-sm">
                  Expresa tus emociones hablando con la IA
                </p>
              </motion.div>
            </Link>

            <Link href="/evaluaciones">
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-blue-200"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mb-4">
                  <FaClipboardList className="text-3xl text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Evaluaciones
                </h3>
                <p className="text-gray-600 text-sm">
                  Realiza pruebas psicológicas validadas
                </p>
              </motion.div>
            </Link>

            <Link href="/animo">
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-green-200"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mb-4">
                  <FaChartLine className="text-3xl text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Registro de Ánimo
                </h3>
                <p className="text-gray-600 text-sm">
                  Registra y monitorea tu estado emocional
                </p>
              </motion.div>
            </Link>

            <Link href="/recomendaciones">
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-yellow-200"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <FaBullseye className="text-3xl text-orange-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Recomendaciones
                </h3>
                <p className="text-gray-600 text-sm">
                  Recibe sugerencias personalizadas
                </p>
              </motion.div>
            </Link>

            <Link href="/perfil">
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-gray-200"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mb-4">
                  <FaUser className="text-3xl text-gray-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Mi Perfil
                </h3>
                <p className="text-gray-600 text-sm">
                  Gestiona tu información personal
                </p>
              </motion.div>
            </Link>

            <Link href="/progreso">
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-indigo-200"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl flex items-center justify-center mb-4">
                  <FaChartBar className="text-3xl text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Mi Progreso
                </h3>
                <p className="text-gray-600 text-sm">
                  Visualiza tu evolución y métricas
                </p>
              </motion.div>
            </Link>

            <Link href="/plan-accion">
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-pink-200"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-pink-100 to-rose-100 rounded-xl flex items-center justify-center mb-4">
                  <FaTasks className="text-3xl text-pink-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Plan de Acción
                </h3>
                <p className="text-gray-600 text-sm">
                  Objetivos personalizados por la IA
                </p>
              </motion.div>
            </Link>

            <Link href="/pagos">
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-emerald-200"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center mb-4">
                  <FaCreditCard className="text-3xl text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Mis Pagos
                </h3>
                <p className="text-gray-600 text-sm">
                  Historial de transacciones y facturas
                </p>
              </motion.div>
            </Link>

            <Link href="/evaluaciones/historial">
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-violet-200"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <FaHistory className="text-3xl text-violet-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Historial de Evaluaciones
                </h3>
                <p className="text-gray-600 text-sm">
                  Revisa tus evaluaciones anteriores
                </p>
              </motion.div>
            </Link>
          </div>
        )}

        {/* Dashboard para TERAPEUTA */}
        {usuario?.rol === 'TERAPEUTA' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/terapeuta/pacientes">
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-teal-200"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-xl flex items-center justify-center mb-4">
                  <FaUsers className="text-3xl text-teal-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Mis Pacientes
                </h3>
                <p className="text-gray-600 text-sm">
                  Gestiona y supervisa a tus pacientes asignados
                </p>
              </motion.div>
            </Link>

            <Link href="/terapeuta/reportes">
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-blue-200"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mb-4">
                  <FaFileAlt className="text-3xl text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Reportes Clínicos
                </h3>
                <p className="text-gray-600 text-sm">
                  Revisa evaluaciones y progreso de pacientes
                </p>
              </motion.div>
            </Link>

            <Link href="/evaluaciones">
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-purple-200"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center mb-4">
                  <FaClipboardList className="text-3xl text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Herramientas de Evaluación
                </h3>
                <p className="text-gray-600 text-sm">
                  Accede a pruebas psicológicas profesionales
                </p>
              </motion.div>
            </Link>

            <Link href="/chat">
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-green-200"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mb-4">
                  <FaRobot className="text-3xl text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Supervisar IA
                </h3>
                <p className="text-gray-600 text-sm">
                  Revisa conversaciones y ajusta parámetros de IA
                </p>
              </motion.div>
            </Link>

            <Link href="/terapeuta/calendario">
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-orange-200"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center mb-4">
                  <FaCalendar className="text-3xl text-orange-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Calendario
                </h3>
                <p className="text-gray-600 text-sm">
                  Programa y gestiona sesiones con pacientes
                </p>
              </motion.div>
            </Link>

            <Link href="/perfil">
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-indigo-200"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl flex items-center justify-center mb-4">
                  <FaUserMd className="text-3xl text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Mi Perfil
                </h3>
                <p className="text-gray-600 text-sm">
                  Gestiona tu información profesional
                </p>
              </motion.div>
            </Link>
          </div>
        )}

        {usuario?.rol === 'ADMIN' && (
          <div className="mt-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Administración
            </h3>
            <Link href="/admin">
              <Boton>
                Ir al Panel de Administración
              </Boton>
            </Link>
          </div>
        )}

        <div className="mt-12 bg-blue-50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            ¿Necesitas ayuda inmediata?
          </h3>
          <p className="text-gray-700 mb-4">
            Si estás pasando por una crisis o necesitas apoyo urgente, aquí hay recursos disponibles:
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Línea Nacional de Prevención del Suicidio: 106 (Colombia)</li>
            <li>• Chat de Crisis: Disponible 24/7</li>
            <li>• Encuentra un profesional cerca de ti</li>
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  );
}