import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateThumbnailPrompt(title, hasImage) {
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

export async function generateThumbnailImage(prompt, base64Image) {
  const contents = {
    parts: [
      { text: prompt }
    ]
  };

  if (base64Image) {
    try {
      // More robust parsing of data URL
      const [header, data] = base64Image.split(';base64,');
      const mimeType = header.split(':')[1];
      
      if (mimeType && data) {
        contents.parts.push({
          inlineData: {
            mimeType: mimeType,
            data: data
          }
        });
      }
    } catch (e) {
      console.error("Failed to parse base64 image", e);
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
