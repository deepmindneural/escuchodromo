# 🧪 GUÍA DE PRUEBAS - ESCUCHODROMO

**Fecha**: 16 de Octubre, 2025
**Estado**: Tablas creadas ✅ | Edge Functions pendientes ⚠️

---

## 📋 CHECKLIST DE PRUEBAS

### ✅ Funcionalidades para Probar

- [ ] Sistema de navegación (foto y nombre)
- [ ] Sistema de evaluaciones (PHQ-9, GAD-7)
- [ ] Seguimiento de ánimo diario
- [ ] Dashboard con estadísticas
- [ ] Perfil de usuario

---

## 🧭 1. NAVEGACIÓN Y PERFIL

### **Probar Navegación**

1. **Recargar la página** (Ctrl+R / Cmd+R)
2. **Verificar en el menú superior derecho**:
   - ✅ Debe aparecer un círculo con tu inicial
   - ✅ Debe aparecer tu nombre completo
   - ✅ Debe decir "Ver perfil" debajo

3. **Hacer clic en tu foto/nombre**:
   - ✅ Debe llevarte a `/perfil`
   - ✅ En perfil debe mostrar:
     - Foto grande con tu inicial
     - Tu nombre completo
     - Tu email
     - Tu rol

### **Resultado Esperado**:
```
┌────────────────────────────┐
│ [🔵 J]  Juan Pérez         │
│         Ver perfil         │
└────────────────────────────┘
```

---

## 📝 2. SISTEMA DE EVALUACIONES

### **Paso 1: Ir a Evaluaciones**

1. En el menú, haz clic en **"Evaluaciones"**
2. Deberías ver:
   - ✅ PHQ-9 (Depresión) - 9 preguntas
   - ✅ GAD-7 (Ansiedad) - 7 preguntas

### **Paso 2: Realizar PHQ-9**

1. Haz clic en **"Iniciar Evaluación"** en PHQ-9
2. Responde las 9 preguntas (selecciona cualquier respuesta)
3. Haz clic en **"Enviar Evaluación"**

### **⚠️ IMPORTANTE - Edge Function No Desplegada**

**Qué va a pasar**:
- ❌ Verás un error porque el Edge Function no está desplegado
- ❌ Las respuestas NO se guardarán (por ahora)

**Qué deberías ver** (después de desplegar Edge Functions):
- ✅ Página de resultados con tu puntuación
- ✅ Nivel de severidad (Mínima, Leve, Moderada, etc.)
- ✅ Interpretación personalizada
- ✅ Recomendaciones según tu resultado

### **Paso 3: Verificar en Base de Datos**

Por ahora, para verificar que las tablas funcionan:

1. Ve a Supabase Table Editor:
   ```
   https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/editor
   ```

2. Selecciona la tabla **`Test`**:
   - ✅ Deberías ver 2 registros:
     - PHQ-9
     - GAD-7

3. Selecciona la tabla **`Pregunta`**:
   - ✅ Deberías ver 16 registros (9 de PHQ-9 + 7 de GAD-7)

4. Selecciona la tabla **`Resultado`**:
   - ⚠️ Estará vacía hasta que se despliegue el Edge Function

---

## 😊 3. SEGUIMIENTO DE ÁNIMO

### **Paso 1: Ir a Registro de Ánimo**

1. En el menú, haz clic en **"Ánimo"**
2. Deberías ver la página con:
   - ✅ Botón "Nuevo Registro"
   - ✅ Estadísticas (vacías por ahora)
   - ✅ Mensaje "Aún no tienes registros"

### **Paso 2: Crear Primer Registro**

1. Haz clic en **"Nuevo Registro"**
2. Se abre un modal con 3 sliders:
   - **Ánimo** (1-10): Desliza a cualquier valor (ej: 7)
   - **Energía** (1-10): Desliza a cualquier valor (ej: 6)
   - **Estrés** (1-10): Desliza a cualquier valor (ej: 4)
3. (Opcional) Escribe notas: "Probando el sistema"
4. Haz clic en **"Guardar Registro"**

### **Resultado Esperado**:

✅ Debe aparecer un toast verde: "¡Registro guardado exitosamente!"
✅ El modal se cierra
✅ Aparece tu primer registro en el historial con:
- Fecha y hora
- Barras de color mostrando tus valores
- Tus notas (si las escribiste)

✅ Las estadísticas se actualizan mostrando:
- Ánimo promedio: 7.0/10 con cara 😊
- Energía promedio: 6.0/10 con rayo ⚡
- Estrés promedio: 4.0/10

### **Paso 3: Crear Más Registros**

1. Crea 2-3 registros más con valores diferentes
2. Observa cómo cambian los promedios
3. Verifica que aparezcan en el historial ordenados por fecha

### **Verificar en Base de Datos**:

1. Ve a Supabase Table Editor → Tabla **`RegistroAnimo`**
2. Deberías ver tus registros con:
   - ✅ `usuario_id` (UUID de tu usuario)
   - ✅ `animo`, `energia`, `estres` (valores 1-10)
   - ✅ `notas` (si las escribiste)
   - ✅ `creado_en` (fecha/hora actual)

---

## 📊 4. DASHBOARD

### **Paso 1: Ir al Dashboard**

1. En el menú, haz clic en **"Dashboard"**
2. Deberías ver estadísticas:

### **Estadísticas que DEBEN funcionar ahora**:

- ✅ **Registros de Ánimo**: Debería mostrar el número correcto (ej: "3")
- ✅ **Progreso General**: Se calcula basado en tus registros

### **Estadísticas que AÚN NO funcionarán** (requieren Edge Functions):

- ⚠️ **Evaluaciones Realizadas**: Mostrará 0 (hasta desplegar Edge Function)
- ⚠️ **Conversaciones de Chat**: Mostrará 0 (hasta desplegar Edge Function)

---

## 🎯 RESUMEN DE RESULTADOS ESPERADOS

### **✅ DEBE FUNCIONAR (Sin Edge Functions)**:

| Funcionalidad | Estado | Verificación |
|---------------|--------|--------------|
| Navegación con foto/nombre | ✅ | Ver menú superior |
| Perfil de usuario | ✅ | Ir a /perfil |
| Listar evaluaciones | ✅ | Ver PHQ-9 y GAD-7 en /evaluaciones |
| Registrar ánimo | ✅ | Crear registros en /animo |
| Ver historial de ánimo | ✅ | Ver lista en /animo |
| Estadísticas de ánimo | ✅ | Ver promedios en /animo |
| Dashboard básico | 🟡 | Algunas stats funcionan |

### **⚠️ NO FUNCIONARÁ (Requiere Edge Functions)**:

| Funcionalidad | Estado | Razón |
|---------------|--------|-------|
| Enviar evaluación | ❌ | Edge Function `procesar-evaluacion` no desplegada |
| Ver resultados de evaluación | ❌ | Edge Function no desplegada |
| Chat con IA | ❌ | Edge Function `chat-ia` no desplegada |
| Recomendaciones con IA | ❌ | Edge Function `generar-recomendaciones` no desplegada |
| Gestión de suscripción | ❌ | Edge Function `gestionar-suscripcion` no desplegada |

---

## 🐛 PROBLEMAS COMUNES

### **Problema 1: No veo mi nombre en el menú**

**Causa**: El perfil no se cargó desde la base de datos
**Solución**:
1. Verifica que tu usuario existe en Supabase:
   - Ve a Table Editor → Tabla `Usuario`
   - Busca tu email
   - Verifica que tiene un valor en la columna `nombre`
2. Si no tiene nombre, agrégalo manualmente o edítalo desde `/perfil`

### **Problema 2: Error al guardar registro de ánimo**

**Causa**: Políticas RLS bloqueando la inserción
**Verificar**:
1. Ve a Supabase → Table Editor → `RegistroAnimo`
2. Revisa las políticas RLS (ícono de candado)
3. Debe existir: "usuarios_pueden_insertar_animo"

### **Problema 3: No veo las evaluaciones PHQ-9 y GAD-7**

**Causa**: Los datos no se insertaron en la tabla `Test`
**Solución**:
1. Ve a Supabase SQL Editor
2. Ejecuta:
```sql
SELECT * FROM "Test";
```
3. Si está vacía, vuelve a ejecutar `SETUP_FINAL_ADAPTATIVO.sql`

---

## ✅ CHECKLIST FINAL

Después de probar, marca lo que funciona:

- [ ] ✅ Veo mi foto y nombre en el menú
- [ ] ✅ El perfil carga correctamente
- [ ] ✅ Veo PHQ-9 y GAD-7 en evaluaciones
- [ ] ✅ Puedo crear registros de ánimo
- [ ] ✅ Los registros aparecen en el historial
- [ ] ✅ Las estadísticas de ánimo se actualizan
- [ ] ❌ El envío de evaluación falla (esperado, Edge Function no desplegada)
- [ ] ❌ El chat con IA no funciona (esperado, Edge Function no desplegada)

---

## 🚀 PRÓXIMOS PASOS

Una vez que hayas probado todo:

### **Si todo lo marcado con ✅ funciona**:
1. ✅ Las tablas están correctamente configuradas
2. ✅ El frontend está funcionando
3. ⚠️ Solo falta desplegar Edge Functions

### **Para habilitar el 100% de funcionalidades**:
1. Desplegar Edge Functions (10 min)
2. Configurar GEMINI_API_KEY (5 min)
3. Configurar STRIPE_SECRET_KEY (opcional, 5 min)

---

**¡Reporta los resultados de las pruebas!** 🎉
