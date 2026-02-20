import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useModal } from '../context/ModalContext';
import { useUser } from '../context/UserContext';
import LogDumpModal from '../components/modals/LogDumpModal';
import '../styles/Auth.css';

const ManualIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);

const BugIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 23V1M18 5l-6-4-6 4M6 12h12M6 17h12M6 7h12" opacity="0.5"/>
        <rect x="8" y="2" width="8" height="20" rx="2" />
        <path d="M4 10h16" />
    </svg>
);

const Login = () => {
    const navigate = useNavigate();
    const { openModal } = useModal();
    const { currentUser } = useUser();

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="logo-main">итд.app</div>
                
                <div className="auth-content fade-in">
                    <h1 className="auth-title">
                        {currentUser ? 'Новый аккаунт' : 'Вход в сеть'}
                    </h1>
                    <p className="auth-desc">
                        В этой версии доступна только ручная авторизация через импорт Cookies. 
                        Это самый надежный способ обойти блокировки Cloudflare.
                    </p>

                    <button className="auth-btn-rocket" onClick={() => navigate('/login/manual')}>
                        <span>Войти по инструкции</span>
                        <ManualIcon />
                    </button>

                    <div className="auth-footer-actions">
                        <button className="logs-trigger-btn" onClick={() => openModal(<LogDumpModal />)}>
                            <BugIcon />
                            <span>Создать отчет об ошибке (ZIP)</span>
                        </button>
                        
                        <button 
                            className="auth-btn-secondary" 
                            onClick={() => navigate('/status')}
                            style={{ marginTop: '10px', fontSize: '11px', opacity: 0.4 }}
                        >
                            Проверить статус серверов
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;