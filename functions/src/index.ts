import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// Initialize Gemini SDK
// Note: In production, GEMINI_API_KEY should be set in Google Cloud Secret Manager
// or as a Firebase environment variable.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// 1. Request Schema Types
type ActionType = 'SUMMARIZE' | 'SUGGEST_TITLES' | 'REWRITE_TONE' | 'SHORTEN';

interface AiRequest {
  action: ActionType;
  text: string;
  options?: {
    tone?: 'clear' | 'official' | 'inspiring';
    lines?: 1 | 2 | 3;
  };
}

// 2. Prompt Builder Design
function buildPrompt(action: ActionType, text: string, options?: AiRequest['options']): string {
  switch (action) {
    case 'SUMMARIZE':
      return `Tiivistä seuraava teksti infonäytölle sopivaksi. Maksimissaan 3 lyhyttä lausetta.\n\nTeksti:\n${text}`;
    
    case 'SUGGEST_TITLES':
      // The responseSchema will enforce the JSON array format, so we just ask for titles.
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
      throw new HttpsError('invalid-argument', 'Tuntematon action-tyyppi.');
  }
}

// 3. Callable Function Entrypoint
export const generateAiContent = onCall(async (request) => {
  // 4. Auth Logic
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Käyttäjä ei ole kirjautunut sisään.');
  }

  // 5. Role Logic
  const userDoc = await db.collection('users').doc(request.auth.uid).get();
  const userData = userDoc.data();
  
  if (!userData || (userData.role !== 'admin' && userData.role !== 'editor')) {
    throw new HttpsError('permission-denied', 'Käyttäjällä ei ole vaadittavia oikeuksia (admin tai editor).');
  }

  const data = request.data as AiRequest;

  // Input Validation
  if (!data.action || !['SUMMARIZE', 'SUGGEST_TITLES', 'REWRITE_TONE', 'SHORTEN'].includes(data.action)) {
    throw new HttpsError('invalid-argument', 'Virheellinen tai puuttuva action.');
  }
  
  if (!data.text || typeof data.text !== 'string') {
    throw new HttpsError('invalid-argument', 'Teksti puuttuu tai on virheellinen.');
  }
  
  const trimmedText = data.text.trim();
  if (trimmedText.length === 0) {
    throw new HttpsError('invalid-argument', 'Teksti ei voi olla tyhjä.');
  }
  
  if (trimmedText.length > 10000) {
    throw new HttpsError('invalid-argument', 'Teksti on liian pitkä (max 10000 merkkiä).');
  }

  try {
    const prompt = buildPrompt(data.action, trimmedText, data.options);
    
    // Configuration for Gemini
    const config: any = {
      temperature: 0.7,
    };

    // If SUGGEST_TITLES, enforce JSON array response
    if (data.action === 'SUGGEST_TITLES') {
      config.responseMimeType = 'application/json';
      config.responseSchema = {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      };
    }

    // Call Gemini API
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-preview', // Fast and cost-effective model
      contents: prompt,
      config: config
    });

    const resultText = response.text || '';

    // 6. Response Schema
    if (data.action === 'SUGGEST_TITLES') {
      try {
        const titles = JSON.parse(resultText);
        return { result: titles };
      } catch (e) {
        console.error('Failed to parse titles JSON', resultText);
        throw new HttpsError('internal', 'Tekoäly palautti virheellisen vastauksen otsikoille.');
      }
    }

    return { result: resultText.trim() };

  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new HttpsError('internal', 'Virhe tekoälysisällön generoinnissa.');
  }
});
