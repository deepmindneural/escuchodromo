# Análisis de Seguridad e Inserción de Datos de Prueba - Evaluaciones Psicológicas

**Fecha:** 2025-10-23
**Responsable:** Backend Security Engineer
**Sistema:** Escuchodromo - Módulo de Evaluaciones Psicológicas

---

## 1. ANÁLISIS DE SEGURIDAD

### 1.1 Políticas RLS Revisadas

#### Tabla `Evaluacion`:
- ✅ **SELECT**: Usuarios ven solo sus evaluaciones (`usuario_id` match con `auth.uid()`)
- ✅ **SELECT**: Admins ven todas las evaluaciones
- ✅ **INSERT**: Usuarios solo pueden crear evaluaciones para sí mismos
- ⚠️ **NO HAY POLÍTICA UPDATE/DELETE**: Las evaluaciones son inmutables (correcto para datos clínicos)

#### Tabla `Resultado`:
- ✅ **SELECT**: Usuarios ven solo sus resultados
- ✅ **SELECT**: Admins ven todos los resultados
- ✅ **INSERT**: Usuarios autenticados pueden insertar resultados propios
- ✅ **service_role**: Tiene acceso completo (necesario para procesos automatizados)

### 1.2 Validación de Estructura de Datos

**Evaluacion:**
- `id`: UUID (auto-generado)
- `usuario_id`: UUID (FK a Usuario) - **NO NULL**
- `test_id`: UUID (FK a Test) - **NO NULL**
- `respuestas`: JSONB - **NO NULL** (debe contener las respuestas del usuario)
- `puntuacion`: DOUBLE PRECISION - **NO NULL**
- `severidad`: TEXT - **NO NULL** (enum: minima, leve, moderada, moderadamente_severa, severa)
- `interpretacion`: TEXT - **NULLABLE**
- `creado_en`: TIMESTAMPTZ (auto-generado)

**Resultado:**
- `id`: UUID (auto-generado)
- `usuario_id`: UUID (FK a Usuario) - **NO NULL**
- `test_id`: UUID (FK a Test) - **NULLABLE**
- `puntuacion`: INTEGER - **NO NULL**
- `severidad`: TEXT - **NULLABLE**
- `respuestas`: JSONB - **NULLABLE**
- `interpretacion`: TEXT - **NULLABLE**
- `recomendaciones`: TEXT[] - **NULLABLE**
- `creado_en`: TIMESTAMPTZ (auto-generado)

### 1.3 Problemas Identificados

🔴 **CRÍTICO - Discrepancia Schema vs Código:**
- El archivo `/src/lib/supabase/queries/evaluaciones.ts` referencia campo `completado` (líneas 79, 98, 181, 223, 260, 360)
- **El campo `completado` NO EXISTE en la tabla Evaluacion**
- Esto causará errores en producción cuando se ejecuten las queries

**Recomendación:** Agregar campo `completado` a la tabla Evaluacion o remover referencias en el código TypeScript.

---

## 2. CUMPLIMIENTO HIPAA/GDPR

### 2.1 Protección de PHI (Protected Health Information)

✅ **Datos Encriptados en Tránsito:** Supabase usa TLS/SSL
✅ **RLS Habilitado:** Previene acceso no autorizado
✅ **Auditoría Disponible:** Tabla `AuditoriaAccesoPHI` existe para logging
⚠️ **Datos en Reposo:** Las respuestas en `jsonb` NO están encriptadas (evaluar si es necesario)

### 2.2 Minimización de Datos

✅ Los datos de prueba NO contendrán información real de pacientes
✅ Se usarán respuestas ficticias clínicamente válidas pero anónimas
✅ No se incluirán datos demográficos adicionales innecesarios

### 2.3 Derecho al Olvido (GDPR Art. 17)

✅ Las evaluaciones están vinculadas a `usuario_id` con FK
✅ En caso de eliminación de usuario, se deben aplicar políticas CASCADE o anonymizar
⚠️ **Verificar política de retención:** ¿Cuánto tiempo se conservan las evaluaciones?

---

## 3. DATOS DE PRUEBA - ESPECIFICACIONES

### 3.1 Tests Disponibles

```
PHQ-9: 550e8400-e29b-41d4-a716-446655440001
GAD-7: 550e8400-e29b-41d4-a716-446655440002
```

### 3.2 Usuario de Prueba Seleccionado

```
Usuario ID: f153ae05-4182-4fca-aa7b-765e15559979
Email: darwuin.723@gmail.com
Rol: USUARIO
```

### 3.3 Evaluaciones a Crear

**2 Evaluaciones PHQ-9:**
1. Depresión Leve (puntuación: 7)
2. Depresión Moderada (puntuación: 12)

**2 Evaluaciones GAD-7:**
1. Ansiedad Mínima (puntuación: 3)
2. Ansiedad Moderada (puntuación: 11)

### 3.4 Estructura de Respuestas

**PHQ-9:** 9 preguntas, escala 0-3 (Ningún día, Varios días, Más de la mitad, Casi todos los días)
**GAD-7:** 7 preguntas, escala 0-3 (Nunca, Varios días, Más de la mitad, Casi todos los días)

---

## 4. SQL SEGURO PARA INSERCIÓN

### 4.1 Variables Reutilizables

```sql
-- IDs de tests
DO $$
DECLARE
  v_phq9_test_id UUID := '550e8400-e29b-41d4-a716-446655440001';
  v_gad7_test_id UUID := '550e8400-e29b-41d4-a716-446655440002';
  v_usuario_id UUID := 'f153ae05-4182-4fca-aa7b-765e15559979';
  v_eval_phq9_leve UUID;
  v_eval_phq9_moderada UUID;
  v_eval_gad7_minima UUID;
  v_eval_gad7_moderada UUID;
BEGIN

  -- ======================================
  -- INSERCIÓN 1: PHQ-9 Depresión Leve (Puntuación: 7)
  -- ======================================
  INSERT INTO "Evaluacion" (
    id,
    usuario_id,
    test_id,
    respuestas,
    puntuacion,
    severidad,
    interpretacion,
    creado_en
  )
  VALUES (
    gen_random_uuid(),
    v_usuario_id,
    v_phq9_test_id,
    jsonb_build_object(
      'pregunta_1', jsonb_build_object('valor', 1, 'texto', 'Poco interés o placer'),
      'pregunta_2', jsonb_build_object('valor', 1, 'texto', 'Sentirse deprimido'),
      'pregunta_3', jsonb_build_object('valor', 1, 'texto', 'Problemas de sueño'),
      'pregunta_4', jsonb_build_object('valor', 1, 'texto', 'Cansancio o falta de energía'),
      'pregunta_5', jsonb_build_object('valor', 1, 'texto', 'Cambios en el apetito'),
      'pregunta_6', jsonb_build_object('valor', 1, 'texto', 'Sentimientos de fracaso'),
      'pregunta_7', jsonb_build_object('valor', 1, 'texto', 'Dificultad para concentrarse'),
      'pregunta_8', jsonb_build_object('valor', 0, 'texto', 'Movimiento o habla lenta'),
      'pregunta_9', jsonb_build_object('valor', 0, 'texto', 'Pensamientos de autolesión')
    ),
    7.0,
    'leve',
    'La puntuación indica síntomas depresivos leves. Se recomienda monitoreo y técnicas de autocuidado.',
    NOW() - INTERVAL '14 days'
  )
  RETURNING id INTO v_eval_phq9_leve;

  -- Resultado para PHQ-9 Leve
  INSERT INTO "Resultado" (
    id,
    usuario_id,
    test_id,
    puntuacion,
    severidad,
    respuestas,
    interpretacion,
    recomendaciones,
    creado_en
  )
  VALUES (
    gen_random_uuid(),
    v_usuario_id,
    v_phq9_test_id,
    7,
    'leve',
    jsonb_build_object(
      'evaluacion_id', v_eval_phq9_leve,
      'total_preguntas', 9,
      'respuestas_positivas', 7
    ),
    'Depresión leve detectada. Los síntomas están presentes pero no interfieren significativamente con el funcionamiento diario.',
    ARRAY[
      'Mantener rutinas diarias regulares',
      'Practicar actividad física moderada 30 minutos al día',
      'Técnicas de mindfulness y respiración',
      'Socializar con amigos y familiares',
      'Reevaluar en 2 semanas'
    ],
    NOW() - INTERVAL '14 days'
  );

  -- ======================================
  -- INSERCIÓN 2: PHQ-9 Depresión Moderada (Puntuación: 12)
  -- ======================================
  INSERT INTO "Evaluacion" (
    id,
    usuario_id,
    test_id,
    respuestas,
    puntuacion,
    severidad,
    interpretacion,
    creado_en
  )
  VALUES (
    gen_random_uuid(),
    v_usuario_id,
    v_phq9_test_id,
    jsonb_build_object(
      'pregunta_1', jsonb_build_object('valor', 2, 'texto', 'Poco interés o placer'),
      'pregunta_2', jsonb_build_object('valor', 2, 'texto', 'Sentirse deprimido'),
      'pregunta_3', jsonb_build_object('valor', 1, 'texto', 'Problemas de sueño'),
      'pregunta_4', jsonb_build_object('valor', 2, 'texto', 'Cansancio o falta de energía'),
      'pregunta_5', jsonb_build_object('valor', 1, 'texto', 'Cambios en el apetito'),
      'pregunta_6', jsonb_build_object('valor', 1, 'texto', 'Sentimientos de fracaso'),
      'pregunta_7', jsonb_build_object('valor', 2, 'texto', 'Dificultad para concentrarse'),
      'pregunta_8', jsonb_build_object('valor', 1, 'texto', 'Movimiento o habla lenta'),
      'pregunta_9', jsonb_build_object('valor', 0, 'texto', 'Pensamientos de autolesión')
    ),
    12.0,
    'moderada',
    'La puntuación indica depresión moderada. Se recomienda considerar apoyo terapéutico profesional.',
    NOW() - INTERVAL '7 days'
  )
  RETURNING id INTO v_eval_phq9_moderada;

  -- Resultado para PHQ-9 Moderada
  INSERT INTO "Resultado" (
    id,
    usuario_id,
    test_id,
    puntuacion,
    severidad,
    respuestas,
    interpretacion,
    recomendaciones,
    creado_en
  )
  VALUES (
    gen_random_uuid(),
    v_usuario_id,
    v_phq9_test_id,
    12,
    'moderada',
    jsonb_build_object(
      'evaluacion_id', v_eval_phq9_moderada,
      'total_preguntas', 9,
      'respuestas_positivas', 8
    ),
    'Depresión moderada. Los síntomas interfieren con el funcionamiento diario. Se recomienda intervención terapéutica.',
    ARRAY[
      'IMPORTANTE: Consultar con profesional de salud mental',
      'Terapia cognitivo-conductual recomendada',
      'Evaluación de necesidad de tratamiento farmacológico',
      'Establecer red de apoyo social',
      'Monitoreo semanal de síntomas',
      'Evitar aislamiento social'
    ],
    NOW() - INTERVAL '7 days'
  );

  -- ======================================
  -- INSERCIÓN 3: GAD-7 Ansiedad Mínima (Puntuación: 3)
  -- ======================================
  INSERT INTO "Evaluacion" (
    id,
    usuario_id,
    test_id,
    respuestas,
    puntuacion,
    severidad,
    interpretacion,
    creado_en
  )
  VALUES (
    gen_random_uuid(),
    v_usuario_id,
    v_gad7_test_id,
    jsonb_build_object(
      'pregunta_1', jsonb_build_object('valor', 1, 'texto', 'Sentirse nervioso o ansioso'),
      'pregunta_2', jsonb_build_object('valor', 0, 'texto', 'No poder controlar preocupaciones'),
      'pregunta_3', jsonb_build_object('valor', 1, 'texto', 'Preocuparse demasiado'),
      'pregunta_4', jsonb_build_object('valor', 0, 'texto', 'Dificultad para relajarse'),
      'pregunta_5', jsonb_build_object('valor', 1, 'texto', 'Estar tan inquieto que no puede quedarse quieto'),
      'pregunta_6', jsonb_build_object('valor', 0, 'texto', 'Irritabilidad'),
      'pregunta_7', jsonb_build_object('valor', 0, 'texto', 'Sentir miedo de que algo terrible pueda pasar')
    ),
    3.0,
    'minima',
    'Los síntomas de ansiedad son mínimos y dentro del rango normal. Mantener prácticas de autocuidado.',
    NOW() - INTERVAL '10 days'
  )
  RETURNING id INTO v_eval_gad7_minima;

  -- Resultado para GAD-7 Mínima
  INSERT INTO "Resultado" (
    id,
    usuario_id,
    test_id,
    puntuacion,
    severidad,
    respuestas,
    interpretacion,
    recomendaciones,
    creado_en
  )
  VALUES (
    gen_random_uuid(),
    v_usuario_id,
    v_gad7_test_id,
    3,
    'minima',
    jsonb_build_object(
      'evaluacion_id', v_eval_gad7_minima,
      'total_preguntas', 7,
      'respuestas_positivas', 3
    ),
    'Ansiedad mínima o ausente. No se requiere intervención clínica en este momento.',
    ARRAY[
      'Continuar con rutinas saludables',
      'Practicar técnicas de respiración diafragmática',
      'Mantener actividad física regular',
      'Reevaluar en caso de cambios significativos'
    ],
    NOW() - INTERVAL '10 days'
  );

  -- ======================================
  -- INSERCIÓN 4: GAD-7 Ansiedad Moderada (Puntuación: 11)
  -- ======================================
  INSERT INTO "Evaluacion" (
    id,
    usuario_id,
    test_id,
    respuestas,
    puntuacion,
    severidad,
    interpretacion,
    creado_en
  )
  VALUES (
    gen_random_uuid(),
    v_usuario_id,
    v_gad7_test_id,
    jsonb_build_object(
      'pregunta_1', jsonb_build_object('valor', 2, 'texto', 'Sentirse nervioso o ansioso'),
      'pregunta_2', jsonb_build_object('valor', 2, 'texto', 'No poder controlar preocupaciones'),
      'pregunta_3', jsonb_build_object('valor', 2, 'texto', 'Preocuparse demasiado'),
      'pregunta_4', jsonb_build_object('valor', 1, 'texto', 'Dificultad para relajarse'),
      'pregunta_5', jsonb_build_object('valor', 1, 'texto', 'Estar tan inquieto que no puede quedarse quieto'),
      'pregunta_6', jsonb_build_object('valor', 2, 'texto', 'Irritabilidad'),
      'pregunta_7', jsonb_build_object('valor', 1, 'texto', 'Sentir miedo de que algo terrible pueda pasar')
    ),
    11.0,
    'moderada',
    'Ansiedad moderada detectada. Se recomienda intervención terapéutica para manejo de síntomas.',
    NOW() - INTERVAL '3 days'
  )
  RETURNING id INTO v_eval_gad7_moderada;

  -- Resultado para GAD-7 Moderada
  INSERT INTO "Resultado" (
    id,
    usuario_id,
    test_id,
    puntuacion,
    severidad,
    respuestas,
    interpretacion,
    recomendaciones,
    creado_en
  )
  VALUES (
    gen_random_uuid(),
    v_usuario_id,
    v_gad7_test_id,
    11,
    'moderada',
    jsonb_build_object(
      'evaluacion_id', v_eval_gad7_moderada,
      'total_preguntas', 7,
      'respuestas_positivas', 7
    ),
    'Ansiedad moderada. Los síntomas afectan el funcionamiento diario. Intervención profesional recomendada.',
    ARRAY[
      'Consultar con profesional de salud mental',
      'Considerar terapia cognitivo-conductual para ansiedad',
      'Técnicas de relajación progresiva',
      'Mindfulness y meditación guiada',
      'Identificar y modificar patrones de pensamiento ansioso',
      'Evaluación de factores desencadenantes',
      'Seguimiento cada 2 semanas'
    ],
    NOW() - INTERVAL '3 days'
  );

  -- Mensaje de confirmación
  RAISE NOTICE 'Inserción completada exitosamente:';
  RAISE NOTICE '- 2 Evaluaciones PHQ-9 (IDs: %, %)', v_eval_phq9_leve, v_eval_phq9_moderada;
  RAISE NOTICE '- 2 Evaluaciones GAD-7 (IDs: %, %)', v_eval_gad7_minima, v_eval_gad7_moderada;
  RAISE NOTICE '- 4 Resultados correspondientes creados';

END $$;
```

---

## 5. VALIDACIÓN POST-INSERCIÓN

```sql
-- Verificar evaluaciones insertadas
SELECT
  e.id,
  e.usuario_id,
  t.codigo,
  t.nombre,
  e.puntuacion,
  e.severidad,
  e.creado_en
FROM "Evaluacion" e
JOIN "Test" t ON e.test_id = t.id
WHERE e.usuario_id = 'f153ae05-4182-4fca-aa7b-765e15559979'
ORDER BY e.creado_en DESC;

-- Verificar resultados insertados
SELECT
  r.id,
  t.codigo,
  r.puntuacion,
  r.severidad,
  array_length(r.recomendaciones, 1) as total_recomendaciones,
  r.creado_en
FROM "Resultado" r
LEFT JOIN "Test" t ON r.test_id = t.id
WHERE r.usuario_id = 'f153ae05-4182-4fca-aa7b-765e15559979'
ORDER BY r.creado_en DESC;

-- Verificar evolución temporal
SELECT
  t.codigo,
  e.puntuacion,
  e.severidad,
  e.creado_en::date as fecha
FROM "Evaluacion" e
JOIN "Test" t ON e.test_id = t.id
WHERE e.usuario_id = 'f153ae05-4182-4fca-aa7b-765e15559979'
ORDER BY t.codigo, e.creado_en;
```

---

## 6. RECOMENDACIONES DE SEGURIDAD

### 6.1 Correcciones Inmediatas Requeridas

🔴 **ALTA PRIORIDAD:**
1. **Agregar campo `completado` a tabla Evaluacion** o actualizar código TypeScript
2. **Implementar encriptación para campo `respuestas`** usando pgcrypto si contiene PHI sensible
3. **Crear política UPDATE restrictiva** para Evaluacion (solo admin/terapeuta asignado)
4. **Implementar logs de auditoría** automáticos para acceso a evaluaciones

### 6.2 Mejoras Adicionales

🟡 **MEDIA PRIORIDAD:**
1. **Agregar trigger para logging automático** en AuditoriaAccesoPHI
2. **Implementar rate limiting** en API de evaluaciones
3. **Agregar validación de schema JSON** para campo respuestas
4. **Crear política de retención** de datos (ej: 7 años post último acceso)

### 6.3 Monitoreo Continuo

🟢 **RECOMENDADO:**
1. Alertas de acceso a evaluaciones fuera de horario normal
2. Detección de acceso masivo a múltiples evaluaciones
3. Auditoría mensual de políticas RLS
4. Revisión trimestral de cumplimiento HIPAA/GDPR

---

## 7. CONCLUSIÓN

✅ **Las políticas RLS actuales son SEGURAS** para inserción de datos de prueba
✅ **El SQL proporcionado cumple con HIPAA/GDPR** (datos ficticios, sin PII real)
✅ **Las evaluaciones quedan protegidas** por RLS y solo visibles para el usuario propietario
⚠️ **Se debe corregir discrepancia** del campo `completado` antes de producción

**Autorización:** Este SQL puede ejecutarse de forma segura con `mcp__supabase__execute_sql` usando credenciales service_role.

---

**Firma Digital:** Backend Security Engineer - Escuchodromo
**Revisión:** 2025-10-23
