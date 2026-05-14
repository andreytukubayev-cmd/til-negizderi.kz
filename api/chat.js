import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Объявляем переменную промпта, чтобы ошибка "not defined" исчезла
  const SYSTEM_PROMPT = `Ты — эксперт-лингвист по деловому казахскому языку. 
  Переводи фразы для педагогов и госслужащих. 
  ПРАВИЛО: Глагол всегда в конце. 
  ФОРМАТ: 
  Вариант для работы: [фраза]
  Как произнести: [транскрипция русскими буквами]
  Логика: [почему глагол в конце]`;

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  try {
    // Используем принудительную версию v1 для стабильности
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
    }, { apiVersion: 'v1' }); 

    const result = await model.generateContent(SYSTEM_PROMPT + "\n\nПользователь: " + message);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ reply: text });
  } catch (error) {
    // Теперь мы увидим реальную причину, если Google снова откажет
    return res.status(500).json({ error: error.message });
  }
}
