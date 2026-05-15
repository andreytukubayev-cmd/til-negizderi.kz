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
1. Официально-деловой стиль
2. Транскрипция русскими буквами
3. Не уходи от темы лингвиста

ФОРМАТ ОТВЕТА:
Вариант для работы: [перевод на казахском]
Как произнести: [транскрипция русскими буквами]
Два варианта сказать это же только лаконичнее.
Дай короткий, ЗАКОНЧЕННЫЙ ответ.`;

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // Используем ТОЛЬКО одну модель - gemini-2.0-flash-exp
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash-exp",
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,  // Достаточно для полных ответов
    }
  });
  
  try {
    const result = await model.generateContent(SYSTEM_PROMPT);
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
    } else if (error.message.includes('region') || error.message.includes('404')) {
      errorMessage += 'Сервис временно недоступен. Попробуйте позже.';
    } else {
      errorMessage += error.message;
    }
    
    return res.status(500).json({ 
      success: false, 
      error: errorMessage 
    });
  }
}
