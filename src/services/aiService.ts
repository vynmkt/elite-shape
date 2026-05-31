export type AIProvider = 'openai';

interface GenerateParams {
  prompt: string;
  systemInstruction?: string;
  responseMimeType?: "application/json" | "text/plain";
  media?: { data: string, mimeType: string }[];
}

class AIService {
  async generateContent(params: GenerateParams): Promise<string> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Não autenticado');

    const res = await fetch('/api/ai/openai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        prompt: params.prompt,
        systemInstruction: params.systemInstruction,
        responseMimeType: params.responseMimeType,
        images: params.media?.map(m => m.data)
      })
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(error.error || 'Erro na IA');
    }

    const data = await res.json();
    return data.text;
  }
}

export const aiService = new AIService();
