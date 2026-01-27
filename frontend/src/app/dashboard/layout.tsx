'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  Calendar, 
  MessageSquare, 
  Users, 
  LogOut, 
  Menu, 
  X,
  ClipboardList,
  BookOpen,
  UserCheck,
  Plus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingScreen } from '@/components/ui';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
}

const navItems: NavItem[] = [
  // Estudiante
  {
    label: 'Consultar Tutorias',
    href: '/dashboard/estudiante/tutorias',
    icon: <Calendar className="h-5 w-5" />,
    roles: ['Estudiante'],
  },
  {
    label: 'Ver Solicitudes',
    href: '/dashboard/estudiante/solicitudes',
    icon: <ClipboardList className="h-5 w-5" />,
    roles: ['Estudiante'],
  },
  // Tutor
  {
    label: 'Home',
    href: '/dashboard',
    icon: <Home className="h-5 w-5" />,
    roles: ['Tutor'],
  },
  {
    label: 'Registrar Tutoría',
    href: '/dashboard/tutor/tutorias/nueva',
    icon: <Plus className="h-5 w-5" />,
    roles: ['Tutor'],
  },
  {
    label: 'Tutorías Creadas',
    href: '/dashboard/tutor/tutorias',
    icon: <BookOpen className="h-5 w-5" />,
    roles: ['Tutor'],
  },
  // Admin
  {
    label: 'Solicitudes Tutores',
    href: '/dashboard/admin?view=tutores',
    icon: <UserCheck className="h-5 w-5" />,
    roles: ['Administrador'],
  },
  {
    label: 'Solicitudes Estudiantes',
    href: '/dashboard/admin?view=estudiantes',
    icon: <Users className="h-5 w-5" />,
    roles: ['Administrador'],
  },
  // Común
  {
    label: 'Chat',
    href: '/dashboard/mensajes',
    icon: <MessageSquare className="h-5 w-5" />,
    roles: ['Tutor', 'Estudiante'],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Proteger ruta
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user.rol)
  );

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  // Determinar nombre de inicio según rol
  const getHomeHref = () => {
    switch (user.rol) {
      case 'Estudiante':
        return '/dashboard/estudiante/tutorias';
      case 'Tutor':
        return '/dashboard';
      case 'Administrador':
        return '/dashboard/admin/tutores';
      default:
        return '/dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-gray-100 shadow-sm border-b border-gray-200">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo y Nav Items */}
            <div className="flex items-center space-x-8">
              <Link 
                href={getHomeHref()} 
                className="text-xl font-semibold text-gray-800"
              >
                Tutorías FIS
              </Link>
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex space-x-6">
                {filteredNavItems.map((item) => {
                  const isActive = pathname === item.href || 
                    (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center text-gray-700 hover:text-gray-900 font-medium ${
                        isActive ? 'text-blue-600' : ''
                      }`}
                    >
                      {item.label === 'Chat' && (
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      )}
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* User Info & Logout */}
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 text-sm font-medium hidden sm:inline">
                Hola {user.rol} {user.nombre} {user.apellido}, Bienvenid@
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-md text-sm font-medium transition"
              >
                Sign Out
              </button>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-gray-600"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-2">
              {filteredNavItems.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-md font-medium ${
                      isActive 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8" style={{ maxWidth: '95%' }}>
        {children}
      </main>
    </div>
  );
}
