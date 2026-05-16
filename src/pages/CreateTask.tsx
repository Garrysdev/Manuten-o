import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Calendar as CalendarIcon, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight,
  ClipboardList,
  ShieldCheck,
  Zap,
  RotateCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ordersApi, usersApi } from '../lib/api';

type TaskType = 'Preventiva' | 'Correctiva' | 'Plano de Manutenção';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export default function CreateTask() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [technicians, setTechnicians] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    equipment: '',
    type: 'Preventiva' as TaskType,
    priority: 'MEDIUM' as Priority,
    technicianId: '',
    scheduledDate: new Date().toISOString().split('T')[0],
  });

  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const users = await usersApi.list();
        setTechnicians(users.filter((u: any) => u.role === 'technician'));
      } catch (err) {
        console.error("Error fetching technicians:", err);
      }
    };
    fetchTechnicians();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.equipment || !formData.technicianId || !formData.scheduledDate) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      const tech = technicians.find(t => t.id === formData.technicianId);
      await ordersApi.create({
        ...formData,
        technicianName: tech?.name || 'Desconhecido'
      });
      setSuccess(true);
      setTimeout(() => navigate('/tasks'), 2000);
    } catch (err: any) {
      alert(err.message || "Erro ao criar tarefa");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 animate-in zoom-in-95 duration-300">
        <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-2xl font-bold text-industrial-blue">Tarefa Criada com Sucesso!</h2>
        <p className="text-slate-500">A redirecionar para a gestão de tarefas...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-industrial-blue rounded-xl text-white shadow-lg shadow-industrial-blue/20">
          <ClipboardList size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-industrial-blue">Nova Intervenção</h1>
          <p className="text-slate-500">Agende e atribua tarefas à equipa técnica</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {/* Main Info Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-industrial-blue mb-6 flex items-center gap-2">
              <Wrench size={18} className="text-safety-orange" /> Detalhes do Equipamento
            </h3>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Identificação do Equipamento / Asset *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Gerador Principal G-01, Elevador E-2..."
                  className="h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-safety-orange transition-all outline-none"
                  value={formData.equipment}
                  onChange={e => setFormData({...formData, equipment: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tipo de Intervenção</label>
                    <div className="grid grid-cols-1 gap-2">
                      {(['Preventiva', 'Correctiva', 'Plano de Manutenção'] as TaskType[]).map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({...formData, type})}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                            formData.type === type 
                            ? 'bg-industrial-blue text-white border-industrial-blue shadow-md' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {type === 'Preventiva' && <ShieldCheck size={18} />}
                          {type === 'Correctiva' && <Zap size={18} />}
                          {type === 'Plano de Manutenção' && <RotateCcw size={18} />}
                          <div className="flex flex-col">
                            <span className="text-xs font-bold">{type}</span>
                            <span className={`text-[8px] font-medium opacity-60 ${formData.type === type ? 'text-white' : 'text-slate-400'}`}>
                              {type === 'Preventiva' && 'Manutenção agendada para evitar falhas.'}
                              {type === 'Correctiva' && 'Reparação imediata de avaria detetada.'}
                              {type === 'Plano de Manutenção' && 'Intervenção cíclica programada no plano anual.'}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                 </div>

                 <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Prioridade</label>
                    <div className="grid grid-cols-1 gap-2">
                      {(['LOW', 'MEDIUM', 'HIGH'] as Priority[]).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setFormData({...formData, priority: p})}
                          className={`flex items-center justify-center p-3 rounded-xl border text-center transition-all ${
                            formData.priority === p 
                            ? (p === 'HIGH' ? 'bg-red-500 text-white border-red-500 shadow-md' : 'bg-industrial-blue text-white border-industrial-blue shadow-md')
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-xs font-bold">{p === 'LOW' ? 'Baixa' : p === 'MEDIUM' ? 'Média' : 'Alta / Crítica'}</span>
                        </button>
                      ))}
                    </div>
                 </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-industrial-blue mb-6 flex items-center gap-2">
              <CalendarIcon size={18} className="text-safety-orange" /> Agendamento
            </h3>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Data Agendada *</label>
              <input 
                type="date" 
                required
                className="h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-safety-orange transition-all outline-none"
                value={formData.scheduledDate}
                onChange={e => setFormData({...formData, scheduledDate: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Assignment Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm sticky top-8">
            <h3 className="font-bold text-industrial-blue mb-6 flex items-center gap-2">
              <User size={18} className="text-safety-orange" /> Atribuição Técnica
            </h3>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Selecionar Técnico *</label>
                <select 
                  required
                  className="h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-safety-orange transition-all outline-none appearance-none"
                  value={formData.technicianId}
                  onChange={e => setFormData({...formData, technicianId: e.target.value})}
                >
                  <option value="">Escolha um técnico...</option>
                  {technicians.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.status})</option>
                  ))}
                </select>
              </div>

              {formData.technicianId && (
                <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 animate-in fade-in duration-300">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Resumo da Atribuição</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-industrial-blue rounded-lg text-white flex items-center justify-center font-bold text-xs">
                      {technicians.find(t => t.id === formData.technicianId)?.name?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-industrial-blue">{technicians.find(t => t.id === formData.technicianId)?.name}</p>
                      <p className="text-[10px] text-green-600 font-bold uppercase">{technicians.find(t => t.id === formData.technicianId)?.status}</p>
                    </div>
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 bg-safety-orange text-white rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-safety-orange/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
              >
                {loading ? (
                  <RotateCcw size={20} className="animate-spin" />
                ) : (
                  <>
                    <span>Criar e Atribuir</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 italic text-[11px] text-slate-400">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <p>Ao criar uma tarefa, o técnico receberá uma notificação imediata no seu painel de intervenções.</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
