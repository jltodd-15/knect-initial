import { GoogleGenAI, Type } from "@google/genai";
import { TimeWindow, DiscoveryItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSmartSchedulingSuggestions = async (
  eventTitle: string,
  eventType: string,
  participantCount: number
): Promise<TimeWindow[]> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze schedules for a group of ${participantCount} people for a "${eventTitle}" (${eventType}). 
    Suggest 3 "Golden Windows" in ISO format for the next 48 hours. 
    Ensure windows are context-aware (e.g., movies not at 4am, dinners in evening).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            start: { type: Type.STRING },
            end: { type: Type.STRING },
            score: { type: Type.NUMBER },
            reasoning: { type: Type.STRING }
          },
          required: ["start", "end", "score", "reasoning"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse scheduling suggestions", e);
    return [];
  }
};

export const getDiscoveryFeed = async (location?: string): Promise<DiscoveryItem[]> => {
  const prompt = `Generate a personalized activity feed for someone in ${location || 'San Francisco'}. 
  Include 5 activity ideas (restaurants, parks, venues). 
  Output as a JSON array.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            image: { type: Type.STRING },
            isAd: { type: Type.BOOLEAN },
            category: { type: Type.STRING },
            url: { type: Type.STRING },
            location: { type: Type.STRING }
          },
          required: ["id", "title", "description", "image", "isAd", "category"]
        }
      }
    }
  });

  try {
    const data = JSON.parse(response.text);
    return data.map((item: DiscoveryItem, idx: number) => ({
      ...item,
      image: `https://picsum.photos/seed/${item.id || idx}/600/800`
    }));
  } catch (e) {
    console.error("Failed to parse discovery feed", e);
    return [];
  }
};