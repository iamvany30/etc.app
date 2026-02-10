import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import '../styles/Auth.css';

const OtpVerification = () => {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { setCurrentUser } = useUser();
    const { email, password, flowToken } = location.state || {};

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !flowToken) {
            setError('Ошибка сессии. Попробуйте зарегистрироваться заново.');
            return;
        }
        setIsLoading(true);
        setError('');

        try {
            const result = await window.api.call('/v1/auth/verify-otp', 'POST', { email, password, otp, flowToken });

            if (result && result.user && result.accessToken) {
                setCurrentUser(result.user);
                localStorage.setItem('nowkie_user', JSON.stringify(result.user));
                navigate('/');
            } else {
                 setError(result?.error?.message || 'Неверный код или истекло время.');
            }
        } catch (err) {
            setError('Ошибка сети. Попробуйте снова.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1 className="auth-title">Подтверждение</h1>
                <p className="auth-subtitle">Мы отправили код на {email}</p>
                <form onSubmit={handleSubmit} className="auth-form">
                    {error && <div className="auth-error">{error}</div>}
                    <input
                        type="text"
                        placeholder="Код из письма"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        className="auth-input"
                        style={{ textAlign: 'center', letterSpacing: '0.5em' }}
                    />
                    <button type="submit" className="auth-button" disabled={isLoading}>
                        {isLoading ? 'Проверка...' : 'Подтвердить'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default OtpVerification;