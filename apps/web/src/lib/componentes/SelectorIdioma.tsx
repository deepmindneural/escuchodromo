'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Globe } from 'lucide-react';

const idiomas = [
  { codigo: 'es', nombre: 'Español', bandera: '🇪🇸' },
  { codigo: 'en', nombre: 'English', bandera: '🇺🇸' },
];

export function SelectorIdioma() {
  const pathname = usePathname();
  const router = useRouter();
  
  // Extraer el idioma actual del pathname
  const segments = pathname.split('/');
  const idiomaActual = idiomas.find(i => i.codigo === segments[1])?.codigo || 'es';

  const cambiarIdioma = (nuevoIdioma: string) => {
    const segments = pathname.split('/');
    
    // Si el primer segmento es un idioma, reemplazarlo
    if (idiomas.some(i => i.codigo === segments[1])) {
      segments[1] = nuevoIdioma;
    } else {
      // Si no hay idioma en la URL, agregarlo
      segments.splice(1, 0, nuevoIdioma);
    }
    
    const nuevaRuta = segments.filter(Boolean).join('/');
    router.push(`/${nuevaRuta}`);
  };

  return (
    <Select value={idiomaActual} onValueChange={cambiarIdioma}>
      <SelectTrigger className="w-[140px]">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {idiomas.map((idioma) => (
          <SelectItem key={idioma.codigo} value={idioma.codigo}>
            <span className="mr-2">{idioma.bandera}</span>
            {idioma.nombre}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}