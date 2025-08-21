'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPaperPlane, FaMicrophone, FaMicrophoneSlash, FaHeart, 
  FaUser, FaInfoCircle, FaRandom, FaLightbulb
} from 'react-icons/fa';
import { toast, Toaster } from 'react-hot-toast';
import Navegacion from '../../lib/componentes/layout/Navegacion';
import { ConnectionStatus } from '../../lib/componentes/ui/connection-status';

interface Mensaje {
  id: string;
  contenido: string;
  rol: 'usuario' | 'asistente';
  creadoEn: string;
}

interface SesionChat {
  sesionId: string;
  mensajes: Mensaje[];
  mensajesRestantes: number;
  limite: number;
}

export default function PaginaChat() {
  const router = useRouter();
  const [sesion, setSesion] = useState<SesionChat | null>(null);
  const [inputMensaje, setInputMensaje] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);
  const [mostrarLimite, setMostrarLimite] = useState(false);
  const [grabandoVoz, setGrabandoVoz] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorConexion, setErrorConexion] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [estaAutenticado, setEstaAutenticado] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setEstaAutenticado(!!token);
    
    // Inicializar chat si no hay sesión
    if (!sesion) {
      inicializarChat();
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sesion?.mensajes]);

  const emociones = ['😊', '😔', '😰', '😡', '😴', '🤔', '😌', '💪'];

  const inicializarChat = async (mensajeInicial?: string) => {
    setCargando(true);
    setErrorConexion(false);
    try {
      const response = await fetch('http://localhost:3333/api/chat/publico/iniciar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mensaje: mensajeInicial || '¡Hola! Me gustaría hablar con Escuchodromo',
          sesionId: sesion?.sesionId
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setErrorConexion(true);
          throw new Error('No autorizado - inicia sesión para continuar');
        }
        const error = await response.json();
        throw new Error(error.message || 'Error al inicializar el chat');
      }

      const data = await response.json();
      
      // Validar que la respuesta tenga la estructura esperada
      if (data && typeof data === 'object' && data.sesionId) {
        setSesion({
          ...data,
          mensajes: data.mensajes || [],
          mensajesRestantes: data.mensajesRestantes ?? 20,
          limite: data.limite ?? 20
        });
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorConexion(true);
      toast.error(error instanceof Error ? error.message : 'Error al conectar con el servidor');
    } finally {
      setCargando(false);
    }
  };

  const handleEnviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMensaje.trim() || !sesion) return;

    if (!sesion || (sesion.mensajesRestantes ?? 0) <= 0) {
      setMostrarLimite(true);
      return;
    }

    setEscribiendo(true);
    
    try {
      const response = await fetch('http://localhost:3333/api/chat/publico/mensaje', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mensaje: inputMensaje,
          sesionId: sesion.sesionId
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Sesión expirada - recarga la página');
          throw new Error('No autorizado - sesión expirada');
        }
        const error = await response.json();
        throw new Error(error.message || 'Error al enviar mensaje');
      }

      const data = await response.json();
      
      // Actualizar sesión con los nuevos mensajes
      setSesion(prev => {
        if (!prev) return null;
        return {
          ...prev,
          mensajes: [...(prev.mensajes || []), ...(data.mensajes || [])],
          mensajesRestantes: data.mensajesRestantes
        };
      });
      
      setInputMensaje('');
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al enviar mensaje');
    } finally {
      setEscribiendo(false);
    }
  };

  const toggleGrabacionVoz = () => {
    if (!sesion || (sesion.mensajesRestantes ?? 0) <= 0) {
      setMostrarLimite(true);
      return;
    }

    setGrabandoVoz(!grabandoVoz);
    if (!grabandoVoz) {
      toast.success('Grabación iniciada. Habla claramente.');
      // Aquí iría la lógica de grabación real
      setTimeout(() => {
        setGrabandoVoz(false);
        setInputMensaje('Mensaje de voz transcrito...');
        toast.success('Voz transcrita correctamente');
      }, 3000);
    }
  };

  const sugerenciasPredefinidas = [
    'Me siento abrumado y necesito ayuda para organizar mis pensamientos',
    'Tengo ansiedad y me gustaría aprender técnicas para calmarme',
    'Me siento triste y necesito alguien con quien hablar',
    'Estoy estresado por el trabajo y necesito apoyo'
  ];

  if (cargando && !sesion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
        <Navegacion />
        <div className="pt-32 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Conectando con Escuchodromo...</p>
          </div>
        </div>
      </div>
    );
  }

  if (errorConexion && !sesion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
        <Navegacion />
        <div className="pt-32 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              No se pudo conectar
            </h3>
            <p className="text-gray-600 mb-6">
              Hubo un problema al conectar con Escuchodromo. Por favor, verifica tu conexión a internet e inténtalo de nuevo.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => inicializarChat()}
              className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Intentar de Nuevo
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      <Toaster position="top-center" />
      <ConnectionStatus />
      <Navegacion />
      
      <div className="pt-20 pb-8 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header del Chat */}
          <div className="bg-white rounded-t-3xl shadow-xl p-8 border-b border-teal-100">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                  <FaHeart className="text-4xl text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-1">Hablar con Escuchodromo</h1>
                  <p className="text-gray-600 text-lg">Tu compañero de bienestar emocional 24/7</p>
                </div>
              </div>
              
              {sesion && (
                <div className="flex items-center gap-3 bg-teal-50 px-6 py-3 rounded-full border border-teal-200">
                  <FaInfoCircle className="text-teal-600" />
                  <span className="text-teal-700 font-bold">
                    {sesion?.mensajesRestantes ?? 0} mensajes gratis restantes
                  </span>
                </div>
              )}
            </div>

            {/* Herramientas interactivas */}
            <div className="mt-8 space-y-6">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-lg font-bold text-gray-800">¿Cómo te sientes hoy?</span>
                {emociones.map((emocion) => (
                  <motion.button
                    key={emocion}
                    whileHover={{ scale: 1.3 }}
                    whileTap={{ scale: 0.9 }}
                    className="text-4xl hover:bg-teal-50 p-4 rounded-full transition-all duration-200 hover:shadow-lg border-2 border-transparent hover:border-teal-200"
                    onClick={() => setInputMensaje(prev => prev + ' ' + emocion)}
                  >
                    {emocion}
                  </motion.button>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-3">
                {sugerenciasPredefinidas.map((sugerencia, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setInputMensaje(sugerencia)}
                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-800 rounded-2xl text-sm font-medium hover:from-red-200 hover:to-pink-200 transition-all duration-200 shadow-md hover:shadow-lg border border-teal-200"
                  >
                    <FaLightbulb />
                    {sugerencia.length > 40 ? sugerencia.substring(0, 40) + '...' : sugerencia}
                  </motion.button>
                ))}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const sugerencias = [
                      "¿Puedes ayudarme a entender mejor mis emociones?",
                      "Me gustaría hablar sobre mis preocupaciones",
                      "¿Cómo puedo manejar mejor el estrés diario?",
                      "Necesito técnicas de relajación"
                    ];
                    setInputMensaje(sugerencias[Math.floor(Math.random() * sugerencias.length)]);
                  }}
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 rounded-2xl text-sm font-medium hover:from-purple-200 hover:to-indigo-200 transition-all duration-200 shadow-md hover:shadow-lg border border-purple-200"
                >
                  <FaRandom />
                  Sugerencia aleatoria
                </motion.button>
              </div>
            </div>
          </div>

          {/* Área de mensajes */}
          <div className="bg-gradient-to-b from-teal-50 to-cyan-50 min-h-[600px] max-h-[600px] overflow-y-auto p-8 shadow-inner">
            {!sesion || !sesion.mensajes || sesion.mensajes.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <FaHeart className="text-6xl text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">¡Hola! 💕</h3>
                  <p className="text-lg text-gray-600 max-w-md">
                    Soy Escuchodromo, tu compañero de bienestar emocional. 
                    Este es un espacio seguro donde puedes compartir lo que sientes sin juicios.
                  </p>
                </div>
              </div>
            ) : (
              <AnimatePresence>
                {sesion?.mensajes?.map((mensaje) => (
                  <motion.div
                    key={mensaje.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`mb-6 flex ${mensaje.rol === 'usuario' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start gap-4 max-w-[80%] ${
                      mensaje.rol === 'usuario' ? 'flex-row-reverse' : 'flex-row'
                    }`}>
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
                        mensaje.rol === 'usuario' 
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                          : 'bg-gradient-to-br from-teal-500 to-cyan-500'
                      }`}>
                        {mensaje.rol === 'usuario' ? (
                          <FaUser className="text-white text-xl" />
                        ) : (
                          <FaHeart className="text-white text-xl" />
                        )}
                      </div>
                      
                      <div className={`rounded-3xl px-6 py-4 shadow-xl border-2 ${
                        mensaje.rol === 'usuario' 
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-300' 
                          : 'bg-white text-gray-800 border-teal-100'
                      }`}>
                        <p className="text-base leading-relaxed font-medium">{mensaje.contenido}</p>
                        <p className={`text-xs mt-2 ${
                          mensaje.rol === 'usuario' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(mensaje.creadoEn).toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            
            {escribiendo && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 text-gray-600 mb-4"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <FaHeart className="text-white text-xl" />
                </div>
                <div className="bg-white rounded-3xl px-6 py-4 shadow-lg border border-teal-100">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-teal-400 rounded-full animate-bounce" />
                    <div className="w-3 h-3 bg-teal-400 rounded-full animate-bounce delay-100" />
                    <div className="w-3 h-3 bg-teal-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Área de entrada */}
          <div className="bg-white rounded-b-3xl shadow-xl p-6 border-t border-teal-100">
            <form onSubmit={handleEnviarMensaje} className="flex gap-4">
              <input
                type="text"
                value={inputMensaje}
                onChange={(e) => setInputMensaje(e.target.value)}
                placeholder="Comparte lo que sientes... Estoy aquí para escucharte 💝"
                className="flex-1 px-8 py-5 border-2 border-teal-200 rounded-3xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 text-gray-700 placeholder-gray-500 text-lg shadow-inner bg-teal-50"
                disabled={!sesion || (sesion.mensajesRestantes ?? 0) <= 0}
              />
              
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleGrabacionVoz}
                className={`p-5 rounded-3xl transition-all duration-300 shadow-lg ${
                  grabandoVoz 
                    ? 'bg-teal-500 text-white shadow-red-200' 
                    : 'bg-gradient-to-r from-teal-400 to-teal-500 text-white hover:shadow-teal-200'
                }`}
              >
                {grabandoVoz ? <FaMicrophoneSlash size={24} /> : <FaMicrophone size={24} />}
              </motion.button>
              
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={!inputMensaje.trim() || !sesion || (sesion.mensajesRestantes ?? 0) <= 0}
                className="px-10 py-5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-3xl hover:shadow-2xl shadow-red-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                <FaPaperPlane size={22} />
              </motion.button>
            </form>
          </div>
        </div>

        {/* Banner informativo */}
        {!estaAutenticado && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto mt-8 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-3xl p-8 text-white shadow-2xl"
          >
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div className="flex items-center gap-4">
                <FaHeart className="text-5xl animate-pulse" />
                <div>
                  <h3 className="font-bold text-2xl mb-2">Obtén acceso ilimitado</h3>
                  <p className="text-white/90 text-lg">Regístrate gratis y disfruta de chat ilimitado, seguimiento de progreso y herramientas avanzadas de bienestar</p>
                </div>
              </div>
              <Link href="/registrar">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white text-teal-600 font-bold rounded-2xl hover:shadow-xl transition-all duration-200 text-lg"
                >
                  Registrarse Gratis
                </motion.button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>

      {/* Modal de límite alcanzado */}
      <AnimatePresence>
        {mostrarLimite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setMostrarLimite(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-10 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FaHeart className="text-4xl text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  ¡Queremos seguir acompañándote! 💕
                </h3>
                <p className="text-gray-600 mb-8 text-lg">
                  Has usado tus 20 mensajes gratuitos. Regístrate para continuar nuestra conversación sin límites y acceder a todas las herramientas de bienestar.
                </p>
                <div className="flex flex-col gap-4">
                  <Link href="/registrar">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-2xl hover:shadow-xl transition-all duration-200 text-lg"
                    >
                      Registrarse Gratis
                    </motion.button>
                  </Link>
                  <Link href="/iniciar-sesion">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full px-8 py-4 border-2 border-gray-300 text-gray-700 font-medium rounded-2xl hover:bg-gray-50 transition-all duration-200"
                    >
                      Ya tengo cuenta
                    </motion.button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}