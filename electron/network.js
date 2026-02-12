const { SITE_DOMAIN, API_BASE, USER_AGENT } = require('./config');
const store = require('./store');
const { logDebug } = require('./logger');

async function rawFetch(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    const headers = { 
        'Origin': SITE_DOMAIN, 'Referer': SITE_DOMAIN + '/',
        'Accept': 'application/json', 'User-Agent': USER_AGENT,
        ...options.headers 
    };

    if (options.body instanceof FormData) delete headers['Content-Type'];
    
    const accessToken = store.getAccessToken();
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

    try {
        const response = await fetch(url, { ...options, headers });
        if (response.status === 204) return { ok: true, data: { success: true } };

        const text = await response.text();
        let data;
        try { data = JSON.parse(text); } catch (e) { data = { error: { message: `Server Error (${response.status})` } }; }
        return { ok: response.ok, status: response.status, data, headers: response.headers };
    } catch (e) {
        return { ok: false, status: 0, error: e.message, code: 'NETWORK_ERROR' };
    }
}

async function refreshSession() {
    logDebug(">>> НАЧАЛО refreshSession");
    
    const token = store.loadRefreshToken();
    if (!token) {
        logDebug("<<< КОНЕЦ refreshSession: Нет токена");
        return { success: false, reason: 'no_token' };
    }

    logDebug("Отправка запроса /auth/refresh...");
    
    const headers = { 
        'Content-Type': 'application/json', 
        'Cookie': `refresh_token=${token}` 
    };

    const res = await rawFetch('/v1/auth/refresh', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ refreshToken: token })
    });

    logDebug(`Ответ сервера: HTTP ${res.status}`);
    if (res.data) logDebug("Тело ответа:", res.data);

    if (res.ok && res.data?.accessToken) {
        logDebug("✅ Сессия обновлена успешно! AccessToken получен.");
        store.setAccessToken(res.data.accessToken);
        
        const setCookie = res.headers?.get('set-cookie');
        const newToken = setCookie?.match(/refresh_token=([^;]+)/)?.[1] || res.data.refreshToken;
        
        if (newToken) {
            logDebug("Сервер выдал новый RefreshToken, сохраняем...");
            store.saveRefreshToken(newToken);
        }
        
        store.resetFailureCount();
        return { success: true };
    }

    if (res.code === 'NETWORK_ERROR') {
        logDebug("Ошибка сети при обновлении");
        return { success: false, reason: 'network_error' };
    }
    
    store.incrementFailureCount();
    logDebug(`⚠️ Ошибка обновления (${store.getFailureCount()}/5). Код: ${res.status}`);

    if (store.getFailureCount() >= 5) {
        logDebug("!!! Токен умер окончательно. Удаляю.");
        store.clearRefreshToken();
        return { success: false, reason: 'token_invalid_permanent' };
    }
    return { success: false, reason: 'token_invalid_temporary' };
}

async function apiCall(endpoint, method = 'GET', body = null) {
    if (endpoint.includes('/logout')) {
        await rawFetch(endpoint, { method: 'POST' });
        store.clearRefreshToken();
        return { success: true };
    }

    let options = { method };
    if (body) {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify(body);
    }

    let res = await rawFetch(endpoint, options);
    
    if (res.status === 401 && endpoint !== '/v1/auth/refresh') {
        logDebug("Получен 401. Пробую обновить токен...");
        const refreshed = await refreshSession();
        if (refreshed.success) {
            logDebug("Токен обновлен, повторяю запрос...");
            res = await rawFetch(endpoint, options);
        }
    }
    return res.data || { error: { message: 'Server error' } };
}

module.exports = { rawFetch, refreshSession, apiCall };