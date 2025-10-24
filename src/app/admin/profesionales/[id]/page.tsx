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
  Save,
  AlertCircle,
  Loader2,
  FileText
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
  const [error, setError] = useState<string | null>(null);
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
      // Timeout de 10 segundos para detectar problemas de carga
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout al cargar datos')), 10000)
      );

      const queryPromise = supabase
        .from('PerfilProfesional')
        .select('*')
        .eq('id', profesionalId)
        .single();

      const { data: perfilData, error: errorPerfil } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]) as any;

      if (errorPerfil) {
        console.error('Error al cargar perfil profesional:', errorPerfil);
        setError('Error al cargar los datos del profesional');
        toast.error('Error al cargar los datos del profesional');
        return;
      }

      if (!perfilData) {
        setError('Profesional no encontrado');
        return;
      }

      // Cargar datos del usuario por separado
      const { data: usuarioData, error: errorUsuario } = await supabase
        .from('Usuario')
        .select('id, nombre, email, rol, telefono')
        .eq('id', perfilData.usuario_id)
        .single();

      if (errorUsuario) {
        console.error('Error al cargar usuario:', errorUsuario);
        toast.error('Error al cargar datos del usuario');
      }

      // Combinar datos
      const profesionalCompleto = {
        ...perfilData,
        usuario: usuarioData
      };

      setProfesional(profesionalCompleto);
      setNotasAdmin(perfilData.notas_admin || '');
      setError(null);
    } catch (error: any) {
      console.error('Error al cargar profesional:', error);
      if (error.message === 'Timeout al cargar datos') {
        setError('La carga está tardando demasiado. Por favor, verifica tu conexión.');
        toast.error('Tiempo de espera agotado');
      } else {
        setError('Error inesperado al cargar datos');
        toast.error('Error al cargar datos');
      }
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

  // Loading state mejorado
  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-calma-100 via-white to-esperanza-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center">
            <Loader2 className="w-16 h-16 text-calma-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <User className="w-6 h-6 text-calma-600" />
            </div>
          </div>
          <p className="mt-4 text-lg font-medium text-gray-700">
            Cargando información del profesional
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Por favor espera un momento...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !profesional) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-alerta-100 via-white to-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {error === 'Profesional no encontrado'
              ? 'Profesional No Encontrado'
              : 'Error al Cargar Datos'}
          </h2>

          <p className="text-gray-600 mb-6">
            {error || 'El profesional que buscas no existe o fue eliminado.'}
          </p>

          <div className="flex gap-3">
            <Link href="/admin/profesionales" className="flex-1">
              <Button
                variant="outline"
                className="w-full"
                aria-label="Volver a lista de profesionales"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a la Lista
              </Button>
            </Link>
            <Button
              onClick={() => {
                setError(null);
                setCargando(true);
                cargarDatos();
              }}
              className="flex-1"
              aria-label="Reintentar carga"
            >
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-calma-50">
      {/* Breadcrumbs */}
      <nav className="bg-white border-b border-gray-200 px-6 py-3" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm">
          <li>
            <Link href="/admin" className="text-gray-500 hover:text-gray-700 transition-colors">
              Admin
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li>
            <Link href="/admin/profesionales" className="text-gray-500 hover:text-gray-700 transition-colors">
              Profesionales
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 font-medium" aria-current="page">
            {profesional.usuario?.nombre || 'Detalles'}
          </li>
        </ol>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header con gradiente terapéutico */}
        <div className="relative overflow-hidden bg-gradient-to-br from-calma-500 via-calma-400 to-esperanza-500 rounded-2xl shadow-xl">
          {/* Patrón decorativo de fondo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full translate-y-48 -translate-x-48"></div>
          </div>

          <div className="relative p-8">
            <div className="flex items-start justify-between gap-6">
              {/* Información principal */}
              <div className="flex items-start gap-6 flex-1">
                {/* Botón volver */}
                <Link href="/admin/profesionales">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-all duration-200"
                    aria-label="Volver a lista de profesionales"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>

                {/* Avatar y datos */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg">
                    <User className="w-10 h-10 text-calma-600" />
                  </div>

                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-white mb-2">
                      {profesional.usuario?.nombre}
                    </h1>
                    <p className="text-white/90 text-lg mb-3 flex items-center gap-2">
                      <Briefcase className="w-5 h-5" />
                      {profesional.titulo_profesional}
                    </p>

                    {/* Badges de estado */}
                    <div className="flex flex-wrap gap-2">
                      {/* Estado de aprobación */}
                      {profesional.perfil_aprobado ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-full text-sm font-medium shadow-md">
                          <CheckCircle className="w-4 h-4" />
                          Perfil Aprobado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 text-white rounded-full text-sm font-medium shadow-md">
                          <Clock className="w-4 h-4" />
                          Pendiente de Aprobación
                        </span>
                      )}

                      {/* Estado de documentos */}
                      {profesional.documentos_verificados ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-medium">
                          <FileCheck className="w-4 h-4" />
                          Documentos Verificados
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-medium">
                          <FileCheck className="w-4 h-4" />
                          {documentos.filter(d => d.verificado).length}/{documentos.length} Documentos
                        </span>
                      )}

                      {/* Rol actual */}
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-medium">
                        {profesional.usuario?.rol}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col gap-2">
                {!profesional.perfil_aprobado ? (
                  <>
                    <Button
                      onClick={() => setModalAprobarAbierto(true)}
                      className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      aria-label="Aprobar perfil del profesional"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aprobar Perfil
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={rechazarPerfil}
                      className="shadow-lg hover:shadow-xl transition-all duration-200"
                      aria-label="Rechazar perfil del profesional"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rechazar
                    </Button>
                  </>
                ) : (
                  <div className="px-4 py-3 bg-green-600 text-white rounded-lg font-medium text-center shadow-lg">
                    Aprobado
                  </div>
                )}
              </div>
            </div>

            {/* Información adicional del header */}
            <div className="mt-6 pt-6 border-t border-white/20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white/90">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5" />
                  <div>
                    <p className="text-xs text-white/70">Registrado</p>
                    <p className="font-medium">
                      {new Date(profesional.creado_en).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5" />
                  <div>
                    <p className="text-xs text-white/70">Experiencia</p>
                    <p className="font-medium">{profesional.anos_experiencia} años</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5" />
                  <div>
                    <p className="text-xs text-white/70">Tarifa</p>
                    <p className="font-medium">
                      {profesional.tarifa_por_sesion?.toLocaleString() || 'N/A'} {profesional.moneda}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs con diseño terapéutico */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <Tabs.Root value={tabActiva} onValueChange={setTabActiva}>
            <Tabs.List
              className="flex gap-1 p-1 bg-gray-100 border-b border-gray-200"
              role="tablist"
              aria-label="Información del profesional"
            >
              <Tabs.Trigger
                value="informacion"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-gray-600 rounded-lg transition-all duration-200 hover:text-gray-900 hover:bg-white/50 data-[state=active]:bg-white data-[state=active]:text-calma-600 data-[state=active]:shadow-md focus:outline-none focus:ring-2 focus:ring-calma-500 focus:ring-offset-2"
                role="tab"
                aria-selected={tabActiva === 'informacion'}
                aria-controls="tab-informacion"
              >
                <User className="h-5 w-5" />
                <span>Información</span>
              </Tabs.Trigger>

              <Tabs.Trigger
                value="documentos"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-gray-600 rounded-lg transition-all duration-200 hover:text-gray-900 hover:bg-white/50 data-[state=active]:bg-white data-[state=active]:text-calma-600 data-[state=active]:shadow-md focus:outline-none focus:ring-2 focus:ring-calma-500 focus:ring-offset-2"
                role="tab"
                aria-selected={tabActiva === 'documentos'}
                aria-controls="tab-documentos"
              >
                <FileCheck className="h-5 w-5" />
                <span>Documentos</span>
                <span className="ml-1 px-2 py-0.5 bg-calma-100 text-calma-700 rounded-full text-xs font-semibold">
                  {documentos.length}
                </span>
              </Tabs.Trigger>

              <Tabs.Trigger
                value="horarios"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-gray-600 rounded-lg transition-all duration-200 hover:text-gray-900 hover:bg-white/50 data-[state=active]:bg-white data-[state=active]:text-calma-600 data-[state=active]:shadow-md focus:outline-none focus:ring-2 focus:ring-calma-500 focus:ring-offset-2"
                role="tab"
                aria-selected={tabActiva === 'horarios'}
                aria-controls="tab-horarios"
              >
                <Calendar className="h-5 w-5" />
                <span>Horarios</span>
                {horarios.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-esperanza-100 text-esperanza-700 rounded-full text-xs font-semibold">
                    {horarios.length}
                  </span>
                )}
              </Tabs.Trigger>
            </Tabs.List>

            {/* Tab: Información */}
            <Tabs.Content
              value="informacion"
              className="p-6 focus:outline-none"
              role="tabpanel"
              id="tab-informacion"
              aria-labelledby="tab-informacion"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Información personal */}
                <div className="bg-gradient-to-br from-white to-calma-50 rounded-xl shadow-md border border-calma-100 p-6 space-y-5">
                  <div className="flex items-center gap-3 pb-4 border-b border-calma-200">
                    <div className="w-10 h-10 rounded-lg bg-calma-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-calma-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Información Personal
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Correo Electrónico
                      </label>
                      <p className="mt-1 text-gray-900 font-medium">{profesional.usuario?.email}</p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Teléfono
                      </label>
                      <p className="mt-1 text-gray-900 font-medium">
                        {profesional.usuario?.telefono || (
                          <span className="text-gray-400 italic">No especificado</span>
                        )}
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Rol Actual
                      </label>
                      <div className="mt-1">
                        <span className="inline-flex items-center px-3 py-1 bg-calma-100 text-calma-800 rounded-lg text-sm font-medium">
                          {profesional.usuario?.rol}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información profesional */}
                <div className="bg-gradient-to-br from-white to-esperanza-50 rounded-xl shadow-md border border-esperanza-100 p-6 space-y-5">
                  <div className="flex items-center gap-3 pb-4 border-b border-esperanza-200">
                    <div className="w-10 h-10 rounded-lg bg-esperanza-100 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-esperanza-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Información Profesional
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Título Profesional
                      </label>
                      <p className="mt-1 text-gray-900 font-medium">{profesional.titulo_profesional}</p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Universidad
                      </label>
                      <p className="mt-1 text-gray-900 font-medium">
                        {profesional.universidad || (
                          <span className="text-gray-400 italic">No especificada</span>
                        )}
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Número de Licencia
                      </label>
                      <p className="mt-1 text-gray-900 font-mono font-medium">{profesional.numero_licencia}</p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Años de Experiencia
                      </label>
                      <p className="mt-1 text-gray-900 font-medium">{profesional.anos_experiencia} años</p>
                    </div>
                  </div>
                </div>

                {/* Especialidades e idiomas */}
                <div className="bg-gradient-to-br from-white to-serenidad-50 rounded-xl shadow-md border border-serenidad-100 p-6 space-y-5">
                  <div className="flex items-center gap-3 pb-4 border-b border-serenidad-200">
                    <div className="w-10 h-10 rounded-lg bg-serenidad-100 flex items-center justify-center">
                      <Award className="w-5 h-5 text-serenidad-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Especialidades e Idiomas
                    </h3>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2 mb-3">
                        <Award className="h-4 w-4" />
                        Especialidades
                      </label>
                      {profesional.especialidades && profesional.especialidades.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {profesional.especialidades.map((esp, index) => (
                            <span
                              key={index}
                              className="px-3 py-1.5 bg-serenidad-100 text-serenidad-800 rounded-lg text-sm font-medium"
                            >
                              {esp}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 italic">No especificadas</p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2 mb-3">
                        <Languages className="h-4 w-4" />
                        Idiomas
                      </label>
                      {profesional.idiomas && profesional.idiomas.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {profesional.idiomas.map((idioma, index) => (
                            <span
                              key={index}
                              className="px-3 py-1.5 bg-esperanza-100 text-esperanza-800 rounded-lg text-sm font-medium"
                            >
                              {idioma.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 italic">No especificados</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tarifa */}
                <div className="bg-gradient-to-br from-white to-calidez-50 rounded-xl shadow-md border border-calidez-100 p-6 space-y-5">
                  <div className="flex items-center gap-3 pb-4 border-b border-calidez-200">
                    <div className="w-10 h-10 rounded-lg bg-calidez-100 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-calidez-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Información de Tarifa
                    </h3>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Tarifa por Sesión
                    </label>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {profesional.tarifa_por_sesion?.toLocaleString() || (
                        <span className="text-xl text-gray-400">No especificada</span>
                      )}{' '}
                      <span className="text-xl text-gray-600">{profesional.moneda}</span>
                    </p>
                  </div>
                </div>

                {/* Biografía */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-md border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-calma-600" />
                    Biografía
                  </h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {profesional.biografia || (
                      <span className="text-gray-400 italic">No especificada</span>
                    )}
                  </p>
                </div>

                {/* Notas del admin */}
                <div className="lg:col-span-2 bg-gradient-to-br from-alerta-50 to-white rounded-xl shadow-md border border-alerta-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Save className="w-5 h-5 text-alerta-600" />
                    Notas del Administrador
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Notas internas visibles solo para administradores
                  </p>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-calma-500 focus:border-calma-500 transition-all duration-200"
                    rows={4}
                    placeholder="Escribe notas internas sobre este profesional..."
                    value={notasAdmin}
                    onChange={(e) => setNotasAdmin(e.target.value)}
                    aria-label="Notas del administrador sobre el profesional"
                  />
                  <div className="mt-4 flex justify-end">
                    <Button
                      onClick={guardarNotas}
                      disabled={guardandoNotas}
                      className="shadow-md hover:shadow-lg transition-all duration-200"
                      aria-label="Guardar notas del administrador"
                    >
                      {guardandoNotas ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Guardar Notas
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Tabs.Content>

            {/* Tab: Documentos */}
            <Tabs.Content
              value="documentos"
              className="p-6 focus:outline-none"
              role="tabpanel"
              id="tab-documentos"
              aria-labelledby="tab-documentos"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {documentos.length === 0 ? (
                  <div className="col-span-2 text-center py-16 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-300">
                    <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <FileCheck className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No hay documentos cargados
                    </h3>
                    <p className="text-gray-500">
                      Este profesional aún no ha subido documentos para verificación
                    </p>
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
            <Tabs.Content
              value="horarios"
              className="p-6 focus:outline-none"
              role="tabpanel"
              id="tab-horarios"
              aria-labelledby="tab-horarios"
            >
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-200 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-calma-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-calma-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Disponibilidad Horaria
                  </h3>
                </div>

                {horarios.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Calendar className="h-10 w-10 text-gray-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      No hay horarios configurados
                    </h4>
                    <p className="text-gray-500">
                      El profesional aún no ha definido su disponibilidad
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4" role="list" aria-label="Horarios del profesional por día">
                    {diasSemana.map((dia, index) => {
                      const horariosDelDia = horarios.filter(h => h.dia_semana === index);

                      if (horariosDelDia.length === 0) return null;

                      return (
                        <div
                          key={index}
                          className="border-l-4 border-calma-500 pl-4 py-3 bg-gradient-to-r from-calma-50 to-transparent rounded-r-lg"
                          role="listitem"
                        >
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-calma-600" />
                            {dia}
                          </h4>
                          <div className="space-y-2">
                            {horariosDelDia.map((horario) => (
                              <div
                                key={horario.id}
                                className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-gray-200 hover:border-calma-300 transition-colors duration-200"
                              >
                                <div className="flex items-center gap-3">
                                  <Clock className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-900 font-medium">
                                    {horario.hora_inicio} - {horario.hora_fin}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm text-gray-600">
                                    Sesiones de {horario.duracion_sesion} min
                                  </span>
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                      horario.activo
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}
                                    aria-label={horario.activo ? 'Horario activo' : 'Horario inactivo'}
                                  >
                                    {horario.activo ? 'Activo' : 'Inactivo'}
                                  </span>
                                </div>
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
        </div>

        {/* Modal de aprobación */}
        <ModalAprobar
          abierto={modalAprobarAbierto}
          onCerrar={() => setModalAprobarAbierto(false)}
          onAprobar={aprobarPerfil}
          nombreProfesional={profesional.usuario?.nombre || ''}
        />
      </div>
    </div>
  );
}
