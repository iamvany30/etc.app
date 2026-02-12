import React from 'react';

const OfflineIcon = () => (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--color-text-secondary)'}}>
        <line x1="1" y1="1" x2="23" y2="23"></line>
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.11M1 10.44a11.13 11.13 0 0 1 2.3-3.6M8.6 3.3a11.4 11.4 0 0 1 3.4-1.22M4.26 6.26A11.09 11.09 0 0 1 8 4.79"></path>
        <path d="M11.6 16.21A2.5 2.5 0 0 1 10.2 13M12.9 18.23a6.83 6.83 0 0 1-1.7.27c-3.87 0-7-3.13-7-7a7.07 7.07 0 0 1 2.05-4.94"></path>
        <path d="M17.74 17.74c1.1-1.1.92-3.34.22-4.83a7.48 7.48 0 0 0-4.13-4.13c-1.49-.7-3.73-.88-4.83.22"></path>
    </svg>
);

const OfflinePage = ({ onRetry }) => {
    return (
        <div className="auth-container" style={{height: 'calc(100vh - 32px)'}}>
            <div style={{textAlign: 'center', color: 'var(--color-text)'}}>
                <OfflineIcon />
                <h2 style={{fontSize: '24px', fontWeight: '800', margin: '24px 0 8px 0'}}>Нет подключения к сети</h2>
                <p style={{color: 'var(--color-text-secondary)', maxWidth: '300px', margin: '0 auto 24px auto'}}>
                    Проверьте ваше интернет-соединение и попробуйте снова.
                </p>
                <button 
                    className="auth-button"
                    onClick={onRetry}
                >
                    Повторить
                </button>
            </div>
        </div>
    );
};

export default OfflinePage;