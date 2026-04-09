import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions, isMockFirebase } from '../lib/firebase';
import { GoogleGenAI, Type } from '@google/genai';

export type AiActionType = 'SUMMARIZE' | 'SUGGEST_TITLES' | 'REWRITE_TONE' | 'SHORTEN';

export interface AiRequestOptions {
  tone?: 'clear' | 'official' | 'inspiring';
  lines?: 1 | 2 | 3;
}

interface AiResponse {
  result: string | string[];
}

// Initialize Gemini SDK for frontend testing in AI Studio
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

function buildPrompt(action: AiActionType, text: string, options?: AiRequestOptions): string {
  switch (action) {
    case 'SUMMARIZE':
      return `Tiivistä seuraava teksti infonäytölle sopivaksi. Maksimissaan 3 lyhyttä lausetta.\n\nTeksti:\n${text}`;
    case 'SUGGEST_TITLES':
      return `Luo 3 iskevää ja lyhyttä otsikkovaihtoehtoa seuraavalle tekstille. Palauta vain otsikot.\n\nTeksti:\n${text}`;
    case 'REWRITE_TONE':
      const tone = options?.tone || 'clear';
      const toneMap: Record<string, string> = {
        clear: 'selkeä ja ymmärrettävä',
        official: 'virallinen ja asiallinen',
        inspiring: 'innostava ja positiivinen'
      };
      return `Kirjoita seuraava teksti uudelleen siten, että sen sävy on ${toneMap[tone]}.\n\nTeksti:\n${text}`;
    case 'SHORTEN':
      const lines = options?.lines || 2;
      return `Lyhennä seuraava teksti tasan ${lines} rivin pituiseksi (noin ${lines * 50} merkkiä).\n\nTeksti:\n${text}`;
    default:
      return text;
  }
}

export function useAiAction() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateContent = async (
    action: AiActionType,
    text: string,
    options?: AiRequestOptions
  ): Promise<string | string[] | null> => {
    if (!text || text.trim() === '') {
      setError('Teksti ei voi olla tyhjä.');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isMockFirebase) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        if (action === 'SUGGEST_TITLES') {
          return [
            '[MOCK] Ensimmäinen iskevä otsikko',
            '[MOCK] Toinen kiinnostava vaihtoehto',
            '[MOCK] Kolmas lyhyt ja ytimekäs'
          ];
        }
        return `[MOCK AI] Tässä on generoitu teksti toiminnolle: ${action}. Alkuperäinen pituus oli ${text.length} merkkiä.`;
      }

      // TEST MODE: Call Gemini directly from frontend instead of Firebase Functions
      // This is because Firebase Functions are not running in the AI Studio preview environment.
      const prompt = buildPrompt(action, text, options);
      const config: any = { temperature: 0.7 };

      if (action === 'SUGGEST_TITLES') {
        config.responseMimeType = 'application/json';
        config.responseSchema = {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        };
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: config
      });

      const resultText = response.text || '';

      if (action === 'SUGGEST_TITLES') {
        try {
          return JSON.parse(resultText);
        } catch (e) {
          console.error('Failed to parse titles JSON', resultText);
          throw new Error('Tekoäly palautti virheellisen vastauksen otsikoille.');
        }
      }

      return resultText.trim();

      /* ORIGINAL FIREBASE CALLABLE CODE (Commented out for testing)
      const generateAiContent = httpsCallable<{ action: AiActionType; text: string; options?: AiRequestOptions }, AiResponse>(
        functions,
        'generateAiContent'
      );

      const result = await generateAiContent({ action, text, options });
      return result.data.result;
      */
    } catch (err: any) {
      console.error('AI Action Error:', err);
      const message = err?.message || 'Tuntematon virhe tekoälyn käytössä.';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generateContent,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}
