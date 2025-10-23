'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Clock,
  User,
  FileText,
  CreditCard,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '../../lib/componentes/ui/button';
import { cn } from '../../lib/utilidades';
import { obtenerClienteNavegador } from '../../lib/supabase/cliente';
import Footer from '../../lib/componentes/layout/Footer';

interface Usuario {
  id: string;
  email: string;
  rol: string;
  nombre: string;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/profesional/dashboard' },
  { icon: Users, label: 'Pacientes', href: '/profesional/pacientes' },
  { icon: Calendar, label: 'Calendario', href: '/profesional/calendario' },
  { icon: CreditCard, label: 'Pagos', href: '/profesional/pagos' },
  { icon: Clock, label: 'Disponibilidad', href: '/profesional/disponibilidad' },
  { icon: User, label: 'Mi Perfil', href: '/profesional/perfil' },
  { icon: FileText, label: 'Historial', href: '/profesional/historial' },
];

export default function ProfesionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    verificarProfesional();
  }, []);

  const verificarProfesional = async () => {
    const supabase = obtenerClienteNavegador();

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/iniciar-sesion');
        return;
      }

      // Obtener datos del usuario
      const { data: usuarioData, error } = await supabase
        .from('Usuario')
        .select('id, email, nombre, rol')
        .eq('auth_id', session.user.id)
        .single();

      if (error || !usuarioData) {
        router.push('/iniciar-sesion');
        return;
      }

      // Verificar que sea profesional (TERAPEUTA) o ADMIN
      if (usuarioData.rol !== 'TERAPEUTA' && usuarioData.rol !== 'ADMIN') {
        router.push('/dashboard');
        return;
      }

      setUsuario(usuarioData);
    } catch (error) {
      console.error('Error al verificar profesional:', error);
      router.push('/iniciar-sesion');
    } finally {
      setCargando(false);
    }
  };

  const cerrarSesion = async () => {
    const supabase = obtenerClienteNavegador();
    await supabase.auth.signOut();
    router.push('/iniciar-sesion');
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-calma-600"></div>
      </div>
    );
  }

  if (!usuario) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Overlay para móvil */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/30 lg:hidden transition-opacity',
          menuAbierto ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setMenuAbierto(false)}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 shadow-sm transform transition-transform lg:translate-x-0',
          menuAbierto ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header del sidebar */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-calma-500 to-calma-700 bg-clip-text text-transparent">
                Escuchodromo
              </h2>
              <p className="text-xs text-gray-500 mt-1">Panel Profesional</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              onClick={() => setMenuAbierto(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navegación */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group',
                        isActive
                          ? 'bg-calma-50 text-calma-700 font-semibold'
                          : 'text-gray-700 hover:bg-calma-50 hover:text-calma-700'
                      )}
                      onClick={() => setMenuAbierto(false)}
                    >
                      <item.icon
                        className={cn(
                          'h-5 w-5',
                          isActive
                            ? 'text-calma-600'
                            : 'text-gray-500 group-hover:text-calma-600'
                        )}
                      />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer del sidebar */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="mb-3 px-2">
              <p className="text-xs text-gray-500 mb-1">Sesión iniciada como:</p>
              <p className="text-sm font-medium text-gray-900 truncate">
                {usuario.nombre || usuario.email}
              </p>
              <p className="text-xs text-gray-500 truncate">{usuario.email}</p>
            </div>
            <Button
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              onClick={cerrarSesion}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="lg:pl-64">
        {/* Header móvil */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm lg:hidden">
          <div className="flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuAbierto(true)}
              className="text-gray-700 hover:bg-gray-100"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">Panel Profesional</h1>
            <div className="w-10" />
          </div>
        </header>

        {/* Contenido de la página */}
        <main className="p-6">{children}</main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
