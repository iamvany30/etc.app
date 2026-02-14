import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/TitleBar.css';

const NavBackIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>;
const NavForwardIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>;
const NavReloadIcon = () => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L20.5 10M3.5 14a9 9 0 0 0 14.85 3.36L1 18"/></svg>;

const TitleBar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [networkStatus, setNetworkStatus] = useState('online');
    const [canGoBack, setCanGoBack] = useState(false);

    const pageTitle = useMemo(() => {
        const path = location.pathname;
        if (path === '/') return 'Лента';
        if (path === '/explore') return 'Обзор';
        if (path === '/notifications') return 'Уведомления';
        if (path === '/music') return 'Музыка';
        if (path.startsWith('/profile/')) return `@${path.split('/')[2]}`;
        if (path.startsWith('/post/')) return 'Запись';
        return 'итд.app';
    }, [location]);

    useEffect(() => {
        setCanGoBack(window.history.state && window.history.state.idx > 0);
    }, [location]);

    useEffect(() => {
        const handleStatusChange = (e) => setNetworkStatus(e.detail);
        window.addEventListener('app-network-status', handleStatusChange);
        return () => window.removeEventListener('app-network-status', handleStatusChange);
    }, []);

    return (
        <header className={`modern-titlebar status-${networkStatus}`}>
            <div className="nav-controls">
                <button className="tb-btn" onClick={() => navigate(-1)} disabled={!canGoBack} title="Назад">
                    <NavBackIcon />
                </button>
                <button className="tb-btn" onClick={() => navigate(1)} title="Вперед">
                    <NavForwardIcon />
                </button>
                <button className="tb-btn reload" onClick={() => window.location.reload()} title="Обновить">
                    <NavReloadIcon />
                </button>
            </div>

            <div className="title-label">
                {networkStatus !== 'online' && <span className="status-dot"></span>}
                <span className="title-text-main">{pageTitle}</span>
            </div>

            <div className="window-system-controls">
                <button className="sys-btn" onClick={() => window.api?.window?.minimize()}>
                    <svg width="10" height="1" viewBox="0 0 10 1"><path d="M0 0h10v1H0z" fill="currentColor"/></svg>
                </button>
                <button className="sys-btn" onClick={() => window.api?.window?.maximize()}>
                    <svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 0v10h10V0H0zm9 9H1V1h8v8z" fill="currentColor"/></svg>
                </button>
                <button className="sys-btn close" onClick={() => window.api?.window?.close()}>
                    <svg width="10" height="10" viewBox="0 0 10 10"><path d="M10 1.41L8.59 0 5 3.59 1.41 0 0 1.41 3.59 5 0 8.59 1.41 10 5 6.41 8.59 10 10 8.59 6.41 5z" fill="currentColor"/></svg>
                </button>
            </div>
        </header>
    );
};

export default TitleBar;