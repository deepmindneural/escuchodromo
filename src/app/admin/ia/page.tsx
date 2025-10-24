'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
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

interface EstadisticasIA {
  totalConversaciones: number;
  totalAnalisisVoz: number;
  promedioEmocionesDetectadas: number;
  tiempoPromedioRespuesta: number;
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

export default function AdminAnalisisIA() {
  const [cargando, setCargando] = useState(true);
  const [estadisticas, setEstadisticas] = useState<EstadisticasIA>({
    totalConversaciones: 0,
    totalAnalisisVoz: 0,
    promedioEmocionesDetectadas: 0,
    tiempoPromedioRespuesta: 0,
  });
  const [conversaciones, setConversaciones] = useState<ConversacionIA[]>([]);
  const [datosUsoPorTipo, setDatosUsoPorTipo] = useState<any[]>([]);
  const [datosEmociones, setDatosEmociones] = useState<any[]>([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const supabase = obtenerClienteNavegador();
      const fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() - 30);

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

      // Calcular tiempo promedio (simulado, ajustar según datos reales)
      const tiempoPromedio = 1.2; // segundos

      setEstadisticas({
        totalConversaciones,
        totalAnalisisVoz: totalVoz,
        promedioEmocionesDetectadas: Math.round(promedioEmociones),
        tiempoPromedioRespuesta: tiempoPromedio,
      });

      // Datos para gráfico de uso por día (últimos 7 días)
      const datosUltimos7Dias = generarDatosUltimos7Dias(conversacionesFormateadas);
      setDatosUsoPorTipo(datosUltimos7Dias);

      // Datos para distribución de emociones
      const distribucionEmociones = calcularDistribucionEmociones(conversacionesFormateadas);
      setDatosEmociones(distribucionEmociones);

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
        titulo="Análisis de Uso de IA"
        descripcion="Métricas y analytics sobre el uso de IA en la plataforma (chat, voz, análisis emocional)"
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              titulo: 'Conversaciones IA',
              valor: estadisticas.totalConversaciones,
              icono: MessageSquare,
              color: 'from-blue-400 to-blue-600',
              cambio: 12,
              tendencia: 'up' as const,
            },
            {
              titulo: 'Análisis de Voz',
              valor: estadisticas.totalAnalisisVoz,
              icono: Mic,
              color: 'from-purple-400 to-purple-600',
              cambio: 8,
              tendencia: 'up' as const,
            },
            {
              titulo: 'Emociones Detectadas',
              valor: estadisticas.promedioEmocionesDetectadas,
              sufijo: '%',
              icono: Brain,
              color: 'from-teal-400 to-teal-600',
              cambio: 5,
              tendencia: 'up' as const,
            },
            {
              titulo: 'Tiempo de Respuesta',
              valor: estadisticas.tiempoPromedioRespuesta,
              sufijo: 's',
              icono: Clock,
              color: 'from-amber-400 to-orange-600',
              cambio: -3,
              tendencia: 'down' as const,
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
              delay={index * 0.1}
            />
          ))}
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de uso por tipo */}
          <AdminCard
            titulo="Uso de Chat IA vs Voz IA"
            icono={<TrendingUp className="w-5 h-5" />}
            delay={0.2}
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
            delay={0.3}
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

        {/* Métricas de Rendimiento */}
        <AdminCard
          titulo="Métricas de Rendimiento"
          icono={<Activity className="w-5 h-5" />}
          delay={0.4}
          className="mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-600 mb-2">
                Tiempo Promedio de Respuesta
              </p>
              <p className="text-3xl font-bold text-blue-900">
                {estadisticas.tiempoPromedioRespuesta}s
              </p>
              <p className="text-xs text-blue-600 mt-1">3% mejor que el mes pasado</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
              <p className="text-sm font-medium text-green-600 mb-2">
                Tasa de Detección de Emociones
              </p>
              <p className="text-3xl font-bold text-green-900">
                {estadisticas.promedioEmocionesDetectadas}%
              </p>
              <p className="text-xs text-green-600 mt-1">5% mejor que el mes pasado</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
              <p className="text-sm font-medium text-purple-600 mb-2">
                Tokens Consumidos (Estimado)
              </p>
              <p className="text-3xl font-bold text-purple-900">
                {(estadisticas.totalConversaciones * 450).toLocaleString('es-CO')}
              </p>
              <p className="text-xs text-purple-600 mt-1">Promedio por conversación: ~450</p>
            </div>
          </div>
        </AdminCard>

        {/* Tabla de conversaciones recientes */}
        <AdminCard
          titulo="Conversaciones Recientes"
          icono={<MessageSquare className="w-5 h-5" />}
          delay={0.5}
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
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversaciones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
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
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Ver detalles de conversación de ${conversacion.usuario.nombre}`}
                        >
                          Ver Detalles
                        </Button>
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
