# Sistema de Aprobación de Profesionales - Panel Admin

## Resumen

Sistema completo implementado para que los administradores puedan gestionar las solicitudes de registro de profesionales en el panel de administración.

## Archivos Creados

### Páginas

1. **`/src/app/admin/profesionales/page.tsx`**
   - Lista de todos los profesionales registrados
   - Filtros: Todos, Pendientes, Aprobados
   - Búsqueda por nombre, email o licencia
   - Acciones rápidas: Ver, Aprobar, Rechazar
   - Estadísticas en tiempo real

2. **`/src/app/admin/profesionales/[id]/page.tsx`**
   - Vista detallada de un profesional específico
   - Tabs: Información, Documentos, Horarios
   - Verificación individual de documentos
   - Notas del administrador
   - Aprobación/Rechazo con confirmación

### Componentes

3. **`/src/lib/componentes/admin/ModalAprobar.tsx`**
   - Modal accesible usando Radix UI Dialog
   - Campo de notas de aprobación
   - Checkbox para enviar email de notificación
   - Confirmación visual antes de aprobar

4. **`/src/lib/componentes/admin/VisorDocumento.tsx`**
   - Visualizador de documentos (PDF, imágenes)
   - Vista previa en línea
   - Botones: Descargar, Verificar, Remover verificación
   - Muestra estado de verificación

5. **`/src/lib/componentes/admin/index.ts`**
   - Archivo de exportación para componentes admin

### Modificaciones

6. **`/src/app/admin/layout.tsx`**
   - Agregado icono `UserCheck` de lucide-react
   - Nuevo item en menú: "Profesionales" que apunta a `/admin/profesionales`

## Funcionalidades Implementadas

### Lista de Profesionales (`/admin/profesionales`)

- **Tabla completa** con información de cada profesional:
  - Nombre y email
  - Título profesional
  - Número de licencia
  - Estado de documentos (verificados/total)
  - Estado de aprobación (Pendiente/Aprobado)

- **Filtros dinámicos**:
  - Todos los profesionales
  - Solo pendientes de aprobación
  - Solo aprobados
  - Contador en tiempo real en cada filtro

- **Búsqueda en tiempo real**:
  - Por nombre del profesional
  - Por email
  - Por título profesional
  - Por número de licencia

- **Acciones rápidas**:
  - Ver detalles completos
  - Aprobar inmediatamente
  - Rechazar solicitud

- **Estadísticas visuales**:
  - Total de profesionales
  - Cantidad de pendientes
  - Cantidad de aprobados

### Detalle de Profesional (`/admin/profesionales/[id]`)

#### Tab: Información

- **Información Personal**:
  - Email
  - Teléfono
  - Rol actual

- **Información Profesional**:
  - Título profesional
  - Universidad
  - Número de licencia
  - Años de experiencia

- **Especialidades e Idiomas**:
  - Lista de especialidades (badges)
  - Idiomas que habla (badges)

- **Tarifa**:
  - Tarifa por sesión
  - Moneda (COP/USD)

- **Biografía**:
  - Texto completo de presentación

- **Notas del Administrador**:
  - Campo de texto para notas internas
  - Botón para guardar notas

#### Tab: Documentos

- **Visualizador de documentos**:
  - Vista previa de imágenes (JPG, PNG, etc.)
  - Vista previa de PDFs en iframe
  - Fallback para tipos no soportados

- **Información de cada documento**:
  - Tipo (Licencia, Título, Cédula, etc.)
  - Nombre del archivo
  - Fecha de subida
  - Estado de verificación
  - Fecha de verificación (si aplica)

- **Acciones por documento**:
  - Descargar documento
  - Verificar documento
  - Remover verificación

#### Tab: Horarios

- **Disponibilidad horaria**:
  - Agrupada por día de la semana
  - Hora de inicio y fin
  - Duración de sesiones
  - Estado (Activo/Inactivo)

### Proceso de Aprobación

#### Aprobación Rápida (desde la lista)

1. Click en "Aprobar"
2. El sistema automáticamente:
   - Marca `perfil_aprobado = true`
   - Marca `documentos_verificados = true`
   - Cambia el rol del usuario a `TERAPEUTA`
   - Verifica todos los documentos
   - Registra quién aprobó y cuándo

#### Aprobación Completa (desde detalle)

1. Revisar toda la información en los tabs
2. Verificar documentos individualmente (opcional)
3. Agregar notas del administrador
4. Click en "Aprobar Perfil"
5. Modal de confirmación aparece:
   - Campo de notas de aprobación
   - Checkbox para enviar email de notificación
   - Advertencia sobre las acciones que se realizarán
6. Click en "Confirmar Aprobación"
7. El sistema ejecuta:
   - Actualiza `PerfilProfesional`:
     - `perfil_aprobado = true`
     - `documentos_verificados = true`
     - `aprobado_por = [ID del admin]`
     - `aprobado_en = [timestamp actual]`
     - `notas_admin = [notas ingresadas]`
   - Actualiza `Usuario`:
     - `rol = 'TERAPEUTA'`
   - Actualiza todos los `DocumentoProfesional`:
     - `verificado = true`
     - `verificado_por = [ID del admin]`
     - `verificado_en = [timestamp actual]`

### Rechazo

1. Click en "Rechazar"
2. Confirmación del navegador
3. El sistema ejecuta:
   - Marca `perfil_aprobado = false`
   - Marca `documentos_verificados = false`
   - Registra quién rechazó y cuándo
   - Guarda notas del admin

## Estructura de Base de Datos

### Tablas Utilizadas

```sql
-- Perfil del profesional
PerfilProfesional {
  id UUID
  usuario_id UUID -> Usuario(id)
  titulo_profesional TEXT
  numero_licencia TEXT UNIQUE
  universidad TEXT
  anos_experiencia INTEGER
  especialidades TEXT[]
  biografia TEXT
  idiomas TEXT[]
  documentos_verificados BOOLEAN
  perfil_aprobado BOOLEAN      -- ← Campo clave para aprobación
  aprobado_por UUID            -- ← ID del admin que aprobó
  aprobado_en TIMESTAMP        -- ← Fecha de aprobación
  notas_admin TEXT             -- ← Notas internas
  tarifa_por_sesion FLOAT
  moneda TEXT
}

-- Documentos del profesional
DocumentoProfesional {
  id UUID
  perfil_profesional_id UUID -> PerfilProfesional(id)
  tipo TEXT (licencia, titulo, cedula, certificado, otro)
  nombre TEXT
  url_archivo TEXT             -- ← URL en Supabase Storage
  nombre_archivo TEXT
  verificado BOOLEAN           -- ← Campo clave para verificación
  verificado_por UUID          -- ← ID del admin verificador
  verificado_en TIMESTAMP      -- ← Fecha de verificación
  notas_verificacion TEXT
}

-- Usuario (se actualiza el rol)
Usuario {
  id UUID
  email TEXT
  nombre TEXT
  rol TEXT                     -- ← Cambia a 'TERAPEUTA' al aprobar
}

-- Horarios del profesional
HorarioProfesional {
  id UUID
  perfil_profesional_id UUID
  dia_semana INTEGER (0-6)
  hora_inicio TIME
  hora_fin TIME
  duracion_sesion INTEGER
  activo BOOLEAN
}
```

## Flujo de Datos

### Carga Inicial

1. Admin accede a `/admin/profesionales`
2. Verificación de sesión y rol ADMIN
3. Query a `PerfilProfesional` con joins:
   - Usuario (nombre, email)
   - DocumentoProfesional (tipo, verificado)
4. Renderizado de tabla con datos

### Aprobación

1. Admin hace click en "Aprobar"
2. Modal muestra confirmación
3. Al confirmar, se ejecutan 3 updates en paralelo:
   - Update a `PerfilProfesional`
   - Update a `Usuario` (cambio de rol)
   - Update masivo a `DocumentoProfesional`
4. Toast de éxito
5. Recarga de datos

### Verificación de Documentos

1. Admin abre detalle del profesional
2. Va al tab "Documentos"
3. Ve preview del documento
4. Click en "Verificar"
5. Update a `DocumentoProfesional` específico
6. Si todos están verificados, update a `PerfilProfesional.documentos_verificados`

## Seguridad

### Verificaciones Implementadas

1. **Autenticación**: Se verifica sesión activa en cada página
2. **Autorización**: Se verifica rol ADMIN antes de mostrar contenido
3. **Redirección**: Usuarios no autorizados son redirigidos a `/iniciar-sesion`
4. **Validación de datos**: Se verifica existencia de profesional antes de operar
5. **Transacciones**: Updates críticos se ejecutan en secuencia con error handling

### Permisos Requeridos

- Solo usuarios con `rol = 'ADMIN'` pueden acceder
- RLS policies en Supabase deben permitir:
  - Lectura de `PerfilProfesional`, `DocumentoProfesional`, `Usuario`, `HorarioProfesional`
  - Actualización de `PerfilProfesional`, `DocumentoProfesional`, `Usuario`

## Mejoras Futuras

### Funcionalidades Pendientes

1. **Envío de Emails**:
   - Implementar email al aprobar profesional
   - Email al rechazar con motivo
   - Usar Edge Functions de Supabase

2. **Historial de Cambios**:
   - Tabla de auditoría para registrar cambios
   - Timeline de eventos en el perfil

3. **Validación Avanzada**:
   - Verificación automática de licencias con APIs externas
   - OCR para extraer datos de documentos

4. **Notificaciones en App**:
   - Notificaciones push al profesional
   - Badge de notificaciones pendientes en el admin

5. **Filtros Avanzados**:
   - Por especialidad
   - Por fecha de registro
   - Por universidad
   - Por calificación

6. **Exportación de Datos**:
   - Exportar lista de profesionales a CSV/Excel
   - Generar reportes en PDF

7. **Comentarios y Chat**:
   - Permitir chat directo con el profesional
   - Solicitar documentos adicionales

## Uso

### Acceso al Sistema

1. Iniciar sesión como administrador
2. Ir a `/admin` o hacer click en "Admin Panel" en el menú
3. En el sidebar, hacer click en "Profesionales"

### Aprobar un Profesional

**Opción 1: Aprobación Rápida**
1. En la lista, buscar el profesional
2. Click en "Aprobar"
3. Confirmación automática

**Opción 2: Aprobación Completa**
1. En la lista, click en "Ver"
2. Revisar información en todos los tabs
3. Verificar documentos individualmente (opcional)
4. Agregar notas del admin
5. Click en "Aprobar Perfil"
6. Completar modal y confirmar

### Rechazar un Profesional

1. En la lista o detalle, click en "Rechazar"
2. Confirmar en el diálogo del navegador
3. El profesional queda marcado como rechazado

### Verificar Documentos

1. Ir al detalle del profesional
2. Tab "Documentos"
3. Ver preview del documento
4. Click en "Verificar" o "Remover Verificación"

## Componentes UI Utilizados

- **Radix UI**:
  - `@radix-ui/react-dialog` - Modal de aprobación
  - `@radix-ui/react-tabs` - Tabs en detalle

- **Lucide React**:
  - Iconos: CheckCircle, XCircle, Eye, FileCheck, etc.

- **React Hot Toast**:
  - Notificaciones de éxito/error

- **Componentes propios**:
  - Button - Botones con variantes
  - Utilidades - cn() para clases condicionales

## Testing

### Casos de Prueba Recomendados

1. **Lista de profesionales**:
   - Cargar con 0 profesionales
   - Cargar con múltiples profesionales
   - Filtrar por estado
   - Buscar por texto

2. **Detalle de profesional**:
   - Profesional sin documentos
   - Profesional con documentos
   - Profesional sin horarios
   - Navegación entre tabs

3. **Aprobación**:
   - Aprobar desde lista
   - Aprobar desde detalle
   - Aprobar con notas
   - Aprobar sin enviar email

4. **Verificación de documentos**:
   - Verificar documento individual
   - Remover verificación
   - Descargar documento
   - Preview de diferentes tipos

5. **Seguridad**:
   - Acceso sin autenticación
   - Acceso con rol USUARIO
   - Acceso con rol TERAPEUTA
   - Acceso con rol ADMIN (debe funcionar)

## Troubleshooting

### Problemas Comunes

**"No se cargan los profesionales"**
- Verificar que las tablas existan en Supabase
- Verificar RLS policies
- Ver console del navegador para errores

**"No puedo ver los documentos"**
- Verificar que los documentos estén en Supabase Storage
- Verificar que las URLs sean públicas o con signed URL
- Verificar CORS en Storage

**"El rol no cambia a TERAPEUTA"**
- Verificar permisos de update en tabla Usuario
- Ver errores en console
- Verificar que el usuario_id sea correcto

**"Las imágenes no se muestran"**
- Verificar que las URLs sean accesibles
- Verificar formato de imagen soportado
- Ver errores en Network tab

## Conclusión

El sistema de aprobación de profesionales está completamente implementado y listo para usar. Proporciona una interfaz intuitiva para que los administradores revisen, verifiquen y aprueben profesionales de manera eficiente y segura.

---

**Fecha de implementación**: 20 de octubre de 2025
**Versión**: 1.0.0
**Autor**: Claude Code
