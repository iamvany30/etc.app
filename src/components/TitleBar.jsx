import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/TitleBar.css';
import { NavBackIcon, NavForwardIcon, NavReloadIcon } from './icons/CommonIcons';

const TitleBar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [networkStatus, setNetworkStatus] = useState('online');
    const [canGoBack, setCanGoBack] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);


    useEffect(() => {
        setCanGoBack(window.history.state && window.history.state.idx > 0);
    }, [location]);

    useEffect(() => {
        const handleStatusChange = (e) => setNetworkStatus(e.detail);
        window.addEventListener('app-network-status', handleStatusChange);
        
        const handleScroll = (e) => {
            const target = e.target;
            if (target.closest && target.closest('[data-virtuoso-scroller="true"]')) {
                const scroller = target.closest('[data-virtuoso-scroller="true"]');
                setIsScrolled(scroller.scrollTop > 15);
            }
        };

        window.addEventListener('scroll', handleScroll, true);
        return () => {
            window.removeEventListener('app-network-status', handleStatusChange);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, []);

    return (
        <header className={`app-titlebar status-${networkStatus} ${isScrolled ? 'is-scrolled' : ''}`}>
            
            <div className="titlebar-nav">
                <button className="nav-btn" onClick={() => navigate(-1)} disabled={!canGoBack}>
                    <NavBackIcon />
                </button>
                <button className="nav-btn" onClick={() => navigate(1)}>
                    <NavForwardIcon />
                </button>
                <button className="nav-btn reload" onClick={() => window.location.reload()}>
                    <NavReloadIcon />
                </button>
            </div>

            <div className="window-controls">
                <button className="win-btn minimize" onClick={() => window.api?.window?.minimize()}>
                    <svg width="10" height="1" viewBox="0 0 10 1"><path d="M0 0h10v1H0z" fill="currentColor"/></svg>
                </button>
                <button className="win-btn maximize" onClick={() => window.api?.window?.maximize()}>
                    <svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 0v10h10V0H0zm9 9H1V1h8v8z" fill="currentColor"/></svg>
                </button>
                <button className="win-btn close" onClick={() => window.api?.window?.close()}>
                    <svg width="10" height="10" viewBox="0 0 10 10"><path d="M10 1.41L8.59 0 5 3.59 1.41 0 0 1.41 3.59 5 0 8.59 1.41 10 5 6.41 8.59 10 10 8.59 6.41 5z" fill="currentColor"/></svg>
                </button>
            </div>
        </header>
    );
};

export default TitleBar;