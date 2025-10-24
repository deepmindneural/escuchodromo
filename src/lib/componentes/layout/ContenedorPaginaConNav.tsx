'use client';

import { ReactNode } from 'react';
import Navegacion from './Navegacion';

interface PropiedadesContenedorPaginaConNav {
  children: ReactNode;
  /** Clase CSS adicional para el contenedor principal */
  className?: string;
  /** Si es true, no agrega el padding-top automático (útil si el contenido maneja su propio espaciado) */
  sinPaddingTop?: boolean;
  /** Incluir el componente de navegación (por defecto: true) */
  incluirNavegacion?: boolean;
}

/**
 * Contenedor estandarizado para páginas con navegación fija.
 *
 * Este componente garantiza que todas las páginas respeten correctamente
 * la altura del header fijo, evitando el problema de espacios en blanco.
 *
 * @example
 * ```tsx
 * <ContenedorPaginaConNav>
 *   <header className="bg-white shadow">
 *     // Contenido del header
 *   </header>
 *   <main>
 *     // Contenido principal
 *   </main>
 * </ContenedorPaginaConNav>
 * ```
 *
 * @accessibility
 * - Utiliza padding-top de 96px (24 * 4px = 6rem) para compensar el header fijo
 * - El header tiene una altura aproximada de 80-88px + sombra
 * - Compatible con lectores de pantalla
 * - Respeta la jerarquía semántica de la página
 */
export default function ContenedorPaginaConNav({
  children,
  className = '',
  sinPaddingTop = false,
  incluirNavegacion = true,
}: PropiedadesContenedorPaginaConNav) {
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {incluirNavegacion && <Navegacion />}

      {/*
        Contenedor principal con padding-top para compensar navegación fija.
        pt-24 = 96px garantiza espacio suficiente para el header de 80-88px + margen
      */}
      <div className={sinPaddingTop ? '' : 'pt-24'}>
        {children}
      </div>
    </div>
  );
}
