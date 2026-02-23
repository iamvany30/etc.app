export const request = async (endpoint, method = 'GET', body = null) => {
    try {
        if (!window.api || typeof window.api.call !== 'function') {
            console.error("API bridge is not available (window.api missing).");
            throw new Error("INTERNAL_BRIDGE_ERROR");
        }
        
        const result = await window.api.call(endpoint, method, body);
        
        if (result?.error === 'Parse Error' || (result?.error && typeof result.error === 'string' && result.error.includes('Parse Error'))) {
            return {
                error: {
                    code: 'SERVER_ERROR',
                    message: result.raw || 'Произошла ошибка (неверный формат ответа)'
                }
            };
        }
        
        return result;
    } catch (e) {
        console.error(`API Error [${method} ${endpoint}]:`, e);
        return { error: { message: e.message, code: "CLIENT_TRANSPORT_ERROR" } };
    }
};