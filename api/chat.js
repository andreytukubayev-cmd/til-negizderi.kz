// api/chat.js — рабочая версия с DeepSeek (ИСПРАВЛЕНА)

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

  // Используем DeepSeek API
  if (!process.env.DEEPSEEK_API_KEY) {
    console.error('DEEPSEEK_API_KEY not configured');
    return res.status(500).json({ error: 'DEEPSEEK_API_KEY not configured in Vercel' });
  }

  const SYSTEM_PROMPT = `Ты — профессиональный переводчик с русского на казахский язык. Переведи следующую фразу точно и естественно.

Русская фраза: "${message}"

ОТВЕТЬ СТРОГО В ТАКОМ ФОРМАТЕ:

Это можно сказать так: [перевод всей фразы на казахском]

Разбор слов:
[первое казахское слово] = [перевод на русский]
[второе казахское слово] = [перевод на русский]

Как произнести: [транскрипция русскими буквами]

Или более разговорный вариант: [короткий вариант]

ВАЖНО:
1. Переводи СМЫСЛ фразы
2. Разбивай переведенную фразу на отдельные слова
3. Не используй лишних символов и эмодзи`;

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error('DeepSeek API error:', data.error);
      return res.status(500).json({ 
        success: false, 
        error: `DeepSeek error: ${data.error.message || 'Unknown error'}`
      });
    }

    const reply = data.choices[0].message.content;
    
    // Парсим ответ для совместимости с фронтендом
    const parsedResponse = parseTranslationResponse(reply);
    
    return res.status(200).json({ 
      success: true, 
      reply: parsedResponse.formatted,
      wordBreakdown: parsedResponse.wordBreakdown
    });

  } catch (error) {
    console.error('DeepSeek error:', error);
    return res.status(500).json({ 
      success: false, 
      error: `Ошибка: ${error.message}`
    });
  }
}

// Функция парсинга ответа
function parseTranslationResponse(text) {
  const lines = text.split('\n');
  let translation = '';
  let wordBreakdown = [];
  let pronunciation = '';
  let shortVariants = '';
  let formatted = '';
  
  for (let line of lines) {
    line = line.trim();
    
    if (line.includes('Это можно сказать так:')) {
      translation = line.replace('Это можно сказать так:', '').trim();
      formatted += `✅ ${line}\n`;
    } 
    else if (line.includes('Разбор слов:')) {
      formatted += `\n📖 ${line}\n`;
    }
    else if (line.includes('Как произнести:')) {
      pronunciation = line.replace('Как произнести:', '').trim();
      formatted += `\n🔊 ${line}\n`;
    }
    else if (line.includes('разговорный вариант:')) {
      shortVariants = line.replace(/.*разговорный вариант:/, '').trim();
      formatted += `\n💬 ${line}\n`;
    }
    else if (line.includes('=') && !line.includes('Это можно сказать')) {
      const [word, meaning] = line.split('=').map(s => s.trim());
      if (word && meaning && word.length < 40) {
        wordBreakdown.push({ word, meaning });
        formatted += `  • ${word} = ${meaning}\n`;
      }
    }
    else if (line && !line.includes('Это можно сказать') && !line.includes('Разбор') && !line.includes('Как произнести') && !line.includes('разговорный')) {
      formatted += `${line}\n`;
    }
  }
  
  return {
    translation,
    wordBreakdown,
    pronunciation,
    shortVariants,
    formatted: formatted || text
  };
}
