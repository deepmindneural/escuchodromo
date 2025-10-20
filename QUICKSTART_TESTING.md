# Quick Start - Testing Escuchodromo

Guía rápida de 5 minutos para empezar con los tests.

## 1. Instalar Dependencias (2 min)

```bash
cd /ruta/a/escuchodromo
npm install
```

Esto instalará:
- Jest, React Testing Library, Playwright
- jest-axe para accesibilidad
- Todas las dependencias de testing

## 2. Ejecutar Tests (1 min)

```bash
# Tests unitarios (CardProfesional, CalendarioMensual)
npm run test:unit

# Tests de accesibilidad
npm run test:a11y

# Tests E2E (requiere app corriendo)
npm run dev  # En otra terminal
npm run test:e2e:ui  # Interfaz interactiva
```

## 3. Ver Cobertura (1 min)

```bash
# Generar reporte HTML de cobertura
npm run test:coverage:html

# Se abrirá automáticamente en el navegador
# Buscar: coverage/index.html
```

## 4. Debugging Rápido (1 min)

```bash
# Modo watch (tests se re-ejecutan al guardar)
npm run test:watch

# Debug de test específico
npm run test CardProfesional
```

## 5. Archivos Importantes

```
├── jest.config.js              ← Configuración de Jest
├── jest.setup.js               ← Mocks globales
├── playwright.config.ts        ← Configuración de Playwright
├── src/lib/componentes/__tests__/
│   ├── CardProfesional.test.tsx
│   ├── CalendarioMensual.test.tsx
│   └── accesibilidad.test.tsx
└── e2e/
    └── reservar-cita.spec.ts
```

## Comandos Útiles

| Comando | Descripción |
|---------|-------------|
| `npm run test` | Ejecutar todos los tests |
| `npm run test:watch` | Modo watch (desarrollo) |
| `npm run test:unit` | Solo tests unitarios |
| `npm run test:e2e` | Solo tests E2E |
| `npm run test:a11y` | Solo tests de accesibilidad |
| `npm run test:coverage` | Generar cobertura |

## Próximos Pasos

1. Leer `/docs/GUIA_TESTING.md` para detalles completos
2. Leer `/docs/ESTRATEGIA_TESTING.md` para estrategia
3. Adaptar tests de integración a tu setup de Supabase
4. Configurar CI/CD en GitHub

## Troubleshooting

**Error: "Cannot find module 'next/jest'"**
→ Ejecutar `npm install`

**Tests E2E fallan con timeout**
→ Asegurar que `npm run dev` está corriendo

**Cobertura baja**
→ Revisar archivos no testeados en `coverage/index.html`

## Ayuda

- Documentación completa: `/docs/GUIA_TESTING.md`
- Estrategia: `/docs/ESTRATEGIA_TESTING.md`
- Resumen: `/docs/RESUMEN_TESTING_ENTREGADO.md`

---

**Tiempo total: ~5 minutos**
