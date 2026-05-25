// Переменные
let userName = localStorage.getItem('userName') || null;
let waitingForName = false;
let totalTranslations = localStorage.getItem('totalTranslations') || 0;

// Обновляем счетчик на странице
function updateStats() {
    document.getElementById('totalTranslations').textContent = totalTranslations;
}
updateStats();

// Проверяем, есть ли сохраненное имя
function checkUserName() {
    if (userName) {
        // Имя есть, скрываем модальное окно
        document.getElementById('nameModal').style.display = 'none';
        // Показываем приветствие с именем
        addMessage(`👋 Рад познакомиться, ${userName}! Чем могу помочь сегодня?`, 'bot');
        // Показываем пример через секунду
        setTimeout(() => {
            if (document.getElementById('messages').children.length <= 2) {
                addExampleMessage();
            }
        }, 1000);
    } else {
        // Имени нет, показываем модальное окно
        document.getElementById('nameModal').style.display = 'flex';
        waitingForName = true;
    }
}

// Сохраняем имя пользователя
function saveUserName() {
    const nameInput = document.getElementById('userName');
    const name = nameInput.value.trim();
    
    if (name && name.length > 0) {
        userName = name;
        localStorage.setItem('userName', userName);
        document.getElementById('nameModal').style.display = 'none';
        waitingForName = false;
        
        // Добавляем сообщение с именем пользователя
        addMessage(`👋 Рад познакомиться, ${userName}! Чем могу помочь сегодня?`, 'bot');
        
        // Показываем пример
        setTimeout(() => {
            addExampleMessage();
        }, 500);
    } else {
        alert('Пожалуйста, введите ваше имя');
    }
}

// Добавление сообщения в чат (ОБНОВЛЕНА)
function addMessage(text, sender, wordBreakdown = null) {
    const messagesContainer = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    if (sender === 'bot' && wordBreakdown && wordBreakdown.length > 0) {
        // Создаем HTML с подсказками
        contentDiv.innerHTML = formatMessageWithTooltips(text, wordBreakdown);
        addTooltipStyles();
    } else {
        contentDiv.innerHTML = formatMessage(text);
    }
    
    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);
    
    // Прокручиваем вниз
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Форматирование сообщения с подсказками (НОВАЯ)
function formatMessageWithTooltips(text, wordBreakdown) {
    // Создаем карту слов и их переводов
    const wordMap = {};
    wordBreakdown.forEach(item => {
        wordMap[item.word.toLowerCase()] = item.meaning;
    });
    
    // Разбиваем текст на части
    let formatted = '';
    const lines = text.split('\n');
    
    for (let line of lines) {
        if (line.includes('Вариант для работы:')) {
            // Находим перевод и добавляем подсказки к каждому слову
            let translation = line.replace('Вариант для работы:', '').trim();
            let highlightedTranslation = highlightWords(translation, wordMap);
            formatted += `<strong>✅ Вариант для работы:</strong> ${highlightedTranslation}<br>`;
        } 
        else if (line.includes('Разбор слов:')) {
            formatted += `<br><strong>📖 ${line}</strong><br>`;
        }
        else if (line.includes('•') && line.includes('=')) {
            // Форматируем разбор слов
            formatted += `<div style="margin-left: 20px; color: #555;">${line}</div>`;
        }
        else if (line.includes('Как произнести:')) {
            formatted += `<br><strong>🔊 ${line}</strong><br>`;
        }
        else if (line.includes('лаконичных варианта:') || line.includes('лаконичный вариант:')) {
            formatted += `<br><strong>⚡ ${line}</strong><br>`;
        }
        else if (line.trim()) {
            formatted += `${line}<br>`;
        }
    }
    
    return formatted;
}

// Подсветка слов с подсказками (НОВАЯ)
function highlightWords(text, wordMap) {
    // Разбиваем текст на слова и знаки препинания
    const words = text.split(/(\s+|[.,!?;:])/);
    
    return words.map(word => {
        const cleanWord = word.toLowerCase().replace(/[.,!?;:]/g, '');
        if (wordMap[cleanWord] && word.trim().length > 0) {
            // Создаем слово с подсказкой
            return `<span class="kazakh-word" data-tooltip="${escapeHtml(wordMap[cleanWord])}">${escapeHtml(word)}</span>`;
        }
        return escapeHtml(word);
    }).join('');
}

// Добавляем стили для подсказок (НОВАЯ)
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
            border-bottom-color: #764ba2;
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
        
        @keyframes tooltipFadeIn {
            from {
                opacity: 0;
                transform: translateX(-50%) translateY(-4px);
            }
            to {
                opacity: 1;
                transform: translateX(-50%) translateY(-12px);
            }
        }
        
        .word-breakdown {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 12px;
            margin: 10px 0;
            border-radius: 8px;
        }
        
        .word-breakdown strong {
            color: #667eea;
            display: block;
            margin-bottom: 8px;
        }
        
        .word-item {
            display: inline-block;
            margin: 4px 8px 4px 0;
            padding: 4px 10px;
            background: white;
            border-radius: 20px;
            font-size: 0.9em;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        
        .word-kazakh {
            font-weight: 600;
            color: #667eea;
        }
        
        .word-separator {
            margin: 0 4px;
            color: #999;
        }
        
        .word-russian {
            color: #666;
        }
    `;
    document.head.appendChild(style);
}

// Функция для экранирования HTML (НОВАЯ)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Пример сообщения для демонстрации (НОВАЯ)
function addExampleMessage() {
    const exampleText = `Вариант для работы: Сәлеметсіз бе, қалай жақсы?
Разбор слов:
  • Сәлеметсіз = Здравствуйте
  • бе = вопросительная частица
  • қалай = как
  • жақсы = хорошо
Как произнести: Сәлеметсіз бе, қалай жақсы?
Два лаконичных варианта: Сәлем, Қалайсыз?`;
    
    const wordBreakdown = [
        { word: 'Сәлеметсіз', meaning: 'Здравствуйте' },
        { word: 'бе', meaning: 'вопросительная частица' },
        { word: 'қалай', meaning: 'как' },
        { word: 'жақсы', meaning: 'хорошо' }
    ];
    
    addMessage(exampleText, 'bot', wordBreakdown);
}

// Отправка сообщения (ОБНОВЛЕНА)
async function sendMessage() {
    const input = document.getElementById('userInput');
    let message = input.value.trim();
    
    if (!message) return;
    
    // Если ждем имя, но поле ввода уже заполнено
    if (waitingForName) {
        saveUserNameFromMessage(message);
        input.value = '';
        return;
    }
    
    // Добавляем сообщение пользователя
    addMessage(message, 'user');
    input.value = '';
    
    // Показываем индикатор печати
    showTypingIndicator();
    
    // Блокируем кнопку
    const sendButton = document.getElementById('sendButton');
    sendButton.disabled = true;
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                message: message,
                userName: userName
            })
        });
        
        const data = await response.json();
        
        // Убираем индикатор печати
        hideTypingIndicator();
        
        if (data.success) {
            // Если есть имя пользователя, можно персонализировать ответ бота
            let reply = data.reply;
            if (userName && reply.includes('Пользователь')) {
                reply = reply.replace('Пользователь', userName);
            }
            
            // Добавляем сообщение с разбором слов (если есть)
            addMessage(reply, 'bot', data.wordBreakdown || null);
            
            totalTranslations++;
            localStorage.setItem('totalTranslations', totalTranslations);
            updateStats();
        } else {
            addMessage('❌ Извините, произошла ошибка: ' + (data.error || 'Неизвестная ошибка'), 'bot');
        }
    } catch (error) {
        hideTypingIndicator();
        addMessage('❌ Ошибка соединения. Проверьте интернет и попробуйте снова.', 'bot');
        console.error('Error:', error);
    } finally {
        sendButton.disabled = false;
    }
}

// Сохранение имени из сообщения
function saveUserNameFromMessage(name) {
    if (name && name.trim().length > 0) {
        userName = name.trim();
        localStorage.setItem('userName', userName);
        waitingForName = false;
        
        // Удаляем сообщение с вопросом о имени
        const messages = document.getElementById('messages');
        const botQuestion = messages.querySelector('.message.bot:last-child');
        if (botQuestion && botQuestion.innerText.includes('Как ваше имя?')) {
            botQuestion.remove();
        }
        
        addMessage(name, 'user');
        addMessage(`👋 Рад познакомиться, ${userName}! Чем могу помочь сегодня?`, 'bot');
        
        // Показываем пример
        setTimeout(() => {
            addExampleMessage();
        }, 500);
    }
}

// Форматирование сообщения (оригинальная функция, обновлена)
function formatMessage(text) {
    let formatted = text.replace(/\n/g, '<br>');
    formatted = formatted.replace(/(Вариант для работы:|Как произнести:|Логика:|Разбор слов:|лаконичных варианта:|лаконичный вариант:)/g, '<strong>$1</strong>');
    formatted = formatted.replace(/<br><br>/g, '<hr>');
    return formatted;
}

// Индикатор печати
let typingIndicator = null;

function showTypingIndicator() {
    const messagesContainer = document.getElementById('messages');
    typingIndicator = document.createElement('div');
    typingIndicator.className = 'message bot';
    typingIndicator.id = 'typingIndicator';
    typingIndicator.innerHTML = `
        <div class="typing-indicator" style="display: block;">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    messagesContainer.appendChild(typingIndicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTypingIndicator() {
    if (typingIndicator) {
        typingIndicator.remove();
        typingIndicator = null;
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    checkUserName();
    
    // Разрешаем отправку имени по Enter в модальном окне
    document.getElementById('userName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveUserName();
        }
    });
    
    // Разрешаем отправку сообщения по Enter
    const userInput = document.getElementById('userInput');
    if (userInput) {
        userInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !waitingForName) {
                sendMessage();
            }
        });
    }
});
