import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
});

export const generateAIResponse = async ({ query, context }) => {
  const prompt = `You are a customer support agent. Use this knowledge base:
  ${JSON.stringify(context)}
  
  Customer Question: ${query}
  Response:`;
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are a helpful customer support agent." },
      { role: "user", content: prompt }
    ],
    temperature: 0.7
  });
  
  return completion.choices[0]?.message?.content || "I couldn't understand that.";
};