import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // ✅ Используем правильное название модели
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const SYSTEM_PROMPT = `Ты — эксперт-лингвист по деловому казахскому языку...`;

  try {
    const result = await model.generateContent(SYSTEM_PROMPT + "\n\nПользователь: " + message);
    const response = await result.response;
    const text = response.text();
    
    return res.status(200).json({ reply: text });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
