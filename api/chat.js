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
  
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
    }, { apiVersion: 'v1' }); // Принудительно ставим v1 вместо v1beta

    const result = await model.generateContent(SYSTEM_PROMPT + "\n\nПользователь: " + message);
    const response = await result.response;
    return res.status(200).json({ reply: response.text() });
  } catch (error) {
    // Выводим текст ошибки, чтобы точно знать, если что-то пойдет не так
    return res.status(500).json({ error: error.message });
  }
}
