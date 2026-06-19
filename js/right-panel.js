<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="stylesheet.css">
    <title>Изучение казахского языка по методике Тукубаева А.С.</title>
</head>
<body>
    <div class="menu-overlay" id="menuOverlay"></div>
    <div class="menu-overlay-right" id="menuOverlayRight"></div>

    <div class="container">
        <div class="sidebar" id="sidebar">
            <div class="profile">
                <div class="avatar-placeholder">
                    <img src="as.jpg" alt="Тукубаев А.С." class="avatar">
                </div>
                <h2>Тукубаев А.С.</h2>
                <p>Методика изучения<br>казахского языка<br>
                для студентов, педагогов и госслужащих</p>
            </div>

            <div class="method-info">
                <h3>🎯 О методике</h3>
                <p style="text-align: justify; margin-bottom: 5px;">
                    В когнитивной психологии и нейробиологии уровень рабочей памяти (включая её компонент — фонологическую петлю) обычно оценивается через распределение в популяции (колоколообразная кривая Гаусса) и объем удерживаемых единиц информации.
                </p>

                <details style="margin-bottom: 15px; cursor: pointer;">
                    <summary style="font-weight: bold; color: #00bcd4; margin-bottom: 15px; padding: 5px 0; font-size: 13px;">
                        📖 Развернуть/свернуть...
                    </summary>
                    
                    <div style="padding-left: 12px; border-left: 2px solid rgba(255,255,255,0.15); margin-top: 10px;">
                        <p style="text-align: justify; margin-bottom: 20px;">   
                            Понятие «магического числа 7±2» (Джордж Миллер) для рабочей памяти сейчас пересмотрено. Современные исследования (например, Нэльсона Коуэна) доказывают, что чистый объем рабочей памяти (без применения фокусов кодирования и мнемотехник) у обычного человека составляет всего 4±1 единицы информации. Однако, устоявшиеся методики обучения языкам продолжают опираться на сильную фонологическую и рабочую память, хотя людей с таким типом памяти около 10-15%. В результате такого обучения, из группы в 20 слушателей, более-менее комфортно себя чувствуют лишь 2-3 человека.<br><br>
                            Ситуация усугубляется очередностью обучения, когда слушателю, не умеющему говорить на языке и не понимающему его, предлагается учить алфавит, числа и грамматику. Хотя в природе заложено, что ребенок сперва начинает говорить и понимать речь, а лишь затем переходит к алфавиту.
                        </p>
                        
                        <p style="text-align: justify; margin-bottom: 20px;">
                            Авторская концепция <b>Тукубаева А.С.</b> фокусируется на естественном освоении языка через контекст и практику, минуя классические академические барьеры.
                        </p>

                        <ul style="margin-bottom: 15px; padding-left: 20px;">
                            <li style="text-align: justify; margin-bottom: 8px;"><b>Естественный алгоритм:</b> Сначала формирование навыка понимания и живой речи, затем — систематизация правил.</li>
                            <li style="text-align: justify; margin-bottom: 8px;"><b>Деловая коммуникация на выбор:</b> Изучение структур, необходимых для студенческой жизни, профессионального общения и официального стиля.</li>
                            <li style="text-align: justify; margin-bottom: 8px;"><b>Прикладной характер:</b> Инструменты для мгновенного внедрения языка в ежедневную учебную или рабочую деятельность.</li>
                        </ul>

                        <div style="padding: 10px; background: rgba(255,255,255,0.1); border-radius: 10px; font-style: italic; font-size: 11px; margin-top: 15px; text-align: justify;">
                            "Методика ориентирована на результат: от первого диалога до свободного владения в профессиональной среде."
                        </div>
                    </div>
                </details>
            </div>

            <div class="stats">
                <h3 id="statsTitle">📊 Ваша статистика</h3>
                <div class="stat-item">
                    <span class="stat-label">Переведено фраз:</span>
                    <span class="stat-value" id="totalTranslations">0</span>
                </div>
                
                <div id="auth-google-container">
                    <button id="google-signin-btn" class="btn-google">
                        <img src="https://authjs.dev/img/providers/google.svg" alt="Google" width="20" height="20">
                        Войти через Google
                    </button>
                </div>
                <button id="logout-btn" class="btn-logout" style="display: none;">Выйти из аккаунта</button>
            </div>     
        </div>

        <div class="chat-area">
            <div class="chat-header">
                <button class="menu-toggle" id="menuToggle">☰</button>
                <div class="header-text">
                    <h1>🤖 AI-помощник по казахскому языку</h1>
                    <p>Перевод и ситуации по методике Тукубаева А.С.</p>
                </div>
                <button class="menu-toggle-right" id="menuToggleRight">🎡</button>
            </div>

            <div class="messages" id="messages">
                <div class="message bot">
                    <div class="message-content">
                        👋 <strong>Здравствуйте!</strong><br><br>
                        Я - AI-помощник, обученный по методике Тукубаева А.С.<br><br>
                        <strong>Как ваше имя?</strong>
                    </div>
                </div>
            </div>

            <form class="input-area" id="chatForm">
                <input type="text" id="userInput" placeholder="Напишите фразу на русском..." required />
                <button type="submit" id="sendBtn">📤 Отправить</button>
            </form>
        </div>

<div class="sidebar-right" id="sidebarRight">
            <button class="menu-close-right" id="menuCloseRight">🎡</button>

            <div class="calculator-device">
                
                <div class="calc-search-row">
                    <div class="search-wrapper">
                        <input type="text" id="themeSearch" class="theme-search-input" placeholder="Поиск темы...">
                        <button type="button" id="clearSearchBtn" class="clear-search-btn" aria-label="Очистить поиск">&times;</button>
                    </div>
                    <div id="searchSuggestions" class="search-suggestions-box"></div>
                </div>

                <div id="wheelsDisplay" class="calc-screen-area">
                    
                    <div class="calc-display-line">
                        <span class="lbl-q">ВОПРОС</span>
                        <div class="txt-box">
                            <span class="lang-kk" id="dash-q-kk">-</span>
                            <span class="lang-ru" id="dash-q-ru">-</span>
                        </div>
                    </div>

                    <div class="calc-display-line">
                        <span class="lbl-a">ОТВЕТ</span>
                        <div class="txt-box">
                            <span class="lang-kk" id="dash-a-kk">-</span>
                            <span class="lang-ru" id="dash-a-ru">-</span>
                        </div>
                    </div>

                    <div class="calc-display-line">
                        <span class="lbl-r">РЕАКЦИЯ</span>
                        <div class="txt-box">
                            <span class="lang-kk" id="dash-r-kk">-</span>
                            <span class="lang-ru" id="dash-r-ru">-</span>
                        </div>
                    </div>

                </div>

                <div class="calc-wheels-deck">
    
    <div id="wheelsContainer" class="wheels-container"></div>
    
</div>
            </div> 
			
			</div>
        
    </div> <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="js/supabase-config.js"></script>
    <script src="js/wheels_library.js"></script>
    <script src="js/localTranslator.js"></script>
    <script src="js/right-panel.js"></script>
    <script src="js/chat.js"></script>
    
    <script>
        // === Управление левым меню ===
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');
        const menuOverlay = document.getElementById('menuOverlay');
        
        function openMenu() {
            sidebar.classList.add('open');
            menuOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        function closeMenu() {
            sidebar.classList.remove('open');
            menuOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
        if (menuToggle) menuToggle.addEventListener('click', (e) => { e.stopPropagation(); sidebar.classList.contains('open') ? closeMenu() : openMenu(); });
        if (menuOverlay) menuOverlay.addEventListener('click', closeMenu);
        
        // === Управление статистикой ===
        function updateStatsTitle() {
            const statsTitle = document.getElementById('statsTitle');
            const userName = localStorage.getItem('userName');
            statsTitle.innerHTML = userName ? `📊 Ваша статистика, ${userName}` : `📊 Ваша статистика`;
        }
        updateStatsTitle();
        window.addEventListener('storage', (e) => { if (e.key === 'userName') updateStatsTitle(); });

        // === УПРАВЛЕНИЕ ПРАВОЙ ПАНЕЛЬЮ ===
        const menuToggleRight = document.getElementById('menuToggleRight');
        const menuCloseRight = document.getElementById('menuCloseRight');
        const sidebarRight = document.getElementById('sidebarRight');
        const menuOverlayRight = document.getElementById('menuOverlayRight');

        function openRightMenu() {
            sidebarRight.classList.add('open');
            if (menuOverlayRight) menuOverlayRight.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeRightMenu() {
            sidebarRight.classList.remove('open');
            if (menuOverlayRight) menuOverlayRight.classList.remove('active');
            document.body.style.overflow = '';
        }

        function toggleRightMenu() {
            if (sidebarRight.classList.contains('open')) {
                closeRightMenu();
            } else {
                openRightMenu();
            }
        }

        if (menuToggleRight) {
            menuToggleRight.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleRightMenu();
            });
        }

        if (menuCloseRight) {
            menuCloseRight.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                closeRightMenu();
            });
        }

        if (menuOverlayRight) {
            menuOverlayRight.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                closeRightMenu();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebarRight.classList.contains('open')) {
                closeRightMenu();
            }
        });
    </script>
    
    <div id="actionMenu">
        <div class="action-menu-title">Выберите действие для фразы</div>
        <div class="action-buttons-container">
            <button id="actionTranslate" class="action-btn">
                <span class="action-btn-icon">✨</span>
                <div class="action-btn-text">
                    Перевести фразу
                    <span>Точный перевод и грамматический разбор слов</span>
                </div>
            </button>
            <button id="actionDiscuss" class="action-btn">
                <span class="action-btn-icon">💬</span>
                <div class="action-btn-text">
                    Обсудить ситуацию
                    <span>Совет по этикету и пример живого мини-диалога</span>
                </div>
            </button>
        </div>
    </div>
    <div id="actionMenuOverlay"></div>

</body>
</html>
