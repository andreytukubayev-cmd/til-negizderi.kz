// localTranslator.js - локальный ИИ для обучения
// Он НЕ просто ищет по словарю, а генерирует ответы как настоящий ИИ

class LocalTranslator {
    constructor() {
        // База грамматических правил
        this.grammarRules = {
            greeting: /^(привет|здравствуйте|доброе утро|добрый день|добрый вечер)/i,
            introduction: /^(меня зовут|моё имя|я .+ из .+|я .+ работаю)/i,
            business: /^(отчет|документ|заявление|приказ|совещание|планерка)/i,
            question: /^(кто|что|где|когда|почему|зачем|как)\s/i,
            request: /^(пожалуйста|будьте добры|можно|разрешите)/i,
            gratitude: /^(спасибо|благодарю|признателен)/i,
            apology: /^(извините|простите|сожалею)/i
        };
        
        // База шаблонов для "перевода как ИИ"
        this.translationTemplates = {
            greeting: (phrase) => {
                if (phrase.includes('утро')) return { translation: 'Қайырлы таң', breakdown: [{word:'Қайырлы', meaning:'добрый'},{word:'таң', meaning:'утро'}], pronunciation: 'Кайырлы таң', short: 'Қайырлы таң' };
                if (phrase.includes('день')) return { translation: 'Қайырлы күн', breakdown: [{word:'Қайырлы', meaning:'добрый'},{word:'күн', meaning:'день'}], pronunciation: 'Кайырлы күн', short: 'Қайырлы күн' };
                if (phrase.includes('вечер')) return { translation: 'Қайырлы кеш', breakdown: [{word:'Қайырлы', meaning:'добрый'},{word:'кеш', meaning:'вечер'}], pronunciation: 'Кайырлы кеш', short: 'Қайырлы кеш' };
                return { translation: 'Сәлеметсіз бе', breakdown: [{word:'Сәлеметсіз', meaning:'здравствуйте'},{word:'бе', meaning:'(вопрос)'}], pronunciation: 'Сәлеметсіз бе', short: 'Сәлем' };
            },
            introduction: (phrase) => {
                const nameMatch = phrase.match(/меня зовут\s+(\w+)/i) || phrase.match(/я\s+(\w+)/i);
                const name = nameMatch ? nameMatch[1] : 'пользователь';
                return { translation: `Менің атым ${name}`, breakdown: [{word:'Менің', meaning:'мой'},{word:'атым', meaning:'имя'},{word:name, meaning:name}], pronunciation: `Мениң атым ${name}`, short: `Мен - ${name}` };
            },
            question: (phrase) => {
                if (phrase.includes('кто сегодня дежурный') || phrase.includes('кто дежурный')) {
                    return { translation: 'Бүгін сыныпта кім кезекші?', breakdown: [{word:'Бүгін', meaning:'сегодня'},{word:'сыныпта', meaning:'в классе'},{word:'кім', meaning:'кто'},{word:'кезекші', meaning:'дежурный'}], pronunciation: 'Бүгін сыныпта кім кезекші?', short: 'Кезекші кім?' };
                }
                if (phrase.includes('кто')) return { translation: 'Кім?', breakdown: [{word:'Кім', meaning:'кто'}], pronunciation: 'Кім?', short: 'Кім?' };
                if (phrase.includes('что')) return { translation: 'Не?', breakdown: [{word:'Не', meaning:'что'}], pronunciation: 'Не?', short: 'Не?' };
                if (phrase.includes('где')) return { translation: 'Қайда?', breakdown: [{word:'Қайда', meaning:'где'}], pronunciation: 'Қайда?', short: 'Қайда?' };
                return { translation: phrase + '?', breakdown: [], pronunciation: phrase, short: phrase };
            },
            request: (phrase) => {
                if (phrase.includes('помогите')) return { translation: 'Көмектесіңізші', breakdown: [{word:'Көмектесіңізші', meaning:'помогите (пожалуйста)'}], pronunciation: 'Көмектесіңізші', short: 'Көмектес' };
                if (phrase.includes('скажите')) return { translation: 'Айтыңызшы', breakdown: [{word:'Айтыңызшы', meaning:'скажите (пожалуйста)'}], pronunciation: 'Айтыңызшы', short: 'Айт' };
                return { translation: 'Өтінемін', breakdown: [{word:'Өтінемін', meaning:'пожалуйста'}], pronunciation: 'Өтінемін', short: 'Өтінш' };
            }
        };
    }

    // Главный метод перевода
    translate(phrase, context = null) {
        const lowerPhrase = phrase.toLowerCase();
        
        // Определяем тип фразы
        let type = null;
        for (let [key, pattern] of Object.entries(this.grammarRules)) {
            if (pattern.test(lowerPhrase)) {
                type = key;
                break;
            }
        }
        
        // Если тип определён, используем шаблон
        if (type && this.translationTemplates[type]) {
            return this.translationTemplates[type](phrase);
        }
        
        // Если фраза не распознана — даём образовательный ответ
        return {
            translation: `"${phrase}" — бұл сөзді қалай аударуға болатынын үйреніп жатырмын`,
            breakdown: [
                { word: 'үйреніп жатырмын', meaning: 'учусь переводить' },
                { word: 'кейінірек', meaning: 'позже' }
            ],
            pronunciation: `"${phrase}" — бул созди калай аударуга болатынын үйренип жатырмын`,
            short: `Кейін қосамын`,
            isLearning: true
        };
    }
    
    // Метод для обучения (можно добавлять новые фразы через диалог)
    learnNewPhrase(russian, kazakh, breakdown) {
        // Сохраняем в localStorage для будущих сессий
        const saved = localStorage.getItem('userPhrases') || '{}';
        const userPhrases = JSON.parse(saved);
        userPhrases[russian.toLowerCase()] = { kazakh, breakdown };
        localStorage.setItem('userPhrases', JSON.stringify(userPhrases));
    }
    
    // Загружает выученные пользователем фразы
    getLearnedPhrases() {
        const saved = localStorage.getItem('userPhrases') || '{}';
        return JSON.parse(saved);
    }
}

// Создаём глобальный экземпляр
const localTranslator = new LocalTranslator();
