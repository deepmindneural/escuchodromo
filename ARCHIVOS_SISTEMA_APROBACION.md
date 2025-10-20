# Listado de Archivos del Sistema de Aprobación de Profesionales

## Páginas Admin

### `/src/app/admin/profesionales/page.tsx`
**Ruta**: `http://localhost:3000/admin/profesionales`

**Descripción**: Lista principal de profesionales con filtros y búsqueda

**Código completo**: ✅ Creado
- 450+ líneas de código TypeScript
- Componentes: Tabla, filtros, búsqueda, estadísticas
- Funciones: Cargar profesionales, aprobar rápido, rechazar

**Imports principales**:
```typescript
import { obtenerClienteNavegador } from '../../../lib/supabase/cliente';
import { Button } from '../../../lib/componentes/ui/button';
import { Search, CheckCircle, XCircle, Clock, Eye, FileCheck, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
```

**Interfaces**:
```typescript
interface Profesional {
  id: string;
  titulo_profesional: string;
  numero_licencia: string;
  universidad: string;
  anos_experiencia: number;
  perfil_aprobado: boolean;
  documentos_verificados: boolean;
  creado_en: string;
  usuario: { id, nombre, email, rol };
  documentos: Array<{ id, tipo, verificado }>;
}
```

---

### `/src/app/admin/profesionales/[id]/page.tsx`
**Ruta**: `http://localhost:3000/admin/profesionales/[id]`

**Descripción**: Vista detallada de un profesional específico con tabs

**Código completo**: ✅ Creado
- 650+ líneas de código TypeScript
- Componentes: Tabs (Radix UI), ModalAprobar, VisorDocumento
- Funciones: Verificar documento, guardar notas, aprobar/rechazar

**Imports principales**:
```typescript
import * as Tabs from '@radix-ui/react-tabs';
import ModalAprobar from '../../../../lib/componentes/admin/ModalAprobar';
import VisorDocumento from '../../../../lib/componentes/admin/VisorDocumento';
```

**Interfaces**:
```typescript
interface Profesional {
  id: string;
  usuario_id: string;
  titulo_profesional: string;
  numero_licencia: string;
  universidad: string;
  anos_experiencia: number;
  especialidades: string[];
  biografia: string;
  idiomas: string[];
  documentos_verificados: boolean;
  perfil_aprobado: boolean;
  aprobado_por: string | null;
  aprobado_en: string | null;
  notas_admin: string;
  tarifa_por_sesion: number;
  moneda: string;
  creado_en: string;
  usuario: { id, nombre, email, rol, telefono };
}

interface Documento {
  id: string;
  tipo: string;
  nombre: string;
  descripcion: string;
  url_archivo: string;
  nombre_archivo: string;
  verificado: boolean;
  verificado_por: string | null;
  verificado_en: string | null;
  notas_verificacion: string;
  creado_en: string;
}

interface Horario {
  id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  duracion_sesion: number;
  activo: boolean;
}
```

---

## Componentes Admin

### `/src/lib/componentes/admin/ModalAprobar.tsx`
**Descripción**: Modal de confirmación para aprobar profesionales

**Código completo**: ✅ Creado
- 150+ líneas de código TypeScript
- Radix UI Dialog para accesibilidad
- Gestión de estado local

**Props**:
```typescript
interface ModalAprobarProps {
  abierto: boolean;
  onCerrar: () => void;
  onAprobar: (notas: string, enviarEmail: boolean) => void;
  nombreProfesional: string;
}
```

**Features**:
- Campo de notas de aprobación
- Checkbox para enviar email
- Advertencia sobre acciones que se ejecutarán
- Estado de carga durante procesamiento
- Reseteo de formulario al cerrar

---

### `/src/lib/componentes/admin/VisorDocumento.tsx`
**Descripción**: Componente para visualizar y verificar documentos

**Código completo**: ✅ Creado
- 200+ líneas de código TypeScript
- Soporte para PDF e imágenes
- Vista previa en línea

**Props**:
```typescript
interface VisorDocumentoProps {
  documento: Documento;
  onVerificar: (verificado: boolean) => void;
}
```

**Features**:
- Preview de PDFs con iframe
- Preview de imágenes con img
- Descarga de archivos
- Verificación/Desverificación
- Información de fechas y verificadores
- Fallback para tipos no soportados

---

### `/src/lib/componentes/admin/index.ts`
**Descripción**: Barrel export para componentes admin

**Código**:
```typescript
export { default as ModalAprobar } from './ModalAprobar';
export { default as VisorDocumento } from './VisorDocumento';
```

---

## Layout Admin (Modificado)

### `/src/app/admin/layout.tsx`
**Modificaciones**:
1. Import de `UserCheck` de lucide-react
2. Nuevo item en `menuItems`:
```typescript
{ icon: UserCheck, label: 'Profesionales', href: '/admin/profesionales' }
```

**Resultado**: Sidebar ahora muestra el link "Profesionales"

---

## Documentación

### `SISTEMA_APROBACION_PROFESIONALES.md`
**Contenido**:
- Resumen del sistema
- Archivos creados
- Funcionalidades implementadas
- Estructura de base de datos
- Flujo de datos
- Seguridad
- Mejoras futuras
- Guía de uso
- Componentes UI utilizados
- Testing
- Troubleshooting

**Tamaño**: ~13 KB

---

### `RESUMEN_IMPLEMENTACION.md`
**Contenido**:
- Archivos creados y modificados
- Funcionalidades implementadas
- Estructura de base de datos
- Flujo de aprobación
- Testing recomendado
- Próximos pasos
- Dependencias utilizadas
- Estado del proyecto

**Tamaño**: ~5 KB

---

### `ARCHIVOS_SISTEMA_APROBACION.md`
**Contenido**: Este archivo con el listado completo

---

## Estructura de Directorios

```
escuchodromo/
├── src/
│   ├── app/
│   │   └── admin/
│   │       ├── layout.tsx (modificado)
│   │       └── profesionales/
│   │           ├── page.tsx (nuevo)
│   │           └── [id]/
│   │               └── page.tsx (nuevo)
│   └── lib/
│       └── componentes/
│           └── admin/ (nuevo directorio)
│               ├── index.ts
│               ├── ModalAprobar.tsx
│               └── VisorDocumento.tsx
├── SISTEMA_APROBACION_PROFESIONALES.md (nuevo)
├── RESUMEN_IMPLEMENTACION.md (nuevo)
└── ARCHIVOS_SISTEMA_APROBACION.md (nuevo)
```

---

## Queries de Supabase Utilizadas

### Cargar lista de profesionales
```typescript
const { data } = await supabase
  .from('PerfilProfesional')
  .select(`
    id,
    titulo_profesional,
    numero_licencia,
    universidad,
    anos_experiencia,
    perfil_aprobado,
    documentos_verificados,
    creado_en,
    usuario:Usuario!usuario_id(id, nombre, email, rol),
    documentos:DocumentoProfesional(id, tipo, verificado)
  `)
  .order('creado_en', { ascending: false });
```

### Cargar detalle de profesional
```typescript
const { data } = await supabase
  .from('PerfilProfesional')
  .select(`
    *,
    usuario:Usuario!usuario_id(id, nombre, email, rol, telefono)
  `)
  .eq('id', profesionalId)
  .single();
```

### Cargar documentos
```typescript
const { data } = await supabase
  .from('DocumentoProfesional')
  .select('*')
  .eq('perfil_profesional_id', profesionalId)
  .order('creado_en', { ascending: false });
```

### Cargar horarios
```typescript
const { data } = await supabase
  .from('HorarioProfesional')
  .select('*')
  .eq('perfil_profesional_id', profesionalId)
  .order('dia_semana', { ascending: true });
```

### Aprobar profesional
```typescript
// 1. Actualizar perfil
await supabase
  .from('PerfilProfesional')
  .update({
    perfil_aprobado: true,
    documentos_verificados: true,
    aprobado_por: adminId,
    aprobado_en: new Date().toISOString(),
    notas_admin: notasAprobacion
  })
  .eq('id', profesionalId);

// 2. Cambiar rol
await supabase
  .from('Usuario')
  .update({ rol: 'TERAPEUTA' })
  .eq('id', usuarioId);

// 3. Verificar documentos
await supabase
  .from('DocumentoProfesional')
  .update({
    verificado: true,
    verificado_por: adminId,
    verificado_en: new Date().toISOString()
  })
  .eq('perfil_profesional_id', profesionalId);
```

### Verificar documento individual
```typescript
await supabase
  .from('DocumentoProfesional')
  .update({
    verificado: true,
    verificado_por: adminId,
    verificado_en: new Date().toISOString()
  })
  .eq('id', documentoId);
```

---

## Dependencias Requeridas

Todas estas dependencias YA ESTÁN instaladas en el proyecto:

```json
{
  "@radix-ui/react-dialog": "^1.1.14",
  "@radix-ui/react-tabs": "^1.1.12",
  "lucide-react": "^0.532.0",
  "react-hot-toast": "^2.5.2",
  "@supabase/supabase-js": "^2.75.0",
  "next": "~15.2.4",
  "react": "19.0.0"
}
```

No se requiere instalar nada nuevo.

---

## Rutas de Acceso

### Para Admins
- Lista: `http://localhost:3000/admin/profesionales`
- Detalle: `http://localhost:3000/admin/profesionales/[uuid]`

### Requisitos
- Sesión activa
- Usuario con `rol = 'ADMIN'`
- Si no cumple requisitos, redirige a `/iniciar-sesion` o `/dashboard`

---

## Líneas de Código Totales

| Archivo | Líneas | Tipo |
|---------|--------|------|
| `page.tsx` (lista) | ~450 | TypeScript + JSX |
| `page.tsx` (detalle) | ~650 | TypeScript + JSX |
| `ModalAprobar.tsx` | ~150 | TypeScript + JSX |
| `VisorDocumento.tsx` | ~200 | TypeScript + JSX |
| `index.ts` | ~5 | TypeScript |
| **TOTAL** | **~1455** | **Código funcional** |

---

## Estado de Implementación

| Componente | Estado | Notas |
|------------|--------|-------|
| Lista de profesionales | ✅ Completo | Funcional con filtros y búsqueda |
| Detalle de profesional | ✅ Completo | Tabs con toda la información |
| Modal de aprobación | ✅ Completo | Accesible con Radix UI |
| Visor de documentos | ✅ Completo | Preview de PDF e imágenes |
| Navegación admin | ✅ Completo | Link agregado al sidebar |
| Documentación | ✅ Completo | 3 archivos de documentación |
| Tests | ⏳ Pendiente | Recomendado para producción |
| Emails | ⏳ Pendiente | Edge Function por crear |

---

**Fecha de creación**: 20 de octubre de 2025  
**Última actualización**: 20 de octubre de 2025  
**Autor**: Claude Code
