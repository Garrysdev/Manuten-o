import React, { useState, useEffect } from 'react';
import { Bell, HelpCircle, Settings, Search, Menu, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../lib/api';

interface TopHeaderProps {
  onMenuClick: () => void;
  user: any;
}

export default function TopHeader({ onMenuClick, user }: TopHeaderProps) {
  const navigate = useNavigate();

  const handleAction = (action: string) => {
    alert(`${action} clicado!`);
  };

  return (
    <header className="flex justify-between items-center w-full px-6 h-16 bg-white border-b border-slate-200 shrink-0 sticky top-0 z-50">
      <div className="flex items-center gap-6">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-industrial-blue-light hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-xl font-bold text-industrial-blue tracking-tight">RG Maintenance</h1>
        
        <div className="hidden md:flex items-center bg-slate-50 rounded-full px-4 py-1.5 border border-transparent focus-within:border-safety-orange transition-all">
          <Search size={18} className="text-industrial-blue-light mr-2" />
          <input 
            type="text" 
            placeholder="Pesquisar operações..." 
            className="bg-transparent border-none focus:ring-0 text-sm font-medium text-industrial-blue w-64 p-0 placeholder:text-industrial-blue-light"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button 
          onClick={() => handleAction('Notificações')}
          className="p-2 text-industrial-blue-light hover:bg-slate-100 rounded-full transition-colors relative"
        >
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-safety-orange rounded-full border-2 border-white"></span>
        </button>
        <button 
          onClick={() => navigate('/profile')}
          className="hidden sm:flex p-2 text-industrial-blue-light hover:bg-slate-100 rounded-full transition-colors"
        >
          <Settings size={20} />
        </button>
        <div 
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 ml-2 pl-4 border-l border-slate-100 cursor-pointer group"
        >
          <div className="h-8 w-8 rounded-full bg-slate-200 border border-slate-300 overflow-hidden group-hover:opacity-80 transition-opacity">
            {user?.avatar ? (
              <img 
                src={user.avatar} 
                alt="User" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-industrial-blue text-white font-bold text-xs uppercase">
                {user?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
              </div>
            )}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-industrial-blue group-hover:text-safety-orange transition-colors">{user?.name || 'Carregando...'}</p>
            <p className="text-[10px] text-industrial-blue-light font-mono font-bold tracking-widest uppercase">{user?.role || 'User'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
