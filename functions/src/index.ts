import { onCall, HttpsError } from "firebase-functions/v2/https";
import { GoogleGenerativeAI } from "@google/generative-ai";

type GenerateAiContentAction = "SUMMARIZE" | "SUGGEST_TITLES" | "REWRITE_TONE" | "SHORTEN";
type GenerateAiContentTone = "clear" | "official" | "inspiring";

interface GenerateAiContentRequest {
  action: GenerateAiContentAction;
  text: string;
  options?: {
    tone?: GenerateAiContentTone;
    lines?: 1 | 2 | 3;
  };
}

interface GenerateAiContentResponse {
  result: string | string[];
}

const MODEL_NAME = "gemini-1.5-flash";

function validateText(text: unknown): asserts text is string {
  if (typeof text !== "string" || text.trim().length === 0) {
    throw new HttpsError("invalid-argument", "Teksti ei voi olla tyhjä.");
  }

  if (text.trim().length > 5000) {
    throw new HttpsError("invalid-argument", "Teksti saa olla korkeintaan 5000 merkkiä.");
  }
}

function buildPrompt(action: GenerateAiContentAction, text: string, options?: GenerateAiContentRequest["options"]): string {
  switch (action) {
    case "SUMMARIZE":
      return [
        "Tiivistä seuraava teksti suomeksi selkeäksi, tiiviiksi ja helposti luettavaksi versioksi.",
        "Käytä korkeintaan kolmea lyhyttä riviä.",
        "Säilytä vain olennaisin tieto.",
        "",
        `Teksti:\n${text}`,
      ].join("\n");
    case "SUGGEST_TITLES":
      return [
        "Luo seuraavalle tekstille tasan 3 lyhyttä suomenkielistä otsikkovaihtoehtoa.",
        "Palauta vain otsikot, yksi otsikko per rivi.",
        "Älä lisää numeroita, luettelomerkkejä tai selityksiä.",
        "",
        `Teksti:\n${text}`,
      ].join("\n");
    case "REWRITE_TONE": {
      const tone: GenerateAiContentTone = options?.tone ?? "clear";
      const toneMap: Record<GenerateAiContentTone, string> = {
        clear: "selkeä ja ymmärrettävä",
        official: "virallinen ja asiallinen",
        inspiring: "innostava ja positiivinen",
      };

      return [
        `Kirjoita seuraava teksti uudelleen suomeksi sävyyn: ${toneMap[tone]}.`,
        "Säilytä alkuperäinen merkitys, mutta muuta ilmaisu valittuun sävyyn.",
        "",
        `Teksti:\n${text}`,
      ].join("\n");
    }
    case "SHORTEN": {
      const lines = options?.lines ?? 2;
      return [
        `Lyhennä seuraava teksti suomeksi tasan ${lines} riville.`,
        "Poista toisto, mutta säilytä ydinviesti ja tärkeimmät faktat.",
        "",
        `Teksti:\n${text}`,
      ].join("\n");
    }
    default:
      throw new HttpsError("invalid-argument", "Tuntematon action.");
  }
}

function parseTitleSuggestions(output: string): string[] {
  return output
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/^\s*(?:\d+[\).\:-]?\s*|[-*•]\s*)/, "")
        .replace(/^["'“”]+|["'“”]+$/g, "")
        .trim()
    )
    .filter(Boolean)
    .slice(0, 3);
}

export const generateAiContent = onCall(
  {
    region: "europe-west1",
    secrets: ["GEMINI_API_KEY"],
  },
  async (request): Promise<GenerateAiContentResponse> => {
    const data = request.data as GenerateAiContentRequest;

    if (!data || !data.action) {
      throw new HttpsError("invalid-argument", "Action puuttuu.");
    }

    validateText(data.text);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new HttpsError("internal", "GEMINI_API_KEY puuttuu.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = buildPrompt(data.action, data.text.trim(), data.options);

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();

      if (data.action === "SUGGEST_TITLES") {
        const titles = parseTitleSuggestions(responseText);

        if (titles.length === 0) {
          throw new HttpsError("internal", "Gemini ei palauttanut otsikkoehdotuksia.");
        }

        return { result: titles };
      }

      return { result: responseText };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : "Tuntematon virhe";
      throw new HttpsError("internal", `Tekoälysisällön generointi epäonnistui: ${message}`);
    }
  }
);
