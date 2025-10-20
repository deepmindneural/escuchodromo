# GUÍA DE PRUEBAS - PANEL ADMINISTRADOR
## Escuchodromo - Después de Auditoría y Correcciones

---

## CREDENCIALES DE PRUEBA

**Usuario Admin:**
- Email: `admin@escuchodromo.com`
- Password: `123456`
- Rol: `ADMIN`

**Usuario Regular (para comparar):**
- Email: `usuario@escuchodromo.com`
- Password: `123456`
- Rol: `USUARIO`

---

## PLAN DE PRUEBAS

### 1. PRUEBA DE AUTENTICACIÓN Y ACCESO

**Objetivo:** Verificar que solo usuarios ADMIN pueden acceder al panel

**Pasos:**

1. **Acceso Denegado (Usuario Regular)**
   ```
   1. Iniciar sesión con usuario@escuchodromo.com
   2. Intentar acceder a http://localhost:3000/admin
   3. Resultado esperado: Redirección a /dashboard
   ```

2. **Acceso Permitido (Admin)**
   ```
   1. Cerrar sesión
   2. Iniciar sesión con admin@escuchodromo.com
   3. Acceder a http://localhost:3000/admin
   4. Resultado esperado: Dashboard del admin cargado correctamente
   ```

---

### 2. PRUEBA DE NAVEGACIÓN DEL MENÚ

**Objetivo:** Verificar que todas las opciones del menú funcionan

**Pasos:**

1. En el menú lateral, hacer clic en cada opción:
   - ✅ Dashboard → `/admin`
   - ✅ Historiales → `/admin/historiales`
   - ✅ Usuarios → `/admin/usuarios`
   - ✅ Profesionales → `/admin/profesionales`
   - ✅ Suscripciones → `/admin/suscripciones`

2. Verificar que:
   - Cada página carga sin errores
   - El indicador activo se muestra en la opción correcta
   - El contenido es relevante a la sección

**Resultado esperado:** ✅ Todas las páginas cargan correctamente

---

### 3. PRUEBA DE DASHBOARD

**Objetivo:** Verificar estadísticas y gráficos

**URL:** `http://localhost:3000/admin`

**Verificaciones:**

1. **Tarjetas de Estadísticas** (debe mostrar números reales):
   - Total Usuarios
   - Conversaciones Activas
   - Evaluaciones (ahora usando tabla `Resultado`)
   - Tasa de Retención

2. **Gráficos:**
   - Actividad en Tiempo Real (ApexCharts)
   - Crecimiento de Usuarios (Recharts)
   - Evaluaciones por Tipo (PieChart)

3. **Acciones Rápidas:**
   - Todos los enlaces funcionan
   - Redirigen a las páginas correctas

**Resultado esperado:** ✅ Dashboard muestra datos correctos sin errores de consola

**Error común anterior:** ❌ Error al cargar evaluaciones (tabla inexistente)
**Estado actual:** ✅ Corregido - usa tabla `Resultado`

---

### 4. PRUEBA DE GESTIÓN DE USUARIOS

**Objetivo:** Verificar CRUD de usuarios

**URL:** `http://localhost:3000/admin/usuarios`

**Pasos:**

1. **Verificar tabla de usuarios:**
   - La tabla muestra usuarios
   - Columnas visibles: Usuario, Rol, Estado, Estadísticas, Fecha Registro, Acciones

2. **Probar filtros:**
   - Buscar por email: `usuario@escuchodromo.com`
   - Filtrar por rol: TERAPEUTA
   - Filtrar por estado: Activos
   - Limpiar filtros

3. **Cambiar rol de usuario:**
   ```
   1. Seleccionar un usuario con rol USUARIO
   2. Cambiar a TERAPEUTA
   3. Verificar toast de éxito
   4. Verificar cambio en la tabla
   ```

4. **Activar/Desactivar usuario:**
   ```
   1. Click en botón "Desactivar"
   2. Verificar toast de éxito
   3. Verificar badge cambia a "Inactivo"
   ```

5. **Probar paginación:**
   - Si hay más de 10 usuarios, verificar botones Anterior/Siguiente

**Resultado esperado:** ✅ Todas las operaciones funcionan sin errores

---

### 5. PRUEBA DE HISTORIALES DE USUARIOS

**Objetivo:** Verificar carga de historial completo

**URL:** `http://localhost:3000/admin/historiales`

**Pasos:**

1. **Verificar lista de usuarios:**
   - La lista carga correctamente
   - Muestra nombre y email
   - Campo `creado_en` (corregido, antes era `fecha_registro`)

2. **Buscar usuario:**
   - Escribir en el campo de búsqueda: `usuario`
   - Verificar filtrado en tiempo real

3. **Cargar historial de un usuario:**
   ```
   1. Click en un usuario de la lista
   2. Esperar carga (spinner)
   3. Verificar Edge Function responde correctamente
   ```

4. **Verificar secciones del historial:**
   - ✅ Información del usuario (muestra `creado_en` y `actualizado_en`)
   - ✅ Estadísticas (3 tarjetas: evaluaciones, conversaciones, recomendaciones)
   - ✅ Tabs: Evaluaciones, Conversaciones, Recomendaciones

5. **Probar cada tab:**
   - Tab Evaluaciones: Muestra resultados de pruebas (tabla `Resultado`)
   - Tab Conversaciones: Muestra conversaciones con mensajes
   - Tab Recomendaciones: Muestra recomendaciones activas/completadas

**Resultado esperado:** ✅ Historial completo carga sin errores

**Errores comunes anteriores:**
- ❌ Error al cargar usuarios (campos inexistentes)
- ❌ Error en Edge Function (tabla `Evaluacion` no existe)

**Estado actual:** ✅ Ambos corregidos

**Verificar en consola del navegador:**
```
NO debe haber errores tipo:
- "Column not found: fecha_registro"
- "Table not found: Evaluacion"
- "Relation not found: Test"
```

---

### 6. PRUEBA DE GESTIÓN DE PROFESIONALES

**Objetivo:** Verificar aprobación de profesionales

**URL:** `http://localhost:3000/admin/profesionales`

**Pasos:**

1. **Verificar lista de profesionales:**
   - Tabla muestra profesionales registrados
   - Columnas: Profesional, Título, Licencia, Documentos, Estado, Acciones

2. **Probar filtros:**
   - Filtro "Todos"
   - Filtro "Pendientes"
   - Filtro "Aprobados"
   - Búsqueda por nombre/licencia

3. **Estadísticas:**
   - Total Profesionales
   - Pendientes
   - Aprobados

4. **Aprobar rápidamente:**
   ```
   1. Click en "Aprobar" de un profesional pendiente
   2. Verificar toast de éxito
   3. Verificar cambio de estado
   4. Verificar rol cambia a TERAPEUTA
   ```

5. **Ver detalle de profesional:**
   ```
   URL: /admin/profesionales/[id]

   1. Click en "Ver" de cualquier profesional
   2. Verificar carga de datos completos
   3. Probar tabs: Información, Documentos, Horarios
   4. Verificar componentes ModalAprobar y VisorDocumento
   ```

**Resultado esperado:** ✅ Gestión de profesionales funciona completamente

---

### 7. PRUEBA DE GESTIÓN DE SUSCRIPCIONES (NUEVA)

**Objetivo:** Verificar página recién creada

**URL:** `http://localhost:3000/admin/suscripciones`

**Pasos:**

1. **Verificar estadísticas:**
   - Total Suscripciones
   - Activas (verde)
   - Canceladas (rojo)
   - Ingresos Mensuales (formato COP/USD)

2. **Verificar tabla:**
   - Columnas completas: Usuario, Plan, Periodo, Precio, Estado, Fechas, Próximo Pago, Acciones

3. **Probar filtros:**
   - Buscar por nombre de usuario
   - Filtrar por plan: Básico, Premium, Profesional
   - Filtrar por estado: Activa, Cancelada, Pausada, Vencida
   - Limpiar filtros

4. **Cambiar estado de suscripción:**
   ```
   1. Seleccionar una suscripción activa
   2. Cambiar estado a "Pausada"
   3. Verificar toast de éxito
   4. Verificar badge cambia de color
   ```

5. **Verificar formato de moneda:**
   - Precios en COP deben mostrar: $150.000
   - Precios en USD deben mostrar: $50
   - Ingresos mensuales formateados correctamente

6. **Probar paginación:**
   - Si hay más de 10 suscripciones, probar navegación

**Resultado esperado:** ✅ Página completamente funcional, sin errores

**Esta página era inexistente antes de la auditoría** ✨

---

## PRUEBAS DE ERRORES CORREGIDOS

### ERROR #1: Dashboard - Tabla Evaluacion

**Antes:**
```typescript
// Generaba error: Table 'Evaluacion' not found
const { count } = await supabase.from('Evaluacion').select(...)
```

**Cómo probar la corrección:**
```
1. Abrir http://localhost:3000/admin
2. Abrir DevTools → Console
3. NO debe haber error de tabla no encontrada
4. Estadísticas de evaluaciones deben cargar
```

---

### ERROR #2: Historiales - Campos Incorrectos

**Antes:**
```typescript
// Generaba error: Column not found: fecha_registro
.select('id, nombre, email, fecha_registro, ultima_actividad')
```

**Cómo probar la corrección:**
```
1. Abrir http://localhost:3000/admin/historiales
2. Abrir DevTools → Network → Supabase requests
3. NO debe haber error 400 "column not found"
4. Lista de usuarios debe cargar correctamente
```

---

### ERROR #3: Edge Function - Múltiples Errores

**Antes:**
```typescript
// Error 1: Campos incorrectos
.select('fecha_registro, ultima_actividad')  // ❌

// Error 2: Tabla incorrecta
.from('Evaluacion')  // ❌

// Error 3: Relación incorrecta
Test (codigo, nombre)  // ❌
```

**Cómo probar la corrección:**
```
1. Abrir http://localhost:3000/admin/historiales
2. Seleccionar un usuario
3. Abrir DevTools → Network → Functions
4. Verificar request a "obtener-historial-usuario"
5. Debe retornar status 200
6. Debe incluir:
   - usuario.creado_en (no fecha_registro)
   - evaluaciones desde tabla Resultado
   - relación Prueba:prueba_id correcta
```

---

## CHECKLIST DE VERIFICACIÓN COMPLETA

### Funcionalidad General
- [ ] Login funciona correctamente
- [ ] Solo admins pueden acceder a /admin
- [ ] Usuarios regulares son redirigidos
- [ ] Menú lateral muestra todas las opciones
- [ ] Todas las rutas del menú funcionan
- [ ] Cierre de sesión funciona

### Dashboard
- [ ] Estadísticas cargan correctamente
- [ ] NO hay error de tabla Evaluacion
- [ ] Gráficos se renderizan
- [ ] Acciones rápidas funcionan
- [ ] Actividad reciente se muestra

### Usuarios
- [ ] Tabla carga usuarios
- [ ] Filtros funcionan (búsqueda, rol, estado)
- [ ] Cambio de rol funciona
- [ ] Activar/Desactivar funciona
- [ ] Paginación funciona

### Historiales
- [ ] Lista de usuarios carga (con creado_en)
- [ ] NO hay error de fecha_registro
- [ ] Búsqueda funciona
- [ ] Edge Function responde correctamente
- [ ] Tabs de historial funcionan
- [ ] Evaluaciones cargan desde Resultado
- [ ] Conversaciones cargan
- [ ] Recomendaciones cargan

### Profesionales
- [ ] Tabla carga profesionales
- [ ] Filtros funcionan
- [ ] Estadísticas correctas
- [ ] Aprobar rápido funciona
- [ ] Detalle de profesional carga
- [ ] Tabs funcionan (Info, Docs, Horarios)
- [ ] ModalAprobar funciona
- [ ] VisorDocumento funciona

### Suscripciones (NUEVA)
- [ ] Página carga correctamente
- [ ] Estadísticas se muestran
- [ ] Tabla con todas las columnas
- [ ] Filtros funcionan
- [ ] Cambio de estado funciona
- [ ] Formato de moneda correcto
- [ ] Paginación funciona

### UI/UX
- [ ] Tema light consistente (teal-500, cyan-500)
- [ ] NO hay dark theme
- [ ] Responsive en móvil
- [ ] Skeletons mientras carga
- [ ] Toasts de éxito/error
- [ ] Sin errores en consola

---

## ERRORES A REPORTAR

Si encuentras algún error, reportarlo con esta estructura:

```
PÁGINA: /admin/...
ERROR: Descripción del error
CONSOLA: [Copiar error de DevTools Console]
PASOS PARA REPRODUCIR:
1. ...
2. ...
3. ...
RESULTADO ESPERADO: ...
RESULTADO ACTUAL: ...
```

---

## PRUEBAS DE RENDIMIENTO (Opcional)

1. **Tiempo de carga de Dashboard:**
   - Debe cargar en < 2 segundos
   - Estadísticas en < 1 segundo

2. **Tiempo de respuesta Edge Function:**
   - obtener-historial-usuario < 3 segundos

3. **Tamaño de consultas:**
   - Paginación debe limitar a 10 registros
   - No cargar más de 50 evaluaciones

---

## CONCLUSIÓN

Si todas las pruebas pasan ✅:
- El panel admin está LISTO PARA PRODUCCIÓN
- Todos los errores críticos están corregidos
- La funcionalidad completa está disponible

Si alguna prueba falla ❌:
- Reportar el error según el formato anterior
- Revisar logs de consola y network
- Verificar que las migraciones de base de datos estén aplicadas

---

**Creado por:** Claude Code - QA Engineer Specialist
**Fecha:** 20 de Octubre de 2025
**Basado en:** Auditoría completa del panel administrador
**Errores corregidos:** 5 críticos + 1 página creada
