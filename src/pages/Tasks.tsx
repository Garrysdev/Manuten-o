import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Calendar, User, Clock, FileText, ArrowLeft, ExternalLink, CheckCircle2, AlertCircle, PlayCircle, History } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ordersApi } from '../lib/api';

export default function TasksPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get('id');
  const topRef = useRef<HTMLDivElement>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedIntervention, setSelectedIntervention] = useState<any>(null);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRevisions = async () => {
      if (selectedIntervention?.id) {
        try {
          const revs = await ordersApi.getRevisions(selectedIntervention.id);
          setRevisions(revs);
        } catch (err) {
          console.error("Error fetching revisions:", err);
          setRevisions([]);
        }
      } else {
        setRevisions([]);
      }
    };
    fetchRevisions();
  }, [selectedIntervention?.id]);

  useEffect(() => {
    const fetchInterventions = async () => {
      try {
        const allOrders = await ordersApi.list();
        const mapped = allOrders.map((o: any) => {
          let partsUsed: string[] = [];
          let photoList: string[] = [];
          if (o.materials) {
            try {
              const materials = JSON.parse(o.materials);
              partsUsed = materials.map((m: any) => `${m.name} (${m.qty})`);
            } catch (e) {
              console.error("Error parsing materials in TasksPage:", e);
            }
          }

          if (o.photos) {
            try {
              photoList = JSON.parse(o.photos);
            } catch (e) {
              console.error("Error parsing photos in TasksPage:", e);
            }
          }

          let eventList: any[] = [];
          if (o.events) {
            try {
              eventList = JSON.parse(o.events);
            } catch (e) {
              console.error("Error parsing events in TasksPage:", e);
            }
          }

          // Calculate duration
          let totalHours = 0;
          if (o.startedAt) {
            const start = new Date(o.startedAt).getTime();
            const end = o.status === 'COMPLETED' ? new Date(o.updatedAt).getTime() : new Date().getTime();
            
            let totalMs = end - start;
            
            // Subtract pause durations
            for (let i = 0; i < eventList.length; i++) {
              if (eventList[i].type === 'PAUSE') {
                const pauseStart = new Date(eventList[i].timestamp).getTime();
                const resumeEvent = eventList.slice(i + 1).find(e => e.type === 'RESUME');
                const pauseEnd = resumeEvent ? new Date(resumeEvent.timestamp).getTime() : end;
                totalMs -= (pauseEnd - pauseStart);
              }
            }
            totalHours = Math.max(0, totalMs / (1000 * 60 * 60));
          }

          return {
            ...o,
            taskName: o.equipment, // Use equipment as task name
            technician: o.technicianName,
            date: o.scheduledDate ? new Date(o.scheduledDate).toLocaleDateString('pt-PT') : (o.updatedAt ? new Date(o.updatedAt).toLocaleDateString('pt-PT') : 'N/A'),
            duration: o.status === 'COMPLETED' ? `${totalHours.toFixed(2)}h` : '-',
            totalHours,
            type: o.type || (o.priority === 'HIGH' ? 'Correctiva' : 'Preventiva'),
            displayStatus: o.status === 'COMPLETED' ? 'Concluído' : (o.status === 'IN_PROGRESS' ? 'Em Curso' : 'Pendente'),
            description: o.status === 'COMPLETED' 
              ? (o.notes || `Intervenção concluída com sucesso. Checklists verificadas e equipamento testado em carga nominal.`)
              : `Tarefa agendada para ${o.scheduledDate ? new Date(o.scheduledDate).toLocaleDateString('pt-PT') : 'breve'}. Aguarda início de trabalhos.`,
            partsUsed: partsUsed.length > 0 ? partsUsed : (o.status === 'COMPLETED' ? ['Sem registo de materiais'] : []),
            photoList,
            eventList
          };
        });
        setInterventions(mapped);
        
        if (initialId) {
          const matched = mapped.find(i => i.id === initialId);
          if (matched) setSelectedIntervention(matched);
        }
      } catch (err) {
        console.error("Error fetching interventions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInterventions();
  }, [initialId]);

  // Auto-scroll to top when a task is selected
  useEffect(() => {
    if (selectedIntervention && topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedIntervention]);

  const exportTaskPDF = async (task: any) => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    const safetyOrange: [number, number, number] = [249, 115, 22]; // #F97316
    const industrialBlue: [number, number, number] = [15, 23, 42]; // #0F172A
    
    // Header Branding
    doc.setFillColor(safetyOrange[0], safetyOrange[1], safetyOrange[2]);
    doc.rect(0, 0, 210, 40, 'F');
    
    // Logo / Brand Name
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text('RG Maintenance', 14, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('TECNOLOGIA E MANUTENÇÃO INDUSTRIAL', 14, 32);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Intervenção', 120, 25);
    
    // Reset for Body
    doc.setTextColor(industrialBlue[0], industrialBlue[1], industrialBlue[2]);
    let nextY = 55;

    // Task Header Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`ID DA TAREFA:`, 14, nextY);
    doc.setFont('helvetica', 'normal');
    doc.text(task.id, 45, nextY);
    
    doc.setFont('helvetica', 'bold');
    doc.text(`ESTADO:`, 120, nextY);
    doc.setFont('helvetica', 'normal');
    doc.text(task.displayStatus.toUpperCase(), 140, nextY);
    
    nextY += 8;
    doc.setDrawColor(safetyOrange[0], safetyOrange[1], safetyOrange[2]);
    doc.setLineWidth(0.5);
    doc.line(14, nextY, 196, nextY);
    nextY += 15;

    // Basic Info Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalhes da Intervenção', 14, nextY);
    nextY += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Equipamento:', 14, nextY);
    doc.setFont('helvetica', 'normal');
    doc.text(task.equipment, 50, nextY);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Data Planeada:', 120, nextY);
    doc.setFont('helvetica', 'normal');
    doc.text(task.scheduledDate ? new Date(task.scheduledDate).toLocaleDateString('pt-PT') : 'N/A', 155, nextY);
    
    nextY += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Tipo de Intervenção:', 14, nextY);
    doc.setFont('helvetica', 'normal');
    doc.text(task.type, 50, nextY);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Início:', 120, nextY);
    doc.setFont('helvetica', 'normal');
    doc.text(task.startedAt ? new Date(task.startedAt).toLocaleString('pt-PT') : 'N/A', 155, nextY);
    
    nextY += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Técnico:', 14, nextY);
    doc.setFont('helvetica', 'normal');
    doc.text(task.technician, 50, nextY);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Conclusão:', 120, nextY);
    doc.setFont('helvetica', 'normal');
    doc.text(task.updatedAt ? new Date(task.updatedAt).toLocaleString('pt-PT') : 'N/A', 155, nextY);

    nextY += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Duração Total:', 14, nextY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${task.totalHours?.toFixed(2)} horas`, 50, nextY);
    
    nextY += 15;
    
    // Description
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo e Notas do Técnico', 14, nextY);
    nextY += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const splitDescription = doc.splitTextToSize(task.description || 'Sem descrição adicional registada.', 180);
    doc.text(splitDescription, 14, nextY);
    nextY += (splitDescription.length * 6) + 10;

    // Materials
    if (task.materials) {
       try {
         const materials = JSON.parse(task.materials);
         if (materials.length > 0) {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Materiais e Peças Atribuídas', 14, nextY);
            nextY += 5;

            autoTable(doc, {
              head: [['Material / Peça', 'Quantidade']],
              body: materials.map((m: any) => [m.name, m.qty]),
              startY: nextY,
              headStyles: { fillColor: industrialBlue, fontStyle: 'bold' },
              alternateRowStyles: { fillColor: [248, 250, 252] },
              margin: { left: 14, right: 14 }
            });
            nextY = (doc as any).lastAutoTable.finalY + 15;
         }
       } catch (e) { console.error(e); }
    }

    // Checklist
    if (task.checklist) {
       try {
         const checklist = JSON.parse(task.checklist);
         if (checklist.length > 0) {
            if (nextY > 250) { doc.addPage(); nextY = 20; }
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Conformidade e Checklist', 14, nextY);
            nextY += 10;
            doc.setFontSize(10);
            checklist.forEach((item: any) => {
              const status = item.checked ? 'CONFORME' : 'NÃO CONFORME';
              doc.setFont('helvetica', 'bold');
              doc.text(`[${item.checked ? 'X' : ' '}]`, 14, nextY);
              doc.setFont('helvetica', 'normal');
              doc.text(`${item.label}`, 22, nextY);
              doc.setFontSize(8);
              const color = item.checked ? [34, 197, 94] : [239, 68, 68];
              doc.setTextColor(color[0], color[1], color[2]);
              doc.text(status, 170, nextY);
              doc.setTextColor(industrialBlue[0], industrialBlue[1], industrialBlue[2]);
              doc.setFontSize(10);
              nextY += 7;
              if (nextY > 280) { doc.addPage(); nextY = 20; }
            });
            nextY += 10;
         }
       } catch (e) { console.error(e); }
    }

    // Execution Events (Pauses/Resumes)
    if ((task.eventList && task.eventList.length > 0) || task.startedAt) {
      if (nextY > 230) { doc.addPage(); nextY = 20; }
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Histórico de Execução (Pausas e Reinícios)', 14, nextY);
      nextY += 7;

      const eventsData = [];
      if (task.startedAt) {
        eventsData.push(['INÍCIO', new Date(task.startedAt).toLocaleString('pt-PT'), 'Início da intervenção']);
      }
      
      task.eventList?.forEach((ev: any) => {
        eventsData.push([
          ev.type === 'PAUSE' ? 'PAUSA' : 'REINÍCIO',
          new Date(ev.timestamp).toLocaleString('pt-PT'),
          ev.reason || '-'
        ]);
      });

      if (task.status === 'COMPLETED') {
        eventsData.push(['FIM', new Date(task.updatedAt).toLocaleString('pt-PT'), 'Tarefa concluída']);
      }

      autoTable(doc, {
        head: [['Evento', 'Data/Hora', 'Observação']],
        body: eventsData,
        startY: nextY,
        headStyles: { fillColor: industrialBlue, fontStyle: 'bold' },
        margin: { left: 14, right: 14 }
      });
      nextY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Photos
    if (task.photoList && task.photoList.length > 0) {
      if (nextY > 230) { doc.addPage(); nextY = 20; }
      else { nextY += 5; }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Evidências Fotográficas', 14, nextY);
      nextY += 10;

      const imgWidth = 85;
      const imgHeight = 65;
      const margin = 14;
      const spacing = 10;
      let currentX = margin;

      task.photoList.forEach((photo: string, index: number) => {
        if (nextY + imgHeight > 280) {
          doc.addPage();
          nextY = 20;
          currentX = margin;
        }

        try {
          doc.addImage(photo, 'JPEG', currentX, nextY, imgWidth, imgHeight);
        } catch (e) { console.error(e); }

        if ((index + 1) % 2 === 0) {
          currentX = margin;
          nextY += imgHeight + spacing;
        } else {
          currentX += imgWidth + spacing;
        }
      });
    }

    // Footer on last page
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Relatório gerado automaticamente por MAINT System em ${new Date().toLocaleString('pt-PT')}`, 14, 285);

    doc.save(`relatorio_${task.id}.pdf`);
  };

  const filtered = interventions.filter(i => {
    const matchesSearch = (i.equipment?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
      (i.technician?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (i.id?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || i.status === filterStatus;
    const matchesType = filterType === 'all' || i.type === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="flex flex-col gap-8 pb-12" ref={topRef}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-industrial-blue tracking-tight">Gestão de Tarefas</h1>
            <p className="text-industrial-blue-light font-medium">Informação detalhada de estados, datas e planeamento.</p>
          </div>
        </div>
      </div>

      {/* Details Section (Now at the TOP) */}
      <section className="animate-in fade-in slide-in-from-top-4 duration-500">
        {selectedIntervention ? (
          <>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${
                  selectedIntervention.status === 'COMPLETED' ? 'bg-green-50 text-green-600' : 'bg-safety-orange/10 text-safety-orange'
                }`}>
                  {selectedIntervention.status === 'COMPLETED' ? <CheckCircle2 size={32} /> : <Clock size={32} />}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-industrial-blue">Informação da Tarefa</h3>
                  <p className="text-sm font-mono text-industrial-blue-light font-bold uppercase tracking-widest">{selectedIntervention.id}</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                 <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${
                    selectedIntervention.status === 'COMPLETED' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                 }`}>
                    {selectedIntervention.displayStatus.toUpperCase()}
                 </span>
              </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              <div className="flex flex-col gap-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 block">Nome da Tarefa</label>
                  <p className="text-lg font-bold text-industrial-blue">{selectedIntervention.taskName}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 block">Equipamento</label>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <ExternalLink size={16} className="text-slate-400" />
                    <p className="font-bold text-industrial-blue">{selectedIntervention.equipment}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 block">Data Agendada</label>
                    <p className="text-sm font-bold text-industrial-blue">{selectedIntervention.date}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 block">Tipo de Intervenção</label>
                    <p className="text-sm font-bold text-industrial-blue">{selectedIntervention.type}</p>
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 block">Técnico Atribuído</label>
                    <p className="text-sm font-bold text-industrial-blue">{selectedIntervention.technician}</p>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 block">Contexto / Descrição</label>
                  <p className="text-sm text-slate-600 leading-relaxed italic">{selectedIntervention.description}</p>
                </div>
                
                {selectedIntervention.photoList && selectedIntervention.photoList.length > 0 && (
                  <div className="mt-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 block">Evidências Fotográficas</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {selectedIntervention.photoList.map((photo: string, i: number) => (
                        <div key={i} className="aspect-square rounded-lg overflow-hidden border border-slate-100 shadow-sm bg-slate-50 cursor-pointer hover:border-safety-orange transition-all">
                          <img src={photo} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-6 border-t md:border-t-0 md:border-l border-slate-100 md:pl-8">
                {selectedIntervention.status === 'COMPLETED' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 block">Peças Utilizadas</label>
                      <div className="flex flex-wrap gap-2">
                        {selectedIntervention.partsUsed.map((part: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">{part}</span>
                        ))}
                      </div>
                    </div>
                    <button 
                      onClick={() => exportTaskPDF(selectedIntervention)}
                      className="w-full btn-secondary h-11 flex items-center justify-center gap-2"
                    >
                      <FileText size={18} />
                      Descarregar Relatório
                    </button>
                  </div>
                ) : (
                   <div className="space-y-6">
                      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                        <div className="flex items-center gap-2 mb-2 text-blue-700">
                          <AlertCircle size={16} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Procedimento</span>
                        </div>
                        <p className="text-xs text-blue-600 leading-tight">
                          Certifique-se de que possui todos os equipamentos de segurança e ferramentas necessárias listadas no manual do {selectedIntervention.equipment}.
                        </p>
                      </div>
                      <button 
                        onClick={() => navigate(`/orders?id=${selectedIntervention.id}`)}
                        className="w-full bg-industrial-blue text-white h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-3 hover:bg-industrial-blue-light transition-all shadow-xl shadow-industrial-blue/20"
                      >
                        <PlayCircle size={20} />
                        Iniciar Execução de Tarefa
                      </button>
                   </div>
                )}
              </div>
            </div>
          </div>

          {revisions.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-lg mt-8 overflow-hidden">
               <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                  <History size={16} className="text-industrial-blue-light" />
                  <h4 className="text-xs font-bold text-industrial-blue uppercase tracking-widest">Histórico de Alterações / Reaberturas</h4>
               </div>
               <div className="divide-y divide-slate-100">
                  {revisions.map((rev) => (
                    <div key={rev.id} className="p-4 flex justify-between items-start hover:bg-slate-50 transition-colors">
                      <div className="flex flex-col gap-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded w-fit ${
                          rev.status === 'COMPLETED' ? 'bg-green-50 text-green-600' : 
                          rev.status === 'REOPENED' ? 'bg-safety-orange text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {rev.status === 'COMPLETED' ? 'VERSÃO FINALIZADA' : rev.status.toUpperCase()}
                        </span>
                        <p className="text-xs text-industrial-blue-light leading-relaxed mt-1">
                          {rev.notes || 'Snapshot de estado guardado automaticamente.'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-mono font-bold text-industrial-blue">{new Date(rev.updatedAt).toLocaleString('pt-PT')}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Auto-Registo</p>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          )}
          </>
        ) : (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
            <AlertCircle size={48} className="text-slate-300 mx-auto mb-4" />
            <h4 className="text-lg font-bold text-industrial-blue">Nenhuma Tarefa Selecionada</h4>
            <p className="text-sm text-industrial-blue-light">Selecione uma tarefa na lista abaixo para visualizar e gerir os detalhes.</p>
          </div>
        )}
      </section>

      {/* List Section */}
      <div className="flex flex-col gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Pesquisar intervenções..."
              className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-100 rounded-lg text-sm focus:border-safety-orange focus:ring-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:flex-initial">
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full md:w-40 h-11 pl-4 pr-10 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold text-industrial-blue appearance-none focus:border-safety-orange focus:ring-0"
              >
                <option value="all">Todos os Estados</option>
                <option value="PENDING">Pendentes</option>
                <option value="IN_PROGRESS">Em Curso</option>
                <option value="COMPLETED">Concluídos</option>
              </select>
              <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative flex-1 md:flex-initial">
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full md:w-40 h-11 pl-4 pr-10 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold text-industrial-blue appearance-none focus:border-safety-orange focus:ring-0"
              >
                <option value="all">Todos os Tipos</option>
                <option value="Correctiva">Correctiva</option>
                <option value="Preventiva">Preventiva</option>
                <option value="Plano de Manutenção">Plano de Manutenção</option>
              </select>
              <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="font-mono text-[10px] font-bold text-industrial-blue-light p-4 uppercase tracking-widest">ID / Data</th>
                  <th className="font-mono text-[10px] font-bold text-industrial-blue-light p-4 uppercase tracking-widest">Nome da Tarefa / Equipamento</th>
                  <th className="font-mono text-[10px] font-bold text-industrial-blue-light p-4 uppercase tracking-widest text-center">Estado</th>
                  <th className="font-mono text-[10px] font-bold text-industrial-blue-light p-4 uppercase tracking-widest text-right">Duração/Previsão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr 
                    key={item.id} 
                    onClick={() => setSelectedIntervention(item)}
                    className={`cursor-pointer transition-colors ${selectedIntervention?.id === item.id ? 'bg-safety-orange/5' : 'hover:bg-slate-50'}`}
                  >
                    <td className="p-4">
                      <p className="font-mono text-xs font-bold text-industrial-blue">{item.id.slice(0, 8)}</p>
                      <p className="text-[10px] font-bold text-industrial-blue-light">{item.date}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-industrial-blue">{item.taskName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-industrial-blue-light flex items-center gap-1">
                          <ArrowLeft size={10} className="rotate-180" /> {item.equipment}
                        </p>
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                          {item.type}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        item.status === 'COMPLETED' ? 'bg-green-50 text-green-600 border-green-100' : 
                        item.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>
                        {item.displayStatus}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono text-xs text-industrial-blue-light">
                      {item.duration}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
