// WheelRenderer - полная копия твоего engine.js

class WheelRenderer {
    constructor(containerId, themeData) {
        this.container = document.getElementById(containerId);
        this.themeData = themeData;
        this.currentRotations = { inner: 0, middle: 0, outer: 0 };
        this.init();
    }

    init() {
        if (!this.container) return;
        this.container.innerHTML = '';
        
        // Создаём структуру как в твоём index.html
        const deviceBody = document.createElement('div');
        deviceBody.className = 'device-body';
        deviceBody.style.position = 'relative';
        deviceBody.style.width = '646px';
        deviceBody.style.height = '646px';
        deviceBody.style.margin = '0 auto';
        deviceBody.style.background = '#e6e9ef';
        deviceBody.style.borderRadius = '50%';
        deviceBody.style.display = 'flex';
        deviceBody.style.alignItems = 'center';
        deviceBody.style.justifyContent = 'center';
        deviceBody.style.boxShadow = '15px 15px 30px #d1d5db, -15px -15px 30px #ffffff';
        
        const pointer = document.createElement('div');
        pointer.className = 'pointer-needle';
        pointer.style.position = 'absolute';
        pointer.style.top = '-8px';
        pointer.style.left = '50%';
        pointer.style.transform = 'translateX(-50%)';
        pointer.style.width = '0';
        pointer.style.height = '0';
        pointer.style.borderLeft = '10px solid transparent';
        pointer.style.borderRight = '10px solid transparent';
        pointer.style.borderTop = '18px solid #00b4d8';
        pointer.style.zIndex = '11';
        
        const outerWheel = document.createElement('div');
        outerWheel.className = 'wheel outer-wheel';
        outerWheel.id = 'rendererOuter';
        
        const middleWheel = document.createElement('div');
        middleWheel.className = 'wheel middle-wheel';
        middleWheel.id = 'rendererMiddle';
        
        const innerWheel = document.createElement('div');
        innerWheel.className = 'wheel inner-wheel';
        innerWheel.id = 'rendererInner';
        
        const centerBtn = document.createElement('div');
        centerBtn.className = 'center-cap';
        centerBtn.id = 'rendererSpinBtn';
        centerBtn.innerText = 'СБРОС';
        
        deviceBody.appendChild(outerWheel);
        deviceBody.appendChild(middleWheel);
        deviceBody.appendChild(innerWheel);
        deviceBody.appendChild(pointer);
        deviceBody.appendChild(centerBtn);
        
        this.container.appendChild(deviceBody);
        
        // Генерируем ячейки
        this.generateWheelCells(outerWheel, this.themeData.outer, 'outer');
        this.generateWheelCells(middleWheel, this.themeData.middle, 'middle');
        this.generateWheelCells(innerWheel, this.themeData.inner, 'inner');
        
        // Настройка вращения
        this.setupRotationEngine(innerWheel, 'inner');
        this.setupRotationEngine(middleWheel, 'middle');
        this.setupRotationEngine(outerWheel, 'outer');
        
        // Кнопка сброса
        centerBtn.addEventListener('click', () => {
            this.currentRotations = { inner: 0, middle: 0, outer: 0 };
            innerWheel.style.transform = 'rotate(0deg)';
            middleWheel.style.transform = 'rotate(0deg)';
            outerWheel.style.transform = 'rotate(0deg)';
            this.updateDashboard();
        });
        
        this.updateDashboard();
    }

    generateWheelCells(wheelEl, items, type) {
        const count = items.length;
        const angleStep = 360 / count;
        
        let dMax = 0, rIn = 0, rOut = 0, textRadius = 0;
        let colorPrefix = '';
        
        if (type === 'outer') {
            dMax = 640; rIn = 265; rOut = 320; textRadius = 295;
            colorPrefix = 'var(--color-out-';
        } else if (type === 'middle') {
            dMax = 530; rIn = 195; rOut = 265; textRadius = 232;
            colorPrefix = 'var(--color-mid-';
        } else if (type === 'inner') {
            dMax = 390; rIn = 0; rOut = 195; textRadius = 160;
            colorPrefix = 'var(--color-inn-';
        }
        
        const cx = dMax / 2;
        const cy = dMax / 2;
        
        const colors = {
            outer: ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff'],
            middle: ['#f4f5f7', '#eaecf0', '#e1e4ea', '#d8dce4', '#cfd4dc', '#c6cbd6'],
            inner: ['#ffffff', '#f8f9fa', '#f1f3f5', '#e9ecef', '#dee2e6', '#ced4da']
        };
        
        wheelEl.innerHTML = '';
        
        for (let i = 0; i < count; i++) {
            const obj = items[i];
            const currentAngle = i * angleStep;
            
            const cell = document.createElement('div');
            cell.className = 'segment-cell';
            cell.style.position = 'absolute';
            cell.style.width = '100%';
            cell.style.height = '100%';
            cell.style.top = '0';
            cell.style.left = '0';
            cell.style.transform = `rotate(${currentAngle}deg)`;
            cell.style.transformOrigin = `${cx}px ${cy}px`;
            cell.style.overflow = 'visible';
            
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
            const sectorPathData = this.svgSectorPath(cx, cy, rIn, rOut, startAngle, endAngle);
            const sectorColor = colors[type][i % 6];
            
            const getArcPath = (radius) => {
                const startRad = (-116 * Math.PI) / 180;
                const endRad = (-64 * Math.PI) / 180;
                const x1 = cx + radius * Math.cos(startRad);
                const y1 = cy + radius * Math.sin(startRad);
                const x2 = cx + radius * Math.cos(endRad);
                const y2 = cy + radius * Math.sin(endRad);
                return `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;
            };
            
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
            
            const limit = type === 'inner' ? 12 : 50;
            const [kkLine1, kkLine2] = splitText(obj.kk, limit);
            const [ruLine1, ruLine2] = splitText(obj.ru, limit);
            
            const step = 14;
            let svgContent = `<path d="${sectorPathData}" fill="${sectorColor}" stroke="white" stroke-width="2"/>`;
            let currentR = textRadius;
            
            if (kkLine2) {
                const pId = `p_kk_${type}_${i}`;
                svgContent += `<defs><path id="${pId}" d="${getArcPath(currentR)}" fill="none"/></defs>`;
                svgContent += `<text class="svg-text-kk" font-size="14px" font-weight="800" fill="#1a1d24"><textPath href="#${pId}" startOffset="50%" text-anchor="middle">${kkLine1}</textPath></text>`;
                currentR -= step;
                const pId2 = `p_kk2_${type}_${i}`;
                svgContent += `<defs><path id="${pId2}" d="${getArcPath(currentR)}" fill="none"/></defs>`;
                svgContent += `<text class="svg-text-kk" font-size="14px" font-weight="800" fill="#1a1d24"><textPath href="#${pId2}" startOffset="50%" text-anchor="middle">${kkLine2}</textPath></text>`;
                currentR -= step + 4;
            } else {
                const pId = `p_kk_${type}_${i}`;
                svgContent += `<defs><path id="${pId}" d="${getArcPath(currentR)}" fill="none"/></defs>`;
                svgContent += `<text class="svg-text-kk" font-size="14px" font-weight="800" fill="#1a1d24"><textPath href="#${pId}" startOffset="50%" text-anchor="middle">${kkLine1}</textPath></text>`;
                currentR -= step + 4;
            }
            
            if (ruLine2) {
                const pId = `p_ru_${type}_${i}`;
                svgContent += `<defs><path id="${pId}" d="${getArcPath(currentR)}" fill="none"/></defs>`;
                svgContent += `<text class="svg-text-ru" font-size="11px" font-weight="600" fill="#4a5568"><textPath href="#${pId}" startOffset="50%" text-anchor="middle">${ruLine1}</textPath></text>`;
                currentR -= step;
                const pId2 = `p_ru2_${type}_${i}`;
                svgContent += `<defs><path id="${pId2}" d="${getArcPath(currentR)}" fill="none"/></defs>`;
                svgContent += `<text class="svg-text-ru" font-size="11px" font-weight="600" fill="#4a5568"><textPath href="#${pId2}" startOffset="50%" text-anchor="middle">${ruLine2}</textPath></text>`;
            } else {
                const pId = `p_ru_${type}_${i}`;
                svgContent += `<defs><path id="${pId}" d="${getArcPath(currentR)}" fill="none"/></defs>`;
                svgContent += `<text class="svg-text-ru" font-size="11px" font-weight="600" fill="#4a5568"><textPath href="#${pId}" startOffset="50%" text-anchor="middle">${ruLine1}</textPath></text>`;
            }
            
            svg.innerHTML = svgContent;
            cell.appendChild(svg);
            wheelEl.appendChild(cell);
        }
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

    setupRotationEngine(wheelEl, key) {
        let isDragging = false;
        let startAngle = 0;
        let lastSectorIndex = 0;
        
        // Звук
        let clickAudio = null;
        try {
            clickAudio = new Audio('short-click.mp3');
            clickAudio.volume = 0.35;
        } catch(e) {}
        
        const playClick = () => {
            if (clickAudio) {
                clickAudio.currentTime = 0;
                clickAudio.play().catch(() => {});
            }
        };
        
        const getCursorAngle = (e) => {
            const rect = wheelEl.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
        };
        
        const onStart = (e) => {
            isDragging = true;
            startAngle = getCursorAngle(e) - this.currentRotations[key];
            wheelEl.style.transition = 'none';
            wheelEl.classList.add('active-turning');
            e.preventDefault();
        };
        
        const onMove = (e) => {
            if (!isDragging) return;
            this.currentRotations[key] = getCursorAngle(e) - startAngle;
            wheelEl.style.transform = `rotate(${this.currentRotations[key]}deg)`;
            
            let norm = (-this.currentRotations[key]) % 360;
            if (norm < 0) norm += 360;
            let currentSector = Math.round(norm / 60) % 6;
            
            if (currentSector !== lastSectorIndex) {
                playClick();
                lastSectorIndex = currentSector;
            }
            
            this.updateDashboard();
            e.preventDefault();
        };
        
        const onEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            wheelEl.classList.remove('active-turning');
            wheelEl.style.transition = 'transform 0.4s cubic-bezier(0.15, 0.85, 0.3, 1.25)';
            this.currentRotations[key] = Math.round(this.currentRotations[key] / 60) * 60;
            wheelEl.style.transform = `rotate(${this.currentRotations[key]}deg)`;
            playClick();
            this.updateDashboard();
        };
        
        wheelEl.addEventListener('mousedown', onStart);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onEnd);
        wheelEl.addEventListener('touchstart', onStart, { passive: true });
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', onEnd);
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
        this.currentRotations = { inner: 0, middle: 0, outer: 0 };
        this.init();
    }
}
