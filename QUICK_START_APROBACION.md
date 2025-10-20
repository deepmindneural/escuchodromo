# Quick Start: Sistema de Aprobación de Profesionales

## Inicio Rápido (5 minutos)

### 1. Iniciar el Servidor
```bash
cd /Volumes/StarkT7/Proyectos/CLIENETS/proyectos/ESCUCHODROMO/Escuchodromo\ 2/escuchodromo
npm run dev
```

### 2. Login como Admin
- Ir a: `http://localhost:3000/iniciar-sesion`
- Email: `admin@escuchodromo.com`
- Password: `123456`

### 3. Acceder al Panel de Profesionales
- Click en el menú lateral "Profesionales" (icono UserCheck)
- O ir directo a: `http://localhost:3000/admin/profesionales`

### 4. Probar el Sistema

#### Opción A: Aprobación Rápida
1. Ver lista de profesionales
2. Buscar un profesional pendiente
3. Click en "Aprobar"
4. Ver toast de éxito
5. Verificar que el estado cambió a "Aprobado"

#### Opción B: Aprobación Completa
1. Click en "Ver" en cualquier profesional
2. Revisar tabs: Información, Documentos, Horarios
3. Click en "Aprobar Perfil"
4. Agregar notas en el modal
5. Marcar/desmarcar "Enviar email"
6. Click en "Confirmar Aprobación"
7. Ver toast de éxito

#### Opción C: Verificar Documentos
1. Ir al detalle de un profesional
2. Tab "Documentos"
3. Ver preview del documento
4. Click en "Verificar"
5. Ver cambio de estado

## URLs Importantes

| URL | Descripción |
|-----|-------------|
| `/admin` | Dashboard admin |
| `/admin/profesionales` | Lista de profesionales |
| `/admin/profesionales/[id]` | Detalle de profesional |

## Verificaciones Rápidas

### ✅ Checklist de Funcionalidad

- [ ] La página carga sin errores
- [ ] Se muestran profesionales en la lista
- [ ] Los filtros funcionan (Todos, Pendientes, Aprobados)
- [ ] La búsqueda encuentra resultados
- [ ] El botón "Ver" abre el detalle
- [ ] Los tabs funcionan (Información, Documentos, Horarios)
- [ ] Los documentos se visualizan
- [ ] El botón "Aprobar" funciona
- [ ] El modal se abre correctamente
- [ ] La aprobación ejecuta correctamente
- [ ] El toast de éxito aparece
- [ ] El estado cambia a "Aprobado"

## Troubleshooting Rápido

### Error: "No se cargan profesionales"
**Solución**: Verificar que existan profesionales registrados en la base de datos

```bash
# Verificar en Supabase Studio
npm run db:studio
# O abrir: https://app.supabase.com/project/[tu-proyecto]/editor
```

### Error: "No puedo acceder"
**Solución**: Verificar que estás logueado como ADMIN

```typescript
// En la consola del navegador:
const { data: { user } } = await supabase.auth.getUser();
console.log(user);
```

### Error: "Documentos no se muestran"
**Solución**: Verificar que los documentos existan y las URLs sean válidas

### Error: "El rol no cambia"
**Solución**: Verificar permisos RLS en Supabase

## Datos de Prueba

### Crear un Profesional de Prueba (SQL)

```sql
-- 1. Crear usuario
INSERT INTO "Usuario" (auth_id, email, nombre, rol)
VALUES (
  gen_random_uuid(),
  'profesional.prueba@test.com',
  'Dr. Juan Pérez',
  'USUARIO'
);

-- 2. Crear perfil profesional
INSERT INTO "PerfilProfesional" (
  usuario_id,
  titulo_profesional,
  numero_licencia,
  universidad,
  anos_experiencia,
  especialidades,
  biografia,
  idiomas,
  tarifa_por_sesion,
  moneda
)
VALUES (
  (SELECT id FROM "Usuario" WHERE email = 'profesional.prueba@test.com'),
  'Psicólogo Clínico',
  'PSI-12345',
  'Universidad Nacional',
  5,
  ARRAY['Ansiedad', 'Depresión', 'Terapia Cognitiva'],
  'Psicólogo clínico con 5 años de experiencia en terapia cognitivo-conductual.',
  ARRAY['es', 'en'],
  80000,
  'COP'
);

-- 3. Crear horario de ejemplo
INSERT INTO "HorarioProfesional" (
  perfil_profesional_id,
  dia_semana,
  hora_inicio,
  hora_fin,
  duracion_sesion
)
VALUES
  (
    (SELECT id FROM "PerfilProfesional" WHERE numero_licencia = 'PSI-12345'),
    1, -- Lunes
    '09:00',
    '17:00',
    60
  ),
  (
    (SELECT id FROM "PerfilProfesional" WHERE numero_licencia = 'PSI-12345'),
    2, -- Martes
    '09:00',
    '17:00',
    60
  );
```

## Comandos Útiles

```bash
# Ver logs del servidor
npm run dev

# Abrir Studio de Supabase
npm run db:studio

# Ver estructura de la base de datos
# Ir a: http://localhost:54323

# Type check (verificar errores de TypeScript)
npm run type-check

# Linting
npm run lint
```

## Siguiente Paso

Después de probar el sistema básico, revisar:
- **SISTEMA_APROBACION_PROFESIONALES.md** - Documentación completa
- **RESUMEN_IMPLEMENTACION.md** - Resumen de implementación
- **ARCHIVOS_SISTEMA_APROBACION.md** - Listado de archivos

## Soporte

Si encuentras problemas:
1. Verificar console del navegador (F12)
2. Verificar logs del servidor (terminal)
3. Verificar permisos RLS en Supabase
4. Revisar documentación completa

---

**Tiempo estimado de prueba**: 5-10 minutos  
**Nivel**: Básico  
**Requisitos**: Servidor corriendo, Admin logueado
