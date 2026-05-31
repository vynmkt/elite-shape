import React, { useState, useEffect } from 'react';
import { Utensils, Apple, Calculator, MessageSquare, Crown, Camera, Loader2, Send, Plus, History, TrendingUp, ChefHat, Pill, Brain, Droplets } from 'lucide-react';
import Markdown from 'react-markdown';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { calculateBMR, getMacros } from '../utils/fitness';
import { Plans } from '../types';


interface NutritionProps {
  plans: Plans;
  user: any;
  profile: any;
  onNavigate?: (tab: any) => void;
}

interface Meal {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp: string;
}

export default function Nutrition({ plans, user, profile, onNavigate }: NutritionProps) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [manualMeal, setManualMeal] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  
  const [chatInput, setChatInput] = useState('');
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [macroPreview, setMacroPreview] = useState<string | null>(null);
  const [macroResult, setMacroResult] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<string | null>(null);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [isSupplementsOpen, setIsSupplementsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'daily' | 'plan'>('plan');
  const [water, setWater] = useState(0);
  const [addWaterAmount, setAddWaterAmount] = useState('');
  const [swappingId, setSwappingId] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const days = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    return days[new Date().getDay()];
  });

  const DAYS = [
    { id: 'segunda', label: 'SEG' },
    { id: 'terça', label: 'TER' },
    { id: 'quarta', label: 'QUA' },
    { id: 'quinta', label: 'QUI' },
    { id: 'sexta', label: 'SEX' },
    { id: 'sábado', label: 'SAB' },
    { id: 'domingo', label: 'DOM' }
  ];

  useEffect(() => {
    fetchDailyMeals();
    fetchWater();
  }, []);

  const fetchWater = async () => {
    try {
      const res = await fetch('/api/water/daily', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWater(data.total);
      }
    } catch (e) { console.error(e); }
  };

  const handleAddWater = async () => {
    const amount = parseInt(addWaterAmount);
    if (isNaN(amount)) return;
    try {
      const res = await fetch('/api/water', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ amount })
      });
      if (res.ok) {
        setWater(prev => prev + amount);
        setAddWaterAmount('');
      }
    } catch (e) { console.error(e); }
  };

  const fetchDailyMeals = async () => {
    try {
      const res = await fetch('/api/nutrition/daily', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) setMeals(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleAddManualMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Use AI to parse the meal description
      const aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await aiInstance.models.generateContent({
        model: "gemini-flash-latest",
        contents: [{
          parts: [{ text: `Analise esta refeição e quantidade: "${manualMeal.name}". Retorne APENAS um JSON com: { name, calories, protein, carbs, fat }. Seja preciso e realista. Se o usuário não especificou quantidade, use porções padrão.` }]
        }],
      });
      const mealData = JSON.parse(response.text.replace(/```json|```/g, '').trim());

      const res = await fetch('/api/nutrition/meal', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(mealData)
      });
      if (res.ok) {
        setShowAddMeal(false);
        setManualMeal({ name: '', calories: '', protein: '', carbs: '', fat: '' });
        await fetchDailyMeals();
      }
    } catch (e) { 
      console.error(e); 
      alert(isEn ? "Error analyzing meal. Please try again." : "Erro ao analisar refeição. Tente novamente.");
    }
    finally { setLoading(false); }
  };

  const handleMacroCalc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user.is_premium) return;
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 200 * 1024 * 1024) {
        setMacroResult(isEn ? "File too large. Max 200MB." : "Arquivo muito grande. Máximo 200MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setMacroPreview(reader.result as string);
      reader.readAsDataURL(file);
      
      setLoading(true);
      try {
        const base64Data = (await new Promise((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve((r.result as string).split(',')[1]);
          r.readAsDataURL(file);
        })) as string;

        const aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await aiInstance.models.generateContent({
          model: "gemini-flash-latest",
          contents: [{
            parts: [
              { text: "Analise esta foto de comida e retorne APENAS um JSON com: { name, calories, protein, carbs, fat }. Seja preciso." },
              { inlineData: { data: base64Data, mimeType: file.type } }
            ]
          }],
        });
        
        const result = JSON.parse(response.text.replace(/```json|```/g, '').trim());
        setMacroResult(`Identificado: ${result.name}. Macros: P:${result.protein}g, C:${result.carbs}g, G:${result.fat}g. Cal:${result.calories}`);
        
        // Automatically add the meal
        await fetch('/api/nutrition/meal', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(result)
        });
        await fetchDailyMeals();
      } catch (e) {
        console.error(e);
        setMacroResult("Erro ao analisar imagem. Tente manualmente.");
      } finally {
        setLoading(false);
      }
    }
  };

  const isEn = user.language === 'en';

  const t = {
    title: isEn ? 'NUTRITION' : 'DIÁRIO',
    subtitle: isEn ? 'Track your macros in real-time.' : 'Acompanhe seus macros em tempo real.',
    addMeal: isEn ? 'ADD MEAL' : 'ADICIONAR REFEIÇÃO',
    protein: isEn ? 'Protein' : 'Proteína',
    carbs: isEn ? 'Carbs' : 'Carboidratos',
    fat: isEn ? 'Fat' : 'Gorduras',
    calories: isEn ? 'Calories' : 'Calorias',
    goal: isEn ? 'Goal' : 'Meta',
    todayMeals: isEn ? 'Today\'s Meals' : 'Refeições de Hoje',
    noMeals: isEn ? 'No meals logged today.' : 'Nenhuma refeição registrada hoje.',
    analysis: isEn ? 'Plate Analysis' : 'Análise de Prato',
    photoMacros: isEn ? 'Macros by Photo' : 'Macros por Foto',
    premiumOnly: isEn ? 'Premium Exclusive' : 'Exclusivo Premium',
    subscribe: isEn ? 'SUBSCRIBE NOW' : 'ASSINAR AGORA',
    takePhoto: isEn ? 'Take a photo of your plate' : 'Tire foto do seu prato',
    recommended: isEn ? 'Recommended Plan' : 'Plano Recomendado',
    noPlan: isEn ? 'No plan generated yet.' : 'Nenhum plano gerado ainda.',
    mealName: isEn ? 'Meal Name' : 'Nome da Refeição',
    save: isEn ? 'SAVE' : 'SALVAR',
    cancel: isEn ? 'CANCEL' : 'CANCELAR'
  };

  // Calculate Daily Totals
  const totals = React.useMemo(() => {
    return meals.reduce((acc, meal) => ({
      calories: acc.calories + (Number(meal.calories) || 0),
      protein: acc.protein + (Number(meal.protein) || 0),
      carbs: acc.carbs + (Number(meal.carbs) || 0),
      fat: acc.fat + (Number(meal.fat) || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [meals]);

  const tdee = calculateBMR(profile);
  const defaultGoals = getMacros(tdee, profile.objective, profile.weight);
  
  const goals = {
    calories: plans.target_calories || defaultGoals.calories,
    protein: plans.target_protein || defaultGoals.protein,
    carbs: plans.target_carbs || defaultGoals.carbs,
    fat: plans.target_fat || defaultGoals.fat,
    water: Math.round(profile.weight * 35) // 35ml per kg
  };

  const parsedSchedule = plans.nutrition_schedule ? JSON.parse(plans.nutrition_schedule) : null;
  
  // Handlers for legacy and new structure
  const currentDayMeals = React.useMemo(() => {
    if (!parsedSchedule) return null;
    if (Array.isArray(parsedSchedule)) return parsedSchedule; // Legacy support
    return parsedSchedule[selectedDay] || [];
  }, [parsedSchedule, selectedDay]);

  const dailyGoals = React.useMemo(() => {
    if (!currentDayMeals || currentDayMeals.length === 0) return goals;
    const dayCalories = currentDayMeals.reduce((sum: number, m: any) => sum + (m.calories || 0), 0);
    const dayProtein = currentDayMeals.reduce((sum: number, m: any) => sum + (m.protein || 0), 0);
    const dayCarbs = currentDayMeals.reduce((sum: number, m: any) => sum + (m.carbs || 0), 0);
    const dayFat = currentDayMeals.reduce((sum: number, m: any) => sum + (m.fat || 0), 0);
    
    // If it's a structured schedule, use the calculated values for better precision in carb cycling
    return {
      ...goals,
      calories: Math.round(dayCalories) || goals.calories,
      protein: Math.round(dayProtein) || goals.protein,
      carbs: Math.round(dayCarbs) || goals.carbs,
      fat: Math.round(dayFat) || goals.fat
    };
  }, [currentDayMeals, goals]);

  const suggestRecipe = async () => {
    setRecipeLoading(true);
    try {
      const prompt = `
        Sugira uma receita "Fit & Cheat" deliciosa (ex: coxinha fit na airfryer, brigadeiro de whey, pizza de aveia, etc.) baseada nestes macros alvo para uma refeição:
        Calorias: ${Math.round(dailyGoals.calories / 5)} kcal
        Proteína: ${Math.round(dailyGoals.protein / 5)}g
        Carbo: ${Math.round(dailyGoals.carbs / 5)}g
        Gordura: ${Math.round(dailyGoals.fat / 5)}g
        
        A receita deve ser MUITO gostosa, usando técnicas saudáveis (Airfryer, ingredientes integrais, substitutos de açúcar).
        Responda em Português (Brasil) usando Markdown.
      `;
      const aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await aiInstance.models.generateContent({
        model: "gemini-flash-latest",
        contents: [{ parts: [{ text: prompt }] }],
      });
      setRecipe(response.text);
    } catch (e) {
      console.error(e);
      setRecipe("Erro ao sugerir receita. Tente novamente.");
    } finally {
      setRecipeLoading(false);
    }
  };

  const handleSwapMeal = async (mealIndex: number) => {
    if (!user.is_premium || !plans.nutrition_schedule) return;
    
    const swapRequest = prompt(isEn ? "What do you want to change in this meal? (e.g., change fish to chicken)" : "O que você quer mudar nesta refeição? (ex: trocar peixe por frango)");
    if (!swapRequest) return;

    setSwappingId(mealIndex);
    try {
      const schedule = JSON.parse(plans.nutrition_schedule);
      const currentMeal = schedule[mealIndex];
      
      const promptText = `
        Sugira uma alternativa saudável com macros SIMILARES para a refeição "${currentMeal.name}".
        Pedido do usuário: "${swapRequest}"
        Macros atuais da refeição: P:${currentMeal.protein}g, C:${currentMeal.carbs}g, G:${currentMeal.fat}g, Cal:${currentMeal.calories}
        
        RETORNE APENAS JSON:
        { "name": "string", "time": "string", "items": ["string"], "calories": number, "protein": number, "carbs": number, "fat": number }
      `;

      const aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await aiInstance.models.generateContent({
        model: "gemini-flash-latest",
        contents: [{ parts: [{ text: promptText }] }],
      });
      
      const newMeal = JSON.parse(response.text.replace(/```json|```/g, '').trim());
      schedule[mealIndex] = newMeal;
      
      // Update backend and state
      await fetch('/api/plans', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ...plans, nutrition_schedule: JSON.stringify(schedule) })
      });
      
      window.location.reload(); // Simple way to refresh plans for now or update via context if available
    } catch (e) {
      console.error(e);
      alert(isEn ? "Error swapping meal." : "Erro ao trocar refeição.");
    } finally {
      setSwappingId(null);
    }
  };

  const ProgressBar = ({ label, current, goal, color }: { label: string, current: number, goal: number, color: string }) => {
    const percent = Math.min(Math.round((current / goal) * 100), 100);
    const isOver = current > goal;
    const barColor = isOver ? 'bg-red-500' : (percent > 90 ? 'bg-yellow-500' : color);

    return (
      <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
          <span className="text-white/40">{label}</span>
          <span>{Math.round(current)} / {Math.round(goal)} <span className={isOver ? 'text-red-500' : 'text-white/20'}>({percent}%)</span></span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            className={`h-full ${barColor} shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-all duration-500`}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold mb-2 uppercase tracking-tight">{t.title}</h2>
          <p className="text-white/60">{t.subtitle}</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => setActiveTab('daily')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'daily' ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20' : 'text-white/40 hover:text-white'}`}
            >
              {isEn ? 'Daily Log' : 'Diário'}
            </button>
            <button 
              onClick={() => setActiveTab('plan')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'plan' ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20' : 'text-white/40 hover:text-white'}`}
            >
              {isEn ? 'Elite Plan' : 'Plano Elite'}
            </button>
          </div>
          <button 
            onClick={() => setShowAddMeal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            {t.addMeal}
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'daily' ? (
          <motion.div 
            key="daily"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Daily Progress Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1 glass-card p-6 flex flex-col justify-center items-center text-center">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
                      strokeDasharray={364}
                      strokeDashoffset={364 - (364 * Math.min(totals.calories / dailyGoals.calories, 1))}
                      className="text-brand-red transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">{Math.round(totals.calories)}</span>
                    <span className="text-[10px] text-white/40 uppercase font-bold">KCAL</span>
                  </div>
                </div>
                <p className="mt-4 text-[10px] font-black text-white/40 uppercase tracking-widest">{isEn ? 'DAILY GOAL' : 'META DIÁRIA'}: {Math.round(dailyGoals.calories)} kcal</p>
              </div>

              <div className="md:col-span-3 glass-card p-8 space-y-6">
                <ProgressBar label={t.protein} current={totals.protein} goal={dailyGoals.protein} color="bg-brand-red" />
                <ProgressBar label={t.carbs} current={totals.carbs} goal={dailyGoals.carbs} color="bg-blue-500" />
                <ProgressBar label={t.fat} current={totals.fat} goal={dailyGoals.fat} color="bg-yellow-500" />
                
                <div className="pt-4 border-t border-white/5">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <Droplets className="text-blue-400" size={20} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{isEn ? 'Water Intake' : 'Consumo de Água'}</span>
                    </div>
                    <span className="text-sm font-bold">{water} / {goals.water} ml</span>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      placeholder="ml"
                      value={addWaterAmount}
                      onChange={(e) => setAddWaterAmount(e.target.value)}
                      className="input-field py-2 text-sm w-24"
                    />
                    <button 
                      onClick={handleAddWater}
                      className="btn-secondary py-2 px-4 text-xs flex items-center gap-2 border-blue-500/20 text-blue-400"
                    >
                      <Plus size={14} />
                      {isEn ? 'ADD' : 'ADD'}
                    </button>
                    <div className="flex-1 h-10 bg-white/5 rounded-xl overflow-hidden relative">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((water / goals.water) * 100, 100)}%` }}
                        className="h-full bg-blue-500/40"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Meals */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center gap-2 text-lg font-bold">
                  <History size={20} className="text-brand-red" />
                  {t.todayMeals}
                </div>
                <div className="space-y-4">
                  {meals.length === 0 ? (
                    <div className="glass-card p-12 text-center text-white/20">
                      {t.noMeals}
                    </div>
                  ) : (
                    meals.map((meal) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={meal.id} 
                        className="glass-card p-4 flex items-center justify-between"
                      >
                        <div>
                          <h4 className="font-bold">{meal.name}</h4>
                          <p className="text-xs text-white/40">{new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div className="flex gap-4 text-right">
                          <div className="text-center">
                            <p className="text-xs font-bold">{Math.round(meal.protein)}g</p>
                            <p className="text-[8px] text-white/40 uppercase">Prot</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-bold">{Math.round(meal.carbs)}g</p>
                            <p className="text-[8px] text-white/40 uppercase">Carb</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-bold">{Math.round(meal.fat)}g</p>
                            <p className="text-[8px] text-white/40 uppercase">Gord</p>
                          </div>
                          <div className="text-center border-l border-white/10 pl-4">
                            <p className="text-xs font-bold text-brand-red">{Math.round(meal.calories)}</p>
                            <p className="text-[8px] text-white/40 uppercase">Kcal</p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              {/* AI Tools */}
              <div className="space-y-6">
                <div className="glass-card p-6 relative overflow-hidden">
                  {!user.is_premium && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
                      <Crown className="text-brand-red mb-2" size={32} />
                      <h4 className="font-bold mb-1">{t.photoMacros}</h4>
                      <p className="text-[10px] text-white/60 uppercase tracking-widest mb-4">{t.premiumOnly}</p>
                      <button className="btn-primary py-2 px-4 text-xs">{t.subscribe}</button>
                    </div>
                  )}
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Camera size={20} className="text-brand-red" />
                    {t.analysis}
                  </h3>
                  <div className="space-y-4">
                    <div className="aspect-video bg-white/5 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center relative overflow-hidden">
                      {macroPreview ? (
                        <img src={macroPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-4">
                          <Camera size={24} className="text-white/20 mx-auto mb-2" />
                          <p className="text-[10px] text-white/40">{t.takePhoto}</p>
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleMacroCalc}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                    {loading && <div className="flex justify-center"><Loader2 className="animate-spin text-brand-red" /></div>}
                    {macroResult && (
                      <div className="p-4 bg-brand-red/10 border border-brand-red/20 rounded-xl text-xs text-brand-red font-bold">
                        {macroResult}
                      </div>
                    )}
                  </div>
                </div>

                <div className="glass-card p-6">
                  <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                    <ChefHat size={18} className="text-brand-red" />
                    {isEn ? 'SUGGEST RECIPE' : 'SUGERIR RECEITA FIT'}
                  </h4>
                  <button 
                    onClick={suggestRecipe}
                    disabled={recipeLoading}
                    className="w-full btn-secondary py-2 text-xs flex items-center justify-center gap-2"
                  >
                    {recipeLoading ? <Loader2 className="animate-spin" size={16} /> : <ChefHat size={16} />}
                    {isEn ? 'GENERATE RECIPE' : 'GERAR RECEITA AGORA'}
                  </button>
                  
                  {recipe && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 p-4 bg-white/5 rounded-xl text-xs prose prose-invert prose-xs max-h-60 overflow-y-auto"
                    >
                      <Markdown>{recipe}</Markdown>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="plan"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Quick Strategy Header */}
            <div className="glass-card p-6 border-l-4 border-brand-red bg-gradient-to-br from-brand-red/10 to-transparent">
              <h3 className="text-xl font-display font-bold uppercase mb-2 flex items-center gap-2">
                <Brain size={20} className="text-brand-red" />
                {isEn ? 'Elite Strategy' : 'Estratégia do Coach'}
              </h3>
              <p className="text-sm text-white/70 leading-relaxed max-w-3xl">
                {plans.nutrition_plan || t.noPlan}
              </p>
            </div>

            {/* Target Macros Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card p-4 text-center">
                <p className="text-[10px] text-white/40 uppercase font-black mb-1">{selectedDay} (Kcal)</p>
                <p className="text-xl font-display font-bold text-brand-red">{dailyGoals.calories}</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-[10px] text-white/40 uppercase font-black mb-1">Proteínas</p>
                <p className="text-xl font-display font-bold text-brand-red">{dailyGoals.protein}g</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-[10px] text-white/40 uppercase font-black mb-1">Carbos</p>
                <p className="text-xl font-display font-bold text-brand-red">{dailyGoals.carbs}g</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-[10px] text-white/40 uppercase font-black mb-1">Gorduras</p>
                <p className="text-xl font-display font-bold text-brand-red">{dailyGoals.fat}g</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex flex-wrap gap-2 justify-center">
                {DAYS.map(day => (
                  <button
                    key={day.id}
                    onClick={() => setSelectedDay(day.id)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      selectedDay === day.id 
                        ? 'bg-brand-red border-brand-red text-white shadow-lg shadow-brand-red/20' 
                        : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-display font-bold uppercase flex items-center gap-2 px-2">
                  <Utensils size={20} className="text-brand-red" />
                  {isEn ? `Meals for ${selectedDay}` : `Refeições de ${selectedDay}`}
                </h3>
                {currentDayMeals ? (
                  currentDayMeals.map((meal: any, idx: number) => (
                    <motion.div 
                      key={`${selectedDay}-${idx}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="glass-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-brand-red/30 transition-all group"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-brand-red font-display font-bold text-lg group-hover:bg-brand-red group-hover:text-white transition-colors">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold uppercase tracking-tight">{meal.name}</h3>
                            <span className="text-[10px] font-black bg-brand-red/10 text-brand-red px-2 py-0.5 rounded uppercase">{meal.time}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {meal.items.map((item: string, i: number) => (
                              <span key={i} className="text-xs text-white/60 bg-white/5 px-2 py-1 rounded border border-white/5">• {item}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 self-end md:self-auto">
                        <div className="text-right">
                          <p className="text-sm font-bold">{meal.calories} kcal</p>
                          <p className="text-[10px] text-white/20 uppercase font-black">P:{meal.protein}g C:{meal.carbs}g G:{meal.fat}g</p>
                        </div>
                        {user.is_premium && (
                          <button 
                            onClick={() => handleSwapMeal(idx)}
                            disabled={swappingId === idx}
                            title={isEn ? "Swap Meal/Food" : "Trocar Alimento/Refeição"}
                            className="p-3 bg-white/5 hover:bg-brand-red hover:text-white rounded-xl transition-all text-white/20"
                          >
                            {swappingId === idx ? <Loader2 size={20} className="animate-spin" /> : <TrendingUp size={20} />}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="glass-card p-12 text-center text-white/40 flex flex-col items-center gap-4">
                    <Utensils size={48} className="opacity-10" />
                    <p>{t.noPlan}</p>
                    <button 
                      onClick={() => onNavigate?.('coach')}
                      className="btn-primary"
                    >
                      {isEn ? 'GENERATE MY DIET' : 'GERAR MINHA DIETA ELITE'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={() => setIsSupplementsOpen(true)}
              className="w-full btn-secondary py-4 flex items-center justify-center gap-2 border-blue-500/20 text-blue-500 hover:bg-blue-500/5 group"
            >
              <Pill size={20} className="group-hover:rotate-12 transition-transform" />
              {isEn ? 'SUPPLEMENTS GUIDE' : 'VER MEU GUIA DE SUPLEMENTOS'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Meal Modal */}
      <AnimatePresence>
        {showAddMeal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card w-full max-w-md p-8"
            >
              <h3 className="text-2xl font-display font-bold mb-6">{isEn ? 'ADD' : 'ADICIONAR'} <span className="text-brand-red">{isEn ? 'MEAL' : 'REFEIÇÃO'}</span></h3>
              <form onSubmit={handleAddManualMeal} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-white/40">{isEn ? 'What did you eat?' : 'O que você comeu?'}</label>
                  <textarea 
                    required
                    value={manualMeal.name}
                    onChange={(e) => setManualMeal({ ...manualMeal, name: e.target.value })}
                    className="input-field w-full h-24 resize-none" 
                    placeholder={isEn ? "Ex: 100g rice, 150g grilled chicken and salad" : "Ex: 100g de arroz, 150g de frango grelhado e salada"}
                  />
                  <p className="text-[10px] text-white/40 italic">
                    {isEn ? "AI will calculate macros automatically based on your description." : "A IA calculará os macros automaticamente baseada na sua descrição."}
                  </p>
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddMeal(false)}
                    className="flex-1 btn-secondary"
                  >
                    {t.cancel}
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-1 btn-primary"
                  >
                    {loading ? <Loader2 className="animate-spin mx-auto" /> : t.save}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Supplements Modal */}
      {isSupplementsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Pill size={28} className="text-blue-500" />
                {isEn ? 'Elite Supplements' : 'Suplementação Elite'}
              </h3>
              <button onClick={() => setIsSupplementsOpen(false)} className="text-white/40 hover:text-white">✕</button>
            </div>
            
            <div className="space-y-6">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-sm text-blue-200">
                  {isEn 
                    ? "Based on your profile and goals, here is your recommended supplement stack. Remember: supplements are the 'cherry on top', focus on diet first!" 
                    : "Baseado no seu perfil e objetivos, aqui está seu stack de suplementos recomendado. Lembre-se: suplementos são a 'cereja do bolo', foque na dieta primeiro!"}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <h4 className="font-bold text-blue-500 mb-2">Whey Protein</h4>
                  <p className="text-xs text-white/60">{isEn ? 'Essential for muscle repair. Take post-workout or to hit protein goals.' : 'Essencial para reparo muscular. Tome pós-treino ou para bater metas de proteína.'}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <h4 className="font-bold text-blue-500 mb-2">Creatina</h4>
                  <p className="text-xs text-white/60">{isEn ? 'The most studied supplement. 3-5g daily for strength and volume.' : 'O suplemento mais estudado. 3-5g diários para força e volume.'}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <h4 className="font-bold text-blue-500 mb-2">Multivitamínico</h4>
                  <p className="text-xs text-white/60">{isEn ? 'Ensures micronutrient balance for optimal recovery.' : 'Garante o balanço de micronutrientes para recuperação otimizada.'}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <h4 className="font-bold text-blue-500 mb-2">Cafeína / Pré-Treino</h4>
                  <p className="text-xs text-white/60">{isEn ? 'Use strategically for high-intensity sessions.' : 'Use estrategicamente para sessões de alta intensidade.'}</p>
                </div>
              </div>

              <div className="p-6 glass-card border-brand-red/20">
                <h4 className="font-bold mb-4 flex items-center gap-2">
                  <Brain size={18} className="text-brand-red" />
                  {isEn ? 'AI Custom Stack' : 'Stack Personalizado por IA'}
                </h4>
                <p className="text-sm text-white/60 leading-relaxed">
                  {isEn 
                    ? `For your goal of ${profile.objective}, I recommend focusing on Creatine (5g/day) and Omega-3 to reduce inflammation. Since you train at ${profile.training_time}, avoid caffeine 6 hours before sleep.`
                    : `Para seu objetivo de ${profile.objective}, recomendo focar em Creatina (5g/dia) e Ômega-3 para reduzir inflamação. Como você treina às ${profile.training_time}, evite cafeína 6 horas antes de dormir.`}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
