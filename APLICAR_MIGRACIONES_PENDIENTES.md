# 🗄️ Migraciones SQL Pendientes

## 📋 Estado Actual

Ya aplicadas manualmente:
- ✅ 10 tablas creadas (CREAR_TABLAS_FALTANTES.sql)
- ✅ 9 funciones de seguridad (APLICAR_FUNCIONES_SEGURIDAD.sql)
- ✅ RLS habilitado en 5 tablas críticas (HABILITAR_RLS_FALTANTE.sql)
- ✅ 4 migraciones de seguridad base

---

## ⏳ Pendientes de Aplicar

### 1. Rate Limiting para Registro de Profesionales

**Archivo:** `supabase/migrations/20251020000004_rate_limiting_registro.sql`

**Qué hace:**
- Crea tabla `RegistroAttempts` para tracking de intentos
- Limita registros a 3 por IP cada 24 horas
- Previene spam y abuse

**Cómo aplicar:**

#### Opción A: SQL Editor (Recomendado)
```
1. Ir a: https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/sql/new
2. Abrir el archivo: supabase/migrations/20251020000004_rate_limiting_registro.sql
3. Copiar TODO el contenido
4. Pegar en SQL Editor
5. Click en RUN
```

#### Opción B: Supabase CLI
```bash
npx supabase db push
```

---

### 2. Storage para Documentos de Profesionales

**Archivo:** `supabase/migrations/20251020000005_storage_registro_profesional.sql`

**Qué hace:**
- Crea bucket `documentos-profesionales` (private)
- Configura RLS policies para subida y lectura
- Solo el profesional puede ver sus propios documentos
- Admins pueden ver todos

**Cómo aplicar:**

#### Opción A: SQL Editor
```
1. Ir a: https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/sql/new
2. Abrir el archivo: supabase/migrations/20251020000005_storage_registro_profesional.sql
3. Copiar TODO el contenido
4. Pegar en SQL Editor
5. Click en RUN
```

#### Opción B: Supabase CLI
```bash
npx supabase db push
```

---

### 3. Sistema de Análisis con IA (Opcional - si usarás las funciones de IA)

**Archivo:** `supabase/migrations/20250121000001_ia_analytics_safe.sql`

**Qué hace:**
- Crea 3 tablas para analytics de IA:
  - `AnalisisConversacion`: Resultados de análisis post-chat
  - `AlertaUrgente`: Alertas de crisis detectadas
  - `ReporteClinico`: Reportes generados automáticamente
- Índices optimizados para queries frecuentes
- RLS habilitado en todas

**Cómo aplicar:**

```
1. Ir a: https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/sql/new
2. Abrir el archivo: supabase/migrations/20250121000001_ia_analytics_safe.sql
3. Copiar TODO el contenido
4. Pegar en SQL Editor
5. Click en RUN
```

---

## 🔍 Verificar Migraciones Aplicadas

Después de aplicar cada migración, verifica con:

```sql
-- Ver todas las tablas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Ver si RLS está habilitado
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Contar políticas RLS
SELECT
  schemaname,
  tablename,
  COUNT(*) as num_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;
```

---

## 📊 Estado Esperado Después de Todas las Migraciones

### Tablas Totales
- **Base:** 18 tablas
- **Rate Limiting:** +1 tabla (RegistroAttempts)
- **Storage:** Bucket (no es tabla, es storage)
- **IA Analytics:** +3 tablas (AnalisisConversacion, AlertaUrgente, ReporteClinico)
- **Total:** 22 tablas

### Funciones de Base de Datos
- **9** funciones de seguridad (encriptación, auditoría, consentimientos, Stripe)

### RLS
- **Mínimo:** 16 tablas con RLS habilitado
- **Políticas:** 78+ políticas RLS

### Storage Buckets
- **1** bucket: `documentos-profesionales` (private)

---

## ⚠️ IMPORTANTE: Orden de Ejecución

**Ejecuta las migraciones EN ORDEN:**

1. ✅ Ya aplicadas (base de datos core)
2. 🔄 **20251020000004_rate_limiting_registro.sql** ← SIGUIENTE
3. 🔄 **20251020000005_storage_registro_profesional.sql** ← DESPUÉS
4. 🔄 **20250121000001_ia_analytics_safe.sql** ← OPCIONAL (solo si usas IA)

---

## 🧪 Testing Post-Migración

### Test 1: Verificar tabla RegistroAttempts
```sql
SELECT * FROM "RegistroAttempts" LIMIT 1;
```

### Test 2: Verificar bucket de storage
```sql
SELECT * FROM storage.buckets WHERE name = 'documentos-profesionales';
```

### Test 3: Verificar tablas de IA (si aplicaste la migración)
```sql
SELECT COUNT(*) FROM "AnalisisConversacion";
SELECT COUNT(*) FROM "AlertaUrgente";
SELECT COUNT(*) FROM "ReporteClinico";
```

---

## 🔧 Troubleshooting

### Error: "relation already exists"
- **Causa:** La migración ya fue aplicada
- **Solución:** Salta esa migración o verifica con queries de verificación

### Error: "bucket already exists"
- **Causa:** El bucket ya fue creado
- **Solución:** Es seguro ignorar, el bucket ya existe

### Error: "permission denied"
- **Causa:** No tienes permisos para crear storage buckets
- **Solución:**
  1. Ve a Supabase Dashboard → Storage
  2. Crea el bucket manualmente:
     - Name: `documentos-profesionales`
     - Public: NO (private)
  3. Luego aplica solo las políticas RLS del archivo SQL

### Verificar si una migración ya fue aplicada
```sql
-- Ver historial de migraciones (si usaste supabase db push)
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC;
```

---

## 🎯 Comandos Rápidos

```bash
# Ver estado actual de la base de datos
npx supabase db diff

# Aplicar TODAS las migraciones pendientes
npx supabase db push

# Ver migraciones aplicadas
npx supabase migration list

# Crear nueva migración (si necesitas hacer cambios)
npx supabase migration new nombre-de-la-migracion
```

---

## 📝 Resumen

**Migraciones pendientes:** 2-3 (dependiendo si usas IA)

**Tiempo estimado:**
- Rate Limiting: 1 minuto
- Storage: 2 minutos
- IA Analytics: 2 minutos
- **Total:** ~5 minutos

**Impacto:**
- ✅ Previene spam en registro de profesionales
- ✅ Almacenamiento seguro de documentos
- ✅ Analytics avanzados con IA (opcional)

---

**Última actualización:** 2025-10-20
