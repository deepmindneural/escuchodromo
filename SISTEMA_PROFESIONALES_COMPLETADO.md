# ✅ SISTEMA DE PROFESIONALES Y CITAS - IMPLEMENTACIÓN COMPLETA

**Fecha**: 20 de Enero, 2025
**Estado**: ✅ Implementado (Pendiente aplicar migraciones en Supabase)

---

## 📦 **LO QUE SE HA IMPLEMENTADO**

### 1. **Base de Datos (Supabase)**

#### ✅ Migraciones SQL Creadas:

1. **`20250120000000_profesionales_y_citas.sql`**
   - ✅ Tabla `PerfilProfesional` (datos profesionales)
   - ✅ Tabla `DocumentoProfesional` (documentos de validación)
   - ✅ Tabla `HorarioProfesional` (disponibilidad)
   - ✅ Tabla `Cita` (sistema de agendamiento)
   - ✅ Tabla `Suscripcion` (planes de pago)
   - ✅ Tabla `CalificacionProfesional` (reseñas)

2. **`20250120000001_rls_profesionales_citas.sql`**
   - ✅ Políticas RLS completas para todas las tablas
   - ✅ Permisos por rol (USUARIO, TERAPEUTA, ADMIN)
   - ✅ Service Role para Edge Functions

3. **`20250120000002_storage_documentos.sql`**
   - ✅ Bucket `documentos-profesionales` (privado, 10MB)
   - ✅ Bucket `avatares` (público, 2MB)
   - ✅ Políticas de acceso por usuario

### 2. **Frontend - Registro de Profesionales**

#### ✅ Página Completa: `/registrar-profesional`

**Características**:
- ✅ Formulario multi-paso (3 pasos)
- ✅ Validación completa en cada paso
- ✅ Paso 1: Datos personales (nombre, email, contraseña)
- ✅ Paso 2: Información profesional
  - Título profesional
  - Número de licencia
  - Universidad
  - Años de experiencia
  - Especialidades (selección múltiple)
  - Idiomas
  - Tarifa por sesión
  - Biografía
- ✅ Paso 3: Carga de documentos
  - Título profesional (PDF/Imagen)
  - Licencia profesional (PDF/Imagen)
  - Cédula de identidad (PDF/Imagen)
  - Vista previa de archivos cargados
- ✅ Animaciones con Framer Motion
- ✅ UI moderna y responsiva
- ✅ Indicador de progreso visual

---

## 📁 **ARCHIVOS CREADOS**

```
/supabase/
├── migrations/
│   ├── 20250120000000_profesionales_y_citas.sql
│   ├── 20250120000001_rls_profesionales_citas.sql
│   └── 20250120000002_storage_documentos.sql
└── APLICAR_MIGRACION_PROFESIONALES.md

/src/app/
└── registrar-profesional/
    └── page.tsx (formulario completo)

/
└── SISTEMA_PROFESIONALES_COMPLETADO.md (este archivo)
```

---

## 🚀 **PRÓXIMOS PASOS PARA COMPLETAR EL SISTEMA**

### 1. **Aplicar Migraciones en Supabase**
```bash
# Ir a Supabase Dashboard > SQL Editor
# Ejecutar en orden:
# 1. 20250120000000_profesionales_y_citas.sql
# 2. 20250120000001_rls_profesionales_citas.sql
# 3. 20250120000002_storage_documentos.sql
```

📖 **Guía completa**: `supabase/APLICAR_MIGRACION_PROFESIONALES.md`

---

### 2. **Implementar Helpers de Supabase**

Crear archivo `/src/lib/supabase/profesionales.ts`:

```typescript
import { crearCliente } from './cliente';

// Registrar profesional
export async function registrarProfesional(datos: {
  email: string;
  password: string;
  nombre: string;
  datosprofesionales: any;
  documentos: File[];
}) {
  const supabase = crearCliente();

  // 1. Crear usuario con Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: datos.email,
    password: datos.password,
    options: {
      data: {
        nombre: datos.nombre,
        rol: 'TERAPEUTA',
      },
    },
  });

  if (authError) throw authError;

  // 2. Crear registro en Usuario
  const { data: usuario } = await supabase
    .from('Usuario')
    .insert({
      auth_id: authData.user?.id,
      email: datos.email,
      nombre: datos.nombre,
      rol: 'TERAPEUTA',
    })
    .select()
    .single();

  // 3. Crear perfil profesional
  const { data: perfil } = await supabase
    .from('PerfilProfesional')
    .insert({
      usuario_id: usuario.id,
      ...datos.datosProfesionales,
    })
    .select()
    .single();

  // 4. Subir documentos a Storage
  for (const archivo of datos.documentos) {
    const rutaArchivo = `${authData.user?.id}/${archivo.name}`;

    await supabase.storage
      .from('documentos-profesionales')
      .upload(rutaArchivo, archivo);

    // Crear registro en DocumentoProfesional
    await supabase.from('DocumentoProfesional').insert({
      perfil_profesional_id: perfil.id,
      tipo: 'titulo', // O el tipo correspondiente
      nombre: archivo.name,
      url_archivo: rutaArchivo,
      nombre_archivo: archivo.name,
      tamano: archivo.size,
      mime_type: archivo.type,
    });
  }

  return { usuario, perfil };
}
```

---

### 3. **Sistema de Calendario de Citas**

Crear archivo `/src/app/agendar-cita/page.tsx`:

**Funcionalidades**:
- ✅ Lista de profesionales aprobados
- ✅ Filtro por especialidad
- ✅ Calendario interactivo (usar `react-datepicker` o `react-big-calendar`)
- ✅ Ver horarios disponibles del profesional
- ✅ Agendar cita con confirmación
- ✅ Enviar notificaciones

**Componente sugerido**:
```typescript
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Obtener horarios disponibles
async function obtenerHorariosDisponibles(profesionalId: string, fecha: Date) {
  // 1. Obtener horarios del profesional para ese día de la semana
  // 2. Filtrar citas ya agendadas
  // 3. Generar slots disponibles
}

// Agendar cita
async function agendarCita(datos: {
  pacienteId: string;
  profesionalId: string;
  fechaHora: Date;
  motivo: string;
}) {
  const supabase = crearCliente();

  const { data, error } = await supabase
    .from('Cita')
    .insert({
      paciente_id: datos.pacienteId,
      profesional_id: datos.profesionalId,
      fecha_hora: datos.fechaHora.toISOString(),
      motivo_consulta: datos.motivo,
      estado: 'pendiente',
      modalidad: 'virtual',
    });

  return data;
}
```

---

### 4. **Dashboard para Profesionales**

Mejorar `/src/app/terapeuta/page.tsx` (crear si no existe):

**Componentes necesarios**:

1. **Vista de Citas del Día**
   ```typescript
   // Mostrar citas del profesional para hoy
   // Botones: Confirmar, Completar, Cancelar
   // Link de videollamada
   ```

2. **Calendario Semanal**
   ```typescript
   // Vista de semana completa con todas las citas
   // Click para ver detalles
   ```

3. **Lista de Pacientes**
   - Ya existe en `/src/app/terapeuta/pacientes/page.tsx`
   - ✅ Conectar con datos reales de Supabase

4. **Gestión de Horarios**
   ```typescript
   // CRUD de HorarioProfesional
   // Definir disponibilidad por día de la semana
   ```

5. **Estadísticas**
   - Total de pacientes
   - Citas completadas
   - Calificación promedio
   - Ingresos del mes

---

### 5. **Panel de Administración**

Ampliar `/src/app/admin/page.tsx`:

**Nuevas funcionalidades**:

1. **Aprobación de Profesionales**
   ```typescript
   // Lista de profesionales pendientes
   // Ver documentos subidos
   // Aprobar/Rechazar con notas
   ```

2. **Gestión de Citas**
   - Ver todas las citas del sistema
   - Resolver conflictos

3. **Métricas**
   - Total de profesionales
   - Citas por mes
   - Tasa de cancelación

---

## 🔑 **VARIABLES DE ENTORNO NECESARIAS**

Actualizar `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# Storage
NEXT_PUBLIC_SUPABASE_STORAGE_URL=https://TU_PROJECT_ID.supabase.co/storage/v1

# URLs públicas
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📚 **DEPENDENCIAS ADICIONALES RECOMENDADAS**

```bash
npm install react-datepicker react-big-calendar
npm install @types/react-datepicker --save-dev
```

---

## ✅ **CHECKLIST DE IMPLEMENTACIÓN**

### Base de Datos
- [x] Migración de tablas profesionales
- [x] Políticas RLS
- [x] Configuración de Storage
- [ ] **Aplicar migraciones en Supabase Dashboard**

### Backend/Helpers
- [ ] Crear `/src/lib/supabase/profesionales.ts`
- [ ] Crear `/src/lib/supabase/citas.ts`
- [ ] Crear `/src/lib/supabase/storage.ts`

### Frontend - Registro
- [x] Formulario de registro de profesionales
- [ ] Integrar con Supabase Auth
- [ ] Integrar carga de documentos a Storage

### Frontend - Sistema de Citas
- [ ] Página de listado de profesionales
- [ ] Calendario de disponibilidad
- [ ] Formulario de agendamiento
- [ ] Confirmación y notificaciones

### Frontend - Dashboard Profesional
- [x] Vista de pacientes (con datos mock)
- [x] Vista de reportes (con datos mock)
- [ ] **Conectar con Supabase**
- [ ] Vista de citas del día
- [ ] Gestión de horarios
- [ ] Estadísticas en tiempo real

### Frontend - Admin
- [x] Panel básico de admin
- [ ] Aprobación de profesionales
- [ ] Ver documentos de validación
- [ ] Gestión de suscripciones

---

## 🎯 **ESTIMACIÓN DE TIEMPO**

| Tarea | Tiempo Estimado |
|-------|-----------------|
| Aplicar migraciones en Supabase | 15 min |
| Crear helpers de Supabase | 2 horas |
| Integrar registro de profesionales | 1 hora |
| Sistema de calendario y citas | 4 horas |
| Dashboard de profesional completo | 3 horas |
| Panel de admin para aprobaciones | 2 horas |
| Testing y ajustes | 2 horas |
| **TOTAL** | **~14-15 horas** |

---

## 📖 **DOCUMENTACIÓN DE REFERENCIA**

- **Supabase Auth**: https://supabase.com/docs/guides/auth
- **Supabase Storage**: https://supabase.com/docs/guides/storage
- **Row Level Security**: https://supabase.com/docs/guides/auth/row-level-security
- **React DatePicker**: https://reactdatepicker.com/
- **Framer Motion**: https://www.framer.com/motion/

---

## 🚨 **IMPORTANTE**

1. **Aplicar las migraciones ANTES de probar el frontend**
2. **Configurar correctamente las variables de entorno**
3. **Verificar que Supabase Storage esté habilitado en tu plan**
4. **Probar primero en un proyecto de desarrollo/staging**

---

## ✨ **RESULTADO FINAL**

Cuando todo esté implementado, el sistema tendrá:

✅ Registro completo de profesionales con validación de documentos
✅ Sistema de citas paciente-profesional
✅ Calendario interactivo de disponibilidad
✅ Dashboard profesional con gestión de citas y pacientes
✅ Panel de admin para aprobar profesionales
✅ Sistema de suscripciones integrado
✅ Calificaciones y reseñas de profesionales
✅ Notificaciones y recordatorios de citas

---

**¿Necesitas ayuda?** Consulta `supabase/APLICAR_MIGRACION_PROFESIONALES.md` para instrucciones detalladas.
