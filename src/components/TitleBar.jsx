/* @source src/components/TitleBar.jsx */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { FeedCache } from '../core/FeedCache';
import { NavBackIcon, NavForwardIcon, NavReloadIcon } from './icons/CommonIcons';
import { WinMinimizeIcon, WinMaximizeIcon, WinCloseIcon } from './icons/CustomIcons';
import '../styles/TitleBar.css';

const TitleBar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    
    const [networkStatus, setNetworkStatus] = useState('online');
    const [canGoBack, setCanGoBack] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    
    const ticking = useRef(false);

    useEffect(() => {
        setCanGoBack(window.history.state && window.history.state.idx > 0);
    }, [location]);

    useEffect(() => {
        const handleStatusChange = (e) => setNetworkStatus(e.detail);
        window.addEventListener('app-network-status', handleStatusChange);
        
        const handleScroll = (e) => {
            if (!ticking.current) {
                window.requestAnimationFrame(() => {
                    const target = e.target;
                    
                    if (target === document || target === window) {
                        setIsScrolled(window.scrollY > 15);
                    } else if (
                        target.getAttribute('data-virtuoso-scroller') === 'true' ||
                        target.classList.contains('custom-scroll-area') ||
                        target.classList.contains('explore-scroll-area') ||
                        target.classList.contains('downloads-content') ||
                        target.classList.contains('music-content-scroll') ||
                        target.classList.contains('post-details-page')
                    ) {
                        setIsScrolled(target.scrollTop > 15);
                    }
                    
                    ticking.current = false;
                });
                ticking.current = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
        
        return () => {
            window.removeEventListener('app-network-status', handleStatusChange);
            window.removeEventListener('scroll', handleScroll, { capture: true });
        };
    }, []);

    const handleReload = (e) => {
        if (e.ctrlKey || e.metaKey) {
            window.location.reload();
        } else {
            FeedCache.clear(); 
            queryClient.invalidateQueries(); 
            window.dispatchEvent(new Event('content-refresh'));
        }
    };

    return (
        <header className={`app-titlebar status-${networkStatus} ${isScrolled ? 'is-scrolled' : ''}`}>
            
            <div className="titlebar-nav">
                <button className="nav-btn" onClick={() => navigate(-1)} disabled={!canGoBack}>
                    <NavBackIcon />
                </button>
                <button className="nav-btn" onClick={() => navigate(1)}>
                    <NavForwardIcon />
                </button>
                <button 
                    className="nav-btn reload" 
                    onClick={handleReload}
                    title="Обновить (Ctrl+Клик для полной перезагрузки окна)"
                >
                    <NavReloadIcon />
                </button>
            </div>

            <div className="window-controls">
                <button className="win-btn minimize" onClick={() => window.api?.window?.minimize()}>
                    <WinMinimizeIcon />
                </button>
                <button className="win-btn maximize" onClick={() => window.api?.window?.maximize()}>
                    <WinMaximizeIcon />
                </button>
                <button className="win-btn close" onClick={() => window.api?.window?.close()}>
                    <WinCloseIcon />
                </button>
            </div>
        </header>
    );
};

export default TitleBar;