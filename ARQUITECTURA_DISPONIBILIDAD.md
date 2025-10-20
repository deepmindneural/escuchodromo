# Arquitectura del Sistema de Disponibilidad Horaria

## Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUARIO PROFESIONAL                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Navega a /profesional/disponibilidad
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    PÁGINA: page.tsx                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Header: Título + Botón "Guardar cambios"                   │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ Grid 2 columnas:                                           │ │
│  │  • Estadísticas (bloques, sesiones)                        │ │
│  │  • Plantillas rápidas (Laboral, Tarde, Completo)          │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ Vista Semanal (Acordeón):                                  │ │
│  │   ┌─ Lunes ────────────────────────────────────┐          │ │
│  │   │  • BloqueHorario (09:00 - 12:00)            │          │ │
│  │   │    - Toggle activo/inactivo                 │          │ │
│  │   │    - Botón editar → SelectorHorarios        │          │ │
│  │   │    - Botón eliminar                         │          │ │
│  │   │  • [+ Agregar horario] → SelectorHorarios   │          │ │
│  │   └─────────────────────────────────────────────┘          │ │
│  │   ┌─ Martes ───────────────────────────────────┐          │ │
│  │   │  • Sin horarios configurados                │          │ │
│  │   │  • [+ Agregar horario]                      │          │ │
│  │   └─────────────────────────────────────────────┘          │ │
│  │   ... (resto de días)                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              │ useState / useEffect
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    ESTADO LOCAL (React)                          │
│  • horariosPorDia: { [dia]: Horario[] }                        │
│  • diasExpandidos: Set<number>                                  │
│  • editandoHorarioId: string | null                            │
│  • agregarHorarioEnDia: number | null                          │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              │ Invoca Edge Functions
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE EDGE FUNCTIONS                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  obtener-disponibilidad (GET)                              │ │
│  │  ─────────────────────────────────────                     │ │
│  │  1. Verificar JWT                                          │ │
│  │  2. Obtener usuario y perfil profesional                   │ │
│  │  3. SELECT * FROM HorarioProfesional                       │ │
│  │  4. Formatear TIME (HH:MM:SS → HH:MM)                      │ │
│  │  5. Retornar array de horarios                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  configurar-disponibilidad (POST)                          │ │
│  │  ────────────────────────────────────                      │ │
│  │  1. Verificar JWT                                          │ │
│  │  2. Validar formato de cada horario                        │ │
│  │  3. Validar solapamientos                                  │ │
│  │  4. Transacción atómica:                                   │ │
│  │     - DELETE todos los horarios existentes                 │ │
│  │     - INSERT nuevos horarios                               │ │
│  │  5. Registrar auditoría PHI                                │ │
│  │  6. Retornar resultado                                     │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              │ Query Database
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    POSTGRESQL DATABASE                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Tabla: HorarioProfesional                                 │ │
│  │  ────────────────────────────────────────                  │ │
│  │  • id: UUID (PK)                                           │ │
│  │  • perfil_profesional_id: UUID (FK)                        │ │
│  │  • dia_semana: INTEGER (0-6)                               │ │
│  │  • hora_inicio: TIME                                       │ │
│  │  • hora_fin: TIME                                          │ │
│  │  • duracion_sesion: INTEGER (30/60)                        │ │
│  │  • activo: BOOLEAN                                         │ │
│  │  • creado_en: TIMESTAMP                                    │ │
│  │  • actualizado_en: TIMESTAMP                               │ │
│  │                                                             │ │
│  │  Constraint: UNIQUE(perfil_profesional_id,                 │ │
│  │                     dia_semana, hora_inicio)               │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Flujo de Datos: Cargar Disponibilidad

```
Usuario → Página carga
    ↓
cargarDatosIniciales()
    ↓
1. supabase.auth.getSession() → JWT válido?
    ↓ Sí
2. SELECT Usuario WHERE id = user.id → Es TERAPEUTA?
    ↓ Sí
3. SELECT PerfilProfesional WHERE usuario_id = user.id → Existe?
    ↓ Sí
4. supabase.functions.invoke('obtener-disponibilidad')
    ↓
    Edge Function: obtener-disponibilidad
        ↓
        1. Verificar JWT
        2. Verificar rol TERAPEUTA/ADMIN
        3. Obtener perfil profesional
        4. SELECT * FROM HorarioProfesional
           WHERE perfil_profesional_id = perfil.id
           ORDER BY dia_semana, hora_inicio
        5. Formatear horarios (HH:MM:SS → HH:MM)
        6. Retornar JSON
    ↓
5. Parsear response
6. Agrupar horarios por día
7. setHorariosPorDia(horariosAgrupados)
    ↓
8. Renderizar UI con horarios
```

## Flujo de Datos: Guardar Disponibilidad

```
Usuario → Click "Guardar cambios"
    ↓
guardarCambios()
    ↓
1. Validar perfilProfesionalId existe
    ↓
2. Preparar array de horarios:
   Object.values(horariosPorDia).flat()
    ↓
3. supabase.functions.invoke('configurar-disponibilidad', {
     body: { horarios: [...] }
   })
    ↓
    Edge Function: configurar-disponibilidad
        ↓
        1. Verificar JWT
        2. Verificar rol TERAPEUTA/ADMIN
        3. Obtener perfil profesional
        4. Parsear body.horarios
        5. FOR EACH horario:
           ✓ Validar dia_semana (0-6)
           ✓ Validar formato hora (HH:MM)
           ✓ Validar hora_fin > hora_inicio
           ✓ Validar duración >= 30 min
           ✓ Validar duracion_sesion (30/60)
        6. FOR EACH par de horarios:
           ✓ Validar no solapamiento
        7. BEGIN TRANSACTION:
           - DELETE FROM HorarioProfesional
             WHERE perfil_profesional_id = perfil.id
           - INSERT INTO HorarioProfesional
             VALUES (horarios...)
           COMMIT
        8. registrar_acceso_phi(...)
        9. Retornar { success, horarios_configurados, mensaje }
    ↓
4. Parsear response
5. Si success:
   - toast.success(mensaje)
   - Recargar horarios desde servidor
   Sino:
   - toast.error(error)
```

## Flujo de Usuario: Agregar Horario

```
Usuario en /profesional/disponibilidad
    ↓
1. Expandir día (ej: Lunes)
    ↓
2. Click "+ Agregar horario"
    ↓
    setAgregarHorarioEnDia(1) // Lunes
    ↓
3. Renderizar SelectorHorarios inline:
   - Dropdown hora_inicio
   - Dropdown hora_fin
   - Calculador de duración
    ↓
4. Usuario selecciona horas:
   hora_inicio: "09:00"
   hora_fin: "12:00"
    ↓
5. SelectorHorarios valida en tiempo real:
   ✓ hora_fin > hora_inicio
   ✓ Calcula duración: 180 minutos
   ✓ Muestra: "Duración: 180 minutos (3h)"
    ↓
6. Click "Agregar"
    ↓
    agregarHorario()
        ↓
        1. Validar campos completos
        2. validarSolapamiento(dia, inicio, fin)
           - Iterar horarios del mismo día
           - Verificar solapamiento matemático
        3. Si válido:
           - Crear nuevoHorario con id temporal
           - Agregar a horariosPorDia[dia]
           - toast.success("Horario agregado")
        4. Si inválido:
           - setErrorNuevoHorario(mensaje)
           - No agregar
    ↓
7. Bloque aparece en la lista con:
   - Horario: 09:00 - 12:00
   - Duración: 3 horas
   - Estado: Activo (toggle ON)
   - Botones: Editar, Eliminar
    ↓
8. Usuario debe hacer "Guardar cambios" para persistir
```

## Componentes y Responsabilidades

### `page.tsx` (Página Principal)
**Responsabilidades:**
- Gestión de estado global de horarios
- Autenticación y autorización
- Comunicación con Edge Functions
- Orquestación de componentes hijos
- Validación de solapamientos
- Aplicación de plantillas

**Estado:**
```typescript
horariosPorDia: { [dia]: HorarioCompleto[] }
diasExpandidos: Set<number>
agregarHorarioEnDia: number | null
editandoHorarioId: string | null
nuevoHorarioInicio/Fin: string
editarHorarioInicio/Fin: string
errorNuevoHorario/errorEditarHorario: string
```

**Funciones clave:**
- `cargarDatosIniciales()` - Setup inicial
- `cargarHorarios()` - Obtener de servidor
- `guardarCambios()` - Persistir en servidor
- `agregarHorario()` - Agregar nuevo bloque
- `eliminarHorario()` - Eliminar bloque
- `iniciarEditarHorario()` - Modo edición
- `guardarEdicionHorario()` - Guardar edición
- `toggleActivoHorario()` - Activar/desactivar
- `validarSolapamiento()` - Validación core
- `aplicarPlantilla()` - Plantillas predefinidas
- `calcularEstadisticas()` - Métricas en tiempo real

### `SelectorHorarios.tsx` (Componente)
**Responsabilidades:**
- UI para seleccionar rango de horas
- Validación visual en tiempo real
- Cálculo de duración
- Generación de opciones (cada 30 min)
- Accesibilidad (ARIA)

**Props:**
```typescript
horaInicio: string
horaFin: string
onHoraInicioChange: (hora) => void
onHoraFinChange: (hora) => void
error?: string
disabled?: boolean
```

**Features:**
- Dropdowns 06:00-22:00 (30 min intervalos)
- Cálculo automático de duración
- Display de horas y minutos
- Mensajes de error inline
- Estados disabled

### `BloqueHorario.tsx` (Componente)
**Responsabilidades:**
- Mostrar un bloque de horario configurado
- Acciones: editar, eliminar, toggle
- Cálculo de sesiones posibles
- Estados visuales (activo/inactivo)

**Props:**
```typescript
horario: {
  id: string
  hora_inicio: string
  hora_fin: string
  activo: boolean
}
onEditar: () => void
onEliminar: () => void
onToggleActivo: () => void
editando?: boolean
disabled?: boolean
```

**Features:**
- Display de rango horario
- Cálculo de duración en horas/minutos
- Cálculo de sesiones (30/60 min)
- Toggle switch animado
- Botones con iconos Heroicons
- Estados hover/focus

### `obtener-disponibilidad` (Edge Function)
**Responsabilidades:**
- Endpoint de lectura
- Autenticación y autorización
- Query a base de datos
- Formateo de respuesta

**Flujo:**
```
1. Verificar JWT
2. Obtener usuario y verificar rol
3. Obtener perfil profesional
4. SELECT horarios del perfil
5. Formatear TIME (HH:MM:SS → HH:MM)
6. Ordenar por dia_semana, hora_inicio
7. Retornar JSON
```

**Rate Limiting:** 60 req/min

### `configurar-disponibilidad` (Edge Function)
**Responsabilidades:**
- Endpoint de escritura
- Validaciones exhaustivas
- Transacción atómica
- Auditoría PHI

**Validaciones:**
```
✓ JWT válido
✓ Rol TERAPEUTA/ADMIN
✓ Perfil existe
✓ Formato hora HH:MM (regex)
✓ dia_semana 0-6
✓ hora_fin > hora_inicio
✓ Duración >= 30 min
✓ duracion_sesion 30 o 60
✓ Sin solapamientos
```

**Transacción:**
```sql
BEGIN;
  DELETE FROM HorarioProfesional
  WHERE perfil_profesional_id = ?;

  INSERT INTO HorarioProfesional
  VALUES (...horarios);
COMMIT;
```

**Rate Limiting:** 20 req/min

## Validación de Solapamiento (Algoritmo)

```typescript
function validarSolapamiento(h1, h2): boolean {
  // Solo si mismo día
  if (h1.dia_semana !== h2.dia_semana) return false

  // Convertir a minutos desde medianoche
  const inicio1 = horaAMinutos(h1.hora_inicio)
  const fin1 = horaAMinutos(h1.hora_fin)
  const inicio2 = horaAMinutos(h2.hora_inicio)
  const fin2 = horaAMinutos(h2.hora_fin)

  // Casos de solapamiento:
  // 1. inicio1 dentro de h2
  if (inicio1 >= inicio2 && inicio1 < fin2) return true

  // 2. fin1 dentro de h2
  if (fin1 > inicio2 && fin1 <= fin2) return true

  // 3. h1 engloba h2
  if (inicio1 <= inicio2 && fin1 >= fin2) return true

  return false
}
```

**Complejidad:** O(n²) para verificar todos los pares
**Optimización posible:** Ordenar por hora_inicio y verificar solo vecinos

## Seguridad

### Autenticación
```
Usuario → Login → JWT token → localStorage
    ↓
Toda request a Edge Function incluye:
Authorization: Bearer <JWT>
    ↓
Edge Function verifica:
1. Token válido (no expirado)
2. Usuario existe
3. Rol apropiado (TERAPEUTA/ADMIN)
4. Perfil profesional existe
```

### Autorización
```
Usuario solo puede:
- Leer sus propios horarios
- Modificar sus propios horarios
- No puede ver/modificar horarios de otros
```

### Validación Doble
```
Frontend (UX):
- Validación inmediata
- Feedback visual
- Prevención de errores

Backend (Seguridad):
- Validación exhaustiva
- No confía en frontend
- Única fuente de verdad
```

### Auditoría
```
Cada modificación registra en AuditoriaAccesoPHI:
- usuario_id: Quién
- tipo_recurso: "configuracion"
- recurso_id: perfil_profesional_id
- accion: "actualizar"
- justificacion: Descripción de cambio
- timestamp: Cuándo
```

## Performance

### Frontend
- ✅ Estado local para evitar re-renders
- ✅ Validación local antes de servidor
- ✅ Acordeón lazy (solo renderiza expandidos)
- ✅ Memoization en cálculos de estadísticas

### Backend
- ✅ Índices en columnas de búsqueda
- ✅ Transacción única (DELETE + INSERT)
- ✅ Formateo solo de datos retornados
- ✅ Connection pooling de Supabase

### Base de Datos
```sql
-- Índices optimizados
CREATE INDEX idx_horario_profesional_perfil_id
  ON HorarioProfesional(perfil_profesional_id);

CREATE INDEX idx_horario_profesional_dia
  ON HorarioProfesional(dia_semana);

CREATE INDEX idx_horario_profesional_activo
  ON HorarioProfesional(activo);

-- Query típico (muy rápido)
SELECT * FROM HorarioProfesional
WHERE perfil_profesional_id = ?
  AND dia_semana = ?
  AND activo = true;
```

## Escalabilidad

**Soporta:**
- ✅ Miles de profesionales concurrentes
- ✅ Múltiples horarios por día por profesional
- ✅ Consultas simultáneas de disponibilidad
- ✅ Alta frecuencia de actualizaciones

**Limitaciones:**
- Rate limiting protege contra abuse
- Transacción atómica previene race conditions
- Constraint UNIQUE previene duplicados

## Integración con Sistema de Reservas

```
HorarioProfesional
    ↓ Usado por
disponibilidad-profesional (Edge Function existente)
    ↓
1. Recibe: profesional_id, fecha
2. Calcula: dia_semana de la fecha
3. SELECT horarios WHERE:
   - perfil_profesional_id = profesional
   - dia_semana = calculado
   - activo = true
4. Genera: Slots de 30 min
5. Filtra: Slots ocupados (tabla Cita)
6. Retorna: Slots disponibles
    ↓ Consumido por
Página de Reservas (a implementar)
    ↓
Usuario puede reservar cita en slot disponible
```

---

**Esta arquitectura garantiza:**
- ✅ Separación de concerns clara
- ✅ Validación en múltiples capas
- ✅ Seguridad robusta
- ✅ Performance óptimo
- ✅ Escalabilidad horizontal
- ✅ Mantenibilidad alta
- ✅ Testing fácil
