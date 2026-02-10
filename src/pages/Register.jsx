import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Auth.css';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        try {
             
            const result = await window.api.call('/v1/auth/sign-up', 'POST', { 
                email, 
                password,
                turnstileToken: "itd-app-bypass"  
            });

            if (result && result.requiresVerification) {
                navigate('/register/otp', { state: { email, password, flowToken: result.flowToken } });
            } else {
                setError(result?.error?.message || 'Произошла ошибка регистрации.');
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
                <h1 className="auth-title">Создать аккаунт</h1>
                <p className="auth-subtitle">Присоединяйтесь к итд сегодня</p>
                <form onSubmit={handleSubmit} className="auth-form">
                    {error && <div className="auth-error">{error}</div>}
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="auth-input"
                    />
                    <input
                        type="password"
                        placeholder="Пароль (минимум 8 символов)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="auth-input"
                    />
                    <button type="submit" className="auth-button" disabled={isLoading}>
                        {isLoading ? 'Регистрация...' : 'Далее'}
                    </button>
                </form>
                <div className="auth-footer">
                    Уже есть аккаунт? <Link to="/login">Войти</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;