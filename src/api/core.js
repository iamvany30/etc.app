 

/**
 * Базовая функция запроса к Electron API.
 * Обертывает window.api.call и обрабатывает ошибки транспорта.
 */
export const request = async (endpoint, method = 'GET', body = null) => {
    try {
        if (!window.api || typeof window.api.call !== 'function') {
            console.error("API bridge is not available (window.api missing).");
            throw new Error("INTERNAL_BRIDGE_ERROR");
        }
        
        const result = await window.api.call(endpoint, method, body);
        return result;
    } catch (e) {
        console.error(`API Error [${method} ${endpoint}]:`, e);
        return { error: { message: e.message, code: "CLIENT_transport_ERROR" } };
    }
};