import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { GoogleGenAI, Type } from "@google/genai";
import * as nodemailer from "nodemailer";
import Parser from "rss-parser";

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();
const auth = getAuth();
const parser = new Parser();

// Initialize Gemini SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Email transporter configuration
// NOTE: In production, use environment variables for these secrets
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'user@example.com',
    pass: process.env.SMTP_PASS || 'password'
  }
});

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
export const generateAiContent = onCall<AiRequest>(async (request) => {
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

  const data = request.data;

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
      model: 'gemini-3-flash-preview', // Fixed model name
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
        throw new HttpsError('unknown', 'Tekoäly palautti virheellisen vastauksen otsikoille.');
      }
    }

    return { result: resultText.trim() };

  } catch (error: any) {
    console.error('Gemini API Error:', error);
    throw new HttpsError('unknown', `Virhe tekoälysisällön generoinnissa: ${error?.message || 'Tuntematon virhe'}`);
  }
});

/**
 * Fetches and parses an RSS feed.
 */
export const fetchRssFeed = onCall(async (request) => {
  const url = request.data.url;
  if (!url || typeof url !== 'string') {
    throw new HttpsError('invalid-argument', 'URL puuttuu tai on virheellinen.');
  }

  try {
    const feed = await parser.parseURL(url);
    return {
      title: feed.title,
      description: feed.description,
      items: feed.items.map((item: any) => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        contentSnippet: item.contentSnippet,
        content: item.content,
        creator: item.creator
      })).slice(0, 10) // Limit to 10 items
    };
  } catch (error: any) {
    console.error('RSS Fetch Error:', error);
    throw new HttpsError('unknown', `Virhe RSS-syötteen hakemisessa: ${error?.message || 'Tuntematon virhe'}`);
  }
});

/**
 * Triggered when a new invitation is created.
 * Creates an Auth user and sends a password reset link.
 */
export const onInvitationCreated = onDocumentCreated("invitations/{invitationId}", async (event: any) => {
  const snapshot = event.data;
  if (!snapshot) {
    console.log("No data associated with the event");
    return;
  }

  const data = snapshot.data();
  const email = data.email;
  const orgId = data.org_id;
  const role = data.role;

  console.log(`Processing invitation for ${email} in org ${orgId}`);

  try {
    // 1. Check if user already exists in Auth
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log(`User already exists in Auth: ${userRecord.uid}`);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // 2. Create user if not exists
        const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).toUpperCase().slice(-2);
        userRecord = await auth.createUser({
          email: email,
          password: tempPassword,
          displayName: email.split('@')[0],
        });
        console.log(`Created new Auth user: ${userRecord.uid}`);
      } else {
        throw error;
      }
    }

    // 3. Generate Password Reset Link
    const actionCodeSettings = {
      url: 'https://eduro-infotv.web.app/admin/login', // Update with your actual production URL
    };
    const resetLink = await auth.generatePasswordResetLink(email, actionCodeSettings);

    // 4. Send Email
    const mailOptions = {
      from: '"Eduro InfoTV" <noreply@eduro.fi>',
      to: email,
      subject: 'Kutsu Eduro InfoTV -järjestelmään',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
          <h2 style="color: #4f46e5;">Tervetuloa Eduro InfoTV:hen!</h2>
          <p>Sinut on kutsuttu käyttäjäksi organisaatioon <strong>${orgId}</strong> roolilla <strong>${role}</strong>.</p>
          <p>Pääset kirjautumaan sisään asettamalla itsellesi salasanan alla olevasta linkistä:</p>
          <div style="margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Aseta salasana</a>
          </div>
          <p style="color: #64748b; font-size: 14px;">Tämä linkki on voimassa rajoitetun ajan.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 12px;">Jos et odottanut tätä kutsua, voit jättää tämän viestin huomiotta.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Invitation email sent to ${email}`);

    // 5. Update invitation status
    await db.collection('invitations').doc(event.params.invitationId).update({
      status: 'email_sent',
      updated_at: new Date()
    });

  } catch (error) {
    console.error(`Error processing invitation for ${email}:`, error);
    // Optionally update status to 'error'
    await db.collection('invitations').doc(event.params.invitationId).update({
      status: 'error',
      error_message: error instanceof Error ? error.message : String(error),
      updated_at: new Date()
    });
  }
});
