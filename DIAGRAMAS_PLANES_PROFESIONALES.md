# DIAGRAMAS - SISTEMA DE PLANES PARA PROFESIONALES

**Fecha:** 2025-10-24
**Complemento de:** DISENO_PLANES_PROFESIONALES.md

---

## 1. DIAGRAMA ENTIDAD-RELACIÓN (ERD)

```
┌──────────────────────────────────────────────────────────────────────┐
│                         SISTEMA DE SUSCRIPCIONES                      │
└──────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐
│      Usuario        │
│─────────────────────│
│ id (PK)             │◄────────────┐
│ auth_id (UNIQUE)    │             │
│ email               │             │
│ nombre              │             │
│ rol: USUARIO |      │             │
│      TERAPEUTA |    │             │
│      ADMIN          │             │
└─────────────────────┘             │
         │                          │
         │ 1:1                      │
         ↓                          │
┌─────────────────────┐             │
│ PerfilProfesional   │             │ usuario_id (FK)
│─────────────────────│             │
│ id (PK)             │             │
│ usuario_id (FK)     │─────────────┤
│ titulo_profesional  │             │
│ numero_licencia     │             │
│ especialidades[]    │             │
│ perfil_aprobado     │             │
│ suscripcion_profesional_id (FK) ──┐
└─────────────────────┘             │
                                    │
         ┌──────────────────────────┘
         │
         ↓
┌─────────────────────┐        1:N        ┌─────────────────────┐
│   Suscripcion       │◄───────────────────│   LimitesPlan       │
│─────────────────────│                    │─────────────────────│
│ id (PK)             │                    │ id (PK)             │
│ usuario_id (FK)     │                    │ tipo_usuario        │
│ tipo_usuario ◄──────┼────┐               │ codigo_plan         │
│   • paciente        │    │               │ limite_pacientes    │
│   • profesional     │    │               │ limite_horas_mes    │
│ plan ◄──────────────┼────┼───────────────│ acceso_api          │
│ periodo             │    │               │ acceso_ia_assistant │
│ precio              │    │               │ prioridad_listado   │
│ moneda              │    │               │ insignia            │
│ estado              │    │               └─────────────────────┘
│ stripe_subscription_id│  │                    (Configuración)
│ stripe_customer_id  │    │
│                     │    │
│ ── NUEVOS CAMPOS ───│    │
│ limite_pacientes    │◄───┘ Copiado al crear suscripción
│ limite_horas_mes    │
│ prioridad_listado   │
│ insignia            │
│ acceso_api          │
│ acceso_ia_assistant │
│ uso_mes_actual (JSONB) {
│   pacientes_activos: 0,
│   horas_sesion_usadas: 0
│ }                   │
└─────────────────────┘

CONSTRAINT:
• UNIQUE (usuario_id, tipo_usuario)
  → Un usuario puede tener UNA suscripción de paciente
    Y UNA suscripción de profesional
```

---

## 2. DIAGRAMA DE FLUJO - LIFECYCLE DE SUSCRIPCIÓN PROFESIONAL

```
              REGISTRO PROFESIONAL
                      │
                      ↓
         ┌────────────────────────┐
         │ Crear PerfilProfesional│
         │ perfil_aprobado=false  │
         └────────────┬───────────┘
                      │
                      ↓
         ┌────────────────────────┐
         │  Activar TRIAL (14d)   │
         │  Crear Suscripcion:    │
         │  - plan='trial'        │
         │  - tipo='profesional'  │
         │  - estado='activa'     │
         │  - limite: 3 pacientes │
         └────────────┬───────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
          ↓                       ↓
    ┌──────────┐           ┌──────────┐
    │ APROBADO │           │ USANDO   │
    │ por Admin│           │ TRIAL    │
    └────┬─────┘           └────┬─────┘
         │                      │
         │                      ↓
         │              ┌───────────────┐
         │              │ Día 14 llega  │
         │              └───────┬───────┘
         │                      │
         │              ┌───────┴────────┐
         │              │                │
         │              ↓                ↓
         │      ┌──────────────┐   ┌────────────┐
         │      │ COMPRA PLAN  │   │ NO COMPRA  │
         │      └──────┬───────┘   └─────┬──────┘
         │             │                 │
         │             │                 ↓
         │             │         ┌────────────────┐
         │             │         │ estado=vencida │
         │             │         │ BLOQUEADO      │
         │             │         │ (Solo lectura) │
         │             │         └────────────────┘
         │             │
         └─────────────┼─────────────────┐
                       │                 │
                       ↓                 │
              ┌────────────────┐         │
              │ STRIPE CHECKOUT│         │
              └────────┬───────┘         │
                       │                 │
                       ↓                 │
              ┌────────────────┐         │
              │ WEBHOOK        │         │
              │ Stripe Success │         │
              └────────┬───────┘         │
                       │                 │
                       ↓                 │
              ┌────────────────┐         │
              │ UPDATE         │         │
              │ Suscripcion:   │         │
              │ - plan=elegido │         │
              │ - stripe_id=xxx│         │
              │ - estado=activa│         │
              └────────┬───────┘         │
                       │                 │
                       ↓                 │
              ┌────────────────┐         │
              │ PROFESIONAL    │◄────────┘
              │ ACTIVO         │ (Si aprobado)
              │ Acceso Completo│
              └────────┬───────┘
                       │
                       │ USO MENSUAL
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ↓              ↓              ↓
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ Agendar  │  │ Aceptar  │  │ Sesión   │
  │ Cita     │  │ Paciente │  │ Completa │
  └────┬─────┘  └────┬─────┘  └────┬─────┘
       │             │             │
       ↓             ↓             ↓
  ┌─────────────────────────────────┐
  │ validar_limite_profesional()    │
  │ - Verifica pacientes_activos    │
  │ - Verifica horas_sesion_usadas  │
  └───────────┬─────────────────────┘
              │
      ┌───────┴────────┐
      │                │
      ↓                ↓
  ┌────────┐      ┌────────┐
  │ PERMITIR│      │ BLOQUEAR│
  │ ✅      │      │ ❌      │
  └────────┘      └────┬────┘
                       │
                       ↓
              ┌────────────────┐
              │ Mostrar Modal: │
              │ "Actualiza plan"│
              └────────────────┘
```

---

## 3. DIAGRAMA DE SECUENCIA - COMPRA DE PLAN

```
Usuario          Frontend         Edge Function      Stripe API       Webhook         Supabase
  │                 │                   │                 │              │                │
  │ Clic "Comprar   │                   │                 │              │                │
  │  Plan Inicial"  │                   │                 │              │                │
  │────────────────►│                   │                 │              │                │
  │                 │                   │                 │              │                │
  │                 │ POST /checkout    │                 │              │                │
  │                 │  plan='inicial'   │                 │              │                │
  │                 │──────────────────►│                 │              │                │
  │                 │                   │                 │              │                │
  │                 │                   │ Validar usuario │              │                │
  │                 │                   │ y plan          │              │                │
  │                 │                   │─────────────────┼──────────────┼───────────────►│
  │                 │                   │                 │              │                │
  │                 │                   │◄────────────────┼──────────────┼────────────────│
  │                 │                   │ Usuario válido  │              │                │
  │                 │                   │                 │              │                │
  │                 │                   │ Crear Checkout  │              │                │
  │                 │                   │ Session         │              │                │
  │                 │                   │────────────────►│              │                │
  │                 │                   │                 │              │                │
  │                 │                   │◄────────────────│              │                │
  │                 │                   │ Session URL     │              │                │
  │                 │                   │                 │              │                │
  │                 │◄──────────────────│                 │              │                │
  │                 │ { checkout_url }  │                 │              │                │
  │◄────────────────│                   │                 │              │                │
  │                 │                   │                 │              │                │
  │ Redirigir a     │                   │                 │              │                │
  │ Stripe Checkout │                   │                 │              │                │
  │────────────────────────────────────────────────────►│              │                │
  │                                                       │              │                │
  │                  Ingresar tarjeta                     │              │                │
  │◄─────────────────────────────────────────────────────│              │                │
  │                                                       │              │                │
  │                  Confirmar pago                       │              │                │
  │──────────────────────────────────────────────────────►│              │                │
  │                                                       │              │                │
  │                                                       │ Event:       │                │
  │                                                       │ checkout.    │                │
  │                                                       │ session.     │                │
  │                                                       │ completed    │                │
  │                                                       │─────────────►│                │
  │                                                       │              │                │
  │                                                       │              │ UPDATE         │
  │                                                       │              │ Suscripcion    │
  │                                                       │              │ SET plan=      │
  │                                                       │              │ 'inicial',     │
  │                                                       │              │ stripe_id=xxx, │
  │                                                       │              │ estado=activa  │
  │                                                       │              │───────────────►│
  │                                                       │              │                │
  │                                                       │              │◄───────────────│
  │                                                       │              │ Success        │
  │                                                       │              │                │
  │                                                       │◄─────────────│                │
  │                                                       │ 200 OK       │                │
  │                                                       │              │                │
  │◄──────────────────────────────────────────────────────│              │                │
  │ Redirigir a /profesional/planes/success               │              │                │
  │                                                                                        │
  │                 GET /api/suscripcion                                                   │
  │───────────────────────────────────────────────────────────────────────────────────────►│
  │                                                                                        │
  │◄───────────────────────────────────────────────────────────────────────────────────────│
  │ { plan: 'inicial', estado: 'activa', limite_pacientes: 10 }                            │
  │                                                                                        │
  │ 🎉 ¡Bienvenido al Plan Inicial!                                                        │
  │                                                                                        │
```

---

## 4. DIAGRAMA DE VALIDACIÓN DE LÍMITES

```
┌──────────────────────────────────────────────────────────────┐
│              Profesional intenta aceptar paciente            │
│                  (desde /profesional/pacientes)              │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ↓
                ┌────────────────────┐
                │ Llamar RPC:        │
                │ validar_limite_    │
                │ profesional(       │
                │   id,              │
                │   'pacientes'      │
                │ )                  │
                └─────────┬──────────┘
                          │
            ┌─────────────┴─────────────┐
            │                           │
            ↓                           ↓
   ┌────────────────┐           ┌────────────────┐
   │ Query:         │           │ Query:         │
   │ Suscripcion    │           │ LimitesPlan    │
   │ WHERE          │           │ WHERE          │
   │ usuario_id=X   │           │ codigo_plan=Y  │
   │ AND tipo=      │           │ AND tipo=      │
   │ 'profesional'  │           │ 'profesional'  │
   └────────┬───────┘           └────────┬───────┘
            │                           │
            │                           │
            └───────────┬───────────────┘
                        │
                        ↓
           ┌────────────────────────────┐
           │ Comparar:                  │
           │ uso_mes_actual.            │
           │ pacientes_activos          │
           │    VS                      │
           │ limite_pacientes           │
           └─────────┬──────────────────┘
                     │
        ┌────────────┴──────────────┐
        │                           │
        ↓                           ↓
┌───────────────┐           ┌───────────────┐
│ usado < limite│           │usado >= limite│
│               │           │               │
│ Permitir ✅   │           │ Rechazar ❌   │
└───────┬───────┘           └───────┬───────┘
        │                           │
        ↓                           ↓
┌───────────────┐           ┌───────────────┐
│ Aceptar       │           │ Mostrar modal:│
│ paciente      │           │               │
│               │           │ "Has alcanzado│
│ Incrementar   │           │  el límite de │
│ contador en   │           │  10 pacientes"│
│ uso_mes_actual│           │               │
│               │           │ [Actualizar   │
│               │           │  Plan] →      │
└───────────────┘           └───────────────┘
```

---

## 5. DIAGRAMA DE ESTADOS - SUSCRIPCIÓN

```
                    ┌──────────────┐
                    │   CREADA     │ (al completar checkout)
                    │ estado=activa│
                    └──────┬───────┘
                           │
                ┌──────────┴──────────┐
                │ Uso normal del      │
                │ servicio            │
                └──────────┬──────────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
            ↓              ↓              ↓
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │ USUARIO      │ │ ALCANZA      │ │ SOLICITA     │
    │ CANCELA      │ │ FECHA_FIN    │ │ PAUSA        │
    └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
           │                │                │
           ↓                ↓                ↓
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │ cancelar_al  │ │   vencida    │ │   pausada    │
    │   _final     │ │              │ │              │
    └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
           │                │                │
           │                │                │
    ┌──────┴─────┐   ┌──────┴─────┐   ┌──────┴─────┐
    │ Sigue activo│   │ BLOQUEADO  │   │ BLOQUEADO  │
    │ hasta       │   │ Solo       │   │ Temporalmen│
    │ fecha_fin   │   │ lectura    │   │ te         │
    └──────┬──────┘   └──────┬─────┘   └──────┬─────┘
           │                 │                 │
           ↓                 ↓                 ↓
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ fecha_fin    │  │ REACTIVAR?   │  │ REANUDAR?    │
    │ alcanzada    │  │              │  │              │
    └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
           │                 │                 │
           ↓                 │                 │
    ┌──────────────┐         │                 │
    │   vencida    │         │                 │
    └──────────────┘         │                 │
                             │                 │
                             ↓                 ↓
                      ┌──────────────────────────┐
                      │ Nueva Suscripcion        │
                      │ estado=activa            │
                      └──────────────────────────┘

LEYENDA:
• activa: Usuario tiene acceso completo
• cancelar_al_final: Sigue activo hasta fecha_fin
• vencida: Bloqueado, solo lectura
• pausada: Bloqueado temporalmente
```

---

## 6. DIAGRAMA DE COMPONENTES - FRONTEND

```
┌────────────────────────────────────────────────────────────────┐
│                    /profesional/*                              │
│                    (Panel Profesional)                         │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  Sidebar                                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Logo                                                     │  │
│  │                                                           │  │
│  │  Dashboard                                                │  │
│  │  Pacientes   ◄─── useSuscripcionProfesional()            │  │
│  │  Calendario       │                                       │  │
│  │  Perfil           └─► { plan, limite_pacientes,          │  │
│  │  Planes              limite_horas, usado }               │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────┐                 │  │
│  │  │ 📊 Plan Actual: INICIAL              │                 │  │
│  │  │ Pacientes: 7/10 🟢                   │                 │  │
│  │  │ Horas: 15/20 🟡                      │                 │  │
│  │  │                                      │                 │  │
│  │  │ [Actualizar Plan]                    │                 │  │
│  │  └─────────────────────────────────────┘                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                              │
                              │
┌─────────────────────────────┼─────────────────────────────────┐
│                             ↓                                  │
│  /profesional/pacientes/page.tsx                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Mis Pacientes (7 de 10)                                 │ │
│  │                                                           │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │ Solicitud de Juan Pérez                             │ │ │
│  │  │ "Quiere agendar primera cita"                       │ │ │
│  │  │                                                      │ │ │
│  │  │ [Aceptar]   [Rechazar]                              │ │ │
│  │  │     │                                                │ │ │
│  │  │     └──► onClick={() => {                           │ │ │
│  │  │            validarLimite()                           │ │ │
│  │  │              .then(() => aceptarPaciente())          │ │ │
│  │  │              .catch(() => mostrarModalUpgrade())     │ │ │
│  │  │          }}                                          │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                              │
                              │ mostrarModalUpgrade()
                              ↓
┌────────────────────────────────────────────────────────────────┐
│  <ModalUpgradePlan />                                          │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  🚀 Has alcanzado el límite de pacientes                 │ │
│  │                                                           │ │
│  │  Tu plan INICIAL permite 10 pacientes.                   │ │
│  │  Actualmente tienes 10 pacientes activos.                │ │
│  │                                                           │ │
│  │  Actualiza a CRECIMIENTO y gestiona hasta 50 pacientes.  │ │
│  │                                                           │ │
│  │  ┌────────────────┐  ┌────────────────┐                 │ │
│  │  │ Ver Planes     │  │ Cerrar         │                 │ │
│  │  │ → /planes      │  │                │                 │ │
│  │  └────────────────┘  └────────────────┘                 │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  /profesional/planes/page.tsx                                  │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Elige tu Plan                                            │ │
│  │                                                           │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │ │
│  │  │ INICIAL    │  │ CRECIMIENTO│  │ PLUS       │         │ │
│  │  │ $69,900    │  │ $149,900   │  │ $299,900   │         │ │
│  │  │            │  │            │  │            │  ACTUAL  │ │
│  │  │ 10 pacientes│ │ 50 pacient │  │ Ilimitado  │         │ │
│  │  │ 20 horas   │  │ 80 horas   │  │ Ilimitado  │         │ │
│  │  │            │  │ + Analytics│  │ + IA       │         │ │
│  │  │            │  │ + Verificado│ │ + Destacado│         │ │
│  │  │            │  │            │  │            │         │ │
│  │  │ [Cambiar]  │  │ [Cambiar]  │  │ [Cambiar]  │         │ │
│  │  │    │       │  │    │       │  │    │       │         │ │
│  │  └────┼───────┘  └────┼───────┘  └────┼───────┘         │ │
│  │       │               │               │                  │ │
│  │       └───────────────┴───────────────┘                  │ │
│  │                       │                                  │ │
│  │                       ↓                                  │ │
│  │       router.push(`/profesional/planes/checkout/${plan}`)│ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

---

## 7. DIAGRAMA DE DESPLIEGUE

```
┌──────────────────────────────────────────────────────────────┐
│                      CLIENTE (Browser)                        │
│  Next.js SSR + React Components                              │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ↓ HTTPS
┌──────────────────────────────────────────────────────────────┐
│                    VERCEL / NETLIFY                           │
│  Next.js App (apps/web)                                      │
│  - Server Components                                         │
│  - API Routes                                                │
└────────────────────────┬─────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ↓              ↓              ↓
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  SUPABASE       │ │ EDGE FUNCTIONS  │ │  STRIPE API     │
│  - PostgreSQL   │ │ (Deno Deploy)   │ │  - Checkout     │
│  - Auth         │ │                 │ │  - Webhooks     │
│  - Storage      │ │ • checkout-plan │ │  - Billing      │
│  - RLS          │ │ • validar-limite│ │                 │
└─────────────────┘ │ • webhook-stripe│ └─────────────────┘
                    └─────────────────┘
                              │
                              ↓
                    ┌─────────────────┐
                    │  CRON JOBS      │
                    │  (Supabase)     │
                    │                 │
                    │ • resetear_uso  │
                    │   (1º de c/mes) │
                    │                 │
                    │ • vencer_trials │
                    │   (diario)      │
                    └─────────────────┘
```

---

## 8. TABLA DE DECISIÓN - VALIDACIÓN DE LÍMITES

| Límite Plan | Uso Actual | Resultado | Acción |
|-------------|-----------|-----------|--------|
| `NULL` (ilimitado) | Cualquiera | ✅ PERMITIR | Continuar |
| `10` | `5` | ✅ PERMITIR | Continuar |
| `10` | `10` | ❌ BLOQUEAR | Mostrar modal upgrade |
| `10` | `15` | ❌ BLOQUEAR | Mostrar modal upgrade |
| `50` | `49` | ⚠️ ADVERTIR | Continuar + banner "1 restante" |
| `50` | `50` | ❌ BLOQUEAR | Mostrar modal upgrade |

---

## 9. CRONOGRAMA VISUAL (GANTT)

```
FASE 1: Base de Datos (2 días)
▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░ [Día 1-2]

FASE 2: Backend (3 días)
░░░░░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░ [Día 3-5]

FASE 3: Frontend (4 días)
░░░░░░░░░░░░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░ [Día 6-9]

FASE 4: Stripe (2 días)
░░░░░░░░░░░░░░░░░░░░▓▓▓▓▓▓▓▓▓▓░░░░░░░ [Día 8-9]
                     (Paralelo con Frontend)

FASE 5: Admin Panel (2 días)
░░░░░░░░░░░░░░░░░░░░░░░░▓▓▓▓▓▓▓▓▓▓░░░ [Día 10-11]

FASE 6: Testing E2E (3 días)
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓ [Día 12-14]

FASE 7: Documentación (1 día)
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▓▓▓▓▓ [Día 15]

┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┐
│1│2│3│4│5│6│7│8│9│10│11│12│13│14│15│ DÍAS
└─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┘

TOTAL: 15 días hábiles (3 semanas)
```

---

**FIN DEL DOCUMENTO**

Estos diagramas complementan el documento principal `DISENO_PLANES_PROFESIONALES.md` y proporcionan una vista visual de la arquitectura propuesta.
