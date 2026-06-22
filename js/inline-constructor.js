// Инициализируем глобальное состояние режима конструктора
window.isConstructorMode = false;
window.currentSectorIndex = 1; // По умолчанию первый сектор

// Структура данных для новой темы (6 секторов для каждого из 3 кругов)
let constructorData = {
    outer: Array.from({ length: 6 }, () => ({ ru: '', kk: '' })),
    middle: Array.from({ length: 6 }, () => ({ ru: '', kk: '' })),
    inner: Array.from({ length: 6 }, () => ({ ru: '', kk: '' }))
};

/**
 * Основная функция переключения режима Конструктора
 */
/**
 * Основная функция переключения режима Конструктора
 */
function toggleInlineConstructor() {
    window.isConstructorMode = !window.isConstructorMode;
    
    const btn = document.getElementById('toggleConstructorBtn');
    const inputTitle = document.getElementById('inlineThemeInputs');
    const saveAction = document.getElementById('constructorSaveAction');
    const searchInput = document.getElementById('themeSearch');
    
    // Автоматически находим контейнер с колесами (по ID или по классу у SVG)
    const wheelsContainer = document.getElementById('wheelsContainer') || document.querySelector('.wheels-block');
    
    if (!btn || !inputTitle || !saveAction) return;

    if (window.isConstructorMode) {
        // Включаем режим создания темы
        btn.classList.add('active-mode');
        btn.innerHTML = '<span class="btn-icon">❌</span><span class="btn-text">Закрыть</span>';
        
        inputTitle.style.display = 'flex';
        inputTitle.style.flexDirection = 'column';
        saveAction.style.display = 'block';
        if (searchInput) searchInput.style.visibility = 'hidden';
        
        // ИСПРАВЛЕНО: Скрываем старые колеса корректно без дублирования .style
        if (wheelsContainer) {
            wheelsContainer.style.setProperty('display', 'none', 'important');
        }
        
        // Гарантированно очищаем старый текст на табло калькулятора
        if (typeof clearCalculatorFields === 'function') clearCalculatorFields();

        // Сбрасываем буфер для новой темы
        constructorData = {
            outer: Array.from({ length: 6 }, () => ({ ru: '', kk: '' })),
            middle: Array.from({ length: 6 }, () => ({ ru: '', kk: '' })),
            inner: Array.from({ length: 6 }, () => ({ ru: '', kk: '' }))
        };
        
        // Принудительно очищаем старую разметку калькулятора перед внедрением инпутов
        const boxes = ['.calc-display-line:nth-child(1) .txt-box', '.calc-display-line:nth-child(2) .txt-box', '.calc-display-line:nth-child(3) .txt-box'];
        boxes.forEach(selector => {
            const box = document.querySelector(selector);
            if (box) box.innerHTML = '';
        });

        // Переводим экран результатов в режим ввода для текущего сектора
        switchToSector(window.currentSectorIndex || 1);
    } else {
        // Выключаем режим конструктора
        btn.classList.remove('active-mode');
        btn.innerHTML = '<span class="btn-icon">✍️</span><span class="btn-text">Создать тему</span>';
        
        inputTitle.style.display = 'none';
        saveAction.style.display = 'none';
        if (searchInput) searchInput.style.visibility = 'visible';

        // ИСПРАВЛЕНО: Возвращаем видимость колес (убираем display: none)
        if (wheelsContainer) {
            wheelsContainer.style.removeProperty('display');
        }

        // Возвращаем дефолтный калькулятор
        if (window.currentTheme) {
            if (typeof window.loadTheme === 'function') window.loadTheme(window.currentTheme);
        } else {
            if (typeof clearCalculatorFields === 'function') clearCalculatorFields();
        }
    }
}

/**
 * Динамически подменяет или обновляет инпуты ввода данных без потери фокуса
 */
function switchToSector(sectorIndex) {
    if (!window.isConstructorMode) return;
    window.currentSectorIndex = sectorIndex;

    const idx = sectorIndex - 1; // Индекс в массиве (0-5)

    // Конфигурация слоев для автоматической сборки
    const layers = [
        { key: 'outer', step: 1, colorKk: '#00f3ff', label: 'Вопрос' },
        { key: 'middle', step: 2, colorKk: '#32d74b', label: 'Ответ' },
        { key: 'inner', step: 3, colorKk: '#ffd60a', label: 'Реакция' }
    ];

    layers.forEach(layer => {
        const box = document.querySelector(`.calc-display-line:nth-child(${layer.step}) .txt-box`);
        if (!box) return;

        // Ищем существующие инпуты внутри этого контейнера
        let inputKk = box.querySelector(`.constructor-input-kk`);
        let inputRu = box.querySelector(`.constructor-input-ru`);

        // Если инпутов еще нет — создаем структуру один раз
        if (!inputKk || !inputRu) {
            box.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 4px; width: 100%;">
                    <input type="text" class="constructor-input-kk" style="width: 100%; background: #0f172a; color: ${layer.colorKk}; border: 1px solid #334155; padding: 4px 8px; font-size: 13px; font-weight: bold; border-radius: 4px; box-sizing: border-box;">
                    <input type="text" class="constructor-input-ru" style="width: 100%; background: #0f172a; color: #cbd5e1; border: 1px solid #334155; padding: 4px 8px; font-size: 11px; border-radius: 4px; box-sizing: border-box;">
                </div>
            `;
            inputKk = box.querySelector(`.constructor-input-kk`);
            inputRu = box.querySelector(`.constructor-input-ru`);
        }

        // Навешиваем/обновляем события ввода, привязанные к текущему сектору динамически
        inputKk.oninput = (e) => updateConstructorValue(layer.key, window.currentSectorIndex, 'kk', e.target.value);
        inputRu.oninput = (e) => updateConstructorValue(layer.key, window.currentSectorIndex, 'ru', e.target.value);

        // Чтобы не сбрасывать фокус активного элемента, меняем value только если оно РЕАЛЬНО отличается
        const nextKkValue = constructorData[layer.key][idx].kk;
        const nextRuValue = constructorData[layer.key][idx].ru;

        if (document.activeElement !== inputKk && inputKk.value !== nextKkValue) {
            inputKk.value = nextKkValue;
        }
        if (document.activeElement !== inputRu && inputRu.value !== nextRuValue) {
            inputRu.value = nextRuValue;
        }

        // Обновляем плейсхолдеры, чтобы пользователь видел, в каком он секторе
        inputKk.placeholder = `Сектор ${sectorIndex}: ${layer.label} (KK)`;
        inputRu.placeholder = `Сектор ${sectorIndex}: ${layer.label} (RU)`;
    });
}

/**
 * Обновляет значения в буфере данных при вводе в инпуты
 */
function updateConstructorValue(circle, sectorIndex, lang, value) {
    const idx = sectorIndex - 1;
    constructorData[circle][idx][lang] = value;
}

/**
 * Отправка готового объекта темы в базу данных Supabase
 */
async function applyInlineTheme() {
    const titleRu = document.getElementById('inlineTitleRu').value.trim();
    const titleKk = document.getElementById('inlineTitleKk').value.trim();

    if (!titleRu || !titleKk) {
        alert('Пожалуйста, заполните название темы на обоих языках!');
        return;
    }

    if (typeof window.supabase === 'undefined' && typeof supabase === 'undefined') {
        alert('Ошибка: Клиент Supabase не инициализирован на странице или еще не загрузился!');
        return;
    }

    const dbClient = window.supabase || supabase;

    try {
        console.log("=== ЗАПУСК СОХРАНЕНИЯ ТЕМЫ ===");
        
        if (!dbClient.auth) {
            alert('Ошибка конфигурации: В объекте Supabase отсутствует модуль auth!');
            return;
        }

        let user = null;

        if (typeof dbClient.auth.getUser === 'function') {
            console.log("Используем метод v2 SDK: getUser()");
            const { data: authData, error: authError } = await dbClient.auth.getUser();
            if (!authError && authData) user = authData.user;
        } 
        
        if (!user && typeof dbClient.auth.user === 'function') {
            console.log("Используем метод v1 SDK: user()");
            user = dbClient.auth.user();
        }

        console.log("Результат авторизации:", user);

        if (!user) {
            alert('Ошибка безопасности: Вы должны быть авторизованы на сайте для создания тем!');
            return;
        }

        // ШАГ 1: Создаем запись в таблице public.themes
        const { data: themeRecord, error: themeError } = await dbClient
            .from('themes')
            .insert([{
                user_id: user.id, 
                title_ru: titleRu,
                title_kk: titleKk
            }])
            .select()
            .single(); 

        if (themeError) throw themeError;
        const newThemeId = themeRecord.id;
        console.log("Создана новая тема с ID:", newThemeId);

        // ШАГ 2: Собираем все 18 сегментов в один массив
        const itemsToInsert = [];
        const circles = ['outer', 'middle', 'inner'];

        circles.forEach(circleType => {
            constructorData[circleType].forEach((sector, index) => {
                const txtRu = sector.ru.trim() || `Сектор ${index + 1}`;
                const txtKk = sector.kk.trim() || `Сектор ${index + 1}`;

                itemsToInsert.push({
                    theme_id: newThemeId,
                    circle_type: circleType,
                    position: index, 
                    text_ru: txtRu,
                    text_kk: txtKk
                });
            });
        });

        // Отправляем все 18 строк в таблицу public.wheel_items одним пакетом
        const { error: itemsError } = await dbClient
            .from('wheel_items')
            .insert(itemsToInsert);

        if (itemsError) throw itemsError;
        console.log("Все 18 сегментов успешно записаны.");

        alert('Тема успешно сохранена в базу данных!');

        if (typeof window.loadCustomThemes === 'function') {
            await window.loadCustomThemes();
        }

        window.currentTheme = `custom_${newThemeId}`;
        
        toggleInlineConstructor();

        if (typeof window.renderLullyTheme === 'function') {
            window.renderLullyTheme(window.currentTheme);
        }

    } catch (err) {
        console.error('Критическая ошибка сохранения темы:', err);
        alert('Не удалось сохранить тему в базу: ' + err.message);
    }
}

// Глобальный экспорт функций для внешних вызовов
window.switchToSector = switchToSector;
window.toggleInlineConstructor = toggleInlineConstructor;
window.applyInlineTheme = applyInlineTheme;

/**
 * Очищает текстовые поля экрана калькулятора до дефолтных значений
 */
function clearCalculatorFields() {
    const fields = ['dash-q-kk', 'dash-q-ru', 'dash-a-kk', 'dash-a-ru', 'dash-r-kk', 'dash-r-ru'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = '-';
    });
}
window.clearCalculatorFields = clearCalculatorFields;
