import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';

const Login = () => {
    const { setCurrentUser } = useUser();
    const [loading, setLoading] = useState(false);

    
    useEffect(() => {
        const handleSuccess = async () => {
            const user = await window.api.getInitUser();
            if (user) setCurrentUser(user);
        };
        
        
    }, [setCurrentUser]);

    const handleBrowserLogin = async () => {
        setLoading(true);
        
        await window.api.openAuth(); 
        
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="logo">итд</div>
                <h1>Вход в систему</h1>
                <p className="auth-subtitle">
                    Для защиты от ботов вход выполняется через ваш браузер.
                </p>
                
                <button 
                    className="auth-button" 
                    onClick={handleBrowserLogin} 
                    disabled={loading}
                    style={{ marginTop: 20 }}
                >
                    {loading ? 'Открываем браузер...' : 'Войти через браузер'}
                </button>
            </div>
        </div>
    );
};

export default Login;