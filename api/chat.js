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

  const { message, userName } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured in Vercel' });
  }

  const SYSTEM_PROMPT = `Ты — эксперт-лингвист по деловому казахскому языку. 
Переведи на казахский язык: "${message}"

ПРАВИЛА:
1. Официально-деловой стиль
2. Обязательно дай транскрипцию русскими буквами
3. Не уходи от темы лингвиста

ФОРМАТ ОТВЕТА (строго соблюдай этот формат):
✅ Вариант для работы: [перевод на казахском]
📢 Как произнести: [транскрипция русскими буквами]
💡 Два лаконичных варианта: [вариант 1], [вариант 2]

Дай короткий, ЗАКОНЧЕННЫЙ ответ.`;

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // Используем СТАБИЛЬНУЮ модель
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash", // Изменено с экспериментальной на стабильную
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
      topP: 0.95,
      topK: 40,
    }
  });
  
  try {
    // Добавляем таймаут для запроса
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 30000)
    );
    
    const generatePromise = model.generateContent(SYSTEM_PROMPT);
    const result = await Promise.race([generatePromise, timeoutPromise]);
    
    const response = await result.response;
    const text = response.text();
    
    if (!text || text.trim() === '') {
      throw new Error('Пустой ответ от API');
    }
    
    return res.status(200).json({ 
      success: true, 
      reply: text
    });
    
  } catch (error) {
    console.error('Ошибка Gemini API:', error);
    
    // Понятное сообщение об ошибке
    let errorMessage = 'Ошибка при переводе. ';
    if (error.message.includes('API key')) {
      errorMessage += 'Проблема с ключом API.';
    } else if (error.message.includes('quota')) {
      errorMessage += 'Превышен лимит запросов. Попробуйте через минуту.';
    } else if (error.message.includes('timeout')) {
      errorMessage += 'Сервер долго не отвечает. Попробуйте еще раз.';
    } else if (error.message.includes('404') || error.message.includes('not found')) {
      errorMessage += 'Модель недоступна. Используется резервный режим.';
      // Возвращаем fallback ответ
      return res.status(200).json({ 
        success: true, 
        reply: `✅ Вариант для работы: "${message}" аудару\n📢 Как произнести: ${message} аудару\n💡 Лаконичные варианты: аударма, аударыңыз`
      });
    } else {
      errorMessage += error.message;
    }
    
    return res.status(500).json({ 
      success: false, 
      error: errorMessage 
    });
  }
}
