import React from 'react';
import { LayoutDashboard, Wrench, History, Users, Factory, Plus, X, User as UserIcon, ListChecks, ClipboardList } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', roles: ['admin', 'technician'] },
  { icon: ListChecks, label: 'Gestão/Tarefas', path: '/tasks', roles: ['admin', 'technician'] },
  { icon: ClipboardList, label: 'Criar Tarefa', path: '/create-task', roles: ['admin'] },
  { icon: History, label: 'Histórico', path: '/history', roles: ['admin', 'technician'] },
  { icon: Users, label: 'Utilizadores', path: '/users', roles: ['admin'] },
  { icon: UserIcon, label: 'Meu Perfil', path: '/profile', roles: ['admin', 'technician'] },
];

interface SidebarProps {
  userRole: string | null;
  user?: any;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export default function Sidebar({ userRole, user, isOpen, onClose, onLogout }: SidebarProps) {
  const location = useLocation();

  // Show relevant items based on role
  const filteredItems = navItems.filter(item => {
    // Basic role check
    const hasRole = userRole === 'admin' || item.roles.includes(userRole || '');
    if (!hasRole) return false;

    // If technician hasn't initialized profile, hide everything else
    if (userRole === 'technician' && user?.profile_initialized === 0 && item.path !== '/profile') {
      return false;
    }

    return true;
  });

  const handleLogout = () => {
    onLogout();
    onClose();
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-industrial-blue/50 z-[60] lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed lg:static top-0 left-0 bottom-0 z-[70]
        flex flex-col h-full w-64 py-6 gap-6 bg-slate-50 border-r border-slate-200 shrink-0
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-industrial-blue flex items-center justify-center text-white">
              <Factory size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-industrial-blue leading-tight">Instalação Principal</h2>
              <p className="font-mono text-xs text-industrial-blue-light uppercase tracking-wider">ID: 442-B</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden p-1 text-industrial-blue-light hover:bg-slate-200 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {(userRole === 'admin' || (userRole === 'technician' && user?.profile_initialized === 1)) && (
          <div className="px-6">
            <button className="w-full btn-primary h-12 uppercase text-xs tracking-widest font-bold">
              <Plus size={20} />
              Nova Ordem
            </button>
          </div>
        )}

        <nav className="flex-1 px-3 flex flex-col gap-1">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-safety-orange text-white shadow-md shadow-safety-orange/20 translate-x-1'
                    : 'text-industrial-blue-light hover:text-industrial-blue hover:bg-slate-100'
                }`}
              >
                <item.icon size={20} className={isActive ? 'fill-current' : ''} />
                <span className="text-sm uppercase tracking-wider font-mono font-semibold">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
        
        <div className="px-3">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-500 hover:bg-red-50 transition-all uppercase tracking-wider font-mono text-xs font-bold"
          >
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
