// Инициализируем глобальное состояние режима конструктора
window.isConstructorMode = false;
window.currentSectorIndex = 1; // По умолчанию первый сектор
window.editingThemeId = null;  // ID редактируемой темы из базы (строка UUID или null)

// Структура данных для новой темы (6 секторов для каждого из 3 кругов)
let constructorData = {
    outer: Array.from({ length: 6 }, () => ({ ru: '', kk: '' })),
    middle: Array.from({ length: 6 }, () => ({ ru: '', kk: '' })),
    inner: Array.from({ length: 6 }, () => ({ ru: '', kk: '' }))
};

/**
 * Основная функция переключения режима Конструктора
 * @param {string|null} themeIdToEdit - если передан ID темы (например, 'custom_uuid'), включается режим редактирования
 */
function toggleInlineConstructor(themeIdToEdit = null) {
    window.isConstructorMode = !window.isConstructorMode;

    const btn = document.getElementById('toggleConstructorBtn');
    const inputTitle = document.getElementById('inlineThemeInputs');
    const saveAction = document.getElementById('constructorSaveAction');
    const searchInput = document.getElementById('themeSearch');
    const editBtn = document.getElementById('editConstructorBtn');
    const titleRuEl = document.getElementById('inlineTitleRu');
    const titleKkEl = document.getElementById('inlineTitleKk');

    if (!btn || !inputTitle || !saveAction) return;

    if (window.isConstructorMode) {
        // Включаем режим конструктора
        btn.classList.add('active-mode');
        btn.innerHTML = '<span class="btn-icon">❌</span><span class="btn-text">Закрыть</span>';

        inputTitle.style.display = 'flex';
        inputTitle.style.flexDirection = 'column';
        saveAction.style.display = 'block';
        if (searchInput) searchInput.style.visibility = 'hidden';
        if (editBtn) editBtn.style.display = 'none'; // Скрываем шестерёнку во время редактирования

        // Проверяем, передан ли ID для редактирования
        if (themeIdToEdit && themeIdToEdit.startsWith('custom_')) {
            // ИСПРАВЛЕНИЕ: Сохраняем UUID как чистую строку, БЕЗ parseInt
            const rawId = themeIdToEdit.replace('custom_', '');
            window.editingThemeId = rawId;
            console.log(`[Конструктор] Режим РЕДАКТИРОВАНИЯ темы ID (UUID): ${rawId}`);

            // Подтягиваем данные из GLOBAL библиотеки, которые уже скачаны из Supabase
            const sourceData = window.WHEELS_LIBRARY[themeIdToEdit];
            if (sourceData) {
                if (titleRuEl) titleRuEl.value = sourceData.titleRu || '';
                if (titleKkEl) titleKkEl.value = (sourceData.keywords && sourceData.keywords[1]) ? sourceData.keywords[1] : '';

                // Глубокое копирование данных в буфер конструктора
                constructorData = {
                    outer: sourceData.outer.map(item => ({ ...item })),
                    middle: sourceData.middle.map(item => ({ ...item })),
                    inner: sourceData.inner.map(item => ({ ...item }))
                };
            }
        } else {
            // Режим создания С НУЛЯ
            window.editingThemeId = null;
            console.log("[Конструктор] Режим СОЗДАНИЯ НОВОЙ темы");
            
            if (titleRuEl) titleRuEl.value = '';
            if (titleKkEl) titleKkEl.value = '';

            constructorData = {
                outer: Array.from({ length: 6 }, () => ({ ru: '', kk: '' })),
                middle: Array.from({ length: 6 }, () => ({ ru: '', kk: '' })),
                inner: Array.from({ length: 6 }, () => ({ ru: '', kk: '' }))
            };
        }

        // Рендерим колесо-конструктор с актуальными данными буфера
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
        
        window.editingThemeId = null; // сброс

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

    highlightActiveSector(sectorIndex);

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

        // Пересоздаем инпуты ТОЛЬКО если их физически нет в текущем box
        if (!inputKk || !inputRu) {
            box.innerHTML = `
			<div style="display: flex; flex-direction: column; gap: 4px; width: 100%;">
            <input type="text" class="constructor-input-kk" autocomplete="new-sector-text" style="width: 100%; background: #0f172a; color: ${layer.colorKk}; border: 1px solid #334155; padding: 4px 8px; font-size: 13px; font-weight: bold; border-radius: 4px; box-sizing: border-box;">
            <input type="text" class="constructor-input-ru" autocomplete="new-sector-text" style="width: 100%; background: #0f172a; color: #cbd5e1; border: 1px solid #334155; padding: 4px 8px; font-size: 11px; border-radius: 4px; box-sizing: border-box;">
        </div>
            `;
            inputKk = box.querySelector('.constructor-input-kk');
            inputRu = box.querySelector('.constructor-input-ru');
        }

        // Фиксируем sectorIndex для обработчиков, исключая влияние асинхронных прыжков
        inputKk.oninput = (e) => {
            const currentIdx = sectorIndex - 1;
            constructorData[layer.key][currentIdx]['kk'] = e.target.value;
            window.dataset[layer.key] = constructorData[layer.key];
        };
        inputRu.oninput = (e) => {
            const currentIdx = sectorIndex - 1;
            constructorData[layer.key][currentIdx]['ru'] = e.target.value;
            window.dataset[layer.key] = constructorData[layer.key];
        };

        // Живая перерисовка колеса происходит только при потере фокуса (onchange)
        inputKk.onchange = () => {
            if (typeof regenerateWheels === 'function') {
                regenerateWheels();
                highlightActiveSector(window.currentSectorIndex);
            }
        };
        inputRu.onchange = () => {
            if (typeof regenerateWheels === 'function') {
                regenerateWheels();
                highlightActiveSector(window.currentSectorIndex);
            }
        };

        const nextKkValue = constructorData[layer.key][idx].kk;
        const nextRuValue = constructorData[layer.key][idx].ru;

        // Обновляем значения только если пользователь не пишет в инпут прямо сейчас
        if (document.activeElement !== inputKk) inputKk.value = nextKkValue;
        if (document.activeElement !== inputRu) inputRu.value = nextRuValue;

        inputKk.placeholder = `Сектор ${sectorIndex}: ${layer.label} (KK)`;
        inputRu.placeholder = `Сектор ${sectorIndex}: ${layer.label} (RU)`;
    });
}

/**
 * Подсвечивает активный сектор на всех трёх колёсах рамкой
 */
function highlightActiveSector(sectorIndex) {
    document.querySelectorAll('.segment-cell path[data-constructor-highlight]').forEach(el => {
        el.removeAttribute('data-constructor-highlight');
        el.setAttribute('stroke', 'white');
        el.setAttribute('stroke-width', '2');
        el.style.filter = 'none';
    });

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

    window.dataset = {
        outer: constructorData.outer,
        middle: constructorData.middle,
        inner: constructorData.inner
    };
    if (typeof regenerateWheels === 'function') {
        regenerateWheels();
        highlightActiveSector(window.currentSectorIndex);
    }
}

/**
 * Отправка готового объекта темы в базу данных Supabase (Создание или Обновление)
 */
async function applyInlineTheme() {
    const titleRuEl = document.getElementById('inlineTitleRu');
    const titleKkEl = document.getElementById('inlineTitleKk');

    if (!titleRuEl || !titleKkEl) return;

    const titleRu = titleRuEl.value.trim();
    const titleKk = titleKkEl.value.trim();

    if (!titleRu || !titleKk) {
        alert('Пожалуйста, заполните название темы на обоих языках!');
        return;
    }

    const client = window.supabaseClient;
    if (!client) {
        alert('Ошибка: Клиент Supabase (window.supabaseClient) не инициализирован!');
        return;
    }

    try {
        console.log("=== ЗАПУСК СОХРАНЕНИЯ ТЕМЫ ===");

        let user = null;
        if (typeof window.checkUser === 'function') {
            user = await window.checkUser();
        } else {
            const { data: authData } = await client.auth.getUser();
            user = authData?.user;
        }

        if (!user) {
            alert('Ошибка безопасности: Вы должны быть авторизованы на сайте для изменения тем!');
            return;
        }

        let targetThemeId = window.editingThemeId; // Это либо валидная строка UUID, либо null

        if (targetThemeId) {
            // --- РЕЖИМ АПДЕЙТА (UPDATE) ---
            console.log(`Обновляем существующую тему ID (UUID): ${targetThemeId}`);
            
            const { error: updateThemeError } = await client
                .from('themes')
                .update({ title_ru: titleRu, title_kk: titleKk })
                .eq('id', targetThemeId);

            if (updateThemeError) throw updateThemeError;

            const { error: deleteItemsError } = await client
                .from('wheel_items')
                .delete()
                .eq('theme_id', targetThemeId);

            if (deleteItemsError) throw deleteItemsError;

        } else {
            // --- РЕЖИМ СОЗДАНИЯ (INSERT) ---
            console.log("Создаем совершенно новую тему...");
            const { data: themeRecord, error: themeError } = await client
                .from('themes')
                .insert([{
                    user_id: user.id,
                    title_ru: titleRu,
                    title_kk: titleKk
                }])
                .select()
                .single();

            if (themeError) throw themeError;
            targetThemeId = themeRecord.id; // Supabase возвращает сгенерированную строку UUID
        }

        // Сборка массива из 18 сегментов для записи
        const itemsToInsert = [];
        const circles = ['outer', 'middle', 'inner'];

        circles.forEach(circleType => {
            constructorData[circleType].forEach((sector, index) => {
                const txtRu = sector.ru.trim() || `Сектор ${index + 1}`;
                const txtKk = sector.kk.trim() || `Сектор ${index + 1}`;

                itemsToInsert.push({
                    theme_id: targetThemeId, // Валидная строка UUID
                    circle_type: circleType,
                    position: index,
                    text_ru: txtRu,
                    text_kk: txtKk
                });
            });
        });

        const { error: itemsError } = await client
            .from('wheel_items')
            .insert(itemsToInsert);

        if (itemsError) throw itemsError;
        console.log("Все 18 сегментов успешно синхронизированы с базой.");

        alert(window.editingThemeId ? 'Тема успешно обновлена!' : 'Тема успешно сохранена в базу данных!');

        // Очищаем поля ввода заголовков
        titleRuEl.value = '';
        titleKkEl.value = '';

        // Перезагружаем кастомные темы локально из базы
        if (typeof window.loadCustomThemes === 'function') {
            await window.loadCustomThemes();
        }

        window.currentTheme = `custom_${targetThemeId}`;
        window.editingThemeId = null;

        toggleInlineConstructor(); // Закрываем конструктор

        if (typeof window.loadTheme === 'function') {
            window.loadTheme(window.currentTheme);
        }

    } catch (err) {
        console.error('Критическая ошибка сохранения/модификации темы:', err);
        alert('Не удалось сохранить изменения: ' + err.message);
    }
}

// Экспорт функций в глобальную область видимости
window.switchToSector = switchToSector;
window.toggleInlineConstructor = toggleInlineConstructor;
window.applyInlineTheme = applyInlineTheme;

function clearCalculatorFields() {
    const fields = ['dash-q-kk', 'dash-q-ru', 'dash-a-kk', 'dash-a-ru', 'dash-r-kk', 'dash-r-ru'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = '-';
    });
}
window.clearCalculatorFields = clearCalculatorFields;
