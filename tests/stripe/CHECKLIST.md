# Checklist de Validación Manual - Sistema de Pagos Stripe

> Use este checklist para validación manual antes de cada deploy a producción.

## Información de Sesión de Testing

- **Fecha**: _______________
- **Tester**: _______________
- **Versión**: _______________
- **Ambiente**: [ ] Test [ ] Staging [ ] Producción

---

## 1. CONFIGURACIÓN PRE-TESTING

### Variables de Entorno

- [ ] `STRIPE_SECRET_KEY` configurada (comienza con `sk_test_` o `sk_live_`)
- [ ] `STRIPE_WEBHOOK_SECRET` configurada
- [ ] Claves correctas para el ambiente (test vs live)
- [ ] Webhook endpoint accesible públicamente
- [ ] HTTPS habilitado (requerido para producción)

### Dashboard de Stripe

- [ ] Productos creados para cada plan (Básico, Premium, Profesional)
- [ ] Precios configurados (mensual y anual)
- [ ] Webhook endpoint registrado
- [ ] Eventos de webhook seleccionados correctamente
- [ ] Modo test/live correcto

---

## 2. FLUJOS DE PAGO (E2E)

### 2.1 Usuario Nuevo - Plan Premium Mensual

**Prioridad: CRÍTICO**

- [ ] Usuario se registra exitosamente
- [ ] Usuario selecciona plan Premium Mensual
- [ ] Se crea sesión de checkout
- [ ] URL de checkout se genera
- [ ] Usuario es redirigido a Stripe
- [ ] Pantalla de checkout muestra información correcta:
  - [ ] Nombre del plan
  - [ ] Precio correcto (COP 49,900 o USD 12)
  - [ ] Frecuencia: Mensual
- [ ] Pago con tarjeta exitosa (`4242...`)
- [ ] Redirección a página de éxito
- [ ] Webhook recibido y procesado
- [ ] Registro en tabla `Suscripcion`:
  - [ ] Estado: `activa`
  - [ ] Plan: `premium`
  - [ ] stripe_suscripcion_id presente
- [ ] Registro en tabla `Pago`:
  - [ ] Estado: `completado`
  - [ ] Monto correcto
- [ ] Usuario tiene acceso a features premium
- [ ] Email de confirmación enviado (si aplica)

**Resultado**: [ ] PASÓ [ ] FALLÓ

**Notas**:
```
_______________________________________________
_______________________________________________
```

---

### 2.2 Usuario Nuevo - Plan Profesional Anual

**Prioridad: CRÍTICO**

- [ ] Usuario selecciona plan Profesional Anual
- [ ] Precio muestra descuento del 20%
- [ ] Precio anual: COP 959,000 (vs 1,198,800 sin descuento)
- [ ] Checkout completado exitosamente
- [ ] Suscripción creada con periodo: `anual`
- [ ] Fecha de renovación en ~365 días

**Resultado**: [ ] PASÓ [ ] FALLÓ

---

### 2.3 Plan Básico Gratuito

**Prioridad: ALTO**

- [ ] Usuario selecciona plan Básico
- [ ] NO se crea sesión de Stripe
- [ ] Usuario redirigido directamente al dashboard
- [ ] Suscripción creada en BD:
  - [ ] Plan: `basico`
  - [ ] Precio: 0
  - [ ] Estado: `activa`
  - [ ] stripe_suscripcion_id: NULL
- [ ] Usuario tiene acceso a features básicas

**Resultado**: [ ] PASÓ [ ] FALLÓ

---

### 2.4 Upgrade: Premium → Profesional

**Prioridad: ALTO**

- [ ] Usuario con plan Premium activo
- [ ] Selecciona upgrade a Profesional
- [ ] Checkout procesado
- [ ] Suscripción antigua cancelada
- [ ] Nueva suscripción creada
- [ ] Prorrateo aplicado correctamente (si aplica)
- [ ] Usuario tiene acceso inmediato a features profesionales

**Resultado**: [ ] PASÓ [ ] FALLÓ

---

### 2.5 Pago en USD (Usuario Internacional)

**Prioridad: MEDIO**

- [ ] Usuario selecciona moneda USD
- [ ] Precios se muestran en USD
- [ ] Checkout procesado en USD
- [ ] Registro de pago con moneda: `USD`

**Resultado**: [ ] PASÓ [ ] FALLÓ

---

## 3. WEBHOOKS

### 3.1 Evento: checkout.session.completed

**Prioridad: CRÍTICO**

- [ ] Webhook recibido en < 5 segundos
- [ ] Firma verificada correctamente
- [ ] Evento registrado en tabla `StripeEvento` (si aplica)
- [ ] Suscripción creada en BD
- [ ] Pago actualizado a `completado`
- [ ] Idempotencia: evento duplicado no procesa dos veces

**Resultado**: [ ] PASÓ [ ] FALLÓ

---

### 3.2 Evento: customer.subscription.updated

**Prioridad: ALTO**

- [ ] Cambios en Stripe reflejados en BD
- [ ] Estado sincronizado (`active` → `activa`)
- [ ] Fecha de renovación actualizada

**Resultado**: [ ] PASÓ [ ] FALLÓ

---

### 3.3 Evento: invoice.payment_succeeded

**Prioridad: CRÍTICO**

- [ ] Renovación automática procesada
- [ ] Nuevo registro de `Pago` creado
- [ ] Usuario mantiene acceso
- [ ] Notificación enviada (si aplica)

**Resultado**: [ ] PASÓ [ ] FALLÓ

---

### 3.4 Evento: invoice.payment_failed

**Prioridad: ALTO**

- [ ] Suscripción marcada como `vencida`
- [ ] Usuario notificado del fallo
- [ ] Usuario pierde acceso premium (o período de gracia)
- [ ] Stripe reintenta automáticamente según configuración

**Resultado**: [ ] PASÓ [ ] FALLÓ

---

## 4. GESTIÓN DE SUSCRIPCIONES

### 4.1 Cancelar Suscripción

**Prioridad: ALTO**

- [ ] Usuario puede acceder a página de gestión
- [ ] Botón "Cancelar suscripción" visible
- [ ] Modal de confirmación se muestra
- [ ] Cancelación procesada en Stripe
- [ ] Campo `cancelada_en` actualizado en BD
- [ ] Usuario mantiene acceso hasta fin de período
- [ ] Mensaje claro: "Tendrás acceso hasta [fecha]"

**Resultado**: [ ] PASÓ [ ] FALLÓ

---

### 4.2 Reactivar Suscripción Cancelada

**Prioridad: MEDIO**

- [ ] Suscripción previamente cancelada
- [ ] Aún dentro del período de facturación
- [ ] Botón "Reactivar" visible
- [ ] Reactivación procesada en Stripe
- [ ] Campo `cancelada_en` limpiado (NULL)
- [ ] Renovación automática habilitada nuevamente

**Resultado**: [ ] PASÓ [ ] FALLÓ

---

## 5. MANEJO DE ERRORES

### 5.1 Tarjeta con Fondos Insuficientes

**Prioridad: ALTO**

- [ ] Usar tarjeta de test: `4000 0000 0000 9995`
- [ ] Pago rechazado
- [ ] Mensaje de error claro en español:
  - [ ] "Tu tarjeta tiene fondos insuficientes"
  - [ ] "Por favor usa otra tarjeta"
- [ ] Usuario puede reintentar
- [ ] No se crea suscripción en BD

**Resultado**: [ ] PASÓ [ ] FALLÓ

---

### 5.2 Tarjeta Genéricamente Rechazada

**Prioridad: ALTO**

- [ ] Usar tarjeta de test: `4000 0000 0000 0002`
- [ ] Pago rechazado
- [ ] Mensaje: "Tu tarjeta fue rechazada. Contacta a tu banco"
- [ ] Usuario puede usar otra tarjeta

**Resultado**: [ ] PASÓ [ ] FALLÓ

---

### 5.3 CVC Incorrecto

**Prioridad: MEDIO**

- [ ] Usar tarjeta de test: `4000 0000 0000 0127`
- [ ] Error de validación
- [ ] Mensaje: "El código de seguridad es incorrecto"
- [ ] Campo CVC resaltado

**Resultado**: [ ] PASÓ [ ] FALLÓ

---

### 5.4 Tarjeta Expirada

**Prioridad: MEDIO**

- [ ] Usar tarjeta de test: `4000 0000 0000 0069`
- [ ] Error de validación
- [ ] Mensaje: "Tu tarjeta ha expirado. Actualiza tu método de pago"

**Resultado**: [ ] PASÓ [ ] FALLÓ

---

### 5.5 Timeout de Red

**Prioridad: ALTO**

- [ ] Simular desconexión de red
- [ ] Mensaje de error: "Problema de conexión. Verifica tu internet"
- [ ] Loading state visible durante procesamiento
- [ ] Opción de reintentar

**Resultado**: [ ] PASÓ [ ] FALLÓ

---

### 5.6 Webhook Llega Tarde o Falla

**Prioridad: ALTO**

- [ ] Simular webhook tardío (> 30 segundos)
- [ ] Sistema tiene mecanismo de reconciliación
- [ ] Usuario puede consultar estado en Dashboard de Stripe
- [ ] Admin puede forzar sincronización manual

**Resultado**: [ ] PASÓ [ ] FALLÓ

---

## 6. SEGURIDAD

### 6.1 Autenticación

**Prioridad: CRÍTICO**

- [ ] Petición sin token → 401 Unauthorized
- [ ] Token inválido → 401 Unauthorized
- [ ] Token expirado → 401 Unauthorized
- [ ] Solo el dueño puede ver/modificar su suscripción

**Resultado**: [ ] PASÓ [ ] FALLÓ

---

### 6.2 Webhooks - Verificación de Firma

**Prioridad: CRÍTICO**

- [ ] Webhook sin firma → Rechazado
- [ ] Webhook con firma inválida → Rechazado
- [ ] Solo webhooks de Stripe aceptados
- [ ] Timestamp antiguo (> 5 min) → Rechazado

**Resultado**: [ ] PASÓ [ ] FALLÓ

---

### 6.3 Protección de Claves API

**Prioridad: CRÍTICO**

- [ ] Secret key NO expuesta en frontend
- [ ] Secret key NO en código fuente
- [ ] Secret key en variables de entorno
- [ ] Publishable key sí puede estar en frontend
- [ ] Logs NO contienen claves completas

**Resultado**: [ ] PASÓ [ ] FALLÓ

---

### 6.4 Validación de Entrada

**Prioridad: ALTO**

- [ ] Plan inválido → Error 400
- [ ] SQL injection bloqueado
- [ ] XSS previsto
- [ ] Montos calculados en servidor (no confianza en cliente)

**Resultado**: [ ] PASÓ [ ] FALLÓ

---

## 7. BASE DE DATOS

### 7.1 Verificar Tablas de Suscripción

```sql
-- Ejecutar en consola de base de datos
SELECT * FROM "Suscripcion" WHERE estado = 'activa' LIMIT 5;
```

- [ ] Tabla existe
- [ ] Columnas correctas:
  - [ ] id, usuario_id, stripe_suscripcion_id
  - [ ] plan, estado, precio, moneda
  - [ ] fecha_inicio, fecha_renovacion
  - [ ] creado_en, actualizado_en

**Resultado**: [ ] PASÓ [ ] FALLÓ

---

### 7.2 Verificar Tabla de Pagos

```sql
SELECT * FROM "Pago" ORDER BY creado_en DESC LIMIT 5;
```

- [ ] Tabla existe
- [ ] Registros de pagos presentes
- [ ] Estados correctos: pendiente/completado/fallido
- [ ] stripe_sesion_id vinculado

**Resultado**: [ ] PASÓ [ ] FALLÓ

---

### 7.3 Verificar Tabla de Planes (si aplica)

```sql
SELECT * FROM "Plan" WHERE esta_activo = true;
```

- [ ] Planes configurados: básico, premium, profesional
- [ ] Precios correctos
- [ ] Features listadas

**Resultado**: [ ] PASÓ [ ] FALLÓ

---

## 8. USUARIO EXPERIENCIA (UX)

### 8.1 Mensajes de Error

- [ ] Todos los errores tienen mensajes en español
- [ ] Mensajes son claros y accionables
- [ ] No se muestran errores técnicos al usuario
- [ ] Se ofrece soporte si es necesario

**Resultado**: [ ] PASÓ [ ] FALLÓ

---

### 8.2 Loading States

- [ ] Spinner visible durante procesamiento de pago
- [ ] Botón "Pagar" deshabilitado mientras procesa
- [ ] No hay doble-submit posible
- [ ] Timeout razonable (< 30 segundos)

**Resultado**: [ ] PASÓ [ ] FALLÓ

---

### 8.3 Confirmaciones

- [ ] Email de confirmación enviado
- [ ] Página de éxito muestra detalles de suscripción
- [ ] Dashboard actualizado con plan activo
- [ ] Usuario puede ver recibo/factura

**Resultado**: [ ] PASÓ [ ] FALLÓ

---

## 9. COMPLIANCE Y LEGAL

### 9.1 PCI DSS

- [ ] NO se almacenan números de tarjeta
- [ ] NO se almacenan CVV
- [ ] Solo Stripe maneja datos de tarjeta
- [ ] Conexiones usan HTTPS/TLS

**Resultado**: [ ] PASÓ [ ] FALLÓ

---

### 9.2 Términos y Condiciones

- [ ] Usuario acepta términos antes de pagar
- [ ] Checkbox de consentimiento visible
- [ ] Link a términos funciona
- [ ] Política de reembolso visible

**Resultado**: [ ] PASÓ [ ] FALLÓ

---

### 9.3 Privacidad de Datos

- [ ] No se comparten datos de pago con terceros
- [ ] Logs no contienen PII sensible
- [ ] Usuario puede solicitar eliminación de datos
- [ ] Cumplimiento con GDPR/leyes locales

**Resultado**: [ ] PASÓ [ ] FALLÓ

---

## 10. MONITOREO Y ALERTAS

### 10.1 Logs

- [ ] Logs de pagos exitosos
- [ ] Logs de errores
- [ ] Logs de webhooks recibidos
- [ ] NO se loguean datos sensibles

**Resultado**: [ ] PASÓ [ ] FALLÓ

---

### 10.2 Alertas Configuradas

- [ ] Alerta si webhook no se recibe en 5 minutos
- [ ] Alerta si tasa de error > 5%
- [ ] Alerta si Stripe API está caída
- [ ] Alerta si suscripción falla múltiples veces

**Resultado**: [ ] PASÓ [ ] FALLÓ

---

## 11. DOCUMENTACIÓN

- [ ] README.md actualizado
- [ ] Variables de entorno documentadas
- [ ] Diagramas de flujo actualizados
- [ ] Runbook de troubleshooting disponible
- [ ] Contacto de soporte Stripe documentado

**Resultado**: [ ] PASÓ [ ] FALLÓ

---

## RESUMEN FINAL

### Estadísticas

- **Total de checks**: _____
- **Pasados**: _____
- **Fallidos**: _____
- **Tasa de éxito**: _____%

### Decisión de Deploy

- [ ] ✅ **APROBADO PARA PRODUCCIÓN** (todos los críticos pasan)
- [ ] ⚠️ **APROBADO CON RESERVAS** (algunos medios fallan)
- [ ] ❌ **RECHAZADO** (críticos fallan)

### Problemas Críticos Encontrados

```
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________
```

### Acciones de Seguimiento

```
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________
```

### Aprobaciones

**QA Lead**: _______________ Fecha: _______________

**Tech Lead**: _______________ Fecha: _______________

**Product Owner**: _______________ Fecha: _______________

---

## Notas Adicionales

```
_____________________________________________________
_____________________________________________________
_____________________________________________________
_____________________________________________________
```

---

**Versión del Checklist**: 1.0.0
**Última actualización**: 2024-10-24
