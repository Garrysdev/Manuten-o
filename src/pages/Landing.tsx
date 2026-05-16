import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Shield, BarChart3, Clock, ChevronRight, Factory } from 'lucide-react';
import { motion } from 'motion/react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      {/* Header */}
      <nav className="flex justify-between items-center px-6 md:px-12 py-6 bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-industrial-blue rounded-lg flex items-center justify-center text-white">
            <Factory size={20} />
          </div>
          <span className="text-xl font-bold text-industrial-blue">RG Maintenance</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-sm font-semibold text-industrial-blue hover:text-safety-orange transition-colors">
            Entrar
          </Link>
          <Link to="/login" className="bg-industrial-blue text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-industrial-blue/90 transition-all">
            Começar Agora
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-24 px-6 md:px-12 flex flex-col items-center text-center overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-safety-orange via-transparent to-transparent" />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-4xl"
        >
          <span className="inline-block py-1.5 px-4 rounded-full bg-safety-orange/10 text-safety-orange text-xs font-bold uppercase tracking-widest mb-6">
            Gestão de Manutenção Industrial 4.0
          </span>
          <h1 className="text-5xl md:text-7xl font-bold text-industrial-blue mb-8 tracking-tight">
            Mantenha a sua fábrica em <span className="text-safety-orange">movimento contínuo.</span>
          </h1>
          <p className="text-lg md:text-xl text-industrial-blue-light mb-12 max-w-2xl mx-auto leading-relaxed">
            Plataforma centralizada para gestão de ordens de serviço, diário de manutenção e análise de performance em tempo real.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/login" className="w-full sm:w-auto bg-safety-orange text-white px-8 py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-2 hover:bg-safety-orange-dark shadow-lg shadow-safety-orange/20 transition-all">
              Começar Grátis
              <ChevronRight size={20} />
            </Link>
            <a href="#features" className="w-full sm:w-auto px-8 py-4 text-industrial-blue font-bold hover:bg-slate-100 rounded-xl transition-all">
              Saber Mais
            </a>
          </div>
        </motion.div>

        {/* Floating Mockup Preview */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-20 w-full max-w-5xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden bg-white"
        >
          <img 
            src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=2000" 
            alt="Dashboard Preview" 
            className="w-full h-auto grayscale opacity-90"
          />
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-industrial-blue mb-4">Funcionalidades Essenciais</h2>
            <p className="text-industrial-blue-light max-w-2xl mx-auto">Tudo o que precisa para otimizar o ciclo de vida dos seus ativos industriais.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Wrench className="text-safety-orange" />}
              title="Gestão de Ordens"
              description="Submeta e acompanhe ordens de serviço com prioridade e atribuição automática a técnicos."
            />
            <FeatureCard 
              icon={<BarChart3 className="text-safety-orange" />}
              title="Métricas em Tempo Real"
              description="Visualize o tempo médio de reparação e a disponibilidade dos técnicos num dashboard intuitivo."
            />
            <FeatureCard 
              icon={<Clock className="text-safety-orange" />}
              title="Diário de Manutenção"
              description="Registo histórico exaustivo de cada intervenção, materiais consumidos e notas técnicas."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-5xl mx-auto bg-industrial-blue rounded-3xl p-12 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-safety-orange/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <h2 className="text-3xl md:text-5xl font-bold mb-6 relative z-10">Pronto para digitalizar a sua manutenção?</h2>
          <p className="text-slate-300 mb-10 text-lg max-w-2xl mx-auto relative z-10">Junte-se a centenas de fábricas que já utilizam a RG Maintenance para reduzir o tempo de paragem.</p>
          <Link to="/login" className="inline-flex bg-white text-industrial-blue px-8 py-4 rounded-xl text-lg font-bold hover:bg-slate-100 transition-all relative z-10">
            Criar Conta Grátis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 text-center text-industrial-blue-light text-sm font-medium">
        <p>© 2024 RG Maintenance Systems. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl transition-all duration-300">
      <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-industrial-blue mb-3">{title}</h3>
      <p className="text-industrial-blue-light leading-relaxed">{description}</p>
    </div>
  );
}
