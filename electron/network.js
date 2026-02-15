const { net, BrowserWindow, session } = require('electron');
const { SITE_DOMAIN, API_BASE, USER_AGENT } = require('./config');
const store = require('./store');
const { logDebug } = require('./logger');


let activeStreamRequest = null;
let reconnectTimer = null;
let isStreamExpected = false; 


let activeDdosPromise = null;
let activeRefreshPromise = null;
let isInjecting = false;

/**
 * Вспомогательная функция: Внедряет refresh_token в куки сессии Electron.
 */
async function injectRefreshTokenIntoSession(token) {
    if (!token || isInjecting) return;
    isInjecting = true;
    try {
        const domain = new URL(SITE_DOMAIN).hostname;
        
        await session.defaultSession.cookies.set({
            url: SITE_DOMAIN,
            name: 'refresh_token',
            value: token,
            domain: domain,
            path: '/',
            secure: true,
            httpOnly: true,
            expirationDate: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30)
        });
        logDebug(`[Cookies] Токен успешно внедрен в сессию для домена ${domain}`);
    } catch (e) {
        logDebug(`[Cookies] Ошибка внедрения токена: ${e.message}`);
    } finally {
        isInjecting = false;
    }
}

/**
 * Создает окно для прохождения проверки DDoS-Guard/Cloudflare.
 */
function waitForDdosClearance(url) {
    if (activeDdosPromise) {
        return activeDdosPromise;
    }

    activeDdosPromise = new Promise((resolve) => {
        logDebug(`[DDoS] 🛡️ Запуск процедуры обхода защиты: ${url}`);
        
        const win = new BrowserWindow({
            width: 500, 
            height: 600,
            show: false, 
            title: "Проверка безопасности",
            alwaysOnTop: true,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                session: session.defaultSession
            }
        });
        
        win.setMenu(null);

        let isResolved = false;

        const cleanup = () => {
            if (isResolved) return;
            isResolved = true;
            try {
                if (!win.isDestroyed()) win.destroy();
            } catch (e) {}
            activeDdosPromise = null;
        };

        const finish = (result) => {
            if (isResolved) return;
            setTimeout(() => {
                cleanup();
                resolve(result);
            }, 1500); 
        };

        const showTimeout = setTimeout(() => {
            if (!isResolved && !win.isDestroyed()) {
                logDebug("[DDoS] Автоматический обход затянулся. Показываю окно пользователю.");
                win.show();
                win.focus();
            }
        }, 3500);

        const failTimeout = setTimeout(() => {
            logDebug("[DDoS] ❌ Общий таймаут операции.");
            finish(false);
        }, 120000);

        const checkPage = async () => {
            if (win.isDestroyed() || isResolved) return;
            const title = win.getTitle().toLowerCase();
            let pageText = '';
            try {
                pageText = await win.webContents.executeJavaScript('document.body.innerText');
                pageText = (pageText || '').trim();
            } catch(e) {}

            const isApiReached = 
                pageText.includes('NOT_FOUND') || 
                pageText.includes('"error"') ||
                (pageText.startsWith('{') && pageText.endsWith('}'));

            const isProtected = 
                title.includes('ddos-guard') || 
                title.includes('just a moment') ||
                title.includes('checking your browser') ||
                title.includes('access to this page has been denied') ||
                title.includes('security check') ||
                title.includes('проверка безопасности') ||
                title.includes('безопасности') ||
                title === 'ddos-guard';

            if (isApiReached) {
                logDebug(`[DDoS] ✅ УСПЕХ! Видим ответ от API.`);
                clearTimeout(showTimeout);
                clearTimeout(failTimeout);
                finish(true);
            } 
            else if (!isProtected && title !== '' && title !== 'electron' && title !== 'проверка безопасности') {
                logDebug(`[DDoS] ✅ УСПЕХ! Заголовок сменился на "${title}".`);
                clearTimeout(showTimeout);
                clearTimeout(failTimeout);
                finish(true);
            }
        };

        win.webContents.on('did-finish-load', checkPage);
        win.webContents.on('did-fail-load', () => setTimeout(checkPage, 1000));
        win.on('page-title-updated', checkPage);

        win.on('closed', () => {
            if (!isResolved) {
                logDebug("[DDoS] Окно закрыто. Прерывание.");
                clearTimeout(showTimeout);
                clearTimeout(failTimeout);
                finish(false);
            }
        });

        win.loadURL(url, { userAgent: USER_AGENT });
    });

    return activeDdosPromise;
}

/**
 * Базовая функция запроса.
 */
function rawFetch(endpoint, options = {}, attempt = 1) {
    return new Promise(async (resolve, reject) => {
        const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
        
        if (attempt > 4) {
            return resolve({ ok: false, status: 0, error: 'Too many retries', code: 'RETRY_LOOP' });
        }

        const request = net.request({
            method: options.method || 'GET',
            url: url,
            useSessionCookies: true,
            redirect: 'follow'
        });

        const headers = { 
            'Origin': SITE_DOMAIN, 
            'Referer': SITE_DOMAIN + '/',
            'Accept': 'application/json', 
            'User-Agent': USER_AGENT,
            ...options.headers 
        };

        const accessToken = store.getAccessToken();
        if (accessToken && !headers['Authorization']) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        Object.keys(headers).forEach(key => {
            if (headers[key]) request.setHeader(key, headers[key]);
        });

        if (options.body) request.write(options.body);

        request.on('response', (response) => {
            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));

            response.on('end', async () => {
                const buffer = Buffer.concat(chunks);
                const text = buffer.toString('utf8');
                const lowerText = text.toLowerCase();
                
                if (response.statusCode === 403 || response.statusCode === 503) {
                    const isDdos = lowerText.includes('ddos-guard') || 
                                   lowerText.includes('ddg-l10n') || 
                                   lowerText.includes('js-challenge') ||
                                   lowerText.includes('just a moment') ||
                                   lowerText.includes('captcha-page');

                    if (isDdos) {
                        logDebug(`[Network] 🔥 Обнаружена защита (${response.statusCode}). Попытка ${attempt}`);
                        const passed = await waitForDdosClearance(url);
                        if (passed) {
                            const retryResult = await rawFetch(endpoint, options, attempt + 1);
                            return resolve(retryResult);
                        }
                    }
                }

                let data = null;
                if (response.statusCode !== 204) {
                    try {
                        data = JSON.parse(text);
                    } catch (e) {
                        data = { 
                            error: { message: `Server Error (${response.statusCode})` }, 
                            rawText: text.substring(0, 500) 
                        };
                    }
                } else {
                    data = { success: true };
                }

                resolve({
                    ok: response.statusCode >= 200 && response.statusCode < 300,
                    status: response.statusCode,
                    data: data,
                    headers: {
                        get: (name) => {
                            const val = response.headers[name.toLowerCase()];
                            return Array.isArray(val) ? val[0] : val;
                        },
                        raw: response.headers
                    }
                });
            });
            
            response.on('error', (e) => resolve({ ok: false, status: 0, error: e.message, code: 'NETWORK_ERROR' }));
        });

        request.on('error', (error) => resolve({ ok: false, status: 0, error: error.message, code: 'NETWORK_ERROR' }));

        setTimeout(() => {
            if (request && !request.finished) {
                try { request.abort(); } catch(e){}
                resolve({ ok: false, status: 408, error: 'Timeout', code: 'TIMEOUT' });
            }
        }, 30000);

        request.end();
    });
}

/**
 * Обновляет сессию (refresh token).
 */
async function refreshSession() {
    if (activeRefreshPromise) return activeRefreshPromise;

    activeRefreshPromise = (async () => {
        logDebug(">>> НАЧАЛО refreshSession");
        const token = store.loadRefreshToken();
        if (!token) return { success: false, reason: 'no_token' };
        
        await injectRefreshTokenIntoSession(token);
        
        const res = await rawFetch('/v1/auth/refresh', { method: 'POST' });
        logDebug(`[Refresh] Результат: ${res.status}`);
        
        if (res.ok && res.data?.accessToken) {
            store.setAccessToken(res.data.accessToken);
            let newToken = res.data.refreshToken;
            if (!newToken) {
                const setCookie = res.headers?.raw?.['set-cookie'];
                if (setCookie && Array.isArray(setCookie)) {
                    const setCookieStr = setCookie.join(';');
                    newToken = setCookieStr?.match(/refresh_token=([^;]+)/)?.[1];
                }
            }
            if (newToken) {
                store.saveRefreshToken(newToken);
                await injectRefreshTokenIntoSession(newToken);
            }
            store.resetFailureCount();
            if (isStreamExpected) setTimeout(() => startStreamConnection(), 500);
            return { success: true };
        }
        
        if (res.status === 429 || res.code === 'NETWORK_ERROR' || res.status === 0 || res.status === 408) {
            return { success: false, reason: 'network_error' };
        }
        
        
        
        if (res.status === 401) {
            store.incrementFailureCount();
            logDebug(`[Refresh] Ошибка токена. Попытка ${store.getFailureCount()}/5`);
            if (store.getFailureCount() >= 5) { 
                logDebug("[Refresh] Превышен лимит ошибок. Очистка сессии.");
                store.clearRefreshToken(); 
                stopStreamConnection(); 
                return { success: false, reason: 'token_invalid_permanent' }; 
            }
        }
        return { success: false, reason: 'token_invalid_temporary' };
    })();

    try { return await activeRefreshPromise; } finally { activeRefreshPromise = null; }
}


async function apiCall(endpoint, method = 'GET', body = null) {
    
    if (endpoint === '/v1/auth/logout') { 
        stopStreamConnection(); 
        await rawFetch(endpoint, { method: 'POST' }); 
        store.clearRefreshToken(); 
        try { await session.defaultSession.clearStorageData(); } catch(e){}
        return { success: true }; 
    }
    
    let options = { method };
    if (body) { 
        options.headers = { 'Content-Type': 'application/json' }; 
        options.body = JSON.stringify(body); 
    }
    
    let res = await rawFetch(endpoint, options);
    
    if (res.status === 401 && endpoint !== '/v1/auth/refresh') {
        const refreshed = await refreshSession();
        if (refreshed.success) {
            const newToken = store.getAccessToken();
            if (newToken) {
                if (!options.headers) options.headers = {};
                options.headers['Authorization'] = `Bearer ${newToken}`;
            }
            res = await rawFetch(endpoint, options);
        }
    }
    
    return res.data || { error: { message: 'Server error' } };
}


function stopStreamConnection() {
    logDebug("[Stream] Останавливаю соединение...");
    isStreamExpected = false;
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    if (activeStreamRequest) { try { activeStreamRequest.abort(); } catch(e) {} activeStreamRequest = null; }
}

function startStreamConnection() {
    const token = store.getAccessToken();
    if (activeStreamRequest || !token) return;
    logDebug("[Stream] Инициализация подключения (Native Net)...");
    isStreamExpected = true;
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }

    const request = net.request({
        method: 'GET',
        url: `${API_BASE}/notifications/stream`,
        useSessionCookies: true, 
    });
    request.setHeader('Accept', 'text/event-stream');
    request.setHeader('Cache-Control', 'no-cache');
    request.setHeader('Authorization', `Bearer ${token}`);
    request.on('response', (response) => {
        if (response.statusCode === 200) {
            logDebug("[Stream] ✅ Соединение УСТАНОВЛЕНО");
            response.on('data', () => {});
            response.on('end', () => { activeStreamRequest = null; if (isStreamExpected) retryStream(); });
        } else if (response.statusCode === 401 || response.statusCode === 403) {
            activeStreamRequest = null;
            refreshSession().then(res => { if (res.success) retryStream(1000); else isStreamExpected = false; });
        } else { activeStreamRequest = null; if (isStreamExpected) retryStream(); }
    });
    request.on('error', () => { activeStreamRequest = null; if (isStreamExpected) retryStream(); });
    request.end();
    activeStreamRequest = request;
}

function retryStream(delay = 5000) {
    if (!isStreamExpected) return;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
        if (activeStreamRequest) { try { activeStreamRequest.abort(); } catch(e) {} activeStreamRequest = null; }
        startStreamConnection();
    }, delay);
}

async function checkApiStatus() {
    try {
        const res = await rawFetch('/hashtags/trending?limit=1', { method: 'HEAD' });
        return res.status < 500 && res.status !== 0;
    } catch { return false; }
}

async function quickInternetCheck() {
    const hosts = ['https://8.8.8.8', 'https://1.1.1.1', 'https://www.google.com'];
    try {
        await Promise.any(hosts.map(url => fetch(url, { method: 'HEAD', mode: 'no-cors' })));
        return true;
    } catch { return false; }
}

async function runDetailedDiagnostics() {
    const checks = [
        { name: 'Google', url: 'https://google.com' },
        { name: 'VK', url: 'https://vk.com' },
        { name: 'API Сервер (итд)', url: `${API_BASE}/hashtags/trending?limit=1` }
    ];
    return await Promise.all(checks.map(async (c) => {
        const start = Date.now();
        try {
            const isApi = c.name.includes('API');
            const res = await fetch(c.url, { method: 'HEAD', mode: isApi ? 'cors' : 'no-cors' });
            if (isApi && res.status >= 500) throw new Error();
            return { name: c.name, status: 'ok', ping: Date.now() - start };
        } catch { return { name: c.name, status: 'fail' }; }
    }));
}

module.exports = { 
    rawFetch, refreshSession, apiCall, quickInternetCheck, 
    runDetailedDiagnostics, checkApiStatus,
    startStreamConnection, stopStreamConnection   
};