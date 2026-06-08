// Универсальный рендерер колёс Луллия (работает с любой темой из библиотеки)

class WheelRenderer {
    constructor(containerId, themeData) {
        this.container = document.getElementById(containerId);
        this.themeData = themeData;
        this.currentRotations = { outer: 0, middle: 0, inner: 0 };
        this.init();
    }

    init() {
        if (!this.container) return;
        this.container.innerHTML = '';
        this.createWheels();
        this.setupDragAndDrop();
        this.updateDashboard();
    }

    createWheels() {
        // Создаём три колеса
        const outerDiv = document.createElement('div');
        outerDiv.className = 'mini-wheel outer-wheel';
        outerDiv.id = 'miniOuterWheel';
        
        const middleDiv = document.createElement('div');
        middleDiv.className = 'mini-wheel middle-wheel';
        middleDiv.id = 'miniMiddleWheel';
        
        const innerDiv = document.createElement('div');
        innerDiv.className = 'mini-wheel inner-wheel';
        innerDiv.id = 'miniInnerWheel';
        
        this.container.appendChild(outerDiv);
        this.container.appendChild(middleDiv);
        this.container.appendChild(innerDiv);
        
        // Генерируем сектора для каждого колеса
        this.generateWheelCells(outerDiv, this.themeData.outer, 'outer', 'mini');
        this.generateWheelCells(middleDiv, this.themeData.middle, 'middle', 'mini');
        this.generateWheelCells(innerDiv, this.themeData.inner, 'inner', 'mini');
    }

    generateWheelCells(wheelEl, items, type, size = 'mini') {
        const count = items.length;
        const angleStep = 360 / count;
        
        let dMax = 0, rIn = 0, rOut = 0, textRadius = 0;
        let colorPrefix = '';
        
        if (type === 'outer') {
            dMax = 280; rIn = 110; rOut = 140; textRadius = 128;
            colorPrefix = 'var(--color-out-';
        } else if (type === 'middle') {
            dMax = 230; rIn = 80; rOut = 115; textRadius = 100;
            colorPrefix = 'var(--color-mid-';
        } else if (type === 'inner') {
            dMax = 170; rIn = 0; rOut = 85; textRadius = 65;
            colorPrefix = 'var(--color-inn-';
        }
        
        const cx = dMax / 2;
        const cy = dMax / 2;
        
        wheelEl.style.width = `${dMax}px`;
        wheelEl.style.height = `${dMax}px`;
        
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
            const sectorPathData = this.svgSectorPath(cx, cy, rIn, rOut, startAngle, endAngle);
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
            
            // Упрощённый текст для мини-колёс
            const splitText = (text, limit) => {
                if (text.length <= limit || !text.includes(' ')) return [text, ''];
                const words = text.split(' ');
                let line1 = '', line2 = '';
                for (let w = 0; w < words.length; w++) {
                    if ((line1 + words[w]).length <= limit) {
                        line1 += (line1 === '' ? '' : ' ') + words[w];
                    } else {
                        line2 = words.slice(w).join(' ');
                        break;
                    }
                }
                return line1 === '' ? [text.slice(0, limit), text.slice(limit)] : [line1, line2];
            };
            
            const limit = (type === 'inner' && size === 'mini') ? 8 : 14;
            const [kkLine1, kkLine2] = splitText(obj.kk, limit);
            const [ruLine1, ruLine2] = splitText(obj.ru, limit);
            
            const step = 10;
            let svgContent = `<path d="${sectorPathData}" fill="${sectorColor}"/>`;
            let currentR = textRadius;
            
            const pIdKk1 = `p_kk1_${type}_${i}`;
            if (kkLine2) {
                svgContent += `
                    <defs><path id="${pIdKk1}" d="${getArcPath(currentR)}" fill="none"/></defs>
                    <text class="svg-text-kk-mini"><textPath href="#${pIdKk1}" startOffset="50%" text-anchor="middle">${kkLine1}</textPath></text>
                `;
                currentR -= step;
                const pIdKk2 = `p_kk2_${type}_${i}`;
                svgContent += `
                    <defs><path id="${pIdKk2}" d="${getArcPath(currentR)}" fill="none"/></defs>
                    <text class="svg-text-kk-mini"><textPath href="#${pIdKk2}" startOffset="50%" text-anchor="middle">${kkLine2}</textPath></text>
                `;
                currentR -= step + 2;
            } else {
                svgContent += `
                    <defs><path id="${pIdKk1}" d="${getArcPath(currentR)}" fill="none"/></defs>
                    <text class="svg-text-kk-mini"><textPath href="#${pIdKk1}" startOffset="50%" text-anchor="middle">${kkLine1}</textPath></text>
                `;
                currentR -= step + 4;
            }
            
            const pIdRu1 = `p_ru1_${type}_${i}`;
            if (ruLine2) {
                svgContent += `
                    <defs><path id="${pIdRu1}" d="${getArcPath(currentR)}" fill="none"/></defs>
                    <text class="svg-text-ru-mini"><textPath href="#${pIdRu1}" startOffset="50%" text-anchor="middle">${ruLine1}</textPath></text>
                `;
                currentR -= step;
                const pIdRu2 = `p_ru2_${type}_${i}`;
                svgContent += `
                    <defs><path id="${pIdRu2}" d="${getArcPath(currentR)}" fill="none"/></defs>
                    <text class="svg-text-ru-mini"><textPath href="#${pIdRu2}" startOffset="50%" text-anchor="middle">${ruLine2}</textPath></text>
                `;
            } else {
                svgContent += `
                    <defs><path id="${pIdRu1}" d="${getArcPath(currentR)}" fill="none"/></defs>
                    <text class="svg-text-ru-mini"><textPath href="#${pIdRu1}" startOffset="50%" text-anchor="middle">${ruLine1}</textPath></text>
                `;
            }
            
            svg.innerHTML = svgContent;
            cell.appendChild(svg);
        });
    }

    svgSectorPath(cx, cy, rIn, rOut, startAngle, endAngle) {
        const toRad = Math.PI / 180;
        const x1_out = cx + rOut * Math.cos(startAngle * toRad);
        const y1_out = cy + rOut * Math.sin(startAngle * toRad);
        const x2_out = cx + rOut * Math.cos(endAngle * toRad);
        const y2_out = cy + rOut * Math.sin(endAngle * toRad);
        const x1_in = cx + rIn * Math.cos(endAngle * toRad);
        const y1_in = cy + rIn * Math.sin(endAngle * toRad);
        const x2_in = cx + rIn * Math.cos(startAngle * toRad);
        const y2_in = cy + rIn * Math.sin(startAngle * toRad);
        return `M ${x1_out} ${y1_out} A ${rOut} ${rOut} 0 0 1 ${x2_out} ${y2_out} L ${x1_in} ${y1_in} A ${rIn} ${rIn} 0 0 0 ${x2_in} ${y2_in} Z`;
    }

    setupDragAndDrop() {
        const wheels = [
            { el: document.getElementById('miniOuterWheel'), key: 'outer' },
            { el: document.getElementById('miniMiddleWheel'), key: 'middle' },
            { el: document.getElementById('miniInnerWheel'), key: 'inner' }
        ];
        
        wheels.forEach(w => {
            if (!w.el) return;
            let isDragging = false;
            let startAngle = 0;
            
            const getCursorAngle = (e) => {
                const rect = w.el.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
            };
            
            const onStart = (e) => {
                isDragging = true;
                startAngle = getCursorAngle(e) - this.currentRotations[w.key];
                w.el.style.transition = 'none';
                e.preventDefault();
            };
            
            const onMove = (e) => {
                if (!isDragging) return;
                this.currentRotations[w.key] = getCursorAngle(e) - startAngle;
                w.el.style.transform = `rotate(${this.currentRotations[w.key]}deg)`;
                this.updateDashboard();
                e.preventDefault();
            };
            
            const onEnd = () => {
                if (!isDragging) return;
                isDragging = false;
                w.el.style.transition = 'transform 0.3s ease';
                this.currentRotations[w.key] = Math.round(this.currentRotations[w.key] / 60) * 60;
                w.el.style.transform = `rotate(${this.currentRotations[w.key]}deg)`;
                this.updateDashboard();
            };
            
            w.el.addEventListener('mousedown', onStart);
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onEnd);
            w.el.addEventListener('touchstart', onStart, { passive: true });
            window.addEventListener('touchmove', onMove, { passive: false });
            window.addEventListener('touchend', onEnd);
        });
    }

    updateDashboard() {
        const getIndex = (rotation) => {
            let norm = (-rotation) % 360;
            if (norm < 0) norm += 360;
            return Math.round(norm / 60) % 6;
        };
        
        const outerIndex = getIndex(this.currentRotations.outer);
        const middleIndex = getIndex(this.currentRotations.middle);
        const innerIndex = getIndex(this.currentRotations.inner);
        
        const outerData = this.themeData.outer[outerIndex];
        const middleData = this.themeData.middle[middleIndex];
        const innerData = this.themeData.inner[innerIndex];
        
        // Обновляем дисплей в правой панели
        const displayDiv = document.getElementById('wheelsDisplay');
        if (displayDiv) {
            displayDiv.innerHTML = `
                <div class="mini-dash-item">
                    <div class="mini-dash-label">❓ ВОПРОС</div>
                    <div class="mini-dash-kk">${outerData?.kk || '-'}</div>
                    <div class="mini-dash-ru">${outerData?.ru || '-'}</div>
                </div>
                <div class="mini-dash-item">
                    <div class="mini-dash-label">💬 ОТВЕТ</div>
                    <div class="mini-dash-kk">${middleData?.kk || '-'}</div>
                    <div class="mini-dash-ru">${middleData?.ru || '-'}</div>
                </div>
                <div class="mini-dash-item">
                    <div class="mini-dash-label">😊 РЕАКЦИЯ</div>
                    <div class="mini-dash-kk">${innerData?.kk || '-'}</div>
                    <div class="mini-dash-ru">${innerData?.ru || '-'}</div>
                </div>
            `;
        }
    }

    updateTheme(newThemeData) {
        this.themeData = newThemeData;
        this.currentRotations = { outer: 0, middle: 0, inner: 0 };
        this.init();
    }
}
