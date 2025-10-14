'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FaArrowLeft, FaChartLine, FaCalendarAlt, FaDownload, FaFilter,
  FaUser, FaClipboardList, FaBrain, FaArrowUp, FaArrowDown,
  FaExclamationTriangle, FaCheckCircle, FaFileAlt, FaPrint
} from 'react-icons/fa';
import { toast, Toaster } from 'react-hot-toast';
import Navegacion from '../../../lib/componentes/layout/Navegacion';

interface ReporteClinico {
  id: string;
  pacienteId: string;
  pacienteNombre: string;
  tipoEvaluacion: string;
  fecha: string;
  puntuacion: number;
  severidad: string;
  interpretacion: string;
  recomendaciones: string[];
  progreso?: {
    anterior: number;
    actual: number;
    tendencia: 'mejoria' | 'estable' | 'empeoramiento';
  };
}

interface Estadistica {
  label: string;
  valor: number;
  cambio: number;
  tendencia: 'up' | 'down' | 'stable';
}

export default function PaginaTerapeutaReportes() {
  const router = useRouter();
  const [reportes, setReportes] = useState<ReporteClinico[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroPaciente, setFiltroPaciente] = useState('todos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [estadisticas, setEstadisticas] = useState<Estadistica[]>([]);

  useEffect(() => {
    verificarAutenticacion();
    cargarReportes();
    cargarEstadisticas();
  }, []);

  const verificarAutenticacion = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/iniciar-sesion');
      return;
    }
  };

  const cargarReportes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3333/api/terapeuta/reportes', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReportes(data);
      } else {
        // Usar datos mock como fallback
        setReportes(reportesMock);
      }
    } catch (error) {
      console.error('Error:', error);
      setReportes(reportesMock);
    } finally {
      setCargando(false);
    }
  };

  const cargarEstadisticas = () => {
    // En producción, esto vendría del backend
    setEstadisticas([
      { label: 'Evaluaciones este mes', valor: 45, cambio: 12, tendencia: 'up' },
      { label: 'Pacientes activos', valor: 23, cambio: -2, tendencia: 'down' },
      { label: 'Promedio mejora', valor: 68, cambio: 5, tendencia: 'up' },
      { label: 'Casos críticos', valor: 3, cambio: -1, tendencia: 'down' }
    ]);
  };

  const exportarReportes = () => {
    toast.success('Exportando reportes a PDF...');
    // Aquí iría la lógica de exportación
  };

  const obtenerColorSeveridad = (severidad: string) => {
    switch (severidad.toLowerCase()) {
      case 'severa': return 'bg-red-100 text-red-800 border-red-200';
      case 'moderada': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'leve': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'minima': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const obtenerIconoTendencia = (tendencia: string) => {
    switch (tendencia) {
      case 'mejoria': return <FaArrowUp className="text-green-500" />;
      case 'empeoramiento': return <FaArrowDown className="text-red-500" />;
      default: return <FaCheckCircle className="text-blue-500" />;
    }
  };

  const reportesFiltrados = reportes.filter(reporte => {
    const cumpleTipo = filtroTipo === 'todos' || reporte.tipoEvaluacion === filtroTipo;
    const cumplePaciente = filtroPaciente === 'todos' || reporte.pacienteId === filtroPaciente;
    
    let cumpleFecha = true;
    if (fechaInicio && fechaFin) {
      const fechaReporte = new Date(reporte.fecha);
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      cumpleFecha = fechaReporte >= inicio && fechaReporte <= fin;
    }
    
    return cumpleTipo && cumplePaciente && cumpleFecha;
  });

  const pacientesUnicos = [...new Set(reportes.map(r => ({ id: r.pacienteId, nombre: r.pacienteNombre })))];

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <Navegacion />
        <div className="pt-32 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando reportes clínicos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
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
                  <FaArrowLeft className="text-purple-600" />
                </motion.button>
              </Link>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Reportes Clínicos</h1>
                <p className="text-gray-600 text-lg">Análisis y seguimiento del progreso de pacientes</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportarReportes}
                className="px-6 py-3 bg-green-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <FaDownload className="inline mr-2" />
                Exportar PDF
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.print()}
                className="px-6 py-3 bg-gray-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <FaPrint className="inline mr-2" />
                Imprimir
              </motion.button>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {estadisticas.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  {stat.tendencia === 'up' ? (
                    <FaArrowUp className="text-green-500" />
                  ) : stat.tendencia === 'down' ? (
                    <FaArrowDown className="text-red-500" />
                  ) : (
                    <FaCheckCircle className="text-blue-500" />
                  )}
                </div>
                <p className="text-3xl font-bold text-gray-900">{stat.valor}</p>
                <p className={`text-sm ${stat.cambio > 0 ? 'text-green-600' : stat.cambio < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {stat.cambio > 0 ? '+' : ''}{stat.cambio} vs. mes anterior
                </p>
              </motion.div>
            ))}
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Evaluación
                </label>
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="todos">Todos los tipos</option>
                  <option value="PHQ-9">PHQ-9 (Depresión)</option>
                  <option value="GAD-7">GAD-7 (Ansiedad)</option>
                  <option value="PSS-10">PSS-10 (Estrés)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paciente
                </label>
                <select
                  value={filtroPaciente}
                  onChange={(e) => setFiltroPaciente(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="todos">Todos los pacientes</option>
                  {pacientesUnicos.map(paciente => (
                    <option key={paciente.id} value={paciente.id}>
                      {paciente.nombre}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-end">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setFiltroTipo('todos');
                    setFiltroPaciente('todos');
                    setFechaInicio('');
                    setFechaFin('');
                  }}
                  className="w-full px-4 py-2 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600"
                >
                  Limpiar
                </motion.button>
              </div>
            </div>
          </div>

          {/* Lista de Reportes */}
          <div className="space-y-6">
            {reportesFiltrados.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <FaFileAlt className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No se encontraron reportes
                </h3>
                <p className="text-gray-500">
                  Ajusta los filtros para ver reportes clínicos
                </p>
              </div>
            ) : (
              reportesFiltrados.map((reporte, index) => (
                <motion.div
                  key={reporte.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                        <FaBrain />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">
                          {reporte.tipoEvaluacion} - {reporte.pacienteNombre}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <FaCalendarAlt />
                            {new Date(reporte.fecha).toLocaleDateString('es-ES', { 
                              year: 'numeric',
                              month: 'long', 
                              day: 'numeric'
                            })}
                          </div>
                          <div className="flex items-center gap-1">
                            <FaUser />
                            ID: {reporte.pacienteId}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {reporte.progreso && (
                        <div className="flex items-center gap-2">
                          {obtenerIconoTendencia(reporte.progreso.tendencia)}
                          <span className="text-sm font-medium">
                            {reporte.progreso.anterior} → {reporte.progreso.actual}
                          </span>
                        </div>
                      )}
                      <span className={`px-3 py-1 text-sm font-medium rounded-full border ${obtenerColorSeveridad(reporte.severidad)}`}>
                        {reporte.severidad}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Resultados</h4>
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">Puntuación</span>
                          <span className="text-2xl font-bold text-purple-600">{reporte.puntuacion}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Severidad</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${obtenerColorSeveridad(reporte.severidad)}`}>
                            {reporte.severidad}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h5 className="text-sm font-semibold text-gray-700 mb-2">Interpretación Clínica</h5>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {reporte.interpretacion}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">
                        Recomendaciones Terapéuticas
                      </h4>
                      <ul className="space-y-2">
                        {reporte.recomendaciones.map((recomendacion, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{recomendacion}</span>
                          </li>
                        ))}
                      </ul>
                      
                      {reporte.progreso && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                          <h5 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                            <FaChartLine />
                            Evolución del Paciente
                          </h5>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-blue-700">Evaluación anterior: {reporte.progreso.anterior}</span>
                            <span className="text-sm text-blue-700">Evaluación actual: {reporte.progreso.actual}</span>
                          </div>
                          <div className="mt-2">
                            <div className="flex items-center gap-2">
                              {obtenerIconoTendencia(reporte.progreso.tendencia)}
                              <span className={`text-sm font-medium ${
                                reporte.progreso.tendencia === 'mejoria' ? 'text-green-600' :
                                reporte.progreso.tendencia === 'empeoramiento' ? 'text-red-600' :
                                'text-blue-600'
                              }`}>
                                {reporte.progreso.tendencia === 'mejoria' ? 'Mejoría' :
                                 reporte.progreso.tendencia === 'empeoramiento' ? 'Empeoramiento' :
                                 'Estable'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Datos mock para desarrollo
const reportesMock: ReporteClinico[] = [
  {
    id: '1',
    pacienteId: '1',
    pacienteNombre: 'María González',
    tipoEvaluacion: 'PHQ-9',
    fecha: '2024-01-15T09:00:00Z',
    puntuacion: 12,
    severidad: 'Moderada',
    interpretacion: 'La paciente presenta síntomas de depresión moderada. Se observa una mejora significativa desde la evaluación anterior, con reducción en sentimientos de tristeza y desesperanza.',
    recomendaciones: [
      'Continuar con terapia cognitivo-conductual semanal',
      'Implementar rutina de ejercicio cardiovascular 3 veces por semana',
      'Mantener registro de estado de ánimo diario',
      'Evaluar necesidad de ajuste medicamentoso en próxima cita'
    ],
    progreso: {
      anterior: 18,
      actual: 12,
      tendencia: 'mejoria'
    }
  },
  {
    id: '2',
    pacienteId: '2',
    pacienteNombre: 'Carlos Rodríguez',
    tipoEvaluacion: 'GAD-7',
    fecha: '2024-01-14T14:30:00Z',
    puntuacion: 15,
    severidad: 'Severa',
    interpretacion: 'El paciente muestra síntomas de ansiedad severa con episodios de pánico recurrentes. Se requiere intervención inmediata y seguimiento cercano.',
    recomendaciones: [
      'Iniciar protocolo de manejo de crisis de ansiedad',
      'Incrementar frecuencia de sesiones a 2 por semana',
      'Técnicas de respiración y relajación progresiva',
      'Consideración de medicación ansiolítica con psiquiatra',
      'Apoyo familiar en manejo de crisis'
    ],
    progreso: {
      anterior: 13,
      actual: 15,
      tendencia: 'empeoramiento'
    }
  },
  {
    id: '3',
    pacienteId: '3',
    pacienteNombre: 'Ana Martínez',
    tipoEvaluacion: 'PHQ-9',
    fecha: '2024-01-12T11:15:00Z',
    puntuacion: 4,
    severidad: 'Mínima',
    interpretacion: 'Excelente progreso. La paciente ha alcanzado niveles mínimos de síntomas depresivos. Se considera apta para alta terapéutica con seguimiento opcional.',
    recomendaciones: [
      'Mantener estrategias de afrontamiento aprendidas',
      'Seguimiento mensual opcional durante 3 meses',
      'Plan de prevención de recaídas',
      'Contacto inmediato en caso de empeoramiento'
    ],
    progreso: {
      anterior: 8,
      actual: 4,
      tendencia: 'mejoria'
    }
  },
  {
    id: '4',
    pacienteId: '4',
    pacienteNombre: 'Luis Herrera',
    tipoEvaluacion: 'PSS-10',
    fecha: '2024-01-13T16:00:00Z',
    puntuacion: 22,
    severidad: 'Moderada',
    interpretacion: 'Niveles moderados de estrés relacionados con ambiente laboral. El paciente muestra buena conciencia de sus síntomas y motivación para el cambio.',
    recomendaciones: [
      'Técnicas de manejo del estrés laboral',
      'Establecimiento de límites trabajo-vida personal',
      'Mindfulness y meditación diaria 10 minutos',
      'Evaluación de factores estresantes específicos'
    ]
  },
  {
    id: '5',
    pacienteId: '1',
    pacienteNombre: 'María González',
    tipoEvaluacion: 'GAD-7',
    fecha: '2024-01-10T10:30:00Z',
    puntuacion: 8,
    severidad: 'Leve',
    interpretacion: 'Síntomas de ansiedad leves, principalmente relacionados con situaciones sociales específicas. Buen control general de síntomas ansiosos.',
    recomendaciones: [
      'Exposición gradual a situaciones sociales',
      'Técnicas de reestructuración cognitiva',
      'Práctica de habilidades sociales',
      'Mantener registro de situaciones activadoras'
    ],
    progreso: {
      anterior: 11,
      actual: 8,
      tendencia: 'mejoria'
    }
  }
];