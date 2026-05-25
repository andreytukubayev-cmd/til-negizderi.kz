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

  // Улучшенный промпт для лучшего перевода
  const SYSTEM_PROMPT = `Ты — профессиональный переводчик с русского на казахский язык. Переведи следующую фразу точно и естественно.

Русская фраза: "${message}"

Твоя задача - дать КАЧЕСТВЕННЫЙ перевод на казахский язык. НЕ используй слова "аударма", "сөзінің" и т.д. в переводе. Дай именно перевод фразы.

ОТВЕТЬ СТРОГО В ТАКОМ ФОРМАТЕ:

Вариант для работы: [перевод всей фразы на казахском]

Разбор слов:
[первое казахское слово] = [перевод на русский]
[второе казахское слово] = [перевод на русский]
[третье казахское слово] = [перевод на русский]

Как произнести: [транскрипция русскими буквами]

Два лаконичных варианта: [короткий вариант 1], [короткий вариант 2]

ВАЖНЫЕ ПРАВИЛА:
1. Переводи СМЫСЛ фразы, а не слова по отдельности
2. В разборе слов разбей переведенную фразу на отдельные слова
3. Если фраза представляет имя (например "Меня зовут Андрей"), переведи её правильно: "Менің атым Андрей"
4. Не используй в переводе слова "аударма", "сөзінің" - это не перевод, а служебные слова
5. Будь естественным и полезным`;

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // Пробуем разные модели по очереди
  const modelsToTry = ["gemini-pro", "gemini-1.0-pro"];
  let lastError = null;
  
  for (const modelName of modelsToTry) {
    try {
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
      
      if (text && !text.includes('аудармасы') && text.length > 20) {
        // Успешно получили ответ
        const parsedResponse = parseTranslationResponse(text, message);
        
        return res.status(200).json({ 
          success: true, 
          reply: parsedResponse.formatted,
          wordBreakdown: parsedResponse.wordBreakdown,
          pronunciation: parsedResponse.pronunciation,
          shortVariants: parsedResponse.shortVariants
        });
      }
    } catch (error) {
      console.log(`Модель ${modelName} не сработала:`, error.message);
      lastError = error;
    }
  }
  
  // Если все модели не сработали, используем интеллектуальный fallback
  const fallbackResponse = getIntelligentFallback(message);
  return res.status(200).json({ 
    success: true, 
    reply: fallbackResponse.formatted,
    wordBreakdown: fallbackResponse.wordBreakdown
  });
}

// Улучшенная функция парсинга
function parseTranslationResponse(text, originalMessage) {
  const lines = text.split('\n');
  let translation = '';
  let wordBreakdown = [];
  let pronunciation = '';
  let shortVariants = '';
  let formatted = '';
  
  for (let line of lines) {
    line = line.trim();
    
    if (line.includes('Вариант для работы:')) {
      translation = line.replace('Вариант для работы:', '').trim();
      // Очищаем от мусора
      translation = translation.replace(/["']/g, '');
      formatted += `✅ ${line}\n`;
    } 
    else if (line.includes('Разбор слов:')) {
      formatted += `\n📖 ${line}\n`;
    }
    else if (line.includes('Как произнести:')) {
      pronunciation = line.replace('Как произнести:', '').trim();
      formatted += `\n🔊 ${line}\n`;
    }
    else if (line.includes('лаконичных варианта:') || line.includes('лаконичный вариант:')) {
      shortVariants = line.replace(/.*лаконичных варианта:|.*лаконичный вариант:/, '').trim();
      formatted += `\n⚡ ${line}\n`;
    }
    else if (line.includes('=') && !line.includes('Вариант') && !line.includes('Разбор')) {
      const [word, meaning] = line.split('=').map(s => s.trim());
      if (word && meaning && word.length < 30) {
        wordBreakdown.push({ word, meaning });
        formatted += `  • ${word} = ${meaning}\n`;
      }
    }
  }
  
  // Если не удалось распарсить разбор слов, но есть перевод
  if (wordBreakdown.length === 0 && translation) {
    wordBreakdown = autoBreakdown(translation);
    // Добавляем разбор слов в formatted
    formatted += '\n📖 Разбор слов:\n';
    wordBreakdown.forEach(({word, meaning}) => {
      formatted += `  • ${word} = ${meaning}\n`;
    });
  }
  
  return {
    translation,
    wordBreakdown,
    pronunciation,
    shortVariants,
    formatted: formatted || text
  };
}

// Интеллектуальный fallback для распространенных фраз
function getIntelligentFallback(message) {
  const lowerMessage = message.toLowerCase();
  
  // Расширенный словарь с правильными переводами
  const translations = {
    'меня зовут': {
      translation: 'Менің атым',
      breakdown: [
        { word: 'Менің', meaning: 'мой' },
        { word: 'атым', meaning: 'имя' }
      ],
      pronunciation: 'Мениң атым',
      variants: 'Мен ...мын/мін, Атым ...'
    },
    'как тебя зовут': {
      translation: 'Сенің атың кім?',
      breakdown: [
        { word: 'Сенің', meaning: 'твой' },
        { word: 'атың', meaning: 'имя' },
        { word: 'кім', meaning: 'кто' }
      ],
      pronunciation: 'Сениң атың ким?',
      variants: 'Атың кім?, Қалай аталасың?'
    },
    'как дела': {
      translation: 'Қалыңыз қалай?',
      breakdown: [
        { word: 'Қалыңыз', meaning: 'ваше состояние' },
        { word: 'қалай', meaning: 'как' }
      ],
      pronunciation: 'Калыңыз калай?',
      variants: 'Жағдайыңыз қалай?, Амансыз ба?'
    },
    'спасибо': {
      translation: 'Рахмет',
      breakdown: [{ word: 'Рахмет', meaning: 'спасибо' }],
      pronunciation: 'Рахмет',
      variants: 'Көп рахмет, Алғыс'
    },
    'извините': {
      translation: 'Кешіріңіз',
      breakdown: [{ word: 'Кешіріңіз', meaning: 'извините' }],
      pronunciation: 'Кешириңиз',
      variants: 'Кешіріңізші, Өкінішке орай'
    },
    'привет': {
      translation: 'Сәлеметсіз бе',
      breakdown: [
        { word: 'Сәлеметсіз', meaning: 'здравствуйте' },
        { word: 'бе', meaning: '(вопросительная частица)' }
      ],
      pronunciation: 'Сәлеметсиз бе',
      variants: 'Сәлем, Армысыз'
    },
    'до свидания': {
      translation: 'Сау болыңыз',
      breakdown: [
        { word: 'Сау', meaning: 'здоровый' },
        { word: 'болыңыз', meaning: 'будьте' }
      ],
      pronunciation: 'Сау болыңыз',
      variants: 'Көріскенше, Қош болыңыз'
    },
    'доброе утро': {
      translation: 'Қайырлы таң',
      breakdown: [
        { word: 'Қайырлы', meaning: 'добрый' },
        { word: 'таң', meaning: 'утро' }
      ],
      pronunciation: 'Кайырлы таң',
      variants: 'Таңыңыз қайырлы болсын'
    },
    'добрый день': {
      translation: 'Қайырлы күн',
      breakdown: [
        { word: 'Қайырлы', meaning: 'добрый' },
        { word: 'күн', meaning: 'день' }
      ],
      pronunciation: 'Кайырлы күн',
      variants: 'Күніңіз қайырлы болсын'
    },
    'добрый вечер': {
      translation: 'Қайырлы кеш',
      breakdown: [
        { word: 'Қайырлы', meaning: 'добрый' },
        { word: 'кеш', meaning: 'вечер' }
      ],
      pronunciation: 'Кайырлы кеш',
      variants: 'Кешіңіз қайырлы болсын'
    }
  };
  
  // Ищем подходящий перевод
  for (const [key, value] of Object.entries(translations)) {
    if (lowerMessage.includes(key)) {
      // Если фраза содержит имя (например "меня зовут Андрей")
      if (key === 'меня зовут' && lowerMessage.includes('меня зовут')) {
        const name = message.match(/меня зовут\s+(\w+)/i)?.[1];
        if (name) {
          const fullTranslation = `${value.translation} ${name}`;
          return {
            formatted: `✅ Вариант для работы: ${fullTranslation}\n\n📖 Разбор слов:\n  • ${value.breakdown[0].word} = ${value.breakdown[0].meaning}\n  • ${value.breakdown[1].word} = ${value.breakdown[1].meaning}\n  • ${name} = ${name} (имя)\n\n🔊 Как произнести: ${value.pronunciation} ${name}\n\n⚡ Два лаконичных варианта: Мен ...мын/мін, Атым ...`,
            wordBreakdown: [...value.breakdown, { word: name, meaning: `${name} (имя)` }]
          };
        }
      }
      
      return {
        formatted: `✅ Вариант для работы: ${value.translation}\n\n📖 Разбор слов:\n${value.breakdown.map(b => `  • ${b.word} = ${b.meaning}`).join('\n')}\n\n🔊 Как произнести: ${value.pronunciation}\n\n⚡ Два лаконичных варианта: ${value.variants}`,
        wordBreakdown: value.breakdown
      };
    }
  }
  
  // Если ничего не найдено
  return {
    formatted: `✅ Вариант для работы: "${message}" - бұл сөздің аудармасы әзірге қосылмаған

📖 Разбор слов:
  • әзірге = пока
  • қосылмаған = не добавлено

🔊 Как произнести: "${message}" - бул создин аудармасы эзирге косылмаган

⚡ Два лаконичных варианта: Кешіріңіз, әзірге жоқ, Кейін қосылады

💡 Совет: Попробуйте спросить конкретную фразу, например "как сказать 'привет' на казахском?"`,
    wordBreakdown: [
      { word: 'әзірге', meaning: 'пока' },
      { word: 'қосылмаған', meaning: 'не добавлено' }
    ]
  };
}

// Автоматический разбор слов (если Gemini не дал разбор)
function autoBreakdown(translation) {
  const words = translation.split(/[\s,;:!?]+/).filter(w => w.length > 0 && !w.includes('"'));
  
  const dictionary = {
    'Менің': 'мой',
    'атым': 'имя',
    'Сенің': 'твой',
    'атың': 'имя',
    'кім': 'кто',
    'Қалыңыз': 'ваше состояние',
    'қалай': 'как',
    'Рахмет': 'спасибо',
    'Кешіріңіз': 'извините',
    'Сәлеметсіз': 'здравствуйте',
    'бе': '(вопросительная частица)',
    'Сау': 'здоровый',
    'болыңыз': 'будьте',
    'Қайырлы': 'добрый',
    'таң': 'утро',
    'күн': 'день',
    'кеш': 'вечер'
  };
  
  const breakdown = [];
  for (const word of words) {
    if (dictionary[word]) {
      breakdown.push({ word, meaning: dictionary[word] });
    } else if (word.length > 0 && !/^\d+$/.test(word)) {
      breakdown.push({ word, meaning: 'слово' });
    }
  }
  
  return breakdown;
}
