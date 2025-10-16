import { useState, useEffect } from 'react';
import {
  obtenerPlanUsuario,
  tieneAccesoCaracteristica,
  puedeRealizarAccion,
  type InfoPlanUsuario,
  type Caracteristica,
} from '../planes';

/**
 * Hook para obtener el plan del usuario y verificar accesos
 */
export function usePlanUsuario() {
  const [planInfo, setPlanInfo] = useState<InfoPlanUsuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarPlan();
  }, []);

  const cargarPlan = async () => {
    setCargando(true);
    const info = await obtenerPlanUsuario();
    setPlanInfo(info);
    setCargando(false);
  };

  const tieneAcceso = async (caracteristica: Caracteristica): Promise<boolean> => {
    return await tieneAccesoCaracteristica(caracteristica);
  };

  const puedeHacerAccion = async (tipo: 'mensaje' | 'evaluacion') => {
    return await puedeRealizarAccion(tipo);
  };

  return {
    planInfo,
    cargando,
    tieneAcceso,
    puedeHacerAccion,
    recargar: cargarPlan,
  };
}
