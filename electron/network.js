/* @source electron/network.js */
const { net, session, app } = require('electron');
const { SITE_DOMAIN, API_BASE, USER_AGENT } = require('./config');
const store = require('./store');
const { logDebug } = require('./logger');

let GLOBAL_USER_AGENT = USER_AGENT;
let GLOBAL_ACCESS_TOKEN = null; 
let isSessionRestored = false;

let isRefreshing = false;
let refreshPromise = null;

function setGlobalAccessToken(token) {
    GLOBAL_ACCESS_TOKEN = token;
}

function getGlobalAccessToken() {
    return GLOBAL_ACCESS_TOKEN;
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

            if (sameSite === 'no_restriction' && !cookie.secure) continue;

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
}

async function restoreSession() {
    const data = store.loadSessionData();
    if (!data) return { success: false, reason: 'no_data' };

    try {
        GLOBAL_USER_AGENT = data.userAgent || USER_AGENT;
        session.defaultSession.setUserAgent(GLOBAL_USER_AGENT);
        await session.defaultSession.clearStorageData({ storages: ['cookies'] });

        if (data.cookies && Array.isArray(data.cookies)) {
            await applyCookiesToSession(data.cookies);
        }
        isSessionRestored = true;
        return { success: true };
    } catch (e) {
        return { success: false, reason: 'restore_error' };
    }
}

async function switchUserSession(targetAccount) {
    if (!targetAccount || !targetAccount.session) return { success: false, error: "INVALID_ACCOUNT_DATA" };

    try {
        GLOBAL_ACCESS_TOKEN = null;
        isSessionRestored = false;
        await session.defaultSession.clearStorageData({ storages: ['cookies'] });

        const sessionData = targetAccount.session;
        GLOBAL_USER_AGENT = sessionData.userAgent || USER_AGENT;
        session.defaultSession.setUserAgent(GLOBAL_USER_AGENT);

        if (sessionData.cookies && Array.isArray(sessionData.cookies)) {
            await applyCookiesToSession(sessionData.cookies);
        }

        const refreshRes = await rawFetch('/v1/auth/refresh', { method: 'POST' });
        
        if (refreshRes.ok && refreshRes.data.accessToken) {
            GLOBAL_ACCESS_TOKEN = refreshRes.data.accessToken;
            isSessionRestored = true;
            await captureAndSaveCookies();
            return { success: true };
        } else {
            return { success: false, error: "TOKEN_DEAD", status: refreshRes.status };
        }
    } catch (e) {
        return { success: false, error: e.message };
    }
}

function rawFetch(endpoint, options = {}) {
    return new Promise((resolve) => {
        const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
        const request = net.request({ method: options.method || 'GET', url: url, useSessionCookies: true });

        const timeoutId = setTimeout(() => {
            request.abort();
            resolve({ ok: false, status: 408, error: 'Request Timeout' });
        }, 15000);

        request.setHeader('User-Agent', GLOBAL_USER_AGENT);
        request.setHeader('Origin', SITE_DOMAIN);
        request.setHeader('Referer', SITE_DOMAIN + '/');
        
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
                let data = null;
                try { data = text ? JSON.parse(text) : {}; } catch (e) { data = { error: 'Parse Error', raw: text }; }
                resolve({ ok: response.statusCode >= 200 && response.statusCode < 300, status: response.statusCode, data });
            });
        });

        request.on('error', (err) => {
            clearTimeout(timeoutId);
            resolve({ ok: false, status: 0, error: err.message });
        });

        if (options.body) request.write(options.body);
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

            const refreshRes = await rawFetch('/v1/auth/refresh', { method: 'POST' });

            if (refreshRes.ok && refreshRes.data.accessToken) {
                GLOBAL_ACCESS_TOKEN = refreshRes.data.accessToken;
                await captureAndSaveCookies();
                return { success: true };
            } else {
                
                
                if (refreshRes.status === 401 || refreshRes.status === 400 || refreshRes.status === 403) {  
                    store.clearRefreshToken();
                    isSessionRestored = false;
                    GLOBAL_ACCESS_TOKEN = null;
                    return { success: false, reason: 'unauthorized' };
                }
                return { success: false, reason: 'network_error' };
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
        if (store.getActiveAccount()) store.removeAccount(store.getActiveAccount().user.id);
        isSessionRestored = false;
        GLOBAL_ACCESS_TOKEN = null;
        await session.defaultSession.clearStorageData({ storages: ['cookies'] });
        return { success: true };
    }

    let options = { method };
    if (body) {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify(body);
    }

    let res = await rawFetch(endpoint, options);
    
    if (res.status === 401) {
        const refreshRes = await refreshSession();
        if (refreshRes.success) {
            res = await rawFetch(endpoint, options);
        } else if (refreshRes.reason === 'unauthorized') {
            return { error: { code: "SESSION_EXPIRED", message: "Сессия истекла" } };
        } else {
            return { error: { code: "NETWORK_ERROR", message: "Ошибка сети" } };
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
            headers: { 'User-Agent': GLOBAL_USER_AGENT, 'Authorization': `Bearer ${GLOBAL_ACCESS_TOKEN}` },
            body: formData,
        });
        if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
        return { data: await response.json() };
    } catch (error) { return { error: { message: error.message } }; }
}

async function checkApiStatus() {
    const res = await rawFetch('/hashtags/trending?limit=1');
    return res.status < 500 && res.status !== 0;
}
async function quickInternetCheck() {
    try { await fetch('https://8.8.8.8', { method: 'HEAD', mode: 'no-cors' }); return true; } 
    catch { return false; }
}

module.exports = { rawFetch, refreshSession, apiCall, quickInternetCheck, checkApiStatus, uploadFileInternal, setGlobalAccessToken, getGlobalAccessToken, applyCookiesToSession, switchUserSession, captureAndSaveCookies };