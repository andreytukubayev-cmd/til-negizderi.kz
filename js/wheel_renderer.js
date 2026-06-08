// Рендерер, использующий ОРИГИНАЛЬНЫЙ код из engine.js

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
        
        // Создаём структуру как в оригинале
        const deviceBody = document.createElement('div');
        deviceBody.className = 'mini-device-body';
        deviceBody.style.position = 'relative';
        deviceBody.style.width = '300px';
        deviceBody.style.height = '300px';
        deviceBody.style.margin = '0 auto';
        deviceBody.style.display = 'flex';
        deviceBody.style.alignItems = 'center';
        deviceBody.style.justifyContent = 'center';
        
        // Стрелка
        const pointer = document.createElement('div');
        pointer.className = 'mini-pointer-needle';
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
        
        // Колёса
        const outerWheel = this.createOriginalWheel(280, this.themeData.outer, 'outer');
        const middleWheel = this.createOriginalWheel(230, this.themeData.middle, 'middle');
        const innerWheel = this.createOriginalWheel(170, this.themeData.inner, 'inner');
        
        outerWheel.style.position = 'absolute';
        outerWheel.style.top = '0';
        outerWheel.style.left = '0';
        
        middleWheel.style.position = 'absolute';
        middleWheel.style.top = '50%';
        middleWheel.style.left = '50%';
        middleWheel.style.transform = 'translate(-50%, -50%)';
        
        innerWheel.style.position = 'absolute';
        innerWheel.style.top = '50%';
        innerWheel.style.left = '50%';
        innerWheel.style.transform = 'translate(-50%, -50%)';
        
        // Кнопка СБРОС
        const centerBtn = document.createElement('div');
        centerBtn.className = 'mini-center-cap';
        centerBtn.style.position = 'absolute';
        centerBtn.style.top = '50%';
        centerBtn.style.left = '50%';
        centerBtn.style.transform = 'translate(-50%, -50%)';
        centerBtn.style.width = '50px';
        centerBtn.style.height = '50px';
        centerBtn.style.borderRadius = '50%';
        centerBtn.style.background = 'conic-gradient(from 0deg, #999, #eee, #999, #eee, #999)';
        centerBtn.style.boxShadow = '0px 4px 10px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.6)';
        centerBtn.style.border = '2px solid #ffffff';
        centerBtn.style.zIndex = '10';
        centerBtn.style.cursor = 'pointer';
        centerBtn.style.display = 'flex';
        centerBtn.style.alignItems = 'center';
        centerBtn.style.justifyContent = 'center';
        centerBtn.style.fontSize = '8px';
        centerBtn.style.fontWeight = '900';
        centerBtn.style.color = '#2b2d42';
        centerBtn.style.textTransform = 'uppercase';
        centerBtn.innerText = 'СБРОС';
        
        centerBtn.addEventListener('click', () => {
            this.currentRotations = { outer: 0, middle: 0, inner: 0 };
            outerWheel.style.transform = 'rotate(0deg)';
            middleWheel.style.transform = 'translate(-50%, -50%) rotate(0deg)';
            innerWheel.style.transform = 'translate(-50%, -50%) rotate(0deg)';
            this.updateDashboard();
        });
        
        deviceBody.appendChild(outerWheel);
        deviceBody.appendChild(middleWheel);
        deviceBody.appendChild(innerWheel);
        deviceBody.appendChild(pointer);
        deviceBody.appendChild(centerBtn);
        
        this.container.appendChild(deviceBody);
        
        this.wheels = {
            outer: { el: outerWheel, rotation: 0 },
            middle: { el: middleWheel, rotation: 0 },
            inner: { el: innerWheel, rotation: 0 }
        };
        
        this.setupDrag();
        this.updateDashboard();
    }

    // Используем оригинальную функцию генерации из engine.js
    createOriginalWheel(size, items, type) {
        const wheel = document.createElement('div');
        wheel.style.width = `${size}px`;
        wheel.style.height = `${size}px`;
        wheel.style.borderRadius = '50%';
        wheel.style.cursor = 'grab';
        wheel.style.position = 'relative';
        wheel.style.background = '#e0e0e0';
        wheel.style.boxShadow = '0px 10px 20px rgba(0, 0, 0, 0.15)';
        wheel.style.border = '2px solid #ffffff';
        wheel.style.overflow = 'hidden';
        
        const count = items.length;
        const angleStep = 360 / count;
        
        let rIn = 0, rOut = 0, textRadius = 0;
        
        if (type === 'outer') {
            rIn = size * 0.38;
            rOut = size * 0.5;
            textRadius = size * 0.45;
        } else if (type === 'middle') {
            rIn = size * 0.32;
            rOut = size * 0.5;
            textRadius = size * 0.42;
        } else if (type === 'inner') {
            rIn = 0;
            rOut = size * 0.5;
            textRadius = size * 0.4;
        }
        
        const cx = size / 2;
        const cy = size / 2;
        
        const colors = {
            outer: ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff'],
            middle: ['#f4f5f7', '#eaecf0', '#e1e4ea', '#d8dce4', '#cfd4dc', '#c6cbd6'],
            inner: ['#ffffff', '#f8f9fa', '#f1f3f5', '#e9ecef', '#dee2e6', '#ced4da']
        };
        
        for (let i = 0; i < count; i++) {
            const obj = items[i];
            const currentAngle = i * angleStep;
            
            const cell = document.createElement('div');
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
            svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
            svg.style.width = '100%';
            svg.style.height = '100%';
            svg.style.position = 'absolute';
            svg.style.top = '0';
            svg.style.left = '0';
            
            const sectorPathData = this.svgSectorPath(cx, cy, rIn, rOut, -120, -60);
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
            
            // Умное разбиение текста
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
            
            const limit = type === 'inner' ? 8 : 12;
            const [kkLine1, kkLine2] = splitText(obj.kk, limit);
            const [ruLine1, ruLine2] = splitText(obj.ru, limit);
            
            const step = 10;
            let svgContent = `<path d="${sectorPathData}" fill="${sectorColor}" stroke="white" stroke-width="1.5"/>`;
            let currentR = textRadius;
            
            // Казахский текст
            if (kkLine2) {
                const pId = `p_kk_${type}_${i}`;
                svgContent += `<defs><path id="${pId}" d="${getArcPath(currentR)}" fill="none"/></defs>`;
                svgContent += `<text class="svg-text-kk-mini" font-size="7px" font-weight="800" fill="#1a1d24"><textPath href="#${pId}" startOffset="50%" text-anchor="middle">${kkLine1}</textPath></text>`;
                currentR -= step;
                const pId2 = `p_kk2_${type}_${i}`;
                svgContent += `<defs><path id="${pId2}" d="${getArcPath(currentR)}" fill="none"/></defs>`;
                svgContent += `<text class="svg-text-kk-mini" font-size="7px" font-weight="800" fill="#1a1d24"><textPath href="#${pId2}" startOffset="50%" text-anchor="middle">${kkLine2}</textPath></text>`;
                currentR -= step + 2;
            } else {
                const pId = `p_kk_${type}_${i}`;
                svgContent += `<defs><path id="${pId}" d="${getArcPath(currentR)}" fill="none"/></defs>`;
                svgContent += `<text class="svg-text-kk-mini" font-size="8px" font-weight="800" fill="#1a1d24"><textPath href="#${pId}" startOffset="50%" text-anchor="middle">${kkLine1}</textPath></text>`;
                currentR -= step + 4;
            }
            
            // Русский текст
            if (ruLine2) {
                const pId = `p_ru_${type}_${i}`;
                svgContent += `<defs><path id="${pId}" d="${getArcPath(currentR)}" fill="none"/></defs>`;
                svgContent += `<text class="svg-text-ru-mini" font-size="6px" font-weight="600" fill="#4a5568"><textPath href="#${pId}" startOffset="50%" text-anchor="middle">${ruLine1}</textPath></text>`;
                currentR -= step;
                const pId2 = `p_ru2_${type}_${i}`;
                svgContent += `<defs><path id="${pId2}" d="${getArcPath(currentR)}" fill="none"/></defs>`;
                svgContent += `<text class="svg-text-ru-mini" font-size="6px" font-weight="600" fill="#4a5568"><textPath href="#${pId2}" startOffset="50%" text-anchor="middle">${ruLine2}</textPath></text>`;
            } else {
                const pId = `p_ru_${type}_${i}`;
                svgContent += `<defs><path id="${pId}" d="${getArcPath(currentR)}" fill="none"/></defs>`;
                svgContent += `<text class="svg-text-ru-mini" font-size="7px" font-weight="600" fill="#4a5568"><textPath href="#${pId}" startOffset="50%" text-anchor="middle">${ruLine1}</textPath></text>`;
            }
            
            svg.innerHTML = svgContent;
            cell.appendChild(svg);
            wheel.appendChild(cell);
        }
        
        return wheel;
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

    setupDrag() {
        const wheels = ['outer', 'middle', 'inner'];
        
        // Создаём аудио объект
        let clickAudio = null;
        try {
            clickAudio = new Audio('short-click.mp3');
            clickAudio.volume = 0.35;
        } catch(e) {
            console.warn('Audio not supported');
        }
        
        function playClick() {
            if (clickAudio) {
                clickAudio.currentTime = 0;
                clickAudio.play().catch(() => {});
            }
        }
        
        wheels.forEach(key => {
            const w = this.wheels[key];
            if (!w || !w.el) return;
            
            let isDragging = false;
            let startAngle = 0;
            let lastSectorIndex = -1;
            
            const getAngle = (e) => {
                const rect = w.el.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
            };
            
            const getCurrentSector = (rotation) => {
                let norm = (-rotation) % 360;
                if (norm < 0) norm += 360;
                return Math.round(norm / 60) % 6;
            };
            
            const onStart = (e) => {
                isDragging = true;
                startAngle = getAngle(e) - w.rotation;
                w.el.style.transition = 'none';
                w.el.style.cursor = 'grabbing';
                e.preventDefault();
                
                lastSectorIndex = getCurrentSector(w.rotation);
            };
            
            const onMove = (e) => {
                if (!isDragging) return;
                w.rotation = getAngle(e) - startAngle;
                
                // Для ВСЕХ колёс - только rotate (translate уже задан в CSS)
                w.el.style.transform = `rotate(${w.rotation}deg)`;
                
                const currentSector = getCurrentSector(w.rotation);
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
                w.el.style.cursor = 'grab';
                w.el.style.transition = 'transform 0.3s ease';
                w.rotation = Math.round(w.rotation / 60) * 60;
                
                w.el.style.transform = `rotate(${w.rotation}deg)`;
                
                playClick();
                this.updateDashboard();
            };
            
            w.el.addEventListener('mousedown', onStart);
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onEnd);
            w.el.addEventListener('touchstart', onStart, { passive: false });
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
        
        const outerIndex = getIndex(this.wheels.outer?.rotation || 0);
        const middleIndex = getIndex(this.wheels.middle?.rotation || 0);
        const innerIndex = getIndex(this.wheels.inner?.rotation || 0);
        
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
        this.currentRotations = { outer: 0, middle: 0, inner: 0 };
        this.init();
    }
}
