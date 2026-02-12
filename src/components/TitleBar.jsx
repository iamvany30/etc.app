import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/TitleBar.css';

 
const NavBackIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>;
const NavForwardIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>;
const NavReloadIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L20.5 10M3.5 14a9 9 0 0 0 14.85 3.36L1 18"/></svg>;

const TitleBar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
     
    const [canGoBack, setCanGoBack] = useState(false);
    
    useEffect(() => {
        setCanGoBack(window.history.state && window.history.state.idx > 0);
    }, [location]);

     
    const handleBack = () => navigate(-1);
    const handleForward = () => navigate(1);

     
    const handleReload = () => {
         
        window.dispatchEvent(new Event('content-refresh'));
    };

     
    const handleMinimize = () => window.api.window.minimize();
    const handleMaximize = () => window.api.window.maximize();
    const handleClose = () => window.api.window.close();

    return (
        <div className="titlebar">
            <div className="titlebar-left">
                <button className="title-button nav-button" onClick={handleBack} disabled={!canGoBack} title="Назад">
                    <NavBackIcon />
                </button>
                <button className="title-button nav-button" onClick={handleForward} title="Вперед">
                    <NavForwardIcon />
                </button>
                <button className="title-button nav-button" onClick={handleReload} title="Перезагрузить страницу">
                    <NavReloadIcon />
                </button>
            </div>
            
            <div className="titlebar-center">итд.app</div>

            <div className="titlebar-right">
                <button className="title-button" onClick={handleMinimize}><svg viewBox="0 0 10 1"><path d="M0 0h10v1H0z" fill="currentColor" /></svg></button>
                <button className="title-button" onClick={handleMaximize}><svg viewBox="0 0 10 10"><path d="M0 0v10h10V0H0zm9 9H1V1h8v8z" fill="currentColor" /></svg></button>
                <button className="title-button close" onClick={handleClose}><svg viewBox="0 0 10 10"><path d="M10 1.41L8.59 0 5 3.59 1.41 0 0 1.41 3.59 5 0 8.59 1.41 10 5 6.41 8.59 10 10 8.59 6.41 5z" fill="currentColor" /></svg></button>
            </div>
        </div>
    );
};

export default TitleBar;