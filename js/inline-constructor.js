// === ЖИВОЙ КОНСТРУКТОР ТЕМ ДЛЯ КОЛЕС ЛУЛЛИЯ ===

let isConstructorMode = false;
let currentConstructorCircle = 'outer';
let savedBackupTheme = null; // Хранилище ID темы, которая стояла до включения конструктора

// Временный буфер для создания колеса (6 секторов для каждого уровня)
let customThemeBuffer = {
    titleRu: '',
    titleKk: '',
    outer: Array.from({length: 6}, () => ({ ru: '', kk: '' })),
    middle: Array.from({length: 6}, () => ({ ru: '', kk: '' })),
    inner: Array.from({length: 6}, () => ({ ru: '', kk: '' }))
};

/**
 * Переключение режима (Своя тема / Обычный режим)
 */
function toggleInlineConstructor() {
    isConstructorMode = !isConstructorMode;
    
    const btn = document.getElementById('toggleConstructorBtn');
    const inputTitle = document.getElementById('inlineThemeInputs');
    const phrasesPanel = document.getElementById('inlinePhrasesPanel');
    const searchRow = document.querySelector('.calc-search-row');

    if (isConstructorMode) {
        // Включаем режим конструктора
        btn.classList.add('active-mode');
        btn.querySelector('.btn-icon').innerText = '❌'; // Меняем карандаш на крестик отмены
        btn.setAttribute('title', 'Отменить создание');
        
        if(searchRow) searchRow.style.display = 'none';
        inputTitle.style.display = 'flex';
        phrasesPanel.style.display = 'block';
        
        if (window.currentTheme) {
            savedBackupTheme = window.currentTheme;
        }

        resetConstructorBuffer();
        clearCalculatorFields();
        renderInlineInputs();
    } else {
        // Выход из режима без сохранения
        btn.classList.remove('active-mode');
        btn.querySelector('.btn-icon').innerText = '✍️'; // Возвращаем карандаш обратно
        btn.setAttribute('title', 'Создать свою тему');
        
        if(searchRow) searchRow.style.display = 'flex';
        inputTitle.style.display = 'none';
        phrasesPanel.style.display = 'none';
        
        if (savedBackupTheme && typeof window.loadTheme === 'function') {
            window.loadTheme(savedBackupTheme);
        } else {
            clearCalculatorFields();
        }
    }
}

/**
 * Очистка датасета колес на лету (визуальный "чистый лист")
 */
function clearCalculatorFields() {
    window.dataset = {
        outer: Array(6).fill({ kk: ' ', ru: ' ' }),
        middle: Array(6).fill({ kk: ' ', ru: ' ' }),
        inner: Array(6).fill({ kk: ' ', ru: ' ' })
    };
    if (typeof window.regenerateWheels === 'function') window.regenerateWheels();
}

/**
 * Сброс буфера данных
 */
function resetConstructorBuffer() {
    document.getElementById('inlineTitleRu').value = '';
    document.getElementById('inlineTitleKk').value = '';
    customThemeBuffer = {
        titleRu: '',
        titleKk: '',
        outer: Array.from({length: 6}, () => ({ ru: '', kk: '' })),
        middle: Array.from({length: 6}, () => ({ ru: '', kk: '' })),
        inner: Array.from({length: 6}, () => ({ ru: '', kk: '' }))
    };
}

/**
 * Переключение вкладок кругов (Внешний / Средний / Внутренний)
 */
function switchConstructorTab(circleType, btnEl) {
    saveCurrentInputsToBuffer(); // Сохраняем данные из текущих инпутов перед уходом
    currentConstructorCircle = circleType;
    
    // Переключаем активную кнопку в UI
    document.querySelectorAll('.circle-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
    btnEl.classList.add('active');
    
    renderInlineInputs(); // Рендерим инпуты для переключенного круга
}

/**
 * Генерация 6 пар инпутов для текущего активного круга
 */
function renderInlineInputs() {
    const holder = document.getElementById('inlineInputsHolder');
    if (!holder) return;
    holder.innerHTML = '';
    
    const items = customThemeBuffer[currentConstructorCircle];
    
    for (let i = 0; i < 6; i++) {
        const row = document.createElement('div');
        row.className = 'inline-phrase-row';
        row.style.display = 'flex';
        row.style.gap = '6px';
        row.style.marginBottom = '6px';
        row.style.alignItems = 'center';
        
        row.innerHTML = `
            <span style="font-size: 11px; font-weight: bold; width: 14px; color: #475569; text-align: center;">${i+1}</span>
            <input type="text" class="inline-item-ru" data-pos="${i}" value="${items[i].ru || ''}" placeholder="Русская фраза" style="flex:1; height: 28px; box-sizing: border-box;" oninput="updateLiveWheel(${i}, 'ru', this.value)">
            <input type="text" class="inline-item-kk" data-pos="${i}" value="${items[i].kk || ''}" placeholder="Қазақша" style="flex:1; height: 28px; box-sizing: border-box;" oninput="updateLiveWheel(${i}, 'kk', this.value)">
        `;
        holder.appendChild(row);
    }
}

/**
 * Парсинг и сохранение данных из полей ввода в буфер
 */
function saveCurrentInputsToBuffer() {
    const rowsRu = document.querySelectorAll('.inline-item-ru');
    const rowsKk = document.querySelectorAll('.inline-item-kk');
    
    rowsRu.forEach(input => {
        const pos = parseInt(input.getAttribute('data-pos'));
        customThemeBuffer[currentConstructorCircle][pos].ru = input.value;
    });
    rowsKk.forEach(input => {
        const pos = parseInt(input.getAttribute('data-pos'));
        customThemeBuffer[currentConstructorCircle][pos].kk = input.value;
    });
}

/**
 * ЭФФЕКТ НА ЛЕТУ: Перерисовка текста на диске прямо во время ввода в инпут
 */
function updateLiveWheel(pos, lang, value) {
    // Пишем в буфер конструктора
    customThemeBuffer[currentConstructorCircle][pos][lang] = value;
    
    // Подменяем значение в глобальном dataset калькулятора (если пусто — ставим пробел)
    if (!window.dataset) window.dataset = {};
    if (!window.dataset[currentConstructorCircle]) window.dataset[currentConstructorCircle] = [];
    
    window.dataset[currentConstructorCircle][pos] = {
        ru: customThemeBuffer[currentConstructorCircle][pos].ru || ' ',
        kk: customThemeBuffer[currentConstructorCircle][pos].kk || ' '
    };
    
    // Вызываем перерисовку колес из библиотеки wheels_library.js
    if (typeof window.regenerateWheels === 'function') {
        window.regenerateWheels();
    }
}

/**
 * ФИНАЛЬНЫЙ ШАГ: Сборка и отправка структуры в таблицы Supabase
 */
async function applyInlineTheme() {
    saveCurrentInputsToBuffer(); // Фиксируем данные из открытой на данный момент вкладки
    
    const titleRu = document.getElementById('inlineTitleRu').value.trim();
    const titleKk = document.getElementById('inlineTitleKk').value.trim();
    
    if (!titleRu || !titleKk) {
        alert("Пожалуйста, заполните названия темы на обоих языках!");
        return;
    }

    // Проверяем авторизацию через правильное имя клиента из конфигурации
    const { data: { session }, error: authError } = await window.supabaseClient.auth.getSession();
    
    if (authError || !session) {
        alert("Чтобы сохранять свои колеса, необходимо войти в аккаунт через Google!");
        return;
    }
    
    const userId = session.user.id;
    
    try {
        // 1. Вставляем запись в таблицу тем через верный клиент
        const { data: themeData, error: themeError } = await window.supabaseClient
            .from('themes')
            .insert([{ 
                user_id: userId, 
                title_ru: titleRu, 
                title_kk: titleKk 
            }])
            .select()
            .single();
            
        if (themeError) throw themeError;
        
        const newThemeId = themeData.id;
        
        // 2. Формируем массив из 18 элементов для множественного INSERT (Bulk Insert)
        const itemsToInsert = [];
        const circles = ['outer', 'middle', 'inner'];
        
        circles.forEach(circleType => {
            for (let i = 0; i < 6; i++) {
                const item = customThemeBuffer[circleType][i];
                itemsToInsert.push({
                    theme_id: newThemeId,
                    circle_type: circleType,
                    position: i,
                    text_ru: item.ru.trim() || '-', // Защита от пустых строк
                    text_kk: item.kk.trim() || '-'
                });
            }
        });
        
        // 3. Отправляем 18 элементов одним запросом в базу через верный клиент
        const { error: itemsError } = await window.supabaseClient
            .from('wheel_items')
            .insert(itemsToInsert);
            
        if (itemsError) throw itemsError;
        
        alert(`Тема "${titleRu}" успешно сохранена в базу данных!`);
        
        // Переключаем интерфейс обратно, фиксируя созданную тему как текущую активную
        isConstructorMode = false;
        const btn = document.getElementById('toggleConstructorBtn');
        btn.classList.remove('active-mode');
        btn.querySelector('.btn-text').innerText = 'Своя тема';
        btn.querySelector('.btn-icon').innerText = '✍️';
        
        const searchRow = document.querySelector('.calc-search-row');
        if(searchRow) searchRow.style.display = 'flex';
        document.getElementById('inlineThemeInputs').style.display = 'none';
        document.getElementById('inlinePhrasesPanel').style.display = 'none';
        
        // Устанавливаем ID новой темы и обновляем заголовок калькулятора
        window.currentTheme = newThemeId;
        const mainTitle = document.getElementById('currentTheme');
        if (mainTitle) mainTitle.innerText = titleRu;

        // Если в твоем проекте есть функция обновления списка тем в поиске — вызови её здесь
        if (typeof window.initThemeSearch === 'function') window.initThemeSearch();

    } catch (err) {
        console.error("Ошибка при сохранении темы:", err.message || err);
        alert("Произошла ошибка при сохранении темы в Supabase. Проверьте консоль.");
    }
}
