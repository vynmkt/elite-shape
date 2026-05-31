import React, { useState, useEffect } from 'react';
import { Users, Search, Shield, ShieldAlert, TrendingUp, Cpu, UserCheck, UserX, Loader2, Target, Camera, Settings, BrainCircuit } from 'lucide-react';

interface AdminUser {
  id: number;
  name: string;
  email: string;
  is_premium: boolean;
  role: string;
  created_at: string;
}

interface AdminStats {
  totalUsers: number;
  premiumUsers: number;
  totalTokens: number;
}

export default function AdminPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [communitySettings, setCommunitySettings] = useState({
    prize_top1: '',
    prize_top2: '',
    prize_top3: '',
    community_banner: '',
    challenge_start_date: '',
    challenge_end_date: ''
  });
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [aiSettings, setAiSettings] = useState({
    active_ai_provider: 'gemini',
    openai_api_key: '',
    ai_fallback_enabled: true
  });
  const [loadingAiSettings, setLoadingAiSettings] = useState(false);
  const [prizes, setPrizes] = useState<any[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [newPrize, setNewPrize] = useState({ place: 1, title: '', description: '', image_url: '' });
  const [newSponsor, setNewSponsor] = useState({ name: '', image_url: '', link: '' });
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
    fetchCommunitySettings();
    fetchSubmissions();
    fetchAiSettings();
    fetchPrizes();
    fetchSponsors();
  }, [search]);

  const fetchPrizes = async () => {
    try {
      const res = await fetch('/api/prizes');
      if (res.ok) setPrizes(await res.json());
    } catch (e) { console.error(e); }
  };

  const addPrize = async () => {
    try {
      const res = await fetch('/api/admin/prizes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newPrize)
      });
      if (res.ok) {
        fetchPrizes();
        setNewPrize({ place: 1, title: '', description: '', image_url: '' });
      }
    } catch (e) { console.error(e); }
  };

  const deletePrize = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/prizes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchPrizes();
    } catch (e) { console.error(e); }
  };

  const fetchSponsors = async () => {
    try {
      const res = await fetch('/api/sponsors');
      if (res.ok) setSponsors(await res.json());
    } catch (e) { console.error(e); }
  };

  const addSponsor = async () => {
    try {
      const res = await fetch('/api/admin/sponsors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newSponsor)
      });
      if (res.ok) {
        fetchSponsors();
        setNewSponsor({ name: '', image_url: '', link: '' });
      }
    } catch (e) { console.error(e); }
  };

  const deleteSponsor = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/sponsors/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchSponsors();
    } catch (e) { console.error(e); }
  };

  const fetchAiSettings = async () => {
    setLoadingAiSettings(true);
    try {
      const res = await fetch('/api/admin/ai-settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAiSettings({
          active_ai_provider: data.active_ai_provider || 'gemini',
          openai_api_key: data.openai_api_key || '',
          ai_fallback_enabled: data.ai_fallback_enabled === '1'
        });
      }
    } catch (e) { console.error(e); }
    finally { setLoadingAiSettings(false); }
  };

  const saveAiSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/ai-settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(aiSettings)
      });
      if (res.ok) alert('Configurações de IA salvas!');
    } catch (e) { console.error(e); }
    finally { setSavingSettings(false); }
  };

  const fetchSubmissions = async () => {
    setLoadingSubmissions(true);
    try {
      const res = await fetch('/api/admin/community/submissions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setSubmissions(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoadingSubmissions(false); }
  };

  const fetchCommunitySettings = async () => {
    try {
      const res = await fetch('/api/community/settings');
      if (res.ok) setCommunitySettings(await res.json());
    } catch (e) { console.error(e); }
  };

  const saveCommunitySettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/community/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(communitySettings)
      });
      if (res.ok) alert('Configurações salvas!');
    } catch (e) { console.error(e); }
    finally { setSavingSettings(false); }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCommunitySettings(prev => ({ ...prev, community_banner: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch(`/api/admin/users?search=${search}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`/api/admin/stats`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (usersRes.ok && statsRes.ok) {
        setUsers(await usersRes.json());
        setStats(await statsRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const togglePlan = async (userId: number, currentPremium: boolean) => {
    try {
      const res = await fetch(`/api/admin/user/${userId}/plan`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_premium: !currentPremium })
      });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold mb-2">PAINEL <span className="text-brand-red">ADMIN</span></h2>
          <p className="text-white/60">Gestão de usuários, custos e infraestrutura.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="glass-card px-6 py-3 flex items-center gap-3">
            <TrendingUp className="text-brand-red" size={20} />
            <div>
              <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Usuários</p>
              <p className="text-xl font-bold">{stats?.totalUsers || 0}</p>
            </div>
          </div>
          <div className="glass-card px-6 py-3 flex items-center gap-3">
            <Cpu className="text-brand-red" size={20} />
            <div>
              <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Tokens IA</p>
              <p className="text-xl font-bold">{(stats?.totalTokens || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="glass-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="Buscar por nome ou email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field w-full pl-12"
            />
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
          </div>
          <button onClick={fetchData} className="btn-secondary py-3 px-6">
            ATUALIZAR
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 text-white/40 text-xs uppercase font-bold tracking-widest">
                <th className="px-4 py-4">Usuário</th>
                <th className="px-4 py-4">Plano</th>
                <th className="px-4 py-4">Cargo</th>
                <th className="px-4 py-4">Cadastro</th>
                <th className="px-4 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Loader2 className="animate-spin text-brand-red mx-auto" size={32} />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-white/40">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <div className="font-bold">{user.name}</div>
                      <div className="text-xs text-white/40">{user.email}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        user.is_premium ? 'bg-brand-red/20 text-brand-red border border-brand-red/30' : 'bg-white/10 text-white/40'
                      }`}>
                        {user.is_premium ? 'Premium' : 'Free'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-xs">
                        {user.role === 'admin' ? <Shield size={14} className="text-brand-red" /> : <ShieldAlert size={14} className="text-white/20" />}
                        <span className="capitalize">{user.role}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-white/40">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button 
                        onClick={() => togglePlan(user.id, user.is_premium)}
                        className={`p-2 rounded-lg transition-all ${
                          user.is_premium ? 'text-white/40 hover:text-white hover:bg-white/10' : 'text-brand-red hover:bg-brand-red/10'
                        }`}
                        title={user.is_premium ? "Remover Premium" : "Ativar Premium"}
                      >
                        {user.is_premium ? <UserX size={18} /> : <UserCheck size={18} />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="text-brand-red" size={20} />
            RANKING & PREMIAÇÃO REAL
          </h3>
          
          <div className="space-y-6">
            <div className="space-y-3">
              {prizes.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-red flex items-center justify-center font-black">{p.place}º</div>
                    <div>
                      <p className="text-sm font-bold">{p.title}</p>
                      <p className="text-[10px] text-white/40">{p.description}</p>
                    </div>
                  </div>
                  <button onClick={() => deletePrize(p.id)} className="text-white/20 hover:text-brand-red">
                    <UserX size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
              <p className="text-[10px] font-black uppercase text-brand-red">Novo Prêmio</p>
              <div className="grid grid-cols-4 gap-2">
                <input type="number" placeholder="Lugar" value={newPrize.place} onChange={e => setNewPrize({...newPrize, place: parseInt(e.target.value)})} className="input-field col-span-1" />
                <input type="text" placeholder="Título" value={newPrize.title} onChange={e => setNewPrize({...newPrize, title: e.target.value})} className="input-field col-span-3" />
              </div>
              <input type="text" placeholder="Descrição curta" value={newPrize.description} onChange={e => setNewPrize({...newPrize, description: e.target.value})} className="input-field w-full" />
              <button onClick={addPrize} className="btn-secondary w-full py-2 text-xs">ADICIONAR PRÊMIO</button>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Target className="text-brand-red" size={20} />
            PATROCINADORES (BANNERS)
          </h3>
          
          <div className="space-y-6">
             <div className="grid grid-cols-2 gap-4">
                {sponsors.map(s => (
                  <div key={s.id} className="relative group rounded-xl overflow-hidden aspect-[3/1] bg-white/5 border border-white/10">
                    <img src={s.image_url} className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => deleteSponsor(s.id)} className="p-2 bg-brand-red rounded-full text-white">
                        <UserX size={16} />
                      </button>
                    </div>
                    <div className="absolute bottom-1 left-2 text-[8px] font-black uppercase">{s.name}</div>
                  </div>
                ))}
             </div>

             <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
               <p className="text-[10px] font-black uppercase text-brand-red">Novo Patrocinador</p>
               <input type="text" placeholder="Nome da Marca" value={newSponsor.name} onChange={e => setNewSponsor({...newSponsor, name: e.target.value})} className="input-field w-full" />
               <div className="flex gap-2">
                  <input type="text" placeholder="URL da Imagem (ou Banner)" value={newSponsor.image_url} onChange={e => setNewSponsor({...newSponsor, image_url: e.target.value})} className="input-field flex-1" />
                  <input type="file" accept="image/*" className="hidden" id="spo-up" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const r = new FileReader();
                      r.onload = () => setNewSponsor({...newSponsor, image_url: r.result as string});
                      r.readAsDataURL(f);
                    }
                  }} />
                  <label htmlFor="spo-up" className="btn-secondary px-3 flex items-center cursor-pointer"><Camera size={16} /></label>
               </div>
               <input type="text" placeholder="Link (opcional)" value={newSponsor.link} onChange={e => setNewSponsor({...newSponsor, link: e.target.value})} className="input-field w-full" />
               <button onClick={addSponsor} className="btn-secondary w-full py-2 text-xs">ADICIONAR PATROCINADOR</button>
             </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Cpu className="text-brand-red" size={20} />
            BANNER DA COMUNIDADE
          </h3>
          
          <div className="space-y-4">
            <div className="aspect-video bg-white/5 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center relative overflow-hidden group">
              {communitySettings.community_banner ? (
                <img src={communitySettings.community_banner} className="w-full h-full object-cover" alt="Banner" />
              ) : (
                <div className="text-center p-6">
                  <TrendingUp size={40} className="text-white/20 mx-auto mb-4" />
                  <p className="text-sm text-white/40">Upload do Banner (16:9)</p>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleBannerUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            <p className="text-[10px] text-white/40 uppercase font-bold text-center">
              Este banner aparecerá no topo da aba de Ranking da Comunidade.
            </p>
            <button 
              onClick={saveCommunitySettings}
              disabled={savingSettings}
              className="btn-primary w-full py-3 mt-4"
            >
              {savingSettings ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'SALVAR BANNER'}
            </button>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <BrainCircuit className="text-brand-red" size={20} />
            INTEGRAÇÕES IA
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase text-white/40 mb-2 block">Provedor Ativo</label>
              <select 
                value={aiSettings.active_ai_provider}
                onChange={(e) => setAiSettings({...aiSettings, active_ai_provider: e.target.value})}
                className="input-field w-full"
              >
                <option value="gemini">Google Gemini (Padrão)</option>
                <option value="openai">OpenAI GPT-4o</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-white/40 mb-2 block">OpenAI API Key</label>
              <input 
                type="password" 
                value={aiSettings.openai_api_key}
                onChange={(e) => setAiSettings({...aiSettings, openai_api_key: e.target.value})}
                className="input-field w-full" 
                placeholder="sk-..."
              />
              <p className="text-[10px] text-white/30 mt-1 italic">
                A chave é armazenada de forma segura no servidor.
              </p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <input 
                type="checkbox" 
                id="fallback"
                checked={aiSettings.ai_fallback_enabled}
                onChange={(e) => setAiSettings({...aiSettings, ai_fallback_enabled: e.target.checked})}
                className="w-4 h-4 rounded border-white/10 bg-black text-brand-red focus:ring-brand-red"
              />
              <label htmlFor="fallback" className="text-xs font-bold uppercase text-white/60 cursor-pointer">
                Ativar Fallback Automático (Reserva)
              </label>
            </div>
            <p className="text-[10px] text-white/40 uppercase font-bold text-center">
              Se o provedor principal falhar, o sistema tentará o secundário automaticamente.
            </p>
            <button 
              onClick={saveAiSettings}
              disabled={savingSettings}
              className="btn-primary w-full py-3 mt-4"
            >
              {savingSettings ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'SALVAR INTEGRAÇÕES'}
            </button>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Camera className="text-brand-red" size={20} />
          SUBMISSÕES DO DESAFIO (ANTES & DEPOIS)
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 text-white/40 text-xs uppercase font-bold tracking-widest">
                <th className="px-4 py-4">Usuário</th>
                <th className="px-4 py-4">Antes</th>
                <th className="px-4 py-4">Depois</th>
                <th className="px-4 py-4">Data Envio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loadingSubmissions ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <Loader2 className="animate-spin text-brand-red mx-auto" size={32} />
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-white/40">
                    Nenhuma submissão encontrada.
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <div className="font-bold">{sub.name}</div>
                      <div className="text-xs text-white/40">{sub.email}</div>
                    </td>
                    <td className="px-4 py-4">
                      {sub.before_image ? (
                        <img src={sub.before_image} className="w-16 h-16 rounded-lg object-cover cursor-pointer hover:scale-110 transition-transform" onClick={() => window.open(sub.before_image)} />
                      ) : <span className="text-white/20">N/A</span>}
                    </td>
                    <td className="px-4 py-4">
                      {sub.after_image ? (
                        <img src={sub.after_image} className="w-16 h-16 rounded-lg object-cover cursor-pointer hover:scale-110 transition-transform" onClick={() => window.open(sub.after_image)} />
                      ) : <span className="text-white/20">N/A</span>}
                    </td>
                    <td className="px-4 py-4 text-xs text-white/40">
                      {new Date(sub.submitted_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
