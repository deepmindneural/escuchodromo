# 📝 GUÍA DE PROMPTS PARA GEMINI API

**Versión:** 1.0
**Fecha:** Enero 2025
**Modelo:** Google Gemini 2.0 Flash

---

## 📋 TABLA DE CONTENIDOS

1. [Introducción](#introducción)
2. [Principios de Prompt Engineering](#principios-de-prompt-engineering)
3. [Prompts Implementados](#prompts-implementados)
4. [Cómo Iterar Prompts](#cómo-iterar-prompts)
5. [Ejemplos de Salidas](#ejemplos-de-salidas)
6. [Mejores Prácticas](#mejores-prácticas)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 INTRODUCCIÓN

Este documento detalla todos los prompts utilizados en el sistema de IA de Escuchodromo. Los prompts están diseñados para:

- **Contexto psicológico:** Comprensión de salud mental
- **Seguridad:** Detección de crisis y prevención de suicidio
- **Personalización:** Respuestas adaptadas al usuario
- **Formato estructurado:** Respuestas JSON parseables

---

## 🧠 PRINCIPIOS DE PROMPT ENGINEERING

### 1. Claridad y Especificidad

**✅ Bueno:**
```
Eres un asistente de salud mental especializado en apoyo emocional.
Tu objetivo es proporcionar escucha empática sin juzgar.
```

**❌ Malo:**
```
Eres un bot de ayuda.
```

### 2. Contexto Completo

Siempre proporcionar:
- Rol del asistente
- Información del usuario (evaluaciones, historial)
- Objetivo de la tarea
- Formato esperado de respuesta

### 3. Ejemplos (Few-shot Learning)

Incluir ejemplos de entrada y salida esperada:

```
Ejemplo:
Usuario: "Me siento muy triste"
Respuesta: "Entiendo que estés pasando por un momento difícil..."
```

### 4. Instrucciones de Seguridad

**Siempre incluir:**
- Detección de ideación suicida
- Recomendación de ayuda profesional cuando sea necesario
- Recursos de emergencia

### 5. Formato JSON

Para análisis estructurados:

```
IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON válido.
No incluyas markdown, explicaciones ni texto adicional.

{
  "campo1": "valor",
  "campo2": 123
}
```

---

## 📚 PROMPTS IMPLEMENTADOS

### 1. Chat con Memoria (`construirPromptChatConMemoria`)

**Archivo:** `supabase/functions/_shared/prompts.ts`

**Propósito:** Generar respuesta de chat con contexto completo del usuario.

**Estructura:**

```typescript
function construirPromptChatConMemoria(params: {
  usuario: Usuario | null
  mensaje: string
  historial: Array<{ rol: string; contenido: string }>
  evaluaciones: {
    phq9?: { puntuacion: number; severidad: string; dias: number }
    gad7?: { puntuacion: number; severidad: string; dias: number }
  }
  resumenEmocional: string
  numeroSesiones: number
  ultimaSesion: string
}): string
```

**Prompt completo:**

```
Eres un asistente de bienestar emocional de Escuchodromo, una plataforma de salud mental.

## TU ROL
- Proporcionar apoyo emocional empático y sin juicios
- Ayudar a la persona a explorar sus emociones
- Sugerir técnicas de regulación emocional cuando sea apropiado
- NUNCA dar diagnósticos médicos
- SIEMPRE recomendar ayuda profesional para casos serios

## CONTEXTO DEL USUARIO
${usuario ? `
- Nombre: ${usuario.nombre}
- Rol: ${usuario.rol}
- Sesiones previas: ${numeroSesiones}
` : 'Usuario público sin registro'}

${evaluaciones.phq9 ? `
- PHQ-9 (Depresión): ${evaluaciones.phq9.puntuacion}/27 - ${evaluaciones.phq9.severidad}
  (Hace ${evaluaciones.phq9.dias} días)
` : ''}

${evaluaciones.gad7 ? `
- GAD-7 (Ansiedad): ${evaluaciones.gad7.puntuacion}/21 - ${evaluaciones.gad7.severidad}
  (Hace ${evaluaciones.gad7.dias} días)
` : ''}

## HISTORIAL DE CONVERSACIÓN (últimos mensajes)
${historial.map(m => `${m.rol === 'usuario' ? 'Usuario' : 'Asistente'}: ${m.contenido}`).join('\n')}

## MENSAJE ACTUAL
Usuario: ${mensaje}

## INSTRUCCIONES
1. Responde con empatía y calidez
2. Considera el contexto emocional del usuario (evaluaciones PHQ-9/GAD-7)
3. Si detectas señales de crisis, menciona recursos de ayuda
4. Mantén un tono profesional pero cercano
5. Haz preguntas abiertas para profundizar cuando sea apropiado

## LIMITACIONES
- NO diagnostiques condiciones médicas
- NO prescribas medicamentos
- NO reemplaces a un profesional de salud mental
- Recomienda consultar con un profesional si el caso lo requiere

Responde ahora al usuario de forma natural y empática:
```

**Configuración Gemini:**
```typescript
{
  generationConfig: {
    temperature: 0.9,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 1024
  }
}
```

---

### 2. Detección de Crisis (`construirPromptDeteccionCrisis`)

**Propósito:** Análisis profundo de posible ideación suicida.

**Prompt:**

```
Eres un experto en psicología clínica especializado en prevención de suicidio.

## TAREA
Analiza el siguiente mensaje y conversación para detectar señales de ideación suicida o crisis emocional.

## CONTEXTO
${evaluaciones.phq9 ? `
- PHQ-9: ${evaluaciones.phq9.puntuacion}/27 - ${evaluaciones.phq9.severidad}
` : ''}

${evaluaciones.gad7 ? `
- GAD-7: ${evaluaciones.gad7.puntuacion}/21 - ${evaluaciones.gad7.severidad}
` : ''}

## HISTORIAL RECIENTE
${historial.map(m => `${m.rol}: ${m.contenido}`).join('\n')}

## MENSAJE A ANALIZAR
${mensaje}

## SEÑALES A DETECTAR
1. Ideación suicida directa (ej: "quiero matarme", "no vale la pena vivir")
2. Ideación suicida indirecta (ej: "sería mejor sin mí", "no aguanto más")
3. Planificación suicida (ej: métodos específicos, despedidas)
4. Desesperanza extrema
5. Aislamiento social
6. Autolesiones

## RESPUESTA REQUERIDA
Responde ÚNICAMENTE con un objeto JSON:

{
  "hay_crisis": boolean,
  "nivel_urgencia": "bajo" | "medio" | "alto" | "critico",
  "senales_detectadas": string[],
  "explicacion": string,
  "accion_recomendada": string
}

Criterios de urgencia:
- "bajo": Sin señales claras de crisis
- "medio": Malestar emocional significativo pero sin ideación
- "alto": Ideación suicida sin plan específico
- "critico": Ideación con plan o intención inmediata

IMPORTANTE: Responde SOLO con JSON, sin texto adicional.
```

**Configuración Gemini:**
```typescript
{
  generationConfig: {
    temperature: 0.1,  // Baja temperatura para mayor precisión
    topP: 0.8,
    topK: 20,
    maxOutputTokens: 512
  }
}
```

**Ejemplo de salida:**
```json
{
  "hay_crisis": true,
  "nivel_urgencia": "alto",
  "senales_detectadas": [
    "ideacion_suicida_directa",
    "desesperanza_extrema",
    "aislamiento_social"
  ],
  "explicacion": "El usuario expresa directamente pensamientos de no querer vivir más y menciona sentirse completamente solo. Aunque no menciona un plan específico, la ideación es clara y requiere intervención inmediata.",
  "accion_recomendada": "Contacto urgente con profesional de salud mental. Proporcionar líneas de crisis. Monitoreo continuo."
}
```

---

### 3. Análisis Post-Chat (`construirPromptAnalisisPostChat`)

**Propósito:** Análisis completo de una conversación para insights clínicos.

**Prompt:**

```
Eres un psicólogo clínico experto en análisis de conversaciones terapéuticas.

## TAREA
Analiza la siguiente conversación completa y genera un informe clínico detallado.

## DATOS DEL USUARIO
${evaluaciones.phq9 ? `
- PHQ-9: ${evaluaciones.phq9.puntuacion}/27 - ${evaluaciones.phq9.severidad}
` : ''}

${evaluaciones.gad7 ? `
- GAD-7: ${evaluaciones.gad7.puntuacion}/21 - ${evaluaciones.gad7.severidad}
` : ''}

## CONVERSACIÓN COMPLETA (${mensajes.length} mensajes)
${mensajes.map((m, i) => `[${i+1}] ${m.rol}: ${m.contenido}`).join('\n\n')}

## ANÁLISIS REQUERIDO

Responde ÚNICAMENTE con un objeto JSON con esta estructura:

{
  "emociones_dominantes": {
    "tristeza": 0.0 - 1.0,
    "ansiedad": 0.0 - 1.0,
    "enojo": 0.0 - 1.0,
    "miedo": 0.0 - 1.0,
    "alegria": 0.0 - 1.0,
    "esperanza": 0.0 - 1.0,
    "frustracion": 0.0 - 1.0,
    "culpa": 0.0 - 1.0,
    "verguenza": 0.0 - 1.0,
    "soledad": 0.0 - 1.0
  },
  "sentimiento_promedio": -1.0 a 1.0,
  "score_bienestar": 0 a 100,
  "riesgo_suicidio": boolean,
  "nivel_urgencia": "bajo" | "medio" | "alto" | "critico",
  "temas_recurrentes": [string, string, string, string, string],
  "palabras_clave": [string, ...] (top 20),
  "resumen_clinico": string (200-300 palabras),
  "recomendaciones_terapeuta": [string, string, string]
}

## CRITERIOS DE EVALUACIÓN

**Emociones dominantes:** Intensidad de 0 (ausente) a 1 (muy intensa)

**Sentimiento promedio:**
- -1: Muy negativo
- 0: Neutral
- +1: Muy positivo

**Score de bienestar:**
- 0-25: Crisis severa
- 26-50: Malestar significativo
- 51-75: Malestar moderado
- 76-100: Bienestar adecuado

**Nivel de urgencia:**
- bajo: Sin señales de crisis
- medio: Malestar emocional considerable
- alto: Ideación suicida o crisis emocional
- critico: Riesgo inmediato

**Temas recurrentes:** Top 5 temas más mencionados

**Palabras clave:** Top 20 palabras significativas (excluir stopwords)

**Resumen clínico:** Análisis profesional para terapeuta, incluyendo:
- Estado emocional general
- Problemas principales
- Patrones identificados
- Factores de protección y riesgo

**Recomendaciones:** 3 acciones concretas para el terapeuta

IMPORTANTE: Responde SOLO con JSON válido, sin markdown ni texto adicional.
```

**Configuración Gemini:**
```typescript
{
  generationConfig: {
    temperature: 0.3,
    topP: 0.9,
    topK: 30,
    maxOutputTokens: 2048
  }
}
```

**Ejemplo de salida:**
```json
{
  "emociones_dominantes": {
    "tristeza": 0.8,
    "ansiedad": 0.6,
    "enojo": 0.3,
    "miedo": 0.5,
    "alegria": 0.1,
    "esperanza": 0.2,
    "frustracion": 0.7,
    "culpa": 0.4,
    "verguenza": 0.3,
    "soledad": 0.9
  },
  "sentimiento_promedio": -0.6,
  "score_bienestar": 35,
  "riesgo_suicidio": false,
  "nivel_urgencia": "medio",
  "temas_recurrentes": [
    "soledad",
    "problemas_laborales",
    "relaciones_familiares",
    "autoestima",
    "futuro_incierto"
  ],
  "palabras_clave": [
    "solo", "trabajo", "familia", "triste", "preocupado",
    "inseguro", "cansado", "desmotivado", "perdido", "abrumado",
    "estresado", "incomprendido", "fracaso", "miedo", "ansiedad",
    "dormir", "llorar", "difícil", "ayuda", "mejor"
  ],
  "resumen_clinico": "Usuario presenta sintomatología depresiva moderada con predominio de tristeza y soledad. Expresa frustración laboral significativa y conflictos familiares no resueltos. Muestra baja autoestima y preocupación por el futuro. Patrones de pensamiento rumiativos sobre eventos pasados. Dificultades para regular emociones negativas. No se detecta ideación suicida pero sí desesperanza moderada. Factores de protección: consciencia del problema, búsqueda de ayuda, capacidad de expresión emocional. Factores de riesgo: aislamiento social creciente, deterioro funcional laboral.",
  "recomendaciones_terapeuta": [
    "Evaluar con mayor profundidad sintomatología depresiva usando PHQ-9 actualizado",
    "Trabajar técnicas de regulación emocional (mindfulness, diario emocional)",
    "Explorar relaciones familiares y desarrollar estrategias de comunicación asertiva"
  ]
}
```

---

### 4. Reporte Semanal (`construirPromptReporteSemanal`)

**Propósito:** Generar reporte semanal para profesionales.

**Prompt:**

```
Eres un psicólogo clínico generando un reporte semanal para un colega terapeuta.

## DATOS DEL PACIENTE
- Nombre: ${datos.usuario.nombre}
- Período: ${datos.periodo_dias} días
- Fecha inicio: ${datos.fecha_inicio}
- Fecha fin: ${datos.fecha_fin}

## ACTIVIDAD
- Conversaciones: ${datos.conversaciones.total}
- Total mensajes: [calculado de análisis]

## EVALUACIONES EN EL PERÍODO
${datos.evaluaciones.phq9.length > 0 ? `
PHQ-9:
${datos.evaluaciones.phq9.map(e =>
  `- ${e.creado_en}: ${e.puntuacion}/27 (${e.severidad})`
).join('\n')}
` : 'Sin evaluaciones PHQ-9'}

${datos.evaluaciones.gad7.length > 0 ? `
GAD-7:
${datos.evaluaciones.gad7.map(e =>
  `- ${e.creado_en}: ${e.puntuacion}/21 (${e.severidad})`
).join('\n')}
` : 'Sin evaluaciones GAD-7'}

## ANÁLISIS DE CONVERSACIONES
${datos.conversaciones.analisis.map(a => `
- Score bienestar: ${a.score_bienestar}/100
- Emociones: ${Object.entries(a.emociones_dominantes)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 3)
  .map(([e, v]) => `${e} (${(v * 100).toFixed(0)}%)`)
  .join(', ')}
- Temas: ${a.temas_recurrentes.join(', ')}
`).join('\n')}

## ALERTAS
${datos.alertas.length > 0 ? `
Se generaron ${datos.alertas.length} alertas:
${datos.alertas.map(a => `- ${a.nivel_urgencia}: ${a.titulo}`).join('\n')}
` : 'Sin alertas en el período'}

## REPORTE REQUERIDO

Responde ÚNICAMENTE con un objeto JSON:

{
  "resumen_ejecutivo": string (150-200 palabras),
  "conversaciones_analizadas": number,
  "total_mensajes": number,
  "estado_emocional_actual": string (1 párrafo),
  "cambios_significativos": [string, string, string],
  "evaluaciones_resumen": {
    "phq9": {
      "puntuacion_actual": number,
      "cambio": "mejorando" | "estable" | "empeorando" | "sin_datos"
    },
    "gad7": {
      "puntuacion_actual": number,
      "cambio": "mejorando" | "estable" | "empeorando" | "sin_datos"
    }
  },
  "temas_principales": [string, string, string, string, string],
  "recomendaciones_clinicas": [string, string, string],
  "proximos_pasos": [string, string],
  "nivel_atencion_requerida": "bajo" | "medio" | "alto"
}

**Resumen ejecutivo:** Síntesis de la semana en lenguaje clínico profesional

**Estado emocional actual:** Descripción del estado emocional predominante

**Cambios significativos:** Eventos o cambios importantes detectados

**Temas principales:** Top 5 temas más relevantes

**Recomendaciones clínicas:** 3 intervenciones sugeridas

**Próximos pasos:** 2 acciones concretas para la siguiente sesión

**Nivel de atención:**
- bajo: Seguimiento rutinario
- medio: Atención frecuente recomendada
- alto: Intervención intensiva necesaria

IMPORTANTE: Responde SOLO con JSON válido.
```

**Configuración Gemini:**
```typescript
{
  generationConfig: {
    temperature: 0.4,
    topP: 0.9,
    topK: 30,
    maxOutputTokens: 2048
  }
}
```

---

### 5. Reporte Pre-Cita (`construirPromptReportePreCita`)

**Propósito:** Preparar reporte para terapeuta antes de sesión.

**Prompt similar a semanal pero con énfasis en:**
- Cambios desde última cita
- Temas urgentes para abordar
- Preparación de agenda sugerida

---

## 🔄 CÓMO ITERAR PROMPTS

### 1. Método Científico

1. **Hipótesis:** "Agregar ejemplos mejorará la detección de crisis"
2. **Experimento:** Modificar prompt con 3 ejemplos
3. **Medición:** Probar con 20 casos de prueba
4. **Análisis:** ¿Mejoró la precisión?
5. **Iteración:** Ajustar basándose en resultados

### 2. A/B Testing

```typescript
// Prompt A (control)
const promptA = "Detecta crisis..."

// Prompt B (variante)
const promptB = "Eres experto en crisis. Detecta..."

// Comparar resultados
const resultadosA = await testearPrompt(promptA, casosDePrueba)
const resultadosB = await testearPrompt(promptB, casosDePrueba)
```

### 3. Métricas de Evaluación

- **Precisión:** % de detecciones correctas
- **Recall:** % de casos reales detectados
- **F1 Score:** Balance entre precisión y recall
- **Latencia:** Tiempo de respuesta
- **Tokens:** Consumo de API

### 4. Versionado

```typescript
// En config.ts
export const PROMPT_VERSIONS = {
  'chat-v1': '2025-01-01',
  'chat-v2': '2025-01-15',  // +10% mejor engagement
  'crisis-v1': '2025-01-01',
  'crisis-v2': '2025-01-10'  // +15% precisión
}
```

---

## ✅ MEJORES PRÁCTICAS

### 1. Estructura Clara

```
# ROL
# CONTEXTO
# TAREA
# DATOS
# FORMATO DE RESPUESTA
# EJEMPLOS
# LIMITACIONES
```

### 2. Longitud Óptima

- **Chat:** 500-1000 tokens
- **Análisis:** 1000-2000 tokens
- **Reportes:** 1500-3000 tokens

### 3. Temperatura

- **Chat conversacional:** 0.7-0.9
- **Análisis clínico:** 0.2-0.4
- **Detección de crisis:** 0.1-0.2

### 4. Validación de Respuestas

```typescript
// Siempre validar formato
const respuesta = await gemini.llamar(prompt)
const json = parsearJSON(respuesta)

if (!json || !json.campo_requerido) {
  // Retry o fallback
}
```

### 5. Fallbacks

```typescript
// Si falla parseo JSON
try {
  return JSON.parse(respuesta)
} catch {
  // Extraer de markdown
  const match = respuesta.match(/```json\n([\s\S]*?)\n```/)
  if (match) return JSON.parse(match[1])

  // Fallback manual
  return { error: true, mensaje: respuesta }
}
```

---

## 🔧 TROUBLESHOOTING

### Problema: Respuestas inconsistentes

**Solución:** Bajar temperatura a 0.2-0.3

### Problema: JSON inválido

**Solución:**
1. Agregar más énfasis: "SOLO JSON, SIN MARKDOWN"
2. Proporcionar ejemplo exacto
3. Usar regex para extraer

### Problema: Respuestas muy largas

**Solución:**
1. Limitar maxOutputTokens
2. Ser más específico en la solicitud
3. Pedir resumen en lugar de detalle

### Problema: No detecta crisis

**Solución:**
1. Agregar más ejemplos de crisis
2. Listar señales específicas
3. Bajar temperatura para más precisión

---

**Última actualización:** Enero 2025
**Mantenido por:** Equipo Escuchodromo
