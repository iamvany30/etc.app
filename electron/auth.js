const fs = require('fs');
const { spawn } = require('child_process');
const { PATHS } = require('./config');
const { logDebug } = require('./logger');
const store = require('./store');
const network = require('./network');
const { getMainWindow } = require('./window');

async function handleStealthLogin(event) {
    return new Promise((resolve) => {
        logDebug("=== ЗАПУСК STEALTH LOGIN ===");
        
        if (!fs.existsSync(PATHS.BROWSER_HELPER)) {
            logDebug("Ошибка: EXE не найден");
            return resolve({ success: false, error: 'Helper missing' });
        }

        const child = spawn(PATHS.BROWSER_HELPER);
        let stdoutBuffer = '';
        
        child.stdout.setEncoding('utf8');
        child.stderr.setEncoding('utf8');

        child.stderr.on('data', (data) => {
            const lines = data.split('\n');
            lines.forEach(l => {
                if (l.trim()) {
                    console.log(`[PYTHON] ${l.trim()}`);
                    event.sender.send('auth-log', l.trim());
                }
            });
        });

        child.stdout.on('data', (data) => {
            stdoutBuffer += data;
        });

        child.on('close', (code) => {
            logDebug(`Python процесс завершился. Код: ${code}`);
            
            try {
                const firstBrace = stdoutBuffer.indexOf('{');
                const lastBrace = stdoutBuffer.lastIndexOf('}');
                
                if (firstBrace === -1 || lastBrace === -1) {
                    throw new Error("JSON not found in output");
                }

                const cleanJson = stdoutBuffer.substring(firstBrace, lastBrace + 1);
                logDebug("Парсинг JSON:", cleanJson);

                const result = JSON.parse(cleanJson);

                if (result.success && result.token) {
                    logDebug("Токен распознан. Сохранение...");
                    store.saveRefreshToken(result.token);
                    
                    network.refreshSession().then(r => {
                        if (r.success) {
                            
                            
                            logDebug("refreshSession вернул SUCCESS! Отправляю сигнал в приложение.");
                            event.sender.send('auth-log', '✅ ВХОД ВЫПОЛНЕН! ЗАГРУЗКА...');
                            resolve({ success: true });
                        } else {
                            logDebug(`refreshSession вернул FAIL. Причина: ${r.reason}`);
                            event.sender.send('auth-log', `❌ Токен отклонен сервером: ${r.reason}`);
                            resolve({ success: false, error: 'Token rejected' });
                        }
                    });
                } else {
                    logDebug("Ошибка в JSON ответе:", result.error);
                    resolve({ success: false, error: result.error });
                }
            } catch (e) {
                logDebug("Ошибка обработки данных:", e.message);
                logDebug("Raw Buffer:", stdoutBuffer);
                event.sender.send('auth-log', 'Ошибка чтения данных от помощника');
                resolve({ success: false });
            }
        });
    });
}

module.exports = { handleStealthLogin };