/**
 * Script para poblar la base de datos con preguntas PHQ-9 y GAD-7
 * Ejecutar con: npx tsx scripts/seed-evaluaciones.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Cargar variables de entorno
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// IDs fijos para las pruebas
const PHQ9_ID = '550e8400-e29b-41d4-a716-446655440001'
const GAD7_ID = '550e8400-e29b-41d4-a716-446655440002'

const opcionesEstandar = [
  { valor: 0, texto: 'Nunca', texto_en: 'Not at all' },
  { valor: 1, texto: 'Varios días', texto_en: 'Several days' },
  { valor: 2, texto: 'Más de la mitad de los días', texto_en: 'More than half the days' },
  { valor: 3, texto: 'Casi todos los días', texto_en: 'Nearly every day' }
]

async function seedPruebas() {
  console.log('🌱 Iniciando seed de evaluaciones psicológicas...\n')

  // 1. Insertar PHQ-9
  console.log('📝 Insertando prueba PHQ-9...')
  const { error: phq9Error } = await supabase
    .from('Prueba')
    .upsert({
      id: PHQ9_ID,
      codigo: 'PHQ-9',
      nombre: 'Cuestionario de Salud del Paciente - 9',
      nombre_en: 'Patient Health Questionnaire - 9',
      descripcion: 'Evaluación de síntomas de depresión en las últimas 2 semanas. Escala validada internacionalmente para detectar y medir la severidad de la depresión.',
      descripcion_en: 'Assessment of depression symptoms over the last 2 weeks. Internationally validated scale to detect and measure the severity of depression.',
      categoria: 'Salud Mental'
    }, { onConflict: 'id' })

  if (phq9Error) {
    console.error('❌ Error al insertar PHQ-9:', phq9Error.message)
  } else {
    console.log('✅ PHQ-9 insertado correctamente')
  }

  // 2. Insertar GAD-7
  console.log('📝 Insertando prueba GAD-7...')
  const { error: gad7Error } = await supabase
    .from('Prueba')
    .upsert({
      id: GAD7_ID,
      codigo: 'GAD-7',
      nombre: 'Trastorno de Ansiedad Generalizada - 7',
      nombre_en: 'Generalized Anxiety Disorder - 7',
      descripcion: 'Evaluación de síntomas de ansiedad en las últimas 2 semanas. Escala validada para detectar y medir la severidad de la ansiedad generalizada.',
      descripcion_en: 'Assessment of anxiety symptoms over the last 2 weeks. Validated scale to detect and measure the severity of generalized anxiety.',
      categoria: 'Salud Mental'
    }, { onConflict: 'id' })

  if (gad7Error) {
    console.error('❌ Error al insertar GAD-7:', gad7Error.message)
  } else {
    console.log('✅ GAD-7 insertado correctamente')
  }

  console.log('\n')
}

async function seedPreguntasPHQ9() {
  console.log('📋 Insertando preguntas PHQ-9...')

  const preguntas = [
    'Poco interés o placer en hacer cosas',
    'Sentirse desanimado/a, deprimido/a o sin esperanza',
    'Problemas para dormir, quedarse dormido/a, o dormir demasiado',
    'Sentirse cansado/a o tener poca energía',
    'Poco apetito o comer en exceso',
    'Sentirse mal consigo mismo/a, sentir que es un fracaso, o que ha decepcionado a su familia',
    'Dificultad para concentrarse en cosas como leer el periódico o ver televisión',
    'Moverse o hablar tan lentamente que otras personas lo han notado, o estar tan inquieto/a que se mueve más de lo habitual',
    'Pensamientos de que estaría mejor muerto/a o de hacerse daño de alguna manera'
  ]

  const preguntasEn = [
    'Little interest or pleasure in doing things',
    'Feeling down, depressed, or hopeless',
    'Trouble falling or staying asleep, or sleeping too much',
    'Feeling tired or having little energy',
    'Poor appetite or overeating',
    'Feeling bad about yourself - or that you are a failure or have let yourself or your family down',
    'Trouble concentrating on things, such as reading the newspaper or watching television',
    'Moving or speaking so slowly that other people could have noticed, or the opposite - being so fidgety or restless that you have been moving around a lot more than usual',
    'Thoughts that you would be better off dead, or of hurting yourself in some way'
  ]

  for (let i = 0; i < preguntas.length; i++) {
    const { error } = await supabase
      .from('Pregunta')
      .upsert({
        prueba_id: PHQ9_ID,
        orden: i + 1,
        texto: preguntas[i],
        texto_en: preguntasEn[i],
        opciones: opcionesEstandar
      }, { onConflict: 'prueba_id,orden', ignoreDuplicates: true })

    if (error) {
      console.error(`  ❌ Error en pregunta ${i + 1}:`, error.message)
    } else {
      console.log(`  ✅ Pregunta ${i + 1} insertada`)
    }
  }

  console.log('\n')
}

async function seedPreguntasGAD7() {
  console.log('📋 Insertando preguntas GAD-7...')

  const preguntas = [
    'Sentirse nervioso/a, ansioso/a o muy alterado/a',
    'No poder parar o controlar la preocupación',
    'Preocuparse demasiado por diferentes cosas',
    'Dificultad para relajarse',
    'Estar tan inquieto/a que es difícil quedarse quieto/a',
    'Irritarse o enfadarse con facilidad',
    'Sentir miedo como si algo terrible fuera a pasar'
  ]

  const preguntasEn = [
    'Feeling nervous, anxious or on edge',
    'Not being able to stop or control worrying',
    'Worrying too much about different things',
    'Trouble relaxing',
    'Being so restless that it is hard to sit still',
    'Becoming easily annoyed or irritable',
    'Feeling afraid as if something awful might happen'
  ]

  for (let i = 0; i < preguntas.length; i++) {
    const { error } = await supabase
      .from('Pregunta')
      .upsert({
        prueba_id: GAD7_ID,
        orden: i + 1,
        texto: preguntas[i],
        texto_en: preguntasEn[i],
        opciones: opcionesEstandar
      }, { onConflict: 'prueba_id,orden', ignoreDuplicates: true })

    if (error) {
      console.error(`  ❌ Error en pregunta ${i + 1}:`, error.message)
    } else {
      console.log(`  ✅ Pregunta ${i + 1} insertada`)
    }
  }

  console.log('\n')
}

async function verificar() {
  console.log('🔍 Verificando datos insertados...\n')

  // Contar preguntas PHQ-9
  const { count: phq9Count, error: phq9CountError } = await supabase
    .from('Pregunta')
    .select('*', { count: 'exact', head: true })
    .eq('prueba_id', PHQ9_ID)

  if (phq9CountError) {
    console.error('❌ Error al contar PHQ-9:', phq9CountError.message)
  } else {
    console.log(`✅ PHQ-9: ${phq9Count} preguntas insertadas (esperadas: 9)`)
  }

  // Contar preguntas GAD-7
  const { count: gad7Count, error: gad7CountError } = await supabase
    .from('Pregunta')
    .select('*', { count: 'exact', head: true })
    .eq('prueba_id', GAD7_ID)

  if (gad7CountError) {
    console.error('❌ Error al contar GAD-7:', gad7CountError.message)
  } else {
    console.log(`✅ GAD-7: ${gad7Count} preguntas insertadas (esperadas: 7)`)
  }

  console.log('\n✨ Seed completado exitosamente!\n')
}

// Ejecutar seed
async function main() {
  try {
    await seedPruebas()
    await seedPreguntasPHQ9()
    await seedPreguntasGAD7()
    await verificar()
  } catch (error) {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  }
}

main()
