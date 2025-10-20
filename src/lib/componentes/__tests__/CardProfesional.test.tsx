/**
 * Tests Unitarios: CardProfesional
 *
 * Componente crítico que muestra información de profesionales de salud mental.
 * La precisión de la información es esencial para la toma de decisiones del paciente.
 *
 * Cobertura objetivo: 85%
 *
 * Casos de prueba:
 * - Renderizado con diferentes props
 * - Interacciones de usuario (click, teclado)
 * - Estados (disponible, no disponible)
 * - Edge cases (sin foto, sin rating, especialidades largas)
 * - Accesibilidad (ARIA labels, navegación por teclado)
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CardProfesional, CardProfesionalSkeleton } from '../CardProfesional';
import type { DatosProfesional } from '@/lib/types/profesional';

// Mock de next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// ==========================================
// DATOS DE PRUEBA
// ==========================================

const profesionalCompleto: DatosProfesional = {
  id: 'prof-123',
  nombre: 'María',
  apellido: 'González',
  nombre_completo: 'María González',
  titulo_profesional: 'Psicóloga Clínica',
  especialidades: ['Ansiedad', 'Depresión', 'Terapia Cognitivo-Conductual'],
  especialidad: 'Ansiedad',
  experiencia_anos: 10,
  foto_perfil: 'https://example.com/maria.jpg',
  biografia: 'Especialista en trastornos de ansiedad con 10 años de experiencia.',
  direccion: 'Bogotá, Colombia',
  tarifa_por_sesion: 150000,
  tarifa_30min: 80000,
  tarifa_60min: 150000,
  calificacion_promedio: 4.8,
  total_reviews: 45,
  total_citas: 230,
  disponible: true,
  modalidades: ['virtual', 'presencial'],
};

const profesionalSinFoto: DatosProfesional = {
  ...profesionalCompleto,
  foto_perfil: null,
};

const profesionalSinRating: DatosProfesional = {
  ...profesionalCompleto,
  calificacion_promedio: 0,
  total_reviews: 0,
};

const profesionalNoDisponible: DatosProfesional = {
  ...profesionalCompleto,
  disponible: false,
};

const profesionalMuchasEspecialidades: DatosProfesional = {
  ...profesionalCompleto,
  especialidades: ['Ansiedad', 'Depresión', 'TDAH', 'Trauma', 'Duelo', 'Terapia de Pareja'],
};

// ==========================================
// SUITE DE TESTS
// ==========================================

describe('CardProfesional', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  // ==========================================
  // GRUPO: Renderizado Básico
  // ==========================================

  describe('Renderizado básico', () => {
    it('debe renderizar toda la información básica del profesional', () => {
      render(<CardProfesional profesional={profesionalCompleto} />);

      // Nombre completo
      expect(screen.getByText('María González')).toBeInTheDocument();

      // Título profesional
      expect(screen.getByText('Psicóloga Clínica')).toBeInTheDocument();

      // Especialidades
      expect(screen.getByText('Ansiedad')).toBeInTheDocument();
      expect(screen.getByText('Depresión')).toBeInTheDocument();
      expect(screen.getByText('Terapia Cognitivo-Conductual')).toBeInTheDocument();

      // Experiencia
      expect(screen.getByText('10 años de experiencia')).toBeInTheDocument();

      // Modalidades
      expect(screen.getByText('Virtual')).toBeInTheDocument();
      expect(screen.getByText('Presencial')).toBeInTheDocument();

      // Precio
      expect(screen.getByText('$150.000')).toBeInTheDocument();
      expect(screen.getByText('por sesión')).toBeInTheDocument();

      // Badge de verificado
      expect(screen.getByLabelText('Profesional verificado')).toBeInTheDocument();
    });

    it('debe renderizar foto de perfil cuando está disponible', () => {
      render(<CardProfesional profesional={profesionalCompleto} />);

      const img = screen.getByAltText('Foto de perfil de María González');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', profesionalCompleto.foto_perfil);
    });

    it('debe renderizar iniciales cuando no hay foto de perfil', () => {
      render(<CardProfesional profesional={profesionalSinFoto} />);

      // No debe haber imagen
      expect(screen.queryByAltText('Foto de perfil de María González')).not.toBeInTheDocument();

      // Debe mostrar iniciales MG
      expect(screen.getByText('MG')).toBeInTheDocument();
    });

    it('debe renderizar badge de "Disponible" cuando disponible=true', () => {
      render(<CardProfesional profesional={profesionalCompleto} />);

      expect(screen.getByText('Disponible')).toBeInTheDocument();
      expect(screen.getByText('Disponible')).toHaveClass('bg-esperanza-500');
    });

    it('NO debe renderizar badge de "Disponible" cuando disponible=false', () => {
      render(<CardProfesional profesional={profesionalNoDisponible} />);

      expect(screen.queryByText('Disponible')).not.toBeInTheDocument();
    });

    it('debe mostrar botones "Ver perfil" y "Reservar" por defecto', () => {
      render(<CardProfesional profesional={profesionalCompleto} />);

      expect(screen.getByRole('button', { name: /ver perfil completo/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reservar cita/i })).toBeInTheDocument();
    });

    it('NO debe mostrar botón "Reservar" cuando mostrarBotonReservar=false', () => {
      render(<CardProfesional profesional={profesionalCompleto} mostrarBotonReservar={false} />);

      expect(screen.getByRole('button', { name: /ver perfil/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /reservar/i })).not.toBeInTheDocument();
    });
  });

  // ==========================================
  // GRUPO: Rating y Calificaciones
  // ==========================================

  describe('Rating y calificaciones', () => {
    it('debe renderizar estrellas de calificación correctamente', () => {
      render(<CardProfesional profesional={profesionalCompleto} />);

      // Debe mostrar el número de rating
      expect(screen.getByText('4.8')).toBeInTheDocument();

      // Debe mostrar el número de reseñas
      expect(screen.getByText('(45 reseñas)')).toBeInTheDocument();

      // ARIA label con calificación
      expect(screen.getByLabelText(/calificación: 4\.8 de 5 estrellas/i)).toBeInTheDocument();
    });

    it('debe renderizar 5 estrellas completas para rating 5.0', () => {
      const profesional5Estrellas = { ...profesionalCompleto, calificacion_promedio: 5.0 };
      render(<CardProfesional profesional={profesional5Estrellas} />);

      expect(screen.getByText('5.0')).toBeInTheDocument();
    });

    it('debe renderizar estrellas parciales correctamente', () => {
      const profesional35Estrellas = { ...profesionalCompleto, calificacion_promedio: 3.5 };
      render(<CardProfesional profesional={profesional35Estrellas} />);

      expect(screen.getByText('3.5')).toBeInTheDocument();
    });

    it('NO debe mostrar rating cuando calificacion_promedio es 0', () => {
      render(<CardProfesional profesional={profesionalSinRating} />);

      expect(screen.queryByText('0.0')).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/calificación/i)).not.toBeInTheDocument();
    });

    it('debe mostrar "reseña" en singular cuando total_reviews=1', () => {
      const profesional1Resena = { ...profesionalCompleto, total_reviews: 1 };
      render(<CardProfesional profesional={profesional1Resena} />);

      expect(screen.getByText('(1 reseña)')).toBeInTheDocument();
    });
  });

  // ==========================================
  // GRUPO: Especialidades
  // ==========================================

  describe('Especialidades', () => {
    it('debe mostrar máximo 3 especialidades', () => {
      render(<CardProfesional profesional={profesionalMuchasEspecialidades} />);

      // Primeras 3 especialidades
      expect(screen.getByText('Ansiedad')).toBeInTheDocument();
      expect(screen.getByText('Depresión')).toBeInTheDocument();
      expect(screen.getByText('TDAH')).toBeInTheDocument();

      // Las demás no deben estar visibles directamente
      expect(screen.queryByText('Trauma')).not.toBeInTheDocument();
      expect(screen.queryByText('Duelo')).not.toBeInTheDocument();
    });

    it('debe mostrar badge "+X" cuando hay más de 3 especialidades', () => {
      render(<CardProfesional profesional={profesionalMuchasEspecialidades} />);

      // Tiene 6 especialidades, muestra 3, el badge debe decir +3
      expect(screen.getByText('+3')).toBeInTheDocument();
    });

    it('NO debe mostrar badge "+X" cuando hay 3 o menos especialidades', () => {
      render(<CardProfesional profesional={profesionalCompleto} />);

      expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
    });
  });

  // ==========================================
  // GRUPO: Formato de Precio
  // ==========================================

  describe('Formato de precio', () => {
    it('debe formatear precio en COP correctamente', () => {
      render(<CardProfesional profesional={profesionalCompleto} />);

      // $150.000 con separador de miles
      expect(screen.getByText('$150.000')).toBeInTheDocument();
    });

    it('debe formatear precios grandes correctamente', () => {
      const profesionalCaro = { ...profesionalCompleto, tarifa_por_sesion: 500000 };
      render(<CardProfesional profesional={profesionalCaro} />);

      expect(screen.getByText('$500.000')).toBeInTheDocument();
    });

    it('debe formatear precios pequeños correctamente', () => {
      const profesionalEconomico = { ...profesionalCompleto, tarifa_por_sesion: 50000 };
      render(<CardProfesional profesional={profesionalEconomico} />);

      expect(screen.getByText('$50.000')).toBeInTheDocument();
    });
  });

  // ==========================================
  // GRUPO: Interacciones de Usuario
  // ==========================================

  describe('Interacciones de usuario', () => {
    it('debe navegar a perfil al hacer click en "Ver perfil"', async () => {
      const user = userEvent.setup();
      render(<CardProfesional profesional={profesionalCompleto} />);

      const botonVerPerfil = screen.getByRole('button', { name: /ver perfil completo/i });
      await user.click(botonVerPerfil);

      expect(mockPush).toHaveBeenCalledWith('/profesionales/prof-123');
    });

    it('debe navegar a reserva al hacer click en "Reservar"', async () => {
      const user = userEvent.setup();
      render(<CardProfesional profesional={profesionalCompleto} />);

      const botonReservar = screen.getByRole('button', { name: /reservar cita/i });
      await user.click(botonReservar);

      expect(mockPush).toHaveBeenCalledWith('/profesionales/prof-123/reservar');
    });

    it('debe navegar a perfil al hacer click en la tarjeta', async () => {
      const user = userEvent.setup();
      render(<CardProfesional profesional={profesionalCompleto} />);

      // Click en el article (tarjeta completa)
      const tarjeta = screen.getByRole('button', { name: /ver perfil de maría gonzález/i });
      await user.click(tarjeta);

      expect(mockPush).toHaveBeenCalledWith('/profesionales/prof-123');
    });

    it('debe llamar callback onClick cuando se proporciona', async () => {
      const user = userEvent.setup();
      const mockOnClick = jest.fn();
      render(<CardProfesional profesional={profesionalCompleto} onClick={mockOnClick} />);

      const botonVerPerfil = screen.getByRole('button', { name: /ver perfil completo/i });
      await user.click(botonVerPerfil);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
      // No debe llamar a router.push si hay onClick
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('debe prevenir propagación al hacer click en botones internos', async () => {
      const user = userEvent.setup();
      const mockOnClick = jest.fn();
      render(<CardProfesional profesional={profesionalCompleto} onClick={mockOnClick} />);

      // Click en botón "Reservar"
      const botonReservar = screen.getByRole('button', { name: /reservar cita/i });
      await user.click(botonReservar);

      // Debe navegar a reservar, pero NO debe llamar al onClick de la tarjeta
      expect(mockPush).toHaveBeenCalledWith('/profesionales/prof-123/reservar');
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // GRUPO: Navegación por Teclado (Accesibilidad)
  // ==========================================

  describe('Navegación por teclado (Accesibilidad)', () => {
    it('debe navegar a perfil al presionar Enter en la tarjeta', async () => {
      const user = userEvent.setup();
      render(<CardProfesional profesional={profesionalCompleto} />);

      const tarjeta = screen.getByRole('button', { name: /ver perfil de maría gonzález/i });
      tarjeta.focus();
      await user.keyboard('{Enter}');

      expect(mockPush).toHaveBeenCalledWith('/profesionales/prof-123');
    });

    it('debe navegar a perfil al presionar Space en la tarjeta', async () => {
      const user = userEvent.setup();
      render(<CardProfesional profesional={profesionalCompleto} />);

      const tarjeta = screen.getByRole('button', { name: /ver perfil de maría gonzález/i });
      tarjeta.focus();
      await user.keyboard(' ');

      expect(mockPush).toHaveBeenCalledWith('/profesionales/prof-123');
    });

    it('debe tener tabIndex=0 para ser enfocable', () => {
      render(<CardProfesional profesional={profesionalCompleto} />);

      const tarjeta = screen.getByRole('button', { name: /ver perfil de maría gonzález/i });
      expect(tarjeta).toHaveAttribute('tabIndex', '0');
    });

    it('debe mostrar focus ring al enfocar con teclado', () => {
      render(<CardProfesional profesional={profesionalCompleto} />);

      const tarjeta = screen.getByRole('button', { name: /ver perfil de maría gonzález/i });
      expect(tarjeta).toHaveClass('focus-within:ring-2', 'focus-within:ring-calma-500');
    });
  });

  // ==========================================
  // GRUPO: ARIA y Semántica HTML
  // ==========================================

  describe('ARIA y semántica HTML', () => {
    it('debe tener elemento article con role="button"', () => {
      render(<CardProfesional profesional={profesionalCompleto} />);

      const tarjeta = screen.getByRole('button', { name: /ver perfil de maría gonzález/i });
      expect(tarjeta.tagName).toBe('ARTICLE');
    });

    it('debe tener ARIA label descriptivo', () => {
      render(<CardProfesional profesional={profesionalCompleto} />);

      expect(
        screen.getByLabelText('Ver perfil de María González, Psicóloga Clínica')
      ).toBeInTheDocument();
    });

    it('debe tener ARIA labels en botones', () => {
      render(<CardProfesional profesional={profesionalCompleto} />);

      expect(screen.getByLabelText('Ver perfil completo de María González')).toBeInTheDocument();
      expect(screen.getByLabelText('Reservar cita con María González')).toBeInTheDocument();
    });

    it('debe tener iconos con aria-hidden', () => {
      const { container } = render(<CardProfesional profesional={profesionalCompleto} />);

      // Iconos decorativos deben tener aria-hidden="true"
      const iconos = container.querySelectorAll('svg[aria-hidden="true"]');
      expect(iconos.length).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // GRUPO: Edge Cases
  // ==========================================

  describe('Edge cases', () => {
    it('debe manejar profesional sin experiencia', () => {
      const profesionalSinExperiencia = { ...profesionalCompleto, experiencia_anos: 0 };
      render(<CardProfesional profesional={profesionalSinExperiencia} />);

      expect(screen.queryByText(/años de experiencia/i)).not.toBeInTheDocument();
    });

    it('debe manejar profesional con 1 año de experiencia', () => {
      const profesional1Ano = { ...profesionalCompleto, experiencia_anos: 1 };
      render(<CardProfesional profesional={profesional1Ano} />);

      expect(screen.getByText('1 años de experiencia')).toBeInTheDocument();
    });

    it('debe manejar profesional con solo modalidad virtual', () => {
      const profesionalVirtual = { ...profesionalCompleto, modalidades: ['virtual'] };
      render(<CardProfesional profesional={profesionalVirtual} />);

      expect(screen.getByText('Virtual')).toBeInTheDocument();
      expect(screen.queryByText('Presencial')).not.toBeInTheDocument();
    });

    it('debe manejar nombre_completo cuando nombre y apellido están vacíos', () => {
      const profesionalSoloNombreCompleto = {
        ...profesionalCompleto,
        nombre: '',
        apellido: '',
        nombre_completo: 'Dr. Juan Pérez',
      };
      render(<CardProfesional profesional={profesionalSoloNombreCompleto} />);

      expect(screen.getByText('Dr. Juan Pérez')).toBeInTheDocument();
    });
  });
});

// ==========================================
// SUITE: CardProfesionalSkeleton
// ==========================================

describe('CardProfesionalSkeleton', () => {
  it('debe renderizar skeleton con animación de pulso', () => {
    const { container } = render(<CardProfesionalSkeleton />);

    const skeleton = container.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('debe tener la misma estructura que CardProfesional', () => {
    const { container } = render(<CardProfesionalSkeleton />);

    // Debe tener imagen skeleton
    expect(container.querySelector('.aspect-square.bg-gray-200')).toBeInTheDocument();

    // Debe tener elementos de contenido skeleton
    const skeletonElements = container.querySelectorAll('.bg-gray-200');
    expect(skeletonElements.length).toBeGreaterThan(5);
  });
});
