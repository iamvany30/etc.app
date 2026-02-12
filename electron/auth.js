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
        
        child.stderr.on('data', (data) => {
            const lines = data.toString('utf-8').split('\n');
            lines.forEach(l => {
                if (l.trim()) {
                    console.log(`[PYTHON] ${l.trim()}`);
                    event.sender.send('auth-log', l.trim());
                }
            });
        });

        child.stdout.on('data', (data) => {
            stdoutBuffer += data.toString('utf-8');
        });

        child.on('close', (code) => {
            logDebug(`Python процесс завершился. Код: ${code}`);
            logDebug("Полученный STDOUT (Raw):", stdoutBuffer);

            try {
                let cleanJson = stdoutBuffer.trim();
                const match = cleanJson.match(/(\{.*"success".*\})/s);
                if (match) cleanJson = match[1];

                logDebug("Очищенный JSON:", cleanJson);

                if (!cleanJson) throw new Error("Empty JSON");
                const result = JSON.parse(cleanJson);

                if (result.success && result.token) {
                    logDebug("Токен распознан. Запускаю процедуру сохранения...");
                    
                    store.saveRefreshToken(result.token);
                    
                    logDebug("Вызываю refreshSession для проверки...");
                    network.refreshSession().then(r => {
                        const win = getMainWindow();
                        if (r.success) {
                            logDebug("refreshSession вернул SUCCESS! Перезагружаю окно...");
                            event.sender.send('auth-log', '✅ ВХОД ВЫПОЛНЕН! ЗАГРУЗКА...');
                            setTimeout(() => {
                                if(win) win.reload();
                                resolve({ success: true });
                            }, 1000);
                        } else {
                            logDebug(`refreshSession вернул FAIL. Причина: ${r.reason}`);
                            event.sender.send('auth-log', `❌ Сервер не принял токен: ${r.reason}`);
                            resolve({ success: false, error: 'Token rejected' });
                        }
                    });
                } else {
                    logDebug("В JSON нет токена или success=false");
                    resolve({ success: false, error: result.error });
                }
            } catch (e) {
                logDebug("JSON Parse Error:", e.message);
                event.sender.send('auth-log', 'Ошибка обработки ответа');
                resolve({ success: false });
            }
        });
    });
}

module.exports = { handleStealthLogin };