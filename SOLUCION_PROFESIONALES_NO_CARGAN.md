# 🔧 Solución: Profesionales No Cargan

## 🐛 Problema Identificado

Los profesionales no se muestran en el frontend porque hay una **inconsistencia de datos** en la base de datos:

### Estado Actual:
- ✅ **PerfilProfesional** existe (ID: `3ad0329a-3505-4c0c-a0d3-9cc55a719023`)
  - Aprobado: ✅
  - Verificado: ✅

- ❌ **Usuario** NO existe para ese ID
- ❌ **PerfilUsuario** NO existe para ese ID

### Por Qué Falla:
1. La Edge Function `listar-profesionales` hace JOIN entre Usuario + PerfilProfesional
2. El frontend `/profesionales/[id]` busca en Usuario + PerfilUsuario
3. Como NO existe el Usuario, ambas queries fallan con error 406/404

---

## ✅ Solución (2 opciones)

### Opción 1: Ejecutar SQL desde Dashboard de Supabase (RECOMENDADO)

1. **Ir a Supabase Dashboard**:
   ```
   https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/sql/new
   ```

2. **Copiar y pegar** el contenido del archivo:
   ```
   CREAR_PROFESIONAL_SIMPLE.sql
   ```
   (Usa este en lugar de CREAR_PROFESIONAL_FALTANTE.sql - es más compatible)

3. **Ejecutar** (click en "Run" o Ctrl+Enter)

4. **Verificar** que la query muestra:
   ```
   ✅ Dr. Carlos Rodríguez
   ✅ rol: TERAPEUTA
   ✅ esta_activo: true
   ✅ PerfilUsuario existe
   ✅ PerfilProfesional aprobado
   ```

### Opción 2: Ejecutar desde terminal (requiere psql instalado)

```bash
psql -h aws-0-us-west-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.cvezncgcdsjntzrzztrj \
     -d postgres \
     -f CREAR_PROFESIONAL_SIMPLE.sql
```

---

## 🧪 Verificación

Después de ejecutar el SQL, verifica que funciona:

### 1. Listar profesionales (debería mostrar 1)
```bash
node listar-profesionales-existentes.js
```

**Resultado esperado**:
```
✅ Encontrados 1 usuarios con rol TERAPEUTA:
1. Dr. Carlos Rodríguez (carlos.rodriguez@escuchodromo.com)
   ID: 3ad0329a-3505-4c0c-a0d3-9cc55a719023
   Activo: true
   PerfilUsuario: ✅ Existe
   PerfilProfesional: ✅ Existe (Aprobado, Verificado)
```

### 2. Acceder al frontend
```
http://localhost:3000/profesionales
```

**Debe mostrar**: Tarjeta del Dr. Carlos Rodríguez

### 3. Ver detalle del profesional
```
http://localhost:3000/profesionales/3ad0329a-3505-4c0c-a0d3-9cc55a719023
```

**Debe mostrar**: Biografía completa, tarifas, botón "Agendar cita"

### 4. Ir a reservar
```
http://localhost:3000/profesionales/3ad0329a-3505-4c0c-a0d3-9cc55a719023/reservar
```

**Debe mostrar**: Formulario de reserva con calendario y slots

---

## 🔍 ¿Por Qué Pasó Esto?

Esta inconsistencia puede ocurrir si:
1. Se eliminó manualmente el Usuario pero no el PerfilProfesional
2. Se hizo un reset de la tabla Usuario pero no de PerfilProfesional
3. Hay un problema con las constraints de CASCADE DELETE

Para prevenir en el futuro, asegurar que las foreign keys tienen `ON DELETE CASCADE`:

```sql
-- Verificar constraints
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('PerfilUsuario', 'PerfilProfesional')
ORDER BY tc.table_name;
```

---

## 📝 Crear Más Profesionales

Si necesitas más profesionales de prueba, ejecuta este SQL:

```sql
-- Profesional 2: Dra. Ana Martínez - Especialista en Ansiedad
WITH nuevo_usuario AS (
  INSERT INTO "Usuario" (nombre, apellido, email, rol, esta_activo)
  VALUES ('Dra. Ana', 'Martínez', 'ana.martinez@escuchodromo.com', 'TERAPEUTA', true)
  RETURNING id
),
perfil_usuario AS (
  INSERT INTO "PerfilUsuario" (
    usuario_id, especialidad, experiencia_anos,
    foto_perfil, biografia, direccion,
    tarifa_30min, tarifa_60min, disponible
  )
  SELECT
    id,
    'Terapia de Ansiedad',
    6,
    'https://i.pravatar.cc/300?img=5',
    'Especialista en trastornos de ansiedad con enfoque en técnicas de mindfulness y CBT.',
    'Carrera 7 #70-45, Bogotá',
    75000,
    140000,
    true
  FROM nuevo_usuario
  RETURNING usuario_id
)
INSERT INTO "PerfilProfesional" (
  usuario_id, perfil_aprobado, documentos_verificados,
  titulo_profesional, especialidades, tarifa_por_sesion,
  calificacion_promedio, total_pacientes, total_citas
)
SELECT
  usuario_id,
  true,
  true,
  'Psicóloga Clínica',
  ARRAY['Ansiedad', 'Mindfulness', 'CBT'],
  140000,
  4.9,
  38,
  250
FROM perfil_usuario;

-- Agregar horarios para Dra. Ana
WITH perfil AS (
  SELECT id FROM "PerfilProfesional"
  WHERE usuario_id = (SELECT id FROM "Usuario" WHERE email = 'ana.martinez@escuchodromo.com')
)
INSERT INTO "HorarioProfesional" (perfil_profesional_id, dia_semana, hora_inicio, hora_fin, activo)
SELECT id, dia, '10:00'::time, '18:00'::time, true
FROM perfil
CROSS JOIN unnest(ARRAY[1,2,3,4,5]) AS dia;
```

---

## 🚀 Resultado Final

Después de ejecutar el SQL, el sistema debe funcionar completamente:

- ✅ `/profesionales` → Muestra Dr. Carlos Rodríguez
- ✅ `/profesionales/3ad0329a-...` → Muestra perfil completo
- ✅ `/profesionales/3ad0329a-.../reservar` → Permite reservar cita
- ✅ Edge Function `listar-profesionales` → Retorna 1 profesional
- ✅ Edge Function `disponibilidad-profesional` → Retorna slots
- ✅ Edge Function `reservar-cita` → Permite crear cita

---

## 📞 Soporte

Si después de ejecutar el SQL todavía hay problemas, ejecuta:

```bash
# Ver logs detallados
node test-foreign-keys.js
node listar-profesionales-existentes.js

# Verificar Edge Functions
curl "https://cvezncgcdsjntzrzztrj.supabase.co/functions/v1/listar-profesionales" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Y comparte los resultados.
