'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  MessageSquare,
  FileText,
  CreditCard,
  Video,
  Edit2,
  Activity,
} from 'lucide-react';
import { AdminHeader, AdminCard } from '../../../../lib/componentes/admin';
import { Button } from '../../../../lib/componentes/ui/button';
import { Badge } from '../../../../lib/componentes/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../lib/componentes/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../lib/componentes/ui/table';
import { obtenerClienteNavegador } from '../../../../lib/supabase/cliente';
import { toast, Toaster } from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Usuario {
  id: string;
  email: string;
  nombre: string | null;
  apellido: string | null;
  telefono: string | null;
  imagen_url: string | null;
  rol: string;
  esta_activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

interface Conversacion {
  id: string;
  tipo: string;
  emocion: string | null;
  duracion: number | null;
  creado_en: string;
}

interface Evaluacion {
  id: string;
  tipo: string;
  puntaje_total: number;
  severidad: string;
  creado_en: string;
}

interface Pago {
  id: string;
  monto: number;
  moneda: string;
  estado: string;
  metodo_pago: string;
  creado_en: string;
}

interface Suscripcion {
  id: string;
  estado: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  Plan: {
    nombre: string;
    precio: number;
    moneda: string;
  };
}

interface Cita {
  id: string;
  fecha_hora: string;
  estado: string;
  PerfilProfesional: {
    Usuario: {
      nombre: string;
      apellido: string;
    };
  };
}

/**
 * Página de Detalles de Usuario - Admin Dashboard
 *
 * Muestra información completa del usuario en 5 tabs:
 * 1. Información General
 * 2. Conversaciones
 * 3. Evaluaciones
 * 4. Pagos y Suscripciones
 * 5. Citas
 */
export default function DetallesUsuario() {
  const router = useRouter();
  const params = useParams();
  const usuarioId = params.id as string;

  const [cargando, setCargando] = useState(true);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [suscripcion, setSuscripcion] = useState<Suscripcion | null>(null);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [estadisticas, setEstadisticas] = useState({
    totalConversaciones: 0,
    totalEvaluaciones: 0,
    totalPagos: 0,
    totalCitas: 0,
  });

  useEffect(() => {
    if (usuarioId) {
      cargarDatosUsuario();
    }
  }, [usuarioId]);

  const cargarDatosUsuario = async () => {
    setCargando(true);
    try {
      const supabase = obtenerClienteNavegador();

      // Cargar información básica del usuario
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('Usuario')
        .select('*')
        .eq('id', usuarioId)
        .single();

      if (usuarioError) {
        console.error('Error al cargar usuario:', usuarioError);
        toast.error('Error al cargar información del usuario');
        return;
      }

      setUsuario(usuarioData);

      // Cargar conversaciones (últimas 20)
      const { data: conversacionesData, error: conversacionesError } = await supabase
        .from('Conversacion')
        .select('id, tipo, emocion, duracion, creado_en')
        .eq('usuario_id', usuarioId)
        .order('creado_en', { ascending: false })
        .limit(20);

      if (!conversacionesError && conversacionesData) {
        setConversaciones(conversacionesData);
      }

      // Cargar evaluaciones
      const { data: evaluacionesData, error: evaluacionesError } = await supabase
        .from('Evaluacion')
        .select('id, tipo, puntaje_total, severidad, creado_en')
        .eq('usuario_id', usuarioId)
        .order('creado_en', { ascending: false });

      if (!evaluacionesError && evaluacionesData) {
        setEvaluaciones(evaluacionesData);
      }

      // Cargar pagos
      const { data: pagosData, error: pagosError } = await supabase
        .from('Pago')
        .select('id, monto, moneda, estado, metodo_pago, creado_en')
        .eq('usuario_id', usuarioId)
        .order('creado_en', { ascending: false });

      if (!pagosError && pagosData) {
        setPagos(pagosData);
      }

      // Cargar suscripción activa
      const { data: suscripcionData, error: suscripcionError } = await supabase
        .from('Suscripcion')
        .select(`
          id,
          estado,
          fecha_inicio,
          fecha_fin,
          Plan (
            nombre,
            precio,
            moneda
          )
        `)
        .eq('usuario_id', usuarioId)
        .eq('estado', 'activa')
        .single();

      if (!suscripcionError && suscripcionData) {
        setSuscripcion(suscripcionData as any);
      }

      // Cargar citas
      const { data: citasData, error: citasError } = await supabase
        .from('Cita')
        .select(`
          id,
          fecha_hora,
          estado,
          PerfilProfesional (
            Usuario (
              nombre,
              apellido
            )
          )
        `)
        .eq('paciente_id', usuarioId)
        .order('fecha_hora', { ascending: false });

      if (!citasError && citasData) {
        setCitas(citasData as any);
      }

      // Calcular estadísticas
      setEstadisticas({
        totalConversaciones: conversacionesData?.length || 0,
        totalEvaluaciones: evaluacionesData?.length || 0,
        totalPagos: pagosData?.length || 0,
        totalCitas: citasData?.length || 0,
      });
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar datos del usuario');
    } finally {
      setCargando(false);
    }
  };

  const obtenerBadgeRol = (rol: string) => {
    const roles: Record<string, { className: string; texto: string }> = {
      ADMIN: { className: 'bg-purple-100 text-purple-800 border-purple-300', texto: 'Administrador' },
      TERAPEUTA: { className: 'bg-green-100 text-green-800 border-green-300', texto: 'Terapeuta' },
      USUARIO: { className: 'bg-blue-100 text-blue-800 border-blue-300', texto: 'Usuario' },
    };

    const config = roles[rol] || roles.USUARIO;
    return <Badge className={config.className}>{config.texto}</Badge>;
  };

  const obtenerBadgeEstado = (activo: boolean) => {
    return activo ? (
      <Badge className="bg-green-100 text-green-800 border-green-300">Activo</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 border-red-300">Inactivo</Badge>
    );
  };

  const obtenerBadgeSeveridad = (severidad: string) => {
    const severidadLower = severidad.toLowerCase();
    if (severidadLower === 'severa' || severidadLower === 'critica') {
      return <Badge className="bg-red-100 text-red-800 border-red-300">{severidad}</Badge>;
    } else if (severidadLower === 'moderadamente severa') {
      return <Badge className="bg-orange-100 text-orange-800 border-orange-300">{severidad}</Badge>;
    } else if (severidadLower === 'moderada') {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">{severidad}</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800 border-green-300">{severidad}</Badge>;
    }
  };

  if (cargando || !usuario) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 text-lg">Cargando información del usuario...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" />

      <AdminHeader
        titulo={`${usuario.nombre || 'Usuario'} ${usuario.apellido || ''}`}
        descripcion={usuario.email}
      >
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push('/admin/usuarios')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <Button>
            <Edit2 className="w-4 h-4 mr-2" />
            Editar Usuario
          </Button>
        </div>
      </AdminHeader>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Header con información resumida */}
        <AdminCard className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Rol</p>
                {obtenerBadgeRol(usuario.rol)}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                {obtenerBadgeEstado(usuario.esta_activo)}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Registrado</p>
                <p className="text-sm font-medium text-gray-900">
                  {format(new Date(usuario.creado_en), 'dd MMM yyyy', { locale: es })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Actividad</p>
                <p className="text-sm font-medium text-gray-900">
                  {estadisticas.totalConversaciones} conversaciones
                </p>
              </div>
            </div>
          </div>
        </AdminCard>

        {/* Tabs con información detallada */}
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="general">
              <User className="w-4 h-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="conversaciones">
              <MessageSquare className="w-4 h-4 mr-2" />
              Conversaciones
            </TabsTrigger>
            <TabsTrigger value="evaluaciones">
              <FileText className="w-4 h-4 mr-2" />
              Evaluaciones
            </TabsTrigger>
            <TabsTrigger value="pagos">
              <CreditCard className="w-4 h-4 mr-2" />
              Pagos
            </TabsTrigger>
            <TabsTrigger value="citas">
              <Video className="w-4 h-4 mr-2" />
              Citas
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Información General */}
          <TabsContent value="general">
            <AdminCard titulo="Información Personal" icono={<User className="w-5 h-5" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </label>
                    <p className="mt-1 text-gray-900">{usuario.email}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Nombre Completo
                    </label>
                    <p className="mt-1 text-gray-900">
                      {usuario.nombre || 'No especificado'} {usuario.apellido || ''}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Teléfono
                    </label>
                    <p className="mt-1 text-gray-900">{usuario.telefono || 'No especificado'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Rol
                    </label>
                    <div className="mt-1">{obtenerBadgeRol(usuario.rol)}</div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Fecha de Registro
                    </label>
                    <p className="mt-1 text-gray-900">
                      {format(new Date(usuario.creado_en), "dd MMM yyyy 'a las' HH:mm", {
                        locale: es,
                      })}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Estado
                    </label>
                    <div className="mt-1">{obtenerBadgeEstado(usuario.esta_activo)}</div>
                  </div>
                </div>
              </div>

              {/* Estadísticas resumidas */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Estadísticas Resumidas
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                    <p className="text-sm text-blue-700 font-medium">Conversaciones</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {estadisticas.totalConversaciones}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                    <p className="text-sm text-purple-700 font-medium">Evaluaciones</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {estadisticas.totalEvaluaciones}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                    <p className="text-sm text-green-700 font-medium">Pagos</p>
                    <p className="text-2xl font-bold text-green-900">
                      {estadisticas.totalPagos}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
                    <p className="text-sm text-orange-700 font-medium">Citas</p>
                    <p className="text-2xl font-bold text-orange-900">
                      {estadisticas.totalCitas}
                    </p>
                  </div>
                </div>
              </div>
            </AdminCard>
          </TabsContent>

          {/* Tab 2: Conversaciones */}
          <TabsContent value="conversaciones">
            <AdminCard
              titulo={`Conversaciones (${conversaciones.length})`}
              icono={<MessageSquare className="w-5 h-5" />}
            >
              {conversaciones.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay conversaciones registradas
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Emoción</TableHead>
                      <TableHead>Duración</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conversaciones.map((conv) => (
                      <TableRow key={conv.id}>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              conv.tipo === 'chat'
                                ? 'border-blue-300 text-blue-700'
                                : 'border-purple-300 text-purple-700'
                            }
                          >
                            {conv.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">
                          {conv.emocion || 'No detectada'}
                        </TableCell>
                        <TableCell>
                          {conv.duracion
                            ? `${Math.round(conv.duracion / 60)} min`
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {format(new Date(conv.creado_en), 'dd MMM yyyy HH:mm', {
                            locale: es,
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </AdminCard>
          </TabsContent>

          {/* Tab 3: Evaluaciones */}
          <TabsContent value="evaluaciones">
            <AdminCard
              titulo={`Evaluaciones (${evaluaciones.length})`}
              icono={<FileText className="w-5 h-5" />}
            >
              {evaluaciones.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay evaluaciones registradas
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Puntaje</TableHead>
                      <TableHead>Severidad</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {evaluaciones.map((evaluacion) => (
                      <TableRow key={evaluacion.id}>
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
                        <TableCell className="font-semibold">
                          {evaluacion.puntaje_total}{' '}
                          <span className="text-sm text-gray-500">
                            / {evaluacion.tipo === 'PHQ-9' ? '27' : '21'}
                          </span>
                        </TableCell>
                        <TableCell>{obtenerBadgeSeveridad(evaluacion.severidad)}</TableCell>
                        <TableCell>
                          {format(new Date(evaluacion.creado_en), 'dd MMM yyyy HH:mm', {
                            locale: es,
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </AdminCard>
          </TabsContent>

          {/* Tab 4: Pagos y Suscripciones */}
          <TabsContent value="pagos">
            <div className="space-y-6">
              {/* Suscripción Activa */}
              {suscripcion && (
                <AdminCard titulo="Suscripción Activa" icono={<CreditCard className="w-5 h-5" />}>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {suscripcion.Plan.nombre}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {suscripcion.Plan.precio} {suscripcion.Plan.moneda} / mes
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Inicio:{' '}
                          {format(new Date(suscripcion.fecha_inicio), 'dd MMM yyyy', {
                            locale: es,
                          })}
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-800 border-green-300">
                        {suscripcion.estado}
                      </Badge>
                    </div>
                  </div>
                </AdminCard>
              )}

              {/* Historial de Pagos */}
              <AdminCard
                titulo={`Historial de Pagos (${pagos.length})`}
                icono={<CreditCard className="w-5 h-5" />}
              >
                {pagos.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay pagos registrados
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Monto</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagos.map((pago) => (
                        <TableRow key={pago.id}>
                          <TableCell className="font-semibold">
                            {pago.monto.toFixed(2)} {pago.moneda}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                pago.estado === 'completado'
                                  ? 'bg-green-100 text-green-800 border-green-300'
                                  : pago.estado === 'pendiente'
                                  ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                                  : 'bg-red-100 text-red-800 border-red-300'
                              }
                            >
                              {pago.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize">
                            {pago.metodo_pago || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {format(new Date(pago.creado_en), 'dd MMM yyyy HH:mm', {
                              locale: es,
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </AdminCard>
            </div>
          </TabsContent>

          {/* Tab 5: Citas */}
          <TabsContent value="citas">
            <AdminCard
              titulo={`Citas con Profesionales (${citas.length})`}
              icono={<Video className="w-5 h-5" />}
            >
              {citas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay citas registradas
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profesional</TableHead>
                      <TableHead>Fecha y Hora</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {citas.map((cita) => (
                      <TableRow key={cita.id}>
                        <TableCell>
                          {cita.PerfilProfesional?.Usuario?.nombre || 'No especificado'}{' '}
                          {cita.PerfilProfesional?.Usuario?.apellido || ''}
                        </TableCell>
                        <TableCell>
                          {format(new Date(cita.fecha_hora), "dd MMM yyyy 'a las' HH:mm", {
                            locale: es,
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              cita.estado === 'confirmada'
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : cita.estado === 'pendiente'
                                ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                                : cita.estado === 'completada'
                                ? 'bg-blue-100 text-blue-800 border-blue-300'
                                : 'bg-red-100 text-red-800 border-red-300'
                            }
                          >
                            {cita.estado}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </AdminCard>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
