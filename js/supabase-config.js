// js/supabase-config.js
const SUPABASE_URL = 'https://dozirkpilsfxthhzlfiv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_lRzYypPaoMrWUgbznU2zKg_T4kW_nkB';

// Создаём глобальный объект supabaseClient чтобы не конфликтовать
if (typeof supabaseClient === 'undefined') {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase клиент создан');
}

// Проверка авторизации
async function checkUser() {
    const { data: { user }, error } = await window.supabaseClient.auth.getUser();
    if (error) console.error('checkUser error:', error);
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
        
        // Понятные сообщения для пользователя
        if (error.message.includes('rate limit')) {
            alert('⚠️ Слишком много попыток. Подождите 5-10 минут и попробуйте снова.');
        } else if (error.message.includes('invalid email')) {
            alert('❌ Введите корректный email адрес (например, name@domain.com)');
        } else {
            alert('❌ Ошибка: ' + error.message);
        }
        return false;
    }
    
    console.log('Успешно, проверьте почту');
    alert('✅ Письмо отправлено!\n\nПроверьте ваш почтовый ящик (и папку Спам) и перейдите по ссылке для входа.');
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
    const { data: { user } } = await window.supabaseClient.auth.getUser();
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
    const { data: { user } } = await window.supabaseClient.auth.getUser();
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

// Обновить статистику
window.incrementTranslations = async function() {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) return;
    
    const profile = await window.getUserProfile();
    const newCount = (profile?.total_translations || 0) + 1;
    
    await window.supabaseClient
        .from('profiles')
        .update({ total_translations: newCount })
        .eq('id', user.id);
    
    document.getElementById('totalTranslations').innerText = newCount;
};

// Сохранить перевод
window.saveTranslation = async function(russian, kazakh, theme = 'general') {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) return;
    
    await window.supabaseClient
        .from('translations')
        .insert({ 
            user_id: user.id, 
            russian_phrase: russian, 
            kazakh_translation: kazakh,
            theme: theme
        });
};

// Сохранить сообщение
window.saveMessage = async function(role, content) {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) return;
    
    await window.supabaseClient
        .from('messages')
        .insert({ 
            user_id: user.id, 
            role: role, 
            content: content 
        });
};

// Загрузить историю
window.loadChatHistory = async function() {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) return [];
    
    const { data } = await window.supabaseClient
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(30);
    
    return data || [];
};

// Слушаем изменения авторизации
window.supabaseClient.auth.onAuthStateChange((event) => {
    console.log('Auth state change:', event);
    if (event === 'SIGNED_IN') {
        location.reload();
    } else if (event === 'SIGNED_OUT') {
        location.reload();
    }
});
// === НАСТРАИВАЕМ КНОПКИ ПОСЛЕ ЗАГРУЗКИ СТРАНИЦЫ ===
document.addEventListener('DOMContentLoaded', function() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (loginBtn) {
        // Убираем все старые обработчики
        const newLoginBtn = loginBtn.cloneNode(true);
        loginBtn.parentNode.replaceChild(newLoginBtn, loginBtn);
        
        newLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const email = prompt('Введите ваш email:');
            if (email && email.includes('@')) {
                signInWithEmail(email);
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
            signOut();
        });
    }
});
// === ОТОБРАЖАЕМ СОСТОЯНИЕ АВТОРИЗАЦИИ ===
async function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    try {
        const user = await checkUser();
        if (user) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'block';
            
            // Загружаем профиль и обновляем статистику
            const profile = await getUserProfile();
            if (profile?.name) {
                localStorage.setItem('userName', profile.name);
                document.getElementById('totalTranslations').innerText = profile.total_translations || 0;
            }
        } else {
            if (loginBtn) loginBtn.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'none';
        }
    } catch (error) {
        console.log('Не авторизован');
        if (loginBtn) loginBtn.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
}

// Вызываем при загрузке
document.addEventListener('DOMContentLoaded', updateAuthUI);

// Слушаем изменения авторизации
window.supabaseClient.auth.onAuthStateChange((event) => {
    console.log('Auth state change:', event);
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        location.reload();
    }
});
