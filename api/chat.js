import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);

  // Настройка делового стиля для педагогов и госслужащих
  const SYSTEM_PROMPT = `Ты — эксперт-лингвист по деловому казахскому языку. 
  Переводи фразы для педагогов и госслужащих. 
  ПРАВИЛО: Глагол всегда в конце. 
  ФОРМАТ: 
  Вариант для работы: [фраза]
  Как произнести: [транскрипция русскими буквами]
  Логика: [почему глагол в конце]`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(SYSTEM_PROMPT + "\n\nПользователь: " + message);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ reply: text });
  } catch (error) {
    return res.status(500).json({ error: "Ошибка при обращении к AI" });
  }
}
