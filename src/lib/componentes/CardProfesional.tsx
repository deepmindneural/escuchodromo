'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Star, Video, Building2, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import type { DatosProfesional } from '@/lib/types/profesional';
import { formatearPrecioCOP, obtenerIniciales } from '@/lib/types/profesional';

// Re-exportar el tipo para retrocompatibilidad
export type { DatosProfesional };

interface CardProfesionalProps {
  profesional: DatosProfesional;
  onClick?: () => void;
  mostrarBotonReservar?: boolean;
}

/**
 * Componente: CardProfesional
 *
 * Tarjeta reutilizable para mostrar información de un profesional
 * en el listado de búsqueda.
 *
 * Características:
 * - Responsive (mobile-first)
 * - Hover effects (scale + shadow)
 * - Rating con estrellas
 * - Badges de modalidades
 * - Formato de precio en COP
 * - Accesible (ARIA labels, keyboard navigation)
 * - Skeleton loading integrado
 */
export function CardProfesional({
  profesional,
  onClick,
  mostrarBotonReservar = true,
}: CardProfesionalProps) {
  const router = useRouter();

  const nombreCompleto = profesional.nombre_completo || `${profesional.nombre} ${profesional.apellido}`;
  const iniciales = obtenerIniciales(profesional.nombre, profesional.apellido);
  const precioFormateado = formatearPrecioCOP(profesional.tarifa_por_sesion);

  const handleVerPerfil = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else {
      router.push(`/profesionales/${profesional.id}`);
    }
  };

  const handleReservar = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/profesionales/${profesional.id}/reservar`);
  };

  // Renderizar estrellas de calificación
  const renderEstrellas = () => {
    const estrellas = [];
    const rating = Math.round(profesional.calificacion_promedio * 2) / 2; // Redondear a 0.5

    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        // Estrella completa
        estrellas.push(
          <Star
            key={i}
            className="w-4 h-4 fill-yellow-400 text-yellow-400"
            aria-hidden="true"
          />
        );
      } else if (i - 0.5 === rating) {
        // Media estrella
        estrellas.push(
          <Star
            key={i}
            className="w-4 h-4 fill-yellow-400 text-yellow-400 opacity-50"
            aria-hidden="true"
          />
        );
      } else {
        // Estrella vacía
        estrellas.push(
          <Star
            key={i}
            className="w-4 h-4 text-gray-300"
            aria-hidden="true"
          />
        );
      }
    }

    return estrellas;
  };

  return (
    <article
      className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer focus-within:ring-2 focus-within:ring-calma-500 focus-within:ring-offset-2"
      onClick={handleVerPerfil}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleVerPerfil(e as any);
        }
      }}
      aria-label={`Ver perfil de ${nombreCompleto}, ${profesional.titulo_profesional}`}
    >
      {/* Imagen de perfil */}
      <div className="relative aspect-square bg-gradient-to-br from-calma-100 to-esperanza-100 overflow-hidden">
        {profesional.foto_perfil ? (
          <img
            src={profesional.foto_perfil}
            alt={`Foto de perfil de ${nombreCompleto}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-calma-200 flex items-center justify-center text-calma-700 font-bold text-4xl">
              {iniciales}
            </div>
          </div>
        )}

        {/* Badge de verificado */}
        <div
          className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md"
          aria-label="Profesional verificado"
        >
          <CheckCircle2 className="w-5 h-5 text-esperanza-600" aria-hidden="true" />
        </div>

        {/* Badge de disponibilidad */}
        {profesional.disponible && (
          <div className="absolute bottom-3 left-3 px-3 py-1 bg-esperanza-500 text-white text-xs font-semibold rounded-full shadow-md">
            Disponible
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-5">
        {/* Nombre y título */}
        <div className="mb-3">
          <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-1">
            {nombreCompleto}
          </h3>
          <p className="text-calma-600 font-medium text-sm line-clamp-1">
            {profesional.titulo_profesional}
          </p>
        </div>

        {/* Rating */}
        {profesional.calificacion_promedio > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1" aria-label={`Calificación: ${profesional.calificacion_promedio} de 5 estrellas`}>
              {renderEstrellas()}
            </div>
            <span className="text-sm text-gray-600">
              {profesional.calificacion_promedio.toFixed(1)}
            </span>
            {profesional.total_reviews > 0 && (
              <span className="text-sm text-gray-500">
                ({profesional.total_reviews} {profesional.total_reviews === 1 ? 'reseña' : 'reseñas'})
              </span>
            )}
          </div>
        )}

        {/* Especialidades */}
        <div className="flex flex-wrap gap-2 mb-3">
          {profesional.especialidades.slice(0, 3).map((especialidad, index) => (
            <span
              key={index}
              className="px-2.5 py-1 bg-calma-100 text-calma-700 rounded-full text-xs font-medium"
            >
              {especialidad}
            </span>
          ))}
          {profesional.especialidades.length > 3 && (
            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
              +{profesional.especialidades.length - 3}
            </span>
          )}
        </div>

        {/* Modalidades */}
        <div className="flex items-center gap-3 mb-4 text-sm text-gray-600">
          {profesional.modalidades.includes('virtual') && (
            <div className="flex items-center gap-1.5">
              <Video className="w-4 h-4 text-esperanza-600" aria-hidden="true" />
              <span>Virtual</span>
            </div>
          )}
          {profesional.modalidades.includes('presencial') && (
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-calma-600" aria-hidden="true" />
              <span>Presencial</span>
            </div>
          )}
        </div>

        {/* Experiencia */}
        {profesional.experiencia_anos && profesional.experiencia_anos > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Clock className="w-4 h-4" aria-hidden="true" />
            <span>{profesional.experiencia_anos} años de experiencia</span>
          </div>
        )}

        {/* Precio */}
        <div className="border-t border-gray-200 pt-4 mb-4">
          <p className="text-sm text-gray-600 mb-1">Desde</p>
          <p className="text-2xl font-bold text-calma-700">{precioFormateado}</p>
          <p className="text-xs text-gray-500">por sesión</p>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2">
          <button
            onClick={handleVerPerfil}
            className="flex-1 px-4 py-2.5 bg-white text-calma-600 border-2 border-calma-600 rounded-lg hover:bg-calma-50 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-calma-500 focus:ring-offset-2"
            aria-label={`Ver perfil completo de ${nombreCompleto}`}
          >
            Ver perfil
          </button>
          {mostrarBotonReservar && (
            <button
              onClick={handleReservar}
              className="flex-1 px-4 py-2.5 bg-calma-600 text-white rounded-lg hover:bg-calma-700 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-calma-500 focus:ring-offset-2"
              aria-label={`Reservar cita con ${nombreCompleto}`}
            >
              Reservar
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * Componente: CardProfesionalSkeleton
 *
 * Skeleton loader para el CardProfesional mientras se cargan los datos
 */
export function CardProfesionalSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
      {/* Imagen skeleton */}
      <div className="aspect-square bg-gray-200" />

      {/* Contenido skeleton */}
      <div className="p-5">
        {/* Nombre y título */}
        <div className="mb-3">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="h-4 bg-gray-200 rounded w-24" />
        </div>

        {/* Especialidades */}
        <div className="flex gap-2 mb-3">
          <div className="h-6 bg-gray-200 rounded-full w-20" />
          <div className="h-6 bg-gray-200 rounded-full w-24" />
        </div>

        {/* Modalidades */}
        <div className="flex gap-3 mb-4">
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-4 bg-gray-200 rounded w-20" />
        </div>

        {/* Precio */}
        <div className="border-t border-gray-200 pt-4 mb-4">
          <div className="h-8 bg-gray-200 rounded w-32 mb-1" />
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>

        {/* Botones */}
        <div className="flex gap-2">
          <div className="flex-1 h-10 bg-gray-200 rounded-lg" />
          <div className="flex-1 h-10 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default CardProfesional;
