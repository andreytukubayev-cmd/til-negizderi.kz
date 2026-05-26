// api/chat.js — исправленная версия без транскрипции

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

  const { message, userName, systemPrompt } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!process.env.DEEPSEEK_API_KEY) {
    console.error('DEEPSEEK_API_KEY not configured');
    return res.status(500).json({ error: 'API key not configured' });
  }

  // Используем переданный systemPrompt или стандартный для перевода (БЕЗ ТРАНСКРИПЦИИ)
  const finalSystemPrompt = systemPrompt || `Ты — переводчик с русского на казахский язык.

Переведи фразу: "${message}"

ОТВЕТЬ ТОЛЬКО В ЭТОМ ФОРМАТЕ:

Перевод: [перевод на казахском]

Разбор слов:
[слово1] = [перевод1]
[слово2] = [перевод2]

Разговорный вариант: [короткая разговорная форма]

ВАЖНО: Не добавляй транскрипцию и произношение. Только перевод, разбор слов и разговорный вариант.`;

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
          { role: 'system', content: finalSystemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error('DeepSeek API error:', data.error);
      return res.status(500).json({ 
        success: false, 
        error: `API error: ${data.error.message || 'Unknown'}`
      });
    }

    const reply = data.choices[0].message.content;
    
    // Парсинг ответа
    const parsedResponse = simpleParse(reply);
    
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

// Функция парсинга ответа (без транскрипции)
function simpleParse(text) {
  const lines = text.split('\n');
  let wordBreakdown = [];
  let formatted = '';
  
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    // Пропускаем строки с транскрипцией (на всякий случай)
    if (line.startsWith('Транскрипция:') || line.startsWith('🔊')) {
      continue;
    }
    
    let cleanedLine = line;
    
    if (line.startsWith('Перевод:')) {
      cleanedLine = '✅ ' + line;
    } else if (line.startsWith('Разбор слов:') || line.startsWith('Разбор:')) {
      cleanedLine = '📖 ' + line;
    } else if (line.startsWith('Разговорный вариант:') || line.startsWith('Коротко:')) {
      cleanedLine = '💬 ' + line;
    }
    
    // Парсим разбор слов (строки с = )
    if (line.includes('=') && !line.includes('Перевод') && !line.includes('Разбор')) {
      const parts = line.split('=');
      if (parts.length === 2) {
        const word = parts[0].trim();
        const meaning = parts[1].trim();
        if (word && meaning && word.length < 40) {
          wordBreakdown.push({ word, meaning });
        }
      }
      cleanedLine = '  • ' + line;
    }
    
    formatted += cleanedLine + '\n';
  }
  
  // Если не нашли разбор слов, пробуем разбить перевод на слова
  if (wordBreakdown.length === 0) {
    for (let line of lines) {
      if (line.startsWith('Перевод:')) {
        const translation = line.replace('Перевод:', '').trim();
        const words = translation.split(/[\s,;:!?]+/).filter(w => w.length > 0);
        for (let word of words.slice(0, 6)) {
          if (word.length > 1 && !wordBreakdown.find(w => w.word === word)) {
            wordBreakdown.push({ word, meaning: '?' });
          }
        }
        break;
      }
    }
  }
  
  // Убираем лишние пустые строки
  let cleanFormatted = formatted.replace(/\n{3,}/g, '\n\n');
  
  return {
    formatted: cleanFormatted || text,
    wordBreakdown: wordBreakdown
  };
}
