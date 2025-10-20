# Quick Start: Sistema de Disponibilidad Horaria

**Tiempo estimado:** 10 minutos

## Prerequisitos

- ✅ Tabla `HorarioProfesional` creada (ya existe)
- ✅ Usuario con rol `TERAPEUTA` o `ADMIN`
- ✅ Perfil en tabla `PerfilProfesional`
- ✅ Supabase CLI instalado (opcional para testing)

## Paso 1: Verificar Instalación

```bash
# Verificar que los archivos existen
ls src/lib/componentes/SelectorHorarios.tsx
ls src/lib/componentes/BloqueHorario.tsx
ls src/app/profesional/disponibilidad/page.tsx
ls supabase/functions/obtener-disponibilidad/index.ts
ls supabase/functions/configurar-disponibilidad/index.ts
```

**Todos deben existir** ✅

## Paso 2: Deploy Edge Functions

```bash
# Login a Supabase (si no lo has hecho)
supabase login

# Link al proyecto
supabase link --project-ref YOUR_PROJECT_REF

# Deploy functions
supabase functions deploy obtener-disponibilidad
supabase functions deploy configurar-disponibilidad

# Verificar
supabase functions list
```

**Deberías ver:**
```
┌───────────────────────────────┬──────────┬─────────────────┐
│ NAME                          │ STATUS   │ VERSION         │
├───────────────────────────────┼──────────┼─────────────────┤
│ obtener-disponibilidad        │ ACTIVE   │ 1               │
│ configurar-disponibilidad     │ ACTIVE   │ 1               │
└───────────────────────────────┴──────────┴─────────────────┘
```

## Paso 3: Iniciar App

```bash
# Instalar dependencias (si no lo has hecho)
npm install

# Iniciar desarrollo
npm run dev

# O si usas Nx
nx serve web
```

**App corriendo en:** http://localhost:3000

## Paso 4: Probar la Interfaz

### 1. Login como Profesional

Navega a: http://localhost:3000/iniciar-sesion

```
Email: terapeuta@escuchodromo.com
Password: 123456
```

(O usa tus credenciales de prueba)

### 2. Ir a Disponibilidad

Opción A - URL directa:
```
http://localhost:3000/profesional/disponibilidad
```

Opción B - Desde dashboard:
1. Navega a `/profesional/dashboard`
2. Click botón "Configurar disponibilidad"

### 3. Configurar Primer Horario

1. **Expandir día:** Click en "Lunes"
2. **Agregar horario:** Click "+ Agregar horario"
3. **Seleccionar horas:**
   - Hora inicio: `09:00`
   - Hora fin: `12:00`
4. **Agregar:** Click "Agregar"
5. **Guardar:** Click "Guardar cambios"

**Resultado esperado:**
- ✅ Toast: "Disponibilidad actualizada correctamente"
- ✅ Bloque aparece con "09:00 - 12:00"
- ✅ Muestra "3 horas disponibles"

### 4. Probar Plantilla Rápida

1. Click en "Lun-Vie 9:00-17:00"
2. Confirmar diálogo
3. **Resultado:** Se crean 5 horarios automáticamente
4. Click "Guardar cambios"

## Paso 5: Probar Edge Functions (Opcional)

### Setup

```bash
# Obtener JWT token
# 1. Login en app
# 2. DevTools > Application > Local Storage
# 3. Buscar clave con "token"
# 4. Copiar el valor

export JWT_TOKEN="eyJhbGciOiJIUzI1NiIs..."
export SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
```

### Test 1: Obtener Disponibilidad

```bash
curl -X GET \
  "$SUPABASE_URL/functions/v1/obtener-disponibilidad" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  | jq '.'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "horarios": [
    {
      "id": "...",
      "dia_semana": 1,
      "hora_inicio": "09:00",
      "hora_fin": "12:00",
      "duracion_sesion": 60,
      "activo": true
    }
  ]
}
```

### Test 2: Configurar Disponibilidad

```bash
curl -X POST \
  "$SUPABASE_URL/functions/v1/configurar-disponibilidad" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "horarios": [
      {
        "dia_semana": 1,
        "hora_inicio": "09:00",
        "hora_fin": "12:00",
        "duracion_sesion": 60,
        "activo": true
      }
    ]
  }' \
  | jq '.'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "horarios_configurados": 1,
  "mensaje": "Disponibilidad actualizada correctamente. 1 horarios configurados."
}
```

### Test Suite Completa

```bash
# Usar script automatizado
./test-disponibilidad.sh $JWT_TOKEN
```

## Paso 6: Verificar en Base de Datos

```sql
-- Ver horarios configurados
SELECT
  hp.id,
  hp.dia_semana,
  hp.hora_inicio,
  hp.hora_fin,
  hp.duracion_sesion,
  hp.activo,
  pp.usuario_id
FROM "HorarioProfesional" hp
JOIN "PerfilProfesional" pp ON pp.id = hp.perfil_profesional_id
WHERE pp.usuario_id = 'TU_USUARIO_ID';

-- Resultado esperado:
-- | id | dia_semana | hora_inicio | hora_fin | duracion_sesion | activo | usuario_id |
-- |----|------------|-------------|----------|-----------------|--------|------------|
-- | .. | 1          | 09:00:00    | 12:00:00 | 60              | true   | ...        |
```

## Troubleshooting

### Problema: "No se encontró tu perfil profesional"

**Causa:** Usuario no tiene registro en `PerfilProfesional`

**Solución:**
```sql
-- Verificar si existe
SELECT * FROM "PerfilProfesional" WHERE usuario_id = 'TU_UUID';

-- Si no existe, crear
INSERT INTO "PerfilProfesional" (
  usuario_id,
  titulo_profesional,
  numero_licencia,
  perfil_aprobado,
  documentos_verificados
)
VALUES (
  'TU_UUID',
  'Psicólogo',
  'PSI-12345',
  true,
  true
);
```

### Problema: "No tienes permisos para acceder a esta página"

**Causa:** Usuario no tiene rol `TERAPEUTA` o `ADMIN`

**Solución:**
```sql
-- Verificar rol actual
SELECT id, rol FROM "Usuario" WHERE id = 'TU_UUID';

-- Actualizar rol
UPDATE "Usuario" SET rol = 'TERAPEUTA' WHERE id = 'TU_UUID';
```

### Problema: Edge Functions no responden

**Causa:** Functions no desplegadas o error en deployment

**Solución:**
```bash
# Ver logs de función
supabase functions serve obtener-disponibilidad

# Re-deploy con logs
supabase functions deploy obtener-disponibilidad --debug

# Verificar status
supabase functions list
```

### Problema: Error "Este horario se solapa..."

**Causa:** Intentando agregar horario que se solapa con uno existente

**Solución:** Esto es el comportamiento esperado. Verificar horarios existentes y elegir un rango diferente o eliminar el horario conflictivo.

### Problema: Página en blanco o error 404

**Causa:** Ruta no existe o error en build

**Solución:**
```bash
# Limpiar cache Next.js
rm -rf .next

# Re-instalar dependencias
rm -rf node_modules package-lock.json
npm install

# Reiniciar dev server
npm run dev
```

## Checklist de Verificación

- [ ] Edge Functions desplegadas
- [ ] Página `/profesional/disponibilidad` accesible
- [ ] Login como profesional funciona
- [ ] Puede agregar horario nuevo
- [ ] Puede editar horario existente
- [ ] Puede eliminar horario
- [ ] Toggle activo/inactivo funciona
- [ ] Validación de solapamiento funciona
- [ ] Plantillas rápidas funcionan
- [ ] Botón "Guardar cambios" funciona
- [ ] Horarios persisten después de recargar
- [ ] Responsive en móvil funciona

## Flujo de Prueba Completo (5 minutos)

```bash
# 1. Login
# URL: /iniciar-sesion
# Email: terapeuta@escuchodromo.com
# Pass: 123456

# 2. Ir a disponibilidad
# URL: /profesional/disponibilidad

# 3. Aplicar plantilla
# Click: "Lun-Vie 9:00-17:00"
# Confirmar: "Sí"

# 4. Personalizar Lunes
# Expandir: "Lunes"
# Click: "+ Agregar horario"
# Configurar: 14:00 - 18:00
# Click: "Agregar"

# 5. Guardar
# Click: "Guardar cambios"
# Verificar: Toast success

# 6. Recargar página
# Verificar: Horarios se mantienen

# 7. Editar horario
# Click: "Editar" en horario de Martes
# Cambiar: hora_fin a 16:00
# Click: "Guardar"

# 8. Desactivar horario
# Click: Toggle en horario de Miércoles
# Verificar: Bloque se muestra gris

# 9. Guardar cambios finales
# Click: "Guardar cambios"
# Verificar: Toast success

# 10. Verificar en BD (opcional)
# Query SQL para ver horarios

✅ SISTEMA FUNCIONANDO CORRECTAMENTE
```

## Próximos Pasos

1. **Integrar con Reservas:**
   - La Edge Function `disponibilidad-profesional` ya usa estos horarios
   - Implementar página de reserva de citas

2. **Añadir Excepciones:**
   - Sistema para bloquear fechas específicas
   - Días festivos
   - Vacaciones

3. **Notificaciones:**
   - Alertar pacientes cuando hay nuevos slots
   - Recordatorios de actualizar disponibilidad

4. **Analytics:**
   - Dashboard de utilización
   - Horarios más populares

## Recursos

- **Documentación completa:** `SISTEMA_CONFIGURACION_HORARIOS_COMPLETADO.md`
- **Script de test:** `test-disponibilidad.sh`
- **Código fuente:**
  - Frontend: `src/app/profesional/disponibilidad/`
  - Componentes: `src/lib/componentes/`
  - Backend: `supabase/functions/`

## Soporte

Si tienes problemas:

1. Revisa esta guía completa
2. Verifica logs en DevTools Console
3. Verifica logs de Edge Functions en Supabase Dashboard
4. Revisa la documentación completa en `SISTEMA_CONFIGURACION_HORARIOS_COMPLETADO.md`

---

**¡Listo para usar!** 🚀

El sistema está completamente funcional y production-ready.
