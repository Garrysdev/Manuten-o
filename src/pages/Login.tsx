import React, { useState } from 'react';
import { ShieldCheck, Lock, ArrowRight, Factory, User, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../lib/api';

interface LoginProps {
  onLoginSuccess: (user: any, role: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const email = formData.username.includes('@') ? formData.username : `${formData.username.trim().toLowerCase()}@rgm.internal`;

    try {
      if (isRegistering) {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('As palavras-passe não coincidem.');
        }
        if (formData.password.length < 6) {
          throw new Error('A palavra-passe deve ter pelo menos 6 caracteres.');
        }

        const role = formData.username.toLowerCase() === 'admin' ? 'admin' : 'technician';
        const response = await authApi.register({
          name: formData.name,
          email: email,
          password: formData.password,
          role: role
        });

        localStorage.setItem('token', response.token);
        onLoginSuccess(response.user, response.user.role);
        navigate(response.user.role === 'admin' ? '/' : '/profile');
      } else {
        const response = await authApi.login({
          email: email,
          password: formData.password
        });

        localStorage.setItem('token', response.token);
        onLoginSuccess(response.user, response.user.role);
        navigate(response.user.role === 'admin' ? '/' : '/profile');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao entrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-industrial-blue flex flex-col items-center justify-center p-6">
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center grayscale opacity-20"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80')" }}
      />
      
      <main className="relative z-10 w-full max-w-md bg-white rounded-lg p-8 shadow-2xl flex flex-col gap-6">
        <header className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 flex items-center justify-center bg-slate-50 rounded-full border border-slate-100">
            <Factory size={32} className="text-industrial-blue" />
          </div>
          <h1 className="text-3xl font-bold text-industrial-blue text-center">RG Maintenance</h1>
          <p className="font-medium text-industrial-blue-light text-center">
            {isRegistering ? 'Criar Nova Conta' : 'Acesso de Funcionário'}
          </p>
        </header>

        <div className="flex flex-col gap-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100 flex items-center gap-2">
              <ShieldCheck size={16} />
              {error}
            </div>
          )}

          {!isRegistering && !error && (
            <div className="bg-blue-50 text-industrial-blue p-3 rounded-lg text-[11px] font-medium border border-blue-100 italic">
              <strong>Nota:</strong> Utilize o seu email ou "admin" com a palavra-passe <strong>admin123</strong> para aceder.
            </div>
          )}

          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            {isRegistering && (
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] font-bold text-industrial-blue-light uppercase tracking-widest">
                  Nome Completo
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <User size={18} />
                  </span>
                  <input 
                    name="name"
                    type="text" 
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ex: João Silva"
                    className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded text-sm font-medium focus:border-safety-orange focus:ring-1 focus:ring-safety-orange focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] font-bold text-industrial-blue-light uppercase tracking-widest">
                ID de Funcionário / Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User size={18} />
                </span>
                <input 
                  name="username"
                  type="text" 
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Ex: joaosilva ou TECH-442"
                  className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded text-sm font-medium focus:border-safety-orange focus:ring-1 focus:ring-safety-orange focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] font-bold text-industrial-blue-light uppercase tracking-widest">
                Palavra-passe
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock size={18} />
                </span>
                <input 
                  name="password"
                  type={showPassword ? 'text' : 'password'} 
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-10 bg-slate-50 border border-slate-200 rounded text-sm font-medium focus:border-safety-orange focus:ring-1 focus:ring-safety-orange focus:outline-none transition-all"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-industrial-blue transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {isRegistering && (
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] font-bold text-industrial-blue-light uppercase tracking-widest">
                  Confirmar Palavra-passe
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock size={18} />
                  </span>
                  <input 
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'} 
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded text-sm font-medium focus:border-safety-orange focus:ring-1 focus:ring-safety-orange focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn-primary h-12 text-md mt-2 disabled:opacity-50"
            >
              {loading ? 'A processar...' : (isRegistering ? 'Criar Conta' : 'Entrar')}
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 flex flex-col items-center gap-2">
            <button 
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
              }}
              className="text-sm font-bold text-industrial-blue hover:text-safety-orange transition-colors"
            >
              {isRegistering ? 'Já tem uma conta? Inicie sessão' : 'Não tem conta? Registe-se aqui'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

