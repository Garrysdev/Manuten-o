import React, { useState, useEffect } from 'react';
import { Search, UserPlus, MoreVertical, Star, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../lib/api';

export default function Users() {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await usersApi.list();
        setUsers(usersData);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (user.uid?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-industrial-blue tracking-tight">Gestão de Utilizadores</h1>
          <p className="text-industrial-blue-light font-medium mt-1">Monitorização de performance e taxas de cumprimento da equipa técnica.</p>
        </div>
        <button className="btn-primary h-11 px-6 shadow-lg shadow-safety-orange/20">
          <UserPlus size={18} />
          Adicionar Técnico
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard label="Média de Cumprimento" value="94.8%" icon={CheckCircle} color="text-green-500" />
        <MetricCard label="Tarefas Concluídas" value="564" icon={Star} color="text-yellow-500" />
        <MetricCard label="Técnicos Ativos" value="04" icon={Clock} color="text-blue-500" />
        <MetricCard label="Alertas de Atraso" value="02" icon={AlertCircle} color="text-red-500" />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
          <div className="relative w-full sm:w-96">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Pesquisar por nome ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:border-safety-orange focus:ring-0 transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-industrial-blue-light uppercase tracking-widest font-mono">Ordenar por:</span>
            <select className="h-11 px-4 bg-white border border-slate-200 rounded-lg text-sm font-bold text-industrial-blue focus:ring-0">
              <option>Cumprimento</option>
              <option>Mais Tarefas</option>
              <option>Nome</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="font-mono text-[10px] font-bold text-industrial-blue-light p-4 uppercase tracking-widest">Técnico</th>
                <th className="font-mono text-[10px] font-bold text-industrial-blue-light p-4 uppercase tracking-widest">Estado</th>
                <th className="font-mono text-[10px] font-bold text-industrial-blue-light p-4 uppercase tracking-widest text-center">Cumprimento</th>
                <th className="font-mono text-[10px] font-bold text-industrial-blue-light p-4 uppercase tracking-widest text-center">Tarefas</th>
                <th className="font-mono text-[10px] font-bold text-industrial-blue-light p-4 uppercase tracking-widest text-center">Tempo Médio</th>
                <th className="font-mono text-[10px] font-bold text-industrial-blue-light p-4 uppercase tracking-widest text-center">Rating</th>
                <th className="p-4 w-16"></th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 font-medium">A carregar técnicos...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 font-medium">Nenhum técnico encontrado.</td>
                </tr>
              ) : filteredUsers.map((user) => (
                <tr 
                  key={user.id} 
                  onClick={() => navigate('/profile')}
                  className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors cursor-pointer"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-industrial-blue text-white flex items-center justify-center font-bold text-xs ring-2 ring-slate-100 ring-offset-1">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-bold text-industrial-blue">{user.name || user.displayName || 'Utilizador'}</p>
                        <p className="font-mono text-[10px] text-industrial-blue-light uppercase tracking-tighter">{user.uid?.slice(0, 8)} • {user.role || 'technician'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${
                        user.status === 'Online' ? 'bg-green-500 animate-pulse' : 
                        user.status === 'Em Tarefa' ? 'bg-blue-500' : 'bg-slate-300'
                      }`} />
                      <span className="font-medium text-industrial-blue-light">{user.status || 'Offline'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`font-mono font-bold ${(user.compliance || 0) >= 95 ? 'text-green-600' : (user.compliance || 0) >= 90 ? 'text-blue-600' : 'text-amber-600'}`}>
                        {user.compliance || 0}%
                      </span>
                      <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${(user.compliance || 0) >= 95 ? 'bg-green-500' : (user.compliance || 0) >= 90 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${user.compliance || 0}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center font-mono font-bold text-industrial-blue-light">{user.tasksCount || 0}</td>
                  <td className="p-4 text-center font-mono text-industrial-blue-light">{user.avgTime || '-'}</td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-yellow-500">
                      <Star size={14} className="fill-current" />
                      <span className="font-bold text-industrial-blue">{user.rating || '-'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-2 text-slate-300 hover:text-industrial-blue transition-colors">
                      <MoreVertical size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="font-mono text-[10px] font-bold text-industrial-blue-light uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-bold text-industrial-blue">{value}</p>
      </div>
    </div>
  );
}
