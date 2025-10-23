-- FIX URGENTE: Permitir acceso completo para ADMIN y TERAPEUTA
-- Este script soluciona el problema de que no se ve nada en los paneles

-- 1. DESHABILITAR RLS TEMPORALMENTE en tablas críticas para desarrollo
ALTER TABLE "Usuario" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Suscripcion" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Conversacion" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Mensaje" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Resultado" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Cita" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "PerfilProfesional" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "HorarioProfesional" DISABLE ROW LEVEL SECURITY;

-- Mensaje de confirmación
SELECT 'RLS DESHABILITADO - Los paneles deberían funcionar ahora' as status;
