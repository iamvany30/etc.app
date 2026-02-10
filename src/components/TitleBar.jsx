import React from 'react';
import '../styles/TitleBar.css';

const TitleBar = () => {
    const handleMinimize = () => window.api.window.minimize();
    const handleMaximize = () => window.api.window.maximize();
    const handleClose = () => window.api.window.close();

    return (
        <div className="titlebar">
            <div className="titlebar-left">
                { }
            </div>
            
            <div className="titlebar-center">
                итд.app
            </div>

            <div className="titlebar-right">
                <button className="title-button" onClick={handleMinimize}>
                    <svg viewBox="0 0 10 1">
                        <path d="M0 0h10v1H0z" fill="currentColor" />
                    </svg>
                </button>
                <button className="title-button" onClick={handleMaximize}>
                    <svg viewBox="0 0 10 10">
                        <path d="M0 0v10h10V0H0zm9 9H1V1h8v8z" fill="currentColor" />
                    </svg>
                </button>
                <button className="title-button close" onClick={handleClose}>
                    <svg viewBox="0 0 10 10">
                        <path d="M10 1.41L8.59 0 5 3.59 1.41 0 0 1.41 3.59 5 0 8.59 1.41 10 5 6.41 8.59 10 10 8.59 6.41 5z" fill="currentColor" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default TitleBar;