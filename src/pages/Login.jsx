/* @source src/pages/Login.jsx */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useModalStore } from '../store/modalStore';
import { useUserStore } from '../store/userStore';
import LogDumpModal from '../components/modals/LogDumpModal';
import ExtensionGuideModal from '../components/modals/ExtensionGuideModal';
import { 
    Key, 
    AltArrowRight, 
    AltArrowLeft, 
    Copy, 
    DangerCircle, 
    ServerSquare,
    squaretransfervertical
} from "@solar-icons/react";
import '../styles/Auth.css';

const Login = () => {
    const navigate = useNavigate();
    const { token: urlToken } = useParams(); 
    
    const openModal = useModalStore(state => state.openModal);
    const currentUser = useUserStore(state => state.currentUser);
    
    const [token, setToken] = useState(urlToken || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const autoLoginAttempted = useRef(false);

    const executeLogin = async (tokenStr) => {
        if (!tokenStr || !tokenStr.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            await new Promise(r => setTimeout(r, 600));

            const cleanToken = tokenStr.trim().replace(/^"|"$/g, '');
            const response = await window.api.invoke('auth:token-login', cleanToken);

            if (response.success) {
                window.location.hash = '/';
                setTimeout(() => {
                    window.location.reload();
                }, 50);
            } else {
                setError(response.error || "Неверный токен или сессия истекла");
            }
        } catch (err) {
            setError("Ошибка приложения: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (urlToken && !autoLoginAttempted.current) {
            autoLoginAttempted.current = true;
            
            const lastUsedToken = sessionStorage.getItem('itd_last_auto_token');
            if (lastUsedToken === urlToken) {
                navigate('/');
                return;
            }

            sessionStorage.setItem('itd_last_auto_token', urlToken);
            executeLogin(urlToken);
        }
    }, [urlToken, navigate]);

    const handleLogin = (e) => {
        if (e) e.preventDefault();
        executeLogin(token);
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setToken(text);
            setError(null);
        } catch (e) {
            console.error("Paste failed", e);
        }
    };

    const handleExtensionLogin = () => {
        
        openModal(<ExtensionGuideModal />);
    };

    return (
        <div className="login-page">
            <div className="login-ambient-glow" />
            <div className="login-grid-bg" />

            {currentUser && (
                <div className="login-top-nav fade-in-up" style={{ animationDelay: '0ms' }}>
                    <button className="login-back-pill" onClick={() => navigate(-1)}>
                        <AltArrowLeft size={20} />
                        <span>Вернуться назад</span>
                    </button>
                </div>
            )}

            <div className="login-content">
                <div className="login-header fade-in-up" style={{ animationDelay: '100ms' }}>
                    <div className="login-logo-wrapper">
                        <img 
                            src={`${process.env.PUBLIC_URL}/etc.app.png`} 
                            alt="итд.app" 
                            className="login-logo" 
                        />
                    </div>
                    <h1 className="login-title">
                        {urlToken ? 'Авторизация...' : (currentUser ? 'Добавить аккаунт' : 'Вход в сеть')}
                    </h1>
                    <p className="login-subtitle">
                        Используйте <span>Refresh Token</span> для доступа к аккаунту<br/>в обход ограничений Cloudflare.
                    </p>
                </div>

                <form className="login-form fade-in-up" style={{ animationDelay: '200ms' }} onSubmit={handleLogin}>
                    <div className={`login-input-group ${token ? 'has-value' : ''} ${error ? 'has-error' : ''}`}>
                        <div className="input-icon">
                            <Key size={20} />
                        </div>
                        
                        <input
                            type="text"
                            className="login-input"
                            placeholder="Вставьте токен сюда..."
                            value={token}
                            onChange={(e) => { setToken(e.target.value); setError(null); }}
                            autoFocus
                        />

                        {!token && (
                            <button type="button" className="input-action-btn" onClick={handlePaste} title="Вставить">
                                <Copy size={18} />
                                <span>Вставить</span>
                            </button>
                        )}
                    </div>

                    {error && (
                        <div className="login-error-msg">
                            <DangerCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="login-submit-btn" 
                        disabled={isLoading || !token.trim()}
                    >
                        {isLoading ? (
                            <div className="login-spinner" />
                        ) : (
                            <>
                                <span>Войти</span>
                                <AltArrowRight size={20} />
                            </>
                        )}
                    </button>

                    {!urlToken && (
                        <>
                            <div className="login-divider">
                                <span>ИЛИ</span>
                            </div>
                            <button 
                                type="button" 
                                className="login-ext-btn" 
                                onClick={handleExtensionLogin}
                            >
                                <squaretransfervertical size={20} />
                                <span>Вход через расширение</span>
                            </button>
                        </>
                    )}
                </form>

                <div className="login-footer fade-in-up" style={{ animationDelay: '300ms' }}>
                    <div className="login-secondary-actions centered">
                        <button className="sec-btn" onClick={() => openModal(<LogDumpModal />)}>
                            <ServerSquare size={18} />
                            <span>Проблемы со входом?</span>
                        </button>
                    </div>
                    
                    <p className="login-copyright">
                        © 2026 итд.app
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;