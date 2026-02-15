const fs = require('fs');
const { spawn } = require('child_process');
const { PATHS } = require('./config');
const { logDebug } = require('./logger');
const store = require('./store');
const network = require('./network');

/**
 * Глобальная переменная для хранения текущего процесса
 */
let currentAuthProcess = null;

/**
 * Запуск процесса авторизации
 */
async function handleStealthLogin(event) {
    
    if (currentAuthProcess) {
        logDebug("[Auth] Процесс уже запущен, повтор отклонен.");
        return { success: false, error: 'Already running' };
    }

    return new Promise((resolve) => {
        logDebug("=== СТАРТ STEALTH-АВТОРИЗАЦИИ ===");
        
        const helperPath = PATHS.BROWSER_HELPER;
        if (!fs.existsSync(helperPath)) {
            logDebug("❌ Ошибка: browser_helper.exe не найден");
            return resolve({ success: false, error: 'Helper missing' });
        }

        
        const child = spawn(helperPath, [], {
            env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
            windowsHide: true 
        });

        currentAuthProcess = child;
        let stdoutBuffer = '';
        let isResolved = false;

        child.stdout.setEncoding('utf8');
        child.stderr.setEncoding('utf8');

        
        child.stderr.on('data', (data) => {
            data.split('\n').forEach(line => {
                const clean = line.trim();
                if (clean && event?.sender && !event.sender.isDestroyed()) {
                    event.sender.send('auth-log', clean);
                }
            });
        });

        
        child.stdout.on('data', (data) => {
            stdoutBuffer += data;
            
            
            if (stdoutBuffer.includes('{') && stdoutBuffer.includes('}')) {
                try {
                    const start = stdoutBuffer.indexOf('{');
                    const end = stdoutBuffer.lastIndexOf('}');
                    const result = JSON.parse(stdoutBuffer.substring(start, end + 1));

                    if (result.success && result.token && !isResolved) {
                        isResolved = true;
                        logDebug("[Auth] Токен получен. Завершение процесса...");
                        
                        
                        store.saveRefreshToken(result.token);
                        
                        
                        if (currentAuthProcess) {
                            currentAuthProcess.kill('SIGKILL');
                            currentAuthProcess = null;
                        }

                        
                        resolve({ success: true });
                    }
                } catch (e) {
                    
                }
            }
        });

        
        child.on('close', (code) => {
            currentAuthProcess = null;
            if (!isResolved) {
                logDebug(`[Auth] Процесс завершен (код: ${code})`);
                resolve({ success: false, error: 'Window closed' });
            }
        });
    });
}

/**
 * Принудительная отмена (для кнопки "Перезапустить")
 */
async function cancelStealthLogin() {
    if (currentAuthProcess) {
        logDebug("[Auth] Ручная отмена процесса...");
        currentAuthProcess.kill('SIGKILL');
        currentAuthProcess = null;
        return { success: true };
    }
    return { success: false };
}


process.on('exit', () => {
    if (currentAuthProcess) currentAuthProcess.kill('SIGKILL');
});

module.exports = { handleStealthLogin, cancelStealthLogin };