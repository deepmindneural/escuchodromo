'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { obtenerClienteNavegador } from '../../../lib/supabase/cliente';
import { Button } from '../../../lib/componentes/ui/button';
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Profesional {
  id: string;
  titulo_profesional: string;
  numero_licencia: string;
  universidad: string;
  anos_experiencia: number;
  perfil_aprobado: boolean;
  documentos_verificados: boolean;
  creado_en: string;
  usuario: {
    id: string;
    nombre: string;
    email: string;
    rol: string;
  };
  documentos: {
    id: string;
    tipo: string;
    verificado: boolean;
  }[];
}

type EstadoFiltro = 'todos' | 'pendientes' | 'aprobados' | 'rechazados';

export default function PaginaProfesionales() {
  const router = useRouter();
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [profesionalesFiltrados, setProfesionalesFiltrados] = useState<Profesional[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<EstadoFiltro>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [adminId, setAdminId] = useState<string>('');

  useEffect(() => {
    verificarAdminYCargar();
  }, []);

  useEffect(() => {
    filtrarProfesionales();
  }, [filtroEstado, busqueda, profesionales]);

  const verificarAdminYCargar = async () => {
    const supabase = obtenerClienteNavegador();

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/iniciar-sesion');
        return;
      }

      // Obtener datos del admin
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
      await cargarProfesionales();
    } catch (error) {
      console.error('Error al verificar admin:', error);
      router.push('/iniciar-sesion');
    }
  };

  const cargarProfesionales = async () => {
    const supabase = obtenerClienteNavegador();
    setCargando(true);

    try {
      // Obtener profesionales con sus usuarios y documentos
      const { data, error } = await supabase
        .from('PerfilProfesional')
        .select(`
          id,
          titulo_profesional,
          numero_licencia,
          universidad,
          anos_experiencia,
          perfil_aprobado,
          documentos_verificados,
          creado_en,
          usuario:Usuario!usuario_id(
            id,
            nombre,
            email,
            rol
          ),
          documentos:DocumentoProfesional(
            id,
            tipo,
            verificado
          )
        `)
        .order('creado_en', { ascending: false });

      if (error) {
        console.error('Error al cargar profesionales:', error);
        toast.error('Error al cargar profesionales');
        return;
      }

      setProfesionales(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar datos');
    } finally {
      setCargando(false);
    }
  };

  const filtrarProfesionales = () => {
    let filtrados = [...profesionales];

    // Filtrar por estado
    if (filtroEstado === 'pendientes') {
      filtrados = filtrados.filter(p => !p.perfil_aprobado);
    } else if (filtroEstado === 'aprobados') {
      filtrados = filtrados.filter(p => p.perfil_aprobado);
    }

    // Filtrar por búsqueda
    if (busqueda.trim()) {
      const busquedaLower = busqueda.toLowerCase();
      filtrados = filtrados.filter(p =>
        p.usuario?.nombre?.toLowerCase().includes(busquedaLower) ||
        p.usuario?.email?.toLowerCase().includes(busquedaLower) ||
        p.titulo_profesional.toLowerCase().includes(busquedaLower) ||
        p.numero_licencia.toLowerCase().includes(busquedaLower)
      );
    }

    setProfesionalesFiltrados(filtrados);
  };

  const aprobarRapido = async (profesionalId: string, usuarioId: string) => {
    const supabase = obtenerClienteNavegador();

    try {
      // 1. Actualizar PerfilProfesional
      const { error: errorPerfil } = await supabase
        .from('PerfilProfesional')
        .update({
          perfil_aprobado: true,
          aprobado_por: adminId,
          aprobado_en: new Date().toISOString(),
          documentos_verificados: true
        })
        .eq('id', profesionalId);

      if (errorPerfil) {
        console.error('Error al aprobar perfil:', errorPerfil);
        toast.error('Error al aprobar el perfil');
        return;
      }

      // 2. Cambiar rol del usuario a TERAPEUTA
      const { error: errorUsuario } = await supabase
        .from('Usuario')
        .update({ rol: 'TERAPEUTA' })
        .eq('id', usuarioId);

      if (errorUsuario) {
        console.error('Error al actualizar rol:', errorUsuario);
        toast.error('Error al actualizar el rol del usuario');
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

      toast.success('Profesional aprobado correctamente');
      await cargarProfesionales();
    } catch (error) {
      console.error('Error al aprobar:', error);
      toast.error('Error al procesar la aprobación');
    }
  };

  const rechazar = async (profesionalId: string) => {
    const supabase = obtenerClienteNavegador();

    try {
      const { error } = await supabase
        .from('PerfilProfesional')
        .update({
          perfil_aprobado: false,
          documentos_verificados: false,
          aprobado_por: adminId,
          aprobado_en: new Date().toISOString(),
          notas_admin: 'Rechazado por el administrador'
        })
        .eq('id', profesionalId);

      if (error) {
        toast.error('Error al rechazar');
        return;
      }

      toast.success('Profesional rechazado');
      await cargarProfesionales();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al rechazar');
    }
  };

  const contarDocumentosVerificados = (documentos: any[]) => {
    if (!documentos) return 0;
    return documentos.filter(d => d.verificado).length;
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profesionales</h1>
        <p className="text-gray-600 mt-2">
          Gestiona las solicitudes de registro de profesionales
        </p>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Filtros de estado */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filtroEstado === 'todos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroEstado('todos')}
            >
              Todos ({profesionales.length})
            </Button>
            <Button
              variant={filtroEstado === 'pendientes' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroEstado('pendientes')}
            >
              <Clock className="h-4 w-4 mr-1" />
              Pendientes ({profesionales.filter(p => !p.perfil_aprobado).length})
            </Button>
            <Button
              variant={filtroEstado === 'aprobados' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroEstado('aprobados')}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Aprobados ({profesionales.filter(p => p.perfil_aprobado).length})
            </Button>
          </div>

          {/* Búsqueda */}
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o licencia..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tabla de profesionales */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profesional
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Título
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Licencia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documentos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {profesionalesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No se encontraron profesionales
                  </td>
                </tr>
              ) : (
                profesionalesFiltrados.map((profesional) => (
                  <tr key={profesional.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">
                          {profesional.usuario?.nombre || 'Sin nombre'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {profesional.usuario?.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {profesional.titulo_profesional}
                      </div>
                      <div className="text-sm text-gray-500">
                        {profesional.anos_experiencia} años de experiencia
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {profesional.numero_licencia}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FileCheck className={`h-4 w-4 ${
                          profesional.documentos_verificados
                            ? 'text-green-500'
                            : 'text-yellow-500'
                        }`} />
                        <span className="text-sm text-gray-600">
                          {contarDocumentosVerificados(profesional.documentos)}/
                          {profesional.documentos?.length || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {profesional.perfil_aprobado ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Aprobado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link href={`/admin/profesionales/${profesional.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </Link>
                      {!profesional.perfil_aprobado && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => aprobarRapido(profesional.id, profesional.usuario.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprobar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => rechazar(profesional.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rechazar
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Profesionales</p>
              <p className="text-3xl font-bold text-gray-900">
                {profesionales.length}
              </p>
            </div>
            <Clock className="h-12 w-12 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-3xl font-bold text-yellow-600">
                {profesionales.filter(p => !p.perfil_aprobado).length}
              </p>
            </div>
            <AlertCircle className="h-12 w-12 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aprobados</p>
              <p className="text-3xl font-bold text-green-600">
                {profesionales.filter(p => p.perfil_aprobado).length}
              </p>
            </div>
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
