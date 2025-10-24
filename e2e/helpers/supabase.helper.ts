/**
 * Helper para validación de llamadas RPC de Supabase
 * Detecta errores específicos 406, 403, y validaciones de respuesta
 */

import { Page, Response } from '@playwright/test';

export interface ValidacionRPC {
  exito: boolean;
  codigo?: number;
  error?: string;
  url?: string;
  datos?: any;
}

/**
 * Intercepta y valida una llamada RPC específica
 */
export async function validarLlamadaRPC(
  page: Page,
  nombreFuncion: string,
  timeout: number = 10000
): Promise<ValidacionRPC> {
  return new Promise((resolve) => {
    let timeoutId: NodeJS.Timeout;

    const handler = async (response: Response) => {
      const url = response.url();

      // Verificar si es una llamada RPC que coincide
      if (url.includes('/rest/v1/rpc/') && url.includes(nombreFuncion)) {
        clearTimeout(timeoutId);
        page.off('response', handler);

        const status = response.status();

        try {
          if (status === 200) {
            const datos = await response.json();
            resolve({
              exito: true,
              codigo: status,
              url,
              datos
            });
          } else {
            const errorTexto = await response.text().catch(() => 'Error desconocido');
            resolve({
              exito: false,
              codigo: status,
              error: errorTexto,
              url
            });
          }
        } catch (error) {
          resolve({
            exito: false,
            codigo: status,
            error: error instanceof Error ? error.message : 'Error parseando respuesta',
            url
          });
        }
      }
    };

    page.on('response', handler);

    // Timeout si no se recibe respuesta
    timeoutId = setTimeout(() => {
      page.off('response', handler);
      resolve({
        exito: false,
        error: `Timeout esperando RPC ${nombreFuncion} (${timeout}ms)`
      });
    }, timeout);
  });
}

/**
 * Espera a que todas las llamadas RPC terminen
 */
export async function esperarRPCCompletas(
  page: Page,
  timeout: number = 5000
): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
  await page.waitForTimeout(1000); // Espera adicional para llamadas asíncronas
}

/**
 * Captura todos los errores RPC durante una operación
 */
export class CaptorRPC {
  private erroresRPC: Array<{
    funcion: string;
    codigo: number;
    error: string;
    url: string;
  }> = [];

  private exitosRPC: Array<{
    funcion: string;
    url: string;
  }> = [];

  constructor(private page: Page) {
    this.iniciarCaptura();
  }

  private iniciarCaptura(): void {
    this.page.on('response', async (response) => {
      const url = response.url();

      if (url.includes('/rest/v1/rpc/')) {
        const status = response.status();
        const nombreFuncion = this.extraerNombreFuncion(url);

        if (status >= 400) {
          const errorTexto = await response.text().catch(() => 'Error desconocido');
          this.erroresRPC.push({
            funcion: nombreFuncion,
            codigo: status,
            error: errorTexto,
            url
          });

          console.error(`[RPC ERROR] ${status} - ${nombreFuncion}`);
        } else if (status === 200) {
          this.exitosRPC.push({
            funcion: nombreFuncion,
            url
          });
        }
      }
    });
  }

  private extraerNombreFuncion(url: string): string {
    const match = url.match(/\/rpc\/([^?]+)/);
    return match ? match[1] : 'desconocida';
  }

  public obtenerErrores() {
    return {
      errores406: this.erroresRPC.filter(e => e.codigo === 406),
      errores403: this.erroresRPC.filter(e => e.codigo === 403),
      errores404: this.erroresRPC.filter(e => e.codigo === 404),
      errores500: this.erroresRPC.filter(e => e.codigo >= 500),
      todosErrores: this.erroresRPC,
      exitos: this.exitosRPC,
      totalErrores: this.erroresRPC.length,
      totalExitos: this.exitosRPC.length
    };
  }

  public limpiar(): void {
    this.erroresRPC = [];
    this.exitosRPC = [];
  }

  public generarReporte(): string {
    const resumen = this.obtenerErrores();
    let reporte = '# Reporte de Llamadas RPC de Supabase\n\n';

    reporte += `**Total Llamadas Exitosas:** ${resumen.totalExitos}\n`;
    reporte += `**Total Errores:** ${resumen.totalErrores}\n\n`;

    if (resumen.errores406.length > 0) {
      reporte += `## 🔴 CRÍTICO: Errores 406 en RPC\n\n`;
      resumen.errores406.forEach((e, i) => {
        reporte += `${i + 1}. Función: **${e.funcion}**\n`;
        reporte += `   - Error: ${e.error.substring(0, 200)}\n`;
        reporte += `   - URL: ${e.url}\n\n`;
      });
    }

    if (resumen.errores403.length > 0) {
      reporte += `## 🔴 CRÍTICO: Errores 403 en RPC (Permisos)\n\n`;
      resumen.errores403.forEach((e, i) => {
        reporte += `${i + 1}. Función: **${e.funcion}**\n`;
        reporte += `   - Error: ${e.error.substring(0, 200)}\n`;
        reporte += `   - URL: ${e.url}\n\n`;
      });
    }

    if (resumen.totalExitos > 0) {
      reporte += `## ✅ Llamadas Exitosas\n\n`;
      resumen.exitos.forEach((e, i) => {
        reporte += `${i + 1}. ${e.funcion}\n`;
      });
    }

    return reporte;
  }
}

/**
 * Valida que una llamada RPC específica sea exitosa
 */
export async function validarRPCExitosa(
  page: Page,
  nombreFuncion: string
): Promise<boolean> {
  const resultado = await validarLlamadaRPC(page, nombreFuncion);
  return resultado.exito && resultado.codigo === 200;
}

/**
 * Espera y valida múltiples llamadas RPC
 */
export async function validarMultiplesRPC(
  page: Page,
  funciones: string[]
): Promise<Map<string, ValidacionRPC>> {
  const resultados = new Map<string, ValidacionRPC>();

  const promesas = funciones.map(async (funcion) => {
    const resultado = await validarLlamadaRPC(page, funcion);
    resultados.set(funcion, resultado);
  });

  await Promise.all(promesas);
  return resultados;
}
