'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../../lib/componentes/ui/card';
import { ChatVoz } from '../../lib/componentes/chat/ChatVoz';
import { Boton } from '../../lib/componentes/ui/boton';
import { FaArrowLeft, FaMicrophone, FaBrain, FaHeart, FaShieldAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Navegacion from '../../lib/componentes/layout/Navegacion';
import Footer from '../../lib/componentes/layout/Footer';
import { obtenerClienteNavegador } from '../../lib/supabase/cliente';
import { toast } from 'react-hot-toast';

export default function PaginaVoz() {
  const router = useRouter();
  const [conversacionId, setConversacionId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    verificarYCrearConversacion();
  }, [router]);

  const verificarYCrearConversacion = async () => {
    const supabase = obtenerClienteNavegador();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push('/iniciar-sesion');
      return;
    }

    crearConversacionVoz();
  };

  const crearConversacionVoz = async () => {
    try {
      const supabase = obtenerClienteNavegador();

      // Obtener sesión
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Obtener usuario_id
      const { data: usuario } = await supabase
        .from('Usuario')
        .select('id')
        .eq('auth_id', session.user.id)
        .single();

      if (!usuario) {
        toast.error('Usuario no encontrado');
        return;
      }

      // Crear conversación
      const { data: conversacion, error } = await supabase
        .from('Conversacion')
        .insert({
          usuario_id: usuario.id,
          titulo: `Sesión de voz - ${new Date().toLocaleDateString('es-ES')}`,
        })
        .select()
        .single();

      if (error) {
        console.error('Error al crear conversación de voz:', error);
        toast.error('Error al crear sesión de voz');
        return;
      }

      setConversacionId(conversacion.id);
    } catch (error) {
      console.error('Error al crear conversación de voz:', error);
      toast.error('Error al crear sesión de voz');
    } finally {
      setCargando(false);
    }
  };

  const manejarMensajeVoz = async (mensaje: string, emociones?: any) => {
    try {
      const supabase = obtenerClienteNavegador();

      // Obtener sesión
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Obtener usuario_id
      const { data: usuario } = await supabase
        .from('Usuario')
        .select('id')
        .eq('auth_id', session.user.id)
        .single();

      if (!usuario) return;

      // Insertar mensaje
      const { error } = await supabase
        .from('Mensaje')
        .insert({
          conversacion_id: conversacionId,
          usuario_id: usuario.id,
          contenido: mensaje,
          remitente: 'usuario',
          tipo: 'audio',
          emociones: emociones || null,
        });

      if (error) {
        console.error('Error al guardar mensaje de voz:', error);
        toast.error('Error al guardar mensaje');
        return;
      }

      console.log('Mensaje de voz guardado');
    } catch (error) {
      console.error('Error al guardar mensaje de voz:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      <Navegacion />
      
      <div className="pt-20 pb-8 px-4">
        <div className="container mx-auto">
          {/* Header */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/chat">
              <Boton variante="contorno" className="mb-6">
                <FaArrowLeft className="mr-2" />
                Volver al Chat
              </Boton>
            </Link>
            
            <div className="flex items-center gap-6 mb-8">
              <div className="h-16 w-16 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center shadow-xl">
                <FaMicrophone className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                  Conversación por Voz
                </h1>
                <p className="text-gray-600 text-lg">
                  Expresa tus emociones hablando con nuestra inteligencia artificial empática
                </p>
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div 
            className="grid lg:grid-cols-3 gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Chat de voz */}
            <div className="lg:col-span-2">
              <Card variante="teal" className="shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl text-teal-800 flex items-center gap-3">
                    <FaMicrophone className="text-teal-600" />
                    Habla con confianza
                  </CardTitle>
                  <p className="text-teal-600 mt-2">
                    Nuestra IA analiza el tono de tu voz para brindarte el mejor apoyo emocional
                  </p>
                </CardHeader>
                <CardContent>
                  {cargando ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-200 border-t-teal-500 mb-4"></div>
                      <p className="text-teal-600">Preparando tu sesión de voz...</p>
                    </div>
                  ) : conversacionId ? (
                    <ChatVoz
                      conversacionId={conversacionId}
                      onMensajeEnviado={manejarMensajeVoz}
                    />
                  ) : (
                    <div className="text-center py-16">
                      <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaHeart className="h-8 w-8 text-red-500" />
                      </div>
                      <p className="text-gray-600 text-lg">Error al iniciar la conversación</p>
                      <p className="text-gray-500 mt-2">Por favor, intenta de nuevo en unos momentos</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Panel lateral de información */}
            <div className="space-y-6">
              {/* Consejos */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg text-gray-800">
                      <div className="h-8 w-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
                        <FaBrain className="h-4 w-4 text-white" />
                      </div>
                      Consejos para la sesión
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-sm">
                      {[
                        'Encuentra un lugar tranquilo sin ruido',
                        'Habla de forma clara y pausada',
                        'Expresa libremente tus emociones',
                        'No hay respuestas correctas o incorrectas',
                        'Tómate tu tiempo para reflexionar'
                      ].map((consejo, index) => (
                        <li key={index} className="flex items-start gap-3 text-gray-600">
                          <div className="h-2 w-2 bg-teal-400 rounded-full mt-2 flex-shrink-0"></div>
                          {consejo}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Beneficios */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg text-gray-800">
                      <div className="h-8 w-8 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                        <FaHeart className="h-4 w-4 text-white" />
                      </div>
                      Beneficios de hablar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        {
                          titulo: 'Liberación emocional',
                          descripcion: 'Expresar tus sentimientos ayuda a procesarlos mejor'
                        },
                        {
                          titulo: 'Autoconocimiento',
                          descripcion: 'Descubre patrones en tus emociones y pensamientos'
                        },
                        {
                          titulo: 'Apoyo personalizado',
                          descripcion: 'Recibe recomendaciones basadas en tu estado emocional'
                        }
                      ].map((beneficio, index) => (
                        <div key={index} className="border-l-4 border-teal-400 pl-4">
                          <h4 className="font-semibold text-gray-800 mb-1">{beneficio.titulo}</h4>
                          <p className="text-sm text-gray-600">{beneficio.descripcion}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Estado de privacidad */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200 shadow-lg">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <FaShieldAlt className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-teal-900 mb-2">
                          Tu privacidad está protegida
                        </h4>
                        <p className="text-sm text-teal-700 leading-relaxed">
                          Todas las conversaciones son confidenciales y están protegidas 
                          con encriptación de grado bancario. Tu información nunca será compartida.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}