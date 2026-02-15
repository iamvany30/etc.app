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
 * Принудительно сбрасывает куки из памяти на диск, 
 * чтобы сетевой модуль 'net' их гарантированно увидел.
 */
async function flushCookies() {
    try {
        await session.defaultSession.cookies.flushStore();
    } catch (e) {
        logDebug(`[Cookies] Ошибка синхронизации: ${e.message}`);
    }
}

/**
 * Внедряет refresh_token в сессию Electron.
 */
async function injectRefreshTokenIntoSession(token) {
    if (!token || isInjecting) return;
    isInjecting = true;
    try {
        const domain = new URL(SITE_DOMAIN).hostname;
        const dotDomain = domain.startsWith('.') ? domain : `.${domain}`;
        
        await session.defaultSession.cookies.set({
            url: SITE_DOMAIN,
            name: 'refresh_token',
            value: token,
            domain: dotDomain,
            path: '/',
            secure: true,
            httpOnly: true,
            expirationDate: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30)
        });
        await flushCookies();
        logDebug(`[Cookies] Токен внедрен для ${dotDomain}`);
    } catch (e) {
        logDebug(`[Cookies] Ошибка внедрения: ${e.message}`);
    } finally {
        isInjecting = false;
    }
}

/**
 * Окно для прохождения проверки DDoS-Guard/Cloudflare.
 */
function waitForDdosClearance(url) {
    if (activeDdosPromise) return activeDdosPromise;

    activeDdosPromise = new Promise((resolve) => {
        logDebug(`[DDoS] 🛡️ Запуск процедуры обхода защиты: ${url}`);
        
        const win = new BrowserWindow({
            width: 550, 
            height: 700,
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

        const finish = (result) => {
            if (isResolved) return;
            isResolved = true;
            activeDdosPromise = null;
            setTimeout(() => { try { if(!win.isDestroyed()) win.destroy(); } catch(e){} }, 500);
            resolve(result);
        };

        const checkPage = async () => {
            if (win.isDestroyed() || isResolved) return;
            
            
            const cookies = await session.defaultSession.cookies.get({ url: SITE_DOMAIN });
            const hasDdgCookie = cookies.some(c => c.name.includes('ddg'));
            
            
            const title = win.getTitle().toLowerCase();
            const pageText = await win.webContents.executeJavaScript('document.body.innerText').catch(() => '');
            
            const isProtected = title.includes('ddos-guard') || title.includes('just a moment') || title.includes('checking your browser');
            const isApiReached = pageText.includes('NOT_FOUND') || pageText.includes('"error"') || (pageText.trim().startsWith('{') && pageText.trim().endsWith('}'));

            if (isApiReached || (!isProtected && title !== '' && title !== 'electron')) {
                logDebug(`[DDoS] ✅ Защита пройдена (Title: ${title})`);
                finish(true);
            }
        };

        win.webContents.on('did-finish-load', checkPage);
        win.on('page-title-updated', checkPage);

        
        const showTimer = setTimeout(() => { if(!win.isDestroyed() && !isResolved) win.show(); }, 4000);
        const failTimer = setTimeout(() => finish(false), 60000);

        win.on('closed', () => { clearTimeout(showTimer); clearTimeout(failTimer); finish(false); });
        win.loadURL(url, { userAgent: USER_AGENT });
    });

    return activeDdosPromise;
}

/**
 * Базовая функция запроса.
 */
function rawFetch(endpoint, options = {}, attempt = 1) {
    return new Promise(async (resolve) => {
        const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
        if (attempt > 3) return resolve({ ok: false, status: 0, error: 'Max retries' });

        const request = net.request({
            method: options.method || 'GET',
            url: url,
            useSessionCookies: true
        });

        const accessToken = store.getAccessToken();
        request.setHeader('User-Agent', USER_AGENT);
        request.setHeader('Origin', SITE_DOMAIN);
        request.setHeader('Referer', SITE_DOMAIN + '/');
        request.setHeader('Accept', 'application/json');
        if (accessToken) request.setHeader('Authorization', `Bearer ${accessToken}`);
        
        if (options.headers) {
            Object.keys(options.headers).forEach(key => request.setHeader(key, options.headers[key]));
        }

        if (options.body) request.write(options.body);

        request.on('response', (response) => {
            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', async () => {
                const buffer = Buffer.concat(chunks);
                const text = buffer.toString('utf8');

                if ((response.statusCode === 403 || response.statusCode === 503) && text.includes('ddos-guard')) {
                    const passed = await waitForDdosClearance(url);
                    if (passed) return resolve(await rawFetch(endpoint, options, attempt + 1));
                }

                let data = null;
                try { data = text ? JSON.parse(text) : {}; } catch (e) { data = { error: 'Parse Error', raw: text }; }

                resolve({
                    ok: response.statusCode >= 200 && response.statusCode < 300,
                    status: response.statusCode,
                    data,
                    headers: response.headers
                });
            });
        });

        request.on('error', (err) => resolve({ ok: false, status: 0, error: err.message }));
        request.end();
    });
}

/**
 * Обновляет сессию с механизмом Retry.
 */
async function refreshSession(retryCount = 0) {
    if (activeRefreshPromise) return activeRefreshPromise;

    activeRefreshPromise = (async () => {
        logDebug(`[Refresh] Запуск обновления (попытка ${retryCount + 1})`);
        const token = store.loadRefreshToken();
        if (!token) return { success: false, reason: 'no_token' };
        
        await injectRefreshTokenIntoSession(token);
        const res = await rawFetch('/v1/auth/refresh', { method: 'POST' });

        if (res.ok && res.data?.accessToken) {
            store.setAccessToken(res.data.accessToken);
            const newToken = res.data.refreshToken || (res.headers['set-cookie']?.[0]?.match(/refresh_token=([^;]+)/)?.[1]);
            if (newToken) {
                store.saveRefreshToken(newToken);
                await injectRefreshTokenIntoSession(newToken);
            }
            store.resetFailureCount();
            if (isStreamExpected) startStreamConnection();
            return { success: true };
        }

        
        if ((res.status === 429 || res.status >= 500 || res.status === 0) && retryCount < 2) {
            logDebug(`[Refresh] Сервер занят (${res.status}). Повтор через 2с...`);
            await new Promise(r => setTimeout(r, 2000));
            activeRefreshPromise = null;
            return refreshSession(retryCount + 1);
        }

        if (res.status === 401) {
            store.incrementFailureCount();
            if (store.getFailureCount() >= 5) {
                store.clearRefreshToken();
                return { success: false, reason: 'token_invalid_permanent' };
            }
        }
        return { success: false, reason: 'network_error' };
    })();

    try { return await activeRefreshPromise; } finally { activeRefreshPromise = null; }
}

async function apiCall(endpoint, method = 'GET', body = null) {
    if (endpoint === '/v1/auth/logout') {
        stopStreamConnection();
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
        const refreshed = await refreshSession();
        if (refreshed.success) return (await rawFetch(endpoint, options)).data;
    }

    return res.data || { error: { message: 'Server error' } };
}

function startStreamConnection() {
    const token = store.getAccessToken();
    if (activeStreamRequest || !token) return;
    isStreamExpected = true;
    
    const request = net.request({ method: 'GET', url: `${API_BASE}/notifications/stream`, useSessionCookies: true });
    request.setHeader('Authorization', `Bearer ${token}`);
    request.setHeader('Accept', 'text/event-stream');

    request.on('response', (response) => {
        if (response.statusCode === 200) {
            logDebug("[Stream] ✅ Подключено");
            response.on('data', () => {}); 
            response.on('end', () => { activeStreamRequest = null; if(isStreamExpected) setTimeout(startStreamConnection, 5000); });
        } else {
            activeStreamRequest = null;
            if (response.statusCode === 401) refreshSession();
        }
    });
    request.on('error', () => { activeStreamRequest = null; });
    request.end();
    activeStreamRequest = request;
}

function stopStreamConnection() {
    isStreamExpected = false;
    if (activeStreamRequest) { activeStreamRequest.abort(); activeStreamRequest = null; }
}

async function checkApiStatus() {
    const res = await rawFetch('/hashtags/trending?limit=1', { method: 'HEAD' });
    return res.status < 500 && res.status !== 0;
}

async function quickInternetCheck() {
    try { await fetch('https://8.8.8.8', { method: 'HEAD', mode: 'no-cors', priority: 'high' }); return true; } catch { return false; }
}

module.exports = { 
    rawFetch, refreshSession, apiCall, quickInternetCheck, 
    checkApiStatus, startStreamConnection, stopStreamConnection   
};