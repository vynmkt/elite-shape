import React, { useState, useEffect } from 'react';
import { Trophy, Medal, TrendingUp, Users, Loader2, Crown, Star, Camera, CheckCircle2, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

interface RankingUser {
  id: number;
  name: string;
  initial_fat: number;
  current_fat: number;
  evolution: number;
}

interface CommunitySettings {
  prize_top1: string;
  prize_top2: string;
  prize_top3: string;
  community_banner: string;
  challenge_start_date: string;
  challenge_end_date: string;
}

interface MissionsRankingUser {
  id: number;
  name: string;
  streak: number;
  total_missions: number;
}

export default function Community() {
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [missionsRanking, setMissionsRanking] = useState<MissionsRankingUser[]>([]);
  const [settings, setSettings] = useState<CommunitySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rankingRes, settingsRes, missionsRes] = await Promise.all([
        fetch('/api/community/ranking'),
        fetch('/api/community/settings'),
        fetch('/api/community/missions-ranking')
      ]);
      if (rankingRes.ok && settingsRes.ok && missionsRes.ok) {
        setRanking(await rankingRes.json());
        setSettings(await settingsRes.json());
        setMissionsRanking(await missionsRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'before') setBeforeImage(reader.result as string);
        else setAfterImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitChallenge = async () => {
    if (!beforeImage && !afterImage) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/community/challenge/submit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ before_image: beforeImage, after_image: afterImage })
      });
      if (res.ok) {
        setSubmissionSuccess(true);
        setTimeout(() => setSubmissionSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-red" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Banner Section */}
      <div className="relative h-64 md:h-80 rounded-3xl overflow-hidden shadow-2xl">
        {settings?.community_banner ? (
          <img 
            src={settings.community_banner} 
            className="w-full h-full object-cover" 
            alt="Community Banner" 
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-red/20 to-brand-black flex items-center justify-center">
            <Users size={80} className="text-white/10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/60 to-transparent flex flex-col justify-end p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tighter uppercase leading-none">
                Ranking de <span className="text-brand-red">Evolução</span>
              </h2>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-brand-red/20 border border-brand-red/30 rounded-full">
                  <TrendingUp size={14} className="text-brand-red" />
                  <span className="text-[10px] font-black text-brand-red uppercase">Comunidade Elite</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Medals Section */}
      <div className="glass-card p-6 bg-gradient-to-r from-brand-red/5 to-transparent border-l-4 border-brand-red">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-red rounded-2xl flex items-center justify-center shadow-lg shadow-brand-red/20">
              <Trophy size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg uppercase tracking-tight">Suas Medalhas de Constância</h3>
              <p className="text-xs text-white/40 font-medium">Poste na comunidade para manter sua chama acesa.</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            {[7, 15, 30, 60, 100].map(milestone => {
              // We'll find the current user's streak from missionsRanking or props if we had them
              // For now, let's assume streak of 10 if not found for demo, but better to use real data
              const userStreak = missionsRanking.find(u => u.name === 'você' || u.id === 0)?.streak || 0; 
              const hasMedal = userStreak >= milestone;
              
              return (
                <div 
                  key={milestone}
                  className={`relative group flex flex-col items-center gap-1 transition-all duration-500 ${hasMedal ? 'scale-110' : 'opacity-20 grayscale'}`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                    hasMedal 
                      ? 'bg-brand-red/10 border-brand-red text-brand-red shadow-xl shadow-brand-red/10' 
                      : 'bg-white/5 border-white/10 text-white/40'
                  }`}>
                    {milestone === 100 ? <Crown size={20} /> : <Medal size={20} />}
                  </div>
                  <span className="text-[10px] font-black tracking-tighter uppercase">{milestone} DIAS</span>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-black border border-white/10 rounded-lg text-[9px] font-bold uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {hasMedal ? 'Conquistada!' : `Faltam ${milestone - userStreak} dias`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Prizes Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 border-t-4 border-brand-red">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Trophy className="text-brand-red" size={20} />
              PREMIAÇÃO DA TEMPORADA
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                  <Crown size={24} />
                </div>
                <div>
                  <p className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest">1º LUGAR</p>
                  <p className="font-bold text-sm">{settings?.prize_top1 || 'A definir'}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-300/10 border border-slate-300/20 rounded-xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-300/20 flex items-center justify-center text-slate-300">
                  <Medal size={24} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">2º LUGAR</p>
                  <p className="font-bold text-sm">{settings?.prize_top2 || 'A definir'}</p>
                </div>
              </div>

              <div className="p-4 bg-orange-700/10 border border-orange-700/20 rounded-xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-700/20 flex items-center justify-center text-orange-700">
                  <Medal size={24} />
                </div>
                <div>
                  <p className="text-[10px] text-orange-700 font-bold uppercase tracking-widest">3º LUGAR</p>
                  <p className="font-bold text-sm">{settings?.prize_top3 || 'A definir'}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-xs text-white/40 leading-relaxed italic">
                * O ranking é atualizado semanalmente com base na redução do percentual de gordura analisado pela nossa IA.
              </p>
            </div>
          </div>

          {/* Challenge Submission */}
          <div className="glass-card p-6 border-t-4 border-emerald-500">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Camera className="text-emerald-500" size={20} />
              PARTICIPAR DO DESAFIO
            </h3>
            
            <p className="text-xs text-white/40 mb-6">
              Envie sua foto de "Antes" no início e "Depois" no final para concorrer aos prêmios.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase text-white/40 text-center">Antes</p>
                <div className="aspect-[3/4] bg-white/5 rounded-xl border border-dashed border-white/10 relative overflow-hidden group">
                  {beforeImage ? (
                    <img src={beforeImage} className="w-full h-full object-cover" alt="Antes" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20">
                      <Camera size={24} />
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleImageUpload(e, 'before')}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase text-white/40 text-center">Depois</p>
                <div className="aspect-[3/4] bg-white/5 rounded-xl border border-dashed border-white/10 relative overflow-hidden group">
                  {afterImage ? (
                    <img src={afterImage} className="w-full h-full object-cover" alt="Depois" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20">
                      <Camera size={24} />
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleImageUpload(e, 'after')}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleSubmitChallenge}
              disabled={submitting || (!beforeImage && !afterImage)}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                submissionSuccess ? 'bg-emerald-500 text-white' : 'btn-primary'
              }`}
            >
              {submitting ? <Loader2 className="animate-spin" size={18} /> : 
               submissionSuccess ? <><CheckCircle2 size={18} /> ENVIADO!</> : 'ENVIAR FOTOS'}
            </button>
          </div>
        </div>

        {/* Ranking List */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Users className="text-brand-red" size={20} />
              TOP 10 EVOLUÇÃO (SHAPE)
            </h3>

            <div className="space-y-3">
              {ranking.length === 0 ? (
                <div className="py-20 text-center text-white/20">
                  <TrendingUp size={48} className="mx-auto mb-4 opacity-10" />
                  <p className="font-bold uppercase tracking-widest">Aguardando Dados</p>
                  <p className="text-xs">A temporada de evolução está apenas começando.</p>
                </div>
              ) : (
                ranking.map((user, idx) => (
                  <motion.div 
                    key={user.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                      idx === 0 ? 'bg-yellow-500/10 border-yellow-500/30 ring-1 ring-yellow-500/20' : 
                      idx === 1 ? 'bg-slate-300/10 border-slate-300/30' :
                      idx === 2 ? 'bg-orange-700/10 border-orange-700/30' :
                      'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        idx === 0 ? 'bg-yellow-500 text-black' : 
                        idx === 1 ? 'bg-slate-300 text-black' :
                        idx === 2 ? 'bg-orange-700 text-white' :
                        'bg-white/10 text-white/40'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold">{user.name}</h4>
                          {idx === 0 && <Star size={14} className="text-yellow-500 fill-yellow-500" />}
                        </div>
                        <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
                          {user.initial_fat}% → {user.current_fat}% Gordura
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-[8px] text-white/40 uppercase font-bold">Evolução</p>
                      <p className={`text-lg font-display font-bold ${
                        idx === 0 ? 'text-yellow-500' : 'text-brand-red'
                      }`}>
                        -{user.evolution}%
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Missions Ranking */}
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-emerald-500">
              <Star size={20} />
              TOP 10 MISSÕES (DESAFIO 30D)
            </h3>

            <div className="space-y-3">
              {missionsRanking.length === 0 ? (
                <div className="py-20 text-center text-white/20">
                  <CheckCircle2 size={48} className="mx-auto mb-4 opacity-10" />
                  <p className="font-bold uppercase tracking-widest">Aguardando Dados</p>
                  <p className="text-xs">Complete missões diárias para subir no ranking.</p>
                </div>
              ) : (
                missionsRanking.map((user, idx) => (
                  <motion.div 
                    key={user.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                      idx === 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        idx === 0 ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white/40'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="font-bold">{user.name}</h4>
                        <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
                          Fogo: {user.streak} dias | Total: {user.total_missions} missões
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-[8px] text-white/40 uppercase font-bold">Missions</p>
                      <p className="text-lg font-display font-bold text-emerald-500">
                        {user.total_missions}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
            <div className="mt-6 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
              <p className="text-[10px] text-emerald-500/60 font-bold uppercase tracking-widest text-center">
                O Top 1 deste ranking ganha 1 Mês de Premium Grátis!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
