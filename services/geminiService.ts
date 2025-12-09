import { GoogleGenAI } from "@google/genai";

// The model requested is "nano banana pro", which maps to 'gemini-3-pro-image-preview'
const MODEL_NAME = 'gemini-3-pro-image-preview';

export const generateSketchFromFrame = async (base64Image: string): Promise<string> => {
  // Always create a new instance to ensure we capture the latest selected API Key
  // from the window.aistudio flow if it changed.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Remove data URL prefix if present for clean base64
  const base64Data = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
  const mimeType = base64Image.match(/^data:image\/(png|jpeg|jpg);base64,/)?.[1] || 'image/jpeg';

  const prompt = `
    Analyze this video frame. 
    Create a high-quality, hand-drawn charcoal or pencil sketch style illustration of this image. 
    It should look like a step in a DIY instruction manual. 
    Focus on the main subject and action. 
    Clean lines, white background, artistic but clear technical drawing style.
    Do not include any text in the image.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            text: prompt,
          },
          {
            inlineData: {
              mimeType: `image/${mimeType}`,
              data: base64Data,
            },
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9", // Assuming standard video ratio, could be dynamic
          imageSize: "1K",
        },
      },
    });

    // Parse response for the image
    // The prompt explicitly asks for an image generation, but generateContent returns a structure 
    // where we need to find the inlineData or executable code. 
    // For 'gemini-3-pro-image-preview', it typically returns inlineData.
    
    if (response.candidates && response.candidates.length > 0) {
      const parts = response.candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image data found in response");

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};