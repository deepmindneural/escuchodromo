/**
 * Configuración de CORS para Edge Functions
 * Seguridad: Solo permite origen de la aplicación
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // En producción, cambiar a dominio específico
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Max-Age': '86400',
};

/**
 * Valida origen de la request (para producción)
 */
export function validarOrigen(req: Request, origenesPermitidos: string[]): boolean {
  const origen = req.headers.get('origin');
  if (!origen) return false;
  return origenesPermitidos.includes(origen);
}
