// js/chat.js - с двумя режимами через меню

let localTranslator = null;
let userName = localStorage.getItem('userName') || null;
let waitingForName = false;

// Функции для работы со статистикой
function saveUserStat(userName, count) {
    let allStats = JSON.parse(localStorage.getItem('kazakhStats') || '{}');
    allStats[userName] = count;
    localStorage.setItem('kazakhStats', JSON.stringify(allStats));
}

function getUserStat(userName) {
    let allStats = JSON.parse(localStorage.getItem('kazakhStats') || '{}');
    return allStats[userName] || 0;
}

function incrementUserStat(userName) {
    let allStats = JSON.parse(localStorage.getItem('kazakhStats') || '{}');
    allStats[userName] = (allStats[userName] || 0) + 1;
    localStorage.setItem('kazakhStats', JSON.stringify(allStats));
    return allStats[userName];
}

function updateStats() {
    if (userName) {
        let userStat = getUserStat(userName);
        document.getElementById('totalTranslations').textContent = userStat;
    } else {
        document.getElementById('totalTranslations').textContent = '0';
    }
}

// ГЛАВНАЯ ФУНКЦИЯ ПРОКРУТКИ - ИСПРАВЛЕНА
function forceScrollToBottom() {
    const messagesContainer = document.getElementById('messages');
    if (messagesContainer) {
        // Мгновенная прокрутка
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        // Дополнительная прокрутка с задержкой для асинхронного контента
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 50);
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 150);
    }
}

// Флаги для автоматического переключения
let aiAvailable = true;
let lastAICheck = 0;

// Загружаем JSON с фразами
async function loadPhrases() {
    try {
        const response = await fetch('js/phrases.json');
        const data = await response.json();
        localTranslator = new LocalTranslator(data);
        console.log('✅ Локальный переводчик загружен, фраз:', Object.keys(data.static_phrases).length);
        return true;
    } catch (error) {
        console.error('❌ Ошибка загрузки phrases.json:', error);
        localTranslator = new LocalTranslator({ static_phrases: {}, dynamic_templates: [] });
        return false;
    }
}

function checkUserName() {
    if (userName) {
        document.getElementById('nameModal').style.display = 'none';
        updateStats();
        addMessage(`👋 Рад познакомиться, ${userName}! Я помогу тебе выучить казахский язык.`, 'bot');
        addMessage(`💡 Напишите фразу, нажмите "Отправить" и выберите действие: "Перевести" или "Обсудить ситуацию".`, 'bot');
    } else {
        document.getElementById('nameModal').style.display = 'flex';
        waitingForName = true;
    }
}

function saveUserName() {
    const nameInput = document.getElementById('userName');
    const name = nameInput.value.trim();
    
    if (name && name.length > 0) {
        userName = name;
        localStorage.setItem('userName', userName);
        document.getElementById('nameModal').style.display = 'none';
        waitingForName = false;
        updateStats();
        addMessage(`👋 Рад познакомиться, ${userName}! Я помогу тебе выучить казахский язык.`, 'bot');
        addMessage(`💡 Напишите фразу, нажмите "Отправить" и выберите действие: "Перевести" или "Обсудить ситуацию".`, 'bot');
    } else {
        alert('Пожалуйста, введите ваше имя');
    }
}

// Функция для парсинга ответа от ИИ (DeepSeek)
// Функция для парсинга ответа от ИИ (DeepSeek) - без произношения
function formatAIResponse(text) {
    const lines = text.split('\n');
    let translation = '';
    let breakdown = [];
    let formatted = '';
    
    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        
        if (line.startsWith('Перевод:') || line.startsWith('✅ Перевод:') || line.startsWith('Вариант для работы:')) {
            translation = line.replace(/^(✅ )?(Перевод:|Вариант для работы:)\s*/, '');
            formatted += `✅ **${translation}**\n\n`;
        }
        else if (line.startsWith('Разбор:') || line.startsWith('Разбор слов:')) {
            formatted += `📖 **Разбор слов:**\n`;
        }
        else if (line.includes('=') && !line.startsWith('Транскрипция') && !line.startsWith('🔊')) {
            const [word, meaning] = line.split('=').map(s => s.trim());
            if (word && meaning) {
                breakdown.push({ word, meaning });
                formatted += `  • **${word}** — ${meaning}\n`;
            }
        }
        // Пропускаем транскрипцию/произношение
        else if (line.startsWith('Транскрипция:') || line.startsWith('🔊 Транскрипция:') || 
                 line.startsWith('Произношение:') || line.startsWith('🔊 Произношение:')) {
            // Пропускаем - не добавляем в вывод
            continue;
        }
        else if (line.startsWith('Коротко:') || 
                 line.startsWith('Разговорный:') || 
                 line.startsWith('Разговорный вариант:') ||
                 line.startsWith('💬 Разговорный вариант:')) {
            const short = line.replace(/^(💬 )?(Разговорный вариант:|Разговорный:|Коротко:)\s*/, '');
            if (short && short.trim() !== '') {
                formatted += `\n💬 **Разговорный вариант:** ${short}\n`;
            }
        }
    }
    
    return {
        formatted: formatted,
        translation: translation,
        breakdown: breakdown
    };
}

// Форматирование локального ответа - без произношения
function formatLocalResponse(result) {
    let output = `✅ **${result.translation}**\n\n`;
    
    if (result.breakdown && result.breakdown.length > 0) {
        output += `📖 **Разбор слов:**\n`;
        result.breakdown.forEach(item => {
            output += `  • **${item.word}** — ${item.meaning}\n`;
        });
        output += `\n`;
    }
    
    const shortVariant = result.short || result.shortVariant || '';
    if (shortVariant && shortVariant.trim() !== '' && shortVariant !== result.translation) {
        output += `\n💬 **Разговорный вариант:** ${shortVariant}`;
    }
    
    return output;
}

// Функция для режима "Обсудить ситуацию"
async function discussSituation(message) {
    showTypingIndicator();
    
    let reply = '';
    let wordBreakdown = [];
    
    if (aiAvailable) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            
            const discussPrompt = `Ты — эксперт по казахскому языку для госслужащих и педагогов. 
Пользователь спрашивает: "${message}"

Твоя задача: дать совет, как лучше сказать на казахском в этой ситуации, и привести пример диалога.

ОТВЕТЬ В ТАКОМ ФОРМАТЕ:

💡 **Совет:** [краткий совет, что уместно сказать]

📝 **Пример фразы:** [основная фраза на казахском]
Разбор: [разбор слов через запятую]
Произношение: [транскрипция]

🗣️ **Мини-диалог:**
— [первая реплика на казахском] (перевод)
— [ответ на казахском] (перевод)

💬 **Коротко:** [короткий вариант]`;
            
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: message,
                    systemPrompt: discussPrompt,
                    userName: userName 
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    reply = data.reply;
                    reply = formatDiscussResponse(reply);
                    wordBreakdown = [];
                    aiAvailable = true;
                } else {
                    throw new Error('API error');
                }
            } else {
                throw new Error('Network error');
            }
        } catch (error) {
            console.log('AI unavailable for discuss, using local fallback');
            aiAvailable = false;
            lastAICheck = Date.now();
            reply = getLocalDiscussFallback(message);
        }
    } else {
        reply = getLocalDiscussFallback(message);
    }
    
    if (!aiAvailable && (Date.now() - lastAICheck) > 120000) {
        aiAvailable = true;
    }
    
    hideTypingIndicator();
    addMessage(reply, 'bot', wordBreakdown);
    
    if (userName) {
        incrementUserStat(userName);
        updateStats();
    }
    
    forceScrollToBottom(); // Прокрутка после ответа
}

function formatDiscussResponse(text) {
    const lines = text.split('\n');
    let result = [];
    let inBreakdown = false;
    
    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        
        // Пропускаем строки с произношением
        if (line.includes('Произношение:') || line.includes('🔊')) {
            continue;
        }
        
        // Заголовок совета
        if (line.includes('**Совет:**') || line.includes('Совет:')) {
            result.push('💡 **Совет:**');
            let content = line.replace(/💡\s*\*\*Совет:\*\*/, '').replace(/Совет:/, '').trim();
            if (content) result.push(content);
            continue;
        }
        
        // Заголовок примера фразы
        if (line.includes('**Пример фразы:**') || line.includes('Пример фразы:')) {
            result.push('\n📝 **Пример фразы:**');
            let content = line.replace(/📝\s*\*\*Пример фразы:\*\*/, '').replace(/Пример фразы:/, '').trim();
            if (content) result.push(content);
            continue;
        }
        
        // Заголовок разбора
        if (line.includes('**Разбор**') || line.includes('Разбор:') || line.includes('Разбор слов:')) {
            result.push('\n📖 **Разбор слов:**');
            inBreakdown = true;
            continue;
        }
        
        // Строки разбора (с • или * или без)
        if (inBreakdown && (line.startsWith('•') || line.startsWith('*') || line.includes('=') || line.includes('—'))) {
            // Очищаем строку
            let cleanLine = line.replace(/^[•*]\s*/, '');
            
            // Разбираем формат "слово = перевод" или "слово — перевод"
            let match = cleanLine.match(/^([^=—]+)[=—]\s*(.+)$/);
            if (match) {
                let word = match[1].trim();
                let meaning = match[2].trim();
                result.push(`  • **${word}** — ${meaning}`);
            } else if (cleanLine) {
                result.push(`  • ${cleanLine}`);
            }
            continue;
        }
        
        // Мини-диалог
        if (line.includes('**Мини-диалог:**') || line.includes('Мини-диалог:')) {
            result.push('\n🗣️ **Мини-диалог:**');
            inBreakdown = false;
            continue;
        }
        
        // Короткий вариант
        if (line.includes('**Коротко:**') || line.includes('Коротко:')) {
            result.push('\n💬 **Коротко:**');
            let content = line.replace(/💬\s*\*\*Коротко:\*\*/, '').replace(/Коротко:/, '').trim();
            if (content) result.push(content);
            inBreakdown = false;
            continue;
        }
        
        // Обычный текст (реплики диалога)
        if (!inBreakdown && line && !line.includes('**')) {
            result.push(line);
        }
    }
    
    // Собираем результат
    let output = result.join('\n');
    
    // Убираем множественные пустые строки
    output = output.replace(/\n{3,}/g, '\n\n');
    
    return output;
}
function getLocalDiscussFallback(message) {
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('зашел') || lowerMsg.includes('заходить') || lowerMsg.includes('войти')) {
        return `💡 **Совет:** Когда вы заходите в аудиторию или кабинет, уместно поздороваться и представиться, если вы впервые.

📝 **Пример фразы:** Сәлеметсіз бе! Менің атым ${userName || 'Асет'}.
  📖 Разбор: Сәлеметсіз бе = здравствуйте, Менің атым = меня зовут
  🔊 Произношение: Сәлеметсіз бе! Мениң атым ${userName || 'Асет'}.

🗣️ **Мини-диалог:**
— Сәлеметсіз бе! Кіруге бола ма? (Здравствуйте! Можно войти?)
— Иә, кіріңіз. (Да, входите.)

💬 **Коротко:** Сәлем! Кіруге бола ма?`;
    }
    
    if (lowerMsg.includes('совещание') || lowerMsg.includes('планерка')) {
        return `💡 **Совет:** На совещании важно вежливо попросить слово или задать вопрос.

📝 **Пример фразы:** Сөз сұраймын. (Прошу слово)
  📖 Разбор: Сөз = слово, сұраймын = прошу
  🔊 Произношение: Сөз сураймын

🗣️ **Мини-диалог:**
— Сөз сұраймын, келесі мәселе бойынша. (Прошу слово по следующему вопросу)
— Иә, айтыңыз. (Да, говорите.)

💬 **Коротко:** Сөз бересіз бе?`;
    }
    
    return `💡 **Совет:** Я учусь подбирать фразы для разных ситуаций. Попробуйте спросить конкретнее, например:
• "Что сказать когда зашел в аудиторию?"
• "Как обратиться к коллеге?"
• "Что сказать на совещании?"

📝 **А пока, вот универсальная вежливая фраза:** Кешіріңіз, көмектесе аласыз ба?
  🔊 Произношение: Кешириңиз, көмектесе аласыз ба?
  📖 Перевод: Извините, не могли бы вы помочь?

💬 **Коротко:** Көмектесесіз бе?`;
}

// ГЛАВНАЯ ФУНКЦИЯ — режим "Перевести"
async function sendTranslate() {
    const input = document.getElementById('userInput');
    let message = input.value.trim();
    
    if (!message) return;
    
    if (waitingForName) {
        saveUserNameFromMessage(message);
        input.value = '';
        return;
    }
    
    addMessage(message, 'user');
    input.value = '';
    showTypingIndicator();
    
    let reply = '';
    let wordBreakdown = [];
    let success = false;
    
    if (aiAvailable) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const translatePrompt = `Ты — переводчик с русского на казахский. Переведи фразу: "${message}"
Ответь строго в формате:
Перевод: [перевод]
Разбор слов:
[слово1] = [перевод1]
[слово2] = [перевод2]
Транскрипция: [русскими буквами]
Разговорный вариант: [коротко]`;
            
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: message,
                    systemPrompt: translatePrompt,
                    userName: userName 
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    success = true;
                    const parsedAI = formatAIResponse(data.reply);
                    reply = parsedAI.formatted;
                    wordBreakdown = parsedAI.breakdown || [];
                    aiAvailable = true;
                } else {
                    success = false;
                }
            } else {
                success = false;
            }
        } catch (error) {
            console.log('AI unavailable, using local mode');
            aiAvailable = false;
            lastAICheck = Date.now();
            success = false;
        }
    }
    
    if (!success) {
        const localResult = localTranslator.translate(message);
        reply = formatLocalResponse(localResult);
        wordBreakdown = localResult.breakdown || [];
        
        if (!aiAvailable && (Date.now() - lastAICheck) > 120000) {
            aiAvailable = true;
        }
    }
    
    hideTypingIndicator();
    
    if (userName && reply.includes('Пользователь')) {
        reply = reply.replace('Пользователь', userName);
    }
    
    addMessage(reply, 'bot', wordBreakdown);
    
    if (userName) {
        incrementUserStat(userName);
        updateStats();
    }
    
    forceScrollToBottom(); // Прокрутка после ответа
}

// Форматирование ответа с подсказками - ИСПРАВЛЕНА (добавлена прокрутка)
function addMessage(text, sender, wordBreakdown = null) {
    const messagesContainer = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    if (sender === 'bot' && wordBreakdown && wordBreakdown.length > 0) {
        contentDiv.innerHTML = formatMessageWithTooltips(text, wordBreakdown);
        addTooltipStyles();
    } else {
        contentDiv.innerHTML = formatMessage(text);
    }
    
    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);
    
    // Прокрутка вниз
    forceScrollToBottom();
}

function formatMessageWithTooltips(text, wordBreakdown) {
    const wordMap = {};
    wordBreakdown.forEach(item => {
        wordMap[item.word.toLowerCase()] = item.meaning;
    });
    
    let formatted = '';
    const lines = text.split('\n');
    
    for (let line of lines) {
        if (line.includes('✅') && !line.includes('**')) {
            let translation = line.replace('✅', '').trim();
            let highlightedTranslation = highlightWords(translation, wordMap);
            formatted += `✅ ${highlightedTranslation}<br>`;
        } 
        else if (line.includes('📖') && (line.includes('Разбор слов') || line.includes('**Разбор слов**'))) {
            formatted += `<br><strong>📖 Разбор слов:</strong><br>`;
        }
        else if (line.includes('•') && line.includes('=')) {
            formatted += `<div style="margin-left: 20px; color: #555;">${line}</div>`;
        }
        else if (line.includes('🔊') && (line.includes('Как произнести') || line.includes('**Как произнести**'))) {
            const lineIndex = lines.indexOf(line);
            const nextLine = lineIndex + 1 < lines.length ? lines[lineIndex + 1] : '';
            if (nextLine && nextLine.trim() && !nextLine.includes('💬')) {
                formatted += `<br><strong>🔊 Как произнести:</strong><br>`;
            }
        }
        else if (line.includes('💬') && (line.includes('Разговорный вариант') || line.includes('**Разговорный вариант**'))) {
            const lineIndex = lines.indexOf(line);
            const nextLine = lineIndex + 1 < lines.length ? lines[lineIndex + 1] : '';
            if (nextLine && nextLine.trim()) {
                formatted += `<br><strong>💬 Разговорный вариант:</strong><br>`;
            }
        }
        else if (line.trim() && !line.includes('🔊') && !line.includes('💬') && !line.includes('**Как произнести**') && !line.includes('**Разговорный вариант**')) {
            formatted += `${line}<br>`;
        }
    }
    
    return formatted;
}

function highlightWords(text, wordMap) {
    const words = text.split(/(\s+|[.,!?;:])/);
    return words.map(word => {
        const cleanWord = word.toLowerCase().replace(/[.,!?;:]/g, '');
        if (wordMap[cleanWord] && word.trim().length > 0) {
            return `<span class="kazakh-word" data-tooltip="${escapeHtml(wordMap[cleanWord])}">${escapeHtml(word)}</span>`;
        }
        return escapeHtml(word);
    }).join('');
}

function addTooltipStyles() {
    if (document.getElementById('tooltip-styles')) return;
    const style = document.createElement('style');
    style.id = 'tooltip-styles';
    style.textContent = `
        .kazakh-word {
            position: relative;
            display: inline-block;
            cursor: help;
            border-bottom: 2px dotted #667eea;
            transition: all 0.2s ease;
            font-weight: 500;
        }
        .kazakh-word:hover {
            background-color: rgba(102, 126, 234, 0.1);
        }
        .kazakh-word::before {
            content: attr(data-tooltip);
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%) translateY(-8px);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 0.85em;
            white-space: nowrap;
            z-index: 1000;
            opacity: 0;
            pointer-events: none;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-weight: normal;
        }
        .kazakh-word:hover::before {
            opacity: 1;
            transform: translateX(-50%) translateY(-12px);
        }
        @media (max-width: 768px) {
            .kazakh-word::before {
                font-size: 0.75em;
                padding: 4px 8px;
                white-space: normal;
                max-width: 200px;
                bottom: auto;
                top: 100%;
                transform: translateX(-50%) translateY(8px);
            }
            .kazakh-word:hover::before {
                transform: translateX(-50%) translateY(12px);
            }
        }
    `;
    document.head.appendChild(style);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatMessage(text) {
    let formatted = text.replace(/\n/g, '<br>');
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return formatted;
}

function saveUserNameFromMessage(name) {
    if (name && name.trim().length > 0) {
        userName = name.trim();
        localStorage.setItem('userName', userName);
        waitingForName = false;
        const messages = document.getElementById('messages');
        const botQuestion = messages.querySelector('.message.bot:last-child');
        if (botQuestion && botQuestion.innerText.includes('Как ваше имя?')) {
            botQuestion.remove();
        }
        addMessage(name, 'user');
        updateStats();
        addMessage(`👋 Рад познакомиться, ${userName}! Я помогу вам выучить казахский язык.`, 'bot');
        addMessage(`💡 Напишите фразу, нажмите "Отправить" и выберите действие: "Перевести" или "Обсудить ситуацию".`, 'bot');
        forceScrollToBottom();
    }
}

let typingIndicator = null;

function showTypingIndicator() {
    const messagesContainer = document.getElementById('messages');
    typingIndicator = document.createElement('div');
    typingIndicator.className = 'message bot';
    typingIndicator.id = 'typingIndicator';
    typingIndicator.innerHTML = `<div class="typing-indicator" style="display: block;"><span></span><span></span><span></span></div>`;
    messagesContainer.appendChild(typingIndicator);
    forceScrollToBottom();
}

function hideTypingIndicator() {
    if (typingIndicator) {
        typingIndicator.remove();
        typingIndicator = null;
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', async function() {
    await loadPhrases();
    checkUserName();
    
    document.getElementById('userName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') saveUserName();
    });
    
    // Элементы меню
    const sendBtn = document.getElementById('sendBtn');
    const actionMenu = document.getElementById('actionMenu');
    const actionMenuOverlay = document.getElementById('actionMenuOverlay');
    const actionTranslate = document.getElementById('actionTranslate');
    const actionDiscuss = document.getElementById('actionDiscuss');
    
    function closeActionMenu() {
        actionMenu.classList.remove('active');
    }
    
    function showActionMenu() {
        const input = document.getElementById('userInput');
        const message = input.value.trim();
        if (!message) {
            addMessage('💡 Напишите фразу или ситуацию, а затем выберите действие.', 'bot');
            return;
        }
        actionMenu.classList.add('active');
    }
    
    if (sendBtn) sendBtn.addEventListener('click', showActionMenu);
    if (actionMenuOverlay) actionMenuOverlay.addEventListener('click', closeActionMenu);
    
    if (actionTranslate) {
        actionTranslate.addEventListener('click', () => {
            closeActionMenu();
            sendTranslate();
        });
    }
    
    if (actionDiscuss) {
        actionDiscuss.addEventListener('click', () => {
            closeActionMenu();
            const input = document.getElementById('userInput');
            const message = input.value.trim();
            if (!message) {
                addMessage('💡 Напишите ситуацию, например: "Что сказать когда зашел в аудиторию?"', 'bot');
                return;
            }
            if (waitingForName) {
                saveUserNameFromMessage(message);
                input.value = '';
                return;
            }
            addMessage(message, 'user');
            input.value = '';
            discussSituation(message);
        });
    }
    
    const userInput = document.getElementById('userInput');
    if (userInput) {
        userInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                showActionMenu();
            }
        });
    }
});
