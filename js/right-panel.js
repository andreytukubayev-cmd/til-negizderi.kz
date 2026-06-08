// Движок Колес Луллия 4.2 (С исправлением центровки SVG и поддержкой динамических тем)

let currentTheme = 'столовая';
let rotations = { inner: 0, middle: 0, outer: 0 };
let originalEngineInitialized = false;

const clickAudio = new Audio('short-click.mp3');
clickAudio.volume = 0.35;

function playClick() {
    clickAudio.currentTime = 0;
    clickAudio.play().catch(() => {});
}

// Построение сектора круга для SVG фона с динамическим центром
function svgSectorPath(cx, cy, rIn, rOut, startAngle, endAngle) {
    const toRad = Math.PI / 180;
    const x1_out = cx + rOut * Math.cos(startAngle * toRad);
    const y1_out = cy + rOut * Math.sin(startAngle * toRad);
    const x2_out = cx + rOut * Math.cos(endAngle * toRad);
    const y2_out = cy + rOut * Math.sin(endAngle * toRad);
    
    const x1_in = cx + rIn * Math.cos(endAngle * toRad);
    const y1_in = cy + rIn * Math.sin(endAngle * toRad);
    const x2_in = cx + rIn * Math.cos(startAngle * toRad);
    const y2_in = cy + rIn * Math.sin(startAngle * toRad);

    return `M ${x1_out} ${y1_out} \n` +
           `A ${rOut} ${rOut} 0 0 1 ${x2_out} ${y2_out} \n` +
           `L ${x1_in} ${y1_in} \n` +
           `A ${rIn} ${rIn} 0 0 0 ${x2_in} ${y2_in} Z`;
}

function loadTheme(themeName) {
    const themeData = getThemeData(themeName);
    if (!themeData) return false;
    
    currentTheme = themeName;
    const currentThemeEl = document.getElementById('currentTheme');
    if (currentThemeEl) currentThemeEl.innerText = themeName;
    
    // Обновляем глобальный dataset
    window.dataset = {
        outer: themeData.outer,
        middle: themeData.middle,
        inner: themeData.inner
    };
    
    if (originalEngineInitialized) {
        regenerateWheels();
    }
    
    return true;
}

function regenerateWheels() {
    let outerEl = document.getElementById('outerWheel');
    let middleEl = document.getElementById('middleWheel');
    let innerEl = document.getElementById('innerWheel');

    // Если структура ячеек уже существует в HTML, просто перегенерируем их
    if (outerEl && middleEl && innerEl) {
        generateWheelCells(outerEl, window.dataset.outer, 'outer');
        generateWheelCells(middleEl, window.dataset.middle, 'middle');
        generateWheelCells(innerEl, window.dataset.inner, 'inner');

        // Сбрасываем вращение визуально и в логике при смене темы
        rotations = { inner: 0, middle: 0, outer: 0 };
        innerEl.style.transform = 'rotate(0deg)';
        middleEl.style.transform = 'rotate(0deg)';
        outerEl.style.transform = 'rotate(0deg)';

        updateDashboard('inner', 0);
        updateDashboard('middle', 0);
        updateDashboard('outer', 0);
    }
}

function generateWheelCells(wheelEl, items, type) {
    const count = items.length;
    const angleStep = 360 / count;
    
    // Единый размер координатной сетки 640x640 полностью убирает пиксельное смещение
    const dMax = 640; 
    const cx = dMax / 2;
    const cy = dMax / 2;

    let rIn = 0, rOut = 0, textRadius = 0;
    let colorPrefix = '';

    if (type === 'outer') {
        rIn = 265; rOut = 320; textRadius = 295;
        colorPrefix = 'var(--color-out-';
    } else if (type === 'middle') {
        rIn = 195; rOut = 265; textRadius = 232;
        colorPrefix = 'var(--color-mid-';
    } else if (type === 'inner') {
        rIn = 0;   rOut = 195; textRadius = 160;
        colorPrefix = 'var(--color-inn-';
    }

    wheelEl.innerHTML = '';

    items.forEach((obj, i) => {
        const currentAngle = i * angleStep;
        
        const cell = document.createElement('div');
        cell.className = `segment-cell`;
        cell.style.position = 'absolute';
        cell.style.width = '100%';
        cell.style.height = '100%';
        cell.style.top = '0';
        cell.style.left = '0';
        cell.style.transform = `rotate(${currentAngle}deg)`;
        cell.style.transformOrigin = `${cx}px ${cy}px`;
        cell.style.overflow = 'visible';
        wheelEl.appendChild(cell);

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "wheel-svg");
        svg.setAttribute("viewBox", `0 0 ${dMax} ${dMax}`);
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';

        const startAngle = -120;
        const endAngle = -60;
        const sectorPathData = svgSectorPath(cx, cy, rIn, rOut, startAngle, endAngle);
        const sectorColor = `${colorPrefix}${i})`;

        const getArcPath = (radius) => {
            const startRad = (-116 * Math.PI) / 180;
            const endRad = (-64 * Math.PI) / 180;
            const x1 = cx + radius * Math.cos(startRad);
            const y1 = cy + radius * Math.sin(startRad);
            const x2 = cx + radius * Math.cos(endRad);
            const y2 = cy + radius * Math.sin(endRad);
            return `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;
        };

        // УМНАЯ ФУНКЦИЯ ПЕРЕНОСА ВЕРСИИ 4.2
        const splitPhraseSmart = (text, currentType) => {
            let charLimit = 50; 
            if (currentType === 'middle') charLimit = 40;
            if (currentType === 'inner')  charLimit = 12; 

            if (text.length <= charLimit || !text.includes(' ')) {
                return [text, ''];
            }

            const words = text.split(' ');
            let line1 = '';
            let line2 = '';

            for (let w = 0; w < words.length; w++) {
                if ((line1 + words[w]).length <= charLimit) {
                    line1 += (line1 === '' ? '' : ' ') + words[w];
                } else {
                    line2 = words.slice(w).join(' ');
                    break;
                }
            }

            if (line1 === '') {
                const mid = Math.ceil(words.length / 2);
                return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
            }

            return [line1, line2];
        };

        const [kkLine1, kkLine2] = splitPhraseSmart(obj.kk, type);
        const [ruLine1, ruLine2] = splitPhraseSmart(obj.ru, type);

        const step = 14; 
        
        const pIdKk1 = `p_kk1_${type}_${i}`, pIdKk2 = `p_kk2_${type}_${i}`;
        const pIdRu1 = `p_ru1_${type}_${i}`, pIdRu2 = `p_ru2_${type}_${i}`;

        let svgContent = `<path d="${sectorPathData}" fill="${sectorColor}"/>`;
        let currentR = textRadius;

        // --- РЕНДЕРИНГ КАЗАХСКОГО ТЕКСТА ---
        if (kkLine2) {
            svgContent += `
                <defs>
                    <path id="${pIdKk1}" d="${getArcPath(currentR)}" fill="none"/>
                    <path id="${pIdKk2}" d="${getArcPath(currentR - step)}" fill="none"/>
                </defs>
                <text class="svg-text-kk"><textPath href="#${pIdKk1}" startOffset="50%" text-anchor="middle">${kkLine1}</textPath></text>
                <text class="svg-text-kk"><textPath href="#${pIdKk2}" startOffset="50%" text-anchor="middle">${kkLine2}</textPath></text>
            `;
            currentR -= (step * 2) + 4;
        } else {
            svgContent += `
                <defs><path id="${pIdKk1}" d="${getArcPath(currentR)}" fill="none"/></defs>
                <text class="svg-text-kk"><textPath href="#${pIdKk1}" startOffset="50%" text-anchor="middle">${kkLine1}</textPath></text>
            `;
            currentR -= (step + 4);
        }

        // --- РЕНДЕРИНГ РУССКОГО ПЕРЕВОДA ---
        if (ruLine2) {
            svgContent += `
                <defs>
                    <path id="${pIdRu1}" d="${getArcPath(currentR)}" fill="none"/>
                    <path id="${pIdRu2}" d="${getArcPath(currentR - step)}" fill="none"/>
                </defs>
                <text class="svg-text-ru"><textPath href="#${pIdRu1}" startOffset="50%" text-anchor="middle">${ruLine1}</textPath></text>
                <text class="svg-text-ru"><textPath href="#${pIdRu2}" startOffset="50%" text-anchor="middle">${ruLine2}</textPath></text>
            `;
        } else {
            svgContent += `
                <defs><path id="${pIdRu1}" d="${getArcPath(currentR)}" fill="none"/></defs>
                <text class="svg-text-ru"><textPath href="#${pIdRu1}" startOffset="50%" text-anchor="middle">${ruLine1}</textPath></text>
            `;
        }

        svg.innerHTML = svgContent;
        cell.appendChild(svg);

        // Отрисовка разделительных линий (.wheel-divider)
        const divider = document.createElement('div');
        divider.className = 'wheel-divider';
        divider.style.position = 'absolute';
        divider.style.transform = `rotate(${angleStep / 2}deg)`;
        divider.style.transformOrigin = "bottom center";
        divider.style.left = "50%";
        cell.appendChild(divider);
    });
}

// Система Drag & Drop
function setupRotationEngine(wheelEl, key) {
    let isDragging = false;
    let startAngle = 0;
    let lastSectorIndex = 0;

    function getCursorAngle(e) {
        const rect = wheelEl.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
    }

    function onStart(e) {
        isDragging = true;
        wheelEl.classList.add('active-turning');
        startAngle = getCursorAngle(e) - rotations[key];
        wheelEl.style.transition = 'none';
    }

    function onMove(e) {
        if (!isDragging) return;
        if (!e.touches) e.preventDefault();
        
        rotations[key] = getCursorAngle(e) - startAngle;
        wheelEl.style.transform = `rotate(${rotations[key]}deg)`;
        
        let norm = (-rotations[key]) % 360;
        if (norm < 0) norm += 360;
        let currentSector = Math.round(norm / 60) % 6;
        
        if (currentSector !== lastSectorIndex) {
            playClick();
            lastSectorIndex = currentSector;
        }
        
        updateDashboard(key, rotations[key]);
    }

    function onEnd() {
        if (!isDragging) return;
        isDragging = false;
        wheelEl.classList.remove('active-turning');
        
        wheelEl.style.transition = 'transform 0.4s cubic-bezier(0.15, 0.85, 0.3, 1.25)';
        rotations[key] = Math.round(rotations[key] / 60) * 60;
        wheelEl.style.transform = `rotate(${rotations[key]}deg)`;
        
        playClick();
        updateDashboard(key, rotations[key]);
    }

    wheelEl.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    wheelEl.addEventListener('touchstart', onStart, {passive: true});
    window.addEventListener('touchmove', onMove, {passive: false});
    window.addEventListener('touchend', onEnd);
}

function updateDashboard(key, rotation) {
    let normalizedAngle = (-rotation) % 360;
    if (normalizedAngle < 0) normalizedAngle += 360;
    
    const index = Math.round(normalizedAngle / 60) % 6;
    const activeData = window.dataset[key][index];
    
    const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
    const resKkEl = document.getElementById(`resKk${capitalizedKey}`);
    const resRuEl = document.getElementById(`resRu${capitalizedKey}`);
    
    if (resKkEl && resRuEl) {
        resKkEl.innerText = activeData?.kk || '-';
        resRuEl.innerText = activeData?.ru || '-';
    }
    
    // Синхронизация с блоком wheelsDisplay (если он есть на странице)
    const displayDiv = document.getElementById('wheelsDisplay');
    if (displayDiv && originalEngineInitialized) {
        const outerIdx = Math.round(((-rotations.outer) % 360 < 0 ? (-rotations.outer) % 360 + 360 : (-rotations.outer) % 360) / 60) % 6;
        const middleIdx = Math.round(((-rotations.middle) % 360 < 0 ? (-rotations.middle) % 360 + 360 : (-rotations.middle) % 360) / 60) % 6;
        const innerIdx = Math.round(((-rotations.inner) % 360 < 0 ? (-rotations.inner) % 360 + 360 : (-rotations.inner) % 360) / 60) % 6;

        displayDiv.innerHTML = `
            <div class="mini-dash-item">
                <div class="mini-dash-label">❓ ВОПРОС</div>
                <div class="mini-dash-kk">${window.dataset.outer[outerIdx]?.kk || '-'}</div>
                <div class="mini-dash-ru">${window.dataset.outer[outerIdx]?.ru || '-'}</div>
            </div>
            <div class="mini-dash-item">
                <div class="mini-dash-label">💬 ОТВЕТ</div>
                <div class="mini-dash-kk">${window.dataset.middle[middleIdx]?.kk || '-'}</div>
                <div class="mini-dash-ru">${window.dataset.middle[middleIdx]?.ru || '-'}</div>
            </div>
            <div class="mini-dash-item">
                <div class="mini-dash-label">😊 РЕАКЦИЯ</div>
                <div class="mini-dash-kk">${window.dataset.inner[innerIdx]?.kk || '-'}</div>
                <div class="mini-dash-ru">${window.dataset.inner[innerIdx]?.ru || '-'}</div>
            </div>
        `;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Получаем тему по умолчанию из подключенной библиотеки тем
    if (typeof getThemeData === "function") {
        const defaultTheme = getThemeData('столовая');
        if (defaultTheme) {
            window.dataset = {
                outer: defaultTheme.outer,
                middle: defaultTheme.middle,
                inner: defaultTheme.inner
            };
        }
    }

    const outerEl = document.getElementById('outerWheel');
    const middleEl = document.getElementById('middleWheel');
    const innerEl = document.getElementById('innerWheel');

    if (outerEl && middleEl && innerEl) {
        // Отрисовка секторов
        generateWheelCells(outerEl, window.dataset.outer, 'outer');
        generateWheelCells(middleEl, window.dataset.middle, 'middle');
        generateWheelCells(innerEl, window.dataset.inner, 'inner');

        // Подключение Drag & Drop
        setupRotationEngine(innerEl, 'inner');
        setupRotationEngine(middleEl, 'middle');
        setupRotationEngine(outerEl, 'outer');
    }

    originalEngineInitialized = true;

    updateDashboard('inner', 0);
    updateDashboard('middle', 0);
    updateDashboard('outer', 0);
    
    // --- ФУНКЦИЯ КНОПКИ АВТО-ВРАЩЕНИЯ ---
    const spinBtn = document.getElementById('spinBtn');
    let isSpinning = false;

    if (spinBtn && outerEl && middleEl && innerEl) {
        spinBtn.addEventListener('click', () => {
            if (isSpinning) return; 
            isSpinning = true;
            spinBtn.style.pointerEvents = 'none';

            const wheels = [
                { el: innerEl, key: 'inner', steps: 12 + Math.floor(Math.random() * 6) },
                { el: middleEl, key: 'middle', steps: 18 + Math.floor(Math.random() * 6) },
                { el: outerEl, key: 'outer', steps: 24 + Math.floor(Math.random() * 6) }
            ];

            wheels.forEach((w) => {
                w.el.style.transition = 'transform 2.5s cubic-bezier(0.1, 0.8, 0.2, 1)';
                
                const targetRotation = rotations[w.key] - (w.steps * 60);
                w.el.style.transform = `rotate(${targetRotation}deg)`;
                
                let currentStep = 0;
                const interval = setInterval(() => {
                    if (currentStep >= w.steps) {
                        clearInterval(interval);
                    } else {
                        playClick();
                        currentStep++;
                    }
                }, 2500 / w.steps);

                rotations[w.key] = targetRotation;
            });

            setTimeout(() => {
                isSpinning = false;
                spinBtn.style.pointerEvents = 'auto';
                
                wheels.forEach((w) => {
                    updateDashboard(w.key, rotations[w.key]);
                });
                playClick(); 
            }, 2600);
        });
    }

    // Слушатель для поиска тем (если есть строка ввода)
    const themeSearch = document.getElementById('themeSearch');
    if (themeSearch) {
        themeSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                if (typeof searchTheme === "function") {
                    const found = searchTheme(themeSearch.value);
                    if (found) {
                        loadTheme(found);
                        themeSearch.value = '';
                    }
                }
            }
        });
    }
});
