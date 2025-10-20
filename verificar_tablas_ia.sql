-- Verificar qué tablas de IA ya existen
SELECT
  table_name,
  CASE
    WHEN table_name IN ('AnalisisConversacion', 'ReporteSemanal', 'ReporteMensual',
                        'InsightDashboard', 'AlertaUrgente', 'LogGeminiAPI')
    THEN '✅ EXISTE'
    ELSE '❌ NO EXISTE'
  END as estado
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'AnalisisConversacion',
    'ReporteSemanal',
    'ReporteMensual',
    'InsightDashboard',
    'AlertaUrgente',
    'LogGeminiAPI'
  )
ORDER BY table_name;

-- Contar cuántas existen
SELECT COUNT(*) as tablas_existentes
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'AnalisisConversacion',
    'ReporteSemanal',
    'ReporteMensual',
    'InsightDashboard',
    'AlertaUrgente',
    'LogGeminiAPI'
  );
