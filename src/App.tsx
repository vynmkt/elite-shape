// v2.0.1 - OpenAI only build
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dumbbell, Mail, Lock, User, ArrowRight, Loader2, AlertCircle, Crown, Trophy, Eye, EyeOff, Sun, Moon, Globe, Camera, TrendingUp, CheckCircle2, HelpCircle, BrainCircuit, Utensils, MessageSquare, ChevronRight } from 'lucide-react';
import Layout from './components/Layout';
import AICoach from './components/AICoach';
import Profile from './components/Profile';
import Training from './components/Training';
import Nutrition from './components/Nutrition';
import Ranking from './components/Ranking';
import AdminPanel from './components/AdminPanel';
import Challenge from './components/Challenge';
import Community from './components/Community';
import { User as UserType, Profile as ProfileType, Plans } from './types';

const API_URL = '/api';

export default function App() {
  const [user, setUser] = useState<UserType | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [activeTab, setActiveTab] = useState('coach');
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authData, setAuthData] = useState({ email: '', password: '', name: '' });
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const defaultProfile: ProfileType = {
    age: 0, height: 0, weight: 0, fat_percentage: 0,
    gender: 'male', activity_level: 'moderate', personality_mode: 'motivational',
    training_level: 'beginner',
    training_time: '', routine: '', sleep: '',
    current_diet: '', financial_condition: '', objective: '',
    wants_supplements: false
  };

  const [profile, setProfile] = useState<ProfileType>(defaultProfile);
  const [plans, setPlans] = useState<Plans>({
    training_plan: null, nutrition_plan: null, last_analysis: null,
    target_calories: null, target_protein: null, target_carbs: null, target_fat: null
  });

  useEffect(() => {
    const handleError = (event: ErrorEvent | Event) => {
      if (token) {
        try {
          let message = 'Unknown error';
          if ('message' in event) {
            message = typeof event.message === 'string' ? event.message : String(event.message);
          }
          const stack = 'error' in event && event.error ? String(event.error.stack) : undefined;
          
          // Avoid serializing DOM elements or events
          if (event.target instanceof HTMLElement) return;

          fetch(`${API_URL}/logs/error`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ message, stack, context: { url: window.location.href } })
          });
        } catch (e) {
          console.error('Failed to log error', e);
        }
      }
    };
    window.addEventListener('error', handleError, true);
    return () => window.removeEventListener('error', handleError, true);
  }, [token]);

  useEffect(() => {
    const theme = user?.theme || 'dark';
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);
  }, [user?.theme]);

  useEffect(() => {
    if (token) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUserData = async () => {
    try {
      const [profileRes, plansRes] = await Promise.all([
        fetch(`${API_URL}/profile`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/plans`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (profileRes.ok && plansRes.ok) {
        const profileData = await profileRes.json();
        const plansData = await plansRes.json();
        
        setProfile({ ...defaultProfile, ...profileData });
        setPlans(plansData);
        setUser({ 
          id: profileData.user_id || user?.id, 
          email: user?.email || '', 
          name: profileData.name || user?.name, 
          is_premium: profileData.is_premium ?? user?.is_premium,
          role: profileData.role || user?.role || 'user',
          points: profileData.points ?? user?.points ?? 0,
          streak: profileData.streak ?? 0,
          level: profileData.level || 'Frango',
          theme: profileData.theme || user?.theme || 'dark',
          language: profileData.language || user?.language || 'pt'
        });
      } else if (profileRes.status === 401) {
        handleLogout();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    try {
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/signup';
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authData)
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser({
          ...data.user,
          role: data.user.role || 'user',
          points: data.user.points || 0
        });
      } else {
        setAuthError(data.error);
      }
    } catch (e) {
      setAuthError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const saveProfile = async (data: ProfileType) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/profile`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setProfile(data);
        alert("Perfil salvo com sucesso!");
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar perfil.");
    } finally {
      setLoading(false);
    }
  };

  const updatePlans = async (training: string, nutrition: string, analysis: string, targets?: any, schedule?: any, nutrition_schedule?: any) => {
    const newPlans = { 
      training_plan: training, 
      nutrition_plan: nutrition, 
      last_analysis: analysis,
      target_calories: targets?.calories || null,
      target_protein: targets?.protein || null,
      target_carbs: targets?.carbs || null,
      target_fat: targets?.fat || null,
      training_schedule: schedule ? (typeof schedule === 'string' ? schedule : JSON.stringify(schedule)) : null,
      nutrition_schedule: nutrition_schedule ? (typeof nutrition_schedule === 'string' ? nutrition_schedule : JSON.stringify(nutrition_schedule)) : null
    };
    try {
      await fetch(`${API_URL}/plans`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newPlans)
      });
      setPlans(newPlans);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleTheme = async () => {
    if (!user) return;
    const newTheme = user.theme === 'dark' ? 'light' : 'dark';
    setUser({ ...user, theme: newTheme });
    await fetch(`${API_URL}/user/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ theme: newTheme, language: user.language })
    });
  };

  const toggleLanguage = async () => {
    if (!user) return;
    const newLang = user.language === 'pt' ? 'en' : 'pt';
    setUser({ ...user, language: newLang });
    await fetch(`${API_URL}/user/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ theme: user.theme, language: newLang })
    });
  };

  const handleUpgrade = async () => {
    try {
      const res = await fetch(`${API_URL}/upgrade`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setUser(prev => prev ? { ...prev, is_premium: true } : null);
        alert("Parabéns! Você agora é PREMIUM.");
        setActiveTab('coach');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateProfile = (data: Partial<ProfileType>) => {
    const newProfile = { ...profile, ...data };
    setProfile(newProfile);
    saveProfile(newProfile);
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-red" size={48} />
      </div>
    );
  }

  const isProfileComplete = profile.age > 0 && profile.height > 0 && profile.weight > 0 && profile.objective !== '';

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-red/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px]" />
        </div>

        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-0 glass-card overflow-hidden border-white/10 shadow-2xl relative z-10 transition-all duration-500">
          {/* Left Side: Branding & Benefits */}
          <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-brand-red to-red-900 text-white relative">
            <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070')] bg-cover bg-center grayscale" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                  <Dumbbell className="text-brand-red" size={28} />
                </div>
                <h1 className="text-2xl font-display font-black tracking-tighter">ELITE COACH <span className="block text-xs font-bold tracking-[0.3em] opacity-80">PERFORMANCE AI</span></h1>
              </div>

              <div className="space-y-6">
                <h2 className="text-4xl font-display font-bold leading-tight">TRANSFORME SEU <br/><span className="text-black/30 text-stroke">SHAPE EM 90 DIAS</span></h2>
                <ul className="space-y-4">
                  {[
                    { icon: BrainCircuit, text: 'Análise de Shape por Visão Computacional' },
                    { icon: Utensils, text: 'Planos de Dieta Adaptativa e Inteligente' },
                    { icon: MessageSquare, text: 'Chat Direto com Mentor de Elite' },
                    { icon: Crown, text: 'Protocolos de Atletas Profissionais' }
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-medium">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                        <item.icon size={14} />
                      </div>
                      {item.text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="relative z-10 pt-8 border-t border-white/20">
              <p className="text-xs font-bold uppercase tracking-widest opacity-60">Junte-se a +5.000 atletas de elite</p>
            </div>
          </div>

          {/* Right Side: Auth Form */}
          <div className="p-8 md:p-12 bg-zinc-950/50 backdrop-blur-xl">
            <div className="mb-10 text-center md:text-left">
              <h3 className="text-3xl font-display font-bold mb-2">
                {authMode === 'login' ? 'Bem-vindo de Volta' : 'Inicie sua Jornada'}
              </h3>
              <p className="text-white/40 text-sm">
                {authMode === 'login' 
                  ? 'Acesse sua central de comando para evoluir hoje.' 
                  : 'Crie sua conta e receba seu primeiro plano de elite.'}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-5">
              {authMode === 'signup' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Nome Completo</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User size={18} className="text-white/20 group-focus-within:text-brand-red transition-colors" />
                    </div>
                    <input 
                      type="text" 
                      required
                      value={authData.name}
                      onChange={(e) => setAuthData({ ...authData, name: e.target.value })}
                      className="input-field w-full !pl-14 bg-white/5 border-white/10 hover:border-white/20 transition-all py-4 rounded-xl" 
                      placeholder="Ex: Christian Thibaudeau"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">E-mail ou Usuário</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={18} className="text-white/20 group-focus-within:text-brand-red transition-colors" />
                  </div>
                  <input 
                    type="email" 
                    required
                    value={authData.email}
                    onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                    className="input-field w-full !pl-14 bg-white/5 border-white/10 hover:border-white/20 transition-all py-4 rounded-xl" 
                    placeholder="atleta@elite.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Senha de Acesso</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className="text-white/20 group-focus-within:text-brand-red transition-colors" />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={authData.password}
                    onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                    className="input-field w-full !pl-14 pr-12 bg-white/5 border-white/10 hover:border-white/20 transition-all py-4 rounded-xl" 
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {authError && (
                <p className="text-xs font-bold text-brand-red bg-brand-red/10 p-3 rounded-lg flex items-center gap-2">
                  <AlertCircle size={14} /> {authError}
                </p>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full btn-primary py-4 rounded-xl shadow-xl shadow-brand-red/20 font-display font-black text-lg mt-4 flex items-center justify-center gap-3 active:scale-95 transition-transform"
              >
                {loading ? <Loader2 className="animate-spin" /> : (authMode === 'login' ? 'ENTRAR NA CENTRAL' : 'CRIAR CONTA ELITE')}
                <ArrowRight size={20} />
              </button>

              <p className="text-center text-xs text-white/40 mt-6">
                {authMode === 'login' ? 'Novo por aqui?' : 'Já possui conta?'}
                <button 
                  type="button"
                  onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  className="ml-2 text-brand-red font-black hover:underline uppercase tracking-widest"
                >
                  {authMode === 'login' ? 'Cadastre-se' : 'Fazer Login'}
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      user={user} 
      onLogout={handleLogout}
    >
      <AnimatePresence mode="wait">
        {!isProfileComplete && activeTab !== 'profile' ? (
          <motion.div 
            key="onboarding"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto py-10 px-6 space-y-12"
          >
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-brand-red rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-brand-red/20 rotate-3">
                <Dumbbell className="text-white" size={40} />
              </div>
              <h2 className="text-4xl font-display font-bold tracking-tighter">BEM-VINDO AO <span className="text-brand-red">PERSONAI</span></h2>
              <p className="text-white/40 text-lg max-w-md mx-auto">
                Siga os passos abaixo para transformar seu corpo com inteligência artificial.
              </p>
            </div>

            <div className="grid gap-4">
              {[
                { step: 1, title: 'Complete seu Perfil', desc: 'Diga-nos sua idade, peso e objetivo.', icon: <User size={20} />, done: profile.age > 0 },
                { step: 2, title: 'Análise do Coach', desc: 'Envie uma foto ou vídeo para a IA analisar seu shape.', icon: <Camera size={20} />, done: !!plans.last_analysis },
                { step: 3, title: 'Siga o Plano', desc: 'Receba seu treino e dieta personalizados.', icon: <TrendingUp size={20} />, done: !!plans.training_plan },
              ].map((s) => (
                <div key={s.step} className={`glass-card p-6 flex items-center gap-6 border-l-4 ${s.done ? 'border-emerald-500 bg-emerald-500/5' : 'border-brand-red bg-white/5'}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${s.done ? 'bg-emerald-500 text-white' : 'bg-brand-red/20 text-brand-red'}`}>
                    {s.done ? <CheckCircle2 size={24} /> : s.step}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-lg">{s.title}</h4>
                    <p className="text-sm text-white/40">{s.desc}</p>
                  </div>
                  {!s.done && s.step === 1 && (
                    <ArrowRight className="text-brand-red animate-pulse" />
                  )}
                </div>
              ))}
            </div>

            <button 
              onClick={() => setActiveTab('profile')}
              className="w-full btn-primary py-5 text-xl font-display font-bold flex items-center justify-center gap-3 shadow-2xl shadow-brand-red/20"
            >
              COMEÇAR AGORA
              <ArrowRight size={24} />
            </button>

            <div className="pt-8 border-t border-white/5 text-center">
              <p className="text-white/20 text-xs font-bold uppercase tracking-widest mb-4">Dúvidas?</p>
              <div className="flex justify-center gap-8">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                    <HelpCircle size={20} />
                  </div>
                  <span className="text-[10px] text-white/40 font-bold">BOTÃO DE AJUDA</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                    <User size={20} />
                  </div>
                  <span className="text-[10px] text-white/40 font-bold">MENU LATERAL</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            {activeTab === 'coach' && (
              <AICoach 
                key="coach" 
                user={user} 
                profile={profile} 
                onUpdatePlans={updatePlans} 
                onUpdateProfile={updateProfile}
                mode="analysis"
              />
            )}
            {activeTab === 'chat' && (
              <AICoach 
                key="chat" 
                user={user} 
                profile={profile} 
                onUpdatePlans={updatePlans} 
                onUpdateProfile={updateProfile}
                mode="chat"
              />
            )}
            {activeTab === 'training' && (
              <Training key="training" plan={plans.training_plan} schedule={plans.training_schedule} user={user} />
            )}
            {activeTab === 'nutrition' && (
              <Nutrition key="nutrition" plans={plans} user={user} profile={profile} onNavigate={setActiveTab} />
            )}
            {activeTab === 'ranking' && (
              <Ranking key="ranking" user={user} />
            )}
            {activeTab === 'profile' && (
              <Profile 
                key="profile" 
                profile={profile} 
                onSave={saveProfile} 
                user={user} 
                onToggleTheme={toggleTheme}
                onToggleLanguage={toggleLanguage}
                setActiveTab={setActiveTab}
              />
            )}
            {activeTab === 'challenge' && (
              <Challenge key="challenge" user={user} />
            )}
            {activeTab === 'community' && (
              <Community key="community" />
            )}
            {activeTab === 'admin' && user?.role === 'admin' && (
              <AdminPanel key="admin" />
            )}
          </>
        )}
        {activeTab === 'upgrade' && (
          <div className="max-w-4xl mx-auto py-12 px-6">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-red/10 border border-brand-red/20 text-brand-red text-xs font-black uppercase tracking-widest mb-6">
                <Crown size={14} />
                Plano Exclusivo
              </div>
              <h2 className="text-5xl font-display font-black mb-4 tracking-tighter">DOMINE SEU <span className="text-brand-red">POTENCIAL</span></h2>
              <p className="text-white/40 text-lg max-w-xl mx-auto">
                Acesse as ferramentas utilizadas por atletas profissionais para acelerar seus resultados.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="glass-card p-8 border-white/5 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">Plano Gratuito</h3>
                  <p className="text-white/40 text-sm mb-6">Comece sua jornada com o básico.</p>
                  <ul className="space-y-4 mb-8">
                    {[
                      { text: 'Dieta e Treino Base', done: true },
                      { text: 'Chat Básico com IA', done: true },
                      { text: 'Dicas de Suplementação', done: true },
                      { text: 'Análise de Shape', done: false },
                      { text: 'Direto com Mentor', done: false },
                    ].map((item, i) => (
                      <li key={i} className={`flex items-center gap-3 text-sm ${item.done ? 'text-white/60' : 'text-white/20'}`}>
                        <CheckCircle2 size={16} className={item.done ? 'text-emerald-500' : 'text-white/10'} />
                        {item.text}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-6 border-t border-white/5">
                  <div className="text-3xl font-display font-bold mb-4">Grátis</div>
                  <button disabled className="w-full py-3 bg-white/5 text-white/40 rounded-xl font-bold uppercase tracking-widest text-xs">Posição Atual</button>
                </div>
              </div>

              <div className="glass-card p-8 border-brand-red bg-brand-red/5 relative overflow-hidden shadow-2xl shadow-brand-red/10 flex flex-col justify-between">
                <div className="absolute top-0 right-0 p-4">
                  <Trophy size={48} className="text-brand-red opacity-10" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    Elite Coach <Crown size={20} className="text-brand-red" />
                  </h3>
                  <p className="text-white/40 text-sm mb-6">A ferramenta definitiva de performance.</p>
                  <ul className="space-y-4 mb-8">
                    {[
                      { text: 'Análise de Shape (IA Vision)', premium: true },
                      { text: 'Ranking Elite com Prêmios Reais', premium: true },
                      { text: 'Plano Alimentar Estratégico', premium: true },
                      { text: 'Coach Mentor 24/7 (Gemini Pro)', premium: true },
                      { text: 'Troca de Exercícios Inteligente', premium: true },
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm font-bold text-white">
                        <div className="w-5 h-5 bg-brand-red rounded-full flex items-center justify-center">
                          <ArrowRight size={12} className="text-white" />
                        </div>
                        {item.text}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-6 border-t border-white/10">
                  <div className="flex items-end gap-2 mb-4">
                    <span className="text-4xl font-display font-black text-brand-red">R$ 49,90</span>
                    <span className="text-white/40 text-sm font-bold uppercase tracking-widest mb-1">/ mensal</span>
                  </div>
                  <button 
                    onClick={handleUpgrade} 
                    className="w-full btn-primary py-4 rounded-xl font-display font-black text-lg shadow-xl shadow-brand-red/20 active:scale-95 transition-transform"
                  >
                    ASSINAR AGORA
                  </button>
                  <p className="text-center text-[10px] text-white/20 mt-4 uppercase font-black tracking-tighter">Cancele a qualquer momento • Pagamento Seguro</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
