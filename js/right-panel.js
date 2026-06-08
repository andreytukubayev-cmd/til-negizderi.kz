// Логика правой панели с колёсами Луллия (ИСПРАВЛЕННАЯ ВЕРСИЯ)

let currentWheelRenderer = null;
let currentTheme = 'столовая';
let fullscreenActive = false;

// Функция загрузки темы
function loadTheme(themeName) {
    const themeData = getThemeData(themeName);
    if (!themeData) {
        console.warn('Тема не найдена:', themeName);
        return false;
    }
    
    currentTheme = themeName;
    const currentThemeEl = document.getElementById('currentTheme');
    if (currentThemeEl) {
        currentThemeEl.innerText = `Тема: ${themeName}`;
    }
    
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
            
            setTimeout(() => {
                hintDiv.remove();
            }, 5000);
        }
    } else {
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
            
            setTimeout(() => {
                hintDiv.remove();
            }, 5000);
        }
    }
}

// ПОЛНОЭКРАННЫЙ РЕЖИМ (рабочая версия)
function openFullscreenWheels() {
    const modal = document.getElementById('fullscreenWheelsModal');
    const container = document.getElementById('fullscreenWheelsContainer');
    
    if (!modal || !container) return;
    
    container.innerHTML = '';
    
    const themeData = getThemeData(currentTheme);
    if (!themeData) return;
    
    // Создаём полноэкранные колёса
    createFullscreenWheels(container, themeData);
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    fullscreenActive = true;
}

function closeFullscreenWheels() {
    const modal = document.getElementById('fullscreenWheelsModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        fullscreenActive = false;
    }
}

function createFullscreenWheels(container, themeData) {
    container.innerHTML = '';
    container.style.position = 'relative';
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';
    container.style.minHeight = '500px';
    
    // Создаём обёртку
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.width = 'min(90vw, 600px)';
    wrapper.style.height = 'min(90vw, 600px)';
    wrapper.style.margin = '0 auto';
    
    // Внешнее кольцо
    const outerWheel = createFullWheel(themeData.outer, 'outer', 'min(90vw, 600px)', 250, 300);
    outerWheel.style.position = 'absolute';
    outerWheel.style.top = '0';
    outerWheel.style.left = '0';
    outerWheel.style.zIndex = '1';
    
    // Среднее кольцо
    const middleSize = parseInt('min(90vw, 600px)') * 0.83;
    const middleWheel = createFullWheel(themeData.middle, 'middle', `${parseInt('min(90vw, 600px)') * 0.83}px`, 190, 250);
    middleWheel.style.position = 'absolute';
    middleWheel.style.top = '50%';
    middleWheel.style.left = '50%';
    middleWheel.style.transform = 'translate(-50%, -50%)';
    middleWheel.style.zIndex = '2';
    
    // Внутреннее кольцо
    const innerWheel = createFullWheel(themeData.inner, 'inner', `${parseInt('min(90vw, 600px)') * 0.62}px`, 0, 185);
    innerWheel.style.position = 'absolute';
    innerWheel.style.top = '50%';
    innerWheel.style.left = '50%';
    innerWheel.style.transform = 'translate(-50%, -50%)';
    innerWheel.style.zIndex = '3';
    
    // Указатель-стрелка
    const pointer = document.createElement('div');
    pointer.style.position = 'absolute';
    pointer.style.top = '-15px';
    pointer.style.left = '50%';
    pointer.style.transform = 'translateX(-50%)';
    pointer.style.width = '0';
    pointer.style.height = '0';
    pointer.style.borderLeft = '15px solid transparent';
    pointer.style.borderRight = '15px solid transparent';
    pointer.style.borderTop = '25px solid #00b4d8';
    pointer.style.zIndex = '10';
    pointer.style.filter = 'drop-shadow(0 2px 5px rgba(0,0,0,0.3))';
    
    wrapper.appendChild(outerWheel);
    wrapper.appendChild(middleWheel);
    wrapper.appendChild(innerWheel);
    wrapper.appendChild(pointer);
    
    container.appendChild(wrapper);
}

function createFullWheel(items, type, size, rIn, rOut) {
    const wheel = document.createElement('div');
    const diameter = parseInt(size);
    wheel.style.width = `${diameter}px`;
    wheel.style.height = `${diameter}px`;
    wheel.style.borderRadius = '50%';
    wheel.style.cursor = 'grab';
    wheel.style.position = 'relative';
    wheel.style.background = '#f0f0f0';
    wheel.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
    wheel.style.border = '3px solid white';
    
    const count = items.length;
    const angleStep = 360 / count;
    const cx = diameter / 2;
    const cy = diameter / 2;
    
    const colors = [
        '#ffadad', '#ffd6a5', '#fdffb6',
        '#caffbf', '#9bf6ff', '#a0c4ff'
    ];
    
    for (let i = 0; i < count; i++) {
        const sector = document.createElement('div');
        sector.style.position = 'absolute';
        sector.style.width = '100%';
        sector.style.height = '100%';
        sector.style.transform = `rotate(${i * angleStep}deg)`;
        sector.style.clipPath = `polygon(50% 50%, ${50 + (rOut / diameter) * 50 * Math.cos(-60 * Math.PI / 180)}% ${50 + (rOut / diameter) * 50 * Math.sin(-60 * Math.PI / 180)}%, ${50 + (rOut / diameter) * 50 * Math.cos(-120 * Math.PI / 180)}% ${50 + (rOut / diameter) * 50 * Math.sin(-120 * Math.PI / 180)}%)`;
        
        // Цветной фон
        const bg = document.createElement('div');
        bg.style.position = 'absolute';
        bg.style.width = '100%';
        bg.style.height = '100%';
        bg.style.background = colors[i % colors.length];
        bg.style.opacity = '0.8';
        bg.style.clipPath = `polygon(50% 50%, ${50 + (rOut / diameter) * 50 * Math.cos(-60 * Math.PI / 180)}% ${50 + (rOut / diameter) * 50 * Math.sin(-60 * Math.PI / 180)}%, ${50 + (rOut / diameter) * 50 * Math.cos(-120 * Math.PI / 180)}% ${50 + (rOut / diameter) * 50 * Math.sin(-120 * Math.PI / 180)}%)`;
        sector.appendChild(bg);
        
        // Текст
        const textDiv = document.createElement('div');
        textDiv.style.position = 'absolute';
        textDiv.style.top = '35%';
        textDiv.style.left = '50%';
        textDiv.style.transform = 'translate(-50%, -50%)';
        textDiv.style.textAlign = 'center';
        textDiv.style.fontSize = type === 'inner' ? '10px' : '12px';
        textDiv.style.fontWeight = 'bold';
        textDiv.style.color = '#1a1d24';
        textDiv.style.textShadow = '0 1px 1px white';
        textDiv.style.width = '80px';
        textDiv.innerHTML = `${items[i].kk}<br><small style="font-size: 9px; color: #4a5568;">${items[i].ru}</small>`;
        
        sector.appendChild(textDiv);
        wheel.appendChild(sector);
    }
    
    // Добавляем вращение
    let rotation = 0;
    let isDragging = false;
    let startAngle = 0;
    
    const getAngle = (e) => {
        const rect = wheel.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
    };
    
    const onStart = (e) => {
        isDragging = true;
        startAngle = getAngle(e) - rotation;
        wheel.style.transition = 'none';
        e.preventDefault();
    };
    
    const onMove = (e) => {
        if (!isDragging) return;
        rotation = getAngle(e) - startAngle;
        wheel.style.transform = `rotate(${rotation}deg)`;
        if (type === 'outer') {
            wheel.style.transform = `rotate(${rotation}deg)`;
        } else {
            wheel.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
        }
        e.preventDefault();
    };
    
    const onEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        wheel.style.transition = 'transform 0.3s ease';
        rotation = Math.round(rotation / 60) * 60;
        if (type === 'outer') {
            wheel.style.transform = `rotate(${rotation}deg)`;
        } else {
            wheel.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
        }
    };
    
    wheel.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    wheel.addEventListener('touchstart', onStart, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    
    return wheel;
}

// ИНИЦИАЛИЗАЦИЯ
document.addEventListener('DOMContentLoaded', () => {
    loadTheme('столовая');
    
    const themeSearch = document.getElementById('themeSearch');
    if (themeSearch) {
        themeSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchThemeAndLoad(themeSearch.value);
                themeSearch.value = '';
            }
        });
    }
    
    const expandBtn = document.getElementById('expandWheelsBtn');
    if (expandBtn) {
        expandBtn.addEventListener('click', openFullscreenWheels);
    }
    
    const closeBtn = document.getElementById('closeModalBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeFullscreenWheels);
    }
    
    const modal = document.getElementById('fullscreenWheelsModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeFullscreenWheels();
            }
        });
    }
});
