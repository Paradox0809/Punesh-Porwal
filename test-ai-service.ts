import { getAIResponse } from "./src/services/aiService";

async function test() {
  try {
    const analysis = {
      company: { name: "Test Co" },
      valuation: { marketCap: "1B", peRatio: { value: 10, status: "Fair" } }
    } as any;
    
    const history = [
      { role: "user" as const, parts: [{ text: "Hello" }] }
    ];
    
    const response = await getAIResponse("Hello", analysis, history);
    console.log(response);
  } catch (e) {
    console.error(e);
  }
}

test();
