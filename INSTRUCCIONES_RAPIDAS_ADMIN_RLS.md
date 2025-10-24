# INSTRUCCIONES RÁPIDAS: CRUD de ADMIN

**Para desarrolladores frontend - Quick Start**

---

## NUEVO: Operaciones CRUD de ADMIN habilitadas

Se han habilitado operaciones completas de CRUD para administradores en evaluaciones y usuarios, con auditoría obligatoria.

---

## 📋 FUNCIONES DISPONIBLES

### 1. Listar Evaluaciones

```typescript
const { data, error } = await supabase.rpc('admin_listar_evaluaciones', {
  p_usuario_id: 'uuid-opcional',  // null para todas
  p_limite: 50,
  p_offset: 0,
  p_justificacion: 'Tu justificación aquí (min 10 chars)'
});
```

### 2. Actualizar Evaluación

```typescript
const { data, error } = await supabase.rpc('admin_actualizar_evaluacion', {
  p_evaluacion_id: 'uuid',
  p_interpretacion: 'Nueva interpretación (opcional)',
  p_severidad: 'moderada (opcional)',
  p_completado: true,  // opcional
  p_justificacion: 'Tu justificación aquí (min 20 chars)'
});
```

### 3. Eliminar Evaluación

```typescript
const { data, error } = await supabase.rpc('admin_eliminar_evaluacion', {
  p_evaluacion_id: 'uuid',
  p_justificacion: 'Tu justificación detallada aquí (min 30 chars)'
});
```

### 4. Desactivar Usuario

```typescript
const { data, error } = await supabase.rpc('admin_desactivar_usuario', {
  p_usuario_id: 'uuid',
  p_justificacion: 'Tu justificación aquí (min 20 chars)'
});
```

---

## ⚠️ IMPORTANTE

### Longitudes Mínimas de Justificación

| Operación | Mínimo |
|-----------|--------|
| Listar evaluaciones | 10 caracteres |
| Actualizar evaluación | 20 caracteres |
| Eliminar evaluación | 30 caracteres |
| Desactivar usuario | 20 caracteres |

### Ventanas de Validez

- **SELECT (listar):** 10 minutos
- **UPDATE (actualizar):** 10 minutos
- **DELETE (eliminar):** 5 minutos

Si tu operación tarda más, deberás volver a enviar la justificación.

---

## ✅ BUENAS PRÁCTICAS

### Justificaciones Claras

**BUENO:**
```typescript
p_justificacion: 'Corrección de severidad tras revisión clínica del 2025-10-20. Ticket: MED-4567'
```

**MALO:**
```typescript
p_justificacion: 'Actualizar evaluación'  // Muy vaga
p_justificacion: 'Test'  // Insuficiente
```

### Validación en Frontend

```typescript
const [justificacion, setJustificacion] = useState('');

// Validar longitud
const esValida = justificacion.length >= 20;

// Mostrar feedback
<p className={esValida ? 'text-green-600' : 'text-gray-500'}>
  {justificacion.length}/20 caracteres
</p>

// Deshabilitar botón si no es válida
<button disabled={!esValida}>
  Actualizar
</button>
```

### Manejo de Errores

```typescript
const { data, error } = await supabase.rpc('admin_actualizar_evaluacion', {
  p_evaluacion_id: id,
  p_justificacion: justificacion
});

if (error) {
  if (error.message.includes('Justificación obligatoria')) {
    toast.error('La justificación es muy corta');
  } else if (error.message.includes('Solo administradores')) {
    toast.error('No tienes permisos');
  } else {
    toast.error('Error: ' + error.message);
  }
  return;
}

toast.success('Operación exitosa');
```

---

## 🚫 RESTRICCIONES

1. **Admin NO puede:**
   - Eliminar físicamente usuarios (solo desactivar)
   - Cambiar su propio rol
   - Desactivarse a sí mismo
   - Modificar `usuario_id`, `test_id` o `creado_en` de evaluaciones

2. **Operaciones requieren:**
   - Ser ADMIN autenticado
   - Justificación con longitud mínima
   - Ventana de validez no expirada

---

## 📊 AUDITORÍA

Todas las operaciones se registran automáticamente en `AuditLogAdmin` con:
- Email del admin
- Acción realizada
- Cambios (antes/después)
- Justificación
- Timestamp
- IP y user agent (si disponible)

---

## 🔗 DOCUMENTACIÓN COMPLETA

- **Guía Rápida:** `/GUIA_RAPIDA_ADMIN_CRUD.md`
- **Reporte de Auditoría:** `/REPORTE_AUDITORIA_RLS_ADMIN_CRUD.md`
- **Resumen Ejecutivo:** `/RESUMEN_EJECUTIVO_RLS_ADMIN.md`

---

## 🆘 SOPORTE

**Errores comunes:**
- `Justificación obligatoria de mínimo X caracteres` → Aumenta la longitud
- `Solo administradores pueden...` → Verifica autenticación y rol
- `row-level security policy` → Ventana expirada, vuelve a intentar

**Contacto:**
- dev@escuchodromo.com
- security@escuchodromo.com

---

**Última actualización:** 2025-10-24
