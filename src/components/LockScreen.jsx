/* @source src/components/LockScreen.jsx */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LockKeyhole, Scanner, ArrowLeft } from '@solar-icons/react';
import { useUserStore } from '../store/userStore';
import '../styles/LockScreen.css';

const LockScreen = () => {
    
    const [isLocked, setIsLocked] = useState(() => {
        const enabled = localStorage.getItem('itd_app_lock_enabled') === 'true';
        const pin = localStorage.getItem('itd_app_lock_pin');
        
        return enabled && typeof pin === 'string' && pin.length >= 4;
    });

    const [pinInput, setPinInput] = useState('');
    const [error, setError] = useState(false);
    const [showConfirmReset, setShowConfirmReset] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    const hasAutoScanned = useRef(false);

    
    useEffect(() => {
        if (!isLocked) return;

        const correctPin = localStorage.getItem('itd_app_lock_pin');

        
        if (!correctPin || correctPin.length < 4) return;

        if (pinInput === correctPin) {
            
            setIsLocked(false);
            setPinInput('');
        } else if (pinInput.length >= correctPin.length && pinInput !== correctPin) {
            
            setError(true);
            setTimeout(() => {
                setPinInput('');
                setError(false);
            }, 400);
        }
    }, [pinInput, isLocked]);

    const handleKey = useCallback((num) => {
        if (pinInput.length < 10 && !error && !showConfirmReset) {
            setPinInput(p => p + num);
        }
    }, [pinInput.length, error, showConfirmReset]);

    const handleDel = useCallback(() => {
        if (!showConfirmReset) {
            setPinInput(p => p.slice(0, -1));
        }
    }, [showConfirmReset]);

    
    const handleBiometric = useCallback(async (isAuto = false) => {
        if (showConfirmReset || isScanning || !isLocked) return;
        
        console.log(`[LockScreen] 🔒 Запуск биометрии. Авто-запуск: ${isAuto}`);
        setIsScanning(true);
        try {
            if (!window.api || !window.api.invoke) {
                throw new Error('Биометрия доступна только в десктопном приложении');
            }

            console.log('[LockScreen] ⏳ Ожидание ответа от ОС (Windows Hello)...');
            const res = await window.api.invoke('auth:biometric');
            
            console.log('[LockScreen] 📥 Ответ от ОС получен:', res);
            
            if (res && res.success === true) {
                console.log('[LockScreen] ✅ Доступ разрешен!');
                setIsLocked(false);
            } else {
                throw new Error(res?.error || 'Отмена сканирования или ошибка ОС');
            }
        } catch (e) {
            console.error('[LockScreen] ❌ Ошибка биометрии:', e.message);
            if (!isAuto) {
                setError(true);
                setTimeout(() => setError(false), 400);
            }
        } finally {
            setIsScanning(false);
            console.log('[LockScreen] ⏹️ Процесс сканирования завершен');
        }
    }, [showConfirmReset, isScanning, isLocked]);

    
    useEffect(() => {
        if (isLocked && !hasAutoScanned.current) {
            hasAutoScanned.current = true;
            
            const timer = setTimeout(() => {
                handleBiometric(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isLocked, handleBiometric]);

    
    const handleForgotPinConfirm = async () => {
        setIsLoggingOut(true);
        try {
            const store = useUserStore.getState();
            const current = store.currentUser;
            if (current) {
                await store.logoutAccount(current.id);
            }
            
            
            localStorage.removeItem('itd_app_lock_enabled');
            localStorage.removeItem('itd_app_lock_pin');
            
            window.location.reload();
        } catch (e) {
            setIsLoggingOut(false);
            setShowConfirmReset(false);
        }
    };

    
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isLocked) return;
            if (e.key >= '0' && e.key <= '9') {
                handleKey(e.key);
            } else if (e.key === 'Backspace') {
                handleDel();
            } else if (e.key === 'Escape' && showConfirmReset) {
                setShowConfirmReset(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isLocked, handleKey, handleDel, showConfirmReset]);

    if (!isLocked) return null;

    const correctPin = localStorage.getItem('itd_app_lock_pin');
    const pinLength = (correctPin && correctPin.length >= 4) ? correctPin.length : 4;

    return (
        <div className="lock-screen-wrapper">
            <div className={`lock-screen-content ${showConfirmReset ? 'blur-bg' : ''}`}>
                <div className="lock-header">
                    <div className="lock-icon-container">
                        <LockKeyhole size={42} variant="Bold" />
                    </div>
                    <h2 className="lock-title">Введите ПИН-код</h2>
                </div>
                
                <div className={`pin-dots-container ${error ? 'shake-error' : ''}`}>
                    {Array.from({ length: pinLength }).map((_, i) => (
                        <div key={i} className={`pin-dot ${i < pinInput.length ? 'filled' : ''}`} />
                    ))}
                </div>

                <div className="numpad-grid">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                        <button key={n} className="numpad-btn" onClick={() => handleKey(n.toString())}>
                            {n}
                        </button>
                    ))}
                    <button 
                        className={`numpad-btn action-btn ${isScanning ? 'scanning' : ''}`} 
                        onClick={() => handleBiometric(false)} 
                        title="Использовать биометрию"
                    >
                        <Scanner size={28} />
                    </button>
                    <button className="numpad-btn" onClick={() => handleKey('0')}>
                        0
                    </button>
                    <button className="numpad-btn action-btn" onClick={handleDel} title="Стереть">
                        <ArrowLeft size={28} />
                    </button>
                </div>

                <button className="forgot-pin-btn" onClick={() => setShowConfirmReset(true)}>
                    Забыли ПИН-код?
                </button>
            </div>

            {}
            {showConfirmReset && (
                <div className="lock-reset-overlay">
                    <div className="lock-reset-dialog">
                        <h3>Сбросить ПИН-код?</h3>
                        <p>Для сброса ПИН-кода необходимо выйти из текущего аккаунта. Вам потребуется заново авторизоваться в приложении.</p>
                        <div className="lock-reset-actions">
                            <button 
                                className="lock-reset-btn confirm" 
                                onClick={handleForgotPinConfirm}
                                disabled={isLoggingOut}
                            >
                                {isLoggingOut ? 'Выход...' : 'Выйти и сбросить'}
                            </button>
                            <button 
                                className="lock-reset-btn cancel" 
                                onClick={() => setShowConfirmReset(false)}
                                disabled={isLoggingOut}
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LockScreen;