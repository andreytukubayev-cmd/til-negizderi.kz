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
Переведи на казахский язык фразу: "${message}"

ПРАВИЛА:
1. Официально-деловой стиль
2. Обязательно разбери каждое слово из перевода

ФОРМАТ ОТВЕТА (ОЧЕНЬ ВАЖНО - строго соблюдай этот формат):
Вариант для работы: [перевод на казахском]

Разбор слов:
[казахское слово 1] = [русский перевод 1]
[казахское слово 2] = [русский перевод 2]
[казахское слово 3] = [русский перевод 3]

Как произнести: [транскрипция русскими буквами]
Два лаконичных варианта: [вариант 1], [вариант 2]

В разборе слов каждое слово должно быть отдельной строкой в формате "слово = перевод"`;

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // ИСПРАВЛЕНО: Используем правильную модель gemini-pro
  const model = genAI.getGenerativeModel({ 
    model: "gemini-pro",  // Изменено с gemini-1.5-flash на gemini-pro
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    }
  });
  
  try {
    const result = await model.generateContent(SYSTEM_PROMPT);
    const response = await result.response;
    const text = response.text();
    
    if (!text || text.trim() === '') {
      throw new Error('Пустой ответ от API');
    }
    
    // Разбираем ответ на компоненты
    const parsedResponse = parseTranslationResponse(text);
    
    return res.status(200).json({ 
      success: true, 
      reply: parsedResponse.formatted,
      wordBreakdown: parsedResponse.wordBreakdown,
      pronunciation: parsedResponse.pronunciation,
      shortVariants: parsedResponse.shortVariants
    });
    
  } catch (error) {
    console.error('Ошибка Gemini API:', error);
    
    // Понятное сообщение об ошибке
    let errorMessage = 'Ошибка при переводе. ';
    if (error.message.includes('API key')) {
      errorMessage += 'Проблема с ключом API.';
    } else if (error.message.includes('quota')) {
      errorMessage += 'Превышен лимит запросов. Попробуйте через минуту.';
    } else if (error.message.includes('404')) {
      errorMessage += 'Модель временно недоступна. Используется резервный режим.';
      // Возвращаем fallback ответ
      return res.status(200).json({ 
        success: true, 
        reply: getFallbackResponse(message),
        wordBreakdown: getFallbackBreakdown(message)
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

// Функция для парсинга ответа от ИИ
function parseTranslationResponse(text) {
  const lines = text.split('\n');
  let translation = '';
  let wordBreakdown = [];
  let pronunciation = '';
  let shortVariants = '';
  let formatted = '';
  
  let currentSection = '';
  
  for (let line of lines) {
    line = line.trim();
    
    if (line.includes('Вариант для работы:')) {
      translation = line.replace('Вариант для работы:', '').trim();
      formatted += line + '\n';
      currentSection = 'translation';
    } 
    else if (line.includes('Разбор слов:')) {
      formatted += '\n📖 ' + line + '\n';
      currentSection = 'breakdown';
    }
    else if (line.includes('Как произнести:')) {
      pronunciation = line.replace('Как произнести:', '').trim();
      formatted += '\n🔊 ' + line + '\n';
      currentSection = 'pronunciation';
    }
    else if (line.includes('лаконичных варианта:') || line.includes('лаконичный вариант:')) {
      shortVariants = line.replace(/.*лаконичных варианта:|.*лаконичный вариант:/, '').trim();
      formatted += '\n⚡ ' + line + '\n';
      currentSection = 'short';
    }
    else if (currentSection === 'breakdown' && line.includes('=')) {
      const [word, meaning] = line.split('=').map(s => s.trim());
      if (word && meaning) {
        wordBreakdown.push({ word, meaning });
        formatted += `  • ${word} = ${meaning}\n`;
      }
    }
    else if (line && !line.includes('Вариант') && !line.includes('Разбор') && !line.includes('Как произнести') && !line.includes('лаконичн')) {
      if (currentSection === 'translation' && translation === '') {
        translation = line;
        formatted = 'Вариант для работы: ' + line + '\n';
      } else {
        formatted += line + '\n';
      }
    }
  }
  
  // Если разбор слов не получен, пробуем разобрать перевод самостоятельно
  if (wordBreakdown.length === 0 && translation) {
    wordBreakdown = autoBreakdown(translation);
  }
  
  return {
    translation,
    wordBreakdown,
    pronunciation,
    shortVariants,
    formatted: formatted || text
  };
}

// Функция автоматического разбора на слова
function autoBreakdown(translation) {
  const words = translation.split(/[\s,;:!?]+/).filter(w => w.length > 0);
  
  const basicDictionary = {
    'сәлем': 'привет',
    'сәлеметсіз': 'здравствуйте',
    'сәлеметсіздер': 'здравствуйте (мн.ч)',
    'бе': 'ли (вопрос)',
    'қалай': 'как',
    'жақсы': 'хорошо',
    'рахмет': 'спасибо',
    'кешіріңіз': 'извините',
    'кешір': 'прости',
    'сау': 'здоровый',
    'болыңыз': 'будьте',
    'бол': 'будь',
    'ішіңіз': 'пейте',
    'жеңіз': 'ешьте',
    'барыңыз': 'идите',
    'келіңіз': 'приходите',
    'көріңіз': 'посмотрите',
    'айтыңыз': 'скажите',
    'жазыңыз': 'напишите',
    'оқыңыз': 'читайте',
    'үйреніңіз': 'учите',
    'түсініңіз': 'поймите',
    'мен': 'я',
    'сен': 'ты',
    'сіз': 'вы',
    'ол': 'он/она',
    'біз': 'мы',
    'сендер': 'вы (мн.ч)',
    'олар': 'они'
  };
  
  return words.map(word => {
    const lowerWord = word.toLowerCase();
    const meaning = basicDictionary[lowerWord] || '???';
    return { word, meaning };
  });
}

// Резервный ответ при ошибке API
function getFallbackResponse(message) {
  const lowerMessage = message.toLowerCase();
  
  const fallbackDict = {
    'привет': 'Сәлеметсіз бе',
    'здравствуйте': 'Сәлеметсіз бе',
    'как дела': 'Қалыңыз қалай?',
    'спасибо': 'Рахмет',
    'пожалуйста': 'Өтінемін',
    'извините': 'Кешіріңіз',
    'до свидания': 'Сау болыңыз',
    'да': 'Иә',
    'нет': 'Жоқ',
    'хорошо': 'Жақсы',
    'плохо': 'Жаман'
  };
  
  let translation = '';
  for (const [key, value] of Object.entries(fallbackDict)) {
    if (lowerMessage.includes(key)) {
      translation = value;
      break;
    }
  }
  
  if (translation) {
    return `Вариант для работы: ${translation}
Разбор слов:
  • ${translation.split(' ')[0]} = ${Object.entries(fallbackDict).find(([k,v]) => v === translation.split(' ')[0])?.[0] || 'слово'}
Как произнести: ${translation}
Два лаконичных варианта: ${translation}`;
  }
  
  return `Вариант для работы: "${message}" сөзінің аудармасы
Разбор слов:
  • аударма = перевод
Как произнести: "${message}" аудармасы
Два лаконичных варианта: аударма, аударыңыз

💡 Подсказка: для более точного перевода попробуйте переформулировать вопрос или использовать более простые фразы.`;
}

function getFallbackBreakdown(message) {
  return [{ word: 'аударма', meaning: 'перевод' }];
}
