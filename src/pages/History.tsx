import React, { useState, useEffect } from 'react';
import { Download, FileText, Search, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ordersApi } from '../lib/api';

export default function HistoryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const allOrders = await ordersApi.list();
        setOrders(allOrders.filter((o: any) => o.status === 'COMPLETED'));
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(o => {
    const matchesSearch = (o.equipment?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                         (o.technicianName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (o.notes?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (o.id?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    const orderDate = new Date(o.scheduledDate || o.updatedAt);
    if (startDate && orderDate < new Date(startDate)) return false;
    if (endDate && orderDate > new Date(endDate)) return false;
    
    return true;
  });

  const exportCSV = () => {
    const headers = ['ID', 'Data', 'Equipamento', 'Tecnico', 'Notas', 'Materiais'];
    const rows = filteredOrders.map(o => [
      o.id,
      new Date(o.updatedAt).toLocaleDateString('pt-PT'),
      o.equipment,
      o.technicianName,
      o.notes || '',
      o.materials ? JSON.parse(o.materials).map((m: any) => `${m.name} (${m.qty})`).join('; ') : ''
    ]);

    const csvContent = [headers, ...rows].map(e => e.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `historico_manutencao_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    doc.text('Relatório de Histórico de Manutenção', 14, 15);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-PT')}`, 14, 22);

    const tableData = filteredOrders.map(o => [
      o.id,
      new Date(o.updatedAt).toLocaleDateString('pt-PT'),
      o.equipment,
      o.technicianName,
      o.notes || '-',
    ]);

    autoTable(doc, {
      head: [['ID', 'Data', 'Equipamento', 'Técnico', 'Observações']],
      body: tableData,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 23, 42] }
    });

    doc.save(`historico_manutencao_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="flex flex-col gap-6">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-industrial-blue-light hover:text-safety-orange transition-colors font-bold text-xs uppercase tracking-widest w-fit"
      >
        <ArrowLeft size={16} />
        Voltar
      </button>

      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-industrial-blue tracking-tight">Histórico de Manutenção</h1>
          <p className="text-industrial-blue-light font-medium mt-1">Registo completo de ordens de serviço concluídas e intervenções.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportCSV}
            className="flex items-center gap-2 h-10 px-4 bg-white border border-slate-200 text-sm font-semibold text-industrial-blue rounded hover:bg-slate-50 transition-colors"
          >
            <Download size={16} />
            Exportar CSV
          </button>
          <button 
            onClick={exportPDF}
            className="flex items-center gap-2 h-10 px-4 bg-white border border-slate-200 text-sm font-semibold text-industrial-blue rounded hover:bg-slate-50 transition-colors"
          >
            <FileText size={16} />
            Exportar PDF
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-wrap gap-4 items-end shadow-sm">
        <div className="flex-1 min-w-[200px]">
          <label className="block font-mono text-[10px] font-bold text-industrial-blue-light mb-2 uppercase tracking-widest">Pesquisar</label>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded text-sm font-medium focus:border-safety-orange focus:ring-0 transition-colors"
              placeholder="Tarefa, Equipamento, ou Notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="w-full sm:w-auto">
          <label className="block font-mono text-[10px] font-bold text-industrial-blue-light mb-2 uppercase tracking-widest">Intervalo de Datas</label>
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              className="h-10 px-3 bg-slate-50 border border-slate-200 rounded text-sm" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="text-slate-400 text-xs font-bold uppercase">até</span>
            <input 
              type="date" 
              className="h-10 px-3 bg-slate-50 border border-slate-200 rounded text-sm" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <button 
          onClick={() => {setSearchTerm(''); setStartDate(''); setEndDate('');}}
          className="btn-secondary h-10 transition-all font-mono text-xs tracking-widest"
        >
          Limpar Filtros
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col shadow-sm flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="font-mono text-xs font-bold text-industrial-blue-light p-4 uppercase tracking-wider">Data</th>
                <th className="font-mono text-xs font-bold text-industrial-blue-light p-4 uppercase tracking-wider">Técnico</th>
                <th className="font-mono text-xs font-bold text-industrial-blue-light p-4 uppercase tracking-wider">Equipamento/Local</th>
                <th className="font-mono text-xs font-bold text-industrial-blue-light p-4 uppercase tracking-wider">Estado</th>
                <th className="font-mono text-xs font-bold text-industrial-blue-light p-4 uppercase tracking-wider">Última Atualização</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium text-industrial-blue">
              {loading ? (
                <tr><td colSpan={6} className="p-12 text-center text-slate-400">A carregar registos...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-slate-400">Nenhum registo concluído encontrado.</td></tr>
              ) : filteredOrders.map((log) => (
                <tr 
                  key={log.id} 
                  onClick={() => navigate(`/orders?id=${log.id}`)}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <td className="p-4 text-industrial-blue-light">{log.scheduledDate ? new Date(log.scheduledDate).toLocaleDateString('pt-PT') : '-'}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-industrial-blue text-white flex items-center justify-center text-[10px] font-bold">
                        {log.technicianName?.split(' ').map((n: string) => n[0]).join('') || 'T'}
                      </div>
                      <span>{log.technicianName}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-safety-orange-dark group-hover:text-safety-orange transition-colors">{log.equipment}</span>
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{log.id}</span>
                    </div>
                  </td>
                  <td className="p-4">
                     <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-[10px] font-bold border border-green-200 uppercase tracking-widest">Concluído</span>
                  </td>
                  <td className="p-4 text-industrial-blue-light">
                    {log.updatedAt ? new Date(log.updatedAt).toLocaleString('pt-PT') : '-'}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end pr-4 text-slate-300 group-hover:text-industrial-blue transition-colors">
                      <FileText size={18} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-between items-center text-industrial-blue-light font-mono text-[10px]">
          <span className="font-bold text-industrial-blue-light uppercase tracking-widest">Sistema de Arquivo RG Maintenance</span>
          <div className="flex items-center gap-1">
            <button className="h-8 w-8 flex items-center justify-center border border-slate-200 rounded hover:bg-white disabled:opacity-50">
              <ChevronLeft size={16} />
            </button>
            <button className="h-8 w-8 flex items-center justify-center border border-industrial-blue bg-industrial-blue text-white rounded font-bold">1</button>
            <button className="h-8 w-8 flex items-center justify-center border border-slate-200 rounded hover:bg-white text-industrial-blue">2</button>
            <button className="h-8 w-8 flex items-center justify-center border border-slate-200 rounded hover:bg-white">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
