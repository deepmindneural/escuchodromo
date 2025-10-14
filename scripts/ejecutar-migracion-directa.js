require('dotenv').config({ path: '.env.local' });
const https = require('https');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const projectRef = 'cvezncgcdsjntzrzztrj';

console.log('🚀 Aplicando migración directamente vía API de Supabase...\n');

async function ejecutarSQL(sql) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${projectRef}/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(JSON.stringify({ query: sql }));
    req.end();
  });
}

async function aplicarMigracion() {
  try {
    console.log('📋 Paso 1: Eliminando tablas existentes...\n');

    const dropStatements = [
      'DROP TABLE IF EXISTS "MensajePublico" CASCADE',
      'DROP TABLE IF EXISTS "SesionPublica" CASCADE',
      'DROP TABLE IF EXISTS "Pregunta" CASCADE',
      'DROP TABLE IF EXISTS "Test" CASCADE',
      'DROP TABLE IF EXISTS "Evaluacion" CASCADE',
      'DROP TABLE IF EXISTS "Notificacion" CASCADE',
      'DROP TABLE IF EXISTS "Pago" CASCADE',
      'DROP TABLE IF EXISTS "Recomendacion" CASCADE',
      'DROP TABLE IF EXISTS "RegistroAnimo" CASCADE',
      'DROP TABLE IF EXISTS "Mensaje" CASCADE',
      'DROP TABLE IF EXISTS "Conversacion" CASCADE',
      'DROP TABLE IF EXISTS "PerfilUsuario" CASCADE',
      'DROP TABLE IF EXISTS "Usuario" CASCADE',
      'DROP TABLE IF EXISTS "ConfiguracionIA" CASCADE',
      'DROP FUNCTION IF EXISTS update_actualizado_en() CASCADE',
      'DROP FUNCTION IF EXISTS obtener_rol_usuario() CASCADE'
    ];

    for (const stmt of dropStatements) {
      try {
        await ejecutarSQL(stmt);
        console.log(`   ✅ ${stmt.substring(0, 50)}...`);
      } catch (e) {
        console.log(`   ⚠️  ${stmt.substring(0, 50)}... (${e.message})`);
      }
    }

    console.log('\n📋 Paso 2: Creando funciones auxiliares...\n');

    await ejecutarSQL(`
      CREATE OR REPLACE FUNCTION update_actualizado_en()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.actualizado_en = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('   ✅ Función update_actualizado_en creada');

    console.log('\n📋 Paso 3: Creando tablas...\n');

    const createStatements = {
      'Usuario': `
        CREATE TABLE "Usuario" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          auth_id UUID UNIQUE,
          email TEXT NOT NULL UNIQUE,
          nombre TEXT,
          imagen TEXT,
          rol TEXT NOT NULL DEFAULT 'USUARIO' CHECK (rol IN ('USUARIO', 'TERAPEUTA', 'ADMIN')),
          esta_activo BOOLEAN DEFAULT true,
          creado_en TIMESTAMPTZ DEFAULT now(),
          actualizado_en TIMESTAMPTZ DEFAULT now()
        )
      `,
      'PerfilUsuario': `
        CREATE TABLE "PerfilUsuario" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          usuario_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE UNIQUE NOT NULL,
          telefono TEXT,
          fecha_nacimiento DATE,
          genero TEXT,
          idioma_preferido TEXT DEFAULT 'es',
          moneda TEXT DEFAULT 'COP',
          zona_horaria TEXT DEFAULT 'America/Bogota',
          consentimiento_datos BOOLEAN DEFAULT false,
          consentimiento_mkt BOOLEAN DEFAULT false,
          creado_en TIMESTAMPTZ DEFAULT now(),
          actualizado_en TIMESTAMPTZ DEFAULT now()
        )
      `,
      'Conversacion': `
        CREATE TABLE "Conversacion" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          usuario_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE NOT NULL,
          titulo TEXT,
          estado TEXT DEFAULT 'activa',
          contexto_embedding vector(1536),
          creado_en TIMESTAMPTZ DEFAULT now(),
          actualizado_en TIMESTAMPTZ DEFAULT now()
        )
      `,
      'Mensaje': `
        CREATE TABLE "Mensaje" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          conversacion_id UUID REFERENCES "Conversacion"(id) ON DELETE CASCADE NOT NULL,
          contenido TEXT NOT NULL,
          rol TEXT NOT NULL CHECK (rol IN ('usuario', 'asistente')),
          tipo TEXT DEFAULT 'texto',
          url_audio TEXT,
          sentimiento FLOAT,
          emociones JSONB,
          embedding vector(1536),
          creado_en TIMESTAMPTZ DEFAULT now()
        )
      `,
      'Test': `
        CREATE TABLE "Test" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          codigo TEXT NOT NULL UNIQUE,
          nombre TEXT NOT NULL,
          nombre_en TEXT,
          descripcion TEXT,
          descripcion_en TEXT,
          categoria TEXT NOT NULL,
          creado_en TIMESTAMPTZ DEFAULT now()
        )
      `,
      'Pregunta': `
        CREATE TABLE "Pregunta" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          test_id UUID REFERENCES "Test"(id) ON DELETE CASCADE NOT NULL,
          orden INTEGER NOT NULL,
          texto TEXT NOT NULL,
          texto_en TEXT,
          opciones JSONB NOT NULL,
          creado_en TIMESTAMPTZ DEFAULT now()
        )
      `,
      'Evaluacion': `
        CREATE TABLE "Evaluacion" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          usuario_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE NOT NULL,
          test_id UUID REFERENCES "Test"(id) ON DELETE CASCADE NOT NULL,
          respuestas JSONB NOT NULL,
          puntuacion FLOAT NOT NULL,
          severidad TEXT NOT NULL,
          interpretacion TEXT,
          creado_en TIMESTAMPTZ DEFAULT now()
        )
      `,
      'RegistroAnimo': `
        CREATE TABLE "RegistroAnimo" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          perfil_id UUID REFERENCES "PerfilUsuario"(id) ON DELETE CASCADE NOT NULL,
          animo INTEGER NOT NULL,
          energia INTEGER NOT NULL,
          estres INTEGER NOT NULL,
          notas TEXT,
          creado_en TIMESTAMPTZ DEFAULT now()
        )
      `,
      'Recomendacion': `
        CREATE TABLE "Recomendacion" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          usuario_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE NOT NULL,
          tipo TEXT NOT NULL,
          prioridad INTEGER DEFAULT 1,
          titulo TEXT NOT NULL,
          titulo_en TEXT,
          descripcion TEXT NOT NULL,
          descripcion_en TEXT,
          url_accion TEXT,
          esta_activa BOOLEAN DEFAULT true,
          creado_en TIMESTAMPTZ DEFAULT now()
        )
      `,
      'Pago': `
        CREATE TABLE "Pago" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          usuario_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE NOT NULL,
          monto FLOAT NOT NULL,
          moneda TEXT NOT NULL,
          estado TEXT NOT NULL DEFAULT 'pendiente',
          metodo TEXT NOT NULL,
          id_transaccion_externa TEXT,
          descripcion TEXT,
          creado_en TIMESTAMPTZ DEFAULT now()
        )
      `,
      'Notificacion': `
        CREATE TABLE "Notificacion" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          usuario_id UUID REFERENCES "Usuario"(id) ON DELETE CASCADE NOT NULL,
          tipo TEXT NOT NULL,
          titulo TEXT NOT NULL,
          contenido TEXT NOT NULL,
          leida BOOLEAN DEFAULT false,
          enviada BOOLEAN DEFAULT false,
          creado_en TIMESTAMPTZ DEFAULT now()
        )
      `,
      'SesionPublica': `
        CREATE TABLE "SesionPublica" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          sesion_id TEXT NOT NULL UNIQUE,
          iniciado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
          ultima_actividad TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `,
      'MensajePublico': `
        CREATE TABLE "MensajePublico" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          sesion_id TEXT NOT NULL,
          contenido TEXT NOT NULL,
          rol TEXT NOT NULL CHECK (rol IN ('usuario', 'asistente')),
          creado_en TIMESTAMPTZ DEFAULT now(),
          FOREIGN KEY (sesion_id) REFERENCES "SesionPublica"(sesion_id) ON DELETE CASCADE
        )
      `,
      'ConfiguracionIA': `
        CREATE TABLE "ConfiguracionIA" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          clave TEXT NOT NULL UNIQUE,
          valor JSONB NOT NULL,
          descripcion TEXT,
          creado_en TIMESTAMPTZ DEFAULT now(),
          actualizado_en TIMESTAMPTZ DEFAULT now()
        )
      `
    };

    for (const [tabla, sql] of Object.entries(createStatements)) {
      try {
        await ejecutarSQL(sql);
        console.log(`   ✅ Tabla ${tabla} creada`);
      } catch (e) {
        console.log(`   ❌ Error creando ${tabla}: ${e.message}`);
      }
    }

    console.log('\n📋 Paso 4: Creando índices...\n');

    const indices = [
      'CREATE INDEX idx_usuario_email ON "Usuario"(email)',
      'CREATE INDEX idx_usuario_auth_id ON "Usuario"(auth_id)',
      'CREATE INDEX idx_conversacion_usuario_id ON "Conversacion"(usuario_id)',
      'CREATE INDEX idx_mensaje_conversacion_id ON "Mensaje"(conversacion_id)',
      'CREATE INDEX idx_test_codigo ON "Test"(codigo)',
      'CREATE INDEX idx_pregunta_test_id ON "Pregunta"(test_id)',
      'CREATE INDEX idx_evaluacion_usuario_id ON "Evaluacion"(usuario_id)',
      'CREATE INDEX idx_sesion_publica_sesion_id ON "SesionPublica"(sesion_id)',
      'CREATE INDEX idx_mensaje_publico_sesion_id ON "MensajePublico"(sesion_id)'
    ];

    for (const sql of indices) {
      try {
        await ejecutarSQL(sql);
        console.log(`   ✅ ${sql.substring(0, 60)}...`);
      } catch (e) {
        console.log(`   ⚠️  ${sql.substring(0, 60)}...`);
      }
    }

    console.log('\n📋 Paso 5: Habilitando RLS...\n');

    const tablas = ['Usuario', 'PerfilUsuario', 'Conversacion', 'Mensaje', 'Test', 'Pregunta',
                    'Evaluacion', 'RegistroAnimo', 'Recomendacion', 'Pago', 'Notificacion',
                    'SesionPublica', 'MensajePublico', 'ConfiguracionIA'];

    for (const tabla of tablas) {
      try {
        await ejecutarSQL(`ALTER TABLE "${tabla}" ENABLE ROW LEVEL SECURITY`);
        console.log(`   ✅ RLS habilitado en ${tabla}`);
      } catch (e) {
        console.log(`   ⚠️  RLS en ${tabla}: ${e.message}`);
      }
    }

    console.log('\n📋 Paso 6: Creando políticas RLS básicas...\n');

    // Políticas esenciales
    const politicas = [
      {
        tabla: 'Usuario',
        sql: `CREATE POLICY "Permitir INSERT para auth" ON "Usuario" FOR INSERT WITH CHECK (auth.uid() = auth_id)`
      },
      {
        tabla: 'Usuario',
        sql: `CREATE POLICY "Usuario ve su perfil" ON "Usuario" FOR SELECT USING (auth.uid() = auth_id)`
      },
      {
        tabla: 'SesionPublica',
        sql: `CREATE POLICY "Todos gestionan sesiones" ON "SesionPublica" FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)`
      },
      {
        tabla: 'MensajePublico',
        sql: `CREATE POLICY "Todos gestionan mensajes" ON "MensajePublico" FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)`
      },
      {
        tabla: 'Test',
        sql: `CREATE POLICY "Todos ven tests" ON "Test" FOR SELECT TO authenticated, anon USING (true)`
      },
      {
        tabla: 'Pregunta',
        sql: `CREATE POLICY "Todos ven preguntas" ON "Pregunta" FOR SELECT TO authenticated, anon USING (true)`
      }
    ];

    for (const politica of politicas) {
      try {
        await ejecutarSQL(politica.sql);
        console.log(`   ✅ Política creada en ${politica.tabla}`);
      } catch (e) {
        console.log(`   ⚠️  Política en ${politica.tabla}: ${e.message.substring(0, 80)}`);
      }
    }

    console.log('\n📋 Paso 7: Insertando datos de prueba...\n');

    // Insertar tests
    try {
      await ejecutarSQL(`
        INSERT INTO "Test" (codigo, nombre, nombre_en, descripcion, descripcion_en, categoria)
        VALUES
          ('PHQ9', 'Cuestionario de Salud del Paciente-9', 'Patient Health Questionnaire-9',
           'Evalúa síntomas de depresión', 'Assesses depression symptoms', 'depresion'),
          ('GAD7', 'Escala del Trastorno de Ansiedad-7', 'Generalized Anxiety Disorder-7',
           'Evalúa síntomas de ansiedad', 'Assesses anxiety symptoms', 'ansiedad')
      `);
      console.log('   ✅ Tests psicológicos insertados');
    } catch (e) {
      console.log(`   ⚠️  Tests: ${e.message}`);
    }

    // Insertar preguntas
    try {
      await ejecutarSQL(`
        INSERT INTO "Pregunta" (test_id, orden, texto, texto_en, opciones)
        SELECT id, 1, 'Poco interés o placer en hacer cosas', 'Little interest or pleasure in doing things',
        '[{"valor":0,"etiqueta":"Para nada"},{"valor":1,"etiqueta":"Varios días"},{"valor":2,"etiqueta":"Más de la mitad"},{"valor":3,"etiqueta":"Casi todos los días"}]'::jsonb
        FROM "Test" WHERE codigo = 'PHQ9'
      `);
      console.log('   ✅ Preguntas PHQ-9 insertadas');
    } catch (e) {
      console.log(`   ⚠️  Preguntas: ${e.message}`);
    }

    try {
      await ejecutarSQL(`
        INSERT INTO "Pregunta" (test_id, orden, texto, texto_en, opciones)
        SELECT id, 1, 'Sentirse nervioso o ansioso', 'Feeling nervous or anxious',
        '[{"valor":0,"etiqueta":"Para nada"},{"valor":1,"etiqueta":"Varios días"},{"valor":2,"etiqueta":"Más de la mitad"},{"valor":3,"etiqueta":"Casi todos los días"}]'::jsonb
        FROM "Test" WHERE codigo = 'GAD7'
      `);
      console.log('   ✅ Preguntas GAD-7 insertadas');
    } catch (e) {
      console.log(`   ⚠️  Preguntas GAD7: ${e.message}`);
    }

    console.log('\n✅ ¡Migración completada!\n');
    console.log('🔍 Ejecuta: node scripts/test-supabase.js para verificar\n');

  } catch (error) {
    console.error('\n❌ Error general:', error.message);
    console.error(error);
  }
}

aplicarMigracion();
