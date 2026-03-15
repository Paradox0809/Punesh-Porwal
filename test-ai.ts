import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

async function test() {
  try {
    const chat = ai.chats.create({
      model: "gemini-3.1-pro-preview",
      config: {
        systemInstruction: "You are a helpful assistant.",
      },
      history: [
        { role: "user", parts: [{ text: "Hello" }] },
        { role: "model", parts: [{ text: "Hi there!" }] }
      ]
    });
    const response = await chat.sendMessage({ message: "How are you?" });
    console.log(response.text);
  } catch (e) {
    console.error(e);
  }
}

test();
