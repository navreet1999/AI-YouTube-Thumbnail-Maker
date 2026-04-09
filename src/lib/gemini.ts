import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateThumbnailPrompt(title: string, hasImage: boolean) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are an expert YouTube thumbnail designer. 
    The video title is: "${title}". 
    ${hasImage ? "The user has provided a headshot photo." : "No headshot provided."}
    
    Create a highly detailed image generation prompt for a professional YouTube thumbnail.
    The style should be: high contrast, vibrant colors, glowing highlights, cinematic depth of field, and modern text placement.
    The goal is to maximize click-through rate (CTR).
    
    If a headshot is provided, describe the YouTuber as the central figure with an expressive face matching the tone of the title.
    If no headshot is provided, describe a compelling central visual element or character.
    
    Return ONLY the prompt text.`,
  });

  return response.text || `A professional YouTube thumbnail for a video titled "${title}", high contrast, vibrant colors, cinematic lighting.`;
}

export async function generateThumbnailImage(prompt: string, base64Image?: string) {
  const contents: any = {
    parts: [
      { text: prompt }
    ]
  };

  if (base64Image) {
    // Extract base64 data and mime type
    const matches = base64Image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (matches) {
      contents.parts.push({
        inlineData: {
          mimeType: matches[1],
          data: matches[2]
        }
      });
    }
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: contents,
    config: {
      imageConfig: {
        aspectRatio: "16:9",
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image generated");
}
