import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

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
      const generateAiContent = httpsCallable<{ action: AiActionType; text: string; options?: AiRequestOptions }, AiResponse>(
        functions,
        'generateAiContent'
      );

      const result = await generateAiContent({ action, text, options });
      return result.data.result;
    } catch (err: any) {
      console.error('AI Action Error:', err);
      // Extract a user-friendly message from the Firebase HttpsError if possible
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
