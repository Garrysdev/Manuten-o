import React, { useState, useEffect } from 'react';
import { ClipboardList, Users, Timer, ArrowUp, ArrowDown, Filter, MoreVertical, AlertTriangle, Plus, Check, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import Calendar from 'react-calendar';
import { ordersApi, usersApi } from '../lib/api';
import { OrderStatus, Priority } from '../types';

const StatCard = ({ label, value, icon: Icon, trend, sub }: { label: string; value: string; icon: any; trend?: string; sub?: string }) => (
  <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between h-[150px]">
    <div className="flex justify-between items-start">
      <span className="font-mono text-xs font-bold text-industrial-blue-light uppercase tracking-wider">{label}</span>
      <Icon size={20} className="text-slate-300" />
    </div>
    <div className="flex items-end gap-3">
      <span className="text-4xl font-bold text-industrial-blue">{value}</span>
      {trend && (
        <span className={`text-sm font-bold flex items-center mb-1 ${trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
          {trend.startsWith('+') ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
          {trend.replace(/[+-]/, '')}
        </span>
      )}
      {sub && <span className="text-xs font-medium text-industrial-blue-light mb-1">{sub}</span>}
    </div>
  </div>
);

const getStatusStyles = (status: OrderStatus) => {
  switch (status) {
    case 'IN_PROGRESS': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'PENDING': return 'bg-slate-50 text-slate-700 border-slate-200';
    case 'CRITICAL': return 'bg-red-50 text-red-700 border-red-200';
    case 'COMPLETED': return 'bg-green-50 text-green-700 border-green-200';
    default: return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

interface DashboardProps {
  onNotification?: (msg: string) => void;
}

export default function Dashboard({ onNotification }: DashboardProps) {
  const navigate = useNavigate();
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedTech, setSelectedTech] = useState({ id: '', name: '' });
  const [equipment, setEquipment] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [scheduledDate, setScheduledDate] = useState<Date>(new Date());
  
  const [orders, setOrders] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [allOrders, allUsers] = await Promise.all([
        ordersApi.list(),
        usersApi.list()
      ]);
      setOrders(allOrders);
      setTechnicians(allUsers.filter((u: any) => u.role === 'technician'));
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll every 10 seconds for updates
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTech.id && equipment) {
      try {
        await ordersApi.create({
          equipment,
          technicianId: selectedTech.id,
          technicianName: selectedTech.name,
          priority,
          scheduledDate: scheduledDate.toISOString()
        });

        if (onNotification) {
          onNotification(`Tarefa de manutenção no equipamento "${equipment}" foi agendada para ${scheduledDate.toLocaleDateString()} e atribuída a ${selectedTech.name}.`);
        }
        
        setIsAssigning(false);
        setEquipment('');
        setSelectedTech({ id: '', name: '' });
        fetchData();
      } catch (err) {
        console.error("Error assigning task:", err);
      }
    }
  };

  const handleReopen = async (orderId: string) => {
    const choice = confirm('Deseja reabrir esta tarefa?\n\nOK -> Marcar como "Em Curso"\nCancelar -> Marcar como "Pendente"');
    const status = choice ? 'IN_PROGRESS' : 'PENDING';
    
    if (!confirm(`Confirmar reabertura da tarefa ${orderId.slice(0, 8)} como ${status === 'IN_PROGRESS' ? '"Em Curso"' : '"Pendente"'}?`)) return;

    try {
      await ordersApi.reopen(orderId, status);
      if (onNotification) {
        onNotification(`Tarefa ${orderId.slice(0, 8)} foi reaberta como ${status === 'IN_PROGRESS' ? 'Em Curso' : 'Pendente'}.`);
      }
      fetchData();
    } catch (err) {
      console.error("Error reopening task:", err);
      alert('Erro ao reabrir a tarefa.');
    }
  };

  const tileContent = ({ date, view }: { date: Date, view: string }) => {
    if (view === 'month') {
      const dayOrders = orders.filter(o => {
        if (!o.scheduledDate) return false;
        const d = new Date(o.scheduledDate);
        return d.getDate() === date.getDate() && 
               d.getMonth() === date.getMonth() && 
               d.getFullYear() === date.getFullYear();
      });
      if (dayOrders.length > 0) {
        return <div className="calendar-dot" />;
      }
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-end">
        <h1 className="text-3xl font-bold text-industrial-blue tracking-tight">Dashboard de Manutenção</h1>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/tasks')}
            className="h-11 px-6 bg-white border border-slate-200 text-industrial-blue rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            Gestão de Tarefas
          </button>
          <button 
            onClick={() => navigate('/create-task')}
            className="btn-primary h-11 px-6 shadow-lg shadow-safety-orange/20"
          >
            <Plus size={18} /> Nova Intervenção
          </button>
        </div>
      </div>

      {isAssigning && (
        <section className="bg-white border-2 border-safety-orange/20 rounded-xl p-6 shadow-xl animate-in fade-in slide-in-from-top-4">
          <form onSubmit={handleAssign} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[10px] font-bold text-industrial-blue-light uppercase tracking-widest">Equipamento</label>
                <input 
                  type="text" 
                  value={equipment}
                  onChange={(e) => setEquipment(e.target.value)}
                  placeholder="Ex: Passadeira A1, Motor V8..."
                  className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:border-safety-orange focus:ring-0"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[10px] font-bold text-industrial-blue-light uppercase tracking-widest">Prioridade</label>
                <select 
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-industrial-blue"
                >
                  <option value="LOW">Baixa</option>
                  <option value="MEDIUM">Média</option>
                  <option value="HIGH">Alta</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[10px] font-bold text-industrial-blue-light uppercase tracking-widest">Técnico</label>
                <select 
                  value={selectedTech.id}
                  onChange={(e) => {
                    const tech = technicians.find(t => t.id === e.target.value);
                    setSelectedTech({ id: e.target.value, name: tech?.name || tech?.displayName || '' });
                  }}
                  className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-industrial-blue"
                  required
                >
                  <option value="">Selecionar...</option>
                  {technicians.map(tech => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name || tech.displayName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 flex flex-col gap-2">
                <label className="font-mono text-[10px] font-bold text-industrial-blue-light uppercase tracking-widest">Data do Agendamento</label>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex justify-center">
                  <Calendar 
                    onChange={(val) => setScheduledDate(val as Date)} 
                    value={scheduledDate}
                    locale="pt-PT"
                  />
                </div>
              </div>
              <div className="flex flex-col justify-end gap-4 min-w-[200px]">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Resumo do Agendamento</p>
                  <p className="text-xs font-bold text-industrial-blue">Data: {scheduledDate.toLocaleDateString('pt-PT')}</p>
                  <p className="text-xs font-medium text-industrial-blue-light mt-1">
                    {equipment ? `Equipamento: ${equipment}` : 'Selecione um equipamento'}
                  </p>
                </div>
                <button type="submit" className="h-12 w-full bg-industrial-blue text-white rounded-lg font-bold hover:bg-industrial-blue-light transition-all flex items-center justify-center gap-2">
                  <Check size={18} />
                  Confirmar Agendamento
                </button>
              </div>
            </div>
          </form>
        </section>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Ordens Ativas" value={orders.filter(o => o.status !== 'COMPLETED').length.toString()} icon={ClipboardList} trend="+12%" />
        <StatCard label="Técnicos Online" value={technicians.filter(t => t.status === 'Online' || t.status === 'Em Tarefa').length.toString()} icon={Users} sub={`/ ${technicians.length} Ativos`} />
        <StatCard label="Tempo Médio Resolução" value="4.2" icon={Timer} sub="hrs" trend="-0.5h" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col shadow-sm">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-industrial-blue">Tarefas Ativas e Atribuídas</h3>
              <p className="text-xs text-industrial-blue-light font-medium mt-1">Lista de ordens em curso ou aguardando início.</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link 
                to="/tasks"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 px-4 bg-slate-50 border border-slate-200 text-sm font-bold text-industrial-blue rounded-lg hover:bg-slate-100 transition-colors"
              >
                Geral de Tarefas
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="font-mono text-xs font-bold text-industrial-blue-light py-3 px-6 uppercase tracking-wider">ID Ordem</th>
                  <th className="font-mono text-xs font-bold text-industrial-blue-light py-3 px-6 uppercase tracking-wider">Equipamento</th>
                  <th className="font-mono text-xs font-bold text-industrial-blue-light py-3 px-6 uppercase tracking-wider">Técnico</th>
                  <th className="font-mono text-xs font-bold text-industrial-blue-light py-3 px-6 uppercase tracking-wider">Estado</th>
                  <th className="font-mono text-xs font-bold text-industrial-blue-light py-3 px-6 uppercase tracking-wider">Data Agendada</th>
                  <th className="font-mono text-xs font-bold text-industrial-blue-light py-3 px-6 uppercase tracking-wider text-center">Prioridade</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium text-industrial-blue">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">A carregar ordens de serviço...</td>
                  </tr>
                ) : orders.filter(o => o.status !== 'COMPLETED').length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">Nenhuma ordem de serviço ativa.</td>
                  </tr>
                ) : orders.filter(o => o.status !== 'COMPLETED').map((order) => (
                  <tr 
                    key={order.id} 
                    onClick={() => navigate(`/tasks?id=${order.id}`)}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-6 font-mono text-industrial-blue-light uppercase">{order.id.slice(0, 8)}</td>
                    <td className="py-4 px-6 font-bold group-hover:text-safety-orange transition-colors">{order.equipment}</td>
                    <td className="py-4 px-6 text-industrial-blue-light">{order.technicianName}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusStyles(order.status)}`}>
                        {order.status === 'IN_PROGRESS' ? 'Em Curso' : 
                         order.status === 'PENDING' ? 'Atribuída' :
                         order.status === 'CRITICAL' ? 'Emergência' : 'Concluído'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-industrial-blue-light text-xs font-mono">
                      {order.scheduledDate ? new Date(order.scheduledDate).toLocaleDateString('pt-PT') : '-'}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {order.priority === 'HIGH' ? (
                        <AlertTriangle size={18} className="text-red-500 mx-auto" />
                      ) : (
                        <div className={`w-1.5 h-1.5 rounded-full mx-auto ${order.priority === 'MEDIUM' ? 'bg-amber-400' : 'bg-slate-300'}`} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <CalendarIcon className="text-safety-orange" size={24} />
            <div>
              <h3 className="font-bold text-industrial-blue">Calendário Global</h3>
              <p className="text-[10px] font-bold text-industrial-blue-light uppercase tracking-widest">Ocupação de Técnicos</p>
            </div>
          </div>
          
          <Calendar 
            locale="pt-PT"
            tileContent={tileContent}
            className="border-none"
          />

          <div className="mt-4 flex flex-col gap-3">
            <h4 className="text-xs font-bold text-industrial-blue uppercase border-b border-slate-100 pb-2">Próximas intervenções</h4>
            {orders.filter(o => o.status !== 'COMPLETED' && o.scheduledDate).slice(0, 3).map(order => (
              <div key={order.id} className="flex flex-col gap-1 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono font-bold text-industrial-blue-light">{new Date(order.scheduledDate).toLocaleDateString('pt-PT')}</span>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${getStatusStyles(order.status)}`}>{order.status}</span>
                </div>
                <p className="text-xs font-bold text-industrial-blue truncate">{order.equipment}</p>
                <p className="text-[10px] text-industrial-blue-light italic">Técnico: {order.technicianName}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col shadow-sm">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
          <div>
            <h3 className="text-lg font-bold text-industrial-blue">Histórico Recente para Revisão (Admin)</h3>
            <p className="text-xs text-industrial-blue-light font-medium mt-1">Ordens concluídas que podem necessitar de reabertura ou auditoria.</p>
          </div>
          <AlertCircle size={20} className="text-safety-orange/50" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th className="font-mono text-xs font-bold text-industrial-blue-light py-3 px-6 uppercase tracking-wider">ID Ordem</th>
                <th className="font-mono text-xs font-bold text-industrial-blue-light py-3 px-6 uppercase tracking-wider">Equipamento</th>
                <th className="font-mono text-xs font-bold text-industrial-blue-light py-3 px-6 uppercase tracking-wider">Data de Conclusão</th>
                <th className="font-mono text-xs font-bold text-industrial-blue-light py-3 px-6 uppercase tracking-wider">Versões</th>
                <th className="font-mono text-xs font-bold text-industrial-blue-light py-3 px-6 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium text-industrial-blue">
              {orders.filter(o => o.status === 'COMPLETED').length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 italic font-medium">Nenhuma tarefa concluída recentemente.</td>
                </tr>
              ) : orders.filter(o => o.status === 'COMPLETED').slice(0, 8).map((order) => (
                <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-mono text-industrial-blue-light uppercase">{order.id.slice(0, 8)}</td>
                  <td className="py-4 px-6 font-bold">{order.equipment}</td>
                  <td className="py-4 px-6 text-industrial-blue-light text-xs font-mono">
                    {order.updatedAt ? new Date(order.updatedAt).toLocaleString('pt-PT') : '-'}
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-500">v{order.revisionCount + 1}</span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button 
                      onClick={() => handleReopen(order.id)}
                      className="px-4 py-2 bg-safety-orange text-white text-[10px] font-bold uppercase rounded-lg hover:bg-safety-orange-dark transition-all shadow-lg shadow-safety-orange/10 flex items-center gap-2 ml-auto"
                    >
                      <Plus size={14} className="rotate-45" />
                      Reabrir p/ Correção
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
