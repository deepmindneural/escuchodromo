'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaEnvelope, FaWhatsapp, FaPhone, FaMapMarkerAlt,
  FaClock, FaHeart, FaQuestionCircle, FaBug, FaLightbulb
} from 'react-icons/fa';
import { toast, Toaster } from 'react-hot-toast';
import Navegacion from '../../lib/componentes/layout/Navegacion';

export default function PaginaContacto() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    asunto: '',
    mensaje: '',
    tipo: 'consulta'
  });
  const [enviando, setEnviando] = useState(false);

  const tiposConsulta = [
    { id: 'consulta', label: 'Consulta General', icono: FaQuestionCircle, color: 'red' },
    { id: 'soporte', label: 'Soporte Técnico', icono: FaBug, color: 'red' },
    { id: 'sugerencia', label: 'Sugerencia', icono: FaLightbulb, color: 'pink' },
    { id: 'bienestar', label: 'Consulta de Bienestar', icono: FaHeart, color: 'pink' }
  ];

  const canalesContacto = [
    {
      icono: FaEnvelope,
      titulo: 'Email',
      descripcion: 'Escríbenos y te responderemos en 24 horas',
      contacto: 'hola@escuchodromo.com',
      accion: 'Enviar Email',
      color: 'from-teal-400 to-teal-600'
    },
    {
      icono: FaWhatsapp,
      titulo: 'WhatsApp',
      descripcion: 'Chatea con nosotros en tiempo real',
      contacto: '+57 300 123 4567',
      accion: 'Abrir WhatsApp',
      color: 'from-green-400 to-green-600'
    },
    {
      icono: FaPhone,
      titulo: 'Teléfono',
      descripcion: 'Línea de atención directa',
      contacto: '+57 (1) 234-5678',
      accion: 'Llamar Ahora',
      color: 'from-cyan-400 to-cyan-600'
    }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);

    try {
      // Simulación de envío
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('¡Mensaje enviado correctamente! Te responderemos pronto.');
      setFormData({
        nombre: '',
        email: '',
        asunto: '',
        mensaje: '',
        tipo: 'consulta'
      });
    } catch (error) {
      toast.error('Error al enviar el mensaje. Inténtalo de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-cyan-50">
      <Toaster position="top-center" />
      <Navegacion />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              Contáctanos
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
              Estamos aquí para ayudarte. Ponte en contacto con nosotros a través 
              del canal que prefieras y te responderemos lo antes posible.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Canales de Contacto */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-16 text-gray-900">
            Elige tu Canal Preferido
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {canalesContacto.map((canal, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="bg-white rounded-2xl shadow-xl p-8 text-center hover:shadow-2xl transition-shadow duration-300"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${canal.color} rounded-xl flex items-center justify-center mx-auto mb-6`}>
                  <canal.icono className="text-3xl text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {canal.titulo}
                </h3>
                
                <p className="text-gray-600 mb-4">
                  {canal.descripcion}
                </p>
                
                <p className="text-lg font-medium text-gray-900 mb-6">
                  {canal.contacto}
                </p>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-full py-3 bg-gradient-to-r ${canal.color} text-white font-medium rounded-lg transition-all duration-200`}
                  onClick={() => {
                    if (canal.titulo === 'Email') {
                      window.location.href = `mailto:${canal.contacto}`;
                    } else if (canal.titulo === 'WhatsApp') {
                      window.open(`https://wa.me/573001234567`, '_blank');
                    } else if (canal.titulo === 'Teléfono') {
                      window.location.href = `tel:${canal.contacto}`;
                    }
                  }}
                >
                  {canal.accion}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Formulario de Contacto */}
      <section className="py-20 bg-white px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Información */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-6 text-gray-900">
                Envíanos un Mensaje
              </h2>
              <p className="text-gray-600 mb-8">
                ¿Prefieres escribirnos? Completa el formulario y nos pondremos en contacto contigo.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                    <FaClock className="text-teal-600 text-xl" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Tiempo de Respuesta</h4>
                    <p className="text-gray-600">Menos de 24 horas</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <FaMapMarkerAlt className="text-green-600 text-xl" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Ubicación</h4>
                    <p className="text-gray-600">Bogotá, Colombia</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
                    <FaHeart className="text-cyan-600 text-xl" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Nuestro Compromiso</h4>
                    <p className="text-gray-600">Tu bienestar es nuestra prioridad</p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Formulario */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Tipo de consulta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tipo de Consulta
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {tiposConsulta.map((tipo) => (
                      <motion.button
                        key={tipo.id}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setFormData(prev => ({ ...prev, tipo: tipo.id }))}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center gap-2 ${
                          formData.tipo === tipo.id
                            ? 'border-teal-500 bg-teal-50 text-teal-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <tipo.icono className="text-sm" />
                        <span className="text-sm font-medium">{tipo.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
                
                {/* Nombre */}
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Tu nombre completo"
                  />
                </div>
                
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="tu@email.com"
                  />
                </div>
                
                {/* Asunto */}
                <div>
                  <label htmlFor="asunto" className="block text-sm font-medium text-gray-700 mb-2">
                    Asunto
                  </label>
                  <input
                    type="text"
                    id="asunto"
                    name="asunto"
                    value={formData.asunto}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="¿En qué podemos ayudarte?"
                  />
                </div>
                
                {/* Mensaje */}
                <div>
                  <label htmlFor="mensaje" className="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje
                  </label>
                  <textarea
                    id="mensaje"
                    name="mensaje"
                    value={formData.mensaje}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                    placeholder="Cuéntanos más detalles sobre tu consulta..."
                  />
                </div>
                
                {/* Botón */}
                <motion.button
                  type="submit"
                  disabled={enviando}
                  whileHover={{ scale: enviando ? 1 : 1.02 }}
                  whileTap={{ scale: enviando ? 1 : 0.98 }}
                  className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {enviando ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Enviando...
                    </div>
                  ) : (
                    'Enviar Mensaje'
                  )}
                </motion.button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Información adicional */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-3xl p-8 text-white text-center"
          >
            <h2 className="text-3xl font-bold mb-4">
              ¿Necesitas Apoyo Inmediato?
            </h2>
            <p className="text-xl mb-6 text-white/90">
              Si estás pasando por una crisis emocional, no esperes. 
              Prueba nuestro chat gratuito ahora mismo.
            </p>
            <motion.a
              href="/chat"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block px-8 py-4 bg-white text-teal-600 font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              Ir al Chat Gratuito
            </motion.a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}