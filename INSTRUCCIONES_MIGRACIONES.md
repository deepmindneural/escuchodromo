# Instrucciones para Aplicar Migraciones - Escuchodromo

## ⚠️ Error Actual
```
ERROR: 42P01: relation "Cita" does not exist
```

Este error significa que las tablas de profesionales y citas no están creadas en tu base de datos.

---

## ✅ Solución: Aplicar Migraciones en Orden

### Paso 1: Verificar Estado Actual

Ejecuta este query en el SQL Editor de Supabase:
https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/sql/new

```sql
-- Verificar qué tablas ya existen
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'Usuario',
    'PerfilUsuario',
    'Cita',
    'PerfilProfesional',
    'HorarioProfesional'
  )
ORDER BY table_name;
```

**Si ves `Usuario` y `PerfilUsuario` pero NO ves `Cita`:** Continúa con el Paso 2
**Si NO ves `Usuario`:** Debes aplicar las migraciones iniciales primero

---

### Paso 2: Aplicar Migración de Profesionales y Citas

**Archivo a ejecutar:** `supabase/migrations/20250120000000_profesionales_y_citas.sql`

**Cómo hacerlo:**

1. Abre el archivo en tu editor
2. Copia TODO el contenido
3. Ve al SQL Editor de Supabase: https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/sql/new
4. Pega el contenido completo
5. Click en "Run" (botón verde)
6. Espera el mensaje: "Success. No rows returned"

**Verificar que funcionó:**
```sql
SELECT COUNT(*) as total_tablas
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'Cita',
    'PerfilProfesional',
    'HorarioProfesional',
    'DocumentoProfesional',
    'CalificacionProfesional',
    'Suscripcion'
  );
```

Deberías ver: `total_tablas: 6`

---

### Paso 3: Aplicar RLS de Profesionales

**Archivo a ejecutar:** `supabase/migrations/20250120000001_rls_profesionales_citas.sql`

1. Abre el archivo
2. Copia TODO el contenido
3. SQL Editor → Pegar → Run
4. Verificar: "Success"

---

### Paso 4: Aplicar Migraciones de Seguridad (LAS QUE CREÉ HOY)

Ahora sí puedes aplicar las 4 migraciones nuevas en orden:

#### 4.1. Encriptación PHI
**Archivo:** `supabase/migrations/20251020000000_encriptacion_phi.sql`

1. Copiar contenido
2. SQL Editor → Pegar → Run
3. Verificar tabla creada:
```sql
SELECT * FROM "NotaSesionEncriptada" LIMIT 1;
```

#### 4.2. Auditoría PHI
**Archivo:** `supabase/migrations/20251020000001_auditoria_phi.sql`

1. Copiar contenido
2. SQL Editor → Pegar → Run
3. Verificar:
```sql
SELECT * FROM "AuditoriaAccesoPHI" LIMIT 1;
```

#### 4.3. Consentimientos
**Archivo:** `supabase/migrations/20251020000002_consentimientos_granulares.sql`

1. Copiar contenido
2. SQL Editor → Pegar → Run
3. Verificar:
```sql
SELECT * FROM "ConsentimientoDetallado" LIMIT 1;
```

#### 4.4. Stripe Idempotencia
**Archivo:** `supabase/migrations/20251020000003_stripe_idempotencia.sql`

1. Copiar contenido
2. SQL Editor → Pegar → Run
3. Verificar:
```sql
SELECT * FROM "StripeEvento" LIMIT 1;
SELECT * FROM "PagoCita" LIMIT 1;
```

---

### Paso 5: Verificación Final

Ejecuta este query para confirmar que todo está listo:

```sql
-- Verificar todas las tablas críticas
SELECT
  table_name,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t.table_name)
    THEN '✅ Existe'
    ELSE '❌ Falta'
  END as estado
FROM (
  VALUES
    ('Usuario'),
    ('PerfilUsuario'),
    ('Cita'),
    ('PerfilProfesional'),
    ('HorarioProfesional'),
    ('NotaSesionEncriptada'),
    ('AuditoriaAccesoPHI'),
    ('ConsentimientoDetallado'),
    ('StripeEvento'),
    ('PagoCita')
) AS t(table_name)
ORDER BY table_name;
```

**Resultado esperado:** Todas las tablas deben mostrar "✅ Existe"

---

## 🔐 Paso 6: Configurar Variable de Encriptación

**⚠️ MUY IMPORTANTE ANTES DE USAR EN PRODUCCIÓN:**

1. Generar clave:
```bash
openssl rand -base64 32
```

2. Configurar en Supabase:
   - Ir a: https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/settings/functions
   - Click en "Secrets"
   - Agregar nuevo secret:
     - Key: `PHI_ENCRYPTION_KEY`
     - Value: <tu-clave-generada>
   - Click "Save"

3. Verificar (desde terminal):
```bash
curl https://cvezncgcdsjntzrzztrj.supabase.co/functions/v1/test \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

## 🚀 Paso 7: Desplegar Edge Functions

Una vez que las migraciones estén aplicadas:

```bash
# Si no tienes Supabase CLI instalado
npm install -g supabase

# Login
supabase login

# Link al proyecto
supabase link --project-ref cvezncgcdsjntzrzztrj

# Desplegar functions
supabase functions deploy reservar-cita
supabase functions deploy disponibilidad-profesional
supabase functions deploy progreso-paciente

# Re-desplegar webhook mejorado
supabase functions deploy webhook-stripe
```

---

## ✅ Checklist Final

- [ ] Paso 1: Verificar estado actual ✓
- [ ] Paso 2: Aplicar migración de profesionales y citas
- [ ] Paso 3: Aplicar RLS de profesionales
- [ ] Paso 4.1: Aplicar encriptación PHI
- [ ] Paso 4.2: Aplicar auditoría PHI
- [ ] Paso 4.3: Aplicar consentimientos
- [ ] Paso 4.4: Aplicar Stripe idempotencia
- [ ] Paso 5: Verificación final
- [ ] Paso 6: Configurar PHI_ENCRYPTION_KEY
- [ ] Paso 7: Desplegar Edge Functions

---

## 🆘 Troubleshooting

### "ERROR: function update_actualizado_en() does not exist"

Ejecuta primero:
```sql
CREATE OR REPLACE FUNCTION update_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### "ERROR: extension pgcrypto does not exist"

Ejecuta:
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### "ERROR: relation Usuario does not exist"

Debes aplicar las migraciones iniciales primero:
- `20250114000000_initial_schema.sql`
- `20250114000001_rls_policies.sql`

---

## 📞 Ayuda Adicional

Si tienes problemas con algún paso específico, dime en cuál y te ayudo a resolverlo.
