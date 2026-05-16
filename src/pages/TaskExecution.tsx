import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Pause, Play, CheckCircle, AlertTriangle, Plus, Trash2, Camera, Upload, X, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ordersApi } from '../lib/api';

export default function TaskExecution() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('id') || '';
  
  const [order, setOrder] = useState<any>(null);
  const [checklist, setChecklist] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<string[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showChecklistAlert, setShowChecklistAlert] = useState(false);
  const [pauseReason, setPauseReason] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const isReadOnly = order?.status === 'COMPLETED';

  const optimizeImage = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800; // Increased for better evidence quality
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6)); // Balanced quality/size
      };
      img.src = dataUrl;
    });
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
      setShowCamera(true);
    } catch (err) {
      alert('Não foi possível aceder à câmara.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        const optimized = await optimizeImage(dataUrl);
        setPhotos(prev => [...prev, optimized]);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const optimized = await optimizeImage(reader.result as string);
          setPhotos(prev => [...prev, optimized]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!orderId) return;
    const fetchOrder = async () => {
      try {
        const allOrders = await ordersApi.list();
        const found = allOrders.find((o: any) => o.id === orderId);
        setOrder(found);
        
        if (found) {
          if (found.notes) setNotes(found.notes);
          
          if (found.checklist) {
            try {
              setChecklist(JSON.parse(found.checklist));
            } catch (e) { console.error("Error parsing checklist:", e); }
          } else if (!found.status || found.status !== 'COMPLETED') {
            // Default checklist for new tasks only
            setChecklist([
              { id: 1, label: 'Procedimentos de Bloqueio/Etiquetagem (LOTO) concluídos e verificados.', checked: false },
              { id: 2, label: 'Área livre de pessoal não essencial; barreiras de segurança erguidas.', checked: false },
              { id: 3, label: 'EPI apropriado (Luvas, óculos de segurança, capacete) colocado.', checked: false },
            ]);
          }

          if (found.materials) {
            try {
              setMaterials(JSON.parse(found.materials));
            } catch (e) { console.error("Error parsing materials:", e); }
          }

          if (found.photos) {
            try {
              setPhotos(JSON.parse(found.photos));
            } catch (e) { console.error("Error parsing photos:", e); }
          }

          if (found.events) {
            try {
              setEvents(JSON.parse(found.events));
            } catch (e) { console.error("Error parsing events:", e); }
          }
        }
      } catch (e) {
        console.error("Error fetching order:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (order?.startedAt && order.status === 'IN_PROGRESS') {
      const start = new Date(order.startedAt).getTime();
      const now = new Date().getTime();
      const diff = Math.floor((now - start) / 1000);
      setElapsedTime(diff > 0 ? diff : 0);
      setIsRunning(true);
    }
  }, [order]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ name: '', qty: '1 un' });

  const handleAddMaterial = () => {
    if (!newMaterial.name.trim()) return;
    
    const material = {
      id: Date.now(),
      name: newMaterial.name,
      sku: 'EXT',
      qty: newMaterial.qty,
      confirmed: true // Newly added materials are usually confirmed by default
    };
    setMaterials(prev => [...prev, material]);
    setNewMaterial({ name: '', qty: '1 un' });
    setIsAddingMaterial(false);
  };

  const [showErrors, setShowErrors] = useState(false);

  const handleComplete = async () => {
    if (isReadOnly) return;
    
    const missingItems = [];
    const hasChecklistError = !checklist.every(i => i.checked);
    const hasMaterialsError = !materials.every(m => m.confirmed);
    const hasNotesError = !notes.trim();
    
    if (hasChecklistError) {
      missingItems.push('Verificar todos os itens da Checklist de Segurança');
    }
    
    if (hasMaterialsError) {
      missingItems.push('Confirmar todos os materiais consumidos');
    }

    if (hasNotesError) {
      missingItems.push('Introduzir Observações & Notas da intervenção');
    }

    if (missingItems.length > 0) {
      setShowErrors(true);
      alert(`Impossível concluir a tarefa. Falta preencher:\n\n- ${missingItems.join('\n- ')}`);
      return;
    }

    try {
      await ordersApi.update(orderId, {
        status: 'COMPLETED',
        notes: notes,
        checklist: JSON.stringify(checklist),
        materials: JSON.stringify(materials),
        photos: JSON.stringify(photos),
        events: JSON.stringify(events),
        updatedAt: new Date().toISOString()
      });
      alert('Tarefa concluída com sucesso!');
      navigate('/history');
    } catch (e) {
      console.error("Error completing task:", e);
    }
  };

  const handleStartTask = async () => {
    if (isReadOnly) return;
    
    const isChecklistComplete = checklist.every(item => item.checked);
    if (!isChecklistComplete) {
      setShowErrors(true);
      setShowChecklistAlert(true);
      return;
    }

    try {
      const startTime = new Date().toISOString();
      const updatedOrder = {
        status: 'IN_PROGRESS',
        startedAt: startTime,
        updatedAt: startTime
      };
      await ordersApi.update(orderId, updatedOrder);
      setOrder({ ...order, ...updatedOrder });
      setIsRunning(true);
      setShowErrors(false);
    } catch (e) {
      console.error("Error starting task:", e);
    }
  };

  const handlePauseTask = async () => {
    if (!pauseReason.trim()) return;
    
    const newEvent = {
      type: 'PAUSE',
      timestamp: new Date().toISOString(),
      reason: pauseReason
    };
    
    const newEvents = [...events, newEvent];
    try {
      await ordersApi.update(orderId, {
        events: JSON.stringify(newEvents),
        updatedAt: new Date().toISOString()
      });
      setEvents(newEvents);
      setIsRunning(false);
      setShowPauseModal(false);
      setPauseReason('');
    } catch (e) {
      console.error("Error pausing task:", e);
    }
  };

  const handleResumeTask = async () => {
    const isChecklistComplete = checklist.every(item => item.checked);
    if (!isChecklistComplete) {
      setShowErrors(true);
      setShowChecklistAlert(true);
      return;
    }

    const newEvent = {
      type: 'RESUME',
      timestamp: new Date().toISOString()
    };
    
    const newEvents = [...events, newEvent];
    try {
      await ordersApi.update(orderId, {
        events: JSON.stringify(newEvents),
        updatedAt: new Date().toISOString()
      });
      setEvents(newEvents);
      setIsRunning(true);
      setShowErrors(false);
    } catch (e) {
      console.error("Error resuming task:", e);
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8 pb-24">
      {showErrors && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <AlertTriangle className="text-red-500 shrink-0" size={20} />
          <div>
            <p className="text-sm font-bold text-red-700">Faltam dados obrigatórios</p>
            <p className="text-xs text-red-600 mt-0.5 whitespace-pre-line">
              Por favor, complete as secções assinaladas a vermelho antes de terminar.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-industrial-blue-light font-mono text-xs font-bold uppercase tracking-widest mb-4 w-fit hover:text-safety-orange transition-colors"
        >
          <ArrowLeft size={14} />
          Voltar
        </button>
        <div className="flex justify-between items-start">
          <span className="font-mono text-xs font-bold text-industrial-blue-light uppercase tracking-wider">ID: {orderId.slice(0, 8)}</span>
          <span className="bg-slate-100 text-industrial-blue px-3 py-0.5 rounded font-mono text-[10px] font-bold border border-slate-200 uppercase tracking-widest">
            {order?.status === 'IN_PROGRESS' ? 'Em Curso' : order?.status || 'Pendente'}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-industrial-blue leading-tight">{order?.equipment || 'Carregando...'}</h1>
      </div>

      <ChecklistAlertModal 
        isOpen={showChecklistAlert} 
        onClose={() => setShowChecklistAlert(false)} 
      />

      {isReadOnly && (
        <div className="bg-green-50 border border-green-100 p-6 rounded-xl flex items-center gap-4 shadow-sm mb-4">
          <CheckCircle size={32} className="text-green-600" />
          <div>
            <h3 className="font-bold text-green-800">Tarefa Concluída</h3>
            <p className="text-sm text-green-700">Esta intervenção está arquivada e disponível apenas para consulta.</p>
          </div>
        </div>
      )}

      <section className={`bg-white border ${showErrors && !checklist.every(i => i.checked) ? 'border-red-500 ring-4 ring-red-50' : 'border-slate-200'} rounded-lg overflow-hidden shadow-sm transition-all duration-300`}>
        <div className="flex items-center gap-3 p-6 border-b border-slate-100">
          <AlertTriangle size={24} className={showErrors && !checklist.every(i => i.checked) ? 'text-red-500' : 'text-industrial-blue/20'} />
          <h2 className="text-xl font-bold text-industrial-blue uppercase tracking-tight">Checklist de Segurança</h2>
        </div>
        <div className="flex flex-col">
          {checklist.map((item) => (
            <label 
              key={item.id} 
              className={`flex items-start gap-4 p-5 transition-colors ${!isReadOnly ? 'cursor-pointer hover:bg-slate-50' : 'cursor-default'} border-b border-slate-100 last:border-b-0 ${item.checked ? 'bg-green-50/20' : ''}`}
            >
              <input 
                type="checkbox" 
                checked={item.checked}
                disabled={isReadOnly}
                onChange={() => {
                  if (isReadOnly) return;
                  setChecklist(prev => prev.map(i => i.id === item.id ? { ...i, checked: !i.checked } : i));
                  if (checklist.every(i => i.id === item.id ? !i.checked : i.checked)) setShowErrors(false);
                }}
                className={`mt-1 w-6 h-6 rounded border-slate-300 ${item.checked ? 'text-green-600' : showErrors ? 'text-red-500 ring-2 ring-red-100' : 'text-safety-orange'} focus:ring-safety-orange transition-all disabled:opacity-50`}
              />
              <span className={`text-base font-medium leading-relaxed ${item.checked ? 'text-slate-400 line-through' : 'text-industrial-blue'}`}>
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* Integrated Action Controls */}
      {!isReadOnly && (
        <section className="bg-slate-50 border border-slate-200 p-6 rounded-lg shadow-inner flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <span className="font-mono text-[10px] font-bold text-industrial-blue-light uppercase tracking-widest">Tempo de Execução</span>
            <div className={`text-3xl font-bold font-mono tracking-widest ${isRunning ? 'text-safety-orange animate-pulse' : 'text-industrial-blue'}`}>
              {formatTime(elapsedTime)}
            </div>
          </div>

          <div className="flex gap-3 w-full max-w-md">
            {order?.status === 'PENDING' ? (
              <button 
                onClick={handleStartTask}
                disabled={!checklist.every(item => item.checked)}
                className={`flex-1 h-12 rounded-lg font-bold font-mono uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95 ${
                  checklist.every(item => item.checked) 
                    ? 'bg-industrial-blue text-white shadow-industrial-blue/20' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                <Play size={18} className="fill-current" />
                Iniciar Tarefa
              </button>
            ) : (
              <>
                <button 
                  onClick={isRunning ? () => setShowPauseModal(true) : handleResumeTask}
                  disabled={!isRunning && !checklist.every(item => item.checked)}
                  className={`flex-1 h-12 rounded-lg font-bold font-mono uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 ${
                    isRunning 
                      ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                      : (checklist.every(item => item.checked) 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none')
                  }`}
                >
                  {isRunning ? (
                    <>
                      <Pause size={18} className="fill-current" />
                      Pausar
                    </>
                  ) : (
                    <>
                      <Play size={18} className="fill-current" />
                      Retomar
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </section>
      )}

      {/* Pause Reason Modal */}
      {showPauseModal && (
        <div className="fixed inset-0 bg-industrial-blue/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-industrial-blue uppercase text-sm tracking-tight">Motivo da Pausa</h3>
              <button onClick={() => setShowPauseModal(false)} className="text-slate-400 hover:text-industrial-blue"><X size={20} /></button>
            </div>
            <div className="p-6">
              <textarea 
                autoFocus
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm min-h-[120px] focus:border-safety-orange focus:ring-0 transition-all"
                placeholder="Ex: Falta de material, Intervalo de almoço, Aguarda autorização..."
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
              />
              <button 
                disabled={!pauseReason.trim()}
                onClick={handlePauseTask}
                className="w-full mt-4 bg-industrial-blue text-white h-12 rounded-xl font-bold uppercase tracking-widest text-xs disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                Confirmar Pausa
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="flex flex-col gap-4">
        <div className="flex justify-between items-center px-1">
          <h2 className={`font-mono text-xs font-bold ${showErrors && !materials.every(m => m.confirmed) ? 'text-red-500' : 'text-industrial-blue-light'} uppercase tracking-widest`}>Materiais Consumidos</h2>
          {!isReadOnly && (
            <button 
              onClick={() => setIsAddingMaterial(true)}
              className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-industrial-blue-light hover:text-safety-orange transition-colors"
            >
              <Plus size={14} />
              Adicionar Material
            </button>
          )}
        </div>

        {isAddingMaterial && (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-industrial-blue-light uppercase">Nome do Material</label>
                <input 
                  autoFocus
                  type="text"
                  placeholder="Ex: Óleo Hidráulico"
                  className="h-10 px-3 text-sm border border-slate-200 rounded focus:border-safety-orange focus:ring-0"
                  value={newMaterial.name}
                  onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-industrial-blue-light uppercase">Quantidade</label>
                <input 
                  type="text"
                  placeholder="Ex: 5L"
                  className="h-10 px-3 text-sm border border-slate-200 rounded focus:border-safety-orange focus:ring-0"
                  value={newMaterial.qty}
                  onChange={(e) => setNewMaterial({ ...newMaterial, qty: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleAddMaterial}
                className="flex-1 bg-industrial-blue text-white h-10 rounded text-xs font-bold uppercase tracking-wider hover:bg-industrial-blue-light transition-all"
              >
                Confirmar Adição
              </button>
              <button 
                onClick={() => setIsAddingMaterial(false)}
                className="px-4 border border-slate-200 text-industrial-blue-light h-10 rounded text-xs font-bold uppercase tracking-wider hover:bg-white transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className={`flex flex-col border ${showErrors && !materials.every(m => m.confirmed) ? 'border-red-500 ring-4 ring-red-50' : 'border-slate-200'} rounded-lg bg-white overflow-hidden shadow-sm transition-all duration-300`}>
          {materials.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs italic">Nenhum material adicionado</div>
          ) : materials.map((m) => (
            <div key={m.id} className={`flex justify-between items-center p-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors ${m.confirmed ? 'bg-green-50/10' : ''}`}>
              <div className="flex items-center gap-4 flex-1">
                <input 
                  type="checkbox" 
                  checked={m.confirmed}
                  disabled={isReadOnly}
                  onChange={() => {
                    if (isReadOnly) return;
                    setMaterials(prev => prev.map(i => i.id === m.id ? { ...i, confirmed: !i.confirmed } : i));
                    if (materials.every(i => i.id === m.id ? !i.confirmed : i.confirmed)) setShowErrors(false);
                  }}
                  className={`w-6 h-6 rounded border-slate-300 ${m.confirmed ? 'text-green-600' : showErrors ? 'text-red-500 ring-2 ring-red-100' : 'text-slate-300'} focus:ring-green-500 disabled:opacity-50`}
                />
                <div className="flex flex-col">
                  <span className={`text-sm font-bold ${m.confirmed ? 'text-slate-400 line-through' : 'text-industrial-blue'}`}>{m.name}</span>
                  <span className="font-mono text-[10px] text-industrial-blue-light uppercase">{m.sku} • {m.qty}</span>
                </div>
              </div>
              {!isReadOnly && (
                <button 
                  onClick={() => setMaterials(prev => prev.filter(i => i.id !== m.id))}
                  className="text-slate-300 hover:text-red-500 transition-colors p-2"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <label className={`font-mono text-xs font-bold ${showErrors && !notes.trim() ? 'text-red-500' : 'text-industrial-blue-light'} uppercase tracking-widest px-1`} htmlFor="notes">
          Observações & Notas *
        </label>
        <textarea 
          id="notes"
          readOnly={isReadOnly}
          className={`w-full bg-white border ${showErrors && !notes.trim() ? 'border-red-500 ring-4 ring-red-50' : 'border-slate-200'} rounded-lg p-5 min-h-[160px] text-base font-medium focus:border-safety-orange focus:ring-1 focus:ring-safety-orange transition-all placeholder:text-slate-300 ${isReadOnly ? 'bg-slate-50 text-slate-500' : ''}`}
          placeholder="Introduza descobertas, anomalias ou notas de procedimento padrão aqui..."
          value={notes}
          onChange={(e) => {
            if (isReadOnly) return;
            setNotes(e.target.value);
            if (e.target.value.trim()) setShowErrors(false);
          }}
        />
      </section>

      {/* Evidências Fotográficas Section */}
      <section className="flex flex-col gap-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="font-mono text-xs font-bold text-industrial-blue-light uppercase tracking-widest">Evidências Fotográficas</h2>
          {!isReadOnly && (
            <div className="flex gap-4">
              <button 
                onClick={startCamera}
                className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-industrial-blue-light hover:text-safety-orange transition-colors"
              >
                <Camera size={14} />
                Tirar Foto
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-industrial-blue-light hover:text-safety-orange transition-colors"
              >
                <Upload size={14} />
                Carregar Ficheiros
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple accept="image/*" className="hidden" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {photos.length === 0 ? (
            <div className="col-span-full py-12 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 italic text-xs">
              <ImageIcon size={32} strokeWidth={1.5} />
              Nenhuma evidência fotográfica adicionada
            </div>
          ) : (
            photos.map((photo, index) => (
              <div key={index} className="group relative aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-sm animate-in zoom-in-95 duration-200">
                <img src={photo} alt={`Evidência ${index + 1}`} className="w-full h-full object-cover" />
                {!isReadOnly && (
                  <button 
                    onClick={() => setPhotos(prev => prev.filter((_, i) => i !== index))}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <X size={14} />
                  </button>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-[10px] text-white font-bold uppercase truncate">EVD-{index + 1}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Camera Capture Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black z-[110] flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl">
            <button onClick={stopCamera} className="absolute top-4 right-4 z-20 p-3 bg-white/10 text-white rounded-full"><X size={24} /></button>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover aspect-video" />
            <div className="p-8 flex justify-center"><button onClick={capturePhoto} className="w-16 h-16 bg-white rounded-full border-4 border-slate-700 active:scale-95 transition-all" /></div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {!isReadOnly && (
        <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-md border-t border-slate-200 p-6 z-40 flex justify-center">
          <button 
            onClick={handleComplete}
            className="w-full max-w-3xl btn-primary h-14 text-xl font-bold uppercase tracking-widest shadow-lg shadow-safety-orange/20 translate-y-0 active:translate-y-0.5 hover:-translate-y-0.5"
          >
            <CheckCircle size={24} className="fill-white/10" />
            Concluir Tarefa
          </button>
        </div>
      )}
    </div>
  );
}

function ChecklistAlertModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-industrial-blue/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 flex flex-col items-center text-center gap-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600">
            <AlertTriangle size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-industrial-blue uppercase tracking-tight">Falha de Segurança</h3>
            <p className="text-slate-500 mt-2 text-sm leading-relaxed">
              Checklist de Segurança não preenchido. É obrigatório verificar todos os pontos antes de iniciar ou retomar o trabalho.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-full bg-industrial-blue text-white h-12 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-industrial-blue/20 transition-all active:scale-[0.98]"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
