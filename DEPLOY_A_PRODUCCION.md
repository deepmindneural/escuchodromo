# 🚀 CÓMO DESPLEGAR A PRODUCCIÓN

**Problema:** Los cambios están en GitHub y los datos en Supabase, pero https://escuchodromo.com no tiene el código actualizado.

**Solución:** Necesitas hacer un DEPLOY a producción.

---

## OPCIÓN 1: VERCEL (Recomendado)

### Paso 1: Autenticar en Vercel
```bash
cd /Volumes/StarkT7/Proyectos/CLIENETS/proyectos/ESCUCHODROMO/Escuchodromo\ 2/escuchodromo
vercel login
```

### Paso 2: Vincular el proyecto (primera vez)
```bash
vercel link
```
Selecciona el proyecto "escuchodromo" existente.

### Paso 3: Desplegar a producción
```bash
vercel --prod
```

---

## OPCIÓN 2: Desde el Dashboard de Vercel

1. Ve a: https://vercel.com/dashboard
2. Busca el proyecto "escuchodromo"
3. Click en "Deployments"
4. Click en "Redeploy" en el último deployment
5. Marca la opción "Use existing Build Cache" si está disponible
6. Click en "Redeploy"

---

## OPCIÓN 3: Configurar Deployment Automático

### En Vercel Dashboard:
1. Ve a tu proyecto en https://vercel.com
2. Settings → Git
3. Verifica que esté conectado al repositorio correcto
4. Branch: `main`
5. Activa "Auto Deploy" para la rama `main`

Después de esto, cada `git push` desplegará automáticamente.

---

## VERIFICAR QUE FUNCIONÓ

Después del deploy, verifica:

1. **Ve a:** https://escuchodromo.com/profesional/pacientes
2. **Deberías ver:** 3-4 pacientes
3. **Si no ves pacientes:**
   - Asegúrate de iniciar sesión con: `profesional@escuchodromo.com`
   - Verifica en consola del navegador si hay errores

---

## CREDENCIALES DE PRUEBA

**Profesional:**
```
Email: profesional@escuchodromo.com
Contraseña: [la que configuraste]
```

**Pacientes en el sistema:**
- leandro (leo@gmal.com) - 5 citas
- breni (prueba2@prueba.com) - 3 citas
- darwuin (darwuin.723@gmail.com) - 2 citas

---

## TROUBLESHOOTING

### Si no se despliega:
```bash
# Forzar rebuild
vercel --prod --force

# Ver logs
vercel logs [deployment-url]
```

### Si ves errores 404:
- Verifica que el build de Next.js sea exitoso
- Revisa los logs de build en Vercel

### Si no ves pacientes después del deploy:
1. Abre consola del navegador (F12)
2. Ve a la pestaña Network
3. Recarga la página
4. Busca errores en las llamadas a Supabase
5. Verifica que las variables de entorno estén configuradas en Vercel

---

## VARIABLES DE ENTORNO EN VERCEL

Asegúrate de tener configuradas en Vercel → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://cvezncgcdsjntzrzztrj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2ZXpuY2djZHNqbnR6cnp6dHJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NjY2NjcsImV4cCI6MjA3NjA0MjY2N30.CddHpq9maykqCT9AfBAGRzidelWwdcYcWQ7pKm_81Q4
GEMINI_API_KEY=AIzaSyDgDUvZSVWz58pgBCTrgCA-uDLk0UZksYg
```

---

## COMANDO RÁPIDO (Todo en uno)

```bash
cd /Volumes/StarkT7/Proyectos/CLIENETS/proyectos/ESCUCHODROMO/Escuchodromo\ 2/escuchodromo && \
vercel --prod
```

Si te pide login, usa tu cuenta de Vercel.

---

## CONFIRMACIÓN DE DATOS EN SUPABASE

Los datos YA están en Supabase producción:
✅ 14 citas creadas
✅ 4 pacientes únicos
✅ Profesional configurado
✅ Evaluaciones PHQ-9/GAD-7

Solo falta que el CÓDIGO actualizado esté en producción.
