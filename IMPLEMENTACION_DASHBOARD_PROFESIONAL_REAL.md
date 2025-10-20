# Implementación Dashboard Profesional con Datos Reales

**Fecha:** 2025-10-20
**Estado:** Completado
**Objetivo:** Reemplazar datos mock por datos reales de Supabase en el dashboard profesional

## Cambios Implementados

### 1. Nuevo Archivo: Queries de Supabase para Profesionales

**Ubicación:** `/src/lib/supabase/queries/profesional.ts`

Este archivo contiene todas las funciones de consulta a la base de datos para el dashboard profesional:

#### Funciones Principales

**`obtenerPacientesProfesional(profesionalId: string)`**
- Obtiene todos los pacientes únicos que tienen citas con el profesional
- Incluye datos de contacto (nombre, apellido, email, teléfono, género)
- Calcula historial de citas (total y completadas)
- Determina última cita y próxima cita
- Calcula estado emocional basado en evaluaciones recientes (PHQ-9, GAD-7)
- Calcula progreso basado en adherencia y severidad de evaluaciones
- **Retorna:** Array de `PacienteConDatos[]`

**`obtenerMetricasProfesional(profesionalId: string)`**
- Obtiene métricas completas del profesional
- **Pacientes activos:** Usuarios con citas en últimos 30 días
- **Citas esta semana:** Total de citas en semana actual
- **Citas próxima semana:** Total de citas en próxima semana
- **Adherencia:** Porcentaje de citas completadas vs programadas
- **Ingresos:** Calculado multiplicando citas completadas × tarifa por sesión
- **Tendencias:** Datos de últimas 4 semanas para gráficas
- **Retorna:** Objeto `MetricasProfesional`

**`obtenerProximasCitas(profesionalId: string, limite: number = 10)`**
- Obtiene próximas citas del profesional
- Filtradas por estado: 'pendiente' o 'confirmada'
- Ordenadas por fecha ascendente
- Incluye datos del paciente y detalles de la cita
- **Retorna:** Array de `CitaProxima[]`

### 2. Modificaciones al Dashboard

**Ubicación:** `/src/app/profesional/dashboard/page.tsx`

#### Cambios Realizados

**Imports Agregados:**
```typescript
import {
  obtenerPacientesProfesional,
  obtenerMetricasProfesional,
  obtenerProximasCitas,
} from '@/lib/supabase/queries/profesional';
```

**Eliminado:**
- Array `pacientesMock` (líneas 115-147 del código original)
- Array `metricasMock` (líneas 150-212 del código original)
- Queries inline de citas (reemplazadas por función dedicada)

**Agregado:**
- Llamadas a funciones de queries reales
- Lógica para calcular cambios y tendencias basadas en datos históricos
- Formateo de moneda en pesos colombianos (COP)
- Manejo de errores con toast notifications
- Mapeo de datos de Supabase a tipos de componentes UI

## Lógica de Cálculo de Métricas

### Pacientes Activos
- Usuarios con al menos una cita completada o confirmada en últimos 30 días
- Se eliminan duplicados usando Set

### Estado Emocional del Paciente
Basado en severidad de última evaluación:
- **CRITICO:** Severidad 'severa' o 'moderadamente_severa', progreso ~30%
- **ALERTA:** Severidad 'moderada', progreso ~50%
- **ESTABLE:** Severidad 'leve' o 'minima', progreso ~75%

### Progreso del Paciente
Promedio de:
1. Adherencia: (citas_completadas / total_citas) × 100
2. Estado emocional base (según severidad)

### Tasa de Adherencia
```
(citas_completadas / total_citas_mes) × 100
```

### Ingresos
```
citas_completadas × tarifa_por_sesion
```
Donde `tarifa_por_sesion` viene de la tabla `PerfilProfesional`

### Tendencias (4 semanas)
Para cada semana se calcula:
- Pacientes únicos que tuvieron citas
- Total de citas programadas
- Porcentaje de adherencia
- Ingresos totales

Los cambios se calculan comparando última semana vs anterior:
```typescript
cambio = {
  valor: valorActual - valorAnterior,
  porcentaje: Math.abs((cambioValor / valorAnterior) × 100),
  tipo: cambioValor >= 0 ? 'positivo' : 'negativo'
}
```

## Tablas de Base de Datos Utilizadas

### Cita
- `id`, `paciente_id`, `profesional_id`
- `fecha_hora`, `duracion`, `estado`, `modalidad`
- Estados: 'pendiente', 'confirmada', 'completada', 'cancelada', 'no_asistio'

### Usuario
- `id`, `nombre`, `apellido`, `email`, `rol`
- Relación: Cita.paciente_id → Usuario.id

### PerfilUsuario
- `usuario_id`, `telefono`, `genero`, `foto_perfil`

### PerfilProfesional
- `usuario_id`, `tarifa_por_sesion`, `moneda`
- Usado para calcular ingresos

### Resultado (Evaluaciones)
- `usuario_id`, `puntuacion`, `severidad`, `creado_en`
- Usado para determinar estado emocional del paciente

## Formato de Datos

### PacienteConDatos
```typescript
{
  id: string;
  nombre: string;
  apellido: string | null;
  email: string;
  foto_perfil?: string | null;
  telefono?: string | null;
  genero?: string | null;
  total_citas: number;
  citas_completadas: number;
  ultima_cita?: Date | null;
  proxima_cita?: Date | null;
  estado_emocional?: 'ESTABLE' | 'ALERTA' | 'CRITICO';
  progreso?: number; // 0-100
}
```

### MetricasProfesional
```typescript
{
  pacientesActivos: number;
  citasEstaSemana: number;
  citasProximaSemana: number;
  citasCompletadasMes: number;
  citasCanceladasMes: number;
  citasNoAsistioMes: number;
  tasaAdherencia: number; // Porcentaje
  ingresosMes: number;
  ingresosMesAnterior: number;
  tendenciaPacientes: number[]; // 4 semanas
  tendenciaCitas: number[]; // 4 semanas
  tendenciaAdherencia: number[]; // 4 semanas
  tendenciaIngresos: number[]; // 4 semanas
}
```

### CitaProxima
```typescript
{
  id: string;
  paciente: {
    id: string;
    nombre: string;
    apellido: string | null;
    foto_perfil?: string | null;
  };
  fecha_hora: Date;
  duracion: number; // minutos
  modalidad: 'virtual' | 'presencial';
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada' | 'no_asistio';
  motivo_consulta?: string | null;
  link_videollamada?: string | null;
}
```

## Consideraciones de Rendimiento

### Queries Optimizados
- Uso de índices en: `profesional_id`, `fecha_hora`, `estado`
- Select específico de columnas necesarias
- Límites en queries de tendencias
- Uso de filtros en nivel de BD (no en JS)

### Optimizaciones Potenciales Futuras
1. **Caché de métricas:** Cachear resultados por 5-10 minutos
2. **Materialización:** Vista materializada para métricas frecuentes
3. **Paginación:** Para lista de pacientes cuando crezca
4. **Cálculo asíncrono:** Calcular tendencias en background job
5. **Agregaciones SQL:** Mover cálculos complejos a funciones PostgreSQL

## Testing

### Casos de Prueba Sugeridos

**Profesional sin citas:**
- Debe mostrar métricas en 0
- Arrays de tendencias vacíos o con ceros

**Profesional con 1-2 pacientes:**
- Verificar cálculo correcto de adherencia
- Verificar estado emocional basado en evaluaciones

**Profesional con 20+ pacientes:**
- Verificar performance de queries
- Verificar paginación si es necesaria

**Cambios de mes:**
- Verificar que métricas se resetean correctamente
- Ingresos del mes anterior correctos

**Evaluaciones recientes:**
- Estado emocional se actualiza según última evaluación
- Severidad se mapea correctamente a ESTABLE/ALERTA/CRITICO

## Manejo de Errores

Todos los queries retornan formato:
```typescript
{ data: T | null, error: any }
```

En el dashboard:
- Errores se logean en console.error
- Se muestra toast.error al usuario
- Estado de carga se mantiene si hay error parcial
- Datos previos no se borran en error

## Seguridad

- RLS (Row Level Security) debe estar habilitado en Supabase
- Solo el profesional puede ver sus propios datos
- No se exponen datos sensibles de pacientes sin permiso
- Queries usan IDs de usuario autenticado

## Próximos Pasos

1. **Implementar caché:** Reducir carga en BD
2. **Agregar filtros:** Por rango de fechas, estado de paciente
3. **Exportar reportes:** PDF/Excel de métricas
4. **Notificaciones:** Alertar sobre pacientes en estado CRITICO
5. **Comparación histórica:** Mostrar métricas de trimestres anteriores

## Archivos Modificados

```
src/lib/supabase/queries/profesional.ts (NUEVO)
src/app/profesional/dashboard/page.tsx (MODIFICADO)
```

## Verificación

Para verificar la implementación:

```bash
# Compilar TypeScript
npm run typecheck

# Ejecutar la aplicación
npm run dev

# Navegar a
http://localhost:3000/profesional/dashboard
```

Debe mostrar:
- Métricas reales del profesional logueado
- Lista de pacientes con datos de Supabase
- Próximas citas ordenadas cronológicamente
- Gráficas con tendencias de últimas 4 semanas
