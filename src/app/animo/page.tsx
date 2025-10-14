'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FaHeart, FaChartLine, FaCalendarAlt, FaStickyNote,
  FaBolt, FaFrown, FaMeh, FaSmile, FaGrin, FaArrowLeft,
  FaArrowUp, FaArrowDown
} from 'react-icons/fa';
import { toast, Toaster } from 'react-hot-toast';
import Navegacion from '../../lib/componentes/layout/Navegacion';

interface RegistroAnimo {
  id: string;
  animo: number;
  energia: number;
  estres: number;
  notas?: string;
  creadoEn: string;
}

export default function PaginaAnimo() {
  const router = useRouter();
  const [registros, setRegistros] = useState<RegistroAnimo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formulario, setFormulario] = useState({
    animo: 5,
    energia: 5,
    estres: 5,
    notas: ''
  });
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    verificarAutenticacion();
    cargarRegistros();
  }, []);

  const verificarAutenticacion = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/iniciar-sesion');
      return;
    }
  };

  const cargarRegistros = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3333/api/usuarios/animo', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRegistros(data);
      }
    } catch (error) {
      console.error('Error al cargar registros:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3333/api/usuarios/animo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formulario),
      });

      if (response.ok) {
        toast.success('¡Registro guardado exitosamente!');
        setMostrarFormulario(false);
        setFormulario({ animo: 5, energia: 5, estres: 5, notas: '' });
        cargarRegistros();
      } else {
        throw new Error('Error al guardar registro');
      }
    } catch (error) {
      toast.error('Error al guardar el registro');
    } finally {
      setEnviando(false);
    }
  };

  const obtenerIconoAnimo = (valor: number) => {
    if (valor <= 2) return <FaFrown className="text-red-500" />;
    if (valor <= 4) return <FaMeh className="text-yellow-500" />;
    if (valor <= 7) return <FaSmile className="text-green-500" />;
    return <FaGrin className="text-green-600" />;
  };

  const obtenerColorEscala = (valor: number, tipo: 'animo' | 'energia' | 'estres') => {
    if (tipo === 'estres') {
      if (valor <= 3) return 'bg-green-500';
      if (valor <= 6) return 'bg-yellow-500';
      return 'bg-red-500';
    }
    if (valor <= 3) return 'bg-red-500';
    if (valor <= 6) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const calcularPromedio = (campo: keyof RegistroAnimo) => {
    if (registros.length === 0) return 0;
    const suma = registros.reduce((acc, reg) => acc + (reg[campo] as number), 0);
    return (suma / registros.length).toFixed(1);
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
        <Navegacion />
        <div className="pt-32 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando registros...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      <Toaster position="top-center" />
      <Navegacion />
      
      <div className="pt-28 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <FaArrowLeft className="text-teal-600" />
                </motion.button>
              </Link>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Registro de Ánimo</h1>
                <p className="text-gray-600 text-lg">Monitorea tu bienestar emocional diario</p>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMostrarFormulario(true)}
              className="px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <FaHeart className="inline mr-2" />
              Nuevo Registro
            </motion.button>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-8 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Ánimo Promedio</h3>
                <div className="text-3xl">{obtenerIconoAnimo(Number(calcularPromedio('animo')))}</div>
              </div>
              <div className="text-4xl font-bold text-teal-600 mb-2">
                {calcularPromedio('animo')}/10
              </div>
              <p className="text-gray-600">Últimos 30 días</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-8 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Energía Promedio</h3>
                <FaBolt className="text-3xl text-yellow-500" />
              </div>
              <div className="text-4xl font-bold text-yellow-600 mb-2">
                {calcularPromedio('energia')}/10
              </div>
              <p className="text-gray-600">Últimos 30 días</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-8 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Estrés Promedio</h3>
                <FaChartLine className="text-3xl text-red-500" />
              </div>
              <div className="text-4xl font-bold text-red-600 mb-2">
                {calcularPromedio('estres')}/10
              </div>
              <p className="text-gray-600">Últimos 30 días</p>
            </motion.div>
          </div>

          {/* Lista de registros */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Historial de Registros</h2>
            
            {registros.length === 0 ? (
              <div className="text-center py-12">
                <FaHeart className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Aún no tienes registros
                </h3>
                <p className="text-gray-500 mb-6">
                  Comienza a registrar tu estado de ánimo para ver tu progreso
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setMostrarFormulario(true)}
                  className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-xl"
                >
                  Crear Primer Registro
                </motion.button>
              </div>
            ) : (
              <div className="space-y-4">
                {registros.map((registro, index) => (
                  <motion.div
                    key={registro.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <FaCalendarAlt className="text-teal-600" />
                        <span className="font-semibold text-gray-900">
                          {new Date(registro.creadoEn).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(registro.creadoEn).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          {obtenerIconoAnimo(registro.animo)}
                          <span className="font-medium text-gray-700">Ánimo</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${obtenerColorEscala(registro.animo, 'animo')}`}
                              style={{ width: `${(registro.animo / 10) * 100}%` }}
                            />
                          </div>
                          <span className="font-bold text-gray-900">{registro.animo}/10</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <FaBolt className="text-yellow-500" />
                          <span className="font-medium text-gray-700">Energía</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${obtenerColorEscala(registro.energia, 'energia')}`}
                              style={{ width: `${(registro.energia / 10) * 100}%` }}
                            />
                          </div>
                          <span className="font-bold text-gray-900">{registro.energia}/10</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <FaChartLine className="text-red-500" />
                          <span className="font-medium text-gray-700">Estrés</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${obtenerColorEscala(registro.estres, 'estres')}`}
                              style={{ width: `${(registro.estres / 10) * 100}%` }}
                            />
                          </div>
                          <span className="font-bold text-gray-900">{registro.estres}/10</span>
                        </div>
                      </div>
                    </div>
                    
                    {registro.notas && (
                      <div className="bg-teal-50 rounded-lg p-4 border border-teal-100">
                        <div className="flex items-center gap-2 mb-2">
                          <FaStickyNote className="text-teal-600" />
                          <span className="font-medium text-teal-800">Notas</span>
                        </div>
                        <p className="text-teal-700">{registro.notas}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Formulario */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Nuevo Registro de Ánimo</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ¿Cómo te sientes hoy? (1-10)
                </label>
                <div className="flex items-center gap-2 mb-2">
                  {obtenerIconoAnimo(formulario.animo)}
                  <span className="font-bold text-gray-900">{formulario.animo}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formulario.animo}
                  onChange={(e) => setFormulario(prev => ({ ...prev, animo: Number(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nivel de energía (1-10)
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <FaBolt className="text-yellow-500" />
                  <span className="font-bold text-gray-900">{formulario.energia}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formulario.energia}
                  onChange={(e) => setFormulario(prev => ({ ...prev, energia: Number(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nivel de estrés (1-10)
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <FaChartLine className="text-red-500" />
                  <span className="font-bold text-gray-900">{formulario.estres}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formulario.estres}
                  onChange={(e) => setFormulario(prev => ({ ...prev, estres: Number(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={formulario.notas}
                  onChange={(e) => setFormulario(prev => ({ ...prev, notas: e.target.value }))}
                  placeholder="¿Qué ha influido en tu estado de ánimo hoy?"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-4">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setMostrarFormulario(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50"
                >
                  Cancelar
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={enviando}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-xl hover:shadow-lg disabled:opacity-50"
                >
                  {enviando ? 'Guardando...' : 'Guardar Registro'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}