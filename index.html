import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // CORS настройки
  const allowedOrigins = [
    'https://til-negizderi-kz.vercel.app',
    'http://localhost:3000',
    'http://localhost:8080'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured in Vercel' });
  }

  const SYSTEM_PROMPT = `Ты — эксперт-лингвист по деловому казахскому языку. 
Переведи на казахский язык: "${message}"

ПРАВИЛА:
1. Глагол всегда в конце предложения
2. Официально-деловой стиль
3. Транскрипция русскими буквами

ФОРМАТ ОТВЕТА:
Вариант для работы: [перевод на казахском]
Как произнести: [транскрипция]
Логика: [почему глагол в конце]`;

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // ✅ АКТУАЛЬНЫЕ МОДЕЛИ (2025-2026)
  // gemini-2.5-flash - самая новая, стабильная, рекомендована Google [citation:7][citation:8]
  // gemini-2.5-pro - для сложных задач
  // gemini-2.0-flash-exp - экспериментальная, но работает
  
  const modelsToTry = [
    "gemini-2.5-flash",      // ⭐ НОВАЯ! Стабильная, рекомендована
    "gemini-2.0-flash-exp",  // Экспериментальная, но доступна
    "gemini-2.5-pro"         // Мощная, если нужны сложные переводы
  ];
  
  let lastError = null;
  
  for (const modelName of modelsToTry) {
    try {
      console.log(`Пробуем модель: ${modelName}`);
      
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        }
      });
      
      const result = await model.generateContent(SYSTEM_PROMPT);
      const response = await result.response;
      const text = response.text();
      
      if (text && text.trim() !== '') {
        console.log(`✅ Успех с моделью: ${modelName}`);
        return res.status(200).json({ 
          success: true, 
          reply: text,
          model: modelName
        });
      }
      
    } catch (error) {
      console.log(`❌ Модель ${modelName} не работает:`, error.message);
      lastError = error;
      
      if (error.message.includes('API key')) {
        return res.status(401).json({ 
          success: false,
          error: 'Неверный API ключ. Проверьте настройки Vercel.'
        });
      }
      
      continue;
    }
  }
  
  // Если ничего не сработало
  return res.status(503).json({ 
    success: false,
    error: 'Gemini API временно недоступен в вашем регионе.',
    details: 'Попробуйте использовать VPN или обратитесь в поддержку Google Cloud.',
    technical: lastError?.message
  });
}
