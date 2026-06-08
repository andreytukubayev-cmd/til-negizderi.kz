// Упрощённый рендерер колёс (использует оригинальную логику из engine.js)

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
        this.container.style.position = 'relative';
        this.container.style.display = 'flex';
        this.container.style.justifyContent = 'center';
        this.container.style.alignItems = 'center';
        this.container.style.minHeight = '320px';
        
        const deviceBody = document.createElement('div');
        deviceBody.style.position = 'relative';
        deviceBody.style.width = '280px';
        deviceBody.style.height = '280px';
        deviceBody.style.display = 'flex';
        deviceBody.style.alignItems = 'center';
        deviceBody.style.justifyContent = 'center';
        
        // Указатель
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
        pointer.style.filter = 'drop-shadow(0 2px 5px rgba(0,0,0,0.3))';
        
        // Создаём колёса
        const outerWheel = this.createWheel(280, this.themeData.outer, 'outer');
        const middleWheel = this.createWheel(230, this.themeData.middle, 'middle');
        const innerWheel = this.createWheel(170, this.themeData.inner, 'inner');
        
        outerWheel.style.position = 'absolute';
        middleWheel.style.position = 'absolute';
        innerWheel.style.position = 'absolute';
        
        deviceBody.appendChild(outerWheel);
        deviceBody.appendChild(middleWheel);
        deviceBody.appendChild(innerWheel);
        deviceBody.appendChild(pointer);
        
        this.container.appendChild(deviceBody);
        
        this.wheels = {
            outer: { el: outerWheel, rotation: 0 },
            middle: { el: middleWheel, rotation: 0 },
            inner: { el: innerWheel, rotation: 0 }
        };
        
        this.setupDrag();
        this.updateDashboard();
    }

    createWheel(size, items, type) {
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
        const cx = size / 2;
        const cy = size / 2;
        
        const colors = {
            outer: ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff'],
            middle: ['#f4f5f7', '#eaecf0', '#e1e4ea', '#d8dce4', '#cfd4dc', '#c6cbd6'],
            inner: ['#ffffff', '#f8f9fa', '#f1f3f5', '#e9ecef', '#dee2e6', '#ced4da']
        };
        
        for (let i = 0; i < count; i++) {
            const sector = document.createElement('div');
            sector.style.position = 'absolute';
            sector.style.width = '100%';
            sector.style.height = '100%';
            sector.style.transform = `rotate(${i * angleStep}deg)`;
            sector.style.background = colors[type][i % 6];
            sector.style.clipPath = this.getSectorClipPath(size, i, angleStep);
            
            // Текст
            const text = document.createElement('div');
            text.style.position = 'absolute';
            text.style.top = '55%';
            text.style.left = '50%';
            text.style.transform = 'translate(-50%, -50%)';
            text.style.textAlign = 'center';
            text.style.fontSize = type === 'inner' ? '7px' : '8px';
            text.style.fontWeight = 'bold';
            text.style.color = '#1a1d24';
            text.style.width = '60px';
            
            const kkText = items[i].kk.length > 12 ? items[i].kk.substring(0, 10) + '..' : items[i].kk;
            const ruText = items[i].ru.length > 15 ? items[i].ru.substring(0, 13) + '..' : items[i].ru;
            text.innerHTML = `${kkText}<br><small style="font-size: 6px; color: #666;">${ruText}</small>`;
            
            sector.appendChild(text);
            wheel.appendChild(sector);
        }
        
        return wheel;
    }

    getSectorClipPath(size, index, angleStep) {
        const cx = 50;
        const cy = 50;
        const rOuter = 50;
        const rInner = 30;
        
        const startAngle = index * angleStep - 60;
        const endAngle = startAngle + 60;
        
        const radStart = startAngle * Math.PI / 180;
        const radEnd = endAngle * Math.PI / 180;
        
        const x1 = cx + rOuter * Math.cos(radStart);
        const y1 = cy + rOuter * Math.sin(radStart);
        const x2 = cx + rOuter * Math.cos(radEnd);
        const y2 = cy + rOuter * Math.sin(radEnd);
        const x3 = cx + rInner * Math.cos(radEnd);
        const y3 = cy + rInner * Math.sin(radEnd);
        const x4 = cx + rInner * Math.cos(radStart);
        const y4 = cy + rInner * Math.sin(radStart);
        
        return `polygon(${cx}% ${cy}%, ${x1}% ${y1}%, ${x2}% ${y2}%, ${x3}% ${y3}%, ${x4}% ${y4}%)`;
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
                w.el.style.transform = `rotate(${w.rotation}deg)`;
                this.updateDashboard();
                e.preventDefault();
            };
            
            const onEnd = () => {
                if (!isDragging) return;
                isDragging = false;
                w.el.style.transition = 'transform 0.3s ease';
                w.rotation = Math.round(w.rotation / 60) * 60;
                w.el.style.transform = `rotate(${w.rotation}deg)`;
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
