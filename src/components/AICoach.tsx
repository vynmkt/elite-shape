import React, { useState, useEffect } from 'react';
import { calculateBMR } from '../utils/fitness';
import { Camera, Video, Send, Loader2, AlertCircle, CheckCircle2, Info, BrainCircuit, History, TrendingUp, ChevronRight, ChevronLeft, Trash2, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { ShapeAnalysis } from '../types';
import { aiService } from '../services/aiService';


interface AICoachProps {
  user: any;
  profile: any;
  onUpdatePlans: (training: string, nutrition: string, analysis: string, targets?: any, schedule?: any, nutrition_schedule?: any) => void;
  onUpdateProfile: (data: any) => void;
  mode?: 'analysis' | 'chat';
}

export default function AICoach({ user, profile, onUpdatePlans, onUpdateProfile, mode = 'analysis' }: AICoachProps) {
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'analysis' | 'evolution' | 'chat'| 'execution'>(mode === 'chat' ? 'chat' : 'analysis');
  const [history, setHistory] = useState<ShapeAnalysis[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<ShapeAnalysis | null>(null);
  const [compareSelection, setCompareSelection] = useState<number[]>([]);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    setActiveTab(mode === 'chat' ? 'chat' : 'analysis');
  }, [mode]);

  const deleteHistoryItem = async (id: number) => {
    try {
      const res = await fetch(`/api/shape/history/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setHistory(prev => prev.filter(item => item.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isEn = user.language === 'en';

  const POSE_GUIDE = [
    { id: 'front_double_biceps', name: isEn ? 'Front Double Biceps' : 'Duplo Bíceps Frente', url: 'https://i.imgur.com/142iNPG.png' },
    { id: 'front_lat_spread', name: isEn ? 'Front Lat Spread' : 'Expansão de Dorsal Frente', url: 'https://i.imgur.com/Vi6WyhV.jpeg' },
    { id: 'side_chest', name: isEn ? 'Side Chest' : 'Melhor Lado (Peitoral)', url: 'https://i.imgur.com/TCeJq7B.jpeg' },
    { id: 'back_double_biceps', name: isEn ? 'Back Double Biceps' : 'Duplo Bíceps Costas', url: 'https://i.imgur.com/BqQeLhf.jpeg' },
    { id: 'back_lat_spread', name: isEn ? 'Back Lat Spread' : 'Expansão de Dorsal Costas', url: 'https://i.imgur.com/OaBWAxY.jpeg' },
  ];

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (activeTab === 'evolution') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/shape/history', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) setHistory(await res.json());
    } catch (e) { console.error(e); }
  };

  const t = {
    title: isEn ? 'BODY ANALYSIS' : 'ANÁLISE CORPORAL',
    subtitle: isEn ? 'Your elite team is ready to analyze your progress.' : 'Sua equipe de elite está pronta para analisar seu progresso.',
    visual: isEn ? 'Shape Analysis' : 'Análise de Shape',
    evolution: isEn ? 'Evolution' : 'Evolução',
    execution: isEn ? 'Real-time Execution' : 'Execução Real',
    chat: isEn ? 'Coach Chat' : 'Chat com Coach',
    drag: isEn ? 'Drag or click to send shape photos (up to 5)' : 'Arraste ou clique para enviar fotos do shape (até 5)',
    changeFile: isEn ? 'Add/Change Photos' : 'Adicionar/Trocar Fotos',
    premiumAlert: isEn ? 'PREMIUM: Photo analysis locked.' : 'PREMIUM: Análise de fotos bloqueada.',
    analyzing: isEn ? 'ANALYZING...' : 'ANALISANDO...',
    request: isEn ? 'GENERATE ELITE PLAN' : 'GERAR MEU PLANO ELITE',
    roast: isEn ? 'ROAST MY SHAPE (VIRAL)' : 'ZOE MEU SHAPE (VIRAL)',
    tips: isEn ? 'Coach Tips' : 'Dicas do Coach',
    tip1: isEn ? 'Send photos on an empty stomach for better fat analysis.' : 'Envie fotos em jejum para melhor análise de gordura.',
    tip2: isEn ? 'Use consistent lighting and poses for evolution tracking.' : 'Use iluminação e poses consistentes para acompanhar a evolução.',
    tip3: isEn ? 'Be honest in profile data for real results.' : 'Seja honesto nos dados do perfil para resultados reais.',
    waiting: isEn ? 'Waiting for Data' : 'Aguardando Dados',
    waitingDesc: isEn ? 'Fill your profile and click "Request Analysis" to receive your elite planning.' : 'Preencha seu perfil e clique em "Solicitar Análise" para receber seu planejamento de elite.',
    errorAnalysis: isEn ? 'Error processing analysis. Check your connection or try again.' : 'Erro ao processar análise. Verifique sua conexão ou tente novamente.',
    premiumRequired: isEn ? 'Image upload available only in the PREMIUM plan.' : 'Envio de imagens disponível apenas no plano PREMIUM.',
    missingFields: isEn ? 'Please fill the mandatory fields in your profile: ' : 'Por favor, preencha os campos obrigatórios no seu perfil: '
  };

  const processFile = (file: File): Promise<{ data: string, mimeType: string }> => {
    return new Promise((resolve, reject) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxDimension = 1000;

            if (width > height) {
              if (width > maxDimension) {
                height *= maxDimension / width;
                width = maxDimension;
              }
            } else {
              if (height > maxDimension) {
                width *= maxDimension / height;
                height = maxDimension;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
            const base64 = dataUrl.split(',')[1];
            resolve({ data: base64, mimeType: 'image/jpeg' });
          };
          img.onerror = reject;
          img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          const base64 = dataUrl.split(',')[1];
          resolve({ data: base64, mimeType: file.type });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      } else {
        reject(new Error("Unsupported file type"));
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      const isVideo = selectedFiles.some(f => f.type.startsWith('video/'));
      const isImage = selectedFiles.every(f => f.type.startsWith('image/'));
      
      if (!user.is_premium) {
        if (isVideo) {
          setError(isEn ? "Video analysis is a PREMIUM feature." : "Análise de vídeo é um recurso PREMIUM.");
          return;
        }
        if (isImage && (history.length >= 1 || selectedFiles.length > 1)) {
          setError(isEn ? "Free plan allows only 1 photo analysis. Upgrade to PREMIUM for unlimited access and multi-photo support." : "O plano gratuito permite apenas 1 análise por foto. Assine o PREMIUM para acesso ilimitado e suporte a múltiplas fotos.");
          return;
        }
      }

      const limit = user.is_premium ? 5 : 1;
      const newFiles = [...files, ...selectedFiles].slice(0, limit);
      setFiles(newFiles);

      const newPreviews: string[] = [];
      let loaded = 0;
      newFiles.forEach(f => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          loaded++;
          if (loaded === newFiles.length) {
            setPreviews(newPreviews);
          }
        };
        reader.readAsDataURL(f);
      });
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    
    const userMessage = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setChatLoading(true);

    try {
      const lastAnalysis = history.length > 0 ? history[0].analysis : 'Nenhuma análise anterior disponível.';
      const systemInstruction = `
        Você é o ELITE COACH AI. O treinador mais direto e eficiente do mundo.
        
        REGRAS DE OURO:
        1. Respostas CURTAS e OBJETIVAS. No máximo 2 parágrafos pequenos.
        2. Linguagem Simples: Explique de forma acessível para leigos, sem enrolação técnica desnecessária.
        3. Foco em Ação: Diga exatamente o que fazer.
        
        ADAPTAÇÃO POR NÍVEL (${profile.training_level}):
        - Iniciante: NUNCA sugira técnicas avançadas (Dropset, Bi-set, Ciclo de Carboidratos). Foque no básico que funciona.
        - Intermediário/Avançado: Pode usar técnicas de intensidade.
        
        CONTEXTO: Objetivo: ${profile.objective}, Peso: ${profile.weight}kg.
      `;

      const prompt = `Histórico de conversa:\n${chatMessages.map(m => `${m.role === 'user' ? 'Usuário' : 'Coach'}: ${m.text}`).join('\n')}\nUsuário: ${userMessage}`;

      const aiText = await aiService.generateContent({
        prompt,
        systemInstruction
      });

      setChatMessages(prev => [...prev, { role: 'model', text: aiText || "Desculpe, não consegui processar sua resposta." }]);
    } catch (e) {
      console.error(e);
      setChatMessages(prev => [...prev, { role: 'model', text: "Erro ao conectar com o Coach. Tente novamente." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const runAnalysis = async () => {
    if (files.length === 0) {
      setError(isEn ? "Please select at least one photo." : "Por favor, selecione pelo menos uma foto.");
      return;
    }
    if (files.some(f => f.size > 200 * 1024 * 1024)) {
      setError(isEn ? "File too large. Max 200MB per file." : "Arquivo muito grande. Máximo 200MB por arquivo.");
      return;
    }

    if (!user.is_premium) {
      const isVideo = files.some(f => f.type.startsWith('video/'));
      const isImage = files.every(f => f.type.startsWith('image/'));
      
      if (isVideo) {
        setError(isEn ? "Video analysis is a PREMIUM feature." : "Análise de vídeo é um recurso PREMIUM.");
        return;
      }
      if (isImage && (history.length >= 1 || files.length > 1)) {
        setError(isEn ? "Free plan allows only 1 photo analysis. Upgrade to PREMIUM for unlimited access." : "O plano gratuito permite apenas 1 análise por foto. Assine o PREMIUM para acesso ilimitado.");
        return;
      }
    }

    const mandatoryFields = ['age', 'height', 'weight', 'activity_level', 'gender'];
    const missingFields = mandatoryFields.filter(f => {
      const val = profile[f];
      return val === undefined || val === null || val === '';
    });

    if (missingFields.length > 0) {
      setError(`${t.missingFields}${missingFields.join(', ')}`);
      return;
    }

    setLoading(true);
    setProcessing(true);
    setError(null);

    try {
      const tdee = calculateBMR(profile);
      const isRaiz = profile.personality_mode === 'raiz';
      const lang = user.language || 'pt';
      const isVideoInput = files.some(f => f.type.startsWith('video/'));

      const prompt = isVideoInput ? `
        Você é um ESPECIALISTA EM BIOMECÂNICA E TREINADOR DE ELITE.
        Analise o VÍDEO de execução de exercício enviado pelo atleta.
        
        TAREFA:
        1. Identifique o exercício sendo realizado.
        2. Analise a técnica: Amplitude, Velocidade (cadência), Estabilidade e Postura.
        3. Aponte erros críticos que podem causar lesão.
        4. Dê 3 dicas práticas para melhorar a execução IMEDIATAMENTE.
        
        Responda em Markdown, use uma linguagem incentivadora mas técnica.
        Seja direto e foque no movimento.
      ` : `
        Crie um plano de performance ELITE EXTREMAMENTE DETALHADO para um atleta ${profile.training_level}.
        
        REGRAS POR NÍVEL (${profile.training_level}):
        - SE INICIANTE: Foco em execução e constância. Sem técnicas de intensidade que possam causar lesão. Dieta limpa e básica.
        - SE INTERMEDIÁRIO/AVANÇADO: Use técnicas como Dropsets, Rest-pause e periodização de carga para quebrar platôs.

        REGRAS DE DESCANSO (CRITICAL):
        - Exercícios Compostos/Pesados (Agachamento, Supino, Terra, Remadas): 120s a 180s de descanso.
        - Exercícios de Isolamento (Rosca, Extensora, Lateral, etc): 60s a 90s de descanso.
        - NUNCA use o mesmo tempo de descanso para todos os exercícios.

        DADOS: Objetivo: ${profile.objective}, TMB: ${tdee} kcal.
        
        TAREFA:
        1. Analise o shape nas fotos (se houver). Estime o % de gordura e biotipo.
        2. Avaliação de Pontos Fracos: Identifique onde o atleta precisa focar (ex: deltoide lateral, vasto medial).
        3. Estratégia: Defina se é Cutting, Bulking ou Recomp.
        4. No campo 'gif_url', forneça APENAS o ID do vídeo do YouTube (11 caracteres).
        5. Seja EXTREMAMENTE DETALHADO nos campos markdown, mas DIRETO no chat posterior.

        VOCÊ DEVE RETORNAR APENAS UM JSON NO SEGUINTE FORMATO:
        {
          "fat_percentage_estimate": number,
          "analysis": "Markdown Completo: Bio-tipo, estimativa real de gordura, análise de simetria e pontos fracos.",
          "training_plan": "Markdown Completo: Divisão semanal (Split), volume de treino total e orientações de intensidade.",
          "training_schedule": {
            "segunda": { "muscle_group": "string", "exercises": [{ "name": "string", "sets": "string", "reps": "string", "rest": "string", "gif_url": "string" }] },
            "terça": { "muscle_group": "string", "exercises": [...] },
            "quarta": { "muscle_group": "string", "exercises": [...] },
            "quinta": { "muscle_group": "string", "exercises": [...] },
            "sexta": { "muscle_group": "string", "exercises": [...] },
            "sábado": { "muscle_group": "string", "exercises": [...] },
            "domingo": { "muscle_group": "string", "exercises": [...] }
          },
          "nutrition_plan": "Markdown Completo: Estratégia calórica, divisão de macros por refeição e dicas de timing de nutrientes.",
          "nutrition_schedule": {
            "segunda": [{ "name": "string", "time": "string", "items": ["string"], "calories": number, "protein": number, "carbs": number, "fat": number }],
            "terça": [...],
            "quarta": [...],
            "quinta": [...],
            "sexta": [...],
            "sábado": [...],
            "domingo": [...]
          },
          "targets": { "calories": number, "protein": number, "carbs": number, "fat": number }
        }

        LÓGICA DE CARB CYCLING (CRITICAL PARA AVANÇADOS):
        - Se o atleta for 'avançado' ou 'intermediário', você DEVE implementar variações de carboidratos entre os dias baseando-se no treino (Ex: High Carb em dias de perna, Low Carb em dias de descanso).
        - Para iniciantes, mantenha a dieta linear e fácil de seguir todos os dias.

        RESTRIÇÃO DE SUPLEMENTOS (CRITICAL):
        - Se Wants_Supplements for 'false' ou 'não', você está PROIBIDO de incluir Whey Protein, Creatina ou qualquer suplemento na nutrição. Use apenas comida real (ovos, carnes, frango, iogurte natural, etc).
        - Wants_Supplements Atual: ${profile.wants_supplements ? 'SIM' : 'NÃO'}
      `;

      const mediaParts = await Promise.all(files.map(async (f, idx) => {
        if (!user.is_premium && idx > 0) return null;
        try {
          return await processFile(f);
        } catch (e) {
          console.error("Error processing file:", e);
          return null;
        }
      }));

      const aiText = await aiService.generateContent({
        prompt,
        media: mediaParts.filter(p => p !== null) as { data: string, mimeType: string }[],
        responseMimeType: isVideoInput ? "text/plain" : "application/json"
      });
      
      setProcessing(false);

      if (!aiText) {
        throw new Error("EMPTY_RESPONSE");
      }

      if (isVideoInput) {
        setAnalysis(aiText);
        // Log usage for video
        fetch('/api/usage/log', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ type: 'video', tokens: 2000 })
        });
        setLoading(false);
        return;
      }

      const sanitizedText = aiText.replace(/```json|```/g, '').trim();
      let result;
      try {
        result = JSON.parse(sanitizedText);
      } catch (parseErr) {
        console.error("JSON Parse Error:", parseErr, "Text:", sanitizedText);
        throw new Error("INVALID_JSON");
      }

      if (result) {
        setAnalysis(result.analysis);
        
        // Update profile with estimated fat
        if (result.fat_percentage_estimate) {
          await onUpdateProfile({ fat_percentage: result.fat_percentage_estimate });
        }

        // Update plans
        await onUpdatePlans(result.training_plan, result.nutrition_plan, result.analysis, result.targets, result.training_schedule, result.nutrition_schedule);
        
        // Save to history
        if (previews.length > 0 && user.is_premium) {
          await fetch('/api/shape/analysis', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              image_data: previews[0], // Save the first one as thumbnail
              analysis: result.analysis,
              fat_percentage: result.fat_percentage_estimate
            })
          });
        }

        // Log usage
        fetch('/api/usage/log', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ type: 'photo', tokens: 1000 })
        });
      }
    } catch (err: any) {
      console.error(err);
      const currentLang = user.language || 'pt';
      let msg = currentLang === 'pt' ? "Erro ao processar análise. Verifique sua conexão ou tente novamente." : "Error processing analysis. Check your connection or try again.";
      
      if (err.message === "EMPTY_RESPONSE") msg = currentLang === 'pt' ? "IA retornou vazio. Tente novamente." : "AI returned empty. Try again.";
      if (err.message === "INVALID_JSON") msg = currentLang === 'pt' ? "IA falhou ao formatar plano. Tente fotos mais nítidas." : "AI failed to format plan. Try clearer photos.";
      
      setError(msg);
      
      // Log error to backend
      fetch('/api/logs/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ message: err.message, stack: err.stack, context: { profile, files: files.length } })
      });
    } finally {
      setLoading(false);
    }
  };

  const compareEvolution = async () => {
    if (compareSelection.length !== 2) return;
    setLoading(true);
    try {
      const photo1 = history.find(h => h.id === compareSelection[0])!;
      const photo2 = history.find(h => h.id === compareSelection[1])!;
      
      const [oldest, newest] = photo1.timestamp < photo2.timestamp ? [photo1, photo2] : [photo2, photo1];

      const prompt = `
        Analise a evolução deste atleta comparando estas duas fotos do shape.
        
        DATA INICIAL (${new Date(oldest.timestamp).toLocaleDateString()}):
        ${oldest.analysis}
        % Gordura: ${oldest.fat_percentage}%

        DATA ATUAL (${new Date(newest.timestamp).toLocaleDateString()}):
        ${newest.analysis}
        % Gordura: ${newest.fat_percentage}%

        Seja DIRETO e OBJETIVO. Linguagem para leigos.
        Compare os resultados e retorne APENAS um JSON no seguinte formato:
        {
          "summary": "Resumo da evolução em 2 frases",
          "improvements": ["O que melhorou"],
          "to_improve": ["O que focar agora"],
          "technical_details": "Markdown direto com comparação técnica",
          "motivation": "Frase de efeito"
        }
      `;

      const aiText = await aiService.generateContent({
        prompt,
        responseMimeType: "application/json"
      });
      
      const result = JSON.parse(aiText);
      setAnalysis(result);
      setActiveTab('analysis');
      setCompareSelection([]);
    } catch (e) {
      console.error(e);
      setError("Erro ao comparar evolução.");
    } finally {
      setLoading(false);
    }
  };

  const toggleCompareSelection = (id: number) => {
    setCompareSelection(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold mb-2">{t.title}</h2>
          <p className="text-white/60">{t.subtitle}</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          {mode === 'analysis' ? (
            <>
              <button 
                onClick={() => setActiveTab('analysis')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'analysis' ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20' : 'text-white/40 hover:text-white'}`}
              >
                {t.visual}
              </button>
              <button 
                onClick={() => setActiveTab('evolution')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'evolution' ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20' : 'text-white/40 hover:text-white'}`}
              >
                {t.evolution}
              </button>
              <button 
                onClick={() => setActiveTab('execution')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'execution' ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20' : 'text-white/40 hover:text-white'}`}
              >
                {t.execution}
              </button>
            </>
          ) : (
            <button 
              className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-brand-red text-white shadow-lg shadow-brand-red/20"
            >
              {isEn ? 'Direct Coach' : 'Coach Direto'}
            </button>
          )}
        </div>
      </header>

      <div className={`${mode === 'chat' ? 'max-w-4xl mx-auto' : 'grid grid-cols-1 lg:grid-cols-3 gap-8'}`}>
        {mode !== 'chat' && (
          <div className="lg:col-span-1 space-y-6">
            {activeTab === 'analysis' ? (
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Camera size={20} className="text-brand-red" />
                  {t.visual}
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {previews.map((p, idx) => (
                      <div key={idx} className="relative aspect-square bg-white/5 rounded-xl border border-white/10 overflow-hidden group">
                        {files[idx]?.type.startsWith('video/') ? (
                          <video src={p} className="w-full h-full object-cover" />
                        ) : (
                          <img src={p} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                        )}
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeFile(idx);
                          }}
                          className="absolute top-1 right-1 p-1.5 bg-black/60 hover:bg-brand-red rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    {previews.length < (user.is_premium ? 5 : 1) && (
                      <div className="aspect-square bg-white/5 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center relative overflow-hidden group hover:border-brand-red/50 transition-colors">
                        <Camera size={24} className="text-white/20 mb-2" />
                        <p className="text-[10px] text-white/40 text-center px-2">{t.drag}</p>
                        <input 
                          type="file" 
                          multiple={user.is_premium}
                          accept="image/*,video/*" 
                          onChange={handleFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {!user.is_premium && (
                  <div className="mt-4 p-3 bg-brand-red/10 border border-brand-red/20 rounded-lg flex gap-3">
                    <AlertCircle size={18} className="text-brand-red flex-shrink-0" />
                    <p className="text-[10px] text-brand-red font-bold uppercase tracking-wider">
                      {t.premiumAlert}
                    </p>
                  </div>
                )}

                <button
                  onClick={runAnalysis}
                  disabled={loading}
                  className="w-full btn-primary mt-6 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      {processing ? (isEn ? 'Processing File...' : 'Processando Arquivo...') : t.analyzing}
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      {t.request}
                    </>
                  )}
                </button>
                
                <button
                  onClick={async () => {
                    const mandatoryFields = ['age', 'height', 'weight', 'gender'];
                    const missingFields = mandatoryFields.filter(f => !profile[f]);
                    if (missingFields.length > 0) {
                      setError(`${t.missingFields}${missingFields.join(', ')}`);
                      return;
                    }

                    setLoading(true);
                    setError(null);
                    try {
                      const roastPrompt = `Dê um ROAST ácido no meu shape baseado nos dados: Sexo: ${profile.gender}, Idade: ${profile.age}, Altura: ${profile.height}cm, Peso: ${profile.weight}kg. Use gírias de maromba brasileiras. Curto e grosso.`;
                      const aiText = await aiService.generateContent({ prompt: roastPrompt });
                      setAnalysis(aiText);
                    } catch (e: any) { 
                      setError(e.message);
                    } finally { setLoading(false); }
                  }}
                  disabled={loading}
                  className="w-full btn-secondary mt-3 flex items-center justify-center gap-2 border-brand-red/20 text-brand-red hover:bg-brand-red/5"
                >
                  <AlertCircle size={20} />
                  {t.roast}
                </button>
              </div>
            ) : activeTab === 'evolution' ? (
              <div className="glass-card p-6 space-y-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <History size={20} className="text-brand-red" />
                  {t.evolution}
                </h3>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {history.length === 0 ? (
                    <p className="text-center text-white/20 py-10 text-sm">Nenhuma análise salva ainda.</p>
                  ) : (
                    history.map((item) => (
                      <motion.div 
                        key={item.id}
                        onClick={() => toggleCompareSelection(item.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${compareSelection.includes(item.id) ? 'bg-brand-red/20 border-brand-red' : (selectedHistory?.id === item.id ? 'bg-brand-red/10 border-brand-red' : 'bg-white/5 border-white/10 hover:border-white/20')}`}
                      >
                        <div className="relative">
                          <img src={item.image_data} className="w-12 h-12 rounded-lg object-cover" alt="History" />
                          {compareSelection.includes(item.id) && (
                            <div className="absolute inset-0 bg-brand-red/40 flex items-center justify-center rounded-lg">
                              <span className="text-[10px] font-black">{compareSelection.indexOf(item.id) + 1}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1" onClick={() => setSelectedHistory(item)}>
                          <p className="text-xs font-bold">{new Date(item.timestamp).toLocaleDateString()}</p>
                          <p className="text-[10px] text-white/40 uppercase font-bold">{item.fat_percentage}% Gordura</p>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteHistoryItem(item.id);
                          }}
                          className="p-2 text-white/20 hover:text-brand-red transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </motion.div>
                    ))
                  )}
                </div>

                {compareSelection.length === 2 && (
                  <button 
                    onClick={compareEvolution}
                    disabled={loading}
                    className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <TrendingUp size={18} />}
                    {isEn ? 'COMPARE SELECTED' : 'COMPARAR SELECIONADAS'}
                  </button>
                )}
              </div>
            ) : activeTab === 'execution' ? (
              <div className="glass-card p-6 space-y-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Video size={20} className="text-brand-red" />
                  {t.execution}
                </h3>
                
                {!user.is_premium ? (
                   <div className="text-center py-12 px-4 border-2 border-dashed border-white/10 rounded-2xl bg-white/5">
                      <Crown size={40} className="text-brand-red mx-auto mb-4" />
                      <h4 className="text-xl font-display font-bold uppercase mb-2">Recurso Elite</h4>
                      <p className="text-white/40 text-sm mb-6">A correção de execução em tempo real é exclusiva para membros da Elite.</p>
                      <button 
                        onClick={() => window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'upgrade' }))}
                        className="btn-primary py-3 px-8 rounded-xl font-bold uppercase tracking-widest text-xs"
                      >
                        ASSINAR AGORA
                      </button>
                   </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex gap-4 items-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircle2 className="text-emerald-500" size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-bold">IA Vision Ativa</p>
                        <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Aguardando vídeo de execução...</p>
                      </div>
                    </div>

                    <div className="aspect-video bg-black rounded-2xl border border-white/10 flex flex-col items-center justify-center relative overflow-hidden group">
                        {previews.some((_, i) => files[i]?.type.startsWith('video/')) ? (
                           <video 
                             src={previews.find((_, i) => files[i]?.type.startsWith('video/'))} 
                             className="w-full h-full object-contain"
                             controls
                           />
                        ) : (
                          <>
                            <Video size={48} className="text-white/10 mb-4 group-hover:scale-110 transition-transform" />
                            <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Selecione ou Arraste o Vídeo</p>
                            <input 
                              type="file" 
                              accept="video/*" 
                              onChange={handleFileChange}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                          </>
                        )}
                    </div>

                    <button
                      onClick={runAnalysis}
                      disabled={loading || !files.some(f => f.type.startsWith('video/'))}
                      className="w-full btn-primary py-4 flex items-center justify-center gap-3 shadow-xl shadow-brand-red/20 font-display font-black text-lg"
                    >
                      {loading ? <Loader2 className="animate-spin" /> : <BrainCircuit size={24} />}
                      ANALISAR EXECUÇÃO
                    </button>
                    
                    <p className="text-[10px] text-white/20 text-center font-bold uppercase tracking-tighter">
                      DICA: Posicione a câmera de lado para melhor análise biomecânica.
                    </p>
                  </div>
                )}
              </div>
            ) : null}

            <div className="glass-card p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Info size={20} className="text-brand-red" />
                {t.tips}
              </h3>
              <ul className="space-y-3 text-sm text-white/60">
                <li className="flex gap-2">
                  <CheckCircle2 size={16} className="text-brand-red flex-shrink-0" />
                  {t.tip1}
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 size={16} className="text-brand-red flex-shrink-0" />
                  {t.tip2}
                </li>
              </ul>
            </div>
          </div>
        )}

        <div className={`${mode === 'chat' ? '' : 'lg:col-span-2'}`}>
          {mode === 'chat' ? (
            !user.is_premium ? (
              <div className="glass-card p-12 text-center border-brand-red/30 bg-brand-red/5 flex flex-col items-center justify-center min-h-[600px]">
                <Crown size={48} className="text-brand-red mx-auto mb-6" />
                <h3 className="text-2xl font-display font-bold uppercase mb-4">Chat com <br/>Mentor <span className="text-brand-red text-stroke">ELITE</span></h3>
                <p className="text-white/60 mb-10 max-w-sm mx-auto">
                  O chat direto com o Coach Especialista é exclusivo para membros da Elite. 
                  Receba feedback em tempo real sobre seu shape e tire dúvidas de dieta.
                </p>
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'upgrade' }))}
                  className="btn-primary px-10 py-4 shadow-xl shadow-brand-red/20"
                >
                  LIBERAR ACESSO AGORA
                </button>
              </div>
            ) : (
              <div className="glass-card p-6 flex flex-col min-h-[600px] border-l-4 border-brand-red">
                <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-3">
                  <BrainCircuit size={24} className="text-brand-red" />
                  {isEn ? 'Coach Chat' : 'Coach Especialista'}
                </h3>
              
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 scrollbar-hide">
                {chatMessages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                    <BrainCircuit size={48} className="mb-4" />
                    <p className="text-sm font-bold uppercase tracking-widest">Inicie uma conversa</p>
                    <p className="text-[10px]">Tire dúvidas sobre seu treino e dieta.</p>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      msg.role === 'user' ? 'bg-brand-red text-white rounded-tr-none' : 'bg-white/5 border border-white/10 text-white/80 rounded-tl-none'
                    }`}>
                      <Markdown>{msg.text}</Markdown>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 border border-white/10 p-3 rounded-2xl rounded-tl-none">
                      <Loader2 className="animate-spin text-brand-red" size={16} />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder={isEn ? "Ask something..." : "Pergunte algo..."}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-red transition-colors"
                />
                <button 
                  onClick={sendChatMessage}
                  disabled={chatLoading || !chatInput.trim()}
                  className="p-2 bg-brand-red text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          )) : (
            <div className="glass-card min-h-[500px] p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <BrainCircuit size={120} />
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 flex items-center gap-3">
                  <AlertCircle size={20} />
                  <p className="font-medium">{error}</p>
                </div>
              )}

              {selectedHistory && activeTab === 'evolution' ? (
                <div className="space-y-6">
                  <button 
                    onClick={() => setSelectedHistory(null)}
                    className="flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white uppercase tracking-widest"
                  >
                    <ChevronLeft size={16} /> {isEn ? 'Back to analysis' : 'Voltar para Análise'}
                  </button>
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="md:w-1/3">
                      <img src={selectedHistory.image_data} className="w-full rounded-2xl shadow-2xl" alt="Selected" />
                      <div className="mt-4 p-4 glass-card text-center">
                        <p className="text-2xl font-bold text-brand-red">{selectedHistory.fat_percentage}%</p>
                        <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Gordura Estimada</p>
                      </div>
                    </div>
                    <div className="md:w-2/3 prose prose-invert max-w-none markdown-body">
                      <Markdown>{selectedHistory.analysis}</Markdown>
                    </div>
                  </div>
                </div>
              ) : analysis ? (
                <div className="prose prose-invert max-w-none markdown-body">
                  {typeof analysis === 'string' ? (
                    <Markdown>{analysis}</Markdown>
                  ) : (
                    <div className="space-y-6">
                      <div className="p-4 bg-brand-red/10 border border-brand-red/20 rounded-xl">
                        <h4 className="text-brand-red font-bold uppercase text-xs mb-2">Resumo</h4>
                        <p className="text-sm">{analysis.summary}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                          <h4 className="text-emerald-500 font-bold uppercase text-xs mb-2">Melhorias</h4>
                          <ul className="space-y-1">
                            {analysis.improvements?.map((item: string, i: number) => (
                              <li key={i} className="text-xs flex gap-2">
                                <span className="text-emerald-500">✓</span> {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                          <h4 className="text-yellow-500 font-bold uppercase text-xs mb-2">Focar Agora</h4>
                          <ul className="space-y-1">
                            {analysis.to_improve?.map((item: string, i: number) => (
                              <li key={i} className="text-xs flex gap-2">
                                <span className="text-yellow-500">→</span> {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                        <h4 className="text-white/40 font-bold uppercase text-xs mb-4">Detalhes Técnicos</h4>
                        <div className="prose prose-invert prose-xs">
                          <Markdown>{analysis.technical_details}</Markdown>
                        </div>
                      </div>

                      <div className="text-center py-4 border-t border-white/10">
                        <p className="text-lg font-display font-bold italic text-brand-red">"{analysis.motivation}"</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <BrainCircuit size={40} className="text-white/20" />
                  </div>
                  <h4 className="text-xl font-bold mb-2">{t.waiting}</h4>
                  <p className="text-white/40 max-w-md">
                    {t.waitingDesc}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
