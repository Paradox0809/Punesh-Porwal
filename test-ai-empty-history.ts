import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "test" });

async function test() {
  try {
    const chat = ai.chats.create({
      model: "gemini-3.1-pro-preview",
      config: {
        systemInstruction: "You are a helpful assistant.",
      },
      history: []
    });
    console.log("Chat created successfully with empty history");
  } catch (e) {
    console.error("Error creating chat:", e);
  }
}

test();
