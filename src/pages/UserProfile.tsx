import React, { useState, useEffect, useRef } from 'react';
import { 
  User as UserIcon, 
  Mail, 
  MapPin, 
  Calendar as CalendarIcon, 
  AlertTriangle, 
  ArrowRight, 
  Camera, 
  Save, 
  X, 
  Edit2, 
  Upload, 
  RefreshCw 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../lib/api';

export default function UserProfile({ 
  onUserUpdate 
}: { 
  onUserUpdate?: (user: any) => void
}) {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const navigate = useNavigate();

  const optimizeImage = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
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
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = dataUrl;
    });
  };

  const [editForm, setEditForm] = useState({
    name: '',
    displayName: '',
    email: '',
    avatar: '',
    location: '',
    avatar_pos: '50% 50%'
  });
  const [saving, setSaving] = useState(false);
  const [adjustingPos, setAdjustingPos] = useState(false);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const missing = [];
    if (!editForm.name.trim()) missing.push('Nome Completo');
    if (!editForm.displayName.trim()) missing.push('Nome de Exibição');
    if (!editForm.email.trim()) missing.push('Email');
    if (!editForm.location.trim()) missing.push('Localização Operacional');
    if (!editForm.avatar) missing.push('Foto de Perfil');

    if (missing.length > 0) {
      alert(`Para concluir o seu perfil, por favor preencha:\n- ${missing.join('\n- ')}`);
      return;
    }

    setSaving(true);
    try {
      const updated = await authApi.updateProfile({
        ...editForm,
        profile_initialized: 1
      });
      setUserData({ ...userData, ...updated });
      if (onUserUpdate) onUserUpdate(updated);
      setIsEditing(false);
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handlePosChange = (e: React.ChangeEvent<HTMLInputElement>, dimension: 'x' | 'y') => {
    const currentPos = editForm.avatar_pos || '50% 50%';
    const parts = currentPos.split(' ');
    let x = parts[0] ? parts[0].replace('%', '') : '50';
    let y = parts[1] ? parts[1].replace('%', '') : '50';
    
    if (dimension === 'x') {
      x = e.target.value;
    } else {
      y = e.target.value;
    }
    
    setEditForm({ ...editForm, avatar_pos: `${x}% ${y}%` });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const optimized = await optimizeImage(reader.result as string);
        setEditForm(prev => ({ ...prev, avatar: optimized }));
        setShowPhotoOptions(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setCameraStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
      setShowCamera(true);
      setShowPhotoOptions(false);
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
        setEditForm(prev => ({ ...prev, avatar: optimized }));
        stopCamera();
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const me = await authApi.me();
        setUserData(me);
        setEditForm({
          name: me.name || '',
          displayName: me.displayName || '',
          email: me.email || '',
          avatar: me.avatar || '',
          location: me.location || '',
          avatar_pos: me.avatar_pos || '50% 50%'
        });
        
        if (me.profile_initialized === 0) {
          setIsEditing(true);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-industrial-blue"></div>
    </div>
  );

  const data = userData || {};

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Welcome Message for New Users */}
      {data.profile_initialized === 0 && (
        <div className="bg-safety-orange/10 border border-safety-orange/20 p-6 rounded-2xl flex items-start gap-4">
          <AlertTriangle className="text-safety-orange shrink-0" size={24} />
          <div>
            <h3 className="font-bold text-industrial-blue">Bem-vindo ao Sistema de Manutenção</h3>
            <p className="text-sm text-industrial-blue/70 mt-1">
              Como este é o seu primeiro acesso, é obrigatório preencher os seus dados de perfil para continuar.
            </p>
          </div>
        </div>
      )}

      {/* Photo Options Modal */}
      {showPhotoOptions && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-industrial-blue">Alterar Foto</h3>
              <button onClick={() => setShowPhotoOptions(false)}><X size={20} /></button>
            </div>
            <div className="p-2 space-y-1">
              <button onClick={startCamera} className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 rounded-xl transition-all">
                <Camera size={18} className="text-industrial-blue" />
                <div className="text-left">
                  <p className="text-sm font-bold text-industrial-blue">Tirar Foto</p>
                  <p className="text-[10px] text-slate-400">Usar a câmara</p>
                </div>
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 rounded-xl transition-all">
                <Upload size={18} className="text-industrial-blue" />
                <div className="text-left">
                  <p className="text-sm font-bold text-industrial-blue">Carregar Ficheiro</p>
                  <p className="text-[10px] text-slate-400">Escolher na galeria</p>
                </div>
              </button>
              <button onClick={() => { setAdjustingPos(!adjustingPos); setShowPhotoOptions(false); }} className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 rounded-xl transition-all">
                <RefreshCw size={18} className="text-industrial-blue" />
                <div className="text-left">
                  <p className="text-sm font-bold text-industrial-blue">Ajustar Enquadramento</p>
                  <p className="text-[10px] text-slate-400">Centrar imagem</p>
                </div>
              </button>
              <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
            </div>
          </div>
        </div>
      )}

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

      {/* Header Profile Info */}
      <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10 text-center md:text-left">
          <div className="relative">
            <div className="h-32 w-32 rounded-2xl bg-industrial-blue text-white flex items-center justify-center font-bold text-4xl shadow-xl overflow-hidden relative group/avatar">
              {editForm.avatar ? (
                <img 
                  src={editForm.avatar} 
                  alt="Avatar" 
                  className="w-full h-full object-cover transition-all duration-75" 
                  style={{ objectPosition: editForm.avatar_pos }} 
                />
              ) : (
                data.name?.split(' ')[0][0] || 'U'
              )}
              {isEditing && !adjustingPos && (
                <button 
                  type="button"
                  onClick={() => setShowPhotoOptions(true)} 
                  className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center transition-colors group"
                >
                  <Camera size={24} className="group-hover:scale-110 transition-transform" />
                </button>
              )}
              {isEditing && adjustingPos && (
                <div className="absolute inset-0 bg-industrial-blue/20 pointer-events-none border-2 border-white/50 border-dashed rounded-2xl" />
              )}
            </div>
            {isEditing && adjustingPos && (
              <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 bg-white border border-slate-200 p-4 shadow-xl z-50 flex flex-col gap-3 w-48 rounded-2xl animate-in zoom-in-95 duration-200">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span>Horizontal</span>
                    <span>{editForm.avatar_pos.split(' ')[0]}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={parseInt(editForm.avatar_pos.split(' ')[0] || '50')} 
                    onChange={(e) => handlePosChange(e, 'x')} 
                    className="w-full accent-safety-orange h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer" 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span>Vertical</span>
                    <span>{editForm.avatar_pos.split(' ')[1]}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={parseInt(editForm.avatar_pos.split(' ')[1] || '50')} 
                    onChange={(e) => handlePosChange(e, 'y')} 
                    className="w-full accent-safety-orange h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer" 
                  />
                </div>
                <button 
                  type="button"
                  onClick={() => setAdjustingPos(false)} 
                  className="w-full py-2 bg-industrial-blue text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-industrial-blue-light transition-all shadow-sm"
                >
                  Confirmar Enquadramento
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 w-full">
            {!isEditing ? (
              <>
                <div className="flex flex-col sm:flex-row items-center md:justify-start gap-4 mb-4">
                  <h1 className="text-3xl font-bold text-industrial-blue">{data.name}</h1>
                  <span className="px-3 py-1 bg-industrial-blue/5 text-industrial-blue text-xs font-bold uppercase rounded-full border">{data.role}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoItem icon={<Mail size={16} />} text={data.email} />
                  <InfoItem icon={<MapPin size={16} />} text={data.location || 'Terminal Central'} />
                  <InfoItem icon={<UserIcon size={16} />} text={data.displayName || data.name} />
                  <InfoItem icon={<CalendarIcon size={16} />} text={`Desde: ${new Date(data.joined).toLocaleDateString()}`} />
                </div>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={() => navigate('/')} 
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-industrial-blue text-white rounded-xl font-bold hover:bg-industrial-blue-light transition-all shadow-lg shadow-industrial-blue/20"
                  >
                    Ir para Dashboard <ArrowRight size={18} />
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleEditSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome Completo *</label>
                  <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className={`h-11 px-4 bg-slate-50 border ${!editForm.name.trim() ? 'border-red-200 focus:border-red-500' : 'border-slate-200'} rounded-xl text-sm transition-all focus:bg-white`} placeholder="Nome" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome de Exibição *</label>
                  <input type="text" value={editForm.displayName} onChange={e => setEditForm({...editForm, displayName: e.target.value})} className={`h-11 px-4 bg-slate-50 border ${!editForm.displayName.trim() ? 'border-red-200 focus:border-red-500' : 'border-slate-200'} rounded-xl text-sm transition-all focus:bg-white`} placeholder="Nome Exibição" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Email Profissional *</label>
                  <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className={`h-11 px-4 bg-slate-50 border ${!editForm.email.trim() ? 'border-red-200 focus:border-red-500' : 'border-slate-200'} rounded-xl text-sm transition-all focus:bg-white`} placeholder="Email" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Unidade/Localização *</label>
                  <input type="text" value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} className={`h-11 px-4 bg-slate-50 border ${!editForm.location.trim() ? 'border-red-200 focus:border-red-500' : 'border-slate-200'} rounded-xl text-sm transition-all focus:bg-white`} placeholder="Localização" />
                </div>
                <div className="sm:col-span-2 flex gap-3 pt-4">
                  <button type="submit" disabled={saving} className="flex-[2] bg-industrial-blue text-white h-12 rounded-xl font-bold uppercase text-xs tracking-wider shadow-md hover:bg-industrial-blue-light disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                    {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'A Guardar...' : 'Guardar Perfil'}
                  </button>
                  <button type="button" onClick={() => { setIsEditing(false); setAdjustingPos(false); }} className="flex-1 border border-slate-200 h-12 rounded-xl font-bold uppercase text-xs text-slate-500 hover:bg-slate-50">Cancelar</button>
                </div>
              </form>
            )}
          </div>
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-50 border text-industrial-blue rounded-lg text-xs font-bold hover:bg-slate-100 transition-all"><Edit2 size={14} /> Editar</button>
          )}
        </div>
      </section>
    </div>
  );
}

function InfoItem({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="flex items-center gap-2 text-industrial-blue-light font-medium text-sm">
      <span className="text-industrial-blue/40">{icon}</span>
      <span className="truncate">{text || 'Não definido'}</span>
    </div>
  );
}
