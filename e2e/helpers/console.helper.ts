/**
 * Helper para capturar y analizar errores de consola
 * Crítico para detectar errores de API, recursos faltantes y problemas de código
 */

import { Page, ConsoleMessage } from '@playwright/test';

export interface ErrorConsola {
  tipo: 'error' | 'warning' | 'info';
  mensaje: string;
  url?: string;
  timestamp: Date;
}

export interface ResumenErrores {
  errores: ErrorConsola[];
  warnings: ErrorConsola[];
  erroresAPI: ErrorConsola[];
  errores404: ErrorConsola[];
  errores403: ErrorConsola[];
  errores406: ErrorConsola[];
  erroresTotales: number;
  warningsTotales: number;
}

/**
 * Captura todos los mensajes de consola durante la navegación
 */
export class CaptorConsola {
  private errores: ErrorConsola[] = [];
  private warnings: ErrorConsola[] = [];
  private listeners: Array<(msg: ConsoleMessage) => void> = [];

  constructor(private page: Page) {
    this.iniciarCaptura();
  }

  private iniciarCaptura(): void {
    const handler = (msg: ConsoleMessage) => {
      const tipo = msg.type();
      const texto = msg.text();
      const url = msg.location()?.url;

      const error: ErrorConsola = {
        tipo: tipo as 'error' | 'warning' | 'info',
        mensaje: texto,
        url,
        timestamp: new Date()
      };

      if (tipo === 'error') {
        this.errores.push(error);
        console.error(`[CONSOLE ERROR] ${texto}`, url ? `- URL: ${url}` : '');
      } else if (tipo === 'warning') {
        this.warnings.push(error);
        console.warn(`[CONSOLE WARNING] ${texto}`, url ? `- URL: ${url}` : '');
      }
    };

    this.page.on('console', handler);
    this.listeners.push(handler);
  }

  /**
   * Captura errores de red (404, 403, 406, 500, etc.)
   */
  public capturarErroresRed(): void {
    this.page.on('response', async (response) => {
      const status = response.status();
      const url = response.url();

      // Ignorar errores en recursos opcionales
      if (url.includes('_next/static') || url.includes('favicon')) {
        return;
      }

      if (status >= 400) {
        const error: ErrorConsola = {
          tipo: 'error',
          mensaje: `HTTP ${status}: ${response.statusText()}`,
          url,
          timestamp: new Date()
        };

        this.errores.push(error);
        console.error(`[HTTP ERROR] ${status} - ${url}`);
      }
    });

    this.page.on('requestfailed', (request) => {
      const url = request.url();
      const failure = request.failure();

      const error: ErrorConsola = {
        tipo: 'error',
        mensaje: `Request failed: ${failure?.errorText || 'Unknown error'}`,
        url,
        timestamp: new Date()
      };

      this.errores.push(error);
      console.error(`[REQUEST FAILED] ${url} - ${failure?.errorText}`);
    });
  }

  /**
   * Obtiene resumen de errores capturados
   */
  public obtenerResumen(): ResumenErrores {
    const erroresAPI = this.errores.filter(e =>
      e.url?.includes('/api/') ||
      e.url?.includes('supabase') ||
      e.mensaje.includes('fetch') ||
      e.mensaje.includes('API')
    );

    const errores404 = this.errores.filter(e =>
      e.mensaje.includes('404') ||
      e.mensaje.includes('Not Found')
    );

    const errores403 = this.errores.filter(e =>
      e.mensaje.includes('403') ||
      e.mensaje.includes('Forbidden')
    );

    const errores406 = this.errores.filter(e =>
      e.mensaje.includes('406') ||
      e.mensaje.includes('Not Acceptable')
    );

    return {
      errores: this.errores,
      warnings: this.warnings,
      erroresAPI,
      errores404,
      errores403,
      errores406,
      erroresTotales: this.errores.length,
      warningsTotales: this.warnings.length
    };
  }

  /**
   * Limpia errores capturados
   */
  public limpiar(): void {
    this.errores = [];
    this.warnings = [];
  }

  /**
   * Detiene la captura de errores
   */
  public detener(): void {
    this.listeners.forEach(listener => {
      this.page.removeListener('console', listener);
    });
    this.listeners = [];
  }

  /**
   * Genera reporte en formato markdown
   */
  public generarReporte(): string {
    const resumen = this.obtenerResumen();
    let reporte = '# Reporte de Errores de Consola\n\n';
    reporte += `**Total de Errores:** ${resumen.erroresTotales}\n`;
    reporte += `**Total de Warnings:** ${resumen.warningsTotales}\n\n`;

    if (resumen.errores406.length > 0) {
      reporte += `## 🔴 CRÍTICO: Errores 406 (Not Acceptable)\n\n`;
      resumen.errores406.forEach((e, i) => {
        reporte += `${i + 1}. ${e.mensaje}\n   - URL: ${e.url || 'N/A'}\n\n`;
      });
    }

    if (resumen.errores403.length > 0) {
      reporte += `## 🔴 CRÍTICO: Errores 403 (Forbidden)\n\n`;
      resumen.errores403.forEach((e, i) => {
        reporte += `${i + 1}. ${e.mensaje}\n   - URL: ${e.url || 'N/A'}\n\n`;
      });
    }

    if (resumen.errores404.length > 0) {
      reporte += `## ⚠️ Errores 404 (Not Found)\n\n`;
      resumen.errores404.forEach((e, i) => {
        reporte += `${i + 1}. ${e.mensaje}\n   - URL: ${e.url || 'N/A'}\n\n`;
      });
    }

    if (resumen.erroresAPI.length > 0) {
      reporte += `## ⚠️ Errores de API\n\n`;
      resumen.erroresAPI.forEach((e, i) => {
        reporte += `${i + 1}. ${e.mensaje}\n   - URL: ${e.url || 'N/A'}\n\n`;
      });
    }

    if (resumen.errores.length > 0) {
      reporte += `## Todos los Errores\n\n`;
      resumen.errores.forEach((e, i) => {
        reporte += `${i + 1}. [${e.timestamp.toISOString()}] ${e.mensaje}\n`;
        if (e.url) reporte += `   - URL: ${e.url}\n`;
        reporte += '\n';
      });
    }

    return reporte;
  }
}
