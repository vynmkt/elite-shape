import React, { useState, useEffect } from 'react';
import { Save, User, Ruler, Weight, Target, Clock, Moon, Utensils, DollarSign, Activity, TrendingUp, Calendar, Award, Camera, AlertCircle, Sun, Globe, Loader2, Flame, Trophy, Crown, Brain, ChevronRight, Medal, Star, Dumbbell, BrainCircuit } from 'lucide-react';
import { Profile as ProfileType, User as UserType } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { motion } from 'motion/react';

interface ProfileProps {
  profile: ProfileType;
  onSave: (data: ProfileType) => void;
  user: UserType;
  onToggleTheme: () => void;
  onToggleLanguage: () => void;
  setActiveTab: (tab: string) => void;
}

export default function Profile({ profile, onSave, user, onToggleTheme, onToggleLanguage, setActiveTab }: ProfileProps) {
  const [formData, setFormData] = useState<ProfileType>(profile);
  const [weightHistory, setWeightHistory] = useState<any[]>([]);
  const [consistency, setConsistency] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const [history, setHistory] = useState<any[]>([]);

  const isEn = user.language === 'en';

  const t = {
    title: isEn ? 'PROFILE' : 'PERFIL',
    subtitle: isEn ? 'Keep your data accurate for better AI coaching.' : 'Mantenha seus dados precisos para melhor orientação da IA.',
    editData: isEn ? 'Personal Information' : 'Informações Pessoais',
    update: isEn ? 'SAVE PROFILE' : 'SALVAR PERFIL',
    settings: isEn ? 'App Settings' : 'Configurações do App',
    save: isEn ? 'SAVE CHANGES' : 'SALVAR ALTERAÇÕES',
    mandatory: isEn ? 'Please fill all mandatory fields.' : 'Por favor, preencha todos os campos obrigatórios.',
    gender: isEn ? 'Gender' : 'Sexo',
    activity: isEn ? 'Activity Level' : 'Nível de Atividade',
    personality: isEn ? 'AI Personality' : 'Personalidade da IA',
    theme: isEn ? 'Theme' : 'Tema',
    language: isEn ? 'Language' : 'Idioma',
    male: isEn ? 'Male' : 'Masculino',
    female: isEn ? 'Female' : 'Feminino',
    other: isEn ? 'Other' : 'Outro',
    sedentary: isEn ? 'Sedentary' : 'Sedentário',
    light: isEn ? 'Light' : 'Leve',
    moderate: isEn ? 'Moderate' : 'Moderado',
    active: isEn ? 'Active' : 'Ativo',
    very_active: isEn ? 'Very Active' : 'Muito Ativo',
    motivational: isEn ? 'Motivational' : 'Motivacional',
    raiz: isEn ? 'Raiz (Hardcore)' : 'Raiz (Sem Filtro)',
    age: isEn ? 'Age' : 'Idade',
    height: isEn ? 'Height (cm)' : 'Altura (cm)',
    weight: isEn ? 'Weight (kg)' : 'Peso (kg)',
    fat: isEn ? '% Fat (Estimated by AI)' : '% Gordura (Estimado pela IA)',
    objective: isEn ? 'Objective' : 'Objetivo',
    sleep: isEn ? 'Sleep' : 'Sono',
    finance: isEn ? 'Financial Condition' : 'Condição Financeira',
    supplements: isEn ? 'Include Supplements' : 'Incluir Suplementos no Plano',
    level: isEn ? 'Training Level' : 'Nível de Treino',
    beginner: isEn ? 'Beginner' : 'Iniciante',
    intermediate: isEn ? 'Intermediate' : 'Intermediário',
    advanced: isEn ? 'Advanced' : 'Avançado'
  };

  useEffect(() => {
    fetchShapeHistory();
  }, []);

  const fetchShapeHistory = async () => {
    try {
      const res = await fetch('/api/shape/history', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setHistory(await res.json());
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const mandatory = ['age', 'height', 'weight', 'gender', 'activity_level', 'personality_mode'];
    const missing = mandatory.filter(f => {
      const val = formData[f as keyof ProfileType];
      return val === undefined || val === null || val === '';
    });

    if (missing.length > 0) {
      setError(t.mandatory);
      return;
    }

    const dataToSave = {
      ...formData,
      age: parseInt(formData.age.toString()) || 0,
      height: parseFloat(formData.height.toString()) || 0,
      weight: parseFloat(formData.weight.toString()) || 0,
      fat_percentage: parseFloat(formData.fat_percentage.toString()) || 0
    };

    onSave(dataToSave);
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <header className="flex flex-col gap-2">
        <h2 className="text-3xl font-display font-bold">{t.title}</h2>
        <p className="text-white/60">{t.subtitle}</p>
      </header>

      <div className="glass-card p-6 border-l-4 border-brand-red bg-brand-red/5">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black uppercase tracking-tighter">Status do Plano</h3>
              {user.is_premium ? (
                <span className="px-2 py-0.5 bg-brand-red text-white text-[10px] font-black rounded uppercase">Premium Elite</span>
              ) : (
                <span className="px-2 py-0.5 bg-white/10 text-white/40 text-[10px] font-black rounded uppercase">Plano Grátis</span>
              )}
            </div>
            <p className="text-xs text-white/60">
              {user.is_premium 
                ? 'Sua assinatura está ativa. Aproveite todos os recursos elite.' 
                : 'Você está no modo básico. Desbloqueie o potencial máximo.'}
            </p>
          </div>
          <button 
            onClick={() => setActiveTab('upgrade')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              user.is_premium ? 'bg-white/5 text-white/40 border border-white/10' : 'bg-brand-red text-white shadow-lg shadow-brand-red/20'
            }`}
          >
            {user.is_premium ? 'Ver Detalhes' : 'Fazer Upgrade'}
          </button>
        </div>
      </div>

      {/* Achievement Medals */}
      <div className="glass-card p-8">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Medal size={24} className="text-brand-red" />
          Medalhas de Conquista
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
          {[
            { label: 'Pioneiro', icon: Crown, color: 'text-yellow-500', unlocked: true },
            { label: '7 Dias', icon: Star, color: 'text-brand-red', unlocked: true },
            { label: 'Esmaga', icon: Dumbbell, color: 'text-blue-500', unlocked: true },
            { label: 'Chef Fit', icon: Utensils, color: 'text-orange-500', unlocked: false },
            { label: 'Persistente', icon: TrendingUp, color: 'text-emerald-500', unlocked: false },
            { label: 'Mestre IA', icon: BrainCircuit, color: 'text-purple-500', unlocked: false },
          ].map((medal, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${medal.unlocked ? 'bg-white/5 border-2 border-white/10 shadow-lg' : 'bg-black/40 grayscale opacity-20'}`}>
                <medal.icon size={28} className={medal.color} />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-tighter text-center ${medal.unlocked ? 'text-white' : 'text-white/20'}`}>
                {medal.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Simplified Profile Form */}
      <div className="glass-card p-8">
        <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
          <User size={24} className="text-brand-red" />
          {t.editData}
        </h3>
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 flex items-center gap-3">
            <AlertCircle size={20} />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-white/40">{t.weight} *</label>
              <input type="number" name="weight" value={formData.weight} onChange={handleChange} className="input-field w-full" required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-white/40">{t.height} *</label>
              <input type="number" name="height" value={formData.height} onChange={handleChange} className="input-field w-full" required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-white/40">{t.age} *</label>
              <input type="number" name="age" value={formData.age} onChange={handleChange} className="input-field w-full" required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-white/40">{t.gender} *</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="input-field w-full appearance-none" required>
                <option value="male">{t.male}</option>
                <option value="female">{t.female}</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-white/40">{t.activity} *</label>
              <select name="activity_level" value={formData.activity_level} onChange={handleChange} className="input-field w-full appearance-none" required>
                <option value="sedentary">{t.sedentary}</option>
                <option value="light">{t.light}</option>
                <option value="moderate">{t.moderate}</option>
                <option value="active">{t.active}</option>
                <option value="very_active">{t.very_active}</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-white/40">{t.level} *</label>
              <select name="training_level" value={formData.training_level} onChange={handleChange} className="input-field w-full appearance-none" required>
                <option value="beginner">{t.beginner}</option>
                <option value="intermediate">{t.intermediate}</option>
                <option value="advanced">{t.advanced}</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-white/40">{t.objective} *</label>
              <input 
                type="text" 
                name="objective" 
                value={formData.objective} 
                onChange={handleChange} 
                className="input-field w-full"
                required
                placeholder={isEn ? "Ex: Hypertrophy" : "Ex: Hipertrofia"}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-white/40">{t.sleep} (h)</label>
              <input type="number" name="sleep" value={formData.sleep} onChange={handleChange} className="input-field w-full" />
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-12 h-6 rounded-full p-1 transition-all ${formData.wants_supplements ? 'bg-brand-red' : 'bg-white/10'}`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-all ${formData.wants_supplements ? 'ml-6' : 'ml-0'}`} />
              </div>
              <input 
                type="checkbox" 
                name="wants_supplements" 
                checked={formData.wants_supplements} 
                onChange={(e) => setFormData(prev => ({ ...prev, wants_supplements: e.target.checked }))} 
                className="hidden" 
              />
              <span className="font-bold text-sm uppercase tracking-tight group-hover:text-brand-red transition-colors">{t.supplements}</span>
            </label>
          </div>

          <div className="pt-6 border-t border-white/5">
            <label className="text-xs font-bold uppercase text-white/40 mb-3 block">{isEn ? 'Rest Days' : 'Dias de Descanso'}</label>
            <div className="flex flex-wrap gap-2">
              {['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'].map(day => {
                const restDays = JSON.parse(formData.rest_days || '[]');
                const isRest = restDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      const newRest = isRest 
                        ? restDays.filter((d: string) => d !== day)
                        : [...restDays, day];
                      setFormData(prev => ({ ...prev, rest_days: JSON.stringify(newRest) }));
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${isRest ? 'bg-brand-red border-brand-red text-white' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center pt-8 border-t border-white/10">
            <div className="flex gap-4">
               <button type="button" onClick={onToggleLanguage} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all text-white/60">
                 <Globe size={20} />
               </button>
               <button type="button" onClick={onToggleTheme} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all text-white/60">
                 {user.theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
               </button>
            </div>
            <button type="submit" className="btn-primary px-8 py-3 flex items-center gap-2">
              {loading && <Loader2 className="animate-spin" size={18} />}
              {t.update}
            </button>
          </div>
        </form>
      </div>

      {/* Photo evolution summary */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Camera size={20} className="text-brand-red" />
          {isEn ? 'Visual Evolution' : 'Evolução Visual'}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="aspect-[3/4] bg-white/5 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden relative">
            {history.length > 0 ? (
              <img src={history[history.length - 1].image_data} alt="Start" className="w-full h-full object-cover grayscale opacity-50" referrerPolicy="no-referrer" />
            ) : (
              <div className="text-[10px] text-white/20">Sem histórico</div>
            )}
            <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-[8px] font-bold rounded uppercase">Início</span>
          </div>
          <div className="aspect-[3/4] bg-white/5 rounded-xl border border-brand-red/30 flex items-center justify-center overflow-hidden relative">
            {history.length > 0 ? (
              <img src={history[0].image_data} alt="Current" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="text-[10px] text-white/20">Sem histórico</div>
            )}
            <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-brand-red text-[8px] font-bold rounded uppercase font-black tracking-tighter">Hoje</span>
          </div>
        </div>
      </div>
    </div>
  );
}
