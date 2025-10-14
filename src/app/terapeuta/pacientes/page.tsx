'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FaArrowLeft, FaUsers, FaSearch, FaFilter, FaEye, FaChartLine,
  FaCalendarAlt, FaExclamationTriangle, FaCheckCircle, FaClock,
  FaComments, FaBrain, FaHeart
} from 'react-icons/fa';
import { toast, Toaster } from 'react-hot-toast';
import Navegacion from '../../../lib/componentes/layout/Navegacion';

interface Paciente {
  id: string;
  nombre: string;
  email: string;
  edad?: number;
  telefono?: string;
  estado: 'activo' | 'inactivo' | 'alta';
  riesgo: 'bajo' | 'medio' | 'alto';
  ultimaConexion: string;
  ultimaEvaluacion?: string;
  sesionesCompletadas: number;
  progreso: number;
  alertas: number;
  notas?: string;
}

export default function PaginaTerapeutaPacientes() {
  const router = useRouter();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroRiesgo, setFiltroRiesgo] = useState('todos');

  useEffect(() => {
    verificarAutenticacion();
    cargarPacientes();
  }, []);

  const verificarAutenticacion = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/iniciar-sesion');
      return;
    }
  };

  const cargarPacientes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3333/api/terapeuta/pacientes', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPacientes(data);
      } else {
        // Usar datos mock como fallback
        setPacientes(pacientesMock);
      }
    } catch (error) {
      console.error('Error:', error);
      setPacientes(pacientesMock);
    } finally {
      setCargando(false);
    }
  };

  const obtenerColorRiesgo = (riesgo: string) => {
    switch (riesgo) {
      case 'alto': return 'bg-red-100 text-red-800 border-red-200';
      case 'medio': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'bajo': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const obtenerColorEstado = (estado: string) => {
    switch (estado) {
      case 'activo': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactivo': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'alta': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const pacientesFiltrados = pacientes.filter(paciente => {
    const cumpleBusqueda = paciente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                          paciente.email.toLowerCase().includes(busqueda.toLowerCase());
    const cumpleEstado = filtroEstado === 'todos' || paciente.estado === filtroEstado;
    const cumpleRiesgo = filtroRiesgo === 'todos' || paciente.riesgo === filtroRiesgo;
    
    return cumpleBusqueda && cumpleEstado && cumpleRiesgo;
  });

  const estadisticas = {
    total: pacientes.length,
    activos: pacientes.filter(p => p.estado === 'activo').length,
    riesgoAlto: pacientes.filter(p => p.riesgo === 'alto').length,
    alertas: pacientes.reduce((acc, p) => acc + p.alertas, 0)
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Navegacion />
        <div className="pt-32 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando pacientes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Toaster position="top-center" />
      <Navegacion />
      
      <div className="pt-28 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <FaArrowLeft className="text-blue-600" />
                </motion.button>
              </Link>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Mis Pacientes</h1>
                <p className="text-gray-600 text-lg">Gestiona y supervisa el progreso de tus pacientes</p>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Pacientes</p>
                  <p className="text-3xl font-bold text-blue-600">{estadisticas.total}</p>
                </div>
                <FaUsers className="text-3xl text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Activos</p>
                  <p className="text-3xl font-bold text-green-600">{estadisticas.activos}</p>
                </div>
                <FaCheckCircle className="text-3xl text-green-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Alto Riesgo</p>
                  <p className="text-3xl font-bold text-red-600">{estadisticas.riesgoAlto}</p>
                </div>
                <FaExclamationTriangle className="text-3xl text-red-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Alertas</p>
                  <p className="text-3xl font-bold text-yellow-600">{estadisticas.alertas}</p>
                </div>
                <FaClock className="text-3xl text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Filtros y Búsqueda */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar paciente por nombre o email..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todos">Todos los estados</option>
                <option value="activo">Activos</option>
                <option value="inactivo">Inactivos</option>
                <option value="alta">Dados de alta</option>
              </select>
              
              <select
                value={filtroRiesgo}
                onChange={(e) => setFiltroRiesgo(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todos">Todos los riesgos</option>
                <option value="alto">Alto riesgo</option>
                <option value="medio">Riesgo medio</option>
                <option value="bajo">Bajo riesgo</option>
              </select>
            </div>
          </div>

          {/* Lista de Pacientes */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {pacientesFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <FaUsers className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No se encontraron pacientes
                </h3>
                <p className="text-gray-500">
                  Ajusta los filtros o verifica los criterios de búsqueda
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">
                        Paciente
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">
                        Riesgo
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">
                        Progreso
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">
                        Última Actividad
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pacientesFiltrados.map((paciente, index) => (
                      <motion.tr
                        key={paciente.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {paciente.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <p className="font-medium text-gray-900">{paciente.nombre}</p>
                              <p className="text-sm text-gray-600">{paciente.email}</p>
                              {paciente.edad && (
                                <p className="text-xs text-gray-500">{paciente.edad} años</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${obtenerColorEstado(paciente.estado)}`}>
                            {paciente.estado.charAt(0).toUpperCase() + paciente.estado.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${obtenerColorRiesgo(paciente.riesgo)}`}>
                            {paciente.riesgo.charAt(0).toUpperCase() + paciente.riesgo.slice(1)}
                          </span>
                          {paciente.alertas > 0 && (
                            <div className="flex items-center mt-1">
                              <FaExclamationTriangle className="text-red-500 text-xs mr-1" />
                              <span className="text-xs text-red-600">{paciente.alertas} alertas</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ width: `${paciente.progreso}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-700">{paciente.progreso}%</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {paciente.sesionesCompletadas} sesiones
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">
                            {new Date(paciente.ultimaConexion).toLocaleDateString('es-ES')}
                          </p>
                          {paciente.ultimaEvaluacion && (
                            <p className="text-xs text-gray-500">
                              Eval: {new Date(paciente.ultimaEvaluacion).toLocaleDateString('es-ES')}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Ver detalles"
                            >
                              <FaEye />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Ver reportes"
                            >
                              <FaChartLine />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                              title="Ver conversaciones"
                            >
                              <FaComments />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Datos mock para desarrollo
const pacientesMock: Paciente[] = [
  {
    id: '1',
    nombre: 'María González',
    email: 'maria.gonzalez@email.com',
    edad: 28,
    telefono: '+57 300 123 4567',
    estado: 'activo',
    riesgo: 'medio',
    ultimaConexion: '2024-01-15T10:30:00Z',
    ultimaEvaluacion: '2024-01-12T09:00:00Z',
    sesionesCompletadas: 8,
    progreso: 65,
    alertas: 1,
    notas: 'Paciente con ansiedad generalizada. Progreso estable.'
  },
  {
    id: '2',
    nombre: 'Carlos Rodríguez',
    email: 'carlos.rodriguez@email.com',
    edad: 35,
    estado: 'activo',
    riesgo: 'alto',
    ultimaConexion: '2024-01-14T16:45:00Z',
    ultimaEvaluacion: '2024-01-10T11:30:00Z',
    sesionesCompletadas: 12,
    progreso: 45,
    alertas: 3,
    notas: 'Episodios depresivos recurrentes. Requiere seguimiento cercano.'
  },
  {
    id: '3',
    nombre: 'Ana Martínez',
    email: 'ana.martinez@email.com',
    edad: 42,
    estado: 'inactivo',
    riesgo: 'bajo',
    ultimaConexion: '2024-01-08T14:20:00Z',
    ultimaEvaluacion: '2024-01-05T10:15:00Z',
    sesionesCompletadas: 15,
    progreso: 85,
    alertas: 0,
    notas: 'Excelente progreso. Considerando alta médica.'
  },
  {
    id: '4',
    nombre: 'Luis Herrera',
    email: 'luis.herrera@email.com',
    edad: 26,
    estado: 'activo',
    riesgo: 'medio',
    ultimaConexion: '2024-01-15T08:15:00Z',
    sesionesCompletadas: 5,
    progreso: 35,
    alertas: 0,
    notas: 'Paciente nuevo con síntomas de estrés laboral.'
  },
  {
    id: '5',
    nombre: 'Patricia Vega',
    email: 'patricia.vega@email.com',
    edad: 51,
    estado: 'alta',
    riesgo: 'bajo',
    ultimaConexion: '2024-01-01T12:00:00Z',
    ultimaEvaluacion: '2023-12-28T09:30:00Z',
    sesionesCompletadas: 20,
    progreso: 100,
    alertas: 0,
    notas: 'Alta médica completada. Seguimiento opcional.'
  }
];