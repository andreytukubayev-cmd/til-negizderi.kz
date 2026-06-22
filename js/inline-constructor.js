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
function toggleInlineConstructor() {
    window.isConstructorMode = !window.isConstructorMode;

    const btn = document.getElementById('toggleConstructorBtn');
    const inputTitle = document.getElementById('inlineThemeInputs');
    const saveAction = document.getElementById('constructorSaveAction');
    const searchInput = document.getElementById('themeSearch');

    if (!btn || !inputTitle || !saveAction) return;

    if (window.isConstructorMode) {
        // Включаем режим создания темы
        btn.classList.add('active-mode');
        btn.innerHTML = '<span class="btn-icon">❌</span><span class="btn-text">Закрыть</span>';

        inputTitle.style.display = 'flex';
        inputTitle.style.flexDirection = 'column';
        saveAction.style.display = 'block';
        if (searchInput) searchInput.style.visibility = 'hidden';

        // Сбрасываем буфер для новой темы
        constructorData = {
            outer: Array.from({ length: 6 }, () => ({ ru: '', kk: '' })),
            middle: Array.from({ length: 6 }, () => ({ ru: '', kk: '' })),
            inner: Array.from({ length: 6 }, () => ({ ru: '', kk: '' }))
        };

        // Рендерим пустое колесо-конструктор (колёса остаются видимыми!)
        window.dataset = {
            outer: constructorData.outer,
            middle: constructorData.middle,
            inner: constructorData.inner
        };
        if (typeof regenerateWheels === 'function') regenerateWheels();

        // Показываем инпуты для первого сектора
        window.currentSectorIndex = 1;
        switchToSector(1);

    } else {
        // Выключаем режим конструктора
        btn.classList.remove('active-mode');
        btn.innerHTML = '<span class="btn-icon">✍️</span><span class="btn-text">Создать тему</span>';

        inputTitle.style.display = 'none';
        saveAction.style.display = 'none';
        if (searchInput) searchInput.style.visibility = 'visible';

        // Восстанавливаем прежнюю тему
        if (window.currentTheme) {
            if (typeof window.loadTheme === 'function') window.loadTheme(window.currentTheme);
        } else {
            if (typeof clearCalculatorFields === 'function') clearCalculatorFields();
        }
    }
}

/**
 * Переключает инпуты на нужный сектор и подсвечивает активный сектор на колесе
 */
function switchToSector(sectorIndex) {
    if (!window.isConstructorMode) return;
    window.currentSectorIndex = sectorIndex;

    const idx = sectorIndex - 1; // Индекс в массиве (0-5)

    // Подсвечиваем активный сектор на всех колёсах
    highlightActiveSector(sectorIndex);

    // Конфигурация слоев
    const layers = [
        { key: 'outer', step: 1, colorKk: '#00f3ff', label: 'Вопрос' },
        { key: 'middle', step: 2, colorKk: '#32d74b', label: 'Ответ' },
        { key: 'inner', step: 3, colorKk: '#ffd60a', label: 'Реакция' }
    ];

    layers.forEach(layer => {
        const box = document.querySelector(`.calc-display-line:nth-child(${layer.step}) .txt-box`);
        if (!box) return;

        let inputKk = box.querySelector('.constructor-input-kk');
        let inputRu = box.querySelector('.constructor-input-ru');

        // Если инпутов ещё нет — создаём один раз
        if (!inputKk || !inputRu) {
            box.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 4px; width: 100%;">
                    <input type="text" class="constructor-input-kk" style="width: 100%; background: #0f172a; color: ${layer.colorKk}; border: 1px solid #334155; padding: 4px 8px; font-size: 13px; font-weight: bold; border-radius: 4px; box-sizing: border-box;">
                    <input type="text" class="constructor-input-ru" style="width: 100%; background: #0f172a; color: #cbd5e1; border: 1px solid #334155; padding: 4px 8px; font-size: 11px; border-radius: 4px; box-sizing: border-box;">
                </div>
            `;
            inputKk = box.querySelector('.constructor-input-kk');
            inputRu = box.querySelector('.constructor-input-ru');
        }

        // Обновляем обработчики (привязаны к текущему сектору)
        inputKk.oninput = (e) => updateConstructorValue(layer.key, window.currentSectorIndex, 'kk', e.target.value);
        inputRu.oninput = (e) => updateConstructorValue(layer.key, window.currentSectorIndex, 'ru', e.target.value);

        // Подставляем значения буфера не теряя фокус
        const nextKkValue = constructorData[layer.key][idx].kk;
        const nextRuValue = constructorData[layer.key][idx].ru;

        if (document.activeElement !== inputKk && inputKk.value !== nextKkValue) {
            inputKk.value = nextKkValue;
        }
        if (document.activeElement !== inputRu && inputRu.value !== nextRuValue) {
            inputRu.value = nextRuValue;
        }

        // Обновляем плейсхолдеры
        inputKk.placeholder = `Сектор ${sectorIndex}: ${layer.label} (KK)`;
        inputRu.placeholder = `Сектор ${sectorIndex}: ${layer.label} (RU)`;
    });
}

/**
 * Подсвечивает активный сектор на всех трёх колёсах рамкой
 */
function highlightActiveSector(sectorIndex) {
    // Убираем старую подсветку со всех секторов
    document.querySelectorAll('.segment-cell path[data-constructor-highlight]').forEach(el => {
        el.removeAttribute('data-constructor-highlight');
        el.setAttribute('stroke', 'white');
        el.setAttribute('stroke-width', '2');
    });

    // Индекс сектора в DOM = sectorIndex - 1
    const idx = sectorIndex - 1;

    ['originalOuterWheel', 'originalMiddleWheel', 'originalInnerWheel'].forEach(wheelId => {
        const wheel = document.getElementById(wheelId);
        if (!wheel) return;

        const cells = wheel.querySelectorAll('.segment-cell');
        const cell = cells[idx];
        if (!cell) return;

        const path = cell.querySelector('path');
        if (path) {
            path.setAttribute('data-constructor-highlight', '1');
            path.setAttribute('stroke', '#ffffff');
            path.setAttribute('stroke-width', '4');
            // Добавляем мигающую обводку через filter
            path.style.filter = 'drop-shadow(0 0 6px rgba(255,255,255,0.9))';
        }
    });
}

/**
 * Обновляет значения в буфере и перерисовывает колесо живьём
 */
function updateConstructorValue(circle, sectorIndex, lang, value) {
    const idx = sectorIndex - 1;
    constructorData[circle][idx][lang] = value;

    // Обновляем колесо с живыми данными
    window.dataset = {
        outer: constructorData.outer,
        middle: constructorData.middle,
        inner: constructorData.inner
    };
    if (typeof regenerateWheels === 'function') {
        regenerateWheels();
        // После перерисовки восстанавливаем подсветку
        highlightActiveSector(window.currentSectorIndex);
    }
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

        // ШАГ 1: Создаём запись в таблице public.themes
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

        // Отправляем все 18 строк одним пакетом
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

        if (typeof window.loadTheme === 'function') {
            window.loadTheme(window.currentTheme);
        }

    } catch (err) {
        console.error('Критическая ошибка сохранения темы:', err);
        alert('Не удалось сохранить тему в базу: ' + err.message);
    }
}

// Глобальный экспорт функций
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
