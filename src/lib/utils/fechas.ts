import { format, parse, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Utilidades para manejo de fechas en español
 * Específicamente para el sistema de reservas
 */

export const formatearFecha = (fecha: Date, formato: string = 'PPP'): string => {
  return format(fecha, formato, { locale: es });
};

export const formatearFechaCorta = (fecha: Date): string => {
  return format(fecha, 'dd/MM/yyyy', { locale: es });
};

export const formatearHora = (fecha: Date): string => {
  return format(fecha, 'HH:mm', { locale: es });
};

export const formatearFechaHora = (fecha: Date): string => {
  return format(fecha, "d 'de' MMMM 'a las' HH:mm", { locale: es });
};

export const obtenerNombreMes = (fecha: Date): string => {
  return format(fecha, 'MMMM yyyy', { locale: es });
};

export const obtenerNombreDia = (fecha: Date): string => {
  return format(fecha, 'EEEE', { locale: es });
};

export const mesAnterior = (fecha: Date): Date => {
  return subMonths(fecha, 1);
};

export const mesSiguiente = (fecha: Date): Date => {
  return addMonths(fecha, 1);
};

export const obtenerDiasDelMes = (fecha: Date): Date[] => {
  const inicio = startOfMonth(fecha);
  const fin = endOfMonth(fecha);
  return eachDayOfInterval({ start: inicio, end: fin });
};

export const esMismoMes = (fecha1: Date, fecha2: Date): boolean => {
  return isSameMonth(fecha1, fecha2);
};

export const esMismoDia = (fecha1: Date, fecha2: Date): boolean => {
  return isSameDay(fecha1, fecha2);
};

export const esHoy = (fecha: Date): boolean => {
  return isToday(fecha);
};

export const parsearFechaISO = (fechaString: string): Date => {
  return parseISO(fechaString);
};

export const formatearParaAPI = (fecha: Date): string => {
  return format(fecha, 'yyyy-MM-dd', { locale: es });
};

export const formatearHoraParaAPI = (fecha: Date): string => {
  return format(fecha, 'HH:mm:ss', { locale: es });
};

export const combinarFechaHora = (fecha: Date, hora: string): Date => {
  const [horas, minutos] = hora.split(':').map(Number);
  const nuevaFecha = new Date(fecha);
  nuevaFecha.setHours(horas, minutos, 0, 0);
  return nuevaFecha;
};
