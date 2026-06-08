// Простой рендерер - использует оригинальный код из engine.js

class WheelRenderer {
    constructor(containerId, themeData) {
        this.container = document.getElementById(containerId);
        this.themeData = themeData;
        this.init();
    }

    init() {
        if (!this.container) return;
        this.container.innerHTML = '';
        
        // Создаём контейнер как в оригинале
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
        
        // Стрелка
        const pointer = document.createElement('div');
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
        const outerWheel = this.createWheel(640, this.themeData.outer, 'outer');
        const middleWheel = this.createWheel(530, this.themeData.middle, 'middle');
        const innerWheel = this.createWheel(390, this.themeData.inner, 'inner');
        
        outerWheel.style.position = 'absolute';
        middleWheel.style.position = 'absolute';
        innerWheel.style.position = 'absolute';
        
        // Центрируем
        const offsetMiddle = (640 - 530) / 2;
        middleWheel.style.left = `${offsetMiddle}px`;
        middleWheel.style.top = `${offsetMiddle}px`;
        
        const offsetInner = (640 - 390) / 2;
        innerWheel.style.left = `${offsetInner}px`;
        innerWheel.style.top = `${offsetInner}px`;
        
        // Кнопка СБРОС
        const centerBtn = document.createElement('div');
        centerBtn.style.position = 'absolute';
        centerBtn.style.width = '64px';
        centerBtn.style.height = '64px';
        centerBtn.style.borderRadius = '50%';
        centerBtn.style.background = 'conic-gradient(from 0deg, #999, #eee, #999, #eee, #999)';
        centerBtn.style.boxShadow = '0px 4px 10px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.6)';
        centerBtn.style.border = '2px solid #ffffff';
        centerBtn.style.zIndex = '10';
        centerBtn.style.cursor = 'pointer';
        centerBtn.style.display = 'flex';
        centerBtn.style.alignItems = 'center';
        centerBtn.style.justifyContent = 'center';
        centerBtn.style.fontSize = '10px';
        centerBtn.style.fontWeight = '900';
        centerBtn.style.color = '#2b2d42';
        centerBtn.innerText = 'СБРОС';
        
        centerBtn.addEventListener('click', () => {
            outerWheel.style.transform = 'rotate(0deg)';
            middleWheel.style.transform = 'rotate(0deg)';
            innerWheel.style.transform = 'rotate(0deg)';
            this.updateDashboard(0, 0, 0);
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
        this.updateDashboard(0, 0, 0);
    }

    createWheel(size, items, type) {
        const wheel = document.createElement('div');
        wheel.style.width = `${size}px`;
        wheel.style.height = `${size}px`;
        wheel.style.borderRadius = '50%';
        wheel.style.cursor = 'grab';
        wheel.style.position = 'relative';
        wheel.style.background = '#ddd';
        wheel.style.boxShadow = '0px 20px 40px rgba(0, 0, 0, 0.12), inset 0px 2px 4px rgba(255,255,255,0.5)';
        wheel.style.border = '3px solid #ffffff';
        wheel.style.overflow = 'hidden';
        
        const count = items.length;
        const angleStep = 360 / count;
        const cx = size / 2;
        const cy = size / 2;
        
        let rIn = 0, rOut = size / 2;
        if (type === 'outer') { rIn = size * 0.41; }
        else if (type === 'middle') { rIn = size * 0.37; }
        else if (type === 'inner') { rIn = 0; }
        
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
            cell.style.transform = `rotate(${currentAngle}deg)`;
            cell.style.transformOrigin = `${cx}px ${cy}px`;
            
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
            svg.style.width = '100%';
            svg.style.height = '100%';
            
            const startAngle = -120;
            const endAngle = -60;
            const startRad = startAngle * Math.PI / 180;
            const endRad = endAngle * Math.PI / 180;
            
            const x1 = cx + rOut * Math.cos(startRad);
            const y1 = cy + rOut * Math.sin(startRad);
            const x2 = cx + rOut * Math.cos(endRad);
            const y2 = cy + rOut * Math.sin(endRad);
            
            let pathData;
            if (rIn > 0) {
                const x3 = cx + rIn * Math.cos(endRad);
                const y3 = cy + rIn * Math.sin(endRad);
                const x4 = cx + rIn * Math.cos(startRad);
                const y4 = cy + rIn * Math.sin(startRad);
                pathData = `M ${x1} ${y1} A ${rOut} ${rOut} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${rIn} ${rIn} 0 0 0 ${x4} ${y4} Z`;
            } else {
                pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${rOut} ${rOut} 0 0 1 ${x2} ${y2} Z`;
            }
            
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", pathData);
            path.setAttribute("fill", colors[type][i % 6]);
            path.setAttribute("stroke", "white");
            path.setAttribute("stroke-width", "2");
            svg.appendChild(path);
            
            cell.appendChild(svg);
            wheel.appendChild(cell);
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
                w.el.style.transform = `rotate(${w.rotation}deg)`;
                this.updateDashboard(
                    this.wheels.outer.rotation,
                    this.wheels.middle.rotation,
                    this.wheels.inner.rotation
                );
                e.preventDefault();
            };
            
            const onEnd = () => {
                if (!isDragging) return;
                isDragging = false;
                w.el.style.transition = 'transform 0.3s ease';
                w.rotation = Math.round(w.rotation / 60) * 60;
                w.el.style.transform = `rotate(${w.rotation}deg)`;
                this.updateDashboard(
                    this.wheels.outer.rotation,
                    this.wheels.middle.rotation,
                    this.wheels.inner.rotation
                );
            };
            
            w.el.addEventListener('mousedown', onStart);
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onEnd);
            w.el.addEventListener('touchstart', onStart, { passive: false });
            window.addEventListener('touchmove', onMove, { passive: false });
            window.addEventListener('touchend', onEnd);
        });
    }

    updateDashboard(outerRot, middleRot, innerRot) {
        const getIndex = (rotation) => {
            let norm = (-rotation) % 360;
            if (norm < 0) norm += 360;
            return Math.round(norm / 60) % 6;
        };
        
        const outerIndex = getIndex(outerRot);
        const middleIndex = getIndex(middleRot);
        const innerIndex = getIndex(innerRot);
        
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
        this.init();
    }
}
