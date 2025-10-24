'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/modal';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { toast } from 'react-hot-toast';
import { User, Mail, Shield, Key, Eye, EyeOff } from 'lucide-react';

interface Usuario {
  id: string;
  email: string;
  nombre: string | null;
  apellido: string | null;
  rol: string;
  esta_activo: boolean;
}

interface ModalUsuarioProps {
  abierto: boolean;
  onCerrar: () => void;
  onExito: () => void;
  usuario?: Usuario | null; // Si se proporciona, es edición; si no, es creación
}

interface FormularioDatos {
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
  esta_activo: boolean;
  password?: string;
}

/**
 * ModalUsuario - Modal para crear o editar usuarios
 *
 * Características:
 * - Validación de formulario
 * - Generación de contraseña temporal en creación
 * - Muestra contraseña temporal copiable
 * - Estados de carga
 * - Toast feedback
 */
export function ModalUsuario({ abierto, onCerrar, onExito, usuario }: ModalUsuarioProps) {
  const esEdicion = !!usuario;
  const [cargando, setCargando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [passwordTemporal, setPasswordTemporal] = useState<string | null>(null);

  const [formulario, setFormulario] = useState<FormularioDatos>({
    email: '',
    nombre: '',
    apellido: '',
    rol: 'USUARIO',
    esta_activo: true,
    password: '',
  });

  // Inicializar formulario cuando se abre en modo edición
  useEffect(() => {
    if (usuario) {
      setFormulario({
        email: usuario.email,
        nombre: usuario.nombre || '',
        apellido: usuario.apellido || '',
        rol: usuario.rol,
        esta_activo: usuario.esta_activo,
      });
    } else {
      // Resetear formulario para creación
      setFormulario({
        email: '',
        nombre: '',
        apellido: '',
        rol: 'USUARIO',
        esta_activo: true,
        password: '',
      });
    }
    setPasswordTemporal(null);
  }, [usuario, abierto]);

  const handleChange = (campo: keyof FormularioDatos, valor: any) => {
    setFormulario((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const validarFormulario = (): boolean => {
    if (!formulario.email.trim()) {
      toast.error('El email es requerido');
      return false;
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formulario.email)) {
      toast.error('Email inválido');
      return false;
    }

    if (!formulario.rol) {
      toast.error('El rol es requerido');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    setCargando(true);

    try {
      if (esEdicion) {
        // Editar usuario existente
        const response = await fetch('/api/admin/usuarios/editar', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            usuarioId: usuario!.id,
            nombre: formulario.nombre || null,
            apellido: formulario.apellido || null,
            rol: formulario.rol,
            esta_activo: formulario.esta_activo,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error al actualizar usuario');
        }

        toast.success('Usuario actualizado exitosamente');
        onExito();
        onCerrar();
      } else {
        // Crear nuevo usuario
        const response = await fetch('/api/admin/usuarios/crear', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formulario.email,
            nombre: formulario.nombre || null,
            apellido: formulario.apellido || null,
            rol: formulario.rol,
            password: formulario.password || undefined,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error al crear usuario');
        }

        // Guardar contraseña temporal para mostrarla
        if (data.passwordTemporal) {
          setPasswordTemporal(data.passwordTemporal);
          toast.success('Usuario creado exitosamente. Copia la contraseña temporal.');
        } else {
          toast.success('Usuario creado exitosamente');
          onExito();
          onCerrar();
        }
      }
    } catch (error: any) {
      console.error('Error al guardar usuario:', error);
      toast.error(error.message || 'Error al guardar usuario');
    } finally {
      setCargando(false);
    }
  };

  const copiarPassword = () => {
    if (passwordTemporal) {
      navigator.clipboard.writeText(passwordTemporal);
      toast.success('Contraseña copiada al portapapeles');
    }
  };

  const cerrarConExito = () => {
    setPasswordTemporal(null);
    onExito();
    onCerrar();
  };

  return (
    <Modal
      abierto={abierto}
      onCerrar={passwordTemporal ? cerrarConExito : onCerrar}
      titulo={esEdicion ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
      tamano="md"
      cerrarAlClickearFondo={!cargando}
    >
      {/* Mostrar contraseña temporal después de crear */}
      {passwordTemporal ? (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Key className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-1">
                  Usuario creado exitosamente
                </h3>
                <p className="text-sm text-green-700 mb-3">
                  Se ha generado una contraseña temporal. Cópiala y envíala al usuario de forma segura.
                </p>
                <div className="bg-white border border-green-300 rounded-lg p-3 flex items-center justify-between">
                  <code className="font-mono text-sm text-gray-900">{passwordTemporal}</code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copiarPassword}
                    className="ml-2"
                  >
                    Copiar
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={cerrarConExito}>
              Cerrar
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={formulario.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={esEdicion || cargando}
                placeholder="usuario@ejemplo.com"
                className="pl-10"
                required
              />
            </div>
            {esEdicion && (
              <p className="text-xs text-gray-500 mt-1">
                El email no se puede cambiar
              </p>
            )}
          </div>

          {/* Nombre */}
          <div>
            <Label htmlFor="nombre">Nombre</Label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="nombre"
                type="text"
                value={formulario.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                disabled={cargando}
                placeholder="Nombre del usuario"
                className="pl-10"
              />
            </div>
          </div>

          {/* Apellido */}
          <div>
            <Label htmlFor="apellido">Apellido</Label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="apellido"
                type="text"
                value={formulario.apellido}
                onChange={(e) => handleChange('apellido', e.target.value)}
                disabled={cargando}
                placeholder="Apellido del usuario"
                className="pl-10"
              />
            </div>
          </div>

          {/* Rol */}
          <div>
            <Label htmlFor="rol">
              Rol <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formulario.rol}
              onValueChange={(value) => handleChange('rol', value)}
              disabled={cargando}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USUARIO">Usuario</SelectItem>
                <SelectItem value="TERAPEUTA">Terapeuta</SelectItem>
                <SelectItem value="ADMIN">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contraseña (solo en creación, opcional) */}
          {!esEdicion && (
            <div>
              <Label htmlFor="password">Contraseña (opcional)</Label>
              <div className="relative mt-1">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={mostrarPassword ? 'text' : 'password'}
                  value={formulario.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  disabled={cargando}
                  placeholder="Dejar vacío para generar automáticamente"
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {mostrarPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Si no proporcionas contraseña, se generará una temporal automáticamente
              </p>
            </div>
          )}

          {/* Estado activo (solo en edición) */}
          {esEdicion && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="esta_activo"
                checked={formulario.esta_activo}
                onCheckedChange={(checked) => handleChange('esta_activo', checked)}
                disabled={cargando}
              />
              <Label htmlFor="esta_activo" className="cursor-pointer">
                Usuario activo
              </Label>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCerrar}
              disabled={cargando}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={cargando}>
              {cargando ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {esEdicion ? 'Guardando...' : 'Creando...'}
                </>
              ) : (
                esEdicion ? 'Guardar Cambios' : 'Crear Usuario'
              )}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
