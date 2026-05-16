/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { authApi } from './lib/api';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Landing from './pages/Landing';
import HistoryPage from './pages/History';
import TaskExecution from './pages/TaskExecution';
import Users from './pages/Users';
import UserProfile from './pages/UserProfile';
import InterventionHistory from './pages/Tasks';
import TechnicianDashboard from './pages/TechnicianDashboard';
import CreateTask from './pages/CreateTask';

function AppContent() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<{id: string, message: string}[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  const isPublicPage = location.pathname === '/login' || location.pathname === '/landing';

  const addNotification = (message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 6000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setRole(null);
    navigate('/login');
  };

  const handleUserUpdate = (updatedUser: any) => {
    setUser(prev => ({ ...prev, ...updatedUser }));
  };

  useEffect(() => {
    if (!loading && user && (location.pathname === '/login' || location.pathname === '/landing')) {
      if (user.role === 'technician' && !user.profile_initialized) {
        navigate('/profile');
      } else {
        // Redirect initialized technicians to root which is now their dashboard
        navigate(user.role === 'admin' ? '/' : '/');
      }
    }
  }, [user, loading, location.pathname, navigate]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await authApi.me();
          setUser(userData);
          setRole(userData.role);
          
          // Auto-redirect logic
          if (userData.role === 'technician') {
            if (!userData.profile_initialized && location.pathname !== '/profile') {
              navigate('/profile');
            }
          }
        } catch (e) {
          localStorage.removeItem('token');
          setUser(null);
          setRole(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-safety-orange"></div>
      </div>
    );
  }

  // Redirect to landing if not logged in and trying to access private routes
  if (!user && !isPublicPage) {
    return <Landing />;
  }

  // Admin and Technician layout
  if (user && !isPublicPage) {
    const isMaintenanceWorker = role === 'technician';
    
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar 
          userRole={role} 
          user={user}
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          onLogout={handleLogout}
        />
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Global Notifications Container */}
          <div className="fixed top-20 right-6 z-[100] flex flex-col gap-3 w-80 pointer-events-none">
            {notifications.map(n => (
              <div 
                key={n.id} 
                className="bg-industrial-blue text-white p-4 rounded-xl shadow-2xl border-l-[6px] border-safety-orange pointer-events-auto animate-in fade-in slide-in-from-right-8 duration-500"
              >
                <div className="flex justify-between items-start mb-1">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-safety-orange">Sistema de Alerta</p>
                  <button onClick={() => setNotifications(prev => prev.filter(notif => notif.id !== n.id))} className="text-white/50 hover:text-white">×</button>
                </div>
                <p className="text-sm font-bold leading-tight">Nova Tarefa Atribuída</p>
                <p className="text-xs text-white/80 mt-1">{n.message}</p>
              </div>
            ))}
          </div>

          <TopHeader onMenuClick={() => setIsSidebarOpen(true)} user={user} />
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-[1440px] mx-auto w-full">
              <Routes>
                <Route path="/" element={role === 'admin' ? <Dashboard onNotification={addNotification} /> : <TechnicianDashboard />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/tasks" element={<InterventionHistory />} />
                <Route path="/orders" element={<TaskExecution />} />
                <Route path="/users" element={<Users />} />
                <Route path="/create-task" element={<CreateTask />} />
                <Route path="/profile" element={<UserProfile onUserUpdate={handleUserUpdate} />} />
                <Route path="*" element={role === 'admin' ? <Dashboard /> : <TechnicianDashboard />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/landing" element={<Landing />} />
      <Route path="/login" element={<Login onLoginSuccess={(u, r) => { setUser(u); setRole(r); }} />} />
      <Route path="*" element={user ? (role === 'admin' ? <Dashboard /> : <UserProfile />) : <Landing />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
