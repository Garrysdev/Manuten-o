import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  ArrowRight, 
  Calendar as CalendarIcon 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import { authApi, ordersApi } from '../lib/api';

export default function TechnicianDashboard() {
  const [userData, setUserData] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [me, userTasks] = await Promise.all([
          authApi.me(),
          ordersApi.list()
        ]);
        setUserData(me);
        setTasks(userTasks);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    // Basic task analytics or other logic if needed
  }, [selectedDate, tasks, loading]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-industrial-blue"></div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Quick Action Bar */}
      <div className="flex justify-between items-center bg-industrial-blue p-4 rounded-2xl shadow-lg -mb-4 animate-in slide-in-from-top-4 duration-300">
         <div className="flex items-center gap-3 text-white pl-2">
           <div className="p-2 bg-white/10 rounded-lg">
              <Wrench size={20} className="text-safety-orange" />
           </div>
           <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-60">Pronto para trabalhar?</p>
              <p className="text-sm font-medium">Bem-vindo, {userData?.displayName || userData?.name}</p>
           </div>
         </div>
      </div>

      {/* Main Dashboard - Tasks */}
      <section className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-industrial-blue flex items-center gap-2">
            <Wrench size={20} className="text-safety-orange" /> Minhas Tarefas Pendentes
          </h2>
          <button 
            onClick={() => navigate('/tasks')}
            className="text-xs font-bold text-industrial-blue hover:text-safety-orange transition-colors flex items-center gap-1"
          >
            Ver todas <ArrowRight size={14} />
          </button>
        </div>
        <div className="divide-y">
          {tasks.filter(t => t.status !== 'COMPLETED').length === 0 ? (
            <div className="p-12 text-center text-slate-400 italic text-sm">
              Não tem tarefas pendentes para hoje.
            </div>
          ) : (
            tasks.filter(t => t.status !== 'COMPLETED').slice(0, 5).map(task => (
              <div key={task.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <p className="font-bold text-industrial-blue">{task.equipment}</p>
                  <p className="text-xs text-slate-400 font-mono">{task.id.slice(0,8)} • {task.priority}</p>
                </div>
                <Link to={`/orders?id=${task.id}`} className="p-2 text-slate-300 hover:text-industrial-blue"><ArrowRight size={20} /></Link>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Activities and Calendar */}
      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-industrial-blue mb-6 flex items-center gap-2"><CalendarIcon size={18} /> Agenda</h3>
          <div className="flex justify-center">
            <Calendar onChange={(val) => setSelectedDate(val as Date)} value={selectedDate} locale="pt-PT" className="border-none w-full max-w-2xl" />
          </div>
        </div>
      </div>

      {/* Global Task Navigation Button at the bottom */}
      <div className="mt-4">
        <button 
          onClick={() => navigate('/tasks')}
          className="w-full py-5 bg-safety-orange text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-safety-orange/20 hover:scale-[1.01] active:scale-95 transition-all"
        >
          <Wrench size={24} />
          <span className="text-lg">Painel de Tarefas</span>
          <ArrowRight size={24} />
        </button>
      </div>
    </div>
  );
}
