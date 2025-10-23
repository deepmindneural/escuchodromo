# GUÍA DE IMPLEMENTACIÓN - SEGURIDAD ÁREA ADMIN
## Escuchodromo - Paso a Paso

**Fecha:** 2025-10-23
**Versión:** 1.0
**Tiempo Estimado de Implementación:** 3-4 horas

---

## RESUMEN EJECUTIVO

Este documento proporciona instrucciones paso a paso para implementar las mejoras de seguridad en el área de administrador de Escuchodromo.

**Archivos Creados:**
1. `/docs/AUDITORIA_SEGURIDAD_ADMIN.md` - Auditoría completa
2. `/docs/GUIA_CUMPLIMIENTO_HIPAA_GDPR.md` - Guía de compliance
3. `/supabase/migrations/20251023000000_admin_security_hardening.sql` - RLS + Audit Log
4. `/supabase/functions/admin-obtener-usuarios/index.ts` - Edge Function usuarios
5. `/supabase/functions/admin-gestionar-suscripcion/index.ts` - Edge Function suscripciones
6. `/supabase/functions/admin-acceso-phi/index.ts` - Edge Function acceso PHI
7. `/supabase/functions/_shared/cors.ts` - Configuración CORS

---

## PASO 1: APLICAR MIGRACIÓN DE BASE DE DATOS

### 1.1 Revisar Migración

```bash
# Revisar el contenido de la migración
cat supabase/migrations/20251023000000_admin_security_hardening.sql
```

**Esta migración incluye:**
- ✅ Tabla `AuditLogAdmin` para auditoría de acciones admin
- ✅ RLS policies mejoradas para `Usuario`, `Suscripcion`, `Mensaje`, `Resultado`
- ✅ Funciones `registrar_accion_admin()` y `admin_tiene_justificacion_reciente()`
- ✅ Vistas seguras `PagoSeguroAdmin` y `PagoCitaSeguroAdmin`
- ✅ Triggers automáticos para auditar cambios
- ✅ Función de estadísticas `obtener_estadisticas_admin()`

### 1.2 Aplicar Migración en Desarrollo

```bash
# Asegúrate de estar en el directorio del proyecto
cd /path/to/escuchodromo

# Aplicar migración localmente
npx supabase db reset

# O aplicar solo la nueva migración
npx supabase migration up
```

### 1.3 Verificar Migración

```sql
-- Verificar que la tabla AuditLogAdmin existe
SELECT table_name FROM information_schema.tables
WHERE table_name = 'AuditLogAdmin';

-- Verificar que las funciones existen
SELECT routine_name FROM information_schema.routines
WHERE routine_name IN ('registrar_accion_admin', 'admin_tiene_justificacion_reciente');

-- Probar función de estadísticas
SELECT * FROM obtener_estadisticas_admin();
```

### 1.4 Aplicar en Producción

```bash
# Conectar a Supabase producción
npx supabase link --project-ref TU_PROJECT_ID

# Aplicar migración
npx supabase db push

# Verificar
npx supabase db diff
```

---

## PASO 2: DESPLEGAR EDGE FUNCTIONS

### 2.1 Desplegar Funciones Admin

```bash
# Desplegar función de usuarios
npx supabase functions deploy admin-obtener-usuarios

# Desplegar función de suscripciones
npx supabase functions deploy admin-gestionar-suscripcion

# Desplegar función de acceso PHI
npx supabase functions deploy admin-acceso-phi

# Verificar deployment
npx supabase functions list
```

### 2.2 Configurar Variables de Entorno

En el dashboard de Supabase (Settings > Edge Functions):

```bash
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Para gestionar-suscripcion (cuando implementes Stripe)
STRIPE_SECRET_KEY=sk_test_...
```

### 2.3 Probar Edge Functions

```bash
# Probar admin-obtener-usuarios
curl -X POST https://TU_PROJECT.supabase.co/functions/v1/admin-obtener-usuarios \
  -H "Authorization: Bearer TU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filtros": {
      "busqueda": "",
      "rol": "",
      "estado": "",
      "pagina": 1,
      "limite": 10
    }
  }'
```

Respuesta esperada:
```json
{
  "usuarios": [...],
  "paginacion": {
    "pagina": 1,
    "limite": 10,
    "total": 50,
    "totalPaginas": 5
  },
  "metadata": {
    "duracion_ms": 245,
    "timestamp": "2025-10-23T..."
  }
}
```

---

## PASO 3: ACTUALIZAR FRONTEND ADMIN

### 3.1 Crear Cliente para Edge Functions

Archivo: `/src/lib/admin/edge-functions-client.ts`

```typescript
import { obtenerClienteNavegador } from '../supabase/cliente';

/**
 * Cliente para llamar Edge Functions de Admin
 */
export class AdminEdgeFunctionsClient {
  private supabase = obtenerClienteNavegador();

  /**
   * Obtiene lista de usuarios con filtros
   */
  async obtenerUsuarios(filtros: {
    busqueda?: string;
    rol?: string;
    estado?: string;
    pagina?: number;
    limite?: number;
  }) {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session) throw new Error('No autenticado');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-obtener-usuarios`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filtros }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener usuarios');
    }

    return response.json();
  }

  /**
   * Gestiona suscripción (cancelar, reactivar, pausar)
   */
  async gestionarSuscripcion(payload: {
    suscripcion_id: string;
    accion: 'cancelar' | 'reactivar' | 'pausar' | 'reanudar';
    justificacion: string;
    notificar_usuario?: boolean;
  }) {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session) throw new Error('No autenticado');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-gestionar-suscripcion`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al gestionar suscripción');
    }

    return response.json();
  }

  /**
   * Registra justificación para acceder a PHI
   */
  async solicitarAccesoPHI(payload: {
    tipo_recurso: 'mensajes' | 'evaluaciones' | 'notas_sesion' | 'conversaciones';
    justificacion: string;
    usuario_afectado_id?: string;
  }) {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session) throw new Error('No autenticado');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-acceso-phi`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al solicitar acceso PHI');
    }

    return response.json();
  }

  /**
   * Obtiene estadísticas del dashboard admin
   */
  async obtenerEstadisticas() {
    const { data, error } = await this.supabase.rpc('obtener_estadisticas_admin');
    if (error) throw error;
    return data[0]; // Función retorna array con 1 elemento
  }
}

export const adminClient = new AdminEdgeFunctionsClient();
```

### 3.2 Actualizar Página de Usuarios

Archivo: `/src/app/admin/usuarios/page.tsx`

**ANTES (queries directas):**
```typescript
const { data: usuariosData } = await supabase
  .from('Usuario')
  .select('...')
  .range(offset, offset + limite - 1);
```

**DESPUÉS (usando Edge Function):**
```typescript
import { adminClient } from '../../../lib/admin/edge-functions-client';

const cargarUsuarios = async () => {
  setCargando(true);
  try {
    const resultado = await adminClient.obtenerUsuarios({
      busqueda,
      rol: filtroRol,
      estado: filtroEstado,
      pagina: paginaActual,
      limite: 10,
    });

    setUsuarios(resultado.usuarios);
    setPaginacion(resultado.paginacion);
  } catch (error) {
    console.error('Error al cargar usuarios:', error);
    toast.error('Error al cargar usuarios');
  } finally {
    setCargando(false);
  }
};
```

### 3.3 Actualizar Página de Suscripciones

Archivo: `/src/app/admin/suscripciones/page.tsx`

**ANTES (UPDATE directo):**
```typescript
const { error } = await supabase
  .from('Suscripcion')
  .update({ estado: nuevoEstado })
  .eq('id', suscripcionId);
```

**DESPUÉS (usando Edge Function con justificación):**
```typescript
const cambiarEstado = async (suscripcionId: string, accion: string) => {
  // Mostrar modal para pedir justificación
  const justificacion = await mostrarModalJustificacion(
    `¿Por qué deseas ${accion} esta suscripción?`,
    20 // mínimo 20 caracteres
  );

  if (!justificacion) return;

  try {
    const resultado = await adminClient.gestionarSuscripcion({
      suscripcion_id: suscripcionId,
      accion: accion as 'cancelar' | 'reactivar' | 'pausar' | 'reanudar',
      justificacion,
      notificar_usuario: true,
    });

    toast.success(resultado.mensaje);
    cargarSuscripciones();
  } catch (error) {
    toast.error(error.message);
  }
};
```

### 3.4 Crear Modal de Justificación

Archivo: `/src/lib/componentes/admin/ModalJustificacion.tsx`

```typescript
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

interface ModalJustificacionProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (justificacion: string) => void;
  titulo: string;
  descripcion?: string;
  minimoCaracteres?: number;
}

export function ModalJustificacion({
  isOpen,
  onClose,
  onConfirm,
  titulo,
  descripcion,
  minimoCaracteres = 20,
}: ModalJustificacionProps) {
  const [justificacion, setJustificacion] = useState('');

  const handleConfirm = () => {
    if (justificacion.length < minimoCaracteres) {
      alert(`La justificación debe tener al menos ${minimoCaracteres} caracteres`);
      return;
    }
    onConfirm(justificacion);
    setJustificacion('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>
            {descripcion ||
              'Esta acción requiere justificación por motivos de compliance y auditoría.'}
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={justificacion}
          onChange={(e) => setJustificacion(e.target.value)}
          placeholder="Escribe la justificación aquí..."
          rows={4}
          className="mt-4"
        />

        <p className="text-sm text-muted-foreground">
          Caracteres: {justificacion.length}/{minimoCaracteres} mínimo
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={justificacion.length < minimoCaracteres}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## PASO 4: IMPLEMENTAR ACCESO PHI CON JUSTIFICACIÓN

### 4.1 Crear Hook de Acceso PHI

Archivo: `/src/lib/hooks/useAccesoPHI.ts`

```typescript
import { useState } from 'react';
import { adminClient } from '../admin/edge-functions-client';

export function useAccesoPHI() {
  const [cargando, setCargando] = useState(false);
  const [accesoActivo, setAccesoActivo] = useState(false);
  const [expiraEn, setExpiraEn] = useState<Date | null>(null);

  const solicitarAcceso = async (
    tipoRecurso: 'mensajes' | 'evaluaciones' | 'notas_sesion' | 'conversaciones',
    justificacion: string,
    usuarioAfectadoId?: string
  ) => {
    setCargando(true);
    try {
      const resultado = await adminClient.solicitarAccesoPHI({
        tipo_recurso: tipoRecurso,
        justificacion,
        usuario_afectado_id: usuarioAfectadoId,
      });

      setAccesoActivo(true);
      setExpiraEn(new Date(resultado.acceso.expira_en));

      // Auto-desactivar después de 10 minutos
      setTimeout(() => {
        setAccesoActivo(false);
        setExpiraEn(null);
      }, 10 * 60 * 1000);

      return resultado;
    } catch (error) {
      throw error;
    } finally {
      setCargando(false);
    }
  };

  return {
    solicitarAcceso,
    accesoActivo,
    expiraEn,
    cargando,
  };
}
```

### 4.2 Usar en Página de Historiales

Archivo: `/src/app/admin/historiales/page.tsx` (ejemplo)

```typescript
'use client';

import { useState } from 'react';
import { useAccesoPHI } from '../../../lib/hooks/useAccesoPHI';
import { ModalJustificacion } from '../../../lib/componentes/admin/ModalJustificacion';

export default function AdminHistoriales() {
  const { solicitarAcceso, accesoActivo, expiraEn } = useAccesoPHI();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tipoRecursoSolicitado, setTipoRecursoSolicitado] = useState<string | null>(null);

  const handleSolicitarAcceso = async (justificacion: string) => {
    try {
      await solicitarAcceso(
        tipoRecursoSolicitado as 'evaluaciones',
        justificacion
      );
      toast.success('Acceso autorizado por 10 minutos');
      // Ahora puedes cargar evaluaciones
      cargarEvaluaciones();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const cargarEvaluaciones = async () => {
    if (!accesoActivo) {
      // Solicitar justificación primero
      setTipoRecursoSolicitado('evaluaciones');
      setModalAbierto(true);
      return;
    }

    // Cargar evaluaciones (ahora RLS permitirá acceso)
    const { data } = await supabase
      .from('Resultado')
      .select('*')
      .limit(10);

    setEvaluaciones(data);
  };

  return (
    <div>
      {accesoActivo && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-4">
          ⚠️ Acceso a PHI activo - Expira en:{' '}
          {expiraEn && new Date(expiraEn).toLocaleTimeString()}
        </div>
      )}

      <Button onClick={cargarEvaluaciones}>Ver Evaluaciones</Button>

      <ModalJustificacion
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onConfirm={handleSolicitarAcceso}
        titulo="Acceso a Evaluaciones (PHI)"
        descripcion="Explica por qué necesitas acceder a información médica protegida."
        minimoCaracteres={30}
      />
    </div>
  );
}
```

---

## PASO 5: CONFIGURAR NOTIFICACIONES DE SEGURIDAD

### 5.1 Crear Webhook para Alertas (Opcional)

Archivo: `/supabase/functions/security-alerts/index.ts`

```typescript
/**
 * Edge Function: security-alerts
 * Envía notificaciones cuando hay acceso sospechoso a PHI
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req: Request) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Detectar accesos sospechosos
  const { data: accesosSospechosos } = await supabaseClient.rpc(
    'detectar_accesos_sospechosos',
    { p_dias_atras: 1 }
  );

  if (accesosSospechosos && accesosSospechosos.length > 0) {
    // TODO: Enviar a Slack/Discord/Email
    console.log('🚨 ALERTA: Accesos sospechosos detectados:', accesosSospechosos);

    // Ejemplo: enviar a Slack
    // await fetch(Deno.env.get('SLACK_WEBHOOK_URL'), {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     text: `🚨 Acceso sospechoso a PHI: ${accesosSospechosos[0].usuario_email}`,
    //   }),
    // });
  }

  return new Response(JSON.stringify({ alertas_enviadas: accesosSospechosos?.length || 0 }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### 5.2 Configurar Cron Job (Supabase)

En Supabase Dashboard > Database > Cron Jobs:

```sql
-- Ejecutar cada hora
SELECT cron.schedule(
  'detectar-accesos-sospechosos',
  '0 * * * *', -- Cada hora
  $$
  SELECT net.http_post(
    url := 'https://TU_PROJECT.supabase.co/functions/v1/security-alerts',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

---

## PASO 6: PRUEBAS Y VALIDACIÓN

### 6.1 Test de Seguridad - RLS Policies

```sql
-- Conectar como admin
SET request.jwt.claim.sub = 'AUTH_ID_DEL_ADMIN';
SET request.jwt.claim.role = 'authenticated';

-- Test 1: Admin puede ver usuarios
SELECT COUNT(*) FROM "Usuario"; -- Debe retornar todos

-- Test 2: Admin NO puede modificar evaluaciones
UPDATE "Resultado" SET puntuacion = 99 WHERE id = 'UUID_PRUEBA';
-- Debe FALLAR con "new row violates row-level security policy"

-- Test 3: Admin necesita justificación para ver mensajes
SELECT * FROM "Mensaje" LIMIT 1;
-- Debe FALLAR con "new row violates row-level security policy"

-- Registrar justificación
SELECT registrar_accion_admin(
  'ver_mensajes',
  'Mensaje',
  NULL,
  NULL,
  'Investigación de incidente de seguridad',
  true, -- es_acceso_phi
  NULL,
  '192.168.1.1',
  'Mozilla/5.0',
  '/admin/mensajes',
  'GET'
);

-- Ahora debe funcionar (por 10 minutos)
SELECT * FROM "Mensaje" LIMIT 1; -- Debe retornar resultados
```

### 6.2 Test de Edge Functions

```bash
# Test 1: Acceso sin autenticación
curl -X POST https://TU_PROJECT.supabase.co/functions/v1/admin-obtener-usuarios \
  -H "Content-Type: application/json"
# Esperado: 401 Unauthorized

# Test 2: Acceso como usuario normal (no admin)
curl -X POST https://TU_PROJECT.supabase.co/functions/v1/admin-obtener-usuarios \
  -H "Authorization: Bearer JWT_DE_USUARIO_NORMAL" \
  -H "Content-Type: application/json"
# Esperado: 403 Forbidden

# Test 3: Acceso como admin (válido)
curl -X POST https://TU_PROJECT.supabase.co/functions/v1/admin-obtener-usuarios \
  -H "Authorization: Bearer JWT_DE_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"filtros": {"pagina": 1, "limite": 10}}'
# Esperado: 200 OK con lista de usuarios
```

### 6.3 Test de Audit Logging

```sql
-- Verificar que las acciones se registran
SELECT
  admin_email,
  accion,
  tabla_afectada,
  justificacion,
  es_acceso_phi,
  creado_en
FROM "AuditLogAdmin"
ORDER BY creado_en DESC
LIMIT 10;

-- Verificar triggers automáticos
UPDATE "Usuario" SET rol = 'TERAPEUTA' WHERE id = 'UUID_PRUEBA';

-- Debe aparecer en audit log
SELECT * FROM "AuditLogAdmin"
WHERE accion = 'cambiar_rol_usuario'
ORDER BY creado_en DESC LIMIT 1;
```

---

## PASO 7: DEPLOYMENT A PRODUCCIÓN

### 7.1 Checklist Pre-Deployment

- [ ] Migración probada en desarrollo
- [ ] Edge Functions desplegadas y probadas
- [ ] Frontend actualizado con nuevos clientes
- [ ] Tests de seguridad pasados
- [ ] Variables de entorno configuradas
- [ ] Backup de base de datos creado
- [ ] Equipo notificado de deployment
- [ ] Rollback plan documentado

### 7.2 Deployment

```bash
# 1. Crear backup
npx supabase db dump > backup_pre_seguridad_$(date +%Y%m%d).sql

# 2. Aplicar migración
npx supabase db push --linked

# 3. Desplegar Edge Functions
npx supabase functions deploy admin-obtener-usuarios
npx supabase functions deploy admin-gestionar-suscripcion
npx supabase functions deploy admin-acceso-phi

# 4. Desplegar Frontend
npm run build
npm run deploy # O tu comando de deploy

# 5. Smoke tests
curl -X GET https://escuchodromo.com/admin
# Verificar que /admin carga correctamente
```

### 7.3 Monitoreo Post-Deployment

```bash
# Ver logs de Edge Functions
npx supabase functions logs admin-obtener-usuarios --tail

# Ver logs de errores en frontend
# (usar tu herramienta de APM: Sentry, LogRocket, etc.)

# Verificar audit logs
# Conectarse a DB y ejecutar:
SELECT COUNT(*) FROM "AuditLogAdmin"
WHERE creado_en >= now() - INTERVAL '1 hour';
```

---

## PASO 8: CAPACITACIÓN DEL EQUIPO

### 8.1 Sesión de Capacitación (1 hora)

**Agenda:**
1. Demostración de nuevas funcionalidades (15 min)
   - Cómo usar Edge Functions en lugar de queries directas
   - Proceso de justificación para acceso PHI
2. Walkthrough del código (20 min)
   - Revisar archivo de edge-functions-client.ts
   - Mostrar cómo funciona ModalJustificacion
3. Revisión de Audit Logs (15 min)
   - Cómo ver el historial de acciones admin
   - Interpretación de logs sospechosos
4. Q&A (10 min)

### 8.2 Documentación Interna

Crear página en Wiki/Notion con:
- ✅ Cómo acceder al panel admin
- ✅ Cuándo es necesario justificar accesos
- ✅ Ejemplos de justificaciones apropiadas
- ✅ Qué hacer si detectas actividad sospechosa
- ✅ Contactos de seguridad

---

## TROUBLESHOOTING

### Problema: "Usuario no autenticado" al llamar Edge Function

**Solución:**
```typescript
// Verificar que el token JWT se está enviando correctamente
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session); // Debe tener access_token

// Si no hay sesión, redirigir a login
if (!session) {
  router.push('/iniciar-sesion');
}
```

### Problema: RLS bloquea acceso incluso después de registrar justificación

**Solución:**
```sql
-- Verificar que la justificación se registró
SELECT * FROM "AuditLogAdmin"
WHERE admin_id = (SELECT id FROM "Usuario" WHERE auth_id = auth.uid())
  AND accion = 'ver_mensajes'
  AND creado_en >= now() - INTERVAL '10 minutes';

-- Si no aparece, la función registrar_accion_admin falló
-- Revisar logs de Edge Function
```

### Problema: Edge Function devuelve 500 Internal Server Error

**Solución:**
```bash
# Ver logs de la función
npx supabase functions logs admin-obtener-usuarios

# Buscar stack trace del error
# Comúnmente causado por:
# 1. Variable de entorno faltante
# 2. Error en query de Supabase
# 3. Timeout de función (default 30s)
```

---

## PRÓXIMOS PASOS

### Prioridad 1 (Esta Semana)
1. ✅ Implementar MFA para cuentas ADMIN
2. ✅ Crear página de audit logs en `/admin/auditoria`
3. ✅ Implementar función de exportar datos (GDPR Art. 20)

### Prioridad 2 (Próximas 2 Semanas)
4. ✅ Integración completa con Stripe en `admin-gestionar-suscripcion`
5. ✅ Dashboard de security events en tiempo real
6. ✅ Alertas automáticas a Slack para accesos sospechosos

### Prioridad 3 (Próximo Mes)
7. ✅ Penetration testing por firma externa
8. ✅ Simulacro de respuesta a breach
9. ✅ Certificación HIPAA/SOC 2

---

## RECURSOS ADICIONALES

**Documentación:**
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Edge Functions Reference](https://supabase.com/docs/guides/functions)
- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html)

**Contactos:**
- Security Officer: security@escuchodromo.com
- Tech Lead: tech@escuchodromo.com
- Soporte Supabase: support@supabase.com

---

**Última Actualización:** 2025-10-23
**Autor:** Claude Code - Backend Security Engineer
