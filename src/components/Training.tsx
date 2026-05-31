import React, { useState, useEffect } from 'react';
import { Dumbbell, Calendar, Zap, Info, Video, Camera, Send, Loader2, AlertCircle, CheckCircle2, BrainCircuit, History, ChevronRight, ChevronLeft, Scale, X, RefreshCw } from 'lucide-react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { aiService } from '../services/aiService';


interface TrainingProps {
  plan: string | null;
  schedule: string | null;
  user: any;
}

export default function Training({ plan, schedule, user }: TrainingProps) {
  const [activeTab, setActiveTab] = useState<'plan' | 'schedule'>('schedule');
  const [selectedDay, setSelectedDay] = useState<string>('segunda');
  const [loads, setLoads] = useState<any[]>([]);
  const [isLoggingLoad, setIsLoggingLoad] = useState<{ exercise: string, open: boolean }>({ exercise: '', open: false });
  const [newLoad, setNewLoad] = useState({ weight: '', reps: '', sets: '' });
  const [swaps, setSwaps] = useState<Record<string, Record<number, any>>>({});
  const [swapping, setSwapping] = useState<Record<string, boolean>>({});
  const [showVideo, setShowVideo] = useState<string | null>(null);

  const isEn = user.language === 'en';

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    
    // Check if it's already just an ID (no dots, slashes, etc.)
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
      return `https://www.youtube.com/embed/${url}?autoplay=1`;
    }

    let videoId = '';
    
    if (url.includes('v=')) {
      videoId = url.split('v=')[1].split('&')[0];
    } else if (url.includes('be/')) {
      videoId = url.split('be/')[1].split('?')[0];
    } else if (url.includes('embed/')) {
      videoId = url.split('embed/')[1].split('?')[0];
    }
    
    if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    // If it's a search URL or something else, we tried our best, return as is (iframe might not support it)
    return null;
  };

  const handleSwap = async (day: string, index: number, currentEx: any) => {
    if (!user.is_premium) {
      alert(isEn ? "Exercise swapping is a Premium feature. Upgrade to unlock alternative exercises!" : "Troca de exercícios é um recurso Premium. Assine para liberar exercícios alternativos!");
      return;
    }
    const swapKey = `${day}-${index}`;
    if (swapping[swapKey]) return;
    
    setSwapping(prev => ({ ...prev, [swapKey]: true }));
    
    try {
      const prompt = `
        O atleta não tem o equipamento para o exercício "${currentEx.name}" ou quer trocar.
        Sugira UM exercício equivalente que trabalhe o mesmo grupo muscular.
        
        Retorne APENAS um JSON no formato:
        {
          "name": "Nome do Exercício",
          "sets": "mesma do original ou ajuste leve",
          "reps": "mesma do original ou ajuste leve",
          "rest": "mesma do original ou ajuste leve",
          "gif_url": "link de busca no youtube para execução"
        }
      `;

      const aiText = await aiService.generateContent({
        prompt,
        responseMimeType: "application/json"
      });

      const alternative = JSON.parse(aiText.replace(/```json|```/g, '').trim());
      
      setSwaps(prev => ({
        ...prev,
        [day]: {
          ...(prev[day] || {}),
          [index]: { ...alternative, originalName: currentEx.name }
        }
      }));
    } catch (e) {
      console.error("Erro ao trocar exercício:", e);
      alert(isEn ? "Error finding alternative. Try again." : "Erro ao buscar alternativa. Tente novamente.");
    } finally {
      setSwapping(prev => ({ ...prev, [swapKey]: false }));
    }
  };

  const days = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
  const parsedSchedule = schedule ? JSON.parse(schedule) : null;

  useEffect(() => {
    fetchLoads();
  }, []);

  const fetchLoads = async () => {
    try {
      const res = await fetch('/api/training/loads', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) setLoads(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleLogLoad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoad.weight) return;

    try {
      const res = await fetch('/api/training/load', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          exercise_name: isLoggingLoad.exercise,
          weight: parseFloat(newLoad.weight),
          reps: parseInt(newLoad.reps) || 0,
          sets: parseInt(newLoad.sets) || 0
        })
      });

      if (res.ok) {
        setIsLoggingLoad({ exercise: '', open: false });
        setNewLoad({ weight: '', reps: '', sets: '' });
        fetchLoads();
      }
    } catch (e) { console.error(e); }
  };

  const t = {
    title: isEn ? 'TRAINING' : 'TREINO',
    subtitle: isEn ? 'Your war strategy for maximum hypertrophy.' : 'Sua estratégia de guerra para máxima hipertrofia.',
    noPlan: isEn ? 'No Training Generated' : 'Nenhum Treino Gerado',
    noPlanDesc: isEn ? 'Go to the Body Analysis tab and request an analysis to generate your personalized training plan.' : 'Vá até a aba Análise Corporal e solicite uma análise para gerar seu plano de treino personalizado.',
    consistency: isEn ? 'Consistency' : 'Consistência',
    consistencyDesc: isEn ? 'The plan only works if you show up every day. No excuses.' : 'O plano só funciona se você aparecer todos os dias. Sem desculpas.',
    intensity: isEn ? 'Intensity' : 'Intensidade',
    intensityDesc: isEn ? 'Don\'t count reps, make every rep count. Go to failure.' : 'Não conte repetições, faça cada repetição contar. Vá até a falha.',
    execution: isEn ? 'Execution' : 'Execução',
    executionDesc: isEn ? 'Technique precedes load. In Premium, AI corrects your execution via video.' : 'A técnica precede a carga. No Premium, a IA corrige sua execução por vídeo.',
    schedule: isEn ? 'Weekly Schedule' : 'Calendário Semanal',
    logLoad: isEn ? 'Log Load' : 'Registrar Carga',
    lastLoad: isEn ? 'Last Load' : 'Última Carga'
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold mb-2">PLANO DE <span className="text-brand-red">{t.title}</span> <span className="text-white/20">ELITE</span></h2>
          <p className="text-white/60">{t.subtitle}</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          <button 
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'schedule' ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20' : 'text-white/40 hover:text-white'}`}
          >
            {t.schedule}
          </button>
          <button 
            onClick={() => setActiveTab('plan')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'plan' ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20' : 'text-white/40 hover:text-white'}`}
          >
            {isEn ? 'Full Plan' : 'Plano Completo'}
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'schedule' ? (
          <motion.div 
            key="schedule"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {parsedSchedule ? (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Day Selection */}
                <div className="lg:col-span-1 space-y-2">
                  {days.map(day => (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`w-full p-4 rounded-xl border transition-all text-left flex items-center justify-between ${selectedDay === day ? 'bg-brand-red border-brand-red text-white shadow-lg shadow-brand-red/20' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'}`}
                    >
                      <span className="font-bold uppercase text-xs tracking-widest">{day}</span>
                      <span className="text-[10px] opacity-60">{parsedSchedule[day]?.muscle_group}</span>
                    </button>
                  ))}
                </div>

                {/* Exercises for Selected Day */}
                <div className="lg:col-span-3 space-y-6">
                  <div className="glass-card p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-2xl font-display font-bold uppercase tracking-tight">
                          {selectedDay} <span className="text-brand-red">| {parsedSchedule[selectedDay]?.muscle_group}</span>
                        </h3>
                        <p className="text-xs text-white/40">{isEn ? 'Follow the sequence for best results' : 'Siga a sequência para melhores resultados'}</p>
                      </div>
                      <Dumbbell className="text-brand-red opacity-20" size={40} />
                    </div>

                    <div className="space-y-4">
                      {parsedSchedule[selectedDay]?.exercises.length > 0 ? (
                        parsedSchedule[selectedDay].exercises.map((originalEx: any, idx: number) => {
                          const swappedEx = swaps[selectedDay]?.[idx];
                          const ex = swappedEx || originalEx;
                          const lastLoad = loads.find(l => l.exercise_name === ex.name);
                          const isSwapping = swapping[`${selectedDay}-${idx}`];

                          return (
                            <motion.div 
                              key={idx}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className={`p-4 border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${swappedEx ? 'bg-brand-red/5 border-brand-red/30' : 'bg-white/5 border-white/10'}`}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${swappedEx ? 'bg-brand-red text-white' : 'bg-brand-red/20 text-brand-red'}`}>
                                  {idx + 1}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 
                                      className={`font-bold ${ex.gif_url ? 'cursor-pointer hover:text-brand-red transition-colors' : ''}`}
                                      onClick={() => ex.gif_url && window.open(ex.gif_url, '_blank')}
                                    >
                                      {ex.name}
                                      {swappedEx && <span className="ml-2 text-[10px] text-brand-red uppercase font-black tracking-tighter">(Alt)</span>}
                                    </h4>
                                    {ex.gif_url && (
                                      <button 
                                        onClick={() => setShowVideo(ex.gif_url)}
                                        className="p-1 text-brand-red hover:bg-brand-red/10 rounded transition-colors"
                                        title={isEn ? 'View Execution' : 'Ver Execução'}
                                      >
                                        <Video size={14} />
                                      </button>
                                    )}
                                    <button 
                                      onClick={() => handleSwap(selectedDay, idx, originalEx)}
                                      disabled={isSwapping}
                                      className={`p-1 rounded transition-colors ${swappedEx ? 'text-brand-red bg-brand-red/10' : 'text-white/20 hover:text-white hover:bg-white/5'}`}
                                      title={isEn ? 'Swap Exercise' : 'Trocar Exercício'}
                                    >
                                      <RefreshCw size={14} className={isSwapping ? 'animate-spin' : ''} />
                                    </button>
                                  </div>
                                  <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
                                    {ex.sets} SETS × {ex.reps} REPS | {ex.rest} REST
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                {lastLoad && (
                                  <div className="text-right">
                                    <p className="text-[8px] text-white/40 uppercase font-bold">{t.lastLoad}</p>
                                    <p className="text-xs font-bold text-brand-red">{lastLoad.weight}kg</p>
                                  </div>
                                )}
                                <button 
                                  onClick={() => setIsLoggingLoad({ exercise: ex.name, open: true })}
                                  className="p-2 bg-white/5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all"
                                  title={t.logLoad}
                                >
                                  <Scale size={18} />
                                </button>
                              </div>
                            </motion.div>
                          );
                        })
                      ) : (
                        <div className="py-20 text-center text-white/20">
                          <History size={48} className="mx-auto mb-4 opacity-10" />
                          <p className="font-bold uppercase tracking-widest">{isEn ? 'REST DAY' : 'DIA DE DESCANSO'}</p>
                          <p className="text-xs">{isEn ? 'Enjoy your recovery, legend.' : 'Aproveite sua recuperação, lenda.'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-card p-12 text-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Dumbbell size={40} className="text-white/20" />
                </div>
                <h3 className="text-xl font-bold mb-2">{t.noPlan}</h3>
                <p className="text-white/40 max-w-md mx-auto">
                  {t.noPlanDesc}
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="plan"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            {plan ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-8 border-t-4 border-brand-red"
              >
                <div className="prose prose-invert max-w-none markdown-body training-plan-content">
                  <Markdown>{plan}</Markdown>
                </div>
              </motion.div>
            ) : (
              <div className="glass-card p-12 text-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Dumbbell size={40} className="text-white/20" />
                </div>
                <h3 className="text-xl font-bold mb-2">{t.noPlan}</h3>
                <p className="text-white/40 max-w-md mx-auto">
                  {t.noPlanDesc}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div whileHover={{ y: -5 }} className="glass-card p-6 border-l-4 border-brand-red bg-gradient-to-br from-brand-red/5 to-transparent">
                <Calendar size={24} className="text-brand-red mb-4" />
                <h4 className="font-bold mb-2">{t.consistency}</h4>
                <p className="text-sm text-white/60">{t.consistencyDesc}</p>
              </motion.div>
              <motion.div whileHover={{ y: -5 }} className="glass-card p-6 border-l-4 border-brand-red bg-gradient-to-br from-brand-red/5 to-transparent">
                <Zap size={24} className="text-brand-red mb-4" />
                <h4 className="font-bold mb-2">{t.intensity}</h4>
                <p className="text-sm text-white/60">{t.intensityDesc}</p>
              </motion.div>
              <motion.div whileHover={{ y: -5 }} className="glass-card p-6 border-l-4 border-brand-red bg-gradient-to-br from-brand-red/5 to-transparent">
                <Info size={24} className="text-brand-red mb-4" />
                <h4 className="font-bold mb-2">{t.execution}</h4>
                <p className="text-sm text-white/60">{t.executionDesc}</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Log Load Modal */}
      <AnimatePresence>
        {showVideo && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden relative shadow-2xl border border-white/10"
            >
              <button 
                onClick={() => setShowVideo(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-brand-red rounded-full flex items-center justify-center text-white transition-all backdrop-blur-md"
              >
                <X size={24} />
              </button>
              
              {getYouTubeEmbedUrl(showVideo) ? (
                <iframe 
                  src={getYouTubeEmbedUrl(showVideo)}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-10">
                  <Video size={64} className="text-white/10 mb-6" />
                  <h3 className="text-xl font-bold mb-4">{isEn ? 'Redirecting to Tutorial' : 'Redirecionando para o Tutorial'}</h3>
                  <p className="text-white/40 mb-8 max-w-md">{isEn ? 'This video format requires external viewing. You will be redirected shortly.' : 'Este formato de vídeo requer visualização externa. Você será redirecionado em instantes.'}</p>
                  <button 
                    onClick={() => {
                      window.open(showVideo, '_blank');
                      setShowVideo(null);
                    }}
                    className="btn-primary"
                  >
                    {isEn ? 'Open in YouTube' : 'Abrir no YouTube'}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {isLoggingLoad.open && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card w-full max-w-sm p-8"
            >
              <h3 className="text-xl font-bold mb-2">{t.logLoad}</h3>
              <p className="text-xs text-white/40 mb-6 uppercase tracking-widest">{isLoggingLoad.exercise}</p>
              
              <form onSubmit={handleLogLoad} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-white/40">{isEn ? 'Weight' : 'Peso'} (kg)</label>
                    <input 
                      type="number" 
                      step="0.5"
                      value={newLoad.weight}
                      onChange={(e) => setNewLoad(prev => ({ ...prev, weight: e.target.value }))}
                      className="input-field w-full text-center"
                      placeholder="0.0"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-white/40">{isEn ? 'Reps' : 'Reps'}</label>
                    <input 
                      type="number" 
                      value={newLoad.reps}
                      onChange={(e) => setNewLoad(prev => ({ ...prev, reps: e.target.value }))}
                      className="input-field w-full text-center"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-white/40">{isEn ? 'Sets' : 'Séries'}</label>
                    <input 
                      type="number" 
                      value={newLoad.sets}
                      onChange={(e) => setNewLoad(prev => ({ ...prev, sets: e.target.value }))}
                      className="input-field w-full text-center"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsLoggingLoad({ exercise: '', open: false })}
                    className="flex-1 btn-secondary"
                  >
                    {isEn ? 'Cancel' : 'Cancelar'}
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 btn-primary"
                  >
                    {isEn ? 'Save' : 'Salvar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
