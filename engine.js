// Движок Колес Луллия 4.2 (Авторасчет динамического центра SVG)

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

    return `M ${x1_out} ${y1_out} 
            A ${rOut} ${rOut} 0 0 1 ${x2_out} ${y2_out} 
            L ${x1_in} ${y1_in} 
            A ${rIn} ${rIn} 0 0 0 ${x2_in} ${y2_in} Z`;
}

function generateWheelCells(wheelEl, items, type) {
    const count = items.length;
    const angleStep = 360 / count;
    
    let dMax = 0;
    let rIn = 0, rOut = 0, textRadius = 0;
    let colorPrefix = '';

    if (type === 'outer') {
        dMax = 640; rIn = 265; rOut = 320; textRadius = 295;
        colorPrefix = 'var(--color-out-';
    } else if (type === 'middle') {
        dMax = 530; rIn = 195; rOut = 265; textRadius = 232;
        colorPrefix = 'var(--color-mid-';
    } else if (type === 'inner') {
        dMax = 390; rIn = 0;   rOut = 195; textRadius = 160;
        colorPrefix = 'var(--color-inn-';
    }

    const cx = dMax / 2;
    const cy = dMax / 2;

    items.forEach((obj, i) => {
        const currentAngle = i * angleStep;
        
        const cell = document.createElement('div');
        cell.className = `segment-cell`;
        cell.style.transform = `rotate(${currentAngle}deg)`;
        cell.style.transformOrigin = `${cx}px ${cy}px`;
        wheelEl.appendChild(cell);

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "wheel-svg");
        svg.setAttribute("viewBox", `0 0 ${dMax} ${dMax}`);

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

        // УМНАЯ ФУНКЦИЯ ПЕРЕНОСА: Переносит только если строка превышает лимит символов для конкретного кольца
        const splitPhraseSmart = (text, currentType) => {
            // Задаем лимиты символов: на внешних кольцах места много (40-50 знаков), на внутреннем — мало (12 знаков)
            let charLimit = 50; 
            if (currentType === 'middle') charLimit = 40;
            if (currentType === 'inner')  charLimit = 12; 

            // Если строка короткая или это одно слово — не трогаем её
            if (text.length <= charLimit || !text.includes(' ')) {
                return [text, ''];
            }

            const words = text.split(' ');
            let line1 = '';
            let line2 = '';

            // Собираем первую строку, пока не упремся в лимит
            for (let w = 0; w < words.length; w++) {
                if ((line1 + words[w]).length <= charLimit) {
                    line1 += (line1 === '' ? '' : ' ') + words[w];
                } else {
                    // Все оставшиеся слова скидываем на вторую строку
                    line2 = words.slice(w).join(' ');
                    break;
                }
            }

            // Страховка: если первая строка пустая (например, первое слово сразу гигантское), делим просто пополам
            if (line1 === '') {
                const mid = Math.ceil(words.length / 2);
                return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
            }

            return [line1, line2];
        };

        // Применяем умное разбиение с учетом типа кольца
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

        const divider = document.createElement('div');
        divider.className = 'wheel-divider';
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
    let currentRotation = 0;
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
        startAngle = getCursorAngle(e) - currentRotation;
        wheelEl.style.transition = 'none';
    }

    function onMove(e) {
        if (!isDragging) return;
        if (!e.touches) e.preventDefault();
        
        currentRotation = getCursorAngle(e) - startAngle;
        wheelEl.style.transform = `rotate(${currentRotation}deg)`;
        
        let norm = (-currentRotation) % 360;
        if (norm < 0) norm += 360;
        let currentSector = Math.round(norm / 60) % 6;
        
        if (currentSector !== lastSectorIndex) {
            playClick();
            lastSectorIndex = currentSector;
        }
        
        updateDashboard(key, currentRotation);
    }

    function onEnd() {
        if (!isDragging) return;
        isDragging = false;
        wheelEl.classList.remove('active-turning');
        
        wheelEl.style.transition = 'transform 0.4s cubic-bezier(0.15, 0.85, 0.3, 1.25)';
        currentRotation = Math.round(currentRotation / 60) * 60;
        wheelEl.style.transform = `rotate(${currentRotation}deg)`;
        
        playClick();
        updateDashboard(key, currentRotation);
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
    const activeData = dataset[key][index];
    const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
    
    document.getElementById(`resKk${capitalizedKey}`).innerText = activeData.kk;
    document.getElementById(`resRu${capitalizedKey}`).innerText = activeData.ru;
}

document.addEventListener("DOMContentLoaded", () => {
    const outerEl = document.getElementById('outerWheel');
    const middleEl = document.getElementById('middleWheel');
    const innerEl = document.getElementById('innerWheel');

    generateWheelCells(outerEl, dataset.outer, 'outer');
    generateWheelCells(middleEl, dataset.middle, 'middle');
    generateWheelCells(innerEl, dataset.inner, 'inner');

    setupRotationEngine(innerEl, 'inner');
    setupRotationEngine(middleEl, 'middle');
    setupRotationEngine(outerEl, 'outer');

    updateDashboard('inner', 0);
    updateDashboard('middle', 0);
    updateDashboard('outer', 0);
	
	// --- ФУНКЦИЯ КНОПКИ АВТО-ВРАЩЕНИЯ ---
    const spinBtn = document.getElementById('spinBtn');
    let isSpinning = false;

    // Объект для хранения текущих углов, чтобы кнопка знала, от чего крутить дальше
    const currentRotations = { inner: 0, middle: 0, outer: 0 };

    // Перехватываем ручной ввод, чтобы синхронизировать углы при ручном вращении
    const originalUpdateDashboard = updateDashboard;
    updateDashboard = function(key, rotation) {
        currentRotations[key] = rotation;
        originalUpdateDashboard(key, rotation);
    };

    spinBtn.addEventListener('click', () => {
        if (isSpinning) return; // Защита от спам-кликов во время вращения
        isSpinning = true;
        spinBtn.style.pointerEvents = 'none';

        // Для каждого кольца задаем случайное количество шагов (от 12 до 24 секторов),
        // чтобы они крутились с разной скоростью и останавливались вразнобой
        const wheels = [
            { el: innerEl, key: 'inner', steps: 12 + Math.floor(Math.random() * 6) },
            { el: middleEl, key: 'middle', steps: 18 + Math.floor(Math.random() * 6) },
            { el: outerEl, key: 'outer', steps: 24 + Math.floor(Math.random() * 6) }
        ];

        wheels.forEach((w) => {
            w.el.style.transition = 'transform 2.5s cubic-bezier(0.1, 0.8, 0.2, 1)';
            
            // Считаем новый целевой угол
            const targetRotation = currentRotations[w.key] - (w.steps * 60);
            w.el.style.transform = `rotate(${targetRotation}deg)`;
            
            // Воспроизводим звук щелчка в процессе вращения с задержкой
            let currentStep = 0;
            const interval = setInterval(() => {
                if (currentStep >= w.steps) {
                    clearInterval(interval);
                } else {
                    playClick();
                    currentStep++;
                }
            }, 2500 / w.steps);

            // Фиксируем финальный угол в системе
            currentRotations[w.key] = targetRotation;
        });

        // Включаем интерфейс обратно и обновляем панели результатов после остановки
        setTimeout(() => {
            isSpinning = false;
            spinBtn.style.pointerEvents = 'auto';
            
            wheels.forEach((w) => {
                updateDashboard(w.key, currentRotations[w.key]);
            });
            playClick(); // Финальный щелчок фиксации
        }, 2600);
    });
});