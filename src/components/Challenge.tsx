import React, { useState, useEffect } from 'react';
import { Trophy, Target, CheckCircle2, Circle, Flame, Award, Crown, Loader2, BrainCircuit, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Mission {
  id: string;
  type: string;
  description: string;
  points: number;
  completed: boolean;
}

interface ChallengeStatus {
  active: boolean;
  day: number;
  missions: Mission[];
}

export default function Challenge({ user }: { user: any }) {
  const [status, setStatus] = useState<ChallengeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);

  const isEn = user.language === 'en';

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/challenge/status', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.challenge) {
          const missions: Mission[] = [
            { id: 'protein_met', type: 'nutrition', description: isEn ? 'Meet protein goal' : 'Bater meta de proteína', points: 50, completed: !!data.missions.protein_met },
            { id: 'training_done', type: 'training', description: isEn ? 'Complete daily training' : 'Treino do dia finalizado', points: 50, completed: !!data.missions.training_done },
            { id: 'cardio_done', type: 'cardio', description: isEn ? 'Complete daily cardio' : 'Cardio do dia finalizado', points: 50, completed: !!data.missions.cardio_done },
          ];
          setStatus({
            active: true,
            day: data.challenge.current_day,
            missions
          });
        } else {
          setStatus({ active: false, day: 0, missions: [] });
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const startChallenge = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/challenge/start', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) fetchStatus();
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const completeMission = async (missionId: string) => {
    try {
      const res = await fetch('/api/challenge/mission', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ type: missionId, value: true })
      });
      if (res.ok) fetchStatus();
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-brand-red" /></div>;

  if (!status?.active) {
    return (
      <div className="max-w-4xl mx-auto text-center space-y-8 py-12">
        <div className="relative inline-block">
          <Trophy size={80} className="text-brand-red mx-auto mb-4" />
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -top-2 -right-2 bg-yellow-500 text-black p-1 rounded-full"
          >
            <Crown size={20} />
          </motion.div>
        </div>
        <h2 className="text-5xl font-display font-bold">DESAFIO <span className="text-brand-red">30 DIAS</span> COM IA</h2>
        <p className="text-xl text-white/60 max-w-2xl mx-auto">
          Transforme seu físico em 30 dias com missões diárias personalizadas, feedback brutal da IA e recompensas exclusivas.
        </p>
        
        {!user.is_premium ? (
          <div className="glass-card p-8 border-brand-red/20 bg-brand-red/5">
            <h3 className="text-2xl font-bold mb-4">RECURSO PREMIUM</h3>
            <p className="text-white/40 mb-6">O desafio de 30 dias é exclusivo para membros Elite.</p>
            <button className="btn-primary px-12 py-4 text-lg">ASSINAR AGORA - R$ 49,90/mês</button>
          </div>
        ) : (
          <button 
            onClick={startChallenge}
            className="btn-primary px-16 py-6 text-2xl font-display shadow-2xl shadow-brand-red/40 hover:scale-105 transition-transform"
          >
            INICIAR JORNADA
          </button>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="glass-card p-6">
            <Target className="text-brand-red mb-4" />
            <h4 className="font-bold mb-2">Metas Diárias</h4>
            <p className="text-xs text-white/40 uppercase">Missões baseadas no seu nível atual.</p>
          </div>
          <div className="glass-card p-6">
            <BrainCircuit className="text-brand-red mb-4" />
            <h4 className="font-bold mb-2">Ajuste por IA</h4>
            <p className="text-xs text-white/40 uppercase">A IA ajusta as missões se você falhar ou evoluir.</p>
          </div>
          <div className="glass-card p-6">
            <Zap className="text-brand-red mb-4" />
            <h4 className="font-bold mb-2">Ranking Elite</h4>
            <p className="text-xs text-white/40 uppercase">Ganhe pontos e suba no ranking da plataforma.</p>
          </div>
        </div>
      </div>
    );
  }

  const completedCount = status.missions.filter(m => m.completed).length;
  const progress = (completedCount / status.missions.length) * 100;

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-brand-red text-white text-[10px] font-bold rounded-full">DIA {status.day} / 30</span>
            <span className="text-white/40 text-xs font-bold uppercase tracking-widest">Desafio Ativo</span>
          </div>
          <h2 className="text-3xl font-display font-bold">MINHA <span className="text-brand-red">JORNADA</span></h2>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">Progresso Diário</p>
          <div className="flex items-center gap-3">
            <div className="w-48 h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-brand-red"
              />
            </div>
            <span className="text-sm font-bold">{Math.round(progress)}%</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Target size={24} className="text-brand-red" />
            Missões de Hoje
          </h3>
          <div className="space-y-4">
            {status.missions.map((mission) => (
              <motion.div 
                key={mission.id}
                whileHover={{ x: 10 }}
                className={`glass-card p-6 flex items-center justify-between cursor-pointer transition-colors ${mission.completed ? 'border-brand-red/40 bg-brand-red/5' : 'hover:border-white/20'}`}
                onClick={() => !mission.completed && completeMission(mission.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${mission.completed ? 'bg-brand-red text-white' : 'bg-white/5 text-white/20'}`}>
                    {mission.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                  </div>
                  <div>
                    <h4 className={`font-bold ${mission.completed ? 'text-white/60 line-through' : 'text-white'}`}>{mission.description}</h4>
                    <p className="text-[10px] text-brand-red font-bold uppercase">+{mission.points} PONTOS</p>
                  </div>
                </div>
                {mission.completed && <span className="text-[10px] font-bold text-brand-red uppercase">COMPLETO</span>}
              </motion.div>
            ))}
          </div>

          {progress === 100 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-8 text-center border-yellow-500/40 bg-yellow-500/5"
            >
              <Flame size={40} className="text-yellow-500 mx-auto mb-4" />
              <h4 className="text-xl font-bold mb-2">DIA FINALIZADO COM SUCESSO!</h4>
              <p className="text-white/60">Você provou sua disciplina hoje. Volte amanhã para o próximo nível.</p>
            </motion.div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <BrainCircuit size={20} className="text-brand-red" />
              Feedback da IA
            </h3>
            <div className="p-4 bg-white/5 rounded-xl text-xs text-white/60 italic leading-relaxed">
              {progress < 50 
                ? "Você ainda não começou o trabalho pesado. O shape não vem com desculpas, vem com proteína e treino. Mova-se."
                : progress < 100 
                ? "Bom começo, mas consistência é o que separa os campeões. Termine suas missões."
                : "Excelente trabalho hoje. Você manteve o padrão Elite. Descanse e prepare-se para amanhã."}
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Award size={20} className="text-brand-red" />
              Próxima Recompensa
            </h3>
            <div className="text-center p-4">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                <Trophy size={32} className="text-white/20" />
              </div>
              <h4 className="font-bold text-sm mb-1">Badge: 7 Dias de Fogo</h4>
              <p className="text-[10px] text-white/40 uppercase">Faltam {7 - (status.day % 7)} dias</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
