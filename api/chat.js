import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // CORS настройки
  const allowedOrigins = [
    'https://til-negizderi.kz',
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

  // Проверка API ключа
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured in Vercel' });
  }

  const SYSTEM_PROMPT = `Ты — эксперт-лингвист по деловому казахскому языку. 
Твоя задача - переводить русские фразы на казахский язык для педагогов и госслужащих.

ВАЖНЫЕ ПРАВИЛА:
1. Глагол всегда в конце предложения
2. Используй официально-деловой стиль
3. Транскрипцию пиши русскими буквами

ФОРМАТ ОТВЕТА (строго соблюдай):
Вариант для работы: [перевод на казахском]
Как произнести: [транскрипция русскими буквами]
Логика: [почему глагол в конце]

Пользователь просит перевести: "${message}"

Дай ответ строго по формату.`;

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // Список моделей в порядке приоритета (от самых стабильных)
  const modelsToTry = [
    "gemini-2.0-flash-lite",      // Самая новая и легкая
    "gemini-1.5-flash",            // Стандартная
    "gemini-2.0-flash-exp",        // Экспериментальная
    "gemini-1.5-pro"               // Старая, но надежная
  ];
  
  let lastError = null;
  
  // Пробуем каждую модель по очереди
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
          model: modelName // Показываем какая модель сработала
        });
      }
      
    } catch (error) {
      console.log(`❌ Модель ${modelName} не работает: ${error.message}`);
      lastError = error;
      continue; // Пробуем следующую модель
    }
  }
  
  // Если ни одна модель не сработала
  console.error('Все модели не доступны');
  return res.status(503).json({ 
    success: false,
    error: 'Сервис временно недоступен. Попробуйте позже.',
    details: lastError?.message || 'Все модели Gemini вернули ошибку'
  });
}
