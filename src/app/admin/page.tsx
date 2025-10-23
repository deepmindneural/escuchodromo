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
import AlertasCriticas from '../../lib/componentes/admin/AlertasCriticas';
import { AdminHeader, AdminStatCard } from '../../lib/componentes/admin';

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
  const [datosEvaluacionesPorTipo, setDatosEvaluacionesPorTipo] = useState<any[]>([
    { nombre: 'PHQ-9', valor: 0, color: '#3B82F6' },
    { nombre: 'GAD-7', valor: 0, color: '#10B981' },
    { nombre: 'Otras', valor: 0, color: '#8B5CF6' }
  ]);
  const [datosUsuariosPorMes, setDatosUsuariosPorMes] = useState<any[]>([]);
  const [datosSeveridad, setDatosSeveridad] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [vistaActiva, setVistaActiva] = useState('general');

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
      // Usar función RPC optimizada que obtiene todo en una sola query
      const { data: stats, error: statsError } = await supabase
        .rpc('obtener_estadisticas_dashboard');

      if (statsError) {
        console.error('Error al cargar estadísticas del dashboard:', statsError);
        toast.error('Error al cargar estadísticas');
        return;
      }

      // Extraer valores de la respuesta RPC
      const totalUsuarios = stats?.total_usuarios || 0;
      const nuevosUsuariosHoy = stats?.nuevos_usuarios_hoy || 0;
      const conversacionesActivas = stats?.conversaciones_activas || 0;
      const evaluacionesRealizadas = stats?.evaluaciones_realizadas || 0;
      const suscripcionesActivas = stats?.suscripciones_activas || 0;
      const ingresosMensuales = parseFloat(stats?.ingresos_mensuales || 0);

      // Obtener crecimiento de usuarios usando RPC
      const { data: crecimientoData, error: crecimientoError } = await supabase
        .rpc('obtener_crecimiento_usuarios', { p_meses: 6 });

      if (!crecimientoError && crecimientoData) {
        setDatosUsuariosPorMes(crecimientoData.map((item: any) => ({
          mes: item.mes,
          usuarios: item.total_usuarios
        })));
      }

      // Para distribución de evaluaciones, necesitamos hacer queries manuales
      // ya que no hay RPC específico para esto
      // Primero obtener los IDs de los tests PHQ-9 y GAD-7
      const { data: tests } = await supabase
        .from('Test')
        .select('id, codigo')
        .in('codigo', ['PHQ-9', 'GAD-7']);

      const phq9Test = tests?.find(t => t.codigo === 'PHQ-9');
      const gad7Test = tests?.find(t => t.codigo === 'GAD-7');

      const { count: countPhq9 } = await supabase
        .from('Evaluacion')
        .select('*', { count: 'exact', head: true })
        .eq('test_id', phq9Test?.id || '00000000-0000-0000-0000-000000000000');

      const { count: countGad7 } = await supabase
        .from('Evaluacion')
        .select('*', { count: 'exact', head: true })
        .eq('test_id', gad7Test?.id || '00000000-0000-0000-0000-000000000000');

      const totalEvaluaciones = evaluacionesRealizadas || 0;
      const phq9Count = countPhq9 || 0;
      const gad7Count = countGad7 || 0;
      const otrasCount = Math.max(0, totalEvaluaciones - phq9Count - gad7Count);

      setDatosEvaluacionesPorTipo([
        { nombre: 'PHQ-9', valor: phq9Count, color: '#3B82F6' },
        { nombre: 'GAD-7', valor: gad7Count, color: '#10B981' },
        { nombre: 'Otras', valor: otrasCount, color: '#8B5CF6' }
      ]);

      // Para severidad, también necesitamos query manual
      const { data: evaluacionesConSeveridad } = await supabase
        .from('Evaluacion')
        .select('severidad');

      const distribucionSeveridad: any = {
        'minima': 0,
        'leve': 0,
        'moderada': 0,
        'moderadamente_severa': 0,
        'severa': 0
      };

      evaluacionesConSeveridad?.forEach((e: any) => {
        const sev = e.severidad?.toLowerCase();
        if (sev && distribucionSeveridad[sev] !== undefined) {
          distribucionSeveridad[sev]++;
        }
      });

      setDatosSeveridad([
        { nombre: 'Mínima', valor: distribucionSeveridad.minima, color: '#10B981' },
        { nombre: 'Leve', valor: distribucionSeveridad.leve, color: '#3B82F6' },
        { nombre: 'Moderada', valor: distribucionSeveridad.moderada, color: '#F59E0B' },
        { nombre: 'Mod. Severa', valor: distribucionSeveridad.moderadamente_severa, color: '#EF4444' },
        { nombre: 'Severa', valor: distribucionSeveridad.severa, color: '#DC2626' }
      ]);

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
      color: 'from-teal-400 to-teal-600',
      tendencia: 'up'
    },
    {
      titulo: 'Conversaciones Activas',
      valor: estadisticas.conversacionesActivas,
      cambio: 12,
      icono: FaComments,
      color: 'from-cyan-400 to-cyan-600',
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
      color: 'from-amber-400 to-orange-600',
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
      <AdminHeader
        titulo={`¡Hola, ${usuario?.nombre || 'Administrador'}! 👋`}
        descripcion="Bienvenido a tu espacio de administración - Gestiona y supervisa tu plataforma de bienestar emocional"
        icono="📊"
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Alertas Críticas */}
        <div className="mb-8">
          <AlertasCriticas />
        </div>

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {tarjetasEstadisticas.map((tarjeta, index) => (
            <AdminStatCard
              key={tarjeta.titulo}
              titulo={tarjeta.titulo}
              valor={tarjeta.valor}
              icono={tarjeta.icono}
              color={tarjeta.color}
              cambio={tarjeta.cambio}
              tendencia={tarjeta.tendencia as 'up' | 'down' | 'neutral'}
              sufijo={tarjeta.sufijo || ''}
              delay={index * 0.1}
            />
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

        {/* Gráficos de distribución */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
                  data={datosEvaluacionesPorTipo}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="valor"
                  label={({ nombre, percent }: any) => `${nombre} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {datosEvaluacionesPorTipo.map((entry, index) => (
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

          {/* Distribución por severidad */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">📊</span>
              Distribución por Severidad
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={datosSeveridad}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="nombre"
                  stroke="#6B7280"
                  style={{ fontSize: '11px' }}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                  {datosSeveridad.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Accesos rápidos */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Acciones Rápidas
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
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
                  titulo: 'Gestión de Citas',
                  icono: FaClipboardCheck,
                  color: 'from-purple-500 to-purple-600',
                  href: '/admin/citas'
                },
                {
                  titulo: 'Pagos y Facturación',
                  icono: FaMoneyBillWave,
                  color: 'from-orange-500 to-orange-600',
                  href: '/admin/pagos'
                },
                {
                  titulo: 'Analytics',
                  icono: FaChartBar,
                  color: 'from-indigo-500 to-indigo-600',
                  href: '/admin/analytics'
                },
                {
                  titulo: 'Historiales',
                  icono: FaHistory,
                  color: 'from-teal-500 to-cyan-500',
                  href: '/admin/historiales'
                },
                {
                  titulo: 'Suscripciones',
                  icono: FaChartLine,
                  color: 'from-pink-500 to-pink-600',
                  href: '/admin/suscripciones'
                },
                {
                  titulo: 'Configuración',
                  icono: FaCog,
                  color: 'from-gray-500 to-gray-600',
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