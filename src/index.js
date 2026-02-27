/* @source src/index.js */
import React, { useState, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; 

import App from './App';
import { ThemeLoader } from './core/ThemeLoader';
import { FontLoader } from './core/FontLoader'; 
import { initIpcListeners } from './core/ipcManager';
import { useDownloadStore } from './store/downloadStore';
import { bookmarkUtils } from './utils/bookmarkUtils';
import { historyUtils } from './utils/historyUtils'; 

import { ContextMenuProvider } from './context/ContextMenuContext';
import { BrowserProvider } from './context/BrowserContext';

import './index.css';
import './App.css';

const queryClient = new QueryClient({
    defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 300000 } },
});

const setupDownloadListeners = () => {
    if (window.api && window.api.on) {
        window.api.on('download-progress', (data) => {
            useDownloadStore.getState().updateDownloadProgress(data);
        });
    }
};

const Bootstrapper = () => {
    const [isReady, setIsReady] = useState(false);

    useLayoutEffect(() => {
        const boot = async () => {
            try {
                await ThemeLoader.init(); 
                await FontLoader.init(); 
                
                await bookmarkUtils.init();
                await historyUtils.init(); 
                
                initIpcListeners();
                setupDownloadListeners();
            } catch (e) {
                console.error("[System] Boot failed:", e);
            } finally {
                setIsReady(true);
            }
        };
        boot();
    }, []);

    if (!isReady) return <div style={{ background: '#101214', height: '100vh', width: '100vw' }} />;

    return (
        <React.StrictMode>
            <QueryClientProvider client={queryClient}>
                <Router>
                    <BrowserProvider>
                        <ContextMenuProvider>
                            <App />
                        </ContextMenuProvider>
                    </BrowserProvider>
                </Router>
            </QueryClientProvider>
        </React.StrictMode>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Bootstrapper />);