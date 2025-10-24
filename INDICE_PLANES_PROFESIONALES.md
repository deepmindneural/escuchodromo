# ÍNDICE - DOCUMENTACIÓN SISTEMA DE PLANES PROFESIONALES

**Fecha:** 2025-10-24
**Agente:** Claude (Agente 3 - Arquitecto de Software)
**Versión:** 1.0

---

## ORDEN DE LECTURA RECOMENDADO

### Para STAKEHOLDERS / PRODUCT OWNERS:

1. **EMPIEZA AQUÍ:** [RESUMEN_EJECUTIVO_PLANES_PROFESIONALES.md](./RESUMEN_EJECUTIVO_PLANES_PROFESIONALES.md)
   - ⏱️ Tiempo de lectura: 5 minutos
   - 📊 Resumen de propuesta, precios, ROI
   - ✅ Decisiones que requieren aprobación

2. **Si quieres entender el mercado:** [ANALISIS_MERCADO_PLANES_PROFESIONALES.md](./ANALISIS_MERCADO_PLANES_PROFESIONALES.md)
   - ⏱️ Tiempo de lectura: 15 minutos
   - 💰 Benchmarking competencia
   - 📈 Proyecciones financieras
   - 🎯 Estrategias de pricing

3. **Para ver diagramas visuales:** [DIAGRAMAS_PLANES_PROFESIONALES.md](./DIAGRAMAS_PLANES_PROFESIONALES.md)
   - ⏱️ Tiempo de lectura: 10 minutos
   - 🎨 Diagramas de flujo
   - 🗄️ ERD (base de datos)
   - 📅 Cronograma Gantt

### Para DESARROLLADORES / ARQUITECTOS:

1. **EMPIEZA AQUÍ:** [DISENO_PLANES_PROFESIONALES.md](./DISENO_PLANES_PROFESIONALES.md)
   - ⏱️ Tiempo de lectura: 30 minutos
   - 🗄️ Arquitectura de base de datos
   - 🔄 Flujos técnicos completos
   - 📋 Plan de implementación detallado
   - ⚠️ Casos edge y excepciones

2. **Visualizaciones técnicas:** [DIAGRAMAS_PLANES_PROFESIONALES.md](./DIAGRAMAS_PLANES_PROFESIONALES.md)
   - ⏱️ Tiempo de lectura: 15 minutos
   - 🔗 Diagramas de secuencia
   - 🏗️ Componentes frontend
   - 🌐 Diagrama de despliegue

3. **Contexto de negocio:** [ANALISIS_MERCADO_PLANES_PROFESIONALES.md](./ANALISIS_MERCADO_PLANES_PROFESIONALES.md)
   - ⏱️ Tiempo de lectura: 20 minutos
   - Útil para entender el "por qué" detrás de decisiones técnicas

---

## DOCUMENTOS PRINCIPALES

### 1. RESUMEN_EJECUTIVO_PLANES_PROFESIONALES.md
**Tipo:** Resumen para decisión
**Audiencia:** Stakeholders, Product Owners
**Contenido clave:**
- ✅ Propuesta de 4 planes (Trial, Inicial, Crecimiento, Plus)
- 💰 Precios: $0 - $299,900 COP/mes
- 📊 Proyección: $109M COP MRR año 1
- ⏱️ Timeline: 15 días de implementación
- ❓ Decisiones pendientes de aprobación

**Cuándo leerlo:** SIEMPRE PRIMERO si eres stakeholder

---

### 2. DISENO_PLANES_PROFESIONALES.md
**Tipo:** Especificación técnica completa
**Audiencia:** Desarrolladores, Arquitectos, DevOps
**Contenido clave:**

#### Secciones:
1. **Análisis del Sistema Actual** (pg 1-2)
   - Estado de tablas: `PerfilProfesional`, `Suscripcion`
   - Sistema de planes para usuarios (pacientes)
   - Hallazgos: campos faltantes, confusión de nombres

2. **Propuesta de Planes para Profesionales** (pg 3-5)
   - Definición de 4 planes con características
   - Tabla comparativa
   - Precios COP y USD

3. **Diseño de Arquitectura de Base de Datos** (pg 6-10)
   - Migración SQL completa
   - Opción elegida: misma tabla `Suscripcion` con `tipo_usuario`
   - Nueva tabla `LimitesPlan` (configuración dinámica)
   - Función RPC `validar_limite_profesional()`

4. **Flujos de Usuario** (pg 11-13)
   - Diagrama de onboarding
   - Flujo de checkout y activación
   - Validación de límites en tiempo real

5. **Casos Edge y Manejo de Excepciones** (pg 14-16)
   - ¿Qué pasa si profesional cancela?
   - ¿Qué pasa si alcanza límite de pacientes?
   - Downgrade con validación
   - Profesional no aprobado por admin

6. **Plan de Implementación** (pg 17-18)
   - 7 fases en 15 días
   - Checklist detallado por fase
   - Equipo requerido

7. **Consideraciones de Seguridad** (pg 19-20)
   - Políticas RLS
   - Validación de integridad
   - Rate limiting

8. **Métricas y Analytics** (pg 21)
   - KPIs a trackear
   - Eventos a registrar

9. **Preguntas Pendientes** (pg 22)
   - Precios, trial, aprobación, facturación

**Cuándo leerlo:** Antes de implementar cualquier feature

---

### 3. DIAGRAMAS_PLANES_PROFESIONALES.md
**Tipo:** Documentación visual
**Audiencia:** Todo el equipo técnico
**Contenido clave:**

#### Diagramas incluidos:
1. **ERD (Entidad-Relación)** → Cómo se relacionan las tablas
2. **Diagrama de Flujo - Lifecycle de Suscripción** → Estados y transiciones
3. **Diagrama de Secuencia - Compra de Plan** → Interacción Usuario-Frontend-Backend-Stripe
4. **Diagrama de Validación de Límites** → Lógica de negocio
5. **Diagrama de Estados** → Máquina de estados de suscripciones
6. **Diagrama de Componentes Frontend** → UI de panel profesional
7. **Diagrama de Despliegue** → Arquitectura en producción
8. **Tabla de Decisión** → Casos de validación de límites
9. **Cronograma Gantt** → Timeline visual de implementación

**Cuándo leerlo:** Cuando necesites entender visualmente algún flujo

---

### 4. ANALISIS_MERCADO_PLANES_PROFESIONALES.md
**Tipo:** Business intelligence + Justificación comercial
**Audiencia:** Stakeholders, Product, Marketing
**Contenido clave:**

#### Secciones:
1. **Investigación de Competencia** (pg 1-4)
   - BetterHelp, SimplePractice, TherapyNotes (internacionales)
   - Psonrie, Terapify, Mentaily (LATAM)
   - Tabla comparativa de precios y features

2. **Justificación de Precios** (pg 5-8)
   - Cálculo ROI para profesionales
   - Ventaja vs. modelos de comisión
   - Ejemplo: $430K COP/mes de ahorro vs Terapify

3. **Análisis de Elasticidad** (pg 9-10)
   - Segmentación mercado colombiano
   - Proyección adopción por plan
   - LTV:CAC ratio: 12:1

4. **Estrategias de Diferenciación** (pg 11-12)
   - Modelo SaaS puro (0% comisión)
   - IA integrada
   - Compliance local (Ley 1581)
   - Marketplace integrado

5. **Pricing Avanzado** (pg 13-14)
   - Descuento anual (20% OFF)
   - Pricing dinámico por región
   - Plan Enterprise custom

6. **Go-to-Market** (pg 15-16)
   - Fase 1: Beta privada (50 profesionales)
   - Fase 2: Lanzamiento público (500)
   - Fase 3: Escalamiento (2,000)

7. **Análisis "What-If"** (pg 17)
   - Sensibilidad de precios
   - 3 escenarios simulados

8. **Riesgos y Mitigaciones** (pg 18)

9. **Conclusiones y KPIs** (pg 19-20)

**Cuándo leerlo:** Antes de presentar propuesta a inversores o hacer pricing

---

## MAPEO DE PREGUNTAS FRECUENTES

### "¿Cuánto cuesta implementar esto?"
→ **RESUMEN_EJECUTIVO** (sección "Inversión requerida")
→ Respuesta: $22M COP total (desarrollo + marketing)

### "¿Cuánto vamos a ganar?"
→ **ANALISIS_MERCADO** (sección "Proyección de Adopción")
→ Respuesta: $109M COP MRR año 1 (ARR $1,309M COP)

### "¿Cómo se implementa técnicamente?"
→ **DISENO_PLANES_PROFESIONALES** (sección "Plan de Implementación")
→ Respuesta: 7 fases, 15 días, checklist detallado

### "¿Por qué estos precios?"
→ **ANALISIS_MERCADO** (sección "Justificación de Precios")
→ Respuesta: Benchmarking + cálculo ROI para profesionales

### "¿Qué pasa si un profesional alcanza el límite?"
→ **DISENO_PLANES_PROFESIONALES** (sección "Casos Edge")
→ **DIAGRAMAS** (Diagrama de Validación de Límites)

### "¿Cómo se ve la UI?"
→ **DIAGRAMAS** (Diagrama de Componentes Frontend)

### "¿Qué riesgos hay?"
→ **ANALISIS_MERCADO** (sección "Análisis de Riesgos")
→ **RESUMEN_EJECUTIVO** (tabla "Riesgos y Mitigaciones")

### "¿Cuándo podemos lanzar?"
→ **RESUMEN_EJECUTIVO** (sección "Próximos Pasos")
→ Respuesta: 6-8 semanas desde aprobación

---

## CHECKLIST DE LECTURA POR ROL

### 👔 Product Owner / Stakeholder
- [ ] Leer **RESUMEN_EJECUTIVO** completo (5 min)
- [ ] Revisar precios propuestos (tabla en pág. 1)
- [ ] Validar proyección financiera (pág. 3)
- [ ] Aprobar/rechazar decisiones pendientes (pág. 4)
- [ ] (Opcional) Leer **ANALISIS_MERCADO** para contexto (15 min)

### 💻 Backend Developer
- [ ] Leer **DISENO_PLANES_PROFESIONALES** completo (30 min)
- [ ] Estudiar migración SQL (sección 3.1)
- [ ] Entender función RPC `validar_limite_profesional` (sección 4.2)
- [ ] Revisar políticas RLS (sección 7.1)
- [ ] Ver **DIAGRAMAS** para flujos de datos (15 min)

### 🎨 Frontend Developer
- [ ] Leer **DISENO_PLANES_PROFESIONALES** secciones 2, 4, 5 (15 min)
- [ ] Estudiar **DIAGRAMAS** de componentes frontend (pág. 6)
- [ ] Ver flujo de checkout (DIAGRAMAS pág. 3)
- [ ] Revisar casos de validación de límites (pág. 5)

### 🔧 DevOps / SRE
- [ ] Leer **DISENO_PLANES_PROFESIONALES** sección 6 (10 min)
- [ ] Ver **DIAGRAMAS** de despliegue (pág. 7)
- [ ] Entender integración con Stripe webhooks
- [ ] Revisar consideraciones de seguridad (sección 7)

### 🧪 QA Engineer
- [ ] Leer **DISENO_PLANES_PROFESIONALES** sección 5 (casos edge) (10 min)
- [ ] Estudiar **DIAGRAMAS** de flujos (pág. 1-5)
- [ ] Crear test plan basado en tabla de decisión (pág. 8)
- [ ] Revisar plan de implementación fase 6 (testing)

### 📈 Marketing / Growth
- [ ] Leer **ANALISIS_MERCADO** completo (20 min)
- [ ] Estudiar benchmarking competencia (sección 1-2)
- [ ] Revisar estrategia go-to-market (sección 6)
- [ ] Entender propuesta de valor (sección 4)

---

## GLOSARIO DE TÉRMINOS

| Término | Definición |
|---------|-----------|
| **MRR** | Monthly Recurring Revenue (Ingresos Recurrentes Mensuales) |
| **ARR** | Annual Recurring Revenue (Ingresos Recurrentes Anuales) |
| **LTV** | Lifetime Value (Valor de vida del cliente) |
| **CAC** | Customer Acquisition Cost (Costo de adquisición) |
| **Churn** | Tasa de cancelación mensual |
| **RLS** | Row Level Security (Seguridad a nivel de fila en DB) |
| **RPC** | Remote Procedure Call (Función ejecutada en servidor) |
| **ERD** | Entity-Relationship Diagram (Diagrama Entidad-Relación) |
| **Trial** | Período de prueba gratuito |
| **Downgrade** | Cambiar a plan de menor precio |
| **Upgrade** | Cambiar a plan de mayor precio |
| **SaaS** | Software as a Service |

---

## VERSIONADO DE DOCUMENTOS

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 2025-10-24 | Diseño inicial completo - 4 documentos |

---

## PRÓXIMOS DOCUMENTOS A CREAR (POST-APROBACIÓN)

Una vez aprobada la propuesta, se crearán:

1. **ESPECIFICACION_TECNICA_BACKEND.md**
   - Schema detallado de cada tabla
   - Definición completa de cada RPC function
   - Contratos de Edge Functions

2. **ESPECIFICACION_TECNICA_FRONTEND.md**
   - Wireframes de cada página
   - Props de componentes React
   - Hooks personalizados

3. **PLAN_TESTING_E2E.md**
   - Test cases completos
   - Criterios de aceptación
   - Scripts de Playwright/Cypress

4. **GUIA_USUARIO_PROFESIONAL.md**
   - Cómo registrarse
   - Cómo elegir plan
   - FAQ sobre facturación

5. **RUNBOOK_PRODUCCION.md**
   - Cómo hacer deploy
   - Cómo monitorear
   - Cómo hacer rollback

---

## CONTACTO Y SIGUIENTES PASOS

**Creado por:** Agente 3 - Claude (Arquitecto de Software)
**Fecha:** 2025-10-24
**Estado:** ⏳ ESPERANDO APROBACIÓN

**Para aprobar:**
Responde al **RESUMEN_EJECUTIVO** con:
✅ "APROBADO - Proceder con implementación"

**Para hacer preguntas:**
Menciona el documento y sección específica:
Ej: "Tengo dudas sobre DISENO_PLANES sección 3.1 (migración SQL)"

---

**¡Gracias por revisar esta documentación!**

Estos 4 documentos representan un diseño completo, listo para implementar, con todas las consideraciones técnicas, de negocio y de seguridad cubiertas.
