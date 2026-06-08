// Логика правой панели с колёсами Луллия

let currentWheelRenderer = null;
let currentTheme = 'столовая';
let fullscreenRenderer = null;

// Функция загрузки темы
function loadTheme(themeName) {
    const themeData = getThemeData(themeName);
    if (!themeData) {
        console.warn('Тема не найдена:', themeName);
        return false;
    }
    
    currentTheme = themeName;
    document.getElementById('currentTheme').innerText = `Тема: ${themeName}`;
    
    // Обновляем мини-колёса
    if (currentWheelRenderer) {
        currentWheelRenderer.updateTheme(themeData);
    } else {
        currentWheelRenderer = new WheelRenderer('wheelsContainer', themeData);
    }
    
    return true;
}

// Поиск темы
function searchThemeAndLoad(query) {
    if (!query || query.trim() === '') return;
    
    const foundTheme = searchTheme(query);
    if (foundTheme) {
        loadTheme(foundTheme);
        
        // Добавляем подсказку в чат (опционально)
        const messagesContainer = document.getElementById('messages');
        if (messagesContainer) {
            const hintDiv = document.createElement('div');
            hintDiv.className = 'message bot';
            hintDiv.innerHTML = `<div class="message-content" style="font-size: 0.8em; background: #e8e8e8;">
                🎡 <strong>Найдена тема: ${foundTheme}</strong><br>
                Вращайте колёса справа, чтобы собрать диалог!
            </div>`;
            messagesContainer.appendChild(hintDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    } else {
        // Тема не найдена
        const messagesContainer = document.getElementById('messages');
        if (messagesContainer) {
            const hintDiv = document.createElement('div');
            hintDiv.className = 'message bot';
            hintDiv.innerHTML = `<div class="message-content" style="font-size: 0.8em; background: #ffe0e0;">
                ❓ <strong>Тема "${query}" не найдена</strong><br>
                Доступные темы: ${getAllThemes().join(', ')}
            </div>`;
            messagesContainer.appendChild(hintDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }
}

// Полноэкранный режим
function openFullscreenWheels() {
    const modal = document.getElementById('fullscreenWheelsModal');
    const container = document.getElementById('fullscreenWheelsContainer');
    
    if (!modal || !container) return;
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Создаём полноразмерные колёса (используем существующий рендерер, но с большими размерами)
    const themeData = getThemeData(currentTheme);
    if (!themeData) return;
    
    // Создаём временный рендерер для полноэкранного режима
    fullscreenRenderer = new FullscreenWheelRenderer(container, themeData);
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeFullscreenWheels() {
    const modal = document.getElementById('fullscreenWheelsModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        fullscreenRenderer = null;
    }
}

// Упрощённый рендерер для полноэкранного режима (используем оригинальный код из engine.js)
class FullscreenWheelRenderer {
    constructor(container, themeData) {
        this.container = container;
        this.themeData = themeData;
        this.currentRotations = { outer: 0, middle: 0, inner: 0 };
        this.init();
    }
    
    init() {
        this.container.innerHTML = '';
        
        // Создаём контейнер для колёс
        const wheelsWrapper = document.createElement('div');
        wheelsWrapper.className = 'fullscreen-wheels-wrapper';
        wheelsWrapper.style.position = 'relative';
        wheelsWrapper.style.width = '600px';
        wheelsWrapper.style.height = '600px';
        wheelsWrapper.style.margin = '0 auto';
        
        // Создаём колёса
        const outerDiv = document.createElement('div');
        outerDiv.className = 'fullscreen-outer-wheel';
        outerDiv.id = 'fullscreenOuterWheel';
        outerDiv.style.position = 'absolute';
        outerDiv.style.width = '600px';
        outerDiv.style.height = '600px';
        outerDiv.style.borderRadius = '50%';
        outerDiv.style.cursor = 'grab';
        outerDiv.style.zIndex = '1';
        
        const middleDiv = document.createElement('div');
        middleDiv.className = 'fullscreen-middle-wheel';
        middleDiv.id = 'fullscreenMiddleWheel';
        middleDiv.style.position = 'absolute';
        middleDiv.style.width = '500px';
        middleDiv.style.height = '500px';
        middleDiv.style.borderRadius = '50%';
        middleDiv.style.cursor = 'grab';
        middleDiv.style.zIndex = '2';
        
        const innerDiv = document.createElement('div');
        innerDiv.className = 'fullscreen-inner-wheel';
        innerDiv.id = 'fullscreenInnerWheel';
        innerDiv.style.position = 'absolute';
        innerDiv.style.width = '370px';
        innerDiv.style.height = '370px';
        innerDiv.style.borderRadius = '50%';
        innerDiv.style.cursor = 'grab';
        innerDiv.style.zIndex = '3';
        
        // Центрируем
        const centerOffset = (600 - 500) / 2;
        middleDiv.style.left = `${centerOffset}px`;
        middleDiv.style.top = `${centerOffset}px`;
        
        const innerOffset = (600 - 370) / 2;
        innerDiv.style.left = `${innerOffset}px`;
        innerDiv.style.top = `${innerOffset}px`;
        
        wheelsWrapper.appendChild(outerDiv);
        wheelsWrapper.appendChild(middleDiv);
        wheelsWrapper.appendChild(innerDiv);
        this.container.appendChild(wheelsWrapper);
        
        // Добавляем указатель
        const pointer = document.createElement('div');
        pointer.style.position = 'absolute';
        pointer.style.top = '-12px';
        pointer.style.left = '50%';
        pointer.style.transform = 'translateX(-50%)';
        pointer.style.width = '0';
        pointer.style.height = '0';
        pointer.style.borderLeft = '12px solid transparent';
        pointer.style.borderRight = '12px solid transparent';
        pointer.style.borderTop = '20px solid #00b4d8';
        pointer.style.zIndex = '10';
        wheelsWrapper.appendChild(pointer);
        
        // Генерируем сектора (упрощённо — используем данные напрямую)
        this.generateSimpleWheel(outerDiv, this.themeData.outer, 600, 250, 300);
        this.generateSimpleWheel(middleDiv, this.themeData.middle, 500, 190, 250);
        this.generateSimpleWheel(innerDiv, this.themeData.inner, 370, 0, 185);
        
        this.setupDrag();
    }
    
    generateSimpleWheel(wheelEl, items, size, rIn, rOut) {
        wheelEl.style.background = '#e0e0e0';
        wheelEl.style.border = '3px solid white';
        wheelEl.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
        
        // Простое отображение номеров секторов (для демо)
        const angleStep = 360 / items.length;
        for (let i = 0; i < items.length; i++) {
            const sector = document.createElement('div');
            sector.style.position = 'absolute';
            sector.style.width = '100%';
            sector.style.height = '100%';
            sector.style.transform = `rotate(${i * angleStep}deg)`;
            
            const label = document.createElement('div');
            label.style.position = 'absolute';
            label.style.top = '30%';
            label.style.left = '50%';
            label.style.transform = 'translate(-50%, -50%)';
            label.style.fontSize = '10px';
            label.style.fontWeight = 'bold';
            label.style.textAlign = 'center';
            label.innerHTML = `${items[i].kk.substring(0, 10)}<br><small>${items[i].ru.substring(0, 15)}</small>`;
            label.style.color = '#333';
            label.style.textShadow = '0 1px 1px white';
            
            sector.appendChild(label);
            wheelEl.appendChild(sector);
        }
    }
    
    setupDrag() {
        // Упрощённый drag для полноэкранного режима
        const wheels = [
            { el: document.getElementById('fullscreenOuterWheel'), key: 'outer' },
            { el: document.getElementById('fullscreenMiddleWheel'), key: 'middle' },
            { el: document.getElementById('fullscreenInnerWheel'), key: 'inner' }
        ];
        
        wheels.forEach(w => {
            if (!w.el) return;
            let isDragging = false;
            let startAngle = 0;
            
            const getAngle = (e, el) => {
                const rect = el.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
            };
            
            w.el.addEventListener('mousedown', (e) => {
                isDragging = true;
                startAngle = getAngle(e, w.el) - this.currentRotations[w.key];
                w.el.style.transition = 'none';
            });
            
            window.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                this.currentRotations[w.key] = getAngle(e, w.el) - startAngle;
                w.el.style.transform = `rotate(${this.currentRotations[w.key]}deg)`;
            });
            
            window.addEventListener('mouseup', () => {
                if (!isDragging) return;
                isDragging = false;
                w.el.style.transition = 'transform 0.3s ease';
                this.currentRotations[w.key] = Math.round(this.currentRotations[w.key] / 60) * 60;
                w.el.style.transform = `rotate(${this.currentRotations[w.key]}deg)`;
            });
        });
    }
}

// Инициализация правой панели
document.addEventListener('DOMContentLoaded', () => {
    // Загружаем первую тему
    loadTheme('столовая');
    
    // Поиск по теме
    const themeSearch = document.getElementById('themeSearch');
    if (themeSearch) {
        themeSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchThemeAndLoad(themeSearch.value);
                themeSearch.value = '';
            }
        });
    }
    
    // Полноэкранный режим
    const expandBtn = document.getElementById('expandWheelsBtn');
    if (expandBtn) {
        expandBtn.addEventListener('click', openFullscreenWheels);
    }
    
    // Закрытие модального окна
    const closeBtn = document.getElementById('closeModalBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeFullscreenWheels);
    }
    
    // Закрытие по клику на фон
    const modal = document.getElementById('fullscreenWheelsModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeFullscreenWheels();
            }
        });
    }
});
