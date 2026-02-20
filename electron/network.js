const { net, session, app } = require('electron');
const { SITE_DOMAIN, API_BASE, USER_AGENT } = require('./config');
const store = require('./store');
const { logDebug } = require('./logger');

let GLOBAL_USER_AGENT = USER_AGENT;
let GLOBAL_ACCESS_TOKEN = null; 
let isSessionRestored = false;
let activeStreamRequest = null;
let isStreamExpected = false;
let isRefreshing = false;
let refreshPromise = null;

function setGlobalAccessToken(token) {
    GLOBAL_ACCESS_TOKEN = token;
}


async function captureAndSaveCookies() {
    try {
        
        const cookies = await session.defaultSession.cookies.get({ domain: 'xn--d1ah4a.com' });
        
        if (cookies && cookies.length > 0) {
            
            store.updateActiveSessionCookies(cookies);
            logDebug(`[Network] Актуальные куки сохранены (${cookies.length} шт).`);
        }
    } catch (e) {
        console.error("[Network] Не удалось сохранить свежие куки:", e);
    }
}

async function applyCookiesToSession(cookies) {
    if (!cookies || !Array.isArray(cookies)) return;

    let restoredCount = 0;
    const cookieNames = cookies.map(c => c.name).join(', ');
    logDebug(`[Network] Применяем куки: ${cookieNames}`);

    for (const cookie of cookies) {
        if (!cookie || typeof cookie.name !== 'string' || typeof cookie.domain !== 'string') continue;
        try {
            if (cookie.name === 'refresh_token') cookie.path = '/';
            
            let cookieDomain = cookie.domain;
            let urlDomain = cookieDomain.startsWith('.') ? cookieDomain.substring(1) : cookieDomain;
            const schema = cookie.secure ? 'https://' : 'http://';
            const url = `${schema}${urlDomain}${cookie.path || '/'}`;
            
            let sameSite = 'unspecified';
            if (cookie.sameSite && typeof cookie.sameSite === 'string') {
                const ssLower = cookie.sameSite.toLowerCase();
                if (ssLower.includes('lax')) sameSite = 'lax';
                else if (ssLower.includes('strict')) sameSite = 'strict';
                else if (ssLower.includes('none')) sameSite = 'no_restriction';
            }

            
            if (sameSite === 'no_restriction' && !cookie.secure) {
                logDebug(`[Network] Пропуск небезопасной куки ${cookie.name} с SameSite=None`);
                continue;
            }

            await session.defaultSession.cookies.set({
                url: url,
                name: cookie.name,
                value: String(cookie.value || ''),
                domain: cookie.domain,
                path: cookie.path || '/',
                secure: !!cookie.secure,  
                httpOnly: !!cookie.httpOnly,
                sameSite: sameSite,
                expirationDate: cookie.expirationDate || cookie.expires || (Date.now() / 1000) + 31536000 
            });
            restoredCount++;
        } catch (e) {
            console.warn(`[Network] Ошибка установки куки ${cookie.name}:`, e.message);
        }
    }
    
    await session.defaultSession.cookies.flushStore();
    logDebug(`[Network] Успешно применено кук: ${restoredCount}`);
}

async function restoreSession() {
    const data = store.loadSessionData();
    if (!data) {
        logDebug("[Network] Нет данных сессии для активного аккаунта.");
        return { success: false, reason: 'no_data' };
    }

    logDebug("[Network] Начало восстановления сессии активного аккаунта...");

    try {
        if (data.userAgent) {
            GLOBAL_USER_AGENT = data.userAgent;
            session.defaultSession.setUserAgent(GLOBAL_USER_AGENT);
        } else {
            GLOBAL_USER_AGENT = USER_AGENT;
            session.defaultSession.setUserAgent(GLOBAL_USER_AGENT);
        }

        await session.defaultSession.clearStorageData({ storages: ['cookies', 'localstorage'] });

        if (data.cookies && Array.isArray(data.cookies)) {
            await applyCookiesToSession(data.cookies);
        }
        
        isSessionRestored = true;
        return { success: true };
    } catch (e) {
        logDebug(`[Network] Ошибка восстановления сессии: ${e.message}`);
        return { success: false, reason: 'restore_error' };
    }
}

async function switchUserSession(targetAccount) {
    logDebug(`[Network] Переключение сессии на: ${targetAccount?.user?.username}`);
    
    if (!targetAccount || !targetAccount.session) {
        return { success: false, error: "Invalid account data" };
    }

    try {
        stopStreamConnection();
        GLOBAL_ACCESS_TOKEN = null;
        isSessionRestored = false;
        
        await session.defaultSession.clearStorageData();
        logDebug("[Network] Хранилище сессии очищено.");

        const sessionData = targetAccount.session;
        if (sessionData.userAgent) {
            GLOBAL_USER_AGENT = sessionData.userAgent;
            session.defaultSession.setUserAgent(GLOBAL_USER_AGENT);
        } else {
            GLOBAL_USER_AGENT = USER_AGENT;
            session.defaultSession.setUserAgent(GLOBAL_USER_AGENT);
        }

        if (sessionData.cookies && Array.isArray(sessionData.cookies)) {
            await applyCookiesToSession(sessionData.cookies);
        }

        logDebug("[Network] Проверка сессии после переключения...");
        const refreshRes = await rawFetch('/v1/auth/refresh', { method: 'POST' });
        
        if (refreshRes.ok && refreshRes.data.accessToken) {
            GLOBAL_ACCESS_TOKEN = refreshRes.data.accessToken;
            isSessionRestored = true;
            logDebug("[Network] Сессия успешно переключена и обновлена.");
            
            
            await captureAndSaveCookies();
            
            return { success: true };
        } else {
            logDebug(`[Network] Сессия переключена, но токен не обновлен (Status: ${refreshRes.status}). Возможно, истек срок действия.`);
            return { success: true, warning: "token_refresh_failed" };
        }
    } catch (e) {
        logDebug(`[Network] Ошибка при переключении сессии: ${e.message}`);
        return { success: false, error: e.message };
    }
}

function rawFetch(endpoint, options = {}) {
    return new Promise((resolve) => {
        const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
        
        const request = net.request({ 
            method: options.method || 'GET', 
            url: url, 
            useSessionCookies: true 
        });

        const timeoutId = setTimeout(() => {
            request.abort();
            logDebug(`[Network] ТАЙМАУТ (${url}) - запрос прерван.`);
            resolve({ ok: false, status: 408, error: 'Request Timeout' });
        }, 15000);

        request.setHeader('User-Agent', GLOBAL_USER_AGENT);
        request.setHeader('Origin', SITE_DOMAIN);
        request.setHeader('Referer', SITE_DOMAIN + '/');
        request.setHeader('Accept', 'application/json, text/plain, */*');
        request.setHeader('Authority', 'xn--d1ah4a.com');
        request.setHeader('sec-ch-ua', '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"');
        request.setHeader('sec-ch-ua-mobile', '?0');
        request.setHeader('sec-ch-ua-platform', '"Windows"');
        request.setHeader('sec-fetch-dest', 'empty');
        request.setHeader('sec-fetch-mode', 'cors');
        request.setHeader('sec-fetch-site', 'same-origin');
        
        if (GLOBAL_ACCESS_TOKEN) {
            request.setHeader('Authorization', `Bearer ${GLOBAL_ACCESS_TOKEN}`);
        }

        if (options.headers) {
            Object.keys(options.headers).forEach(key => request.setHeader(key, options.headers[key]));
        }

        request.on('response', (response) => {
            clearTimeout(timeoutId);

            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));

            response.on('end', () => {
                const text = Buffer.concat(chunks).toString('utf8');

                if (response.statusCode === 403 && text.includes('challenge')) {
                    logDebug("[Network] Ошибка: Cloudflare требует ручную проверку (403).");
                    resolve({ ok: false, status: 403, error: 'Cloudflare Block' });
                    return;
                }

                let data = null;
                try {
                    data = text ? JSON.parse(text) : {};
                } catch (e) {
                    data = { error: 'Parse Error', raw: text };
                }

                resolve({ 
                    ok: response.statusCode >= 200 && response.statusCode < 300, 
                    status: response.statusCode, 
                    data 
                });
            });
        });

        request.on('error', (err) => {
            clearTimeout(timeoutId);
            logDebug(`[Network] Сетевая ошибка (${url}): ${err.message}`);
            resolve({ ok: false, status: 0, error: err.message });
        });

        if (options.body) {
            request.write(options.body);
        }

        request.end();
    });
}

async function refreshSession() {
    if (isRefreshing) return refreshPromise;

    isRefreshing = true;
    refreshPromise = (async () => {
        try {
            if (!isSessionRestored) {
                const restoreResult = await restoreSession();
                if (!restoreResult.success) return { success: false, reason: restoreResult.reason };
            }

            logDebug("[Network] Получение токена доступа (AccessToken)...");
            const refreshRes = await rawFetch('/v1/auth/refresh', { method: 'POST' });

            if (refreshRes.ok && refreshRes.data.accessToken) {
                GLOBAL_ACCESS_TOKEN = refreshRes.data.accessToken;
                
                
                await captureAndSaveCookies();
                
                return { success: true };
            } else {
                logDebug(`[Network] Ошибка обновления токена (Code: ${refreshRes.status}).`);
                if (refreshRes.status !== 429) {  
                    
                    store.clearRefreshToken();
                    isSessionRestored = false;
                }
                return { success: false, reason: 'token_refresh_failed' };
            }
        } finally {
            isRefreshing = false;
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

async function apiCall(endpoint, method = 'GET', body = null) {
    if (endpoint === '/v1/auth/logout') {
        stopStreamConnection();
        
        if (store.getActiveAccount()) {
            store.removeAccount(store.getActiveAccount().user.id);
        }
        store.clearRefreshToken();
        isSessionRestored = false;
        GLOBAL_ACCESS_TOKEN = null;
        await session.defaultSession.clearStorageData();
        return { success: true };
    }

    let options = { method };
    if (body) {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify(body);
    }

    let res = await rawFetch(endpoint, options);
    
    
    if (res.status === 401) {
        logDebug(`[Network] 401 Unauthorized на ${endpoint}. Пробуем обновить токен...`);
        const refreshRes = await refreshSession();
        
        if (refreshRes.success) {
            
            res = await rawFetch(endpoint, options);
        } else {
            logDebug(`[Network] Рефреш не удался. Сброс сессии.`);
            
            isSessionRestored = false;
            GLOBAL_ACCESS_TOKEN = null;
            return { error: { code: "SESSION_EXPIRED", message: "Сессия истекла" } };
        }
    }

    return res.data || { error: { message: 'Server error' } };
}

async function uploadFileInternal(fileBuffer, fileName, fileType) {
    if (!GLOBAL_ACCESS_TOKEN) await refreshSession();
    try {
        const formData = new FormData();
        formData.append('file', new Blob([fileBuffer], { type: fileType }), fileName);
        
        const response = await fetch(`${API_BASE}/files/upload`, {
            method: 'POST',
            headers: { 
                'User-Agent': GLOBAL_USER_AGENT, 
                'Authorization': `Bearer ${GLOBAL_ACCESS_TOKEN}` 
            },
            body: formData,
        });
        
        if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
        return { data: await response.json() };
    } catch (error) {
        return { error: { message: error.message } };
    }
}

function startStreamConnection() {
    if (activeStreamRequest || !GLOBAL_ACCESS_TOKEN) return;
    
    isStreamExpected = true;
    logDebug("[Network] Запуск SSE стрима...");
    
    const request = net.request({ 
        method: 'GET', 
        url: `${API_BASE}/notifications/stream`, 
        useSessionCookies: true 
    });
    
    request.setHeader('User-Agent', GLOBAL_USER_AGENT);
    request.setHeader('Accept', 'text/event-stream');
    request.setHeader('Authorization', `Bearer ${GLOBAL_ACCESS_TOKEN}`);
    
    request.on('response', (response) => {
        if (response.statusCode === 200) {
            response.on('data', () => {}); 
            
            response.on('end', () => { 
                activeStreamRequest = null; 
                if(isStreamExpected) setTimeout(startStreamConnection, 5000); 
            });
        } else { 
            activeStreamRequest = null; 
        }
    });
    
    request.on('error', () => { 
        activeStreamRequest = null; 
        if(isStreamExpected) setTimeout(startStreamConnection, 10000); 
    });
    
    request.end();
    activeStreamRequest = request;
}

function stopStreamConnection() {
    isStreamExpected = false;
    if (activeStreamRequest) { 
        try { activeStreamRequest.abort(); } catch(e){} 
        activeStreamRequest = null; 
    }
}

async function checkApiStatus() {
    const res = await rawFetch('/hashtags/trending?limit=1');
    return res.status < 500 && res.status !== 0;
}

async function quickInternetCheck() {
    try { 
        await fetch('https://8.8.8.8', { method: 'HEAD', mode: 'no-cors' }); 
        return true; 
    } catch { 
        return false; 
    }
}

module.exports = { 
    rawFetch, 
    refreshSession, 
    apiCall, 
    quickInternetCheck, 
    checkApiStatus, 
    startStreamConnection, 
    stopStreamConnection, 
    uploadFileInternal,
    setGlobalAccessToken, 
    applyCookiesToSession,
    switchUserSession,
    captureAndSaveCookies 
};