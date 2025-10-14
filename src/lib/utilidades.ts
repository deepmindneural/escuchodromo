import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utilidad para combinar clases de CSS con Tailwind
 * Combina clsx y tailwind-merge para resolver conflictos de clases
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
