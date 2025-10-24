# Quick Start - Tests de Stripe

> Guía rápida de 5 minutos para ejecutar los tests del sistema de pagos.

## 1. Configuración (2 minutos)

### Obtener Claves de Test de Stripe

1. Ve a: https://dashboard.stripe.com/test/apikeys
2. Copia las claves (asegúrate de estar en **Test Mode**):
   - Secret key: `sk_test_...`
   - Publishable key: `pk_test_...`

### Configurar Variables de Entorno

```bash
export STRIPE_TEST_SECRET_KEY="sk_test_tu_clave_aqui"
export STRIPE_TEST_PUBLISHABLE_KEY="pk_test_tu_clave_aqui"
export STRIPE_TEST_WEBHOOK_SECRET="whsec_test_tu_secret_aqui"
```

**O crea archivo `.env.test`:**

```bash
# .env.test
STRIPE_TEST_SECRET_KEY=sk_test_tu_clave_aqui
STRIPE_TEST_PUBLISHABLE_KEY=pk_test_tu_clave_aqui
STRIPE_TEST_WEBHOOK_SECRET=whsec_test_tu_secret_aqui
```

## 2. Instalar Dependencias (1 minuto)

```bash
npm install
```

## 3. Ejecutar Tests (2 minutos)

### Opción A: Script Automatizado (Recomendado)

```bash
# Dar permisos de ejecución
chmod +x tests/stripe/run-tests.sh

# Ejecutar todos los tests
./tests/stripe/run-tests.sh all
```

### Opción B: Jest Directamente

```bash
# Todos los tests de Stripe
npm test tests/stripe/

# Solo tests unitarios (más rápidos)
npm test tests/stripe/crear-checkout-stripe.spec.ts
npm test tests/stripe/webhook-stripe.spec.ts
```

---

## Comandos Útiles

### Durante Desarrollo

```bash
# Modo watch (re-ejecuta al guardar cambios)
./tests/stripe/run-tests.sh watch
```

### Antes de Commit

```bash
# Solo tests críticos de seguridad
./tests/stripe/run-tests.sh security

# Solo tests unitarios
./tests/stripe/run-tests.sh unit
```

### Antes de Deploy

```bash
# Suite completa
./tests/stripe/run-tests.sh all

# Con reporte de cobertura
./tests/stripe/run-tests.sh coverage
```

---

## Verificar que Todo Funciona

Si ves esto, estás listo:

```
✓ Verificando Prerequisitos
✓ Node.js v18.x.x
✓ npm 9.x.x
✓ Directorio de proyecto encontrado
✓ Dependencias instaladas

═══════════════════════════════════════════════════════════
  Ejecutando Tests Unitarios
═══════════════════════════════════════════════════════════

 PASS  tests/stripe/crear-checkout-stripe.spec.ts
 PASS  tests/stripe/webhook-stripe.spec.ts

✓ Tests unitarios completados
```

---

## Troubleshooting Rápido

### "STRIPE_TEST_SECRET_KEY no configurada"

```bash
# Verifica que la variable esté configurada
echo $STRIPE_TEST_SECRET_KEY

# Si no aparece nada, exporta la clave:
export STRIPE_TEST_SECRET_KEY="sk_test_tu_clave_aqui"
```

### "Tests de integración omitidos"

Es normal. Los tests de integración requieren claves de Stripe configuradas.
Si no quieres ejecutarlos, ignora este mensaje.

### "Error: Cannot find module 'stripe'"

```bash
# Instala las dependencias
npm install
```

---

## Estructura de Tests

```
tests/stripe/
├── setup-test-stripe.ts              # Helpers y configuración
├── crear-checkout-stripe.spec.ts     # Tests de creación de checkout (25+)
├── webhook-stripe.spec.ts            # Tests de webhooks (30+)
├── integracion-stripe.spec.ts        # Tests con API real (40+)
├── e2e-flujo-pago.spec.ts           # Tests E2E completos (35+)
├── seguridad-stripe.spec.ts         # Tests de seguridad (45+)
├── manejo-errores-stripe.spec.ts    # Tests de errores (50+)
├── run-tests.sh                      # Script de automatización
├── README.md                         # Documentación completa
├── CHECKLIST.md                      # Checklist de validación manual
└── REPORTE_TESTS_STRIPE.md          # Reporte ejecutivo
```

**Total**: 240+ tests

---

## Siguiente Paso

Para más detalles, consulta:

- **[README.md](./README.md)**: Documentación completa
- **[CHECKLIST.md](./CHECKLIST.md)**: Validación manual
- **[REPORTE_TESTS_STRIPE.md](./REPORTE_TESTS_STRIPE.md)**: Reporte ejecutivo

---

## Contacto

Si tienes problemas, revisa:
1. [README.md - Sección Troubleshooting](./README.md#troubleshooting)
2. Logs de los tests
3. Estado de Stripe: https://status.stripe.com

---

**¡Listo para testear!** 🚀
