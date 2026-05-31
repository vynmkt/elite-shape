import React from 'react';
import { motion } from 'motion/react';
import { User, LogOut, Dumbbell, Utensils, UserCircle, BrainCircuit, MessageSquare, Crown, Shield, Trophy, LayoutDashboard, Target, HelpCircle, X, Info, Users } from 'lucide-react';
import { AnimatePresence } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
  onLogout: () => void;
}

export default function Layout({ children, activeTab, setActiveTab, user, onLogout }: LayoutProps) {
  const [showHelp, setShowHelp] = React.useState(false);
  const isEn = user?.language === 'en';

  const navItems = [
    { id: 'coach', label: isEn ? 'Body Analysis' : 'Análise Corporal', icon: BrainCircuit },
    { id: 'chat', label: isEn ? 'Coach Chat' : 'Coach Especialista', icon: MessageSquare },
    { id: 'training', label: isEn ? 'Training' : 'Treino', icon: Dumbbell },
    { id: 'nutrition', label: isEn ? 'Nutrition' : 'Nutrição', icon: Utensils },
    { id: 'ranking', label: isEn ? 'Ranking' : 'Ranking Elite', icon: Trophy },
    { id: 'profile', label: isEn ? 'Profile' : 'Perfil', icon: UserCircle },
  ];

  if (user?.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Admin', icon: Shield });
  }

  const helpContent: Record<string, { title: string, steps: string[] }> = {
    dashboard: {
      title: isEn ? 'How to use the Dashboard' : 'Como usar o Painel',
      steps: [
        isEn ? 'See your daily progress and missions.' : 'Veja seu progresso diário e missões.',
        isEn ? 'Complete missions to earn points.' : 'Complete as missões para ganhar pontos.',
        isEn ? 'Track your weight and consistency.' : 'Acompanhe seu peso e consistência.'
      ]
    },
    coach: {
      title: isEn ? 'How to use Body Analysis' : 'Como usar a Análise Corporal',
      steps: [
        isEn ? 'Upload a photo or video of your body.' : 'Envie uma foto ou vídeo do seu corpo.',
        isEn ? 'Wait for the AI to analyze your shape.' : 'Aguarde a IA analisar seu shape.',
        isEn ? 'Receive a personalized training and diet plan.' : 'Receba um plano de treino e dieta personalizado.'
      ]
    },
    training: {
      title: isEn ? 'How to use Training' : 'Como usar o Treino',
      steps: [
        isEn ? 'Follow the daily exercise sequence.' : 'Siga a sequência de exercícios do dia.',
        isEn ? 'Watch the GIFs to learn the correct form.' : 'Veja os GIFs para aprender a execução correta.',
        isEn ? 'Log your weights to track progress.' : 'Registre suas cargas para acompanhar a evolução.'
      ]
    },
    nutrition: {
      title: isEn ? 'How to use Nutrition' : 'Como usar a Nutrição',
      steps: [
        isEn ? 'Log what you eat by typing naturally.' : 'Registre o que comeu digitando naturalmente.',
        isEn ? 'Track your daily calories and macros.' : 'Acompanhe suas calorias e macros diários.',
        isEn ? 'Log your water intake to stay hydrated.' : 'Registre seu consumo de água para se manter hidratado.'
      ]
    },
    profile: {
      title: isEn ? 'How to use Profile' : 'Como usar o Perfil',
      steps: [
        isEn ? 'Keep your data updated for better AI results.' : 'Mantenha seus dados atualizados para melhores resultados da IA.',
        isEn ? 'See your visual evolution over time.' : 'Veja sua evolução visual ao longo do tempo.',
        isEn ? 'Change app settings like language and theme.' : 'Altere configurações como idioma e tema.'
      ]
    }
  };

  return (
    <div className="min-h-screen bg-brand-black flex flex-col md:flex-row">
      {/* Sidebar */}
      <nav className="w-full md:w-64 bg-white/5 border-b md:border-b-0 md:border-r border-white/10 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-brand-red rounded-lg flex items-center justify-center">
              <Dumbbell className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-display font-bold tracking-tighter">
              PERSON<span className="text-brand-red">AI</span>
            </h1>
          </div>

          <div className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === item.id
                    ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 space-y-4">
          {user && !user.is_premium && (
            <div className="p-4 bg-gradient-to-br from-brand-red/20 to-transparent border border-brand-red/30 rounded-2xl">
              <div className="flex items-center gap-2 text-brand-red mb-2">
                <Crown size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Upgrade</span>
              </div>
              <p className="text-xs text-white/60 mb-3">
                {isEn ? 'Unlock photo/video analysis and exclusive recipes.' : 'Libere análise de fotos, vídeos e receitas exclusivas.'}
              </p>
              <button 
                onClick={() => setActiveTab('upgrade')}
                className="w-full py-2 bg-brand-red text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-all"
              >
                {isEn ? 'SUBSCRIBE $9.90' : 'ASSINAR R$ 49,90'}
              </button>
            </div>
          )}

          <div className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-xl">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-white/60" />
              </div>
              <div className="truncate">
                <p className="text-sm font-bold truncate">{user?.name || (isEn ? 'Athlete' : 'Atleta')}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">
                  {user?.is_premium ? 'Premium' : 'Free'}
                </p>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="text-white/40 hover:text-brand-red transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 relative">
        <button 
          onClick={() => setShowHelp(true)}
          className="fixed bottom-6 right-6 md:bottom-10 md:right-10 h-12 px-4 bg-brand-red text-white rounded-full shadow-2xl shadow-brand-red/40 flex items-center gap-2 z-50 hover:scale-105 transition-transform"
          title={isEn ? 'Help' : 'Ajuda'}
        >
          <HelpCircle size={20} />
          <span className="text-xs font-bold uppercase tracking-widest">{isEn ? 'Help' : 'Ajuda'}</span>
        </button>

        <AnimatePresence>
          {showHelp && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass-card max-w-md w-full p-8 relative"
              >
                <button 
                  onClick={() => setShowHelp(false)}
                  className="absolute top-4 right-4 text-white/40 hover:text-white"
                >
                  <X size={24} />
                </button>

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-brand-red/10 rounded-lg flex items-center justify-center text-brand-red">
                    <Info size={24} />
                  </div>
                  <h3 className="text-xl font-bold">{helpContent[activeTab]?.title || (isEn ? 'Help' : 'Ajuda')}</h3>
                </div>

                <div className="space-y-4">
                  {helpContent[activeTab]?.steps.map((step, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-6 h-6 rounded-full bg-brand-red/20 text-brand-red flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-white/60 text-sm leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => setShowHelp(false)}
                  className="w-full btn-primary mt-8 py-3 font-bold"
                >
                  {isEn ? 'GOT IT!' : 'ENTENDI!'}
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-5xl mx-auto"
        >
          {children}

          <footer className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 pb-10">
            <div className="flex items-center gap-3 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center">
                <Dumbbell size={16} />
              </div>
              <span className="font-display font-bold tracking-tighter text-sm uppercase">Elite Gym <span className="text-brand-red">AI</span></span>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <p className="text-[10px] text-white/20 font-medium text-center max-w-md">
                {isEn 
                  ? 'Disclaimer: AI analyzes are approximate. Always consult health professionals before starting any diet or training protocol.' 
                  : 'Aviso: As análises da IA são aproximadas. Sempre consulte profissionais de saúde antes de iniciar qualquer dieta ou protocolo de treino.'}
              </p>
              <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-white/20">
                <a href="#" className="hover:text-brand-red transition-colors">{isEn ? 'Terms of Use' : 'Termos de Uso'}</a>
                <a href="#" className="hover:text-brand-red transition-colors">{isEn ? 'Privacy Policy' : 'Privacidade'}</a>
              </div>
              <p className="text-[10px] text-white/10 font-medium">
                &copy; {new Date().getFullYear()} ELITE GYM AI. {isEn ? 'All rights reserved.' : 'Todos os direitos reservados.'}
              </p>
            </div>
          </footer>
        </motion.div>
      </main>
    </div>
  );
}
