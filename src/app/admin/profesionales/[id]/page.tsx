'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { obtenerClienteNavegador } from '../../../../lib/supabase/cliente';
import { Button } from '../../../../lib/componentes/ui/button';
import * as Tabs from '@radix-ui/react-tabs';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  FileCheck,
  Clock,
  User,
  Briefcase,
  Calendar,
  DollarSign,
  MapPin,
  Languages,
  Award,
  Download,
  Save
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ModalAprobar from '../../../../lib/componentes/admin/ModalAprobar';
import VisorDocumento from '../../../../lib/componentes/admin/VisorDocumento';

interface Profesional {
  id: string;
  usuario_id: string;
  titulo_profesional: string;
  numero_licencia: string;
  universidad: string;
  anos_experiencia: number;
  especialidades: string[];
  biografia: string;
  idiomas: string[];
  documentos_verificados: boolean;
  perfil_aprobado: boolean;
  aprobado_por: string | null;
  aprobado_en: string | null;
  notas_admin: string;
  tarifa_por_sesion: number;
  moneda: string;
  creado_en: string;
  usuario: {
    id: string;
    nombre: string;
    email: string;
    rol: string;
    telefono: string;
  };
}

interface Documento {
  id: string;
  tipo: string;
  nombre: string;
  descripcion: string;
  url_archivo: string;
  nombre_archivo: string;
  verificado: boolean;
  verificado_por: string | null;
  verificado_en: string | null;
  notas_verificacion: string;
  creado_en: string;
}

interface Horario {
  id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  duracion_sesion: number;
  activo: boolean;
}

const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function PaginaDetalleProfesional() {
  const router = useRouter();
  const params = useParams();
  const profesionalId = params.id as string;

  const [profesional, setProfesional] = useState<Profesional | null>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [adminId, setAdminId] = useState<string>('');
  const [notasAdmin, setNotasAdmin] = useState('');
  const [guardandoNotas, setGuardandoNotas] = useState(false);
  const [modalAprobarAbierto, setModalAprobarAbierto] = useState(false);
  const [tabActiva, setTabActiva] = useState('informacion');

  useEffect(() => {
    verificarAdminYCargar();
  }, [profesionalId]);

  const verificarAdminYCargar = async () => {
    const supabase = obtenerClienteNavegador();

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/iniciar-sesion');
        return;
      }

      const { data: usuarioData, error } = await supabase
        .from('Usuario')
        .select('id, rol')
        .eq('auth_id', session.user.id)
        .single();

      if (error || !usuarioData || usuarioData.rol !== 'ADMIN') {
        router.push('/dashboard');
        return;
      }

      setAdminId(usuarioData.id);
      await cargarDatos();
    } catch (error) {
      console.error('Error al verificar admin:', error);
      router.push('/iniciar-sesion');
    }
  };

  const cargarDatos = async () => {
    setCargando(true);
    await Promise.all([
      cargarProfesional(),
      cargarDocumentos(),
      cargarHorarios()
    ]);
    setCargando(false);
  };

  const cargarProfesional = async () => {
    const supabase = obtenerClienteNavegador();

    try {
      const { data, error } = await supabase
        .from('PerfilProfesional')
        .select(`
          *,
          usuario:Usuario!usuario_id(
            id,
            nombre,
            email,
            rol,
            telefono
          )
        `)
        .eq('id', profesionalId)
        .single();

      if (error) {
        console.error('Error al cargar profesional:', error);
        toast.error('Error al cargar los datos del profesional');
        return;
      }

      setProfesional(data);
      setNotasAdmin(data.notas_admin || '');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar datos');
    }
  };

  const cargarDocumentos = async () => {
    const supabase = obtenerClienteNavegador();

    try {
      const { data, error } = await supabase
        .from('DocumentoProfesional')
        .select('*')
        .eq('perfil_profesional_id', profesionalId)
        .order('creado_en', { ascending: false });

      if (error) {
        console.error('Error al cargar documentos:', error);
        return;
      }

      setDocumentos(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const cargarHorarios = async () => {
    const supabase = obtenerClienteNavegador();

    try {
      const { data, error } = await supabase
        .from('HorarioProfesional')
        .select('*')
        .eq('perfil_profesional_id', profesionalId)
        .order('dia_semana', { ascending: true });

      if (error) {
        console.error('Error al cargar horarios:', error);
        return;
      }

      setHorarios(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const verificarDocumento = async (documentoId: string, verificado: boolean) => {
    const supabase = obtenerClienteNavegador();

    try {
      const { error } = await supabase
        .from('DocumentoProfesional')
        .update({
          verificado,
          verificado_por: adminId,
          verificado_en: new Date().toISOString()
        })
        .eq('id', documentoId);

      if (error) {
        toast.error('Error al verificar documento');
        return;
      }

      toast.success(verificado ? 'Documento verificado' : 'Verificación removida');
      await cargarDocumentos();

      // Actualizar estado de documentos verificados en el perfil
      const todosVerificados = documentos.every(d =>
        d.id === documentoId ? verificado : d.verificado
      );

      await supabase
        .from('PerfilProfesional')
        .update({ documentos_verificados: todosVerificados })
        .eq('id', profesionalId);

      await cargarProfesional();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al procesar verificación');
    }
  };

  const guardarNotas = async () => {
    const supabase = obtenerClienteNavegador();
    setGuardandoNotas(true);

    try {
      const { error } = await supabase
        .from('PerfilProfesional')
        .update({ notas_admin: notasAdmin })
        .eq('id', profesionalId);

      if (error) {
        toast.error('Error al guardar notas');
        return;
      }

      toast.success('Notas guardadas correctamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar notas');
    } finally {
      setGuardandoNotas(false);
    }
  };

  const aprobarPerfil = async (notasAprobacion: string, enviarEmail: boolean) => {
    const supabase = obtenerClienteNavegador();

    try {
      // 1. Actualizar perfil profesional
      const { error: errorPerfil } = await supabase
        .from('PerfilProfesional')
        .update({
          perfil_aprobado: true,
          documentos_verificados: true,
          aprobado_por: adminId,
          aprobado_en: new Date().toISOString(),
          notas_admin: notasAprobacion
        })
        .eq('id', profesionalId);

      if (errorPerfil) {
        console.error('Error al aprobar perfil:', errorPerfil);
        toast.error('Error al aprobar el perfil');
        return;
      }

      // 2. Actualizar rol del usuario a TERAPEUTA
      const { error: errorUsuario } = await supabase
        .from('Usuario')
        .update({ rol: 'TERAPEUTA' })
        .eq('id', profesional?.usuario_id);

      if (errorUsuario) {
        console.error('Error al actualizar rol:', errorUsuario);
        toast.error('Error al actualizar rol del usuario');
        return;
      }

      // 3. Verificar todos los documentos
      const { error: errorDocs } = await supabase
        .from('DocumentoProfesional')
        .update({
          verificado: true,
          verificado_por: adminId,
          verificado_en: new Date().toISOString()
        })
        .eq('perfil_profesional_id', profesionalId);

      if (errorDocs) {
        console.error('Error al verificar documentos:', errorDocs);
      }

      // TODO: Implementar envío de email si enviarEmail es true

      toast.success('Profesional aprobado correctamente');
      setModalAprobarAbierto(false);
      await cargarDatos();
    } catch (error) {
      console.error('Error al aprobar:', error);
      toast.error('Error al procesar la aprobación');
    }
  };

  const rechazarPerfil = async () => {
    if (!confirm('¿Estás seguro de que quieres rechazar este perfil?')) {
      return;
    }

    const supabase = obtenerClienteNavegador();

    try {
      const { error } = await supabase
        .from('PerfilProfesional')
        .update({
          perfil_aprobado: false,
          documentos_verificados: false,
          aprobado_por: adminId,
          aprobado_en: new Date().toISOString(),
          notas_admin: notasAdmin || 'Perfil rechazado'
        })
        .eq('id', profesionalId);

      if (error) {
        toast.error('Error al rechazar el perfil');
        return;
      }

      toast.success('Perfil rechazado');
      await cargarProfesional();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al procesar el rechazo');
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profesional) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Profesional no encontrado</p>
        <Link href="/admin/profesionales">
          <Button variant="outline" className="mt-4">
            Volver a la lista
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/profesionales">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {profesional.usuario?.nombre}
            </h1>
            <p className="text-gray-600 mt-1">{profesional.titulo_profesional}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {!profesional.perfil_aprobado ? (
            <>
              <Button
                variant="default"
                onClick={() => setModalAprobarAbierto(true)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprobar Perfil
              </Button>
              <Button variant="destructive" onClick={rechazarPerfil}>
                <XCircle className="h-4 w-4 mr-2" />
                Rechazar
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-md">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Perfil Aprobado</span>
            </div>
          )}
        </div>
      </div>

      {/* Estado de documentos */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileCheck className={`h-6 w-6 ${
              profesional.documentos_verificados ? 'text-green-500' : 'text-yellow-500'
            }`} />
            <div>
              <p className="font-medium text-gray-900">
                Documentos Verificados
              </p>
              <p className="text-sm text-gray-600">
                {documentos.filter(d => d.verificado).length} de {documentos.length} documentos verificados
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Registrado el</p>
            <p className="font-medium text-gray-900">
              {new Date(profesional.creado_en).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs.Root value={tabActiva} onValueChange={setTabActiva}>
        <Tabs.List className="flex gap-2 border-b border-gray-200">
          <Tabs.Trigger
            value="informacion"
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
          >
            <User className="h-4 w-4 inline mr-2" />
            Información
          </Tabs.Trigger>
          <Tabs.Trigger
            value="documentos"
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
          >
            <FileCheck className="h-4 w-4 inline mr-2" />
            Documentos ({documentos.length})
          </Tabs.Trigger>
          <Tabs.Trigger
            value="horarios"
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
          >
            <Calendar className="h-4 w-4 inline mr-2" />
            Horarios
          </Tabs.Trigger>
        </Tabs.List>

        {/* Tab: Información */}
        <Tabs.Content value="informacion" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información personal */}
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Información Personal
              </h3>

              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-gray-900">{profesional.usuario?.email}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Teléfono</label>
                <p className="text-gray-900">{profesional.usuario?.telefono || 'No especificado'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Rol Actual</label>
                <p className="text-gray-900">{profesional.usuario?.rol}</p>
              </div>
            </div>

            {/* Información profesional */}
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Información Profesional
              </h3>

              <div>
                <label className="text-sm font-medium text-gray-600">Título Profesional</label>
                <p className="text-gray-900">{profesional.titulo_profesional}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Universidad</label>
                <p className="text-gray-900">{profesional.universidad || 'No especificado'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Número de Licencia</label>
                <p className="text-gray-900">{profesional.numero_licencia}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Años de Experiencia</label>
                <p className="text-gray-900">{profesional.anos_experiencia} años</p>
              </div>
            </div>

            {/* Especialidades e idiomas */}
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Especialidades e Idiomas
              </h3>

              <div>
                <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Especialidades
                </label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profesional.especialidades?.map((esp, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {esp}
                    </span>
                  )) || <p className="text-gray-500">No especificadas</p>}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Languages className="h-4 w-4" />
                  Idiomas
                </label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profesional.idiomas?.map((idioma, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                    >
                      {idioma.toUpperCase()}
                    </span>
                  )) || <p className="text-gray-500">No especificados</p>}
                </div>
              </div>
            </div>

            {/* Tarifa */}
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Información de Tarifa
              </h3>

              <div>
                <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Tarifa por Sesión
                </label>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {profesional.tarifa_por_sesion?.toLocaleString() || 'No especificada'}{' '}
                  {profesional.moneda}
                </p>
              </div>
            </div>

            {/* Biografía */}
            <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Biografía
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {profesional.biografia || 'No especificada'}
              </p>
            </div>

            {/* Notas del admin */}
            <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Notas del Administrador
              </h3>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={4}
                placeholder="Escribe notas internas sobre este profesional..."
                value={notasAdmin}
                onChange={(e) => setNotasAdmin(e.target.value)}
              />
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={guardarNotas}
                  disabled={guardandoNotas}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {guardandoNotas ? 'Guardando...' : 'Guardar Notas'}
                </Button>
              </div>
            </div>
          </div>
        </Tabs.Content>

        {/* Tab: Documentos */}
        <Tabs.Content value="documentos" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {documentos.length === 0 ? (
              <div className="col-span-2 text-center py-12 bg-white rounded-lg shadow">
                <FileCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay documentos cargados</p>
              </div>
            ) : (
              documentos.map((documento) => (
                <VisorDocumento
                  key={documento.id}
                  documento={documento}
                  onVerificar={(verificado) => verificarDocumento(documento.id, verificado)}
                />
              ))
            )}
          </div>
        </Tabs.Content>

        {/* Tab: Horarios */}
        <Tabs.Content value="horarios" className="mt-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Disponibilidad Horaria
            </h3>

            {horarios.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay horarios configurados</p>
              </div>
            ) : (
              <div className="space-y-4">
                {diasSemana.map((dia, index) => {
                  const horariosDelDia = horarios.filter(h => h.dia_semana === index);

                  if (horariosDelDia.length === 0) return null;

                  return (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                      <h4 className="font-medium text-gray-900">{dia}</h4>
                      <div className="mt-2 space-y-2">
                        {horariosDelDia.map((horario) => (
                          <div
                            key={horario.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-gray-700">
                              {horario.hora_inicio} - {horario.hora_fin}
                            </span>
                            <span className="text-gray-600">
                              Sesiones de {horario.duracion_sesion} min
                            </span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              horario.activo
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {horario.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Tabs.Content>
      </Tabs.Root>

      {/* Modal de aprobación */}
      <ModalAprobar
        abierto={modalAprobarAbierto}
        onCerrar={() => setModalAprobarAbierto(false)}
        onAprobar={aprobarPerfil}
        nombreProfesional={profesional.usuario?.nombre || ''}
      />
    </div>
  );
}
