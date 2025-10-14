'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Brain,
  CreditCard,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '../../lib/componentes/ui/button';
import { cn } from '../../lib/utilidades';

interface Usuario {
  id: string;
  email: string;
  rol: string;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
  { icon: Users, label: 'Usuarios', href: '/admin/usuarios' },
  { icon: MessageSquare, label: 'Conversaciones', href: '/admin/conversaciones' },
  { icon: Brain, label: 'Evaluaciones', href: '/admin/evaluaciones' },
  { icon: CreditCard, label: 'Finanzas', href: '/admin/finanzas' },
  { icon: Bell, label: 'Notificaciones', href: '/admin/notificaciones' },
  { icon: Settings, label: 'Configuración', href: '/admin/configuracion' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    verificarAdmin();
  }, []);

  const verificarAdmin = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/iniciar-sesion');
        return;
      }

      const response = await fetch('http://localhost:3333/api/autenticacion/yo', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.rol === 'ADMIN') {
          setUsuario(data);
        } else {
          router.push('/dashboard');
        }
      } else {
        router.push('/iniciar-sesion');
      }
    } catch (error) {
      console.error('Error al verificar admin:', error);
      router.push('/iniciar-sesion');
    } finally {
      setCargando(false);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!usuario) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar móvil */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/50 lg:hidden',
          menuAbierto ? 'block' : 'hidden'
        )}
        onClick={() => setMenuAbierto(false)}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg transform transition-transform lg:translate-x-0',
          menuAbierto ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-bold">Admin Panel</h2>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMenuAbierto(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Menu */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={() => setMenuAbierto(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <div className="mb-4">
              <p className="text-sm text-gray-600">Sesión iniciada como:</p>
              <p className="text-sm font-medium">{usuario.email}</p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={cerrarSesion}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header móvil */}
        <header className="sticky top-0 z-40 bg-white shadow-sm lg:hidden">
          <div className="flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuAbierto(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Admin Panel</h1>
            <div className="w-10" />
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}