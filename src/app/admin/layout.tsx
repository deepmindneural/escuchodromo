'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  FileText,
  UserCheck,
  Package,
  DollarSign,
  ClipboardList,
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

interface ItemMenu {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  descripcion: string;
  categoria: 'general' | 'gestion' | 'finanzas' | 'sistema';
}

const menuItems: ItemMenu[] = [
  // General
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    href: '/admin',
    descripcion: 'Panel principal con estadísticas generales',
    categoria: 'general'
  },

  // Gestión de Usuarios y Contenido
  {
    icon: Users,
    label: 'Usuarios',
    href: '/admin/usuarios',
    descripcion: 'Gestión de usuarios del sistema',
    categoria: 'gestion'
  },
  {
    icon: UserCheck,
    label: 'Profesionales',
    href: '/admin/profesionales',
    descripcion: 'Gestión de terapeutas y profesionales',
    categoria: 'gestion'
  },
  {
    icon: ClipboardList,
    label: 'Evaluaciones',
    href: '/admin/evaluaciones',
    descripcion: 'Gestión de evaluaciones psicológicas',
    categoria: 'gestion'
  },
  {
    icon: FileText,
    label: 'Historiales',
    href: '/admin/historiales',
    descripcion: 'Historiales clínicos y conversaciones',
    categoria: 'gestion'
  },

  // Análisis IA
  {
    icon: Brain,
    label: 'Análisis IA',
    href: '/admin/ia',
    descripcion: 'Análisis de emociones y conversaciones',
    categoria: 'sistema'
  },

  // Finanzas
  {
    icon: Package,
    label: 'Planes',
    href: '/admin/planes',
    descripcion: 'Gestión de planes de suscripción',
    categoria: 'finanzas'
  },
  {
    icon: CreditCard,
    label: 'Suscripciones',
    href: '/admin/suscripciones',
    descripcion: 'Gestión de suscripciones activas',
    categoria: 'finanzas'
  },
  {
    icon: DollarSign,
    label: 'Pagos',
    href: '/admin/pagos',
    descripcion: 'Gestión de transacciones y pagos',
    categoria: 'finanzas'
  },
];

const categoriaLabels: Record<ItemMenu['categoria'], string> = {
  general: 'General',
  gestion: 'Gestión de Usuarios',
  finanzas: 'Finanzas',
  sistema: 'Sistema',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [cargando, setCargando] = useState(true);

  // Agrupar items por categoría para navegación organizada
  const itemsPorCategoria = menuItems.reduce<Record<ItemMenu['categoria'], ItemMenu[]>>((acc, item) => {
    if (!acc[item.categoria]) {
      acc[item.categoria] = [];
    }
    acc[item.categoria].push(item);
    return acc;
  }, {
    general: [],
    gestion: [],
    finanzas: [],
    sistema: []
  });

  const categorias: ItemMenu['categoria'][] = ['general', 'gestion', 'finanzas', 'sistema'];

  useEffect(() => {
    verificarAdmin();
  }, []);

  const verificarAdmin = async () => {
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

      // Verificar que sea admin
      if (usuarioData.rol !== 'ADMIN') {
        router.push('/dashboard');
        return;
      }

      setUsuario(usuarioData);
    } catch (error) {
      console.error('Error al verificar admin:', error);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!usuario) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip to main content - Accesibilidad teclado */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-teal-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
      >
        Saltar al contenido principal
      </a>

      {/* Overlay para móvil */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/30 lg:hidden transition-opacity duration-300',
          menuAbierto ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setMenuAbierto(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        id="sidebar-navigation"
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 shadow-sm transform transition-transform duration-300 lg:translate-x-0',
          menuAbierto ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Panel lateral de navegación"
        aria-hidden={!menuAbierto}
      >
        <div className="flex h-full flex-col">
          {/* Header del sidebar */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
                Escuchodromo
              </h2>
              <p className="text-xs text-gray-500 mt-1">Panel Administrador</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              onClick={() => setMenuAbierto(false)}
              aria-label="Cerrar menú de navegación"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>

          {/* Navegación */}
          <nav
            className="flex-1 p-4 overflow-y-auto"
            role="navigation"
            aria-label="Navegación principal del panel de administrador"
          >
            <div className="space-y-6">
              {categorias.map((categoria) => {
                const items = itemsPorCategoria[categoria];
                if (!items || items.length === 0) return null;

                return (
                  <div key={categoria} role="group" aria-labelledby={`categoria-${categoria}`}>
                    <h3
                      id={`categoria-${categoria}`}
                      className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      {categoriaLabels[categoria]}
                    </h3>
                    <ul className="space-y-1">
                      {items.map((item) => {
                        const estaActivo = pathname === item.href;

                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              onClick={() => setMenuAbierto(false)}
                              className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2",
                                estaActivo
                                  ? "bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-700 shadow-sm"
                                  : "text-gray-700 hover:bg-teal-50/50 hover:text-teal-600"
                              )}
                              aria-label={`${item.label}: ${item.descripcion}`}
                              aria-current={estaActivo ? 'page' : undefined}
                            >
                              {/* Indicador visual de página activa */}
                              {estaActivo && (
                                <span
                                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-teal-500 to-cyan-500 rounded-r-full"
                                  aria-hidden="true"
                                />
                              )}

                              <item.icon
                                className={cn(
                                  "h-5 w-5 flex-shrink-0 transition-colors",
                                  estaActivo
                                    ? "text-teal-600"
                                    : "text-gray-500 group-hover:text-teal-600"
                                )}
                                aria-hidden="true"
                              />

                              <span className="font-medium">
                                {item.label}
                              </span>

                              {/* Badge de estado activo para screen readers */}
                              {estaActivo && (
                                <span className="sr-only">
                                  (página actual)
                                </span>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          </nav>

          {/* Footer del sidebar */}
          <div className="p-4 border-t border-gray-200 bg-gray-50" role="contentinfo">
            <div className="mb-3 px-2">
              <p className="text-xs text-gray-500 mb-1" id="usuario-info-label">
                Sesión iniciada como:
              </p>
              <p
                className="text-sm font-medium text-gray-900 truncate"
                aria-labelledby="usuario-info-label"
                title={usuario.email}
              >
                {usuario.email}
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-teal-500"
              onClick={cerrarSesion}
              aria-label="Cerrar sesión del panel de administrador"
            >
              <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="lg:pl-64">
        {/* Header móvil */}
        <header
          className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm lg:hidden"
          role="banner"
        >
          <div className="flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuAbierto(true)}
              className="text-gray-700 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-teal-500"
              aria-label="Abrir menú de navegación"
              aria-expanded={menuAbierto}
              aria-controls="sidebar-navigation"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">
              Panel Admin
            </h1>
            <div className="w-10" aria-hidden="true" />
          </div>
        </header>

        {/* Contenido de la página */}
        <main className="p-6" role="main" id="main-content">
          {children}
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}