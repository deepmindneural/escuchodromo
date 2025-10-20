# GUÍA PASO A PASO: APLICAR MIGRACIONES DE ESCUCHODROMO

## Estado Actual

**Tablas existentes (7):**
- ✅ Usuario
- ✅ PerfilUsuario
- ✅ Evaluacion
- ✅ Mensaje
- ✅ Conversacion
- ✅ Pago
- ✅ Suscripcion

**Tablas faltantes (10):**
- ❌ PerfilProfesional
- ❌ DocumentoProfesional
- ❌ HorarioProfesional
- ❌ Cita
- ❌ CalificacionProfesional
- ❌ NotaSesionEncriptada
- ❌ AuditoriaAccesoPHI
- ❌ ConsentimientoDetallado
- ❌ StripeEvento
- ❌ PagoCita

---

## PASO 1: Crear las 10 Tablas Faltantes

### Instrucciones:

1. **Abre el SQL Editor de Supabase:**
   - URL: https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/sql/new
   - (Ya debería estar abierto en tu navegador)

2. **Copia el contenido del archivo:**
   - `supabase/CREAR_TABLAS_FALTANTES.sql`

3. **Pega el contenido completo en el SQL Editor**

4. **Click en el botón RUN**

5. **Verifica que veas el mensaje:**
   ```
   ✅ 10 TABLAS CREADAS EXITOSAMENTE
   ```

### ¿Qué hace este script?

Crea las 10 tablas en el orden correcto para evitar errores de dependencias:
1. PerfilProfesional (depende de Usuario)
2. DocumentoProfesional (depende de PerfilProfesional)
3. HorarioProfesional (depende de PerfilProfesional)
4. Cita (depende de Usuario y PerfilProfesional)
5. CalificacionProfesional (depende de Cita)
6. NotaSesionEncriptada (depende de Cita)
7. AuditoriaAccesoPHI (depende de Usuario)
8. ConsentimientoDetallado (depende de Usuario)
9. StripeEvento (tabla independiente)
10. PagoCita (depende de Cita y Usuario)

---

## PASO 2: Verificar que Todas las Tablas Existen

Ejecuta el siguiente script de verificación:

```sql
-- Copiar y pegar este código en el SQL Editor

DO $$
DECLARE
  v_tablas_esperadas TEXT[] := ARRAY[
    'Usuario', 'PerfilUsuario', 'Evaluacion', 'Mensaje', 'Conversacion',
    'Pago', 'Suscripcion', 'PerfilProfesional', 'DocumentoProfesional',
    'HorarioProfesional', 'Cita', 'CalificacionProfesional',
    'NotaSesionEncriptada', 'AuditoriaAccesoPHI', 'ConsentimientoDetallado',
    'StripeEvento', 'PagoCita'
  ];
  v_tabla TEXT;
  v_existe BOOLEAN;
  v_total_existen INTEGER := 0;
  v_total_faltan INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICACIÓN DE TABLAS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  FOREACH v_tabla IN ARRAY v_tablas_esperadas
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = v_tabla
    ) INTO v_existe;

    IF v_existe THEN
      RAISE NOTICE '✅ % - EXISTE', RPAD(v_tabla, 30);
      v_total_existen := v_total_existen + 1;
    ELSE
      RAISE NOTICE '❌ % - FALTA', RPAD(v_tabla, 30);
      v_total_faltan := v_total_faltan + 1;
    END IF;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RESUMEN: % de % tablas existen', v_total_existen, array_length(v_tablas_esperadas, 1);

  IF v_total_faltan = 0 THEN
    RAISE NOTICE '✅ TODAS LAS TABLAS ESTÁN CREADAS';
    RAISE NOTICE 'Puedes continuar con el Paso 3';
  ELSE
    RAISE NOTICE '❌ FALTAN % TABLAS', v_total_faltan;
    RAISE NOTICE 'Revisa el Paso 1';
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;
```

**Deberías ver:**
```
✅ TODAS LAS TABLAS ESTÁN CREADAS
Puedes continuar con el Paso 3
```

---

## PASO 3: Aplicar Políticas RLS (Row Level Security)

1. **Abre el archivo:**
   - `supabase/migrations/20250120000001_rls_profesionales_citas.sql`

2. **Copia y pega su contenido en el SQL Editor**

3. **Click en RUN**

### ¿Qué hace este script?

- Habilita RLS en todas las tablas nuevas
- Crea políticas para que:
  - Los usuarios solo vean sus propios datos
  - Los terapeutas vean sus pacientes
  - Los admins vean todo
  - Se respete la privacidad HIPAA

---

## PASO 4: Aplicar Migraciones de Seguridad

Ejecuta **EN ORDEN** los siguientes scripts:

### 4.1. Encriptación PHI

```bash
Archivo: supabase/migrations/20251020000000_encriptacion_phi.sql
```

**Funciones que crea:**
- `encriptar_nota_sesion()` - Encripta notas con AES-256
- `desencriptar_nota_sesion()` - Desencripta notas
- Agrega columnas encriptadas a Mensaje y Resultado

### 4.2. Auditoría PHI

```bash
Archivo: supabase/migrations/20251020000001_auditoria_phi.sql
```

**Funciones que crea:**
- `registrar_acceso_phi()` - Registra todos los accesos a PHI
- `detectar_accesos_sospechosos()` - Detecta patrones anómalos
- Vistas de auditoría y reportes

### 4.3. Consentimientos Granulares

```bash
Archivo: supabase/migrations/20251020000002_consentimientos_granulares.sql
```

**Funciones que crea:**
- `verificar_consentimiento()` - Valida si el usuario dio consentimiento
- `otorgar_consentimiento()` - Registra nuevo consentimiento
- `revocar_consentimiento()` - Revoca consentimiento
- `consentimientos_proximos_vencer()` - Alerta de vencimientos

### 4.4. Stripe Idempotencia

```bash
Archivo: supabase/migrations/20251020000003_stripe_idempotencia.sql
```

**Funciones que crea:**
- `registrar_stripe_evento()` - Previene duplicados
- `procesar_pago_cita()` - Procesa pagos de manera segura

**IMPORTANTE:** Para cada script:
1. Abre el archivo
2. Copia TODO el contenido
3. Pega en SQL Editor
4. Click en RUN
5. Espera el mensaje de éxito

---

## PASO 5: Configurar Variable de Encriptación

### En Supabase Dashboard:

1. Ve a **Settings** → **Secrets**
   - URL: https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/settings/vault

2. Click en **New Secret**

3. Agrega:
   ```
   Nombre: PHI_ENCRYPTION_KEY
   Valor: [generar con el comando de abajo]
   ```

### Generar la clave:

En tu terminal local:
```bash
openssl rand -base64 32
```

Copia el resultado y úsalo como valor de `PHI_ENCRYPTION_KEY`

**⚠️ CRÍTICO:**
- Esta clave encripta datos médicos sensibles
- NUNCA la compartas
- NUNCA la commits a Git
- Guárdala en un gestor de contraseñas seguro

---

## PASO 6: Desplegar Edge Functions

### 6.1. Verificar que las Edge Functions existen:

```bash
ls -la supabase/functions/
```

Deberías ver:
- ✅ reservar-cita/
- ✅ disponibilidad-profesional/
- ✅ progreso-paciente/
- ✅ webhook-stripe/

### 6.2. Desplegar todas las funciones:

```bash
cd /Volumes/StarkT7/Proyectos/CLIENETS/proyectos/ESCUCHODROMO/Escuchodromo\ 2/escuchodromo

npx supabase functions deploy reservar-cita
npx supabase functions deploy disponibilidad-profesional
npx supabase functions deploy progreso-paciente
npx supabase functions deploy webhook-stripe
```

### 6.3. Configurar secrets para las funciones:

```bash
# Para webhook de Stripe
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_tu_webhook_secret_aqui
npx supabase secrets set PHI_ENCRYPTION_KEY=$(openssl rand -base64 32)
```

---

## PASO 7: Verificación Final

Ejecuta este script SQL para verificar que todo está en orden:

```sql
-- Verificar tablas
SELECT COUNT(*) as total_tablas
FROM information_schema.tables
WHERE table_schema = 'public';
-- Debería ser >= 17

-- Verificar funciones de encriptación
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'encriptar_nota_sesion',
    'desencriptar_nota_sesion',
    'registrar_acceso_phi',
    'verificar_consentimiento',
    'registrar_stripe_evento'
  );
-- Deberían aparecer las 5 funciones

-- Verificar RLS habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'Cita', 'PerfilProfesional', 'NotaSesionEncriptada'
  );
-- rowsecurity debería ser 't' (true) para todas

-- Verificar políticas RLS
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
-- Deberían haber múltiples políticas
```

---

## Checklist Final

- [ ] **Paso 1:** 10 tablas creadas
- [ ] **Paso 2:** Verificación exitosa (17 tablas totales)
- [ ] **Paso 3:** RLS aplicado
- [ ] **Paso 4:** 4 migraciones de seguridad aplicadas
- [ ] **Paso 5:** PHI_ENCRYPTION_KEY configurada
- [ ] **Paso 6:** Edge Functions desplegadas
- [ ] **Paso 7:** Verificación final exitosa

---

## ¿Problemas?

### Error: "relation already exists"
✅ **Solución:** La tabla ya fue creada. Ignora el error.

### Error: "function already exists"
✅ **Solución:** Usa `CREATE OR REPLACE FUNCTION` en lugar de `CREATE FUNCTION`

### Error: "foreign key constraint"
❌ **Problema:** Las tablas se están creando en el orden incorrecto.
✅ **Solución:** Usa el script `CREAR_TABLAS_FALTANTES.sql` que ya tiene el orden correcto.

### Error de conexión al desplegar Edge Functions
✅ **Solución:**
```bash
npx supabase login
npx supabase link --project-ref cvezncgcdsjntzrzztrj
```

---

## Próximos Pasos (Post-Migración)

1. **Implementar Interfaces Frontend:**
   - Calendario de reservas
   - Dashboard del profesional
   - Visualización de progreso

2. **Configurar Stripe Webhook:**
   - URL: `https://cvezncgcdsjntzrzztrj.supabase.co/functions/v1/webhook-stripe`
   - Eventos: `checkout.session.completed`, `payment_intent.succeeded`

3. **Pruebas de Seguridad:**
   - Verificar que el encriptado funciona
   - Probar auditoría de accesos
   - Validar consentimientos

4. **Monitoreo:**
   - Revisar logs de auditoría
   - Configurar alertas de accesos sospechosos
   - Monitorear tasas de error en Edge Functions

---

## Contacto y Soporte

Si encuentras errores durante la migración:
1. Copia el mensaje de error completo
2. Indica en qué paso estabas
3. Proporciona los logs si están disponibles

**¡Éxito con las migraciones!** 🚀
