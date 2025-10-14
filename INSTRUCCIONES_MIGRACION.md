# 🚀 INSTRUCCIONES PARA APLICAR LA MIGRACIÓN

## ⚠️ IMPORTANTE
La migración NO se puede ejecutar automáticamente por restricciones de seguridad de Supabase.
**Debes hacerlo MANUALMENTE** desde el Dashboard (toma solo 2 minutos).

---

## 📋 PASOS A SEGUIR

### 1. Abrir el SQL Editor de Supabase

Opción A: **Click en este link** (se abre automáticamente):
```
https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/sql/new
```

Opción B: **Manual**:
1. Ve a https://supabase.com/dashboard
2. Selecciona el proyecto: `cvezncgcdsjntzrzztrj`
3. Click en "SQL Editor" en el menú lateral
4. Click en "New Query"

### 2. Copiar el SQL

El SQL ya está en tu portapapeles (lo copié automáticamente).
Si no, copia el contenido del archivo:

```
supabase/migracion-final-corregida.sql
```

### 3. Pegar y Ejecutar

1. **Pega** el SQL en el editor (Cmd+V o Ctrl+V)
2. **Click en el botón verde "RUN"** (esquina inferior derecha)
3. **Espera** unos 10-15 segundos
4. Deberías ver: `Success. No rows returned`

### 4. Verificar que funcionó

Ejecuta este comando en tu terminal:

```bash
node scripts/test-supabase.js
```

Deberías ver:
```
✅ Usuario: Existe
✅ PerfilUsuario: Existe
✅ Conversacion: Existe
✅ Mensaje: Existe
✅ Test: Existe
✅ Pregunta: Existe
✅ Evaluacion: Existe
✅ RegistroAnimo: Existe
✅ Recomendacion: Existe
✅ Pago: Existe
✅ Notificacion: Existe
✅ SesionPublica: Existe
✅ MensajePublico: Existe
✅ ConfiguracionIA: Existe
```

---

## ❓ Posibles Errores

### Error: "relation already exists"
- **Solución**: Ignóralo, significa que la tabla ya existe (no es problema)

### Error: "infinite recursion"
- **Solución**: El nuevo SQL lo arregla, solo asegúrate de copiar TODO el archivo completo

### Error: "extension vector does not exist"
- **Solución**:
  1. Ve a: https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/database/extensions
  2. Busca "vector"
  3. Click en "Enable" si no está activo

---

## ✅ QUÉ HACE LA MIGRACIÓN

- **Elimina** tablas viejas con errores
- **Crea** 14 tablas nuevas sin recursión
- **Configura** RLS (Row Level Security) correctamente
- **Inserta** tests PHQ-9 y GAD-7 con preguntas
- **Habilita** Realtime para chat

---

## 🎯 Después de Aplicar

Una vez que funcione la verificación, podrás:

1. ✅ **Registrarte** en http://localhost:3000/registrar
2. ✅ **Iniciar sesión** en http://localhost:3000/iniciar-sesion
3. ✅ **Usar el chat** en http://localhost:3000/chat
4. ✅ **Ver tests psicológicos** en http://localhost:3000/evaluaciones

---

## 🆘 Si Tienes Problemas

Avísame con el error exacto que te salió y te ayudo.
