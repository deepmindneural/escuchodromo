-- ==========================================
-- PASO 1: VERIFICAR QUÉ TABLAS EXISTEN
-- Ejecutar primero este SQL en Supabase
-- ==========================================

-- Ver todas las tablas en el schema public
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Ver columnas de cada tabla (si existen)
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
