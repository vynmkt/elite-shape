import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Crown, TrendingUp, Medal, Star, Gift, ArrowRight } from 'lucide-react';

interface RankingProps {
  user: any;
}

const Ranking: React.FC<RankingProps> = ({ user }) => {
  const isPremium = user.is_premium;
  const [athletes, setAthletes] = React.useState<any[]>([]);
  const [prizes, setPrizes] = React.useState<any[]>([]);
  const [sponsors, setSponsors] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rRes, pRes, sRes] = await Promise.all([
        fetch('/api/leaderboard', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
        fetch('/api/prizes'),
        fetch('/api/sponsors')
      ]);
      
      if (rRes.ok) setAthletes(await rRes.json());
      if (pRes.ok) setPrizes(await pRes.json());
      if (sRes.ok) setSponsors(await sRes.json());
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  if (!isPremium) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-6 text-center">
        <div className="w-24 h-24 bg-brand-red/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-brand-red/20">
          <Trophy size={48} className="text-brand-red" />
        </div>
        <h2 className="text-4xl font-display font-black uppercase mb-4 tracking-tighter">O RANKING É <br/><span className="text-brand-red text-stroke">EXCLUSIVO</span></h2>
        <p className="text-white/40 text-lg mb-10">
          Apenas atletas Elite participam do ranking global e concorrem a premiações reais como suplementos e acessórios exclusivos.
        </p>
        <div className="glass-card p-8 border-brand-red/30 bg-brand-red/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
             <Gift size={80} />
          </div>
          <h3 className="text-xl font-bold mb-4 text-left">Prêmios deste Mês:</h3>
          <ul className="space-y-3 mb-8 text-left">
            {prizes.length === 0 ? (
              <li className="text-white/20 text-xs italic">Novos prêmios vindo em breve...</li>
            ) : prizes.slice(0, 3).map(p => (
              <li key={p.id} className="flex items-center gap-3 text-sm font-bold">
                <Star className={p.place === 1 ? "text-yellow-500" : p.place === 2 ? "text-slate-400" : "text-amber-600"} size={16} />
                {p.place}º Lugar: {p.title}
              </li>
            ))}
          </ul>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'upgrade' }))}
            className="w-full btn-primary py-4 rounded-xl font-black text-lg"
          >
            LIBERAR MEU ACESSO
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-2">
        <div>
          <h2 className="text-4xl font-display font-black uppercase tracking-tighter mb-2">Ranking <span className="text-brand-red">Elite</span></h2>
          <p className="text-white/40">Competição global baseada na disciplina e progresso.</p>
        </div>
        <div className="flex gap-4">
          <div className="glass-card py-2 px-4 border-brand-red/20 bg-brand-red/5">
            <p className="text-[10px] text-white/40 font-black uppercase mb-1">Seus Pontos</p>
            <p className="text-lg font-display font-bold">{user.points || 0}</p>
          </div>
        </div>
      </header>

      {sponsors.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {sponsors.map(s => (
            <a key={s.id} href={s.link} target="_blank" rel="noopener noreferrer" className="glass-card p-4 flex items-center justify-center grayscale hover:grayscale-0 transition-all group overflow-hidden">
              <img src={s.image_url} alt={s.name} className="h-12 object-contain group-hover:scale-110 transition-transform" />
            </a>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card overflow-hidden">
            <div className="bg-white/5 px-6 py-3 border-b border-white/10 flex justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
              <span>Atleta</span>
              <div className="flex gap-12">
                <span>Nível</span>
                <span>Pontos</span>
              </div>
            </div>
            <div className="divide-y divide-white/5">
              {athletes.length === 0 ? (
                <div className="p-8 text-center text-white/20 uppercase font-black tracking-widest text-xs">Aguardando dados oficiais...</div>
              ) : athletes.map((athlete, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className={`w-6 text-sm font-black ${idx < 3 ? 'text-brand-red' : 'text-white/20'}`}>
                      {idx + 1}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-brand-red flex items-center justify-center font-black text-[10px] uppercase">
                      {athlete.name.substring(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-bold flex items-center gap-2">
                        {athlete.name}
                        {idx === 0 && <Crown size={14} className="text-yellow-500" />}
                      </p>
                      <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Streak: {athlete.streak || 0} Dias</p>
                    </div>
                  </div>
                  <div className="flex gap-10 text-right">
                    <span className="text-xs font-black text-white/40 uppercase tracking-tighter w-20">{athlete.level}</span>
                    <span className="text-sm font-black text-brand-red min-w-[32px]">{athlete.points}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 border-yellow-500/20 bg-yellow-500/5">
            <h3 className="text-lg font-display font-bold uppercase mb-4 flex items-center gap-2">
              <Gift size={20} className="text-yellow-500" />
              Prêmios Ativos
            </h3>
            <p className="text-xs text-white/60 mb-6">
              Os melhores atletas do ciclo recebem premiações reais enviadas pelos nossos parceiros.
            </p>
            <div className="space-y-4">
              {prizes.length === 0 ? (
                <div className="text-[10px] text-white/20 uppercase font-bold text-center py-4 border border-dashed border-white/10 rounded-xl">
                  Nenhum prêmio lançado este mês.
                </div>
              ) : prizes.map(p => (
                <div key={p.id} className="flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                     <Medal className={p.place === 1 ? 'text-yellow-500' : p.place === 2 ? 'text-slate-400' : 'text-amber-600'} size={24} />
                  </div>
                  <div>
                     <p className="text-xs font-bold">{p.place}º {p.title}</p>
                     <p className="text-[10px] text-white/40">{p.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6">
             <h3 className="text-lg font-display font-bold uppercase mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-brand-red" />
              Como Funciona?
            </h3>
            <div className="space-y-4 text-[10px] font-bold uppercase tracking-widest text-white/40">
              <p className="flex items-start gap-2">
                <span className="text-brand-red">1.</span> Analisamos suas fotos de shape mensais.
              </p>
              <p className="flex items-start gap-2">
                <span className="text-brand-red">2.</span> Consideramos volume, definição e simetria.
              </p>
              <p className="flex items-start gap-2">
                <span className="text-brand-red">3.</span> A IA gera seu Elite Score de 0 a 100.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ranking;
