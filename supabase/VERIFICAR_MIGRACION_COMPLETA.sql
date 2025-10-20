-- ==========================================
-- VERIFICACIÓN COMPLETA DE MIGRACIONES
-- ==========================================
-- Ejecuta este script después de aplicar todas las migraciones
-- para confirmar que todo está correctamente implementado
-- ==========================================

-- ==========================================
-- 1. VERIFICAR TODAS LAS TABLAS
-- ==========================================
DO $$
DECLARE
  v_tablas_esperadas TEXT[] := ARRAY[
    'Usuario', 'PerfilUsuario', 'Evaluacion', 'Resultado',
    'Mensaje', 'Conversacion', 'Pago', 'Suscripcion',
    'PerfilProfesional', 'DocumentoProfesional', 'HorarioProfesional',
    'Cita', 'CalificacionProfesional', 'NotaSesionEncriptada',
    'AuditoriaAccesoPHI', 'ConsentimientoDetallado', 'StripeEvento', 'PagoCita'
  ];
  v_tabla TEXT;
  v_existe BOOLEAN;
  v_total_existen INTEGER := 0;
  v_total_faltan INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '1. VERIFICACIÓN DE TABLAS (18 esperadas)';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  FOREACH v_tabla IN ARRAY v_tablas_esperadas
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = v_tabla
    ) INTO v_existe;

    IF v_existe THEN
      RAISE NOTICE '✅ %', RPAD(v_tabla, 30);
      v_total_existen := v_total_existen + 1;
    ELSE
      RAISE NOTICE '❌ % - FALTA', RPAD(v_tabla, 30);
      v_total_faltan := v_total_faltan + 1;
    END IF;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE 'Resultado: %/% tablas existen', v_total_existen, array_length(v_tablas_esperadas, 1);

  IF v_total_faltan = 0 THEN
    RAISE NOTICE '✅ TODAS LAS TABLAS CREADAS CORRECTAMENTE';
  ELSE
    RAISE NOTICE '❌ FALTAN % TABLAS - Revisar migraciones', v_total_faltan;
  END IF;

  RAISE NOTICE '';
END $$;

-- ==========================================
-- 2. VERIFICAR FUNCIONES DE ENCRIPTACIÓN
-- ==========================================
DO $$
DECLARE
  v_funciones_esperadas TEXT[] := ARRAY[
    'update_actualizado_en',
    'encriptar_nota_sesion',
    'desencriptar_nota_sesion',
    'registrar_acceso_phi',
    'detectar_accesos_sospechosos',
    'verificar_consentimiento',
    'otorgar_consentimiento',
    'revocar_consentimiento',
    'consentimientos_proximos_vencer',
    'registrar_stripe_evento',
    'procesar_pago_cita'
  ];
  v_funcion TEXT;
  v_existe BOOLEAN;
  v_total_existen INTEGER := 0;
  v_total_faltan INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '2. VERIFICACIÓN DE FUNCIONES (11 esperadas)';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  FOREACH v_funcion IN ARRAY v_funciones_esperadas
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM information_schema.routines
      WHERE routine_schema = 'public' AND routine_name = v_funcion
    ) INTO v_existe;

    IF v_existe THEN
      RAISE NOTICE '✅ %', RPAD(v_funcion, 40);
      v_total_existen := v_total_existen + 1;
    ELSE
      RAISE NOTICE '❌ % - FALTA', RPAD(v_funcion, 40);
      v_total_faltan := v_total_faltan + 1;
    END IF;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE 'Resultado: %/% funciones existen', v_total_existen, array_length(v_funciones_esperadas, 1);

  IF v_total_faltan = 0 THEN
    RAISE NOTICE '✅ TODAS LAS FUNCIONES CREADAS CORRECTAMENTE';
  ELSE
    RAISE NOTICE '❌ FALTAN % FUNCIONES - Aplicar migraciones de seguridad', v_total_faltan;
  END IF;

  RAISE NOTICE '';
END $$;

-- ==========================================
-- 3. VERIFICAR RLS HABILITADO
-- ==========================================
DO $$
DECLARE
  v_tablas_rls TEXT[] := ARRAY[
    'Usuario', 'PerfilUsuario', 'Evaluacion', 'Resultado',
    'Mensaje', 'Conversacion', 'Cita', 'PerfilProfesional',
    'DocumentoProfesional', 'HorarioProfesional', 'Suscripcion',
    'CalificacionProfesional', 'NotaSesionEncriptada',
    'AuditoriaAccesoPHI', 'ConsentimientoDetallado', 'PagoCita'
  ];
  v_tabla TEXT;
  v_rls_activo BOOLEAN;
  v_total_con_rls INTEGER := 0;
  v_total_sin_rls INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '3. VERIFICACIÓN RLS (16 tablas esperadas)';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  FOREACH v_tabla IN ARRAY v_tablas_rls
  LOOP
    SELECT COALESCE(rowsecurity, false) INTO v_rls_activo
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename = v_tabla;

    IF v_rls_activo THEN
      RAISE NOTICE '✅ % - RLS ACTIVO', RPAD(v_tabla, 30);
      v_total_con_rls := v_total_con_rls + 1;
    ELSE
      RAISE NOTICE '⚠️  % - RLS DESACTIVADO', RPAD(v_tabla, 30);
      v_total_sin_rls := v_total_sin_rls + 1;
    END IF;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE 'Resultado: %/% tablas con RLS', v_total_con_rls, array_length(v_tablas_rls, 1);

  IF v_total_sin_rls = 0 THEN
    RAISE NOTICE '✅ RLS ACTIVO EN TODAS LAS TABLAS';
  ELSE
    RAISE NOTICE '⚠️  % TABLAS SIN RLS - Aplicar políticas RLS', v_total_sin_rls;
  END IF;

  RAISE NOTICE '';
END $$;

-- ==========================================
-- 4. CONTAR POLÍTICAS RLS
-- ==========================================
DO $$
DECLARE
  v_total_politicas INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '4. POLÍTICAS RLS CREADAS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  SELECT COUNT(*) INTO v_total_politicas
  FROM pg_policies
  WHERE schemaname = 'public';

  RAISE NOTICE 'Total de políticas RLS: %', v_total_politicas;

  IF v_total_politicas >= 30 THEN
    RAISE NOTICE '✅ POLÍTICAS RLS APLICADAS CORRECTAMENTE';
  ELSIF v_total_politicas > 0 THEN
    RAISE NOTICE '⚠️  ALGUNAS POLÍTICAS FALTANTES (esperadas: ~30+)';
  ELSE
    RAISE NOTICE '❌ NO HAY POLÍTICAS RLS - Aplicar 20250120000001_rls_profesionales_citas.sql';
  END IF;

  RAISE NOTICE '';
END $$;

-- ==========================================
-- 5. VERIFICAR ÍNDICES CRÍTICOS
-- ==========================================
DO $$
DECLARE
  v_indices_criticos TEXT[] := ARRAY[
    'idx_cita_paciente_id',
    'idx_cita_profesional_id',
    'idx_cita_fecha_hora',
    'idx_auditoria_phi_usuario',
    'idx_suscripcion_usuario_id',
    'idx_perfil_profesional_usuario_id'
  ];
  v_indice TEXT;
  v_existe BOOLEAN;
  v_total_existen INTEGER := 0;
  v_total_faltan INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '5. ÍNDICES CRÍTICOS (6 mínimo)';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  FOREACH v_indice IN ARRAY v_indices_criticos
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE schemaname = 'public' AND indexname = v_indice
    ) INTO v_existe;

    IF v_existe THEN
      RAISE NOTICE '✅ %', RPAD(v_indice, 40);
      v_total_existen := v_total_existen + 1;
    ELSE
      RAISE NOTICE '❌ % - FALTA', RPAD(v_indice, 40);
      v_total_faltan := v_total_faltan + 1;
    END IF;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE 'Resultado: %/% índices críticos existen', v_total_existen, array_length(v_indices_criticos, 1);

  IF v_total_faltan = 0 THEN
    RAISE NOTICE '✅ ÍNDICES CRÍTICOS CREADOS';
  ELSE
    RAISE NOTICE '❌ FALTAN % ÍNDICES - Verificar migraciones', v_total_faltan;
  END IF;

  RAISE NOTICE '';
END $$;

-- ==========================================
-- 6. VERIFICAR TRIGGERS
-- ==========================================
DO $$
DECLARE
  v_total_triggers INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '6. TRIGGERS DE ACTUALIZACIÓN';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  SELECT COUNT(*) INTO v_total_triggers
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
    AND trigger_name LIKE '%actualizado_en%';

  RAISE NOTICE 'Total de triggers actualizado_en: %', v_total_triggers;

  IF v_total_triggers >= 6 THEN
    RAISE NOTICE '✅ TRIGGERS DE TIMESTAMPS CREADOS';
  ELSE
    RAISE NOTICE '⚠️  ALGUNOS TRIGGERS PUEDEN FALTAR (esperados: 6+)';
  END IF;

  RAISE NOTICE '';
END $$;

-- ==========================================
-- 7. VERIFICAR CONSTRAINTS
-- ==========================================
DO $$
DECLARE
  v_total_fk INTEGER;
  v_total_check INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '7. CONSTRAINTS DE INTEGRIDAD';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Foreign Keys
  SELECT COUNT(*) INTO v_total_fk
  FROM information_schema.table_constraints
  WHERE table_schema = 'public'
    AND constraint_type = 'FOREIGN KEY';

  RAISE NOTICE 'Foreign Keys: %', v_total_fk;

  -- Check Constraints
  SELECT COUNT(*) INTO v_total_check
  FROM information_schema.table_constraints
  WHERE table_schema = 'public'
    AND constraint_type = 'CHECK';

  RAISE NOTICE 'Check Constraints: %', v_total_check;

  IF v_total_fk >= 15 AND v_total_check >= 10 THEN
    RAISE NOTICE '✅ CONSTRAINTS DE INTEGRIDAD CORRECTOS';
  ELSE
    RAISE NOTICE '⚠️  REVISAR CONSTRAINTS (esperados: 15+ FK, 10+ CHECK)';
  END IF;

  RAISE NOTICE '';
END $$;

-- ==========================================
-- 8. VERIFICAR COLUMNAS ENCRIPTADAS
-- ==========================================
DO $$
DECLARE
  v_tiene_enc_mensaje BOOLEAN;
  v_tiene_enc_resultado BOOLEAN;
  v_tiene_enc_nota BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '8. COLUMNAS DE ENCRIPTACIÓN';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Mensaje
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Mensaje' AND column_name = 'contenido_encriptado'
  ) INTO v_tiene_enc_mensaje;

  -- Resultado
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Resultado' AND column_name = 'datos_sensibles_enc'
  ) INTO v_tiene_enc_resultado;

  -- NotaSesionEncriptada existe?
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'NotaSesionEncriptada'
  ) INTO v_tiene_enc_nota;

  IF v_tiene_enc_mensaje THEN
    RAISE NOTICE '✅ Mensaje.contenido_encriptado';
  ELSE
    RAISE NOTICE '❌ Mensaje.contenido_encriptado - FALTA';
  END IF;

  IF v_tiene_enc_resultado THEN
    RAISE NOTICE '✅ Resultado.datos_sensibles_enc';
  ELSE
    RAISE NOTICE '❌ Resultado.datos_sensibles_enc - FALTA';
  END IF;

  IF v_tiene_enc_nota THEN
    RAISE NOTICE '✅ NotaSesionEncriptada';
  ELSE
    RAISE NOTICE '❌ NotaSesionEncriptada - FALTA';
  END IF;

  IF v_tiene_enc_mensaje AND v_tiene_enc_resultado AND v_tiene_enc_nota THEN
    RAISE NOTICE '';
    RAISE NOTICE '✅ ENCRIPTACIÓN PHI CONFIGURADA';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '❌ ENCRIPTACIÓN INCOMPLETA - Aplicar 20251020000000_encriptacion_phi.sql';
  END IF;

  RAISE NOTICE '';
END $$;

-- ==========================================
-- 9. RESUMEN FINAL
-- ==========================================
DO $$
DECLARE
  v_total_tablas INTEGER;
  v_total_funciones INTEGER;
  v_total_rls INTEGER;
  v_total_politicas INTEGER;
  v_total_indices INTEGER;
  v_checklist_completo BOOLEAN := true;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RESUMEN FINAL DE MIGRACIÓN';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Contar tablas
  SELECT COUNT(*) INTO v_total_tablas
  FROM information_schema.tables
  WHERE table_schema = 'public';

  -- Contar funciones
  SELECT COUNT(*) INTO v_total_funciones
  FROM information_schema.routines
  WHERE routine_schema = 'public';

  -- Contar tablas con RLS
  SELECT COUNT(*) INTO v_total_rls
  FROM pg_tables
  WHERE schemaname = 'public' AND rowsecurity = true;

  -- Contar políticas
  SELECT COUNT(*) INTO v_total_politicas
  FROM pg_policies
  WHERE schemaname = 'public';

  -- Contar índices
  SELECT COUNT(*) INTO v_total_indices
  FROM pg_indexes
  WHERE schemaname = 'public';

  RAISE NOTICE 'Tablas creadas: % (esperadas: 18)', v_total_tablas;
  RAISE NOTICE 'Funciones creadas: % (esperadas: 11)', v_total_funciones;
  RAISE NOTICE 'Tablas con RLS: % (esperadas: 16)', v_total_rls;
  RAISE NOTICE 'Políticas RLS: % (esperadas: 30+)', v_total_politicas;
  RAISE NOTICE 'Índices creados: % (esperados: 40+)', v_total_indices;
  RAISE NOTICE '';

  -- Verificar checklist
  IF v_total_tablas < 18 THEN
    RAISE NOTICE '❌ Faltan tablas';
    v_checklist_completo := false;
  END IF;

  IF v_total_funciones < 11 THEN
    RAISE NOTICE '❌ Faltan funciones de seguridad';
    v_checklist_completo := false;
  END IF;

  IF v_total_rls < 16 THEN
    RAISE NOTICE '❌ Faltan políticas RLS';
    v_checklist_completo := false;
  END IF;

  IF v_checklist_completo THEN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅✅✅ MIGRACIÓN COMPLETADA EXITOSAMENTE ✅✅✅';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Próximos pasos:';
    RAISE NOTICE '1. Configurar PHI_ENCRYPTION_KEY en Supabase Secrets';
    RAISE NOTICE '2. Desplegar Edge Functions';
    RAISE NOTICE '3. Configurar Stripe Webhook';
    RAISE NOTICE '4. Implementar interfaces frontend';
    RAISE NOTICE '5. Ejecutar pruebas de seguridad';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '⚠️  MIGRACIÓN INCOMPLETA';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Revisa los pasos anteriores para identificar qué falta.';
    RAISE NOTICE 'Consulta: PASOS_APLICAR_MIGRACIONES.md';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;
