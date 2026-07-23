import { GoogleGenAI, Modality } from "@google/genai";

function addWavHeader(base64Data: string, sampleRate: number = 24000): string {
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const buffer = new ArrayBuffer(44 + len);
  const view = new DataView(buffer);

  // RIFF identifier
  view.setUint32(0, 0x52494646, false); // "RIFF"
  // file length
  view.setUint32(4, 36 + len, true);
  // RIFF type
  view.setUint32(8, 0x57415645, false); // "WAVE"
  // format chunk identifier
  view.setUint32(12, 0x666d7420, false); // "fmt "
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, 1, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * 2, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  view.setUint32(36, 0x64617461, false); // "data"
  // data chunk length
  view.setUint32(40, len, true);

  // write the PCM data
  for (let i = 0; i < len; i++) {
    view.setUint8(44 + i, bytes[i]);
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

function formatGeminiError(error: any): string {
  if (!error) return "Terjadi kesalahan tidak diketahui.";

  const rawString = typeof error === 'string' 
    ? error 
    : (error.message || JSON.stringify(error));

  if (
    rawString.includes("429") || 
    rawString.includes("RESOURCE_EXHAUSTED") || 
    rawString.includes("Quota exceeded") || 
    rawString.includes("rate-limits") ||
    rawString.includes("quotaValue")
  ) {
    let retrySeconds = "15";
    const retryMatch = rawString.match(/retry in (\d+)(\.\d+)?s/i) || rawString.match(/retryDelay":"(\d+)s"/i);
    if (retryMatch && retryMatch[1]) {
      retrySeconds = Math.ceil(parseFloat(retryMatch[1])).toString();
    }
    return `Limit kuota request Gemini API terlampaui (429 Rate Limit / Resource Exhausted). Silakan tunggu ~${retrySeconds} detik lalu coba lagi, atau masukkan API Key Gemini pribadi Anda di Pengaturan agar kuota lebih melimpah!`;
  }

  if (
    rawString.includes("API_KEY_INVALID") || 
    rawString.includes("API key not valid") || 
    rawString.includes("UNAUTHENTICATED")
  ) {
    return "API Key Gemini tidak valid atau tidak diizinkan. Silakan periksa kembali API Key Anda di Pengaturan.";
  }

  try {
    const parsed = JSON.parse(rawString);
    if (parsed?.error?.message) {
      return parsed.error.message;
    }
  } catch (e) {
    // rawString is not JSON
  }

  return rawString;
}

export async function generateGeminiTts(text: string, voice: string, instruction: string = "", customApiKey?: string) {
  const apiKey = customApiKey?.trim() || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API Key tidak ditemukan. Silakan masukkan API Key Anda di Pengaturan.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const fullPrompt = instruction ? `${instruction}${text}` : text;

  const modelsToTry = [
    "gemini-2.5-flash-preview-tts",
    "gemini-2.5-flash"
  ];

  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ parts: [{ text: fullPrompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        return addWavHeader(base64Audio);
      }
    } catch (err: any) {
      console.warn(`Model ${modelName} failed:`, err);
      lastError = err;
      // If it's 429, wait 2 seconds before trying fallback or throwing
      const errStr = typeof err === 'string' ? err : err?.message || '';
      if (errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED")) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  throw new Error(formatGeminiError(lastError || "Tidak ada data audio yang diterima dari Gemini."));
}

export async function generateAiScript(prompt: string, customApiKey?: string) {
  const apiKey = customApiKey?.trim() || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API Key tidak ditemukan. Silakan masukkan API Key Anda di Pengaturan.");
  }

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Write a short, engaging script for a text-to-speech application based on this topic: ${prompt}. Keep it under 500 characters. Return only the script text.`,
    });
    return response.text || "";
  } catch (error) {
    console.error("AI Script Error:", error);
    throw new Error(formatGeminiError(error));
  }
}
