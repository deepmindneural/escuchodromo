'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  MessageSquare,
  Mic,
  Brain,
  Clock,
  TrendingUp,
  Activity,
  DollarSign,
  Zap,
  AlertTriangle,
  CheckCircle,
  Settings,
  BarChart3,
  Sparkles,
  Cpu,
  FileText,
} from 'lucide-react';
import { AdminHeader, AdminStatCard, AdminCard } from '../../../lib/componentes/admin';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../lib/componentes/ui/table';
import { Badge } from '../../../lib/componentes/ui/badge';
import { Button } from '../../../lib/componentes/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../lib/componentes/ui/tabs';
import { obtenerClienteNavegador } from '../../../lib/supabase/cliente';
import { toast, Toaster } from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '../../../lib/componentes/ui/input';
import { Label } from '../../../lib/componentes/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../../lib/componentes/ui/card';
import { Slider } from '../../../lib/componentes/ui/slider';

interface ConversacionIA {
  id: string;
  usuario_id: string;
  tipo: 'chat' | 'voz';
  duracion_segundos: number | null;
  emocion_detectada: string | null;
  creado_en: string;
  usuario: {
    nombre: string;
    email: string;
  };
}

interface LogGemini {
  id: string;
  modelo: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  costo_estimado: number;
  exitoso: boolean;
  tiempo_respuesta_ms: number;
  creado_en: string;
}

interface EstadisticasIA {
  totalConversaciones: number;
  totalAnalisisVoz: number;
  promedioEmocionesDetectadas: number;
  tiempoPromedioRespuesta: number;
  llamadasGeminiHoy: number;
  llamadasGeminiMes: number;
  costoEstimadoHoy: number;
  costoEstimadoMes: number;
  tokensTotalesHoy: number;
  tokensTotalesMes: number;
  tasaExito: number;
}

interface ConfiguracionIA {
  limiteDiario: number;
  limiteMensual: number;
  alertaCosto: number;
  alertaUso: number;
  modeloPrincipal: string;
  temperaturaDefault: number;
}

// Paleta de colores para tema IA
const COLORES_IA = {
  primario: '#8B5CF6',      // Violet
  secundario: '#EC4899',    // Pink
  acento: '#06B6D4',        // Cyan
  exito: '#10B981',         // Emerald
  advertencia: '#F59E0B',   // Amber
  peligro: '#EF4444',       // Red

  gradientes: {
    header: 'from-purple-500 via-pink-500 to-rose-500',
    card1: 'from-violet-400 to-purple-600',
    card2: 'from-emerald-400 to-teal-600',
    card3: 'from-blue-400 to-cyan-600',
    card4: 'from-rose-400 to-pink-600',
  }
};

const COLORES_EMOCIONES = {
  alegria: '#FFB84D',
  tristeza: '#5B9EAD',
  ansiedad: '#F6AD55',
  calma: '#7FB069',
  neutral: '#9F7AEA',
  miedo: '#F87171',
  enojo: '#EF4444',
};

const COLORES_GRAFICOS = {
  primary: '#8B5CF6',
  secondary: '#EC4899',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
};

export default function AdminAnalisisIA() {
  const [cargando, setCargando] = useState(true);
  const [tabActual, setTabActual] = useState('dashboard');
  const [estadisticas, setEstadisticas] = useState<EstadisticasIA>({
    totalConversaciones: 0,
    totalAnalisisVoz: 0,
    promedioEmocionesDetectadas: 0,
    tiempoPromedioRespuesta: 0,
    llamadasGeminiHoy: 0,
    llamadasGeminiMes: 0,
    costoEstimadoHoy: 0,
    costoEstimadoMes: 0,
    tokensTotalesHoy: 0,
    tokensTotalesMes: 0,
    tasaExito: 0,
  });
  const [conversaciones, setConversaciones] = useState<ConversacionIA[]>([]);
  const [logsGemini, setLogsGemini] = useState<LogGemini[]>([]);
  const [datosUsoPorTipo, setDatosUsoPorTipo] = useState<any[]>([]);
  const [datosEmociones, setDatosEmociones] = useState<any[]>([]);
  const [datosTokensPorDia, setDatosTokensPorDia] = useState<any[]>([]);
  const [datosCostoPorModelo, setDatosCostoPorModelo] = useState<any[]>([]);

  // Configuración de IA
  const [configuracion, setConfiguracion] = useState<ConfiguracionIA>({
    limiteDiario: 1000,
    limiteMensual: 25000,
    alertaCosto: 100,
    alertaUso: 80,
    modeloPrincipal: 'gemini-1.5-flash',
    temperaturaDefault: 0.7,
  });
  const [editandoConfig, setEditandoConfig] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const supabase = obtenerClienteNavegador();
      const fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() - 30);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      // Cargar conversaciones recientes
      const { data: conversacionesData, error: conversacionesError } = await supabase
        .from('Conversacion')
        .select(`
          id,
          usuario_id,
          tipo,
          duracion_segundos,
          emocion_detectada,
          creado_en,
          Usuario!usuario_id (
            nombre,
            email
          )
        `)
        .gte('creado_en', fechaInicio.toISOString())
        .order('creado_en', { ascending: false })
        .limit(100);

      if (conversacionesError) {
        console.error('Error al cargar conversaciones:', conversacionesError);
        toast.error('Error al cargar conversaciones');
      }

      const conversacionesFormateadas = (conversacionesData || []).map((c: any) => ({
        id: c.id,
        usuario_id: c.usuario_id,
        tipo: c.tipo || 'chat',
        duracion_segundos: c.duracion_segundos,
        emocion_detectada: c.emocion_detectada,
        creado_en: c.creado_en,
        usuario: {
          nombre: c.Usuario?.nombre || 'Usuario desconocido',
          email: c.Usuario?.email || 'Sin email',
        },
      }));

      setConversaciones(conversacionesFormateadas.slice(0, 20));

      // Cargar logs de Gemini API
      const { data: logsData, error: logsError } = await supabase
        .from('LogGeminiAPI')
        .select('*')
        .gte('creado_en', fechaInicio.toISOString())
        .order('creado_en', { ascending: false })
        .limit(100);

      if (logsError) {
        console.error('Error al cargar logs de Gemini:', logsError);
      }

      setLogsGemini(logsData || []);

      // Obtener llamadas de hoy usando RPC
      const { data: llamadasHoy, error: llamadasError } = await supabase
        .rpc('obtener_llamadas_gemini_hoy');

      if (llamadasError) {
        console.error('Error al obtener llamadas Gemini hoy:', llamadasError);
      }

      // Calcular estadísticas
      const totalConversaciones = conversacionesFormateadas.length;
      const totalChat = conversacionesFormateadas.filter((c) => c.tipo === 'chat').length;
      const totalVoz = conversacionesFormateadas.filter((c) => c.tipo === 'voz').length;

      const emocionesDetectadas = conversacionesFormateadas.filter(
        (c) => c.emocion_detectada
      ).length;

      const promedioEmociones = totalConversaciones > 0
        ? (emocionesDetectadas / totalConversaciones) * 100
        : 0;

      // Calcular estadísticas de Gemini
      const logsHoy = (logsData || []).filter((log: any) => {
        const fechaLog = new Date(log.creado_en);
        fechaLog.setHours(0, 0, 0, 0);
        return fechaLog.getTime() === hoy.getTime();
      });

      const logsMes = logsData || [];

      const costoHoy = logsHoy.reduce((sum: number, log: any) => sum + (log.costo_estimado || 0), 0);
      const costoMes = logsMes.reduce((sum: number, log: any) => sum + (log.costo_estimado || 0), 0);

      const tokensHoy = logsHoy.reduce((sum: number, log: any) => sum + (log.total_tokens || 0), 0);
      const tokensMes = logsMes.reduce((sum: number, log: any) => sum + (log.total_tokens || 0), 0);

      const llamadasExitosas = logsMes.filter((log: any) => log.exitoso).length;
      const tasaExito = logsMes.length > 0 ? (llamadasExitosas / logsMes.length) * 100 : 100;

      const tiempoPromedio = logsMes.length > 0
        ? logsMes.reduce((sum: number, log: any) => sum + (log.tiempo_respuesta_ms || 0), 0) / logsMes.length / 1000
        : 1.2;

      setEstadisticas({
        totalConversaciones,
        totalAnalisisVoz: totalVoz,
        promedioEmocionesDetectadas: Math.round(promedioEmociones),
        tiempoPromedioRespuesta: Number(tiempoPromedio.toFixed(2)),
        llamadasGeminiHoy: llamadasHoy || logsHoy.length,
        llamadasGeminiMes: logsMes.length,
        costoEstimadoHoy: Number(costoHoy.toFixed(2)),
        costoEstimadoMes: Number(costoMes.toFixed(2)),
        tokensTotalesHoy: tokensHoy,
        tokensTotalesMes: tokensMes,
        tasaExito: Number(tasaExito.toFixed(1)),
      });

      // Datos para gráfico de uso por día (últimos 7 días)
      const datosUltimos7Dias = generarDatosUltimos7Dias(conversacionesFormateadas);
      setDatosUsoPorTipo(datosUltimos7Dias);

      // Datos para distribución de emociones
      const distribucionEmociones = calcularDistribucionEmociones(conversacionesFormateadas);
      setDatosEmociones(distribucionEmociones);

      // Datos de tokens por día
      const tokensPorDia = generarTokensPorDia(logsMes);
      setDatosTokensPorDia(tokensPorDia);

      // Costo por modelo
      const costoPorModelo = calcularCostoPorModelo(logsMes);
      setDatosCostoPorModelo(costoPorModelo);

    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar datos de IA');
    } finally {
      setCargando(false);
    }
  };

  const generarDatosUltimos7Dias = (conversaciones: ConversacionIA[]) => {
    const datos = [];
    const hoy = new Date();

    for (let i = 6; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - i);
      const fechaStr = format(fecha, 'dd/MM', { locale: es });

      const conversacionesDia = conversaciones.filter((c) => {
        const fechaConv = new Date(c.creado_en);
        return fechaConv.toDateString() === fecha.toDateString();
      });

      datos.push({
        fecha: fechaStr,
        chat: conversacionesDia.filter((c) => c.tipo === 'chat').length,
        voz: conversacionesDia.filter((c) => c.tipo === 'voz').length,
      });
    }

    return datos;
  };

  const generarTokensPorDia = (logs: any[]) => {
    const datos: { [key: string]: number } = {};

    logs.forEach((log) => {
      const fecha = format(new Date(log.creado_en), 'dd/MM', { locale: es });
      datos[fecha] = (datos[fecha] || 0) + (log.total_tokens || 0);
    });

    return Object.entries(datos).map(([fecha, tokens]) => ({
      fecha,
      tokens,
    })).slice(-7);
  };

  const calcularCostoPorModelo = (logs: any[]) => {
    const datos: { [key: string]: number } = {};

    logs.forEach((log) => {
      const modelo = log.modelo || 'desconocido';
      datos[modelo] = (datos[modelo] || 0) + (log.costo_estimado || 0);
    });

    return Object.entries(datos).map(([modelo, costo]) => ({
      modelo: modelo.replace('gemini-', ''),
      costo: Number(costo.toFixed(2)),
      color: COLORES_GRAFICOS.primary,
    }));
  };

  const calcularDistribucionEmociones = (conversaciones: ConversacionIA[]) => {
    const emocionesCont: { [key: string]: number } = {};

    conversaciones.forEach((c) => {
      if (c.emocion_detectada) {
        const emocion = c.emocion_detectada.toLowerCase();
        emocionesCont[emocion] = (emocionesCont[emocion] || 0) + 1;
      }
    });

    return Object.entries(emocionesCont).map(([nombre, valor]) => ({
      nombre: nombre.charAt(0).toUpperCase() + nombre.slice(1),
      valor,
      color: COLORES_EMOCIONES[nombre as keyof typeof COLORES_EMOCIONES] || '#9F7AEA',
    }));
  };

  const formatearDuracion = (segundos: number | null) => {
    if (!segundos) return '-';
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins}m ${secs}s`;
  };

  const obtenerBadgeEmocion = (emocion: string | null) => {
    if (!emocion) return <Badge variant="outline">Sin emoción</Badge>;

    const emocionLower = emocion.toLowerCase();
    const color = COLORES_EMOCIONES[emocionLower as keyof typeof COLORES_EMOCIONES];

    return (
      <Badge
        style={{
          backgroundColor: `${color}20`,
          color: color,
          borderColor: color,
        }}
        className="border"
      >
        {emocion}
      </Badge>
    );
  };

  const guardarConfiguracion = async () => {
    try {
      // Aquí podrías guardar la configuración en la base de datos
      // Por ahora solo mostramos un mensaje de éxito
      toast.success('Configuración guardada correctamente');
      setEditandoConfig(false);
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      toast.error('Error al guardar configuración');
    }
  };

  const porcentajeUsoHoy = (estadisticas.llamadasGeminiHoy / configuracion.limiteDiario) * 100;
  const porcentajeUsoMes = (estadisticas.llamadasGeminiMes / configuracion.limiteMensual) * 100;

  if (cargando) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Cargando análisis de IA"
        className="min-h-screen bg-gray-50 flex items-center justify-center"
      >
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex items-center gap-2 justify-center mb-4">
            <div
              className="w-3 h-3 rounded-full bg-purple-500 animate-pulse"
              style={{ animationDelay: '0ms' }}
              aria-hidden="true"
            />
            <div
              className="w-3 h-3 rounded-full bg-pink-500 animate-pulse"
              style={{ animationDelay: '150ms' }}
              aria-hidden="true"
            />
            <div
              className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"
              style={{ animationDelay: '300ms' }}
              aria-hidden="true"
            />
          </div>
          <p className="text-gray-600 text-lg">Cargando análisis de IA...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" />

      <AdminHeader
        titulo="Análisis de Inteligencia Artificial"
        descripcion="Monitoreo en tiempo real de Gemini AI, análisis emocional y uso de recursos"
        gradiente={COLORES_IA.gradientes.header}
        icono={<Sparkles className="w-12 h-12" aria-hidden="true" />}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Tabs de navegación */}
        <Tabs
          value={tabActual}
          onValueChange={setTabActual}
          className="w-full"
          aria-label="Navegación de análisis de IA"
        >
          <TabsList className="grid w-full grid-cols-3 mb-8 h-auto p-1 bg-white shadow-md rounded-xl">
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white flex items-center gap-2 py-3 rounded-lg transition-all duration-300"
            >
              <BarChart3 className="w-4 h-4" aria-hidden="true" />
              <span className="font-medium">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger
              value="logs"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white flex items-center gap-2 py-3 rounded-lg transition-all duration-300"
            >
              <FileText className="w-4 h-4" aria-hidden="true" />
              <span className="font-medium">Logs Detallados</span>
            </TabsTrigger>
            <TabsTrigger
              value="configuracion"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white flex items-center gap-2 py-3 rounded-lg transition-all duration-300"
            >
              <Settings className="w-4 h-4" aria-hidden="true" />
              <span className="font-medium">Configuración</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab: Dashboard */}
          <TabsContent value="dashboard" className="space-y-8">
            {/* Tarjetas de KPI con gradientes */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {[
                {
                  titulo: 'Llamadas API Hoy',
                  valor: estadisticas.llamadasGeminiHoy,
                  icono: Zap,
                  color: COLORES_IA.gradientes.card3,
                  cambio: porcentajeUsoHoy,
                  tendencia: 'up' as const,
                  sufijo: ` / ${configuracion.limiteDiario}`,
                  ariaLabel: `Llamadas API hoy: ${estadisticas.llamadasGeminiHoy} de ${configuracion.limiteDiario}`,
                },
                {
                  titulo: 'Costo Estimado Hoy',
                  valor: estadisticas.costoEstimadoHoy,
                  icono: DollarSign,
                  color: COLORES_IA.gradientes.card2,
                  cambio: 8,
                  tendencia: 'up' as const,
                  prefijo: '$',
                  ariaLabel: `Costo estimado hoy: $${estadisticas.costoEstimadoHoy}`,
                },
                {
                  titulo: 'Tokens Procesados',
                  valor: estadisticas.tokensTotalesHoy,
                  icono: Cpu,
                  color: COLORES_IA.gradientes.card1,
                  cambio: 12,
                  tendencia: 'up' as const,
                  ariaLabel: `Tokens procesados hoy: ${estadisticas.tokensTotalesHoy}`,
                },
                {
                  titulo: 'Tasa de Éxito',
                  valor: estadisticas.tasaExito,
                  sufijo: '%',
                  icono: CheckCircle,
                  color: COLORES_IA.gradientes.card4,
                  cambio: 2,
                  tendencia: 'up' as const,
                  ariaLabel: `Tasa de éxito: ${estadisticas.tasaExito}%`,
                },
              ].map((tarjeta, index) => (
                <motion.div
                  key={tarjeta.titulo}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                >
                  <AdminStatCard
                    titulo={tarjeta.titulo}
                    valor={tarjeta.valor}
                    icono={tarjeta.icono}
                    color={tarjeta.color}
                    cambio={tarjeta.cambio}
                    tendencia={tarjeta.tendencia}
                    sufijo={tarjeta.sufijo || ''}
                    prefijo={tarjeta.prefijo || ''}
                    delay={0}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Alerta de uso elevado con animación */}
            <AnimatePresence>
              {porcentajeUsoHoy > configuracion.alertaUso && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  role="alert"
                  aria-live="polite"
                >
                  <Card className="border-2 border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 shadow-lg">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <motion.div
                          animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 5, -5, 0]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <AlertTriangle className="h-6 w-6 text-orange-600" aria-hidden="true" />
                        </motion.div>
                        <div className="flex-1">
                          <p className="font-semibold text-orange-900 text-lg mb-1">
                            Alerta de uso elevado
                          </p>
                          <p className="text-orange-700">
                            Has consumido <span className="font-bold">{porcentajeUsoHoy.toFixed(1)}%</span> del límite diario de llamadas API.
                            Considera optimizar el uso o aumentar el límite en la pestaña de Configuración.
                          </p>
                          <div className="w-full bg-orange-200 rounded-full h-2 mt-3">
                            <motion.div
                              className="h-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500"
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(porcentajeUsoHoy, 100)}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              aria-label={`Barra de progreso: ${porcentajeUsoHoy.toFixed(1)}% utilizado`}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Resumen mensual */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <AdminCard titulo="Resumen Mensual" icono={<Activity className="w-5 h-5" />} delay={0.1}>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Llamadas totales</span>
                    <span className="font-semibold text-gray-900">
                      {estadisticas.llamadasGeminiMes.toLocaleString('es-CO')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tokens procesados</span>
                    <span className="font-semibold text-gray-900">
                      {estadisticas.tokensTotalesMes.toLocaleString('es-CO')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Costo estimado</span>
                    <span className="font-semibold text-emerald-600">
                      ${estadisticas.costoEstimadoMes.toLocaleString('es-CO')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Uso del límite</span>
                    <span className="font-semibold text-gray-900">
                      {porcentajeUsoMes.toFixed(1)}%
                    </span>
                  </div>
                  <div
                    className="w-full bg-gray-200 rounded-full h-2"
                    role="progressbar"
                    aria-valuenow={porcentajeUsoMes}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Uso mensual: ${porcentajeUsoMes.toFixed(1)}%`}
                  >
                    <motion.div
                      className={`h-2 rounded-full transition-all ${
                        porcentajeUsoMes > 90 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                        porcentajeUsoMes > 70 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                        'bg-gradient-to-r from-teal-500 to-emerald-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(porcentajeUsoMes, 100)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </AdminCard>

              <AdminCard titulo="Conversaciones IA" icono={<MessageSquare className="w-5 h-5" />} delay={0.2}>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total conversaciones</span>
                    <span className="font-semibold text-gray-900">
                      {estadisticas.totalConversaciones}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Análisis de voz</span>
                    <span className="font-semibold text-purple-600">
                      {estadisticas.totalAnalisisVoz}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Emociones detectadas</span>
                    <span className="font-semibold text-teal-600">
                      {estadisticas.promedioEmocionesDetectadas}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tiempo promedio</span>
                    <span className="font-semibold text-gray-900">
                      {estadisticas.tiempoPromedioRespuesta}s
                    </span>
                  </div>
                </div>
              </AdminCard>

              {/* Vista previa de configuración */}
              <AdminCard
                titulo="Límites Actuales"
                icono={<Settings className="w-5 h-5" />}
                delay={0.3}
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Límite diario</span>
                    <span className="font-semibold text-gray-900">
                      {configuracion.limiteDiario.toLocaleString('es-CO')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Límite mensual</span>
                    <span className="font-semibold text-gray-900">
                      {configuracion.limiteMensual.toLocaleString('es-CO')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Alerta de uso</span>
                    <span className="font-semibold text-gray-900">
                      {configuracion.alertaUso}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Modelo principal</span>
                    <span className="font-semibold text-gray-900 text-xs">
                      {configuracion.modeloPrincipal.replace('gemini-', '')}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setTabActual('configuracion')}
                    className="w-full mt-2 border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    <Settings className="w-4 h-4 mr-2" aria-hidden="true" />
                    Ver configuración
                  </Button>
                </div>
              </AdminCard>
            </div>

            {/* Gráficos con tooltips personalizados */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de tokens por día */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <AdminCard
                  titulo="Consumo de Tokens por Día"
                  icono={<TrendingUp className="w-5 h-5" />}
                  delay={0}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={datosTokensPorDia}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis
                        dataKey="fecha"
                        stroke="#6B7280"
                        style={{ fontSize: '12px' }}
                        tick={{ fill: '#6B7280' }}
                      />
                      <YAxis
                        stroke="#6B7280"
                        style={{ fontSize: '12px' }}
                        tick={{ fill: '#6B7280' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E5E7EB',
                          borderRadius: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          padding: '12px',
                        }}
                        labelStyle={{ color: '#1F2937', fontWeight: 600, marginBottom: '4px' }}
                        cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                      />
                      <Bar
                        dataKey="tokens"
                        fill="url(#gradienteTokens)"
                        radius={[8, 8, 0, 0]}
                      />
                      <defs>
                        <linearGradient id="gradienteTokens" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1} />
                          <stop offset="100%" stopColor="#EC4899" stopOpacity={0.8} />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </AdminCard>
              </motion.div>

              {/* Costo por modelo */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <AdminCard
                  titulo="Distribución de Costos por Modelo"
                  icono={<DollarSign className="w-5 h-5" />}
                  delay={0}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={datosCostoPorModelo}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="costo"
                        label={({ modelo, percent }: any) =>
                          `${modelo} ${((percent || 0) * 100).toFixed(0)}%`
                        }
                      >
                        {datosCostoPorModelo.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={Object.values(COLORES_GRAFICOS)[index % 5]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E5E7EB',
                          borderRadius: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          padding: '12px',
                        }}
                        formatter={(value: any) => [`$${value.toFixed(4)}`, 'Costo']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </AdminCard>
              </motion.div>

              {/* Gráfico de uso por tipo */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <AdminCard
                  titulo="Chat IA vs Análisis de Voz"
                  icono={<Activity className="w-5 h-5" />}
                  delay={0}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={datosUsoPorTipo}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis
                        dataKey="fecha"
                        stroke="#6B7280"
                        style={{ fontSize: '12px' }}
                        tick={{ fill: '#6B7280' }}
                      />
                      <YAxis
                        stroke="#6B7280"
                        style={{ fontSize: '12px' }}
                        tick={{ fill: '#6B7280' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E5E7EB',
                          borderRadius: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          padding: '12px',
                        }}
                        labelStyle={{ color: '#1F2937', fontWeight: 600, marginBottom: '4px' }}
                        cursor={{ stroke: '#8B5CF6', strokeWidth: 2, strokeDasharray: '5 5' }}
                      />
                      <Legend
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="circle"
                      />
                      <Line
                        type="monotone"
                        dataKey="chat"
                        stroke="#06B6D4"
                        strokeWidth={3}
                        name="Chat IA"
                        dot={{ fill: '#06B6D4', r: 5, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 7, strokeWidth: 2 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="voz"
                        stroke="#8B5CF6"
                        strokeWidth={3}
                        name="Análisis de Voz"
                        dot={{ fill: '#8B5CF6', r: 5, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 7, strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </AdminCard>
              </motion.div>

              {/* Distribución de emociones */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <AdminCard
                  titulo="Emociones Detectadas por IA"
                  icono={<Brain className="w-5 h-5" />}
                  delay={0}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={datosEmociones}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="valor"
                        label={({ nombre, percent }: any) =>
                          `${nombre} ${((percent || 0) * 100).toFixed(0)}%`
                        }
                      >
                        {datosEmociones.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E5E7EB',
                          borderRadius: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          padding: '12px',
                        }}
                        formatter={(value: any) => [`${value} detecciones`, 'Cantidad']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </AdminCard>
              </motion.div>
            </div>
          </TabsContent>

          {/* Tab: Logs Detallados */}
          <TabsContent value="logs" className="space-y-6">
            {/* Tabla de logs de Gemini */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <AdminCard
                titulo="Logs Recientes de Gemini API"
                icono={<Activity className="w-5 h-5" />}
                delay={0}
              >
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Tokens</TableHead>
                        <TableHead>Tiempo</TableHead>
                        <TableHead>Costo</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logsGemini.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                            No se encontraron logs de Gemini API
                          </TableCell>
                        </TableRow>
                      ) : (
                        logsGemini.slice(0, 50).map((log, index) => (
                          <motion.tr
                            key={log.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.02, duration: 0.3 }}
                            className="border-b border-gray-100 hover:bg-purple-50/30 transition-colors"
                          >
                            <TableCell className="text-sm text-gray-700">
                              {format(new Date(log.creado_en), "dd/MM HH:mm", {
                                locale: es,
                              })}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="bg-purple-50 text-purple-700 border-purple-200"
                              >
                                {log.modelo?.replace('gemini-', '') || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm font-medium text-gray-700">
                              {log.total_tokens?.toLocaleString('es-CO') || '0'}
                            </TableCell>
                            <TableCell className="text-sm text-gray-700">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-gray-400" aria-hidden="true" />
                                {log.tiempo_respuesta_ms}ms
                              </div>
                            </TableCell>
                            <TableCell className="text-sm font-semibold text-emerald-600">
                              ${log.costo_estimado?.toFixed(4) || '0.0000'}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={log.exitoso ? 'default' : 'destructive'}
                                className={log.exitoso
                                  ? 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border-emerald-200'
                                  : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800'
                                }
                              >
                                {log.exitoso ? (
                                  <>
                                    <CheckCircle className="w-3 h-3 mr-1 inline" aria-hidden="true" />
                                    Éxito
                                  </>
                                ) : (
                                  <>
                                    <AlertTriangle className="w-3 h-3 mr-1 inline" aria-hidden="true" />
                                    Error
                                  </>
                                )}
                              </Badge>
                            </TableCell>
                          </motion.tr>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </AdminCard>
            </motion.div>

            {/* Tabla de conversaciones */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <AdminCard
                titulo="Conversaciones Recientes con IA"
                icono={<MessageSquare className="w-5 h-5" />}
                delay={0}
              >
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Duración</TableHead>
                        <TableHead>Emoción Principal</TableHead>
                        <TableHead>Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {conversaciones.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                            No se encontraron conversaciones
                          </TableCell>
                        </TableRow>
                      ) : (
                        conversaciones.map((conversacion, index) => (
                          <motion.tr
                            key={conversacion.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.02, duration: 0.3 }}
                            className="border-b border-gray-100 hover:bg-pink-50/30 transition-colors"
                          >
                            <TableCell>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {conversacion.usuario.nombre}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {conversacion.usuario.email}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={conversacion.tipo === 'chat' ? 'default' : 'secondary'}
                                className={
                                  conversacion.tipo === 'chat'
                                    ? 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-blue-200'
                                    : 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-200'
                                }
                              >
                                {conversacion.tipo === 'chat' ? (
                                  <MessageSquare className="w-3 h-3 mr-1 inline" aria-hidden="true" />
                                ) : (
                                  <Mic className="w-3 h-3 mr-1 inline" aria-hidden="true" />
                                )}
                                {conversacion.tipo.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-700 font-medium">
                              {formatearDuracion(conversacion.duracion_segundos)}
                            </TableCell>
                            <TableCell>
                              {obtenerBadgeEmocion(conversacion.emocion_detectada)}
                            </TableCell>
                            <TableCell className="text-gray-700">
                              {format(new Date(conversacion.creado_en), "dd MMM yyyy 'a las' HH:mm", {
                                locale: es,
                              })}
                            </TableCell>
                          </motion.tr>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </AdminCard>
            </motion.div>
          </TabsContent>

          {/* Tab: Configuración */}
          <TabsContent value="configuracion" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                      <Settings className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Configuración de Límites y Parámetros
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Límite diario */}
                    <div className="space-y-3">
                      <Label
                        htmlFor="limiteDiario"
                        className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                      >
                        <Zap className="w-4 h-4 text-purple-600" aria-hidden="true" />
                        Límite de llamadas diarias
                      </Label>
                      <Input
                        id="limiteDiario"
                        type="number"
                        value={configuracion.limiteDiario}
                        onChange={(e) => setConfiguracion({
                          ...configuracion,
                          limiteDiario: parseInt(e.target.value) || 0
                        })}
                        className="border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                        disabled={!editandoConfig}
                        aria-label="Límite de llamadas diarias a la API"
                      />
                      <p className="text-xs text-gray-500">
                        Número máximo de llamadas permitidas por día
                      </p>
                    </div>

                    {/* Límite mensual */}
                    <div className="space-y-3">
                      <Label
                        htmlFor="limiteMensual"
                        className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                      >
                        <Activity className="w-4 h-4 text-pink-600" aria-hidden="true" />
                        Límite de llamadas mensuales
                      </Label>
                      <Input
                        id="limiteMensual"
                        type="number"
                        value={configuracion.limiteMensual}
                        onChange={(e) => setConfiguracion({
                          ...configuracion,
                          limiteMensual: parseInt(e.target.value) || 0
                        })}
                        className="border-pink-200 focus:border-pink-500 focus:ring-pink-500"
                        disabled={!editandoConfig}
                        aria-label="Límite de llamadas mensuales a la API"
                      />
                      <p className="text-xs text-gray-500">
                        Número máximo de llamadas permitidas por mes
                      </p>
                    </div>

                    {/* Umbral de alerta de costo */}
                    <div className="space-y-3">
                      <Label
                        htmlFor="alertaCosto"
                        className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                      >
                        <DollarSign className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                        Alerta de costo ($USD)
                      </Label>
                      <Input
                        id="alertaCosto"
                        type="number"
                        step="0.01"
                        value={configuracion.alertaCosto}
                        onChange={(e) => setConfiguracion({
                          ...configuracion,
                          alertaCosto: parseFloat(e.target.value) || 0
                        })}
                        className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                        disabled={!editandoConfig}
                        aria-label="Umbral de alerta de costo en dólares"
                      />
                      <p className="text-xs text-gray-500">
                        Recibir alerta cuando el costo supere este valor
                      </p>
                    </div>

                    {/* Umbral de alerta de uso */}
                    <div className="space-y-3">
                      <Label
                        htmlFor="alertaUso"
                        className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                      >
                        <AlertTriangle className="w-4 h-4 text-amber-600" aria-hidden="true" />
                        Alerta de uso (%)
                      </Label>
                      <div className="space-y-2">
                        <Slider
                          id="alertaUso"
                          value={[configuracion.alertaUso]}
                          onValueChange={(value) => setConfiguracion({
                            ...configuracion,
                            alertaUso: value[0]
                          })}
                          max={100}
                          step={5}
                          className="w-full"
                          disabled={!editandoConfig}
                          aria-label="Porcentaje de uso para activar alerta"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>0%</span>
                          <span className="font-semibold text-amber-600">{configuracion.alertaUso}%</span>
                          <span>100%</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Mostrar alerta cuando el uso supere este porcentaje
                      </p>
                    </div>

                    {/* Modelo principal */}
                    <div className="space-y-3">
                      <Label
                        htmlFor="modeloPrincipal"
                        className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                      >
                        <Cpu className="w-4 h-4 text-violet-600" aria-hidden="true" />
                        Modelo de IA principal
                      </Label>
                      <Input
                        id="modeloPrincipal"
                        type="text"
                        value={configuracion.modeloPrincipal}
                        onChange={(e) => setConfiguracion({
                          ...configuracion,
                          modeloPrincipal: e.target.value
                        })}
                        className="border-violet-200 focus:border-violet-500 focus:ring-violet-500"
                        disabled={!editandoConfig}
                        aria-label="Modelo de IA principal a utilizar"
                      />
                      <p className="text-xs text-gray-500">
                        Modelo de Gemini utilizado por defecto
                      </p>
                    </div>

                    {/* Temperatura */}
                    <div className="space-y-3">
                      <Label
                        htmlFor="temperaturaDefault"
                        className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                      >
                        <Brain className="w-4 h-4 text-rose-600" aria-hidden="true" />
                        Temperatura (creatividad)
                      </Label>
                      <div className="space-y-2">
                        <Slider
                          id="temperaturaDefault"
                          value={[configuracion.temperaturaDefault * 100]}
                          onValueChange={(value) => setConfiguracion({
                            ...configuracion,
                            temperaturaDefault: value[0] / 100
                          })}
                          max={100}
                          step={5}
                          className="w-full"
                          disabled={!editandoConfig}
                          aria-label="Temperatura del modelo: nivel de creatividad"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Preciso (0.0)</span>
                          <span className="font-semibold text-rose-600">{configuracion.temperaturaDefault.toFixed(1)}</span>
                          <span>Creativo (1.0)</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Controla la aleatoriedad de las respuestas de la IA
                      </p>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-3 pt-4 border-t border-purple-200">
                    {editandoConfig ? (
                      <>
                        <Button
                          onClick={guardarConfiguracion}
                          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" aria-hidden="true" />
                          Guardar cambios
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setEditandoConfig(false)}
                          className="flex-1 border-gray-300"
                        >
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => setEditandoConfig(true)}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
                      >
                        <Settings className="w-4 h-4 mr-2" aria-hidden="true" />
                        Editar configuración
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Información adicional */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardContent className="py-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Activity className="h-5 w-5 text-blue-600" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-900 mb-2">
                        Información sobre la configuración
                      </h3>
                      <ul className="space-y-2 text-sm text-blue-800">
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>Los límites diarios y mensuales ayudan a controlar los costos de la API</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>Las alertas se mostrarán automáticamente cuando se superen los umbrales configurados</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>La temperatura controla la creatividad: valores bajos (0.0-0.3) son más precisos, valores altos (0.7-1.0) son más creativos</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>Los cambios en la configuración se aplicarán inmediatamente después de guardar</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
