import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // Correct initialization using named parameter and process.env.API_KEY directly
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async getNarratorMessage(prompt: string): Promise<string> {
    try {
      // Use ai.models.generateContent with model and contents as per guidelines
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are the mysterious, minimalist narrator of a black and white stickman game. 
        Keep your response under 20 words. Be poetic and slightly cryptic. 
        The player's context is: ${prompt}`,
        config: {
          temperature: 0.9,
          topP: 1,
        }
      });
      // Correct extraction of text from GenerateContentResponse
      return response.text || "The void whispers...";
    } catch (error) {
      console.error("Gemini narration failed:", error);
      return "Balance is required.";
    }
  }
}

export const geminiService = new GeminiService();