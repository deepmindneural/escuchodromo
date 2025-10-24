'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  FileText,
  AlertTriangle,
  TrendingDown,
  Calendar,
  Search,
  Filter,
  Eye,
  AlertCircle,
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
import { Input } from '../../../lib/componentes/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../lib/componentes/ui/select';
import { obtenerClienteNavegador } from '../../../lib/supabase/cliente';
import { toast, Toaster } from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Evaluacion {
  id: string;
  tipo: string;
  puntaje_total: number;
  severidad: string;
  respuestas: any;
  creado_en: string;
  usuario: {
    id: string;
    nombre: string;
    email: string;
  };
}

interface EstadisticasEvaluaciones {
  totalEvaluaciones: number;
  evaluacionesPHQ9: number;
  evaluacionesGAD7: number;
  severidadPromedio: string;
  evaluacionesCriticas: number;
}

const COLORES_SEVERIDAD = {
  'sin sintomas': '#7FB069',
  leve: '#7FB069',
  moderada: '#FFB84D',
  'moderadamente severa': '#F6AD55',
  severa: '#EF4444',
  critica: '#DC2626',
};

const NIVELES_SEVERIDAD = [
  { valor: '', etiqueta: 'Todas las severidades' },
  { valor: 'sin sintomas', etiqueta: 'Sin síntomas' },
  { valor: 'leve', etiqueta: 'Leve' },
  { valor: 'moderada', etiqueta: 'Moderada' },
  { valor: 'moderadamente severa', etiqueta: 'Moderadamente severa' },
  { valor: 'severa', etiqueta: 'Severa' },
  { valor: 'critica', etiqueta: 'Crítica' },
];

export default function AdminEvaluaciones() {
  const [cargando, setCargando] = useState(true);
  const [estadisticas, setEstadisticas] = useState<EstadisticasEvaluaciones>({
    totalEvaluaciones: 0,
    evaluacionesPHQ9: 0,
    evaluacionesGAD7: 0,
    severidadPromedio: 'leve',
    evaluacionesCriticas: 0,
  });
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [evaluacionesCriticas, setEvaluacionesCriticas] = useState<Evaluacion[]>([]);
  const [datosSeveridadTiempo, setDatosSeveridadTiempo] = useState<any[]>([]);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [filtroSeveridad, setFiltroSeveridad] = useState<string>('');
  const [evaluacionesFiltradas, setEvaluacionesFiltradas] = useState<Evaluacion[]>([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [evaluaciones, busqueda, filtroTipo, filtroSeveridad]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const supabase = obtenerClienteNavegador();
      const fechaInicio = new Date();
      fechaInicio.setMonth(fechaInicio.getMonth() - 3); // Últimos 3 meses

      // Cargar evaluaciones
      const { data: evaluacionesData, error: evaluacionesError } = await supabase
        .from('Evaluacion')
        .select(`
          id,
          tipo,
          puntaje_total,
          severidad,
          respuestas,
          creado_en,
          Usuario!usuario_id (
            id,
            nombre,
            email
          )
        `)
        .gte('creado_en', fechaInicio.toISOString())
        .order('creado_en', { ascending: false })
        .limit(200);

      if (evaluacionesError) {
        console.error('Error al cargar evaluaciones:', evaluacionesError);
        toast.error('Error al cargar evaluaciones');
      }

      const evaluacionesFormateadas = (evaluacionesData || []).map((e: any) => ({
        id: e.id,
        tipo: e.tipo || 'PHQ-9',
        puntaje_total: e.puntaje_total || 0,
        severidad: e.severidad || 'leve',
        respuestas: e.respuestas,
        creado_en: e.creado_en,
        usuario: {
          id: e.Usuario?.id || '',
          nombre: e.Usuario?.nombre || 'Usuario desconocido',
          email: e.Usuario?.email || 'Sin email',
        },
      }));

      setEvaluaciones(evaluacionesFormateadas);

      // Calcular estadísticas
      const totalEvaluaciones = evaluacionesFormateadas.length;
      const evaluacionesPHQ9 = evaluacionesFormateadas.filter(
        (e) => e.tipo === 'PHQ-9'
      ).length;
      const evaluacionesGAD7 = evaluacionesFormateadas.filter(
        (e) => e.tipo === 'GAD-7'
      ).length;

      // Evaluaciones críticas (severa o crítica)
      const criticas = evaluacionesFormateadas.filter(
        (e) => e.severidad === 'severa' || e.severidad === 'critica' || e.severidad === 'moderadamente severa'
      );
      setEvaluacionesCriticas(criticas.slice(0, 10));

      // Calcular severidad promedio
      const severidades = evaluacionesFormateadas.map((e) => e.severidad);
      const severidadMasComun = calcularModa(severidades);

      setEstadisticas({
        totalEvaluaciones,
        evaluacionesPHQ9,
        evaluacionesGAD7,
        severidadPromedio: severidadMasComun,
        evaluacionesCriticas: criticas.length,
      });

      // Datos para gráfico de severidad por tiempo
      const datosGrafico = generarDatosSeveridadTiempo(evaluacionesFormateadas);
      setDatosSeveridadTiempo(datosGrafico);

    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar datos de evaluaciones');
    } finally {
      setCargando(false);
    }
  };

  const calcularModa = (arr: string[]) => {
    if (arr.length === 0) return 'leve';
    const conteo: { [key: string]: number } = {};
    arr.forEach((val) => {
      conteo[val] = (conteo[val] || 0) + 1;
    });
    let maxConteo = 0;
    let moda = arr[0];
    Object.entries(conteo).forEach(([val, count]) => {
      if (count > maxConteo) {
        maxConteo = count;
        moda = val;
      }
    });
    return moda;
  };

  const generarDatosSeveridadTiempo = (evaluaciones: Evaluacion[]) => {
    const datos = [];
    const hoy = new Date();

    // Últimos 12 semanas
    for (let i = 11; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - i * 7);
      const fechaStr = format(fecha, 'dd MMM', { locale: es });

      const evaluacionesSemana = evaluaciones.filter((e) => {
        const fechaEval = new Date(e.creado_en);
        const diferenciaDias = Math.floor(
          (hoy.getTime() - fechaEval.getTime()) / (1000 * 60 * 60 * 24)
        );
        return diferenciaDias >= i * 7 && diferenciaDias < (i + 1) * 7;
      });

      // Calcular puntaje promedio
      const puntajesPhq9 = evaluacionesSemana
        .filter((e) => e.tipo === 'PHQ-9')
        .map((e) => e.puntaje_total);
      const puntajesGad7 = evaluacionesSemana
        .filter((e) => e.tipo === 'GAD-7')
        .map((e) => e.puntaje_total);

      const promedioPhq9 =
        puntajesPhq9.length > 0
          ? puntajesPhq9.reduce((a, b) => a + b, 0) / puntajesPhq9.length
          : 0;
      const promedioGad7 =
        puntajesGad7.length > 0
          ? puntajesGad7.reduce((a, b) => a + b, 0) / puntajesGad7.length
          : 0;

      datos.push({
        fecha: fechaStr,
        'PHQ-9': Math.round(promedioPhq9 * 10) / 10,
        'GAD-7': Math.round(promedioGad7 * 10) / 10,
      });
    }

    return datos;
  };

  const aplicarFiltros = () => {
    let resultados = [...evaluaciones];

    // Filtro de búsqueda
    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase();
      resultados = resultados.filter(
        (e) =>
          e.usuario.nombre.toLowerCase().includes(busquedaLower) ||
          e.usuario.email.toLowerCase().includes(busquedaLower)
      );
    }

    // Filtro de tipo
    if (filtroTipo) {
      resultados = resultados.filter((e) => e.tipo === filtroTipo);
    }

    // Filtro de severidad
    if (filtroSeveridad) {
      resultados = resultados.filter((e) => e.severidad === filtroSeveridad);
    }

    setEvaluacionesFiltradas(resultados);
  };

  const obtenerBadgeSeveridad = (severidad: string) => {
    const severidadLower = severidad.toLowerCase();
    const color = COLORES_SEVERIDAD[severidadLower as keyof typeof COLORES_SEVERIDAD] || '#9F7AEA';

    let variante: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
    let className = '';

    if (severidadLower === 'severa' || severidadLower === 'critica') {
      className = 'bg-red-100 text-red-800 border-red-300';
    } else if (severidadLower === 'moderadamente severa') {
      className = 'bg-orange-100 text-orange-800 border-orange-300';
    } else if (severidadLower === 'moderada') {
      className = 'bg-yellow-100 text-yellow-800 border-yellow-300';
    } else {
      className = 'bg-green-100 text-green-800 border-green-300';
    }

    return (
      <Badge className={className}>
        {severidad.charAt(0).toUpperCase() + severidad.slice(1)}
      </Badge>
    );
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroTipo('');
    setFiltroSeveridad('');
  };

  if (cargando) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Cargando evaluaciones"
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
          />
          <p className="mt-4 text-gray-600 text-lg">Cargando evaluaciones...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" />

      <AdminHeader
        titulo="Administración de Evaluaciones"
        descripcion="Gestiona todas las evaluaciones psicológicas (PHQ-9, GAD-7, etc.) realizadas en la plataforma"
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              titulo: 'Total Evaluaciones',
              valor: estadisticas.totalEvaluaciones,
              icono: FileText,
              color: 'from-blue-400 to-blue-600',
              cambio: 8,
              tendencia: 'up' as const,
            },
            {
              titulo: 'Evaluaciones PHQ-9',
              valor: estadisticas.evaluacionesPHQ9,
              icono: TrendingDown,
              color: 'from-purple-400 to-purple-600',
              cambio: 5,
              tendencia: 'up' as const,
            },
            {
              titulo: 'Evaluaciones GAD-7',
              valor: estadisticas.evaluacionesGAD7,
              icono: Calendar,
              color: 'from-teal-400 to-teal-600',
              cambio: 3,
              tendencia: 'up' as const,
            },
            {
              titulo: 'Evaluaciones Críticas',
              valor: estadisticas.evaluacionesCriticas,
              icono: AlertTriangle,
              color: 'from-red-400 to-red-600',
              cambio: -2,
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
              delay={index * 0.1}
            />
          ))}
        </div>

        {/* Alertas de evaluaciones críticas */}
        {evaluacionesCriticas.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-6 shadow-md">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <AlertCircle className="w-8 h-8 text-red-600" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-900 mb-2">
                    Evaluaciones que Requieren Atención Urgente
                  </h3>
                  <p className="text-sm text-red-700 mb-4">
                    Se han detectado {evaluacionesCriticas.length} evaluaciones con niveles de
                    severidad moderadamente severa, severa o crítica que pueden requerir
                    intervención inmediata.
                  </p>
                  <div className="space-y-2">
                    {evaluacionesCriticas.slice(0, 3).map((evaluacion) => (
                      <div
                        key={evaluacion.id}
                        className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-200"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {evaluacion.usuario.nombre}
                          </p>
                          <p className="text-sm text-gray-600">
                            {evaluacion.tipo} - Puntaje: {evaluacion.puntaje_total}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {obtenerBadgeSeveridad(evaluacion.severidad)}
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {evaluacionesCriticas.length > 3 && (
                    <p className="text-sm text-red-700 mt-3">
                      + {evaluacionesCriticas.length - 3} evaluaciones críticas más
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Gráfico de severidad por tiempo */}
        <AdminCard
          titulo="Evolución de Severidad Promedio (Últimas 12 Semanas)"
          icono={<TrendingDown className="w-5 h-5" />}
          delay={0.3}
          className="mb-8"
        >
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={datosSeveridadTiempo}>
              <defs>
                <linearGradient id="colorPHQ9" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorGAD7" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
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
                label={{
                  value: 'Puntaje Promedio',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: '#6B7280' },
                }}
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
              <Area
                type="monotone"
                dataKey="PHQ-9"
                stroke="#3B82F6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPHQ9)"
              />
              <Area
                type="monotone"
                dataKey="GAD-7"
                stroke="#8B5CF6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorGAD7)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </AdminCard>

        {/* Filtros */}
        <AdminCard
          titulo="Filtros"
          icono={<Filter className="w-5 h-5" />}
          delay={0.4}
          className="mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9"
                aria-label="Buscar evaluaciones por nombre o email"
              />
            </div>

            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger aria-label="Filtrar por tipo de evaluación">
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los tipos</SelectItem>
                <SelectItem value="PHQ-9">PHQ-9 (Depresión)</SelectItem>
                <SelectItem value="GAD-7">GAD-7 (Ansiedad)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtroSeveridad} onValueChange={setFiltroSeveridad}>
              <SelectTrigger aria-label="Filtrar por severidad">
                <SelectValue placeholder="Todas las severidades" />
              </SelectTrigger>
              <SelectContent>
                {NIVELES_SEVERIDAD.map((nivel) => (
                  <SelectItem key={nivel.valor} value={nivel.valor}>
                    {nivel.etiqueta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={limpiarFiltros}
              aria-label="Limpiar todos los filtros"
            >
              Limpiar filtros
            </Button>
          </div>
        </AdminCard>

        {/* Tabla de evaluaciones */}
        <AdminCard
          titulo={`Evaluaciones (${evaluacionesFiltradas.length})`}
          icono={<FileText className="w-5 h-5" />}
          delay={0.5}
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Puntaje</TableHead>
                  <TableHead>Severidad</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evaluacionesFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No se encontraron evaluaciones
                    </TableCell>
                  </TableRow>
                ) : (
                  evaluacionesFiltradas.slice(0, 50).map((evaluacion) => (
                    <TableRow key={evaluacion.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">
                            {evaluacion.usuario.nombre}
                          </p>
                          <p className="text-sm text-gray-500">
                            {evaluacion.usuario.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            evaluacion.tipo === 'PHQ-9'
                              ? 'border-blue-300 text-blue-700'
                              : 'border-purple-300 text-purple-700'
                          }
                        >
                          {evaluacion.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-gray-900">
                          {evaluacion.puntaje_total}
                        </span>
                        <span className="text-sm text-gray-500">
                          {' '}/ {evaluacion.tipo === 'PHQ-9' ? '27' : '21'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {obtenerBadgeSeveridad(evaluacion.severidad)}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {format(new Date(evaluacion.creado_en), "dd MMM yyyy 'a las' HH:mm", {
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Ver resultados completos de ${evaluacion.usuario.nombre}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver Resultados
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {evaluacionesFiltradas.length > 50 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700 text-center">
                Mostrando las primeras 50 evaluaciones de {evaluacionesFiltradas.length} resultados.
                Utiliza los filtros para refinar tu búsqueda.
              </p>
            </div>
          )}
        </AdminCard>
      </main>
    </>
  );
}
