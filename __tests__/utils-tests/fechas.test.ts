/**
 * Tests para utilidades de fechas
 *
 * Funciones críticas para formateo y manipulación de fechas
 * Cobertura objetivo: 95%+
 */

import {
  formatearFecha,
  formatearFechaCorta,
  formatearHora,
  formatearFechaHora,
  obtenerNombreMes,
  obtenerNombreDia,
  mesAnterior,
  mesSiguiente,
  obtenerDiasDelMes,
  esMismoMes,
  esMismoDia,
  esHoy,
  parsearFechaISO,
  formatearParaAPI,
  formatearHoraParaAPI,
  combinarFechaHora,
} from '@/lib/utils/fechas';

describe('Utilidades de Fechas', () => {
  // Fechas de prueba consistentes
  const fecha = new Date(2025, 10, 15, 14, 30, 0); // 15 Nov 2025 14:30
  const otraFecha = new Date(2025, 10, 20, 10, 0, 0); // 20 Nov 2025 10:00
  const fechaDiferente = new Date(2025, 11, 15, 14, 30, 0); // 15 Dic 2025 14:30

  describe('formatearFecha', () => {
    it('debe formatear fecha con formato por defecto (PPP)', () => {
      const resultado = formatearFecha(fecha);
      expect(resultado).toContain('noviembre');
      expect(resultado).toContain('2025');
    });

    it('debe formatear fecha con formato personalizado', () => {
      const resultado = formatearFecha(fecha, 'dd/MM/yyyy');
      expect(resultado).toBe('15/11/2025');
    });

    it('debe formatear en español', () => {
      const resultado = formatearFecha(fecha, 'EEEE d MMMM yyyy');
      expect(resultado).toMatch(/viernes.*noviembre.*2025/i);
    });
  });

  describe('formatearFechaCorta', () => {
    it('debe formatear en formato dd/MM/yyyy', () => {
      const resultado = formatearFechaCorta(fecha);
      expect(resultado).toBe('15/11/2025');
    });

    it('debe manejar primer día del mes', () => {
      const primerDia = new Date(2025, 10, 1);
      const resultado = formatearFechaCorta(primerDia);
      expect(resultado).toBe('01/11/2025');
    });

    it('debe manejar último día del mes', () => {
      const ultimoDia = new Date(2025, 10, 30);
      const resultado = formatearFechaCorta(ultimoDia);
      expect(resultado).toBe('30/11/2025');
    });
  });

  describe('formatearHora', () => {
    it('debe formatear hora en formato HH:mm', () => {
      const resultado = formatearHora(fecha);
      expect(resultado).toBe('14:30');
    });

    it('debe agregar ceros a la izquierda', () => {
      const fechaTemprano = new Date(2025, 10, 15, 9, 5, 0);
      const resultado = formatearHora(fechaTemprano);
      expect(resultado).toBe('09:05');
    });

    it('debe manejar medianoche', () => {
      const medianoche = new Date(2025, 10, 15, 0, 0, 0);
      const resultado = formatearHora(medianoche);
      expect(resultado).toBe('00:00');
    });
  });

  describe('formatearFechaHora', () => {
    it('debe formatear fecha y hora en español', () => {
      const resultado = formatearFechaHora(fecha);
      expect(resultado).toMatch(/15.*de.*noviembre.*a las.*14:30/i);
    });

    it('debe incluir preposiciones en español', () => {
      const resultado = formatearFechaHora(fecha);
      expect(resultado).toContain('de');
      expect(resultado).toContain('a las');
    });
  });

  describe('obtenerNombreMes', () => {
    it('debe retornar nombre del mes en español con año', () => {
      const resultado = obtenerNombreMes(fecha);
      expect(resultado).toBe('noviembre 2025');
    });

    it('debe capitalizar correctamente', () => {
      const resultado = obtenerNombreMes(fecha);
      expect(resultado.charAt(0)).toBe(resultado.charAt(0).toLowerCase());
    });

    it('debe manejar todos los meses', () => {
      const meses = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
      ];

      meses.forEach((mes, index) => {
        const fechaMes = new Date(2025, index, 15);
        const resultado = obtenerNombreMes(fechaMes);
        expect(resultado).toContain(mes);
      });
    });
  });

  describe('obtenerNombreDia', () => {
    it('debe retornar nombre del día en español', () => {
      const resultado = obtenerNombreDia(fecha);
      expect(resultado).toBe('viernes');
    });

    it('debe manejar todos los días de la semana', () => {
      // 3 Nov 2025 es lunes
      const lunes = new Date(2025, 10, 3);
      const dias = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

      dias.forEach((dia, index) => {
        const fechaDia = new Date(2025, 10, 3 + index);
        const resultado = obtenerNombreDia(fechaDia);
        expect(resultado).toBe(dia);
      });
    });
  });

  describe('mesAnterior', () => {
    it('debe retornar el mes anterior', () => {
      const resultado = mesAnterior(fecha);
      expect(resultado.getMonth()).toBe(9); // Octubre (0-indexed)
      expect(resultado.getFullYear()).toBe(2025);
    });

    it('debe manejar cambio de año', () => {
      const enero = new Date(2025, 0, 15);
      const resultado = mesAnterior(enero);
      expect(resultado.getMonth()).toBe(11); // Diciembre
      expect(resultado.getFullYear()).toBe(2024);
    });
  });

  describe('mesSiguiente', () => {
    it('debe retornar el mes siguiente', () => {
      const resultado = mesSiguiente(fecha);
      expect(resultado.getMonth()).toBe(11); // Diciembre
      expect(resultado.getFullYear()).toBe(2025);
    });

    it('debe manejar cambio de año', () => {
      const diciembre = new Date(2025, 11, 15);
      const resultado = mesSiguiente(diciembre);
      expect(resultado.getMonth()).toBe(0); // Enero
      expect(resultado.getFullYear()).toBe(2026);
    });
  });

  describe('obtenerDiasDelMes', () => {
    it('debe retornar todos los días de noviembre 2025', () => {
      const resultado = obtenerDiasDelMes(fecha);
      expect(resultado).toHaveLength(30); // Noviembre tiene 30 días
    });

    it('debe retornar días en orden', () => {
      const resultado = obtenerDiasDelMes(fecha);
      resultado.forEach((dia, index) => {
        expect(dia.getDate()).toBe(index + 1);
      });
    });

    it('debe manejar febrero en año bisiesto', () => {
      const febrero2024 = new Date(2024, 1, 1); // 2024 es bisiesto
      const resultado = obtenerDiasDelMes(febrero2024);
      expect(resultado).toHaveLength(29);
    });

    it('debe manejar febrero en año no bisiesto', () => {
      const febrero2025 = new Date(2025, 1, 1); // 2025 no es bisiesto
      const resultado = obtenerDiasDelMes(febrero2025);
      expect(resultado).toHaveLength(28);
    });

    it('debe retornar objetos Date válidos', () => {
      const resultado = obtenerDiasDelMes(fecha);
      resultado.forEach(dia => {
        expect(dia).toBeInstanceOf(Date);
        expect(dia.getMonth()).toBe(10); // Todos en noviembre
      });
    });
  });

  describe('esMismoMes', () => {
    it('debe retornar true para fechas del mismo mes', () => {
      const resultado = esMismoMes(fecha, otraFecha);
      expect(resultado).toBe(true);
    });

    it('debe retornar false para fechas de meses diferentes', () => {
      const resultado = esMismoMes(fecha, fechaDiferente);
      expect(resultado).toBe(false);
    });

    it('debe considerar el año', () => {
      const fecha2024 = new Date(2024, 10, 15);
      const fecha2025 = new Date(2025, 10, 15);
      const resultado = esMismoMes(fecha2024, fecha2025);
      expect(resultado).toBe(false);
    });
  });

  describe('esMismoDia', () => {
    it('debe retornar true para la misma fecha', () => {
      const mismoDia = new Date(2025, 10, 15, 18, 0, 0); // Misma fecha, hora diferente
      const resultado = esMismoDia(fecha, mismoDia);
      expect(resultado).toBe(true);
    });

    it('debe retornar false para días diferentes', () => {
      const resultado = esMismoDia(fecha, otraFecha);
      expect(resultado).toBe(false);
    });

    it('debe ignorar la hora', () => {
      const mismaFechaDiferenteHora = new Date(2025, 10, 15, 23, 59, 59);
      const resultado = esMismoDia(fecha, mismaFechaDiferenteHora);
      expect(resultado).toBe(true);
    });
  });

  describe('esHoy', () => {
    it('debe retornar true para la fecha de hoy', () => {
      const hoy = new Date();
      const resultado = esHoy(hoy);
      expect(resultado).toBe(true);
    });

    it('debe retornar false para fechas pasadas', () => {
      const ayer = new Date();
      ayer.setDate(ayer.getDate() - 1);
      const resultado = esHoy(ayer);
      expect(resultado).toBe(false);
    });

    it('debe retornar false para fechas futuras', () => {
      const manana = new Date();
      manana.setDate(manana.getDate() + 1);
      const resultado = esHoy(manana);
      expect(resultado).toBe(false);
    });
  });

  describe('parsearFechaISO', () => {
    it('debe parsear string ISO válido', () => {
      const resultado = parsearFechaISO('2025-11-15T14:30:00');
      expect(resultado.getFullYear()).toBe(2025);
      expect(resultado.getMonth()).toBe(10); // Noviembre (0-indexed)
      expect(resultado.getDate()).toBe(15);
    });

    it('debe manejar formato ISO sin hora', () => {
      const resultado = parsearFechaISO('2025-11-15');
      expect(resultado.getFullYear()).toBe(2025);
      expect(resultado.getMonth()).toBe(10);
      expect(resultado.getDate()).toBe(15);
    });

    it('debe manejar zona horaria UTC', () => {
      const resultado = parsearFechaISO('2025-11-15T14:30:00Z');
      expect(resultado).toBeInstanceOf(Date);
    });
  });

  describe('formatearParaAPI', () => {
    it('debe formatear en formato YYYY-MM-DD', () => {
      const resultado = formatearParaAPI(fecha);
      expect(resultado).toBe('2025-11-15');
    });

    it('debe agregar ceros a la izquierda', () => {
      const fechaTemprano = new Date(2025, 0, 5); // 5 Enero
      const resultado = formatearParaAPI(fechaTemprano);
      expect(resultado).toBe('2025-01-05');
    });

    it('debe ser compatible con ISO 8601', () => {
      const resultado = formatearParaAPI(fecha);
      expect(resultado).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('formatearHoraParaAPI', () => {
    it('debe formatear en formato HH:mm:ss', () => {
      const resultado = formatearHoraParaAPI(fecha);
      expect(resultado).toBe('14:30:00');
    });

    it('debe incluir segundos', () => {
      const fechaConSegundos = new Date(2025, 10, 15, 14, 30, 45);
      const resultado = formatearHoraParaAPI(fechaConSegundos);
      expect(resultado).toBe('14:30:45');
    });

    it('debe agregar ceros a la izquierda', () => {
      const fechaTemprano = new Date(2025, 10, 15, 9, 5, 3);
      const resultado = formatearHoraParaAPI(fechaTemprano);
      expect(resultado).toBe('09:05:03');
    });
  });

  describe('combinarFechaHora', () => {
    it('debe combinar fecha y hora correctamente', () => {
      const fechaBase = new Date(2025, 10, 15, 0, 0, 0);
      const resultado = combinarFechaHora(fechaBase, '14:30');

      expect(resultado.getFullYear()).toBe(2025);
      expect(resultado.getMonth()).toBe(10);
      expect(resultado.getDate()).toBe(15);
      expect(resultado.getHours()).toBe(14);
      expect(resultado.getMinutes()).toBe(30);
      expect(resultado.getSeconds()).toBe(0);
    });

    it('debe manejar formato de 24 horas', () => {
      const fechaBase = new Date(2025, 10, 15);
      const resultado = combinarFechaHora(fechaBase, '23:45');

      expect(resultado.getHours()).toBe(23);
      expect(resultado.getMinutes()).toBe(45);
    });

    it('debe resetear segundos a 0', () => {
      const fechaBase = new Date(2025, 10, 15, 10, 20, 30);
      const resultado = combinarFechaHora(fechaBase, '14:30');

      expect(resultado.getSeconds()).toBe(0);
      expect(resultado.getMilliseconds()).toBe(0);
    });

    it('debe mantener la fecha original', () => {
      const fechaBase = new Date(2025, 10, 15);
      const resultado = combinarFechaHora(fechaBase, '09:00');

      expect(resultado.getDate()).toBe(fechaBase.getDate());
      expect(resultado.getMonth()).toBe(fechaBase.getMonth());
      expect(resultado.getFullYear()).toBe(fechaBase.getFullYear());
    });
  });

  describe('Edge Cases', () => {
    it('debe manejar cambio de horario de verano', () => {
      // Este test puede variar según la timezone local
      const fechaVerano = new Date(2025, 5, 15); // Junio
      const fechaInvierno = new Date(2025, 11, 15); // Diciembre

      const resultadoVerano = formatearParaAPI(fechaVerano);
      const resultadoInvierno = formatearParaAPI(fechaInvierno);

      expect(resultadoVerano).toBe('2025-06-15');
      expect(resultadoInvierno).toBe('2025-12-15');
    });

    it('debe manejar fechas muy antiguas', () => {
      const fechaAntigua = new Date(1900, 0, 1);
      const resultado = formatearFechaCorta(fechaAntigua);
      expect(resultado).toContain('1900');
    });

    it('debe manejar fechas futuras lejanas', () => {
      const fechaFutura = new Date(2100, 11, 31);
      const resultado = formatearFechaCorta(fechaFutura);
      expect(resultado).toContain('2100');
    });
  });
});
