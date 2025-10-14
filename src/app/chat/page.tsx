'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPaperPlane, FaMicrophone, FaMicrophoneSlash, FaHeart,
  FaUser, FaInfoCircle, FaRandom, FaLightbulb
} from 'react-icons/fa';
import { toast, Toaster } from 'react-hot-toast';
import Navegacion from '../../lib/componentes/layout/Navegacion';
import { ConnectionStatus } from '../../lib/componentes/ui/connection-status';
import { obtenerClienteNavegador } from '../../lib/supabase/cliente';
import { useUsuario } from '../../lib/supabase/hooks';

interface Mensaje {
  id: string;
  contenido: string;
  rol: 'usuario' | 'asistente';
  creado_en: string;
}

export default function PaginaChat() {
  const { usuario } = useUsuario();
  const [sesionId, setSesionId] = useState<string>('');
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [inputMensaje, setInputMensaje] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);
  const [mostrarLimite, setMostrarLimite] = useState(false);
  const [grabandoVoz, setGrabandoVoz] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [mensajesRestantes, setMensajesRestantes] = useState(20);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = obtenerClienteNavegador();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  useEffect(() => {
    inicializarChat();
  }, []);

  const emociones = ['😊', '😔', '😰', '😡', '😴', '🤔', '😌', '💪'];

  const inicializarChat = async () => {
    setCargando(true);
    try {
      // Generar ID de sesión único
      const nuevoSesionId = `sesion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Crear sesión pública en Supabase
      const { error } = await supabase
        .from('SesionPublica')
        .insert({
          sesion_id: nuevoSesionId,
          iniciado_en: new Date().toISOString(),
          ultima_actividad: new Date().toISOString()
        });

      if (error) {
        console.error('Error al crear sesión:', error);
        toast.error('Error al iniciar chat');
      } else {
        setSesionId(nuevoSesionId);

        // Mensaje de bienvenida
        const mensajeBienvenida: Mensaje = {
          id: 'bienvenida',
          contenido: '¡Hola! 👋 Soy Escuchodromo, tu compañero de bienestar emocional. Este es un espacio seguro donde puedes compartir lo que sientes sin juicios. ¿Cómo te sientes hoy?',
          rol: 'asistente',
          creado_en: new Date().toISOString()
        };
        setMensajes([mensajeBienvenida]);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al conectar');
    } finally {
      setCargando(false);
    }
  };

  const handleEnviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputMensaje.trim()) return;

    if (mensajesRestantes <= 0 && !usuario) {
      setMostrarLimite(true);
      return;
    }

    const mensajeUsuario: Mensaje = {
      id: `msg-${Date.now()}`,
      contenido: inputMensaje,
      rol: 'usuario',
      creado_en: new Date().toISOString()
    };

    setMensajes(prev => [...prev, mensajeUsuario]);
    setInputMensaje('');
    setEscribiendo(true);

    // Guardar mensaje en Supabase
    try {
      await supabase
        .from('MensajePublico')
        .insert({
          sesion_id: sesionId,
          contenido: inputMensaje,
          rol: 'usuario'
        });

      // Simular respuesta de IA (después crearás la Edge Function)
      setTimeout(async () => {
        const respuesta = generarRespuestaSimple(inputMensaje);

        const mensajeIA: Mensaje = {
          id: `msg-${Date.now()}-ia`,
          contenido: respuesta,
          rol: 'asistente',
          creado_en: new Date().toISOString()
        };

        setMensajes(prev => [...prev, mensajeIA]);

        // Guardar respuesta en Supabase
        await supabase
          .from('MensajePublico')
          .insert({
            sesion_id: sesionId,
            contenido: respuesta,
            rol: 'asistente'
          });

        setEscribiendo(false);

        if (!usuario) {
          setMensajesRestantes(prev => prev - 1);
        }
      }, 1500);

    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al enviar mensaje');
      setEscribiendo(false);
    }
  };

  const generarRespuestaSimple = (mensaje: string): string => {
    const mensajeLower = mensaje.toLowerCase();

    if (mensajeLower.includes('hola') || mensajeLower.includes('buenos')) {
      return '¡Hola! 😊 Me alegra mucho que estés aquí. ¿En qué puedo ayudarte hoy? Puedes contarme cómo te sientes o qué te preocupa.';
    }

    if (mensajeLower.includes('triste') || mensajeLower.includes('mal') || mensajeLower.includes('deprimido')) {
      return 'Entiendo que te sientes triste 💙. Es completamente válido sentirse así. ¿Quieres contarme más sobre lo que está pasando? Estoy aquí para escucharte sin juzgar.';
    }

    if (mensajeLower.includes('ansiedad') || mensajeLower.includes('ansioso') || mensajeLower.includes('nervios')) {
      return 'La ansiedad puede ser muy difícil 🌿. Una técnica que puede ayudar es la respiración profunda: inhala contando hasta 4, sostén por 4, exhala contando hasta 4. ¿Te gustaría que te guíe en algún ejercicio de relajación?';
    }

    if (mensajeLower.includes('estrés') || mensajeLower.includes('estresado') || mensajeLower.includes('agobiado')) {
      return 'El estrés es una respuesta natural, pero es importante manejarlo 🧘‍♀️. ¿Qué aspectos de tu vida sientes que te están generando más estrés? Podemos hablar sobre formas de abordarlo.';
    }

    if (mensajeLower.includes('gracias') || mensajeLower.includes('ayuda')) {
      return '¡De nada! 💕 Estoy aquí para ti siempre que lo necesites. Recuerda que buscar apoyo es un signo de fortaleza, no de debilidad.';
    }

    // Respuesta por defecto
    return 'Entiendo. Cuéntame más sobre eso, estoy aquí para escucharte 💚. ¿Cómo te hace sentir? Recuerda que este es un espacio seguro donde puedes expresarte libremente.';
  };

  const toggleGrabacionVoz = () => {
    if (mensajesRestantes <= 0 && !usuario) {
      setMostrarLimite(true);
      return;
    }

    setGrabandoVoz(!grabandoVoz);
    if (!grabandoVoz) {
      toast.success('Grabación iniciada. Habla claramente.');
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

  if (cargando) {
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

              {!usuario && (
                <div className="flex items-center gap-3 bg-teal-50 px-6 py-3 rounded-full border border-teal-200">
                  <FaInfoCircle className="text-teal-600" />
                  <span className="text-teal-700 font-bold">
                    {mensajesRestantes} mensajes gratis restantes
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
                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-800 rounded-2xl text-sm font-medium hover:from-teal-200 hover:to-cyan-200 transition-all duration-200 shadow-md hover:shadow-lg border border-teal-200"
                  >
                    <FaLightbulb />
                    {sugerencia.length > 40 ? sugerencia.substring(0, 40) + '...' : sugerencia}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Área de mensajes */}
          <div className="bg-gradient-to-b from-teal-50 to-cyan-50 min-h-[600px] max-h-[600px] overflow-y-auto p-8 shadow-inner">
            <AnimatePresence>
              {mensajes.map((mensaje) => (
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
                        {new Date(mensaje.creado_en).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

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
                disabled={mensajesRestantes <= 0 && !usuario}
              />

              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleGrabacionVoz}
                className={`p-5 rounded-3xl transition-all duration-300 shadow-lg ${
                  grabandoVoz
                    ? 'bg-red-500 text-white'
                    : 'bg-gradient-to-r from-teal-400 to-teal-500 text-white hover:shadow-teal-200'
                }`}
              >
                {grabandoVoz ? <FaMicrophoneSlash size={24} /> : <FaMicrophone size={24} />}
              </motion.button>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={!inputMensaje.trim() || (mensajesRestantes <= 0 && !usuario)}
                className="px-10 py-5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-3xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                <FaPaperPlane size={22} />
              </motion.button>
            </form>
          </div>
        </div>

        {/* Banner informativo */}
        {!usuario && (
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
