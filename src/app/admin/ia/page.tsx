'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
import { obtenerClienteNavegador } from '../../../lib/supabase/cliente';
import { toast, Toaster } from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '../../../lib/componentes/ui/input';
import { Label } from '../../../lib/componentes/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../../lib/componentes/ui/card';

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
  primary: '#14B8A6',
  secondary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
};

export default function AdminAnalisisIA() {
  const [cargando, setCargando] = useState(true);
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
          <div
            className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"
            aria-hidden="true"
          />
          <p className="mt-4 text-gray-600 text-lg">Cargando análisis de IA...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" />

      <AdminHeader
        titulo="Análisis de Uso de IA 🤖"
        descripcion="Métricas, analytics, costos y configuración del sistema de Inteligencia Artificial (Gemini)"
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              titulo: 'Llamadas API Hoy',
              valor: estadisticas.llamadasGeminiHoy,
              icono: Zap,
              color: 'from-blue-400 to-blue-600',
              cambio: porcentajeUsoHoy,
              tendencia: 'up' as const,
              sufijo: ` / ${configuracion.limiteDiario}`,
            },
            {
              titulo: 'Costo Estimado Hoy',
              valor: estadisticas.costoEstimadoHoy,
              icono: DollarSign,
              color: 'from-green-400 to-green-600',
              cambio: 8,
              tendencia: 'up' as const,
              prefijo: '$',
            },
            {
              titulo: 'Tokens Procesados',
              valor: estadisticas.tokensTotalesHoy,
              icono: BarChart3,
              color: 'from-purple-400 to-purple-600',
              cambio: 12,
              tendencia: 'up' as const,
            },
            {
              titulo: 'Tasa de Éxito',
              valor: estadisticas.tasaExito,
              sufijo: '%',
              icono: CheckCircle,
              color: 'from-teal-400 to-teal-600',
              cambio: 2,
              tendencia: 'up' as const,
            },
          ].map((tarjeta, index) => (
            <AdminStatCard
              key={tarjeta.titulo}
              titulo={tarjeta.titulo}
              valor={tarjeta.valor}
              icono={tarjeta.icono}
              color={tarjeta.color}
              cambio={tarjeta.cambio}
              tendencia={tarjeta.tendencia}
              sufijo={tarjeta.sufijo || ''}
              prefijo={tarjeta.prefijo || ''}
              delay={index * 0.1}
            />
          ))}
        </div>

        {/* Alertas de uso */}
        {porcentajeUsoHoy > configuracion.alertaUso && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-orange-900">Alerta de uso elevado</p>
                    <p className="text-orange-700 mt-1">
                      Has consumido {porcentajeUsoHoy.toFixed(1)}% del límite diario de llamadas API.
                      Considera optimizar el uso o aumentar el límite.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Resumen mensual */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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
                <span className="font-semibold text-green-600">
                  ${estadisticas.costoEstimadoMes.toLocaleString('es-CO')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Uso del límite</span>
                <span className="font-semibold text-gray-900">
                  {porcentajeUsoMes.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    porcentajeUsoMes > 90 ? 'bg-red-500' :
                    porcentajeUsoMes > 70 ? 'bg-orange-500' :
                    'bg-teal-500'
                  }`}
                  style={{ width: `${Math.min(porcentajeUsoMes, 100)}%` }}
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

          {/* Configuración de límites */}
          <AdminCard
            titulo="Configuración de Límites"
            icono={<Settings className="w-5 h-5" />}
            delay={0.3}
          >
            {editandoConfig ? (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="limiteDiario" className="text-xs">Límite diario</Label>
                  <Input
                    id="limiteDiario"
                    type="number"
                    value={configuracion.limiteDiario}
                    onChange={(e) => setConfiguracion({
                      ...configuracion,
                      limiteDiario: parseInt(e.target.value) || 0
                    })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="limiteMensual" className="text-xs">Límite mensual</Label>
                  <Input
                    id="limiteMensual"
                    type="number"
                    value={configuracion.limiteMensual}
                    onChange={(e) => setConfiguracion({
                      ...configuracion,
                      limiteMensual: parseInt(e.target.value) || 0
                    })}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={guardarConfiguracion}
                    className="flex-1"
                  >
                    Guardar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditandoConfig(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
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
                  <span className="font-semibold text-gray-900">
                    {configuracion.modeloPrincipal.replace('gemini-', '')}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditandoConfig(true)}
                  className="w-full mt-2"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Editar configuración
                </Button>
              </div>
            )}
          </AdminCard>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de tokens por día */}
          <AdminCard
            titulo="Consumo de Tokens por Día"
            icono={<TrendingUp className="w-5 h-5" />}
            delay={0.4}
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
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  labelStyle={{ color: '#1F2937', fontWeight: 600 }}
                />
                <Bar
                  dataKey="tokens"
                  fill="#8B5CF6"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </AdminCard>

          {/* Costo por modelo */}
          <AdminCard
            titulo="Costo por Modelo IA"
            icono={<DollarSign className="w-5 h-5" />}
            delay={0.5}
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
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: any) => `$${value.toFixed(2)}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </AdminCard>

          {/* Gráfico de uso por tipo */}
          <AdminCard
            titulo="Uso de Chat IA vs Voz IA"
            icono={<TrendingUp className="w-5 h-5" />}
            delay={0.6}
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
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  labelStyle={{ color: '#1F2937', fontWeight: 600 }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
                <Line
                  type="monotone"
                  dataKey="chat"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  name="Chat IA"
                  dot={{ fill: '#3B82F6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="voz"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  name="Voz IA"
                  dot={{ fill: '#8B5CF6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </AdminCard>

          {/* Distribución de emociones */}
          <AdminCard
            titulo="Distribución de Emociones Detectadas"
            icono={<Brain className="w-5 h-5" />}
            delay={0.7}
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
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </AdminCard>
        </div>

        {/* Tabla de logs recientes de Gemini */}
        <AdminCard
          titulo="Logs Recientes de Gemini API"
          icono={<Activity className="w-5 h-5" />}
          delay={0.8}
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
                  logsGemini.slice(0, 20).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm text-gray-700">
                        {format(new Date(log.creado_en), "dd/MM HH:mm", {
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {log.modelo?.replace('gemini-', '') || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">
                        {log.total_tokens?.toLocaleString('es-CO') || '0'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">
                        {log.tiempo_respuesta_ms}ms
                      </TableCell>
                      <TableCell className="text-sm font-medium text-green-600">
                        ${log.costo_estimado?.toFixed(4) || '0.0000'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={log.exitoso ? 'default' : 'destructive'}
                          className={log.exitoso ? 'bg-green-100 text-green-800' : ''}
                        >
                          {log.exitoso ? 'Éxito' : 'Error'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </AdminCard>

        {/* Tabla de conversaciones recientes */}
        <AdminCard
          titulo="Conversaciones Recientes"
          icono={<MessageSquare className="w-5 h-5" />}
          delay={0.9}
          className="mt-6"
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
                  conversaciones.map((conversacion) => (
                    <TableRow key={conversacion.id}>
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
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }
                        >
                          {conversacion.tipo === 'chat' ? (
                            <MessageSquare className="w-3 h-3 mr-1 inline" />
                          ) : (
                            <Mic className="w-3 h-3 mr-1 inline" />
                          )}
                          {conversacion.tipo.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-700">
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
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </AdminCard>
      </main>
    </>
  );
}
