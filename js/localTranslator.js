// js/localTranslator.js - улучшенная версия
class LocalTranslator {
    constructor() {
        // Больше фраз для разных ситуаций
        this.phrases = {
            // Приветствия
            'привет': { kz: 'Сәлем', breakdown: [{word:'Сәлем', meaning:'привет'}], pron: 'Сәлем', short: 'Сәлем' },
            'здравствуйте': { kz: 'Сәлеметсіз бе', breakdown: [{word:'Сәлеметсіз', meaning:'здравствуйте'},{word:'бе', meaning:'?'}], pron: 'Сәлеметсіз бе', short: 'Сәлем' },
            'доброе утро': { kz: 'Қайырлы таң', breakdown: [{word:'Қайырлы', meaning:'добрый'},{word:'таң', meaning:'утро'}], pron: 'Қайырлы таң', short: 'Қайырлы таң' },
            'добрый день': { kz: 'Қайырлы күн', breakdown: [{word:'Қайырлы', meaning:'добрый'},{word:'күн', meaning:'день'}], pron: 'Қайырлы күн', short: 'Қайырлы күн' },
            'добрый вечер': { kz: 'Қайырлы кеш', breakdown: [{word:'Қайырлы', meaning:'добрый'},{word:'кеш', meaning:'вечер'}], pron: 'Қайырлы кеш', short: 'Қайырлы кеш' },
            
            // Знакомство
            'меня зовут': (msg) => {
                const name = msg.match(/меня зовут\s+(\w+)/i)?.[1] || 'пользователь';
                return { kz: `Менің атым ${name}`, breakdown: [{word:'Менің', meaning:'мой'},{word:'атым', meaning:'имя'},{word:name, meaning:name}], pron: `Мениң атым ${name}`, short: `Мен - ${name}` };
            },
            'как тебя зовут': { kz: 'Сенің атың кім?', breakdown: [{word:'Сенің', meaning:'твой'},{word:'атың', meaning:'имя'},{word:'кім', meaning:'кто'}], pron: 'Сениң атың кім?', short: 'Атың кім?' },
            'как вас зовут': { kz: 'Сіздің атыңыз кім?', breakdown: [{word:'Сіздің', meaning:'ваш'},{word:'атыңыз', meaning:'имя'},{word:'кім', meaning:'кто'}], pron: 'Сіздиң атыңыз кім?', short: 'Атыңыз кім?' },
            
            // Как дела
            'как дела': { kz: 'Қалыңыз қалай?', breakdown: [{word:'Қалыңыз', meaning:'ваше состояние'},{word:'қалай', meaning:'как'}], pron: 'Қалыңыз қалай?', short: 'Қалайсыз?' },
            'как ты': { kz: 'Қалың қалай?', breakdown: [{word:'Қалың', meaning:'твоё состояние'},{word:'қалай', meaning:'как'}], pron: 'Қалың қалай?', short: 'Қалайсың?' },
            
            // Благодарности
            'спасибо': { kz: 'Рахмет', breakdown: [{word:'Рахмет', meaning:'спасибо'}], pron: 'Рахмет', short: 'Рахмет' },
            'большое спасибо': { kz: 'Үлкен рахмет', breakdown: [{word:'Үлкен', meaning:'большое'},{word:'рахмет', meaning:'спасибо'}], pron: 'Үлкен рахмет', short: 'Рахмет' },
            
            // Извинения
            'извините': { kz: 'Кешіріңіз', breakdown: [{word:'Кешіріңіз', meaning:'извините'}], pron: 'Кешіріңіз', short: 'Кешіріңіз' },
            'простите': { kz: 'Кешіріңіз', breakdown: [{word:'Кешіріңіз', meaning:'простите'}], pron: 'Кешіріңіз', short: 'Кешір' },
            
            // Прощание
            'до свидания': { kz: 'Сау болыңыз', breakdown: [{word:'Сау', meaning:'здоровый'},{word:'болыңыз', meaning:'будьте'}], pron: 'Сау болыңыз', short: 'Сау бол' },
            'пока': { kz: 'Сау бол', breakdown: [{word:'Сау', meaning:'здоровый'},{word:'бол', meaning:'будь'}], pron: 'Сау бол', short: 'Сау бол' },
            
            // Дежурный
            'кто сегодня дежурный': { kz: 'Бүгін сыныпта кім кезекші?', breakdown: [{word:'Бүгін', meaning:'сегодня'},{word:'сыныпта', meaning:'в классе'},{word:'кім', meaning:'кто'},{word:'кезекші', meaning:'дежурный'}], pron: 'Бүгін сыныпта кім кезекші?', short: 'Кезекші кім?' },
            'кто дежурный': { kz: 'Кезекші кім?', breakdown: [{word:'Кезекші', meaning:'дежурный'},{word:'кім', meaning:'кто'}], pron: 'Кезекші кім?', short: 'Кезекші кім?' },
            
            // Деловые фразы
            'можно войти': { kz: 'Кіруге бола ма?', breakdown: [{word:'Кіруге', meaning:'войти'},{word:'бола ма', meaning:'можно'}], pron: 'Кіруге бола ма?', short: 'Кірейін ба?' },
            'разрешите': { kz: 'Рұқсат етіңіз', breakdown: [{word:'Рұқсат', meaning:'разрешение'},{word:'етіңіз', meaning:'дайте'}], pron: 'Рұқсат етіңіз', short: 'Рұқсат' },
            'помогите': { kz: 'Көмектесіңізші', breakdown: [{word:'Көмектесіңізші', meaning:'помогите'}], pron: 'Көмектесіңізші', short: 'Көмектес' },
            'спасибо за помощь': { kz: 'Көмегіңізге рахмет', breakdown: [{word:'Көмегіңізге', meaning:'за помощь'},{word:'рахмет', meaning:'спасибо'}], pron: 'Көмегіңізге рахмет', short: 'Рахмет' }
        };
    }

    translate(message) {
        const lowerMsg = message.toLowerCase().trim();
        
        // Прямое совпадение
        if (this.phrases[lowerMsg]) {
            const p = this.phrases[lowerMsg];
            return {
                translation: p.kz,
                breakdown: p.breakdown,
                pronunciation: p.pron,
                short: p.short
            };
        }
        
        // Поиск по ключевым словам
        for (let [key, value] of Object.entries(this.phrases)) {
            if (lowerMsg.includes(key) && typeof value !== 'function') {
                return {
                    translation: value.kz,
                    breakdown: value.breakdown,
                    pronunciation: value.pron,
                    short: value.short
                };
            }
        }
        
        // Функции-обработчики (для "меня зовут X")
        if (lowerMsg.includes('меня зовут')) {
            const result = this.phrases['меня зовут'](message);
            return {
                translation: result.kz,
                breakdown: result.breakdown,
                pronunciation: result.pron,
                short: result.short
            };
        }
        
        // Если не нашли — обучающий ответ
        return {
            translation: `Я учусь переводить "${message}" на казахский. Попробуйте спросить по-другому.`,
            breakdown: [{ word: 'үйреніп жатырмын', meaning: 'учусь' }],
            pronunciation: message,
            short: 'Кейін'
        };
    }
}

const localTranslator = new LocalTranslator();
