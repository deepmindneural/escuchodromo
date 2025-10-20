'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import {
  FaUsers, FaComments, FaChartLine, FaMoneyBillWave,
  FaCog, FaBell, FaClipboardCheck, FaChartBar,
  FaUserPlus, FaArrowUp, FaArrowDown, FaHistory
} from 'react-icons/fa';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { toast, Toaster } from 'react-hot-toast';
import { obtenerClienteNavegador } from '../../lib/supabase/cliente';

// Importación dinámica para evitar errores de SSR
const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function PaginaAdmin() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [estadisticas, setEstadisticas] = useState<any>({
    totalUsuarios: 2543,
    nuevosUsuariosHoy: 23,
    conversacionesActivas: 187,
    evaluacionesRealizadas: 1234,
    tasaRetencion: 87,
    ingresosMensuales: 125430,
    usuariosActivos: 1876
  });
  const [cargando, setCargando] = useState(true);
  const [vistaActiva, setVistaActiva] = useState('general');

  // Datos para gráficos
  const datosUsuariosPorMes = [
    { mes: 'Ene', usuarios: 1200 },
    { mes: 'Feb', usuarios: 1350 },
    { mes: 'Mar', usuarios: 1680 },
    { mes: 'Abr', usuarios: 1890 },
    { mes: 'May', usuarios: 2150 },
    { mes: 'Jun', usuarios: 2543 }
  ];

  const datosEvaluaciones = [
    { nombre: 'PHQ-9', valor: 456, color: '#3B82F6' },
    { nombre: 'GAD-7', valor: 378, color: '#10B981' },
    { nombre: 'Otras', valor: 400, color: '#8B5CF6' }
  ];

  const opcionesApexChart = {
    chart: {
      type: 'area' as const,
      toolbar: { show: false },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800
      }
    },
    stroke: {
      curve: 'smooth' as const,
      width: 3
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3,
      }
    },
    colors: ['#3B82F6', '#10B981'],
    xaxis: {
      categories: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
    },
    yaxis: {
      title: {
        text: 'Actividad'
      }
    },
    tooltip: {
      theme: 'dark'
    }
  };

  const seriesApexChart = [
    {
      name: 'Conversaciones',
      data: [30, 25, 45, 65, 85, 75, 40]
    },
    {
      name: 'Usuarios Activos',
      data: [20, 35, 30, 55, 75, 65, 35]
    }
  ];

  useEffect(() => {
    verificarAdmin();
  }, []);

  const verificarAdmin = async () => {
    const supabase = obtenerClienteNavegador();

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/iniciar-sesion');
        return;
      }

      // Obtener datos del usuario
      const { data: usuarioData, error } = await supabase
        .from('Usuario')
        .select('id, email, nombre, rol')
        .eq('auth_id', session.user.id)
        .single();

      if (error || !usuarioData) {
        router.push('/iniciar-sesion');
        return;
      }

      // Verificar que sea admin
      if (usuarioData.rol !== 'ADMIN') {
        router.push('/dashboard');
        return;
      }

      setUsuario(usuarioData);
      await cargarEstadisticas();
    } catch (error) {
      console.error('Error al verificar admin:', error);
      router.push('/iniciar-sesion');
    }
  };

  const cargarEstadisticas = async () => {
    const supabase = obtenerClienteNavegador();

    try {
      // Total de usuarios
      const { count: totalUsuarios } = await supabase
        .from('Usuario')
        .select('*', { count: 'exact', head: true });

      // Usuarios nuevos hoy
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const { count: nuevosUsuariosHoy } = await supabase
        .from('Usuario')
        .select('*', { count: 'exact', head: true })
        .gte('creado_en', hoy.toISOString());

      // Total de conversaciones
      const { count: conversacionesActivas } = await supabase
        .from('Conversacion')
        .select('*', { count: 'exact', head: true });

      // Total de evaluaciones (resultados de pruebas)
      const { count: evaluacionesRealizadas } = await supabase
        .from('Resultado')
        .select('*', { count: 'exact', head: true });

      // Suscripciones activas
      const { count: suscripcionesActivas } = await supabase
        .from('Suscripcion')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'activa');

      // Calcular ingresos mensuales (suma de suscripciones activas)
      const { data: suscripciones } = await supabase
        .from('Suscripcion')
        .select('precio')
        .eq('estado', 'activa');

      const ingresosMensuales = suscripciones?.reduce((sum, s) => sum + (s.precio || 0), 0) || 0;

      setEstadisticas({
        totalUsuarios: totalUsuarios || 0,
        nuevosUsuariosHoy: nuevosUsuariosHoy || 0,
        conversacionesActivas: conversacionesActivas || 0,
        evaluacionesRealizadas: evaluacionesRealizadas || 0,
        tasaRetencion: suscripcionesActivas && totalUsuarios
          ? Math.round((suscripcionesActivas / totalUsuarios) * 100)
          : 0,
        ingresosMensuales: Math.round(ingresosMensuales),
        usuariosActivos: suscripcionesActivas || 0
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      toast.error('Error al cargar estadísticas');
    } finally {
      setCargando(false);
    }
  };

  const cerrarSesion = async () => {
    const supabase = obtenerClienteNavegador();
    await supabase.auth.signOut();
    router.push('/');
  };

  const tarjetasEstadisticas = [
    {
      titulo: 'Total Usuarios',
      valor: estadisticas.totalUsuarios,
      cambio: estadisticas.nuevosUsuariosHoy,
      icono: FaUsers,
      color: 'from-blue-400 to-blue-600',
      tendencia: 'up'
    },
    {
      titulo: 'Conversaciones Activas',
      valor: estadisticas.conversacionesActivas,
      cambio: 12,
      icono: FaComments,
      color: 'from-green-400 to-green-600',
      tendencia: 'up'
    },
    {
      titulo: 'Evaluaciones',
      valor: estadisticas.evaluacionesRealizadas,
      cambio: -5,
      icono: FaClipboardCheck,
      color: 'from-purple-400 to-purple-600',
      tendencia: 'down'
    },
    {
      titulo: 'Tasa de Retención',
      valor: estadisticas.tasaRetencion,
      sufijo: '%',
      cambio: 3,
      icono: FaChartLine,
      color: 'from-orange-400 to-orange-600',
      tendencia: 'up'
    }
  ];

  if (cargando) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Cargando panel de administración"
        className="min-h-screen bg-gray-50 flex items-center justify-center"
      >
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div
            className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"
            aria-hidden="true"
          ></div>
          <p className="mt-4 text-gray-600 text-lg">Cargando panel de administración...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />

      {/* Header de la página */}
      <div className="bg-white border-b border-gray-200 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Panel de Control</h1>
              <p className="text-gray-600 mt-1">
                Bienvenido de vuelta, {usuario?.nombre || 'Administrador'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {tarjetasEstadisticas.map((tarjeta, index) => (
            <motion.div
              key={tarjeta.titulo}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${tarjeta.color}`}>
                      <tarjeta.icono className="text-2xl text-white" aria-hidden="true" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {tarjeta.titulo}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    <CountUp
                      end={tarjeta.valor}
                      duration={2}
                      suffix={tarjeta.sufijo}
                    />
                  </p>
                  <div className="flex items-center mt-2">
                    {tarjeta.tendencia === 'up' ? (
                      <FaArrowUp className="text-green-500 mr-1 text-xs" />
                    ) : (
                      <FaArrowDown className="text-red-500 mr-1 text-xs" />
                    )}
                    <span className={`text-sm font-medium ${
                      tarjeta.tendencia === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {Math.abs(tarjeta.cambio)} hoy
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Gráficos principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de actividad en tiempo real */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Actividad en Tiempo Real
            </h3>
            <div className="h-64">
              <ApexChart
                options={{
                  ...opcionesApexChart,
                  chart: {
                    ...opcionesApexChart.chart,
                    background: 'transparent'
                  },
                  colors: ['#14B8A6', '#06B6D4'],
                  tooltip: { theme: 'light' }
                }}
                series={seriesApexChart}
                type="area"
                height="100%"
              />
            </div>
          </motion.div>

          {/* Gráfico de crecimiento de usuarios */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Crecimiento de Usuarios
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={datosUsuariosPorMes}>
                <defs>
                  <linearGradient id="colorUsuarios" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="mes" stroke="#6B7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="usuarios"
                  stroke="#14B8A6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorUsuarios)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Gráfico circular y acciones rápidas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Distribución de evaluaciones */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Evaluaciones por Tipo
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={datosEvaluaciones}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="valor"
                  label={({ nombre, percent }: any) => `${nombre} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {datosEvaluaciones.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Accesos rápidos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Acciones Rápidas
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  titulo: 'Historiales de Usuarios',
                  icono: FaHistory,
                  color: 'from-teal-500 to-cyan-500',
                  href: '/admin/historiales'
                },
                {
                  titulo: 'Gestión de Usuarios',
                  icono: FaUsers,
                  color: 'from-blue-500 to-blue-600',
                  href: '/admin/usuarios'
                },
                {
                  titulo: 'Profesionales',
                  icono: FaUserPlus,
                  color: 'from-green-500 to-green-600',
                  href: '/admin/profesionales'
                },
                {
                  titulo: 'Configuración',
                  icono: FaCog,
                  color: 'from-purple-500 to-purple-600',
                  href: '/admin/configuracion'
                }
              ].map((accion, index) => (
                <Link key={index} href={accion.href}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`bg-gradient-to-br ${accion.color} p-6 rounded-lg cursor-pointer shadow-sm hover:shadow-md transition-shadow`}
                  >
                    <accion.icono className="text-3xl text-white mb-3" />
                    <p className="text-white font-medium text-sm">{accion.titulo}</p>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Actividad reciente */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaBell className="mr-2 text-teal-500" aria-hidden="true" />
            Actividad Reciente
          </h3>
          <div className="space-y-3">
            {[
              { tipo: 'usuario', mensaje: 'Nuevo usuario registrado', tiempo: 'hace 5 minutos' },
              { tipo: 'evaluacion', mensaje: '3 evaluaciones PHQ-9 completadas', tiempo: 'hace 1 hora' },
              { tipo: 'sistema', mensaje: 'Backup automático completado', tiempo: 'hace 2 horas' },
              { tipo: 'pago', mensaje: 'Nueva suscripción premium', tiempo: 'hace 3 horas' }
            ].map((actividad, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-3 ${
                    actividad.tipo === 'usuario' ? 'bg-blue-500' :
                    actividad.tipo === 'evaluacion' ? 'bg-green-500' :
                    actividad.tipo === 'sistema' ? 'bg-purple-500' : 'bg-orange-500'
                  }`} />
                  <span className="text-gray-700 font-medium">{actividad.mensaje}</span>
                </div>
                <span className="text-gray-500 text-sm">{actividad.tiempo}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>
    </>
  );
}