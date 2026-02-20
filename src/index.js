import React, { useState, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; 

import App from './App';
import { ThemeLoader } from './core/ThemeLoader';


import { UserProvider } from './context/UserContext';
import { ModalProvider } from './context/ModalContext';
import { MusicProvider } from './context/MusicContext';
import { UploadProvider } from './context/UploadContext';
import { DownloadProvider } from './context/DownloadContext';
import { ContextMenuProvider } from './context/ContextMenuContext';
import { IslandProvider } from './context/IslandContext';
import { AppearanceProvider } from './context/AppearanceContext';

import './index.css';
import './App.css';


const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 1000 * 60 * 5, 
        },
    },
});

const Bootstrapper = () => {
    const [isReady, setIsReady] = useState(false);
    const [themeError, setThemeError] = useState(null);

    useLayoutEffect(() => {
        const boot = async () => {
            try {
                const currentTheme = localStorage.getItem('itd_current_theme_folder');
                
                if (currentTheme && currentTheme !== 'default') {
                    console.log(`[System] Booting with theme: ${currentTheme}`);
                    await ThemeLoader.init(); 
                } else {
                    await ThemeLoader.init(); 
                }
            } catch (e) {
                console.error("[System] Boot failed:", e);
                setThemeError(e.message);
            } finally {
                setIsReady(true);
            }
        };

        boot();
    }, []);

    if (themeError) {
        return (
            <div style={{ padding: 40, color: 'white', background: '#101214', height: '100vh' }}>
                <h2>System Error</h2>
                <p>Failed to load theme engine.</p>
                <pre>{themeError}</pre>
                <button onClick={() => {
                    localStorage.removeItem('itd_current_theme_folder');
                    window.location.reload();
                }}>Reset to Default</button>
            </div>
        );
    }

    if (!isReady) {
        return <div style={{ background: 'var(--color-background, #101214)', height: '100vh', width: '100vw' }} />;
    }

    return (
        <React.StrictMode>
            {}
            <QueryClientProvider client={queryClient}>
                <Router>
                <AppearanceProvider>
                    <UserProvider>
                        <DownloadProvider>
                            <UploadProvider>
                                <MusicProvider>
                                    <ModalProvider> {}
                                        <IslandProvider>
                                            <ContextMenuProvider>
                                                <App />
                                            </ContextMenuProvider>
                                        </IslandProvider>
                                    </ModalProvider>
                                </MusicProvider>
                            </UploadProvider>
                        </DownloadProvider>
                    </UserProvider>
                </AppearanceProvider>
                </Router>
            </QueryClientProvider>
        </React.StrictMode>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Bootstrapper />);