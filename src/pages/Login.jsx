import React, { useState, useEffect } from 'react'; 
import '../styles/Auth.css';

const ChromeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle><line x1="21.17" y1="8" x2="12" y2="8"></line><line x1="3.95" y1="6.06" x2="8.54" y2="14"></line><line x1="10.88" y1="21.94" x2="15.46" y2="14"></line></svg>;
const InfoIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginTop: '2px'}}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>;

const Login = ({ onLoginSuccess }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    
    const updateStatusFromLog = (rawLog) => {
        const msg = rawLog.toLowerCase();
        if (msg.includes('запуск')) setStatusMessage('Запускаю службы авторизации...');
        else if (msg.includes('открываю страницу')) setStatusMessage('Открываю окно входа...');
        else if (msg.includes('cloudflare') || msg.includes('капчу')) setStatusMessage('Прохожу проверку безопасности...');
        else if (msg.includes('поиск') || msg.includes('вижу куки')) setStatusMessage('Ищу активную сессию в браузере...');
        else if (msg.includes('успех') || msg.includes('токен найден')) setStatusMessage('Сессия найдена! Завершение...');
        else if (msg.includes('ошибка') || msg.includes('неудача')) setStatusMessage('Ошибка. Пожалуйста, попробуйте еще раз.');
    };

    useEffect(() => {
        if (!window.api || !isProcessing) return;
        const cleanup = window.api.onAuthLog(updateStatusFromLog);
        return cleanup;
    }, [isProcessing]);

    const handleExternalLogin = async () => {
        setIsProcessing(true);
        setStatusMessage('Инициализация...');
        try {
            const res = await window.api.openStealthLogin();
            if (res.success) {
                onLoginSuccess();
            } else {
                setIsProcessing(false);
                setStatusMessage('Не удалось войти. Попробуйте еще раз.');
            }
        } catch (e) {
            setIsProcessing(false);
            setStatusMessage(`Критическая ошибка: ${e.message}`);
        }
    };
    
    const renderContent = () => {
        if (isProcessing) {
            return (
                <div className="auth-status-indicator">
                    <div className="spinner"></div>
                    <p>{statusMessage}</p>
                </div>
            );
        }

        return (
            <div className="auth-content fade-in">
                <h1 className="auth-title">Вход в итд.app</h1>
                <p className="auth-desc">
                    Для безопасного входа мы используем ваш браузер. Нажмите кнопку, чтобы начать.
                </p>
                <button className="auth-btn-primary" onClick={handleExternalLogin}>
                    <ChromeIcon />
                    <span>Войти через браузер</span>
                </button>
            </div>
        );
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="logo-main">итд</div>
                
                {renderContent()}

                {!isProcessing && (
                    <details className="auth-explanation-details">
                        <summary>
                            <InfoIcon />
                            Почему такой вход?
                        </summary>
                        <div className="explanation-content">
                            <p>
                                <strong>итд.app</strong> — это неофициальный клиент. Официальный сайт защищен системой, которая не позволяет входить напрямую.
                            </p>
                            <p>
                                Мы используем ваш обычный браузер (Chrome/Edge), чтобы безопасно получить временный ключ сессии.
                            </p>
                            <ul>
                                <li>✅ <strong>Это безопасно.</strong> Ваш пароль не передается приложению.</li>
                                <li>🔑 Мы получаем только токен, который хранится в зашифрованном виде.</li>
                            </ul>
                        </div>
                    </details>
                )}
            </div>
        </div>
    );
};

export default Login;