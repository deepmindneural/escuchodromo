'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FaArrowLeft, FaSpinner, FaChartLine, FaSmile, FaBolt,
  FaExclamationTriangle, FaCalendarAlt, FaCheckCircle, FaTrophy,
  FaArrowUp, FaArrowDown, FaMinus
} from 'react-icons/fa';
import Navegacion from '../../lib/componentes/layout/Navegacion';
import Footer from '../../lib/componentes/layout/Footer';
import { useUsuario, usePerfilUsuario } from '../../lib/supabase/hooks';
import { obtenerClienteNavegador } from '../../lib/supabase/cliente';

interface RegistroAnimo {
  id: string;
  usuario_id: string;
  animo: number;
  energia: number;
  estres: number;
  notas: string | null;
  creado_en: string;
}

interface Resultado {
  id: string;
  puntuacion: number;
  severidad: string;
  creado_en: string;
  Test?: {
    nombre: string;
    codigo: string;
  };
}

export default function PaginaProgreso() {
  const router = useRouter();
  const { usuario: authUsuario, cargando: cargandoAuth } = useUsuario();
  const { perfil } = usePerfilUsuario();
  const supabase = obtenerClienteNavegador();

  const [cargando, setCargando] = useState(true);
  const [registrosAnimo, setRegistrosAnimo] = useState<RegistroAnimo[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<Resultado[]>([]);
  const [estadisticas, setEstadisticas] = useState({
    totalConversaciones: 0,
    totalMensajes: 0,
    diasActivo: 0,
    rachaActual: 0,
  });

  useEffect(() => {
    if (!cargandoAuth && !authUsuario) {
      router.push('/iniciar-sesion');
    }
  }, [authUsuario, cargandoAuth, router]);

  useEffect(() => {
    if (perfil?.id) {
      cargarDatos();
    }
  }, [perfil?.id]);

  const cargarDatos = async () => {
    if (!perfil?.id) return;

    try {
      setCargando(true);

      // Cargar registros de ánimo
      const { data: animoData } = await supabase
        .from('RegistroAnimo')
        .select('*')
        .eq('usuario_id', perfil.id)
        .order('creado_en', { ascending: false })
        .limit(30);

      if (animoData) {
        setRegistrosAnimo(animoData);
      }

      // Cargar evaluaciones
      const { data: evaluacionesData } = await supabase
        .from('Resultado')
        .select(`
          *,
          Test (
            nombre,
            codigo
          )
        `)
        .eq('usuario_id', perfil.id)
        .order('creado_en', { ascending: false })
        .limit(10);

      if (evaluacionesData) {
        setEvaluaciones(evaluacionesData);
      }

      // Cargar estadísticas de conversaciones
      const { count: totalConversaciones } = await supabase
        .from('Conversacion')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', perfil.id);

      const { count: totalMensajes } = await supabase
        .from('Mensaje')
        .select('conversacion_id', { count: 'exact', head: true })
        .in('conversacion_id',
          await supabase
            .from('Conversacion')
            .select('id')
            .eq('usuario_id', perfil.id)
            .then(res => res.data?.map(c => c.id) || [])
        );

      setEstadisticas({
        totalConversaciones: totalConversaciones || 0,
        totalMensajes: totalMensajes || 0,
        diasActivo: animoData?.length || 0,
        rachaActual: calcularRacha(animoData || []),
      });

    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setCargando(false);
    }
  };

  const calcularRacha = (registros: RegistroAnimo[]): number => {
    if (registros.length === 0) return 0;

    let racha = 1;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    for (let i = 0; i < registros.length - 1; i++) {
      const fecha1 = new Date(registros[i].creado_en);
      const fecha2 = new Date(registros[i + 1].creado_en);
      fecha1.setHours(0, 0, 0, 0);
      fecha2.setHours(0, 0, 0, 0);

      const diffDias = Math.floor((fecha1.getTime() - fecha2.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDias === 1) {
        racha++;
      } else {
        break;
      }
    }

    return racha;
  };

  const calcularPromedio = (registros: RegistroAnimo[], campo: 'animo' | 'energia' | 'estres') => {
    if (registros.length === 0) return 0;
    const suma = registros.reduce((acc, reg) => acc + reg[campo], 0);
    return Math.round(suma / registros.length);
  };

  const calcularTendencia = (registros: RegistroAnimo[], campo: 'animo' | 'energia' | 'estres') => {
    if (registros.length < 2) return 'neutral';

    const recientes = registros.slice(0, 5);
    const anteriores = registros.slice(5, 10);

    if (recientes.length === 0 || anteriores.length === 0) return 'neutral';

    const promedioReciente = recientes.reduce((acc, reg) => acc + reg[campo], 0) / recientes.length;
    const promedioAnterior = anteriores.reduce((acc, reg) => acc + reg[campo], 0) / anteriores.length;

    const diferencia = promedioReciente - promedioAnterior;

    // Para estrés, tendencia invertida (menos es mejor)
    if (campo === 'estres') {
      if (diferencia < -0.5) return 'mejorando';
      if (diferencia > 0.5) return 'empeorando';
      return 'neutral';
    }

    // Para ánimo y energía (más es mejor)
    if (diferencia > 0.5) return 'mejorando';
    if (diferencia < -0.5) return 'empeorando';
    return 'neutral';
  };

  const obtenerIconoTendencia = (tendencia: string) => {
    if (tendencia === 'mejorando') return <FaArrowUp className="text-green-500" />;
    if (tendencia === 'empeorando') return <FaArrowDown className="text-red-500" />;
    return <FaMinus className="text-gray-400" />;
  };

  const obtenerColorNivel = (valor: number, max: number = 10) => {
    const porcentaje = (valor / max) * 100;
    if (porcentaje >= 80) return 'text-green-600';
    if (porcentaje >= 60) return 'text-blue-600';
    if (porcentaje >= 40) return 'text-yellow-600';
    if (porcentaje >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  const promedioAnimo = calcularPromedio(registrosAnimo, 'animo');
  const promedioEnergia = calcularPromedio(registrosAnimo, 'energia');
  const promedioEstres = calcularPromedio(registrosAnimo, 'estres');

  const tendenciaAnimo = calcularTendencia(registrosAnimo, 'animo');
  const tendenciaEnergia = calcularTendencia(registrosAnimo, 'energia');
  const tendenciaEstres = calcularTendencia(registrosAnimo, 'estres');

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
        <Navegacion />
        <div className="pt-32 flex items-center justify-center">
          <div className="text-center">
            <FaSpinner className="h-16 w-16 text-teal-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Cargando métricas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      <Navegacion />

      <div className="pt-28 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/dashboard">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <FaArrowLeft className="text-teal-600" />
              </motion.button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Mi Progreso</h1>
              <p className="text-gray-600 text-lg">
                Seguimiento de tu bienestar emocional
              </p>
            </div>
          </div>

          {/* Tarjetas de Estadísticas Principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100">Días Activo</span>
                <FaCalendarAlt className="text-3xl text-blue-200" />
              </div>
              <p className="text-4xl font-bold">{estadisticas.diasActivo}</p>
              <p className="text-sm text-blue-100 mt-2">Registros de ánimo</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-purple-100">Racha Actual</span>
                <FaTrophy className="text-3xl text-purple-200" />
              </div>
              <p className="text-4xl font-bold">{estadisticas.rachaActual}</p>
              <p className="text-sm text-purple-100 mt-2">Días consecutivos</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-100">Conversaciones</span>
                <FaCheckCircle className="text-3xl text-green-200" />
              </div>
              <p className="text-4xl font-bold">{estadisticas.totalConversaciones}</p>
              <p className="text-sm text-green-100 mt-2">Con la IA</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-6 text-white"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-orange-100">Evaluaciones</span>
                <FaChartLine className="text-3xl text-orange-200" />
              </div>
              <p className="text-4xl font-bold">{evaluaciones.length}</p>
              <p className="text-sm text-orange-100 mt-2">Realizadas</p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Métricas de Bienestar */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FaSmile className="text-teal-500" />
                Métricas de Bienestar
              </h2>

              {registrosAnimo.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No hay registros de ánimo aún</p>
                  <Link href="/animo">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      Registrar Ánimo
                    </motion.button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Ánimo */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 font-medium flex items-center gap-2">
                        😊 Ánimo Promedio
                        {obtenerIconoTendencia(tendenciaAnimo)}
                      </span>
                      <span className={`text-2xl font-bold ${obtenerColorNivel(promedioAnimo)}`}>
                        {promedioAnimo}/10
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(promedioAnimo / 10) * 100}%` }}
                        className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full h-3"
                      />
                    </div>
                  </div>

                  {/* Energía */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 font-medium flex items-center gap-2">
                        ⚡ Energía Promedio
                        {obtenerIconoTendencia(tendenciaEnergia)}
                      </span>
                      <span className={`text-2xl font-bold ${obtenerColorNivel(promedioEnergia)}`}>
                        {promedioEnergia}/10
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(promedioEnergia / 10) * 100}%` }}
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full h-3"
                      />
                    </div>
                  </div>

                  {/* Estrés */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 font-medium flex items-center gap-2">
                        😰 Estrés Promedio
                        {obtenerIconoTendencia(tendenciaEstres)}
                      </span>
                      <span className={`text-2xl font-bold ${obtenerColorNivel(10 - promedioEstres)}`}>
                        {promedioEstres}/10
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(promedioEstres / 10) * 100}%` }}
                        className="bg-gradient-to-r from-red-500 to-pink-500 rounded-full h-3"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      Basado en {registrosAnimo.length} registro{registrosAnimo.length !== 1 ? 's' : ''} de los últimos 30 días
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Historial de Evaluaciones */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FaChartLine className="text-purple-500" />
                Evaluaciones Recientes
              </h2>

              {evaluaciones.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No hay evaluaciones aún</p>
                  <Link href="/evaluaciones">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      Realizar Evaluación
                    </motion.button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {evaluaciones.map((evaluacion, index) => (
                    <motion.div
                      key={evaluacion.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {evaluacion.Test?.nombre || 'Evaluación'}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {new Date(evaluacion.creado_en).toLocaleDateString('es-CO', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-teal-600">
                            {evaluacion.puntuacion}
                          </p>
                          <p className="text-xs text-gray-600">
                            {evaluacion.severidad}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  <Link href="/evaluaciones/historial">
                    <button className="w-full text-center py-3 text-teal-600 hover:text-teal-700 font-medium">
                      Ver historial completo →
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Registros de Ánimo Recientes */}
          {registrosAnimo.length > 0 && (
            <div className="mt-8 bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Registros de Ánimo Recientes
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {registrosAnimo.slice(0, 6).map((registro, index) => (
                  <motion.div
                    key={registro.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-600">
                        {new Date(registro.creado_en).toLocaleDateString('es-CO', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">😊 Ánimo</span>
                        <span className="font-semibold">{registro.animo}/10</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">⚡ Energía</span>
                        <span className="font-semibold">{registro.energia}/10</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">😰 Estrés</span>
                        <span className="font-semibold">{registro.estres}/10</span>
                      </div>
                    </div>

                    {registro.notas && (
                      <p className="mt-3 text-xs text-gray-600 italic line-clamp-2">
                        "{registro.notas}"
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>

              <Link href="/animo">
                <button className="w-full mt-6 text-center py-3 text-teal-600 hover:text-teal-700 font-medium">
                  Ver todos los registros →
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
