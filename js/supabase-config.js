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

// === ВХОД ЧЕРЕЗ GOOGLE ===
window.signInWithGoogle = async function() {
    console.log('Инициирую вход через Google...');
    const { data, error } = await window.supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin // Возвращает пользователя на твой домен Vercel
        }
    });
    
    if (error) {
        console.error('Ошибка входа через Google:', error.message);
        alert('❌ Ошибка авторизации: ' + error.message);
        return false;
    }
    return true;
};

// Выход
window.signOut = async function() {
    await window.supabaseClient.auth.signOut();
    localStorage.clear();
    location.reload(); 
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
        console.error('Ошибка保存 имени:', error);
    } else {
        localStorage.setItem('userName', name);
    }
};

// Обновить статистику
window.incrementTranslations = async function() {
    const user = await checkUser();
    if (!user) return;

    const { count, error } = await window.supabaseClient
        .from('translations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

    if (error) {
        console.error('Ошибка подсчета переводов:', error);
        return;
    }

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
    // Ищем кнопки по твоим актуальным HTML ID
    const loginBtn = document.getElementById('google-signin-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const totalSpan = document.getElementById('totalTranslations');
    
    const user = await checkUser();
    console.log('Проверка UI. Пользователь в системе:', user ? 'ДА' : 'НЕТ');
    console.log('Найдены элементы HTML:', { loginBtn: !!loginBtn, logoutBtn: !!logoutBtn, totalSpan: !!totalSpan });
    
    if (user) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'block';
        
        // Берем имя из метаданных Google-аккаунта
        let displayName = user.user_metadata?.full_name || 'Пользователь';
        
        const profile = await window.getUserProfile();
        console.log('Загружен профиль из БД:', profile);
        
        if (profile?.name) {
            displayName = profile.name;
        } else {
            // Если в таблице profiles имени еще нет, автоматически сохраняем туда имя из Google
            console.log('Имя в профиле пустое. Записываю имя из Google:', displayName);
            await window.saveUserName(displayName);
        }
        
        localStorage.setItem('userName', displayName);
        
        if (totalSpan) {
            totalSpan.innerText = profile?.total_translations || 0;
        }
        
        if (typeof updateStatsTitle === 'function') {
            console.log('Вызываю обновление заголовка статистики...');
            updateStatsTitle();
        }
    } else {
        if (loginBtn) loginBtn.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
}

// === НАСТРАИВАЕМ КНОПКИ ===
document.addEventListener('DOMContentLoaded', function() {
    const loginBtn = document.getElementById('google-signin-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Прямая привязка БЕЗ клонирования элементов
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.signInWithGoogle();
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.signOut();
        });
    }
    
    updateAuthUI();
});

// === НАСТРАИВАЕМ КНОПКИ ===
document.addEventListener('DOMContentLoaded', function() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (loginBtn) {
        const newLoginBtn = loginBtn.cloneNode(true);
        loginBtn.parentNode.replaceChild(newLoginBtn, loginBtn);
        
        // Вешаем событие вызова окна Google
        newLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.signInWithGoogle();
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
    updateAuthUI();
});
