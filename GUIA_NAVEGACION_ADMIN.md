# Guía Rápida - Navegación del Panel Admin

## Todas las Páginas Disponibles

### General
- **Dashboard** → `/admin`
  - Panel principal con estadísticas generales del sistema

### Gestión de Usuarios
- **Usuarios** → `/admin/usuarios`
  - Gestión completa de usuarios (crear, editar, desactivar)
  - Estadísticas de actividad por usuario

- **Profesionales** → `/admin/profesionales`
  - Gestión de terapeutas y profesionales
  - Aprobación de solicitudes de profesionales
  - Verificación de credenciales

- **Evaluaciones** → `/admin/evaluaciones`
  - Gestión de evaluaciones psicológicas (PHQ-9, GAD-7)
  - Resultados y estadísticas de evaluaciones
  - Análisis de tendencias

- **Historiales** → `/admin/historiales`
  - Historiales clínicos y conversaciones
  - Acceso a sesiones de chat y voz

### Sistema
- **Análisis IA** → `/admin/ia`
  - Análisis de emociones detectadas
  - Estadísticas de conversaciones por IA
  - Métricas de precisión del modelo

### Finanzas
- **Planes** → `/admin/planes`
  - Gestión de planes de suscripción
  - Crear, editar y desactivar planes

- **Suscripciones** → `/admin/suscripciones`
  - Gestión de suscripciones activas
  - Renovaciones y cancelaciones

- **Pagos** → `/admin/pagos`
  - Gestión de transacciones
  - Histórico de pagos

---

## Accesibilidad

### Atajos de Teclado
- **Tab** → Primera tecla abre "Saltar al contenido"
- **Tab** → Navega por todos los enlaces del menú
- **Enter** → Activa el enlace seleccionado
- **Escape** → Cierra el menú en móvil

### Navegación con Screen Readers
- Cada enlace anuncia su función completa
- Las categorías se anuncian como grupos
- La página activa se anuncia automáticamente

---

## Indicadores Visuales

### Página Activa
- Fondo con gradiente teal-cyan
- Barra vertical izquierda en teal-500
- Icono en teal-600
- Texto en teal-700

### Navegación
```
GENERAL
├─ Dashboard (icono: LayoutDashboard)

GESTIÓN DE USUARIOS
├─ Usuarios (icono: Users)
├─ Profesionales (icono: UserCheck)
├─ Evaluaciones (icono: ClipboardList) ⭐ NUEVO
└─ Historiales (icono: FileText)

SISTEMA
└─ Análisis IA (icono: Brain) ⭐ NUEVO

FINANZAS
├─ Planes (icono: Package)
├─ Suscripciones (icono: CreditCard)
└─ Pagos (icono: DollarSign)
```

---

## Solución de Problemas

### No puedo acceder a una página
1. Verificar que el servidor esté corriendo: `npm run dev`
2. Verificar que tengas rol ADMIN en la base de datos
3. Limpiar cache: `rm -rf .next && npm run dev`

### El menú no aparece en móvil
1. Buscar el botón hamburguesa (3 líneas) en la esquina superior izquierda
2. Hacer clic para abrir el menú lateral
3. Seleccionar la página deseada

### Screen reader no anuncia correctamente
1. Verificar que estés usando VoiceOver (Mac) o NVDA (Windows)
2. Navegar con Tab hasta llegar al menú
3. Los enlaces deben anunciarse con formato:
   `"[Nombre]: [Descripción], enlace, [estado activo si aplica]"`

---

## Testing Manual Recomendado

### Checklist
- [ ] Abrir `/admin` - debe mostrar dashboard
- [ ] Hacer clic en "Usuarios" - debe cargar tabla de usuarios
- [ ] Hacer clic en "Evaluaciones" - debe mostrar evaluaciones
- [ ] Hacer clic en "Análisis IA" - debe mostrar estadísticas de IA
- [ ] Verificar que la página activa tiene el gradiente teal
- [ ] Verificar que el hover cambia el color a teal-50
- [ ] Presionar Tab - debe mostrar "Saltar al contenido"
- [ ] Navegar con Tab por todos los enlaces
- [ ] Reducir ventana a móvil - debe aparecer botón hamburguesa
- [ ] Abrir menú móvil - debe deslizarse desde la izquierda
- [ ] Cerrar menú con overlay - debe cerrarse al hacer clic fuera

---

## Próximos Pasos

Si necesitas agregar una nueva página al menú:

1. **Crear la página** en `/src/app/admin/[nombre]/page.tsx`
2. **Agregar al menú** en `/src/app/admin/layout.tsx`:

```typescript
{
  icon: TuIcono, // Importar de lucide-react
  label: 'Tu Página',
  href: '/admin/tu-pagina',
  descripcion: 'Descripción clara de qué hace',
  categoria: 'general' | 'gestion' | 'finanzas' | 'sistema'
}
```

3. **Verificar** que el enlace aparezca en la categoría correcta
4. **Probar** navegación y accesibilidad

---

**Última actualización:** 2025-10-24
