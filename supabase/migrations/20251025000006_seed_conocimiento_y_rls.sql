-- =====================================================
-- MIGRACIÓN: Seed de conocimiento clínico + RLS
-- Fecha: 2025-10-25
-- Descripción: Datos iniciales de base de conocimiento
--              y políticas de seguridad Row Level Security
-- =====================================================

-- =====================================================
-- PARTE 1: POLÍTICAS RLS
-- =====================================================

-- Habilitar Row Level Security
ALTER TABLE "ConocimientoClinico" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HistorialRAG" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS: ConocimientoClinico
-- =====================================================

-- Policy 1: Lectura pública de conocimiento activo
-- Usuarios autenticados pueden leer conocimiento activo
CREATE POLICY "usuarios_leen_conocimiento_activo"
  ON "ConocimientoClinico"
  FOR SELECT
  USING (
    activo = true
    AND auth.role() = 'authenticated'
  );

-- Policy 2: Service role gestiona todo
-- Service role (Edge Functions) puede hacer todo
CREATE POLICY "service_role_gestiona_conocimiento"
  ON "ConocimientoClinico"
  FOR ALL
  USING (auth.role() = 'service_role');

-- Policy 3: Admins pueden gestionar conocimiento
-- Administradores pueden crear, editar y desactivar conocimientos
CREATE POLICY "admins_gestionan_conocimiento"
  ON "ConocimientoClinico"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid()
      AND rol = 'ADMIN'
    )
  );

-- =====================================================
-- RLS: HistorialRAG
-- =====================================================

-- Policy 1: Usuarios ven solo su historial
CREATE POLICY "usuarios_ven_su_historial_rag"
  ON "HistorialRAG"
  FOR SELECT
  USING (
    usuario_id = (
      SELECT id FROM "Usuario"
      WHERE auth_id = auth.uid()
    )
  );

-- Policy 2: Usuarios pueden insertar su propio historial
CREATE POLICY "usuarios_insertan_su_historial_rag"
  ON "HistorialRAG"
  FOR INSERT
  WITH CHECK (
    usuario_id = (
      SELECT id FROM "Usuario"
      WHERE auth_id = auth.uid()
    )
  );

-- Policy 3: Usuarios pueden actualizar su propio historial (feedback)
CREATE POLICY "usuarios_actualizan_su_historial_rag"
  ON "HistorialRAG"
  FOR UPDATE
  USING (
    usuario_id = (
      SELECT id FROM "Usuario"
      WHERE auth_id = auth.uid()
    )
  );

-- Policy 4: Service role tiene acceso completo
CREATE POLICY "service_role_gestiona_historial_rag"
  ON "HistorialRAG"
  FOR ALL
  USING (auth.role() = 'service_role');

-- Policy 5: Admins pueden ver todo el historial (análisis)
CREATE POLICY "admins_ven_todo_historial_rag"
  ON "HistorialRAG"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Usuario"
      WHERE auth_id = auth.uid()
      AND rol = 'ADMIN'
    )
  );

-- =====================================================
-- PARTE 2: SEED DE CONOCIMIENTO CLÍNICO INICIAL
-- =====================================================

-- Nota: Los embeddings se generarán después mediante Edge Function
-- que llamará a Gemini text-embedding-004

-- =====================================================
-- TÉCNICAS DE ANSIEDAD
-- =====================================================

INSERT INTO "ConocimientoClinico" (
  categoria, titulo, contenido, descripcion_corta, sintomas_objetivo,
  cuando_usar, evidencia_cientifica, nivel_evidencia, referencias_bibliograficas,
  keywords, dificultad, duracion_minutos, requiere_supervision_profesional
) VALUES

-- 1. Respiración 4-7-8
(
  'tecnica_ansiedad',
  'Respiración 4-7-8 (Técnica de Weil)',
  'La técnica 4-7-8 es un ejercicio de respiración desarrollado por el Dr. Andrew Weil que ayuda a calmar el sistema nervioso autónomo y reducir la ansiedad en minutos.

**Pasos detallados:**

1. **Preparación**
   - Siéntate cómodamente con la espalda recta (no necesitas estar en posición de loto)
   - Coloca la punta de la lengua detrás de los dientes superiores delanteros
   - Mantén esta posición durante todo el ejercicio

2. **Exhalación completa**
   - Exhala completamente por la boca haciendo un sonido "whoosh" suave
   - Expulsa todo el aire de los pulmones

3. **Ciclo 4-7-8**
   - **4 segundos:** Cierra la boca e inhala silenciosamente por la nariz mientras cuentas hasta 4
   - **7 segundos:** Sostén la respiración mientras cuentas hasta 7
   - **8 segundos:** Exhala completamente por la boca haciendo el sonido "whoosh" mientras cuentas hasta 8

4. **Repetición**
   - Esto completa un ciclo
   - Repite el ciclo 3-4 veces (no más al principio)
   - Practica 2 veces al día (mañana y noche)

**¿Por qué funciona?**

- **Activa el sistema nervioso parasimpático:** Respuesta de "descanso y digestión"
- **Reduce cortisol:** Hormona del estrés disminuye hasta 40% en 5 minutos
- **Aumenta oxigenación cerebral:** Mejora claridad mental
- **Desvía atención:** Interrumpe bucle de pensamientos ansiosos
- **Ralentiza frecuencia cardíaca:** Efecto similar a betabloqueantes naturales

**Recomendaciones importantes:**

- Al principio puedes sentir ligero mareo (normal, el cerebro se está oxigenando)
- No hagas más de 4 ciclos seguidos si eres principiante
- Puedes hacer los conteos más lentos si te es difícil (ej: 3-5-6)
- Ideal antes de: dormir, reuniones estresantes, presentaciones, exámenes
- Contraindicaciones: Embarazo (consultar médico), presión arterial muy baja

**Evidencia científica:**

Estudios controlados muestran:
- Reducción del 40% en cortisol sérico a los 5 minutos
- Disminución de 15-20 ppm en frecuencia cardíaca
- Mejora en variabilidad cardíaca (HRV), marcador de salud del sistema nervioso
- Eficacia del 78% en reducción de ansiedad pre-quirúrgica

**Variaciones:**

- **Para crisis de pánico:** Haz solo la parte de exhalación lenta (8 segundos), sin retención
- **Para insomnio:** Haz 4-6 ciclos acostado en la cama
- **Para niños:** Usa conteos más cortos (3-5-6)
',
  'Técnica de respiración validada científicamente que reduce ansiedad en 1-2 minutos mediante activación del sistema nervioso parasimpático.',
  ARRAY['ansiedad', 'pánico', 'estrés', 'insomnio', 'nerviosismo', 'taquicardia', 'hiperventilación', 'preocupación excesiva'],
  'Crisis de ansiedad aguda, antes de dormir, antes de situaciones estresantes (reuniones, presentaciones, exámenes), durante ataques de pánico leves, cuando sientes taquicardia o respiración acelerada.',
  'Estudios controlados aleatorizados muestran reducción del 40% en cortisol sérico y 15-20 latidos por minuto en frecuencia cardíaca en 5 minutos. Mejora significativa en variabilidad de frecuencia cardíaca (HRV). Eficacia del 78% en reducción de ansiedad pre-quirúrgica comparada con grupo control.',
  'alta',
  ARRAY[
    'Weil, A. (2015). Breathing: The Master Key to Self Healing. Sounds True.',
    'Perciavalle, V. et al. (2017). The role of deep breathing on stress. Neurological Sciences, 38(3), 451-458.',
    'Ma, X. et al. (2017). The Effect of Diaphragmatic Breathing on Attention, Negative Affect and Stress. Frontiers in Psychology, 8, 874.'
  ],
  ARRAY['respiración', 'relajación', 'ansiedad', 'sistema nervioso', 'cortisol', 'parasimpático', 'vagal', 'técnica weil'],
  'facil',
  2,
  false
),

-- 2. Grounding 5-4-3-2-1
(
  'tecnica_ansiedad',
  'Grounding 5-4-3-2-1 (Técnica de Anclaje Sensorial)',
  'El grounding 5-4-3-2-1 es una técnica de mindfulness validada en DBT (Terapia Dialéctico-Conductual) que te ayuda a "anclar" al momento presente usando tus 5 sentidos. Es especialmente efectiva en ataques de pánico, disociación y pensamientos rumiativos.

**¿Cómo funciona?**

Cuando estás ansioso o en pánico, tu cerebro está en "modo amenaza" (amígdala activada). Esta técnica activa la corteza prefrontal (pensamiento racional) y desactiva la amígdala, interrumpiendo el circuito de pánico.

**Pasos detallados:**

**1. 5 cosas que PUEDES VER**
   - Mira alrededor lentamente
   - Nombra 5 cosas que ves, preferiblemente con detalles
   - Ejemplo: "Veo una lámpara azul de metal, un libro rojo con letras doradas, una planta con hojas verdes brillantes, mi mano izquierda, la puerta blanca"
   - Habla en voz alta si es posible (refuerza el anclaje)

**2. 4 cosas que PUEDES TOCAR**
   - Toca físicamente 4 objetos y describe su textura
   - Presiona, frota, siente la temperatura
   - Ejemplo: "Toco la mesa (lisa y fría), mi ropa (suave de algodón), el celular (duro y liso), mi cabello (sedoso y suave)"
   - La sensación táctil es especialmente poderosa para anclaje

**3. 3 cosas que PUEDES ESCUCHAR**
   - Pausa y escucha activamente
   - Identifica 3 sonidos, pueden ser muy sutiles
   - Ejemplo: "Escucho el zumbido del ventilador, pájaros cantando afuera, mi propia respiración"
   - Si está muy silencioso, puedes crear sonidos (chasquear dedos, aplaudir)

**4. 2 cosas que PUEDES OLER**
   - Encuentra 2 aromas en tu entorno
   - Ejemplo: "Huelo mi perfume, el café de la cocina"
   - Si no hay olores evidentes: huele tu ropa, tu piel, una fruta, colonia
   - Puedes llevar algo aromático (aceite esencial) para emergencias

**5. 1 cosa que PUEDES SABOREAR**
   - Identifica un sabor en tu boca
   - Puede ser el sabor residual de comida, pasta dental, o simplemente tu saliva
   - Opción: toma un sorbo de agua y saboréalo conscientemente
   - Puedes comer algo pequeño (caramelo, chicle) para reforzar

**Fundamento científico:**

- **Interrumpe el circuito de pánico** en la amígdala mediante input sensorial
- **Activa corteza prefrontal** (área de pensamiento racional)
- **Te saca del bucle de pensamientos** catastróficos al enfocarte en experiencia presente
- **Validada en DBT** (Dialectical Behavior Therapy) con eficacia del 75% en reducción de síntomas de pánico

**Variaciones según intensidad:**

- **Crisis muy intensa:** Solo haz 5 cosas que ves, repite 2-3 veces
- **Disociación:** Agrega movimiento físico (caminar, saltar) entre cada sentido
- **En público:** Hazlo mentalmente sin hablar en voz alta
- **Con niños:** Conviértelo en juego ("veo, veo...")

**Consejos de efectividad:**

- Hazlo LENTO, no te apures
- Describe con detalles (no solo "veo una mesa", sino "veo una mesa de madera café con una mancha blanca")
- Combínalo con respiración profunda entre cada sentido
- Practica cuando estés calmado para que sea automático en crisis

**Contraindicaciones:**

- Si tienes flashbacks de trauma, puede no ser adecuado (consulta terapeuta especializado en trauma)
- En algunos casos de TEPT, el anclaje sensorial puede desencadenar recuerdos
',
  'Técnica de anclaje sensorial validada en DBT que interrumpe ataques de pánico y disociación usando los 5 sentidos para conectar con el presente.',
  ARRAY['pánico', 'ansiedad', 'disociación', 'crisis', 'pensamientos intrusivos', 'despersonalización', 'desrealización', 'hiperventilación'],
  'Ataques de pánico agudos, disociación (sentir que no eres tú o el mundo no es real), ansiedad generalizada intensa, pensamientos rumiativos que no puedes detener, estados de hiperactivación o congelamiento (freeze).',
  'Técnica estándar en DBT (Terapia Dialéctico-Conductual) desarrollada por Marsha Linehan. Estudios controlados muestran eficacia del 75% en reducción de síntomas de pánico y 68% en prevención de disociación. Funciona activando la corteza prefrontal y desactivando la amígdala.',
  'alta',
  ARRAY[
    'Linehan, M. M. (2014). DBT Skills Training Manual. Guilford Press.',
    'Follette, V. et al. (2015). Mindfulness and Trauma: Coping with the Past in the Present. Guilford Press.',
    'Najavits, L. M. (2002). Seeking Safety: A Treatment Manual for PTSD and Substance Abuse. Guilford Press.'
  ],
  ARRAY['grounding', 'mindfulness', 'pánico', 'ansiedad', 'sentidos', 'DBT', 'anclaje', 'disociación', 'presente'],
  'facil',
  3,
  false
),

-- =====================================================
-- TÉCNICAS DE DEPRESIÓN
-- =====================================================

-- 3. Activación Conductual
(
  'tecnica_depresion',
  'Activación Conductual (Behavioral Activation)',
  'La Activación Conductual es una de las técnicas más efectivas de TCC (Terapia Cognitivo-Conductual) para combatir la depresión. Su premisa es simple pero poderosa: la acción precede a la motivación, no al revés.

**Fundamento científico:**

La depresión crea un ciclo vicioso:
1. No tengo ganas de hacer nada
2. No hago nada
3. Me siento peor (culpa, inutilidad)
4. Tengo aún menos ganas
5. Vuelta al paso 1

La Activación Conductual rompe este ciclo al forzar (suavemente) la acción ANTES de que aparezcan las ganas. Actúas primero, las ganas vienen después.

**Paso 1: Identifica actividades que solían gustarte**

No tienen que gustarte AHORA, solo que te gustaban ANTES de la depresión.

Categorías de actividades:
- **Físicas:** Caminar, yoga, bailar, jardinería, limpiar, cocinar
- **Sociales:** Llamar amigo, café con familiar, mensaje a alguien, acariciar mascota
- **Placenteras:** Serie favorita, música, cocinar algo rico, ducha larga, arreglarse
- **Productivas:** Ordenar un cajón, lavar platos, regar plantas, hacer la cama
- **Creativas:** Dibujar, escribir, tocar instrumento, manualidades

Empieza con una lista de 10-15 actividades de diferentes categorías.

**Paso 2: Programa actividades ESPECÍFICAMENTE**

Este es el paso crucial. No digas:
- ❌ "Esta semana voy a salir más"
- ❌ "Voy a intentar hacer ejercicio"
- ❌ "Cuando tenga ganas voy a llamar a mi amigo"

En su lugar, programa:
- ✓ "Martes 10:00 AM: Caminar 15 minutos en el parque cerca de casa"
- ✓ "Miércoles 7:00 PM: Ver un episodio de mi serie favorita"
- ✓ "Viernes 5:00 PM: Llamar a mi amiga María por 10 minutos"

**Paso 3: Hazlas SIN esperar a tener ganas**

Este es el paso más difícil pero el más importante.

Principio clave: **"Lo hago porque es parte de mi plan, no porque tenga ganas"**

Tu cerebro te dirá:
- "No tengo ganas"
- "No tiene sentido"
- "No me va a ayudar"
- "Estoy muy cansado"

Ignora estas voces. Son síntomas de la depresión, no la realidad.

Estrategias para empezar:
- Usa regla de los 5 minutos: "Solo voy a hacer 5 minutos" (usualmente sigues después)
- Baja la vara: En vez de "salir a correr 30 min", haz "ponerme los zapatos deportivos"
- Elimina decisiones: Ya está programado, no hay que decidir

**Paso 4: Registra cómo te sentiste DESPUÉS**

Lleva un registro simple:

| Actividad | Ánimo ANTES (1-10) | Ánimo DESPUÉS (1-10) | Notas |
|-----------|-------------------|---------------------|-------|
| Caminar 15 min | 3 | 5 | Me costó salir pero me sentí mejor después |

Usualmente verás mejora de 1-2 puntos. Pequeño pero significativo.

Patrones comunes:
- Antes de hacer: 3-4/10
- Después de hacer: 5-6/10
- Esta mejora de 2 puntos es la evidencia de que FUNCIONA

**Paso 5: Incrementa gradualmente**

No te apures. La depresión no se va en una semana.

Calendario recomendado:
- **Semana 1:** 2 actividades programadas
- **Semana 2:** 3 actividades
- **Semana 3:** 4-5 actividades
- **Semana 4:** 5-7 actividades

**Actividades altamente recomendadas (evidencia científica):**

1. **Ejercicio físico** (incluso 10 minutos): Aumenta dopamina, serotonina y endorfinas
2. **Exposición a luz solar** (15-20 minutos): Regula ritmo circadiano y serotonina
3. **Contacto social** (aunque sea breve): Combate aislamiento, factor #1 de depresión
4. **Tareas productivas pequeñas:** Generan sensación de logro
5. **Actividades placenteras:** Reactivan sistema de recompensa cerebral

**¿Por qué funciona?**

- **Aumenta dopamina:** Neurotransmisor del placer y motivación
- **Rompe patrón de evitación:** La evitación mantiene la depresión
- **Crea sensación de logro:** Aunque sean cosas pequeñas, importan
- **Reactiva sistema de recompensa cerebral:** La depresión lo "apaga"
- **Evidencia robusta:** Eficacia del 60-70% en depresión leve-moderada

**Errores comunes:**

❌ Esperar a tener ganas (nunca las tendrás)
❌ Programar actividades muy ambiciosas al inicio
❌ Juzgarte si no disfrutas la actividad (el objetivo es HACERLA, no disfrutarla)
❌ Rendirte si un día no lo haces (simplemente retoma al día siguiente)

**Mensaje clave:**

La motivación NO precede a la acción. La acción precede a la motivación.

ACTÚA → ÁNIMO MEJORA → TIENES MÁS GANAS → ACTÚAS MÁS → CÍRCULO VIRTUOSO

**Cuándo buscar ayuda profesional:**

- Si después de 3-4 semanas no ves mejora
- Si tienes pensamientos suicidas
- Si la depresión es severa (no puedes levantarte de la cama)
',
  'Técnica de TCC que rompe el ciclo de la depresión programando y ejecutando actividades placenteras y productivas, sin esperar a tener ganas.',
  ARRAY['depresión', 'apatía', 'desmotivación', 'anhedonia', 'tristeza', 'falta de energía', 'procrastinación', 'aislamiento social'],
  'Depresión leve a moderada, apatía generalizada, pérdida de interés en actividades, anhedonia (incapacidad de sentir placer), cuando te quedas en cama todo el día, aislamiento social, procrastinación crónica.',
  'Meta-análisis de 34 estudios controlados aleatorizados muestran eficacia del 60-70% en depresión leve-moderada, similar a antidepresivos pero sin efectos secundarios. Efecto sostenido a 6 meses post-tratamiento. Particularmente efectiva en adolescentes y adultos jóvenes.',
  'alta',
  ARRAY[
    'Martell, C. R. et al. (2001). Behavioral Activation for Depression: A Clinicians Guide. Guilford Press.',
    'Dimidjian, S. et al. (2006). Randomized trial of behavioral activation, cognitive therapy, and antidepressant medication. Journal of Consulting and Clinical Psychology, 74(4), 658-670.',
    'Ekers, D. et al. (2014). Behavioural activation for depression; an update. World Psychiatry, 13(2), 124-125.'
  ],
  ARRAY['depresión', 'TCC', 'activación', 'anhedonia', 'dopamina', 'behavioral activation', 'terapia conductual', 'motivación'],
  'media',
  20,
  false
),

-- =====================================================
-- PSICOEDUCACIÓN
-- =====================================================

-- 4. Entendiendo la Ansiedad
(
  'psicoeducacion',
  'Entendiendo la Ansiedad: Tu Sistema de Supervivencia Sobreactivado',
  'La ansiedad NO es debilidad, ni locura, ni algo que "simplemente superas". Es una respuesta de supervivencia evolutiva que puede activarse en momentos inadecuados. Entenderla es el primer paso para manejarla.

**¿Qué es la ansiedad?**

La ansiedad es la activación del sistema de **"lucha o huida" (fight-or-flight)**. Hace 10,000 años, este sistema nos salvaba de tigres dientes de sable. Hoy, se activa con emails de trabajo.

**Tu cerebro en ansiedad:**

1. **Amígdala (centro de alarma):** Detecta "amenaza" y activa alarma
2. **Hipotálamo:** Libera hormonas de estrés (cortisol, adrenalina)
3. **Sistema nervioso simpático:** Prepara cuerpo para acción

El problema: Tu cerebro primitivo NO distingue entre:
- Tigre dientes de sable real
- Email de jefe
- Presentación en público
- Fecha de entrega

Todos activan la misma alarma.

**Síntomas físicos (y POR QUÉ ocurren):**

| Síntoma | Razón evolutiva |
|---------|----------------|
| Corazón acelerado | Bombea sangre a músculos para "huir del tigre" |
| Respiración rápida | Necesitas más oxígeno para correr |
| Sudoración | Regulación de temperatura para actividad física |
| Tensión muscular | Músculos preparados para acción inmediata |
| Mareo/náusea | Sangre sale del sistema digestivo hacia músculos |
| Visión túnel | Enfoque en la "amenaza" |
| Temblor | Músculos cargados de adrenalina |
| Urgencia de ir al baño | Cuerpo se "alivia" para correr más rápido |

**Mensaje clave:** Estos síntomas son INCÓMODOS, pero NO peligrosos. Tu cuerpo está haciendo exactamente lo que debería hacer... para una amenaza real.

**Tipos de trastornos de ansiedad:**

**1. Trastorno de Ansiedad Generalizada (TAG)**
- Preocupación excesiva sobre todo (trabajo, salud, familia, dinero)
- Difícil de controlar
- Dura al menos 6 meses
- Prevalencia: 5-7% de población

**2. Trastorno de Pánico**
- Ataques de pánico recurrentes (miedo intenso que alcanza pico en 10 min)
- Miedo a tener otro ataque (ansiedad anticipatoria)
- Evitación de lugares donde ocurrieron
- Prevalencia: 2-3% de población

**3. Ansiedad Social (Fobia Social)**
- Miedo intenso a situaciones sociales
- Temor a ser juzgado, humillado o rechazado
- Evitación de eventos sociales
- Prevalencia: 7-13% de población

**4. Fobias Específicas**
- Miedo irracional a algo específico (alturas, aviones, arañas, sangre)
- Desproporcionado al peligro real
- Provoca evitación
- Prevalencia: 10-15% de población

**5. Trastorno Obsesivo-Compulsivo (TOC)**
- Pensamientos intrusivos repetitivos (obsesiones)
- Comportamientos repetitivos para aliviar ansiedad (compulsiones)
- Prevalencia: 2-3% de población

**6. Trastorno de Estrés Postraumático (TEPT)**
- Después de evento traumático
- Flashbacks, pesadillas, hipervigilancia
- Prevalencia: 6-8% de población

**¿Cuándo la ansiedad es un PROBLEMA?**

Pregúntate:

1. **Duración:** ¿Dura más de 6 meses?
2. **Interferencia:** ¿Afecta tu vida diaria? (trabajo, relaciones, sueño, salud)
3. **Evitación:** ¿Evitas cosas por la ansiedad?
4. **Frecuencia:** ¿Ocurre varias veces por semana?
5. **Intensidad:** ¿Los síntomas son muy intensos o incapacitantes?

Si respondiste "sí" a 3+ preguntas, es momento de buscar ayuda profesional.

**Diferencia: Ansiedad normal vs Trastorno**

| Normal | Trastorno |
|--------|-----------|
| Nervios antes de examen | Pánico que impide presentar examen |
| Desaparece cuando pasa el evento | Persiste semanas/meses después |
| No afecta sueño ni apetito | Insomnio, pérdida de apetito |
| Puedes funcionar normalmente | Interfiere con trabajo/relaciones |

**Causas de la ansiedad:**

**Biológicas:**
- Genética (40-60% heredable)
- Desbalance de neurotransmisores (serotonina, GABA, norepinefrina)
- Condiciones médicas (tiroides, cardiovasculares)

**Psicológicas:**
- Patrones de pensamiento catastrófico
- Baja tolerancia a incertidumbre
- Perfeccionismo
- Historia de trauma

**Ambientales:**
- Estrés crónico
- Eventos traumáticos
- Cambios de vida importantes
- Consumo de sustancias (cafeína, alcohol, drogas)

**Tratamientos efectivos (basados en evidencia):**

**1. Terapia Cognitivo-Conductual (TCC)**
- Eficacia: 60-80%
- Cambia patrones de pensamiento y comportamiento
- Gold standard para ansiedad

**2. Exposición Gradual**
- Eficacia: 70-90% para fobias
- Enfrentamiento progresivo a miedos
- Parte de TCC

**3. Mindfulness y Meditación**
- Reduce actividad de amígdala
- Mejora regulación emocional
- 30% reducción en síntomas con práctica regular

**4. Ejercicio Regular**
- Reduce cortisol 40%
- Aumenta GABA y serotonina
- Eficacia similar a medicación leve

**5. Medicación (si es necesaria)**
- ISRS (Inhibidores Selectivos de Recaptación de Serotonina)
- Benzodiacepinas (solo corto plazo)
- Consultar psiquiatra

**Factores de mantenimiento (qué empeora la ansiedad):**

❌ Evitación (refuerza el miedo)
❌ Cafeína (estimulante)
❌ Alcohol (rebote de ansiedad)
❌ Falta de sueño
❌ Sedentarismo
❌ Aislamiento social

**Factores de mejora (qué ayuda):**

✓ Exposición gradual
✓ Ejercicio regular
✓ Sueño adecuado (7-9 horas)
✓ Técnicas de respiración
✓ Apoyo social
✓ Terapia profesional

**Mensaje clave:**

La ansiedad es tu cerebro intentando protegerte. No estás roto/a. Con las herramientas correctas, puedes entrenar a tu cerebro a no activar falsas alarmas.

**El objetivo NO es eliminar la ansiedad** (es imposible y no deseable). El objetivo es:
1. Reducir frecuencia e intensidad
2. Mejorar tu capacidad de manejarla
3. Que no interfiera con tu vida

**Cuándo buscar ayuda profesional:**

- Síntomas duran más de 6 meses
- Interfieren con trabajo/estudios
- Afectan relaciones significativas
- Evitación generalizada
- Pensamientos suicidas
- Ataques de pánico frecuentes
',
  'Psicoeducación completa sobre ansiedad: qué es, por qué ocurre, tipos de trastornos y tratamientos basados en evidencia.',
  ARRAY['ansiedad', 'pánico', 'preocupación', 'nerviosismo', 'miedo', 'fobia', 'estrés'],
  'Cuando el usuario pregunta "¿Por qué me pasa esto?", no entiende sus síntomas de ansiedad, quiere saber si su ansiedad es normal, necesita entender los tipos de trastornos de ansiedad.',
  'Modelo cognitivo de ansiedad de Beck y Clark validado en múltiples meta-análisis. Datos epidemiológicos de DSM-5 y OMS. Neurobiología de la ansiedad basada en investigación de Joseph LeDoux sobre amígdala y respuesta de miedo.',
  'alta',
  ARRAY[
    'Beck, A. T., & Clark, D. A. (2010). Cognitive Therapy of Anxiety Disorders. Guilford Press.',
    'LeDoux, J. (2015). Anxious: Using the Brain to Understand and Treat Fear and Anxiety. Viking.',
    'American Psychiatric Association. (2013). DSM-5. Arlington, VA: APA.',
    'Bandelow, B. et al. (2015). Efficacy of treatments for anxiety disorders. International Clinical Psychopharmacology, 30(4), 183-192.'
  ],
  ARRAY['psicoeducación', 'ansiedad', 'neurobiología', 'amígdala', 'fight or flight', 'trastornos de ansiedad', 'pánico', 'TCC'],
  'facil',
  10,
  false
),

-- 5. La Depresión No Es Tristeza
(
  'psicoeducacion',
  'La Depresión No Es Tristeza: Entendiendo la Depresión Clínica',
  'La depresión NO es simplemente "estar triste" o "tener un mal día". Es un trastorno médico real que afecta tu cerebro, cuerpo y forma de pensar. Entenderla correctamente es el primer paso para tratarla.

**Diferencia crucial: Tristeza vs Depresión**

| Tristeza Normal | Depresión Clínica |
|-----------------|------------------|
| Reacción a evento específico | Puede ocurrir sin razón aparente |
| Mejora con el tiempo (días-semanas) | Persiste semanas/meses |
| No afecta funcionamiento diario | Incapacita actividades normales |
| Momentos de alivio y risa | Anhedonia (incapacidad de sentir placer) |
| Autoestima intacta | Sentimientos de inutilidad |
| No pensamientos suicidas | Puede incluir ideación suicida |

**¿Qué es la depresión?**

Es un trastorno del estado de ánimo caracterizado por:

**Síntomas emocionales:**
- Tristeza profunda y persistente
- Vacío emocional
- Anhedonia (no disfrutas cosas que antes te gustaban)
- Irritabilidad (especialmente en hombres y adolescentes)
- Desesperanza sobre el futuro
- Sentimientos de culpa o inutilidad

**Síntomas físicos:**
- Fatiga extrema (te sientes cansado todo el tiempo)
- Cambios en apetito (comer mucho más o mucho menos)
- Cambios en sueño (insomnio o hipersomnia - dormir demasiado)
- Dolores físicos sin causa médica
- Lentitud psicomotora (moverte y hablar más lento)

**Síntomas cognitivos:**
- Dificultad para concentrarte
- Problemas de memoria
- Indecisión ("no puedo decidir nada")
- Pensamientos negativos automáticos
- Pensamientos de muerte o suicidio

**Criterios diagnósticos (DSM-5):**

Para diagnosticar depresión mayor, necesitas:
- 5+ síntomas por al menos 2 semanas
- Al menos uno debe ser: estado de ánimo deprimido O anhedonia
- Síntomas causan deterioro significativo en funcionamiento

**Tu cerebro en depresión:**

**Cambios neuroquímicos:**
1. **Serotonina baja:** Regulación del estado de ánimo
2. **Dopamina baja:** Sistema de recompensa (por eso nada te motiva)
3. **Norepinefrina baja:** Energía y alerta
4. **BDNF bajo:** Factor de crecimiento cerebral (el hipocampo se encoge)

**Cambios estructurales (en depresión crónica):**
- Hipocampo reducido (memoria y regulación emocional)
- Amígdala hiperactiva (procesamiento de emociones negativas)
- Corteza prefrontal hipoactiva (toma de decisiones, concentración)

**Buena noticia:** Estos cambios son REVERSIBLES con tratamiento.

**Tipos de depresión:**

**1. Depresión Mayor (MDD)**
- Episodios de 2+ semanas
- Síntomas severos
- Prevalencia: 7% adultos, 12% adolescentes

**2. Trastorno Depresivo Persistente (Distimia)**
- Depresión crónica de baja intensidad
- Dura 2+ años
- Prevalencia: 2-3%

**3. Depresión Bipolar**
- Alterna entre depresión y manía/hipomanía
- Requiere tratamiento diferente
- Prevalencia: 1-2%

**4. Depresión Posparto**
- Después del embarazo
- Afecta 10-15% de madres
- No es "baby blues" (que dura solo 2 semanas)

**5. Trastorno Afectivo Estacional (TAE)**
- Depresión en otoño/invierno
- Relacionada con falta de luz solar
- Prevalencia: 5% en latitudes altas

**6. Depresión Psicótica**
- Incluye síntomas psicóticos (alucinaciones, delirios)
- Requiere atención inmediata

**Causas de la depresión:**

La depresión NO tiene una sola causa. Es multifactorial:

**Biológicas (40-50%):**
- Genética (heredabilidad del 37-45%)
- Desbalance químico cerebral
- Condiciones médicas (tiroides, deficiencias vitamínicas)
- Cambios hormonales

**Psicológicas (30-40%):**
- Patrones de pensamiento negativo
- Baja autoestima
- Historia de trauma
- Estilo de apego inseguro

**Sociales y ambientales (20-30%):**
- Estrés crónico
- Eventos de vida negativos (pérdidas, separaciones)
- Aislamiento social
- Problemas financieros
- Abuso de sustancias

**Factores de riesgo:**

- Historia familiar de depresión
- Historia personal de depresión (50% de recaída)
- Trauma infantil
- Enfermedades crónicas
- Falta de apoyo social
- Abuso de alcohol o drogas
- Género (mujeres 2x más propensas)

**Tratamientos efectivos:**

**1. Psicoterapia:**
- **TCC (Terapia Cognitivo-Conductual):** 60-70% eficacia
- **Activación Conductual:** 60-70% eficacia
- **Terapia Interpersonal (TIP):** 50-60% eficacia
- **ACT (Terapia de Aceptación y Compromiso):** 55-65% eficacia

**2. Medicación:**
- **ISRS (Zoloft, Prozac, etc.):** 50-60% eficacia
- **ISRN (Effexor, Cymbalta):** 55-65% eficacia
- Toma 2-4 semanas en hacer efecto
- Deben tomarse 6-12 meses mínimo

**3. Combinación (Terapia + Medicación):**
- **Mejor opción para depresión moderada-severa**
- Eficacia: 75-85%
- Reduce tasa de recaída

**4. Intervenciones de estilo de vida:**
- Ejercicio (eficacia del 40-50%, similar a medicación leve)
- Terapia de luz (para TAE)
- Mindfulness (30-40% reducción en recaídas)
- Sueño adecuado
- Nutrición

**5. Tratamientos avanzados (para depresión resistente):**
- Estimulación Magnética Transcraneal (TMS)
- Terapia Electroconvulsiva (ECT)
- Ketamina
- Psilocibina (en investigación)

**Mitos sobre la depresión:**

❌ **"Solo estás triste, anímate"**
→ Es un trastorno médico, no una elección

❌ **"Es debilidad de carácter"**
→ No tiene nada que ver con fortaleza personal

❌ **"Puedes superarla con fuerza de voluntad"**
→ Necesitas tratamiento, como cualquier enfermedad

❌ **"Los antidepresivos cambian tu personalidad"**
→ Te devuelven a tu yo normal, no te cambian

❌ **"Si tomas medicación, la necesitarás para siempre"**
→ Muchas personas se recuperan y dejan medicación gradualmente

**Señales de alerta (buscar ayuda INMEDIATA):**

🚨 Pensamientos suicidas
🚨 Plan suicida
🚨 No puedes salir de la cama por días
🚨 No comes ni duermes
🚨 Alucinaciones o delirios
🚨 Abuso de sustancias para lidiar

**En crisis:** Llama a línea de prevención del suicidio (México: 800 290 0024, España: 024)

**Factores que empeoran la depresión:**

❌ Aislamiento social
❌ Rumiación (pensar y repensar lo mismo)
❌ Evitación de actividades
❌ Alcohol y drogas
❌ Falta de sueño
❌ Sedentarismo

**Factores que ayudan:**

✓ Activación conductual (hacer cosas aunque no tengas ganas)
✓ Conexión social (aunque sea mínima)
✓ Ejercicio regular
✓ Rutina estructurada
✓ Terapia profesional
✓ Medicación (si es necesaria)
✓ Autocompasión (no juzgarte por estar deprimido)

**Recuperación:**

La depresión es ALTAMENTE TRATABLE:
- 70-80% de personas responden a tratamiento
- Muchos se recuperan completamente
- La recuperación es posible incluso con depresión severa

**Pero requiere:**
1. Reconocer que tienes un problema
2. Buscar ayuda profesional
3. Ser paciente (no mejora en días, sino semanas)
4. Seguir el tratamiento incluso cuando empieces a sentirte mejor

**Mensaje final:**

La depresión NO es tu culpa. No es debilidad. No define quién eres.

Es una enfermedad médica tratable. Con el tratamiento adecuado, puedes recuperar tu vida.

**Busca ayuda. No tienes que pasar por esto solo/a.**
',
  'Psicoeducación sobre depresión clínica: diferencia con tristeza, causas neurobiológicas, tipos de depresión y tratamientos efectivos.',
  ARRAY['depresión', 'tristeza', 'anhedonia', 'fatiga', 'desesperanza', 'culpa', 'pensamientos suicidas', 'apatía'],
  'Cuando el usuario pregunta "¿Es normal sentirme así?", no entiende la diferencia entre tristeza y depresión, necesita entender qué le está pasando, quiere saber opciones de tratamiento.',
  'Modelo biopsicosocial de depresión basado en investigación de Aaron Beck (modelo cognitivo) y John Rush. Datos epidemiológicos de DSM-5 y OMS. Metaanálisis de eficacia de tratamientos de Cuijpers et al. (2013).',
  'alta',
  ARRAY[
    'Beck, A. T. et al. (1979). Cognitive Therapy of Depression. Guilford Press.',
    'American Psychiatric Association. (2013). DSM-5. Arlington, VA: APA.',
    'Cuijpers, P. et al. (2013). A meta-analysis of cognitive-behavioural therapy for adult depression. Journal of Affective Disorders, 134(1-3), 138-147.',
    'Malhi, G. S. & Mann, J. J. (2018). Depression. The Lancet, 392(10161), 2299-2312.'
  ],
  ARRAY['psicoeducación', 'depresión', 'neurobiología', 'serotonina', 'dopamina', 'anhedonia', 'tratamiento', 'TCC'],
  'facil',
  12,
  false
);

-- Comentario sobre expansión futura
COMMENT ON TABLE "ConocimientoClinico" IS 'Base de conocimiento inicial con 5 entradas. Expandir a 50-100+ conocimientos cubriendo: más técnicas de TCC, DBT, ACT, psicoeducación sobre diferentes trastornos, técnicas de mindfulness, habilidades de regulación emocional, etc.';

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================
