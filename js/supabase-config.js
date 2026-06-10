// js/supabase-config.js
const SUPABASE_URL = 'https://dozirkpilsfxthhzlfiv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_lRzYypPaoMrWUgbznU2zKg_T4kW_nkB';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Проверка авторизации
async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// Вход по магической ссылке
async function signInWithEmail(email) {
    const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
            emailRedirectTo: window.location.origin
        }
    });
    
    if (error) {
        console.error('Ошибка:', error);
        alert('Ошибка: ' + error.message);
        return false;
    }
    
    alert('Проверьте почту! Ссылка для входа отправлена на ' + email);
    return true;
}

// Выход
async function signOut() {
    await supabase.auth.signOut();
    localStorage.clear();
    location.reload();
}

// Получить профиль
async function getUserProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    
    if (error && error.code !== 'PGRST116') {
        console.error('Ошибка загрузки профиля:', error);
    }
    
    return data;
}

// Сохранить имя
async function saveUserName(name) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { error } = await supabase
        .from('profiles')
        .update({ name: name })
        .eq('id', user.id);
    
    if (error) {
        console.error('Ошибка сохранения имени:', error);
    } else {
        localStorage.setItem('userName', name);
    }
}

// Обновить статистику переводов
async function incrementTranslations() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const profile = await getUserProfile();
    const newCount = (profile?.total_translations || 0) + 1;
    
    const { error } = await supabase
        .from('profiles')
        .update({ total_translations: newCount })
        .eq('id', user.id);
    
    if (!error) {
        document.getElementById('totalTranslations').innerText = newCount;
    }
}

// Сохранить перевод в историю
async function saveTranslation(russian, kazakh, theme = 'general') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await supabase
        .from('translations')
        .insert({ 
            user_id: user.id, 
            russian_phrase: russian, 
            kazakh_translation: kazakh,
            theme: theme
        });
}

// Сохранить сообщение в историю чата
async function saveMessage(role, content) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await supabase
        .from('messages')
        .insert({ 
            user_id: user.id, 
            role: role, 
            content: content 
        });
}

// Загрузить историю чата (последние 30 сообщений)
async function loadChatHistory() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(30);
    
    return data || [];
}

// Сохранить состояние колёс
async function saveWheelStates(outer, middle, inner) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await supabase
        .from('user_wheel_states')
        .upsert({ 
            user_id: user.id, 
            outer_rot: outer, 
            middle_rot: middle, 
            inner_rot: inner,
            updated_at: new Date()
        });
}

// Загрузить состояние колёс
async function loadWheelStates() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data } = await supabase
        .from('user_wheel_states')
        .select('*')
        .eq('user_id', user.id)
        .single();
    
    return data;
}
