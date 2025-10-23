'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BanknotesIcon, ArrowLeftIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { obtenerClienteNavegador } from '@/lib/supabase/cliente';
import {
  obtenerPagosProfesional,
  obtenerResumenFinanciero,
  obtenerPacientesProfesional,
  type FiltrosPagos,
  type PagoConDetalles,
  type ResumenFinanciero as ResumenFinancieroType,
  type PacienteConDatos,
} from '@/lib/supabase/queries/profesional';
import { TablaPagos } from '@/lib/componentes/TablaPagos';
import { ResumenFinanciero } from '@/lib/componentes/ResumenFinanciero';
import { FiltrosPagos as FiltrosPagosComponent } from '@/lib/componentes/FiltrosPagos';
import toast, { Toaster } from 'react-hot-toast';

/**
 * Página de Pagos del Profesional
 *
 * Funcionalidades:
 * - Resumen financiero completo con métricas
 * - Tabla de pagos con detalles de citas y pacientes
 * - Filtros avanzados (fecha, estado, paciente, monto)
 * - Exportación de datos (futuro)
 * - Gráficos de tendencias
 */
export default function PaginaPagosProfesional() {
  const router = useRouter();
  const supabase = obtenerClienteNavegador();

  // Estados
  const [cargando, setCargando] = useState(true);
  const [cargandoFiltros, setCargandoFiltros] = useState(false);
  const [profesionalId, setProfesionalId] = useState<string | null>(null);
  const [pagos, setPagos] = useState<PagoConDetalles[]>([]);
  const [resumen, setResumen] = useState<ResumenFinancieroType | null>(null);
  const [pacientes, setPacientes] = useState<
    Array<{ id: string; nombre: string; apellido: string | null }>
  >([]);
  const [filtrosActivos, setFiltrosActivos] = useState<FiltrosPagos>({});

  useEffect(() => {
    inicializar();
  }, []);

  const inicializar = async () => {
    try {
      setCargando(true);

      // Verificar sesión
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/iniciar-sesion');
        return;
      }

      // Verificar que el usuario es profesional
      const { data: usuario, error: errorUsuario } = await supabase
        .from('Usuario')
        .select('id, rol')
        .eq('auth_id', session.user.id)
        .single();

      if (errorUsuario || !usuario) {
        toast.error('Error al cargar información del usuario');
        return;
      }

      const usuarioData = usuario as { id: string; rol: 'USUARIO' | 'TERAPEUTA' | 'ADMIN' };

      if (usuarioData.rol !== 'TERAPEUTA' && usuarioData.rol !== 'ADMIN') {
        toast.error('No tienes permisos para acceder a esta página');
        router.push('/dashboard');
        return;
      }

      setProfesionalId(usuarioData.id);

      // Cargar datos en paralelo
      await Promise.all([
        cargarPagos(usuarioData.id),
        cargarResumen(usuarioData.id),
        cargarPacientes(usuarioData.id),
      ]);
    } catch (error) {
      console.error('Error inicializando página de pagos:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setCargando(false);
    }
  };

  const cargarPagos = async (profId: string, filtros?: FiltrosPagos) => {
    const { data, error } = await obtenerPagosProfesional(profId, filtros);

    if (error) {
      console.error('Error obteniendo pagos:', error);
      toast.error('Error al cargar los pagos');
      return;
    }

    setPagos(data || []);
  };

  const cargarResumen = async (profId: string) => {
    const { data, error } = await obtenerResumenFinanciero(profId);

    if (error) {
      console.error('Error obteniendo resumen:', error);
      toast.error('Error al cargar el resumen financiero');
      return;
    }

    setResumen(data);
  };

  const cargarPacientes = async (profId: string) => {
    const { data, error } = await obtenerPacientesProfesional(profId);

    if (error) {
      console.error('Error obteniendo pacientes:', error);
      return;
    }

    const pacientesSimplificados =
      data?.map((p: PacienteConDatos) => ({
        id: p.id,
        nombre: p.nombre,
        apellido: p.apellido,
      })) || [];

    setPacientes(pacientesSimplificados);
  };

  const handleAplicarFiltros = async (filtros: FiltrosPagos) => {
    if (!profesionalId) return;

    try {
      setCargandoFiltros(true);
      setFiltrosActivos(filtros);
      await cargarPagos(profesionalId, filtros);
    } finally {
      setCargandoFiltros(false);
    }
  };

  const handleVerPaciente = (pacienteId: string) => {
    router.push(`/pacientes/${pacienteId}/progreso`);
  };

  const handleVerDetalle = (pagoId: string) => {
    // Por ahora, mostrar un toast
    // En el futuro, abrir modal con detalles completos del pago
    toast('Función de detalles en desarrollo', { icon: 'ℹ️' });
  };

  const handleExportar = () => {
    // Función de exportación a Excel/CSV
    toast('Función de exportación en desarrollo', { icon: 'ℹ️' });
  };

  if (cargando) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Cargando página de pagos"
        className="min-h-screen bg-gradient-to-br from-calma-50 via-white to-esperanza-50 flex items-center justify-center"
      >
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative mx-auto mb-6">
            <div
              className="w-20 h-20 border-4 border-calma-200 border-t-calma-600 rounded-full animate-spin"
              aria-hidden="true"
            />
            <BanknotesIcon className="w-8 h-8 text-calma-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-gray-700 text-lg font-medium">Cargando información financiera...</p>
          <p className="text-gray-500 text-sm mt-2">Obteniendo pagos y resumen</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-calma-50 via-white to-esperanza-50">
      <Toaster position="top-right" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white shadow-xl"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/profesional/dashboard')}
                className="p-2 hover:bg-white/20 rounded-lg transition-all"
                aria-label="Volver al dashboard"
              >
                <ArrowLeftIcon className="w-6 h-6" aria-hidden="true" />
              </button>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <BanknotesIcon className="w-7 h-7 text-white" aria-hidden="true" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold">Gestión de Pagos</h1>
                </div>
                <p className="text-white/90 text-lg ml-15">
                  Historial completo de pagos y análisis financiero
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExportar}
              className="px-6 py-3 bg-white text-green-700 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-green-600 flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="w-5 h-5" aria-hidden="true" />
              Exportar datos
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Resumen financiero */}
          {resumen && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              aria-labelledby="resumen-titulo"
            >
              <h2 id="resumen-titulo" className="sr-only">
                Resumen financiero
              </h2>
              <ResumenFinanciero resumen={resumen} cargando={false} />
            </motion.section>
          )}

          {/* Filtros y tabla de pagos */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            aria-labelledby="pagos-titulo"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 id="pagos-titulo" className="text-2xl font-bold text-gray-900 mb-2">
                  Historial de Pagos
                </h2>
                <p className="text-gray-600">
                  {pagos.length} {pagos.length === 1 ? 'pago registrado' : 'pagos registrados'}
                  {Object.keys(filtrosActivos).length > 0 && ' (filtrados)'}
                </p>
              </div>
              <FiltrosPagosComponent
                onAplicarFiltros={handleAplicarFiltros}
                cargando={cargandoFiltros}
                pacientes={pacientes}
              />
            </div>

            <TablaPagos
              pagos={pagos}
              cargando={cargandoFiltros}
              onVerDetalle={handleVerDetalle}
              onVerPaciente={handleVerPaciente}
            />
          </motion.section>

          {/* Mensaje informativo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="bg-gradient-to-r from-blue-100 via-cyan-50 to-teal-100 border-l-4 border-blue-500 rounded-xl p-6 shadow-md"
            role="complementary"
            aria-label="Información adicional"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <BanknotesIcon className="w-7 h-7 text-white" aria-hidden="true" />
                </div>
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">
                  Información sobre pagos
                </h4>
                <p className="text-gray-700 leading-relaxed mb-2">
                  Los pagos se registran automáticamente cuando un paciente completa el pago de una cita.
                  Puedes usar los filtros para encontrar pagos específicos por fecha, estado o paciente.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Para más información sobre fiscalidad o reportes detallados, contacta con el equipo de
                  administración.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
