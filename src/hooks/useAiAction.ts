import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions, isMockFirebase } from '../lib/firebase';

export type AiActionType = 'SUMMARIZE' | 'SUGGEST_TITLES' | 'REWRITE_TONE' | 'SHORTEN';

export interface AiRequestOptions {
  tone?: 'clear' | 'official' | 'inspiring';
  lines?: 1 | 2 | 3;
}

interface AiResponse {
  result: string | string[];
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

      const generateAiContent = httpsCallable<{ action: AiActionType; text: string; options?: AiRequestOptions }, AiResponse>(
        functions,
        'generateAiContent'
      );

      const result = await generateAiContent({ action, text, options });
      return result.data.result;
    } catch (err: unknown) {
      console.error('AI Action Error:', err);
      const message = err instanceof Error ? err.message : String(err);
      setError(message || 'Tuntematon virhe tekoälyn käytössä.');
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
