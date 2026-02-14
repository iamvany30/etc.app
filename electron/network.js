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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
        const response = await fetch(url, { ...options, headers, signal: controller.signal });
        clearTimeout(timeoutId);
        if (response.status === 204) return { ok: true, data: { success: true } };
        const text = await response.text();
        let data;
        try { data = JSON.parse(text); } catch (e) { data = { error: { message: `Server Error (${response.status})` } }; }
        return { ok: response.ok, status: response.status, data, headers: response.headers };
    } catch (e) {
        clearTimeout(timeoutId);
        return { ok: false, status: 0, error: e.message, code: 'NETWORK_ERROR' };
    }
}

async function refreshSession() {
    logDebug(">>> НАЧАЛО refreshSession");
    const token = store.loadRefreshToken();
    if (!token) return { success: false, reason: 'no_token' };
    const headers = { 'Content-Type': 'application/json', 'Cookie': `refresh_token=${token}` };
    const res = await rawFetch('/v1/auth/refresh', {
        method: 'POST', headers, body: JSON.stringify({ refreshToken: token })
    });
    if (res.ok && res.data?.accessToken) {
        store.setAccessToken(res.data.accessToken);
        const setCookie = res.headers?.get('set-cookie');
        const newToken = setCookie?.match(/refresh_token=([^;]+)/)?.[1] || res.data.refreshToken;
        if (newToken) store.saveRefreshToken(newToken);
        store.resetFailureCount();
        return { success: true };
    }
    if (res.status === 429 || res.code === 'NETWORK_ERROR' || res.status === 0) return { success: false, reason: 'network_error' };
    if (res.status === 401 || res.status === 403) {
        store.incrementFailureCount();
        if (store.getFailureCount() >= 5) { store.clearRefreshToken(); return { success: false, reason: 'token_invalid_permanent' }; }
    }
    return { success: false, reason: 'token_invalid_temporary' };
}

async function apiCall(endpoint, method = 'GET', body = null) {
    if (endpoint.includes('/logout')) { await rawFetch(endpoint, { method: 'POST' }); store.clearRefreshToken(); return { success: true }; }
    let options = { method };
    if (body) { options.headers = { 'Content-Type': 'application/json' }; options.body = JSON.stringify(body); }
    let res = await rawFetch(endpoint, options);
    if (res.status === 401 && endpoint !== '/v1/auth/refresh') {
        const refreshed = await refreshSession();
        if (refreshed.success) res = await rawFetch(endpoint, options);
    }
    return res.data || { error: { message: 'Server error' } };
}


async function checkApiStatus() {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 3500);
    try {
        const res = await fetch(`${API_BASE}/hashtags/trending?limit=1`, { method: 'HEAD', signal: tid.signal });
        clearTimeout(tid);
        return res.status < 500 && res.status !== 0;
    } catch { return false; }
}


async function quickInternetCheck() {
    const hosts = ['https://8.8.8.8', 'https://1.1.1.1', 'https://www.google.com'];
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 3000);
    try {
        await Promise.any(hosts.map(url => fetch(url, { method: 'HEAD', mode: 'no-cors', signal: controller.signal })));
        clearTimeout(tid);
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
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 4000);
        try {
            const isApi = c.name.includes('API');
            const res = await fetch(c.url, { method: 'HEAD', mode: isApi ? 'cors' : 'no-cors', signal: controller.signal });
            clearTimeout(tid);
            if (isApi && res.status >= 500) throw new Error();
            return { name: c.name, status: 'ok', ping: Date.now() - start };
        } catch {
            clearTimeout(tid);
            return { name: c.name, status: 'fail' };
        }
    }));
}

module.exports = { rawFetch, refreshSession, apiCall, quickInternetCheck, runDetailedDiagnostics, checkApiStatus };