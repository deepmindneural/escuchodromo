'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { FaArrowUp, FaUsers } from 'react-icons/fa';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '../../../lib/componentes/ui/card';
import { Button } from '../../../lib/componentes/ui/button';
import { Badge } from '../../../lib/componentes/ui/badge';
import { Input } from '../../../lib/componentes/ui/input';
import { Skeleton } from '../../../lib/componentes/ui/skeleton';
import {
  PlusCircle,
  Edit,
  ToggleLeft,
  ToggleRight,
  Check,
  TrendingUp,
  DollarSign,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { obtenerClienteNavegador } from '../../../lib/supabase/cliente';
import { toast, Toaster } from 'react-hot-toast';
import { PALETA_ADMIN } from '../../../lib/constantes/coloresAdmin';
import { AdminHeader, AdminStatCard } from '../../../lib/componentes/admin';

interface Plan {
  id: string;
  nombre: string;
  codigo: 'basico' | 'premium' | 'profesional';
  descripcion: string | null;
  precio_mensual: number;
  precio_anual: number;
  moneda: string;
  caracteristicas: Array<{ nombre: string; incluido: boolean }>;
  limite_conversaciones: number | null;
  limite_evaluaciones: number | null;
  acceso_terapeutas: boolean;
  prioridad_soporte: string;
  esta_activo: boolean;
  destacado: boolean;
  orden_visualizacion: number;
  total_suscripciones_activas: number;
  total_suscripciones_historicas: number;
  ingresos_mensuales_estimados: number;
}

export default function PlanesAdminPage() {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [planSeleccionado, setPlanSeleccionado] = useState<Plan | null>(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  // Formulario
  const [formulario, setFormulario] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    precio_mensual: '',
    precio_anual: '',
    moneda: 'COP',
    caracteristicas: [] as Array<{ nombre: string; incluido: boolean }>,
    limite_conversaciones: '',
    limite_evaluaciones: '',
    acceso_terapeutas: false,
    prioridad_soporte: 'basica',
    destacado: false,
    orden_visualizacion: 0,
  });

  useEffect(() => {
    cargarPlanes();
  }, []);

  const cargarPlanes = async () => {
    setCargando(true);
    try {
      const supabase = obtenerClienteNavegador();
      const { data, error } = await supabase.rpc('obtener_planes_admin', {
        p_incluir_inactivos: true,
        p_moneda_filtro: null,
      });

      if (error) throw error;
      setPlanes(data || []);
    } catch (error) {
      console.error('Error al cargar planes:', error);
      toast.error('Error al cargar planes');
    } finally {
      setCargando(false);
    }
  };

  const toggleEstado = async (plan: Plan) => {
    try {
      const supabase = obtenerClienteNavegador();
      const { error } = await supabase.rpc('activar_desactivar_plan_admin', {
        p_plan_id: plan.id,
        p_activar: !plan.esta_activo,
      });

      if (error) throw error;
      toast.success(`Plan ${!plan.esta_activo ? 'activado' : 'desactivado'} exitosamente`);
      await cargarPlanes();
    } catch (error: any) {
      console.error('Error al cambiar estado:', error);
      toast.error(error.message || 'Error al cambiar estado del plan');
    }
  };

  const abrirModalCrear = () => {
    setModoEdicion(false);
    setPlanSeleccionado(null);
    setFormulario({
      nombre: '',
      codigo: '',
      descripcion: '',
      precio_mensual: '',
      precio_anual: '',
      moneda: 'COP',
      caracteristicas: [],
      limite_conversaciones: '',
      limite_evaluaciones: '',
      acceso_terapeutas: false,
      prioridad_soporte: 'basica',
      destacado: false,
      orden_visualizacion: 0,
    });
    setModalAbierto(true);
  };

  const abrirModalEditar = (plan: Plan) => {
    setModoEdicion(true);
    setPlanSeleccionado(plan);
    setFormulario({
      nombre: plan.nombre,
      codigo: plan.codigo,
      descripcion: plan.descripcion || '',
      precio_mensual: plan.precio_mensual.toString(),
      precio_anual: plan.precio_anual.toString(),
      moneda: plan.moneda,
      caracteristicas: plan.caracteristicas,
      limite_conversaciones: plan.limite_conversaciones?.toString() || '',
      limite_evaluaciones: plan.limite_evaluaciones?.toString() || '',
      acceso_terapeutas: plan.acceso_terapeutas,
      prioridad_soporte: plan.prioridad_soporte,
      destacado: plan.destacado,
      orden_visualizacion: plan.orden_visualizacion,
    });
    setModalAbierto(true);
  };

  const guardarPlan = async () => {
    try {
      const supabase = obtenerClienteNavegador();

      if (modoEdicion && planSeleccionado) {
        const { error } = await supabase.rpc('actualizar_plan_admin', {
          p_plan_id: planSeleccionado.id,
          p_nombre: formulario.nombre,
          p_descripcion: formulario.descripcion || null,
          p_precio_mensual: parseFloat(formulario.precio_mensual),
          p_precio_anual: parseFloat(formulario.precio_anual),
          p_caracteristicas: formulario.caracteristicas,
          p_limite_conversaciones: formulario.limite_conversaciones ? parseInt(formulario.limite_conversaciones) : null,
          p_limite_evaluaciones: formulario.limite_evaluaciones ? parseInt(formulario.limite_evaluaciones) : null,
          p_acceso_terapeutas: formulario.acceso_terapeutas,
          p_prioridad_soporte: formulario.prioridad_soporte,
          p_destacado: formulario.destacado,
          p_orden_visualizacion: formulario.orden_visualizacion,
        });

        if (error) throw error;
        toast.success('Plan actualizado exitosamente');
      } else {
        const { error } = await supabase.rpc('crear_plan_admin', {
          p_nombre: formulario.nombre,
          p_codigo: formulario.codigo.toLowerCase().trim(),
          p_descripcion: formulario.descripcion || null,
          p_precio_mensual: parseFloat(formulario.precio_mensual),
          p_precio_anual: parseFloat(formulario.precio_anual),
          p_moneda: formulario.moneda,
          p_caracteristicas: formulario.caracteristicas,
          p_limite_conversaciones: formulario.limite_conversaciones ? parseInt(formulario.limite_conversaciones) : null,
          p_limite_evaluaciones: formulario.limite_evaluaciones ? parseInt(formulario.limite_evaluaciones) : null,
          p_acceso_terapeutas: formulario.acceso_terapeutas,
          p_prioridad_soporte: formulario.prioridad_soporte,
          p_destacado: formulario.destacado,
          p_orden_visualizacion: formulario.orden_visualizacion,
        });

        if (error) throw error;
        toast.success('Plan creado exitosamente');
      }

      setModalAbierto(false);
      await cargarPlanes();
    } catch (error: any) {
      console.error('Error al guardar plan:', error);
      toast.error(error.message || 'Error al guardar plan');
    }
  };

  const agregarCaracteristica = () => {
    setFormulario(prev => ({
      ...prev,
      caracteristicas: [...prev.caracteristicas, { nombre: '', incluido: true }],
    }));
  };

  const formatearMoneda = (valor: number, moneda: string) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: moneda,
      minimumFractionDigits: 0,
    }).format(valor);
  };

  // Calcular estadísticas
  const totalPlanes = planes.length;
  const planesActivos = planes.filter(p => p.esta_activo).length;
  const totalSuscriptores = planes.reduce((sum, p) => sum + p.total_suscripciones_activas, 0);
  const ingresosTotales = planes.reduce((sum, p) => sum + p.ingresos_mensuales_estimados, 0);

  // Datos para gráfico de distribución
  const datosDistribucion = planes.map(p => ({
    nombre: p.nombre,
    valor: p.total_suscripciones_activas || 1,
    color: PALETA_ADMIN.planes[p.codigo]?.primary || '#3B82F6',
  }));

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 text-lg">Cargando planes...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" />

      {/* Header */}
      <AdminHeader
        titulo="Gestión de Planes 📦"
        descripcion="Administra los planes de suscripción disponibles para tu plataforma"
        acciones={
          <Button onClick={abrirModalCrear} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700">
            <PlusCircle className="h-5 w-5" />
            Crear Plan
          </Button>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              titulo: 'Total Planes',
              valor: totalPlanes,
              cambio: 0,
              icono: TrendingUp,
              color: 'from-teal-400 to-teal-600',
              tendencia: 'neutral' as const,
            },
            {
              titulo: 'Planes Activos',
              valor: planesActivos,
              cambio: 0,
              icono: CheckCircle,
              color: 'from-cyan-400 to-cyan-600',
              tendencia: 'neutral' as const,
            },
            {
              titulo: 'Total Suscriptores',
              valor: totalSuscriptores,
              cambio: 0,
              icono: FaUsers,
              color: 'from-purple-400 to-purple-600',
              tendencia: 'neutral' as const,
            },
            {
              titulo: 'Ingresos Mensuales',
              valor: ingresosTotales,
              cambio: 0,
              icono: DollarSign,
              color: 'from-amber-400 to-orange-600',
              tendencia: 'neutral' as const,
              formato: 'moneda' as const,
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
              formato={tarjeta.formato || 'numero'}
              delay={index * 0.1}
            />
          ))}
        </div>

        {/* Gráfico de distribución */}
        {totalSuscriptores > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Suscriptores por Plan</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={datosDistribucion}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="valor"
                  label={({ nombre, percent }: any) => `${nombre} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {datosDistribucion.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Tarjetas de planes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {planes.map((plan, index) => {
            const coloresPlan = PALETA_ADMIN.planes[plan.codigo];

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -8 }}
                className={`relative overflow-hidden border-2 ${coloresPlan?.border} ${coloresPlan?.bg} rounded-lg hover:shadow-xl transition-shadow duration-300`}
              >
                <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${coloresPlan?.gradient}`} />

                <Card className="border-0 bg-transparent">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className={`text-2xl font-bold ${coloresPlan?.text} mb-2`}>
                          {plan.nombre}
                        </CardTitle>
                        <Badge
                          className={plan.esta_activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}
                        >
                          <span className={`w-2 h-2 rounded-full mr-2 ${plan.esta_activo ? 'bg-green-500' : 'bg-gray-400'}`} />
                          {plan.esta_activo ? 'ACTIVO' : 'INACTIVO'}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-baseline gap-2">
                        <span className={`text-4xl font-bold ${coloresPlan?.text}`}>
                          {formatearMoneda(plan.precio_mensual, plan.moneda)}
                        </span>
                        <span className="text-gray-500 text-sm">/mes</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatearMoneda(plan.precio_anual, plan.moneda)} /año
                      </p>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/70 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center gap-2 text-gray-600 text-xs mb-1">
                          <FaUsers className="h-3 w-3" />
                          <span>Suscriptores</span>
                        </div>
                        <p className={`text-2xl font-bold ${coloresPlan?.text}`}>
                          {plan.total_suscripciones_activas}
                        </p>
                      </div>

                      <div className="bg-white/70 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center gap-2 text-gray-600 text-xs mb-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>Ingresos/mes</span>
                        </div>
                        <p className={`text-lg font-bold ${coloresPlan?.text}`}>
                          {formatearMoneda(plan.ingresos_mensuales_estimados, plan.moneda).replace(/\s/g, '')}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">
                        Características
                      </h4>
                      <ul className="space-y-2">
                        {plan.caracteristicas.slice(0, 4).map((car, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <Check className={`h-4 w-4 ${coloresPlan?.text} mt-0.5 flex-shrink-0`} />
                            <span className="text-gray-700">{car.nombre}</span>
                          </li>
                        ))}
                        {plan.caracteristicas.length > 4 && (
                          <li className="text-sm text-gray-500 ml-6">
                            +{plan.caracteristicas.length - 4} más
                          </li>
                        )}
                      </ul>
                    </div>
                  </CardContent>

                  <CardFooter className="flex gap-2 pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      className={`flex-1 ${coloresPlan?.text} hover:${coloresPlan?.bg}`}
                      onClick={() => abrirModalEditar(plan)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleEstado(plan)}
                      className={plan.esta_activo ? 'text-green-600' : 'text-gray-400'}
                    >
                      {plan.esta_activo ? (
                        <ToggleRight className="h-5 w-5" />
                      ) : (
                        <ToggleLeft className="h-5 w-5" />
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* Modal Crear/Editar Plan - Versión simplificada */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">
                {modoEdicion ? 'Editar Plan' : 'Crear Nuevo Plan'}
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre del Plan *</label>
                    <Input
                      value={formulario.nombre}
                      onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
                      placeholder="Ej: Premium"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Código *</label>
                    <Input
                      value={formulario.codigo}
                      onChange={(e) => setFormulario({ ...formulario, codigo: e.target.value.toLowerCase() })}
                      placeholder="Ej: premium"
                      disabled={modoEdicion}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Descripción</label>
                  <Input
                    value={formulario.descripcion}
                    onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })}
                    placeholder="Descripción del plan"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Precio Mensual *</label>
                    <Input
                      type="number"
                      value={formulario.precio_mensual}
                      onChange={(e) => setFormulario({ ...formulario, precio_mensual: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Precio Anual *</label>
                    <Input
                      type="number"
                      value={formulario.precio_anual}
                      onChange={(e) => setFormulario({ ...formulario, precio_anual: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium">Características</label>
                    <Button type="button" variant="outline" size="sm" onClick={agregarCaracteristica}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Agregar
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {formulario.caracteristicas.map((car, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input
                          value={car.nombre}
                          onChange={(e) => {
                            const nuevas = [...formulario.caracteristicas];
                            nuevas[idx].nombre = e.target.value;
                            setFormulario({ ...formulario, caracteristicas: nuevas });
                          }}
                          placeholder="Nombre de la característica"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const nuevas = formulario.caracteristicas.filter((_, i) => i !== idx);
                            setFormulario({ ...formulario, caracteristicas: nuevas });
                          }}
                        >
                          <XCircle className="h-5 w-5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                <Button variant="outline" onClick={() => setModalAbierto(false)}>
                  Cancelar
                </Button>
                <Button onClick={guardarPlan} className="bg-blue-600 hover:bg-blue-700">
                  {modoEdicion ? 'Actualizar' : 'Crear'} Plan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
