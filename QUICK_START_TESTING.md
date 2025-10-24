# QUICK START - TESTING E2E DASHBOARD

## EJECUTAR AHORA (Copy-Paste)

```bash
# 1. Verificar app corriendo
curl http://localhost:3000

# 2. Ejecutar tests
npx playwright test --project=chromium --reporter=list,html

# 3. Ver reporte
npx playwright show-report
```

## LO QUE SE CREÓ

- ✅ **38 tests E2E** en 4 archivos
- ✅ **2 helpers** para autenticación y captura de errores
- ✅ **Captura automática** de errores 406/403/404
- ✅ **Screenshots** de errores
- ✅ **Reporte HTML** profesional

## ARCHIVOS PRINCIPALES

```
📁 e2e/
  ├── dashboard-usuario.spec.ts (13 tests)
  ├── evaluaciones.spec.ts (16 tests)
  ├── navegacion.spec.ts (7 tests)
  └── login-simple.spec.ts (2 tests)

📄 REPORTE_TESTING_DASHBOARD_EVALUACIONES.md
📄 INSTRUCCIONES_EJECUTAR_TESTS.md
📄 RESUMEN_TESTS_CREADOS.md
```

## ERRORES A DETECTAR

Los tests buscarán automáticamente:

1. ❌ **Errores 406** en llamadas API (Dashboard)
2. ❌ **Errores 403** en llamadas API (Dashboard)
3. ❌ **Errores 404** recursos faltantes
4. ❌ **Problemas visuales** en navegación
5. ❌ **Errores en evaluaciones** GAD-7/PHQ-9
6. ❌ **Problemas en plan de acción**

## SI HAY ERRORES

Ver `REPORTE_TESTING_DASHBOARD_EVALUACIONES.md` sección:
- **"ERRORES DETECTADOS Y PRIORIZADOS"**
- **"PLAN DE ACCIÓN PRIORIZADO"**

## DOCUMENTACIÓN COMPLETA

- `REPORTE_TESTING_DASHBOARD_EVALUACIONES.md` - Reporte completo (20+ páginas)
- `INSTRUCCIONES_EJECUTAR_TESTS.md` - Guía de ejecución detallada
- `RESUMEN_TESTS_CREADOS.md` - Resumen de tests creados

---

**Todo listo para ejecutar.**
**Tiempo estimado: 3-5 minutos.**
