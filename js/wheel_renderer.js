// ИСПРАВЛЕННАЯ ВЕРСИЯ - все 6 секторов с текстом, колёса по центру

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
        
        this.container.style.position = 'relative';
        this.container.style.display = 'flex';
        this.container.style.justifyContent = 'center';
        this.container.style.alignItems = 'center';
        this.container.style.minHeight = '320px';
        
        // Центральный контейнер для всех колёс
        const wheelsContainer = document.createElement('div');
        wheelsContainer.style.position = 'relative';
        wheelsContainer.style.width = '280px';
        wheelsContainer.style.height = '280px';
        wheelsContainer.style.margin = '0 auto';
        
        // Указатель-стрелка
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
        
        // Создаём колёса (каждое абсолютно позиционировано внутри контейнера)
        const outerWheel = this.createFullWheel(280, this.themeData.outer, 'outer');
        const middleWheel = this.createFullWheel(230, this.themeData.middle, 'middle');
        const innerWheel = this.createFullWheel(170, this.themeData.inner, 'inner');
        
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
        
        // Центральная кнопка
        const centerBtn = document.createElement('div');
        centerBtn.style.position = 'absolute';
        centerBtn.style.top = '50%';
        centerBtn.style.left = '50%';
        centerBtn.style.transform = 'translate(-50%, -50%)';
        centerBtn.style.width = '50px';
        centerBtn.style.height = '50px';
        centerBtn.style.borderRadius = '50%';
        centerBtn.style.background = 'conic-gradient(from 0deg, #999, #eee, #999, #eee, #999)';
        centerBtn.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.6)';
        centerBtn.style.border = '2px solid white';
        centerBtn.style.zIndex = '20';
        centerBtn.style.cursor = 'pointer';
        centerBtn.style.display = 'flex';
        centerBtn.style.alignItems = 'center';
        centerBtn.style.justifyContent = 'center';
        centerBtn.style.fontSize = '8px';
        centerBtn.style.fontWeight = 'bold';
        centerBtn.style.color = '#2b2d42';
        centerBtn.style.textAlign = 'center';
        centerBtn.innerText = 'СБРОС';
        
        // Кнопка сброса (возвращает колёса в исходное положение)
        centerBtn.addEventListener('click', () => {
            this.currentRotations = { outer: 0, middle: 0, inner: 0 };
            outerWheel.style.transform = 'rotate(0deg)';
            middleWheel.style.transform = 'translate(-50%, -50%) rotate(0deg)';
            innerWheel.style.transform = 'translate(-50%, -50%) rotate(0deg)';
            this.updateDashboard();
        });
        
        wheelsContainer.appendChild(outerWheel);
        wheelsContainer.appendChild(middleWheel);
        wheelsContainer.appendChild(innerWheel);
        wheelsContainer.appendChild(pointer);
        wheelsContainer.appendChild(centerBtn);
        
        this.container.appendChild(wheelsContainer);
        
        this.wheels = {
            outer: { el: outerWheel, rotation: 0 },
            middle: { el: middleWheel, rotation: 0 },
            inner: { el: innerWheel, rotation: 0 }
        };
        
        this.setupDrag();
        this.updateDashboard();
    }

    createFullWheel(size, items, type) {
        const wheel = document.createElement('div');
        wheel.style.width = `${size}px`;
        wheel.style.height = `${size}px`;
        wheel.style.borderRadius = '50%';
        wheel.style.cursor = 'grab';
        wheel.style.position = 'relative';
        wheel.style.background = '#e8e8e8';
        wheel.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
        wheel.style.border = '2px solid white';
        wheel.style.overflow = 'hidden';
        
        const count = items.length;
        const angleStep = 360 / count;
        const centerX = size / 2;
        const centerY = size / 2;
        
        // Радиусы для секторов
        let rOuter = size / 2;
        let rInner = 0;
        
        if (type === 'outer') {
            rOuter = size / 2;
            rInner = size * 0.4;
        } else if (type === 'middle') {
            rOuter = size / 2;
            rInner = size * 0.35;
        } else if (type === 'inner') {
            rOuter = size / 2;
            rInner = size * 0.25;
        }
        
        const colors = {
            outer: ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff'],
            middle: ['#f4f5f7', '#eaecf0', '#e1e4ea', '#d8dce4', '#cfd4dc', '#c6cbd6'],
            inner: ['#ffffff', '#f8f9fa', '#f1f3f5', '#e9ecef', '#dee2e6', '#ced4da']
        };
        
        for (let i = 0; i < count; i++) {
            // Создаём сектор
            const sector = document.createElement('div');
            sector.style.position = 'absolute';
            sector.style.width = '100%';
            sector.style.height = '100%';
            sector.style.transform = `rotate(${i * angleStep}deg)`;
            sector.style.transformOrigin = `${centerX}px ${centerY}px`;
            
            // Рисуем сектор через SVG
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("width", size);
            svg.setAttribute("height", size);
            svg.style.position = 'absolute';
            svg.style.top = '0';
            svg.style.left = '0';
            
            // Углы сектора (каждый сектор занимает 60 градусов)
            const startAngle = -60;
            const endAngle = 0;
            const startRad = startAngle * Math.PI / 180;
            const endRad = endAngle * Math.PI / 180;
            
            const x1 = centerX + rOuter * Math.cos(startRad);
            const y1 = centerY + rOuter * Math.sin(startRad);
            const x2 = centerX + rOuter * Math.cos(endRad);
            const y2 = centerY + rOuter * Math.sin(endRad);
            
            let pathData;
            if (rInner > 0) {
                const x3 = centerX + rInner * Math.cos(endRad);
                const y3 = centerY + rInner * Math.sin(endRad);
                const x4 = centerX + rInner * Math.cos(startRad);
                const y4 = centerY + rInner * Math.sin(startRad);
                pathData = `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 0 0 ${x4} ${y4} Z`;
            } else {
                pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${rOuter} ${rOuter} 0 0 1 ${x2} ${y2} Z`;
            }
            
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", pathData);
            path.setAttribute("fill", colors[type][i % 6]);
            path.setAttribute("stroke", "white");
            path.setAttribute("stroke-width", "1.5");
            svg.appendChild(path);
            sector.appendChild(svg);
            
            // Текст - размещаем в середине каждого сектора
            const textDiv = document.createElement('div');
            textDiv.style.position = 'absolute';
            textDiv.style.left = '50%';
            textDiv.style.top = '50%';
            textDiv.style.textAlign = 'center';
            textDiv.style.pointerEvents = 'none';
            textDiv.style.zIndex = '5';
            
            // Позиция текста: на радиусе = (rOuter + rInner) / 2, в середине сектора
            const textRadius = rInner > 0 ? (rOuter + rInner) / 2 : rOuter * 0.7;
            const midAngle = (i * angleStep - 30) * Math.PI / 180;
            const textX = centerX + textRadius * Math.cos(midAngle);
            const textY = centerY + textRadius * Math.sin(midAngle);
            
            textDiv.style.left = `${textX}px`;
            textDiv.style.top = `${textY}px`;
            textDiv.style.transform = 'translate(-50%, -50%)';
            
            const fontSize = type === 'inner' ? '7px' : '8px';
            const smallFont = type === 'inner' ? '5px' : '6px';
            
            let kkText = items[i].kk;
            let ruText = items[i].ru;
            
            if (kkText.length > 14) kkText = kkText.substring(0, 12) + '..';
            if (ruText.length > 18) ruText = ruText.substring(0, 16) + '..';
            
            textDiv.innerHTML = `<div style="font-size: ${fontSize}; font-weight: bold; color: #1a1d24; white-space: nowrap;">${kkText}</div>
                                 <div style="font-size: ${smallFont}; color: #4a5568; white-space: nowrap;">${ruText}</div>`;
            
            sector.appendChild(textDiv);
            wheel.appendChild(sector);
        }
        
        return wheel;
    }

    setupDrag() {
        const wheels = ['outer', 'middle', 'inner'];
        
        wheels.forEach(key => {
            const w = this.wheels[key];
            if (!w || !w.el) return;
            
            let isDragging = false;
            let startAngle = 0;
            
            const getAngle = (e) => {
                const rect = w.el.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
            };
            
            const onStart = (e) => {
                isDragging = true;
                startAngle = getAngle(e) - w.rotation;
                w.el.style.transition = 'none';
                e.preventDefault();
            };
            
            const onMove = (e) => {
                if (!isDragging) return;
                w.rotation = getAngle(e) - startAngle;
                if (key === 'outer') {
                    w.el.style.transform = `rotate(${w.rotation}deg)`;
                } else {
                    w.el.style.transform = `translate(-50%, -50%) rotate(${w.rotation}deg)`;
                }
                this.updateDashboard();
                e.preventDefault();
            };
            
            const onEnd = () => {
                if (!isDragging) return;
                isDragging = false;
                w.el.style.transition = 'transform 0.3s ease';
                w.rotation = Math.round(w.rotation / 60) * 60;
                if (key === 'outer') {
                    w.el.style.transform = `rotate(${w.rotation}deg)`;
                } else {
                    w.el.style.transform = `translate(-50%, -50%) rotate(${w.rotation}deg)`;
                }
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
