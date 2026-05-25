// chat.js - ГИБРИДНАЯ ВЕРСИЯ
let userName = localStorage.getItem('userName') || null;
let waitingForName = false;
let totalTranslations = localStorage.getItem('totalTranslations') || 0;
let useAI = localStorage.getItem('useAI') !== 'false'; // По умолчанию ИИ включён
let aiAvailable = true; // Флаг доступности ИИ
let currentMode = 'hybrid'; // hybrid, ai_only, local_only

updateStats();

function updateStats() {
    document.getElementById('totalTranslations').textContent = totalTranslations;
}

function checkUserName() {
    if (userName) {
        document.getElementById('nameModal').style.display = 'none';
        addMessage(`👋 Рад познакомиться, ${userName}!`, 'bot');
        showModeSelector();
    } else {
        document.getElementById('nameModal').style.display = 'flex';
        waitingForName = true;
    }
}

function showModeSelector() {
    const mode = useAI ? '🌐 ИИ (DeepSeek)' : '📚 Локальный режим';
    addMessage(`Сейчас активен режим: ${mode}`, 'bot');
    addMessage(`💡 Напишите:\n• "включи ИИ" — для перевода через DeepSeek\n• "выключи ИИ" — для локального обучения\n• "гибрид" — автоматический выбор`, 'bot');
}

function saveUserName() {
    const nameInput = document.getElementById('userName');
    const name = nameInput.value.trim();
    if (name && name.length > 0) {
        userName = name;
        localStorage.setItem('userName', userName);
        document.getElementById('nameModal').style.display = 'none';
        waitingForName = false;
        addMessage(`👋 Рад познакомиться, ${userName}!`, 'bot');
        showModeSelector();
    }
}

// ГЛАВНАЯ ФУНКЦИЯ ОТПРАВКИ — ГИБРИДНАЯ
async function sendMessage() {
    const input = document.getElementById('userInput');
    let message = input.value.trim();
    
    if (!message) return;
    if (waitingForName) {
        saveUserNameFromMessage(message);
        input.value = '';
        return;
    }
    
    // Обработка команд
    if (message.toLowerCase() === 'включи ии') {
        useAI = true;
        aiAvailable = true;
        localStorage.setItem('useAI', 'true');
        addMessage('✅ ИИ включён. Теперь использую DeepSeek для переводов.', 'bot');
        input.value = '';
        return;
    }
    
    if (message.toLowerCase() === 'выключи ии' || message.toLowerCase() === 'локальный') {
        useAI = false;
        localStorage.setItem('useAI', 'false');
        addMessage('📚 Переключился на локальный режим. Изучаем казахский вместе!', 'bot');
        input.value = '';
        return;
    }
    
    if (message.toLowerCase() === 'гибрид') {
        currentMode = 'hybrid';
        addMessage('🔄 Гибридный режим: сначала пробую ИИ, если недоступен — локальный перевод.', 'bot');
        input.value = '';
        return;
    }
    
    addMessage(message, 'user');
    input.value = '';
    showTypingIndicator();
    
    const sendButton = document.getElementById('sendButton');
    sendButton.disabled = true;
    
    let success = false;
    let reply = '';
    let wordBreakdown = [];
    
    // ПЫТАЕМСЯ ИСПОЛЬЗОВАТЬ ИИ (если включён)
    if (useAI && aiAvailable) {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message, userName: userName })
            });
            
            const data = await response.json();
            
            if (data.success) {
                success = true;
                reply = data.reply;
                wordBreakdown = data.wordBreakdown || [];
                aiAvailable = true;
            } else if (data.error && data.error.includes('busy')) {
                // DeepSeek перегружен — переключаемся на локальный
                console.log('DeepSeek busy, switching to local');
                aiAvailable = false;
                success = false;
            } else {
                success = false;
            }
        } catch (error) {
            console.error('AI error:', error);
            aiAvailable = false;
            success = false;
        }
    }
    
    // ЕСЛИ ИИ НЕ СРАБОТАЛ — ИСПОЛЬЗУЕМ ЛОКАЛЬНЫЙ
    if (!success) {
        const localResult = localTranslator.translate(message);
        reply = formatLocalResponse(localResult);
        wordBreakdown = localResult.breakdown || [];
        
        // Добавляем примечание о режиме
        if (useAI && !aiAvailable) {
            reply += '\n\n⚠️ DeepSeek временно недоступен. Использую локальный режим.';
        }
    }
    
    hideTypingIndicator();
    
    // Персонализация
    if (userName && reply.includes('Пользователь')) {
        reply = reply.replace('Пользователь', userName);
    }
    
    addMessage(reply, 'bot', wordBreakdown);
    totalTranslations++;
    localStorage.setItem('totalTranslations', totalTranslations);
    updateStats();
    
    sendButton.disabled = false;
}

// Форматирование локального ответа
function formatLocalResponse(result) {
    let output = `✅ **${result.translation}**\n\n`;
    
    if (result.breakdown && result.breakdown.length > 0) {
        output += `📖 **Разбор слов:**\n`;
        result.breakdown.forEach(item => {
            output += `• ${item.word} = ${item.meaning}\n`;
        });
        output += `\n`;
    }
    
    output += `🔊 **Как произнести:** ${result.pronunciation}\n`;
    output += `\n💬 **Коротко:** ${result.short}`;
    
    if (result.isLearning) {
        output += `\n\n📚 Я учусь переводить такие фразы. Попробуйте спросить иначе!`;
    }
    
    return output;
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
        addMessage(`👋 Рад познакомиться, ${userName}!`, 'bot');
        showModeSelector();
    }
}

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
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
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
        else if (line.includes('Разбор слов:')) {
            formatted += `<br><strong>📖 ${line}</strong><br>`;
        }
        else if (line.includes('•') && line.includes('=')) {
            formatted += `<div style="margin-left: 20px; color: #555;">${line}</div>`;
        }
        else if (line.includes('Как произнести:')) {
            formatted += `<br><strong>🔊 ${line}</strong><br>`;
        }
        else if (line.includes('Коротко:')) {
            formatted += `<br><strong>💬 ${line}</strong><br>`;
        }
        else if (line.trim()) {
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

let typingIndicator = null;

function showTypingIndicator() {
    const messagesContainer = document.getElementById('messages');
    typingIndicator = document.createElement('div');
    typingIndicator.className = 'message bot';
    typingIndicator.id = 'typingIndicator';
    typingIndicator.innerHTML = `<div class="typing-indicator" style="display: block;"><span></span><span></span><span></span></div>`;
    messagesContainer.appendChild(typingIndicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTypingIndicator() {
    if (typingIndicator) {
        typingIndicator.remove();
        typingIndicator = null;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    checkUserName();
    document.getElementById('userName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') saveUserName();
    });
    document.getElementById('userInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') sendMessage();
    });
});
