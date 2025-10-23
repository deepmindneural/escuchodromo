'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
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
  ChevronLeft,
  ChevronRight,
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
  const [sidebarColapsado, setSidebarColapsado] = useState(false);
  const [cargando, setCargando] = useState(true);

  // Referencias para accesibilidad
  const sidebarRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstFocusableElementRef = useRef<HTMLElement>(null);
  const lastFocusableElementRef = useRef<HTMLElement>(null);

  // Detectar preferencia de movimiento reducido
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    verificarProfesional();

    // Cargar preferencia de sidebar del localStorage
    const preferenciaSidebar = localStorage.getItem('sidebarColapsado');
    if (preferenciaSidebar === 'true') {
      setSidebarColapsado(true);
    }
  }, []);

  // Manejar tecla Escape para cerrar sidebar móvil
  useEffect(() => {
    const manejarEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && menuAbierto) {
        setMenuAbierto(false);
        // Devolver foco al botón de menú
        menuButtonRef.current?.focus();
      }
    };

    if (menuAbierto) {
      document.addEventListener('keydown', manejarEscape);
      // Prevenir scroll del body cuando el menú está abierto
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', manejarEscape);
      document.body.style.overflow = 'unset';
    };
  }, [menuAbierto]);

  // Focus trap en sidebar móvil
  useEffect(() => {
    if (!menuAbierto || !sidebarRef.current) return;

    const sidebar = sidebarRef.current;
    const focusableElements = sidebar.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    firstFocusableElementRef.current = firstElement;
    lastFocusableElementRef.current = lastElement;

    // Enfocar primer elemento cuando se abre
    firstElement?.focus();

    const manejarTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    sidebar.addEventListener('keydown', manejarTab);

    return () => {
      sidebar.removeEventListener('keydown', manejarTab);
    };
  }, [menuAbierto]);

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

  const toggleSidebar = useCallback(() => {
    const nuevoEstado = !sidebarColapsado;
    setSidebarColapsado(nuevoEstado);
    localStorage.setItem('sidebarColapsado', nuevoEstado.toString());
  }, [sidebarColapsado]);

  // Obtener iniciales del nombre para el avatar
  const obtenerIniciales = (nombre: string) => {
    return nombre
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Variantes de animación que respetan prefers-reduced-motion
  const animacionSuave = {
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: prefersReducedMotion ? 0 : -20 },
    transition: { duration: prefersReducedMotion ? 0 : 0.3, ease: 'easeOut' }
  };

  if (cargando) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-calma-50 via-white to-esperanza-50"
        role="status"
        aria-live="polite"
        aria-label="Cargando panel profesional"
      >
        <motion.div
          {...(prefersReducedMotion ? {} : {
            initial: { opacity: 0, scale: 0.9 },
            animate: { opacity: 1, scale: 1 }
          })}
          className="text-center"
        >
          <div className="relative mx-auto mb-4 w-16 h-16">
            <div
              className="absolute inset-0 border-4 border-calma-200 border-t-calma-600 rounded-full animate-spin"
              aria-hidden="true"
            />
          </div>
          <p className="text-gray-700 font-medium text-lg">Cargando panel...</p>
          <span className="sr-only">Verificando credenciales y cargando información</span>
        </motion.div>
      </div>
    );
  }

  if (!usuario) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-calma-50/30">
      {/* Skip link para accesibilidad */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-calma-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-4 focus:ring-calma-300 font-semibold"
      >
        Saltar al contenido principal
      </a>

      {/* Overlay para móvil */}
      <AnimatePresence>
        {menuAbierto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMenuAbierto(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        ref={sidebarRef}
        initial={false}
        animate={{
          width: sidebarColapsado ? '5rem' : '16rem',
        }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.3,
          ease: 'easeInOut'
        }}
        className={cn(
          'fixed top-0 left-0 z-50 h-full bg-white border-r border-gray-200 shadow-xl transform transition-transform lg:translate-x-0',
          menuAbierto ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{ width: sidebarColapsado ? '5rem' : '16rem' }}
        role="navigation"
        aria-label="Navegación principal del profesional"
        aria-expanded={menuAbierto}
      >
        <div className="flex h-full flex-col">
          {/* Header del sidebar */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <AnimatePresence mode="wait">
              {!sidebarColapsado ? (
                <motion.div
                  key="expanded"
                  {...animacionSuave}
                >
                  <h2 className="text-xl font-bold bg-gradient-to-r from-calma-600 to-esperanza-600 bg-clip-text text-transparent">
                    Escuchodromo
                  </h2>
                  <p className="text-xs text-gray-600 mt-1" role="doc-subtitle">Panel Profesional</p>
                </motion.div>
              ) : (
                <motion.div
                  key="collapsed"
                  {...animacionSuave}
                  className="w-full flex justify-center"
                >
                  <div
                    className="w-10 h-10 bg-gradient-to-br from-calma-500 to-esperanza-500 rounded-xl flex items-center justify-center"
                    role="img"
                    aria-label="Logo Escuchodromo"
                  >
                    <span className="text-white font-bold text-lg" aria-hidden="true">E</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Botón cerrar en móvil */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "lg:hidden text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-2 focus:ring-calma-500 focus:ring-offset-2",
                sidebarColapsado && "hidden"
              )}
              onClick={() => setMenuAbierto(false)}
              aria-label="Cerrar menú de navegación"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>

          {/* Botón toggle para desktop */}
          <div className="hidden lg:block absolute -right-3 top-24 z-10">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleSidebar}
              className="h-6 w-6 rounded-full bg-white border-2 border-calma-200 hover:border-calma-400 hover:bg-calma-50 shadow-md focus:ring-2 focus:ring-calma-500 focus:ring-offset-2"
              aria-label={sidebarColapsado ? 'Expandir menú lateral' : 'Contraer menú lateral'}
              aria-expanded={!sidebarColapsado}
              aria-controls="sidebar-navigation"
            >
              {sidebarColapsado ? (
                <ChevronRight className="h-3 w-3 text-calma-600" aria-hidden="true" />
              ) : (
                <ChevronLeft className="h-3 w-3 text-calma-600" aria-hidden="true" />
              )}
            </Button>
          </div>

          {/* Perfil del profesional */}
          <div
            className={cn(
              "p-4 border-b border-gray-100 bg-gradient-to-br from-calma-50/50 to-esperanza-50/50",
              sidebarColapsado && "px-2"
            )}
            role="region"
            aria-label="Información del profesional"
          >
            <div className={cn(
              "flex items-center gap-3",
              sidebarColapsado && "flex-col gap-2"
            )}>
              {/* Avatar */}
              <div
                className={cn(
                  "relative flex-shrink-0 group",
                  sidebarColapsado ? "w-10 h-10" : "w-12 h-12"
                )}
                role="img"
                aria-label={`Avatar de ${usuario.nombre || 'profesional'}`}
              >
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-br from-calma-500 to-esperanza-500 rounded-full opacity-20",
                    !prefersReducedMotion && "animate-pulse"
                  )}
                  aria-hidden="true"
                />
                <div className="relative w-full h-full bg-gradient-to-br from-calma-500 to-esperanza-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-105 transition-transform">
                  <span className={sidebarColapsado ? "text-sm" : "text-base"}>
                    {obtenerIniciales(usuario.nombre || 'PR')}
                  </span>
                </div>
              </div>

              {/* Información del usuario */}
              <AnimatePresence>
                {!sidebarColapsado && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {usuario.nombre || 'Profesional'}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {usuario.rol === 'ADMIN' ? 'Administrador' : 'Terapeuta'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Navegación */}
          <nav
            id="sidebar-navigation"
            className="flex-1 p-3 overflow-y-auto"
            aria-label="Menú de navegación"
          >
            <ul className="space-y-1" role="list">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href} role="listitem">
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative overflow-hidden',
                        'focus:outline-none focus:ring-2 focus:ring-calma-500 focus:ring-offset-2',
                        isActive
                          ? 'bg-gradient-to-r from-calma-500 to-esperanza-500 text-white shadow-lg shadow-calma-200'
                          : 'text-gray-700 hover:bg-gradient-to-r hover:from-calma-50 hover:to-esperanza-50 hover:text-calma-700',
                        sidebarColapsado && 'justify-center px-2'
                      )}
                      onClick={() => setMenuAbierto(false)}
                      title={sidebarColapsado ? item.label : undefined}
                      aria-label={sidebarColapsado ? item.label : undefined}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {/* Efecto de brillo en hover */}
                      {!isActive && !prefersReducedMotion && (
                        <div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                          aria-hidden="true"
                        />
                      )}

                      <item.icon
                        className={cn(
                          'h-5 w-5 flex-shrink-0 relative z-10',
                          isActive
                            ? 'text-white'
                            : 'text-gray-500 group-hover:text-calma-600'
                        )}
                        aria-hidden="true"
                      />

                      <AnimatePresence>
                        {!sidebarColapsado && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                            className={cn(
                              "font-medium relative z-10",
                              isActive && "font-semibold"
                            )}
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer del sidebar - Cerrar sesión */}
          <div
            className={cn(
              "p-4 border-t border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100",
              sidebarColapsado && "px-2"
            )}
            role="region"
            aria-label="Acciones de sesión"
          >
            <AnimatePresence mode="wait">
              {!sidebarColapsado ? (
                <motion.div
                  key="expanded-logout"
                  {...animacionSuave}
                >
                  <div className="mb-3 px-2">
                    <p className="text-xs text-gray-600 mb-1">Sesión iniciada como:</p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {usuario.email}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-2 border-red-200 bg-white text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all shadow-sm hover:shadow-md group focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    onClick={cerrarSesion}
                    aria-label="Cerrar sesión y salir del panel profesional"
                  >
                    <LogOut
                      className={cn(
                        "h-4 w-4 mr-2 transition-transform",
                        !prefersReducedMotion && "group-hover:rotate-12"
                      )}
                      aria-hidden="true"
                    />
                    <span className="font-semibold">Cerrar sesión</span>
                  </Button>
                </motion.div>
              ) : (
                <motion.button
                  key="collapsed-logout"
                  {...animacionSuave}
                  onClick={cerrarSesion}
                  className="w-full h-12 flex items-center justify-center rounded-xl border-2 border-red-200 bg-white text-red-600 hover:bg-red-50 hover:border-red-300 transition-all shadow-sm hover:shadow-md group focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  title="Cerrar sesión"
                  aria-label="Cerrar sesión y salir del panel profesional"
                >
                  <LogOut
                    className={cn(
                      "h-5 w-5 transition-transform",
                      !prefersReducedMotion && "group-hover:rotate-12"
                    )}
                    aria-hidden="true"
                  />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>

      {/* Contenido principal */}
      <motion.div
        initial={false}
        animate={{
          paddingLeft: sidebarColapsado ? '5rem' : '16rem',
        }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.3,
          ease: 'easeInOut'
        }}
        className="lg:pl-64"
      >
        {/* Header móvil */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm lg:hidden">
          <div className="flex items-center justify-between p-4">
            <Button
              ref={menuButtonRef}
              variant="ghost"
              size="icon"
              onClick={() => setMenuAbierto(true)}
              className="text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-calma-500 focus:ring-offset-2"
              aria-label="Abrir menú de navegación"
              aria-expanded={menuAbierto}
              aria-controls="sidebar-navigation"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
            <h1 className="text-lg font-semibold bg-gradient-to-r from-calma-600 to-esperanza-600 bg-clip-text text-transparent">
              Panel Profesional
            </h1>
            <div className="w-10" aria-hidden="true" />
          </div>
        </header>

        {/* Contenido de la página */}
        <main
          id="main-content"
          className="p-6 min-h-screen"
          role="main"
          aria-label="Contenido principal del dashboard"
        >
          {children}
        </main>

        {/* Footer */}
        <Footer />
      </motion.div>
    </div>
  );
}
