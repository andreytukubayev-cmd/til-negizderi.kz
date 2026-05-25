// js/localTranslator.js - универсальный переводчик из JSON
class LocalTranslator {
    constructor(jsonData) {
        this.staticPhrases = jsonData.static_phrases || {};
        this.dynamicTemplates = jsonData.dynamic_templates || [];
        this.isReady = true;
    }

    translate(message) {
        const lowerMsg = message.toLowerCase().trim();
        
        // 1. Прямое совпадение в статике
        if (this.staticPhrases[lowerMsg]) {
            return this._formatResponse(this.staticPhrases[lowerMsg]);
        }
        
        // 2. Поиск по ключевым словам (частичное совпадение)
        for (let [key, value] of Object.entries(this.staticPhrases)) {
            if (lowerMsg.includes(key)) {
                return this._formatResponse(value);
            }
        }
        
        // 3. Обработка динамических шаблонов (регулярные выражения)
        for (let template of this.dynamicTemplates) {
            try {
                const regex = new RegExp(template.regex, 'i');
                const match = message.match(regex);
                
                if (match && match[1]) {
                    return this._processDynamicTemplate(template, match[1]);
                }
            } catch (e) {
                console.warn('Invalid regex in template:', template.regex);
            }
        }
        
        // 4. Фолбэк — обучающий ответ
        return {
            translation: `Я учусь переводить "${message}" на казахский. Попробуйте спросить по-другому.`,
            breakdown: [{ word: 'үйреніп жатырмын', meaning: 'учусь' }],
            pronunciation: message,
            short: 'Кейін'
        };
    }

    // Форматирование статического ответа
    _formatResponse(phraseObj) {
        return {
            translation: phraseObj.kz,
            breakdown: phraseObj.breakdown || [],
            pronunciation: phraseObj.pron || phraseObj.kz,
            short: phraseObj.short || phraseObj.kz
        };
    }

    // Обработка динамического шаблона с подстановкой %value%
    _processDynamicTemplate(template, value) {
        const replaceValue = (str) => {
            if (!str) return '';
            return str.replace(/%value%/g, value);
        };
        
        return {
            translation: replaceValue(template.kz),
            pronunciation: replaceValue(template.pron),
            short: replaceValue(template.short),
            breakdown: (template.breakdown || []).map(item => ({
                word: replaceValue(item.word),
                meaning: replaceValue(item.meaning)
            }))
        };
    }
}
