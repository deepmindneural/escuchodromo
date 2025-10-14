# 🚀 Instrucciones Rápidas - Aplicar Migraciones

## Paso 1: Abrir SQL Editor de Supabase

Ve a esta URL (se abrirá el SQL Editor de tu proyecto):
```
https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/sql/new
```

## Paso 2: Copiar y Pegar el SQL

1. Abre el archivo: `supabase/migracion-completa.sql`
2. Selecciona TODO el contenido (Cmd+A)
3. Copia (Cmd+C)
4. Pega en el SQL Editor de Supabase (Cmd+V)

## Paso 3: Ejecutar

Haz clic en el botón **"Run"** (abajo a la derecha)

Deberías ver:
- ✅ "Success. No rows returned"
- O un mensaje de éxito

## Paso 4: Verificar

En el menú lateral de Supabase, ve a **"Table Editor"**

Deberías ver 15 tablas:
- Usuario
- PerfilUsuario
- Sesion
- RegistroAnimo
- Conversacion
- Mensaje
- Prueba
- Pregunta
- Resultado
- Recomendacion
- Pago
- Notificacion
- ArchivoAdjunto
- SesionPublica
- MensajePublico

## Paso 5: Iniciar el Proyecto

```bash
npm run dev
```

Abre: http://localhost:3000

---

## ⚠️ Si hay errores

Si ves un error como "extension vector does not exist":
1. Ve a: https://supabase.com/dashboard/project/cvezncgcdsjntzrzztrj/settings/extensions
2. Busca "vector"
3. Activa la extensión
4. Vuelve a ejecutar el SQL

---

## 📝 Notas

- El archivo `migracion-completa.sql` contiene:
  - 15 tablas con vectores para IA
  - 40+ políticas RLS para seguridad
  - Realtime habilitado
  - Tests psicológicos (PHQ-9, GAD-7)

- **NO** necesitas crear usuarios de prueba manualmente
- El registro desde la app creará automáticamente los usuarios

---

## ✅ Listo

Una vez ejecutado, todo estará configurado y podrás usar la aplicación.
