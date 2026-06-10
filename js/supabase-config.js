// js/supabase-config.js
const SUPABASE_URL = 'https://dozirkpilsfxthhzlfiv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_lRzYypPaoMrWUgbznU2zKg_T4kW_nkB';

if (typeof supabaseClient === 'undefined') {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase клиент создан');
}

// Проверка авторизации
async function checkUser() {
    const { data: { user }, error } = await window.supabaseClient.auth.getUser();
    if (error) return null;
    return user;
}

// Вход по магической ссылке
window.signInWithEmail = async function(email) {
    console.log('Пытаюсь войти с email:', email);
    const { data, error } = await window.supabaseClient.auth.signInWithOtp({
        email: email,
        options: {
            emailRedirectTo: window.location.origin
        }
    });
    
    if (error) {
        console.error('Ошибка входа:', error);
        if (error.message.includes('rate limit')) {
            alert('⚠️ Слишком много попыток. Подождите 5-10 минут и попробуйте снова.');
        } else if (error.message.includes('invalid email')) {
            alert('❌ Введите корректный email адрес');
        } else {
            alert('❌ Ошибка: ' + error.message);
        }
        return false;
    }
    
    alert('✅ Письмо отправлено!\n\nПроверьте ваш почтовый ящик и перейдите по ссылке для входа.');
    return true;
};

// Выход
window.signOut = async function() {
    await window.supabaseClient.auth.signOut();
    localStorage.clear();
    location.reload(); // Тут рефреш оправдан, так как мы полностью чистим сессию
};

// Получить профиль
window.getUserProfile = async function() {
    const user = await checkUser();
    if (!user) return null;
    
    const { data, error } = await window.supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    
    if (error && error.code !== 'PGRST116') {
        console.error('Ошибка загрузки профиля:', error);
    }
    return data;
};

// Сохранить имя
window.saveUserName = async function(name) {
    const user = await checkUser();
    if (!user) return;
    
    const { error } = await window.supabaseClient
        .from('profiles')
        .update({ name: name })
        .eq('id', user.id);
    
    if (error) {
        console.error('Ошибка сохранения имени:', error);
    } else {
        localStorage.setItem('userName', name);
    }
};

// Обновить статистику (Безопасный динамический подсчет без race condition)
window.incrementTranslations = async function() {
    const user = await checkUser();
    if (!user) return;

    // Вместо опасного математического апдейта на клиенте, 
    // запрашиваем реальное количество строк в таблице переводов
    const { count, error } = await window.supabaseClient
        .from('translations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

    if (error) {
        console.error('Ошибка подсчета переводов:', error);
        return;
    }

    // Синхронизируем это значение с таблицей профилей (опционально, если поле нужно в БД)
    await window.supabaseClient
        .from('profiles')
        .update({ total_translations: count })
        .eq('id', user.id);
    
    const totalSpan = document.getElementById('totalTranslations');
    if (totalSpan) totalSpan.innerText = count;
};

// Сохранить перевод
window.saveTranslation = async function(russian, kazakh, theme = 'general') {
    const user = await checkUser();
    if (!user) return;
    
    const { error } = await window.supabaseClient
        .from('translations')
        .insert({ 
            user_id: user.id, 
            russian_phrase: russian, 
            kazakh_translation: kazakh,
            theme: theme
        });

    if (error) console.error('Ошибка сохранения перевода:', error);
};

// Сохранить сообщение
window.saveMessage = async function(role, content) {
    const user = await checkUser();
    if (!user) return;
    
    const { error } = await window.supabaseClient
        .from('messages')
        .insert({ 
            user_id: user.id, 
            role: role, 
            content: content 
        });

    if (error) console.error('Ошибка сохранения сообщения:', error);
};

// Загрузить историю
window.loadChatHistory = async function() {
    const user = await checkUser();
    if (!user) return [];
    
    const { data, error } = await window.supabaseClient
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(30);
    
    if (error) {
        console.error('Ошибка загрузки истории чата:', error);
        return [];
    }
    return data || [];
};

// === ОТОБРАЖАЕМ СОСТОЯНИЕ АВТОРИЗАЦИИ ===
async function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const totalSpan = document.getElementById('totalTranslations');
    
    const user = await checkUser();
    if (user) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'block';
        
        const profile = await window.getUserProfile();
        if (profile?.name) {
            localStorage.setItem('userName', profile.name);
        }
        if (totalSpan) {
            totalSpan.innerText = profile?.total_translations || 0;
        }
        if (typeof updateStatsTitle === 'function') updateStatsTitle();
    } else {
        if (loginBtn) loginBtn.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
}

// === НАСТРАИВАЕМ КНОПКИ ===
document.addEventListener('DOMContentLoaded', function() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (loginBtn) {
        const newLoginBtn = loginBtn.cloneNode(true);
        loginBtn.parentNode.replaceChild(newLoginBtn, loginBtn);
        
        newLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const email = prompt('Введите ваш email:');
            if (email && email.includes('@')) {
                window.signInWithEmail(email);
            } else if (email) {
                alert('Введите корректный email');
            }
        });
    }
    
    if (logoutBtn) {
        const newLogoutBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
        
        newLogoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.signOut();
        });
    }
    
    updateAuthUI();
});

// Слушаем изменения авторизации реактивно БЕЗ перезагрузки страницы
window.supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log('Auth state change:', event);
    // Просто обновляем UI интерфейса на лету при входе/выходе
    updateAuthUI();
});
