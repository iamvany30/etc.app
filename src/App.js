import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { UserProvider } from './context/UserContext';
import { ModalProvider } from './context/ModalContext';
import { MusicProvider } from './context/MusicContext';

import TitleBar from './components/TitleBar';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import NotificationWatcher from './components/NotificationWatcher';
import Snowfall from './components/Snowfall';
import GlobalPlayer from './components/GlobalPlayer'; 
import AuthFlow from './components/AuthFlow';

import Feed from './pages/Feed';
import Explore from './pages/Explore';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import PostDetails from './pages/PostDetails';
import Music from './pages/Music'; 
import OfflinePage from './pages/OfflinePage';
import './App.css';
import './styles/Auth.css';

function App() {
    const [snowEnabled, setSnowEnabled] = useState(localStorage.getItem('nowkie_snow_enabled') === 'true');

    useEffect(() => {
        const applyCustomTheme = async () => {
            const themeFolder = localStorage.getItem('itd_current_theme_folder');
            if (themeFolder) {
                try {
                     
                    const res = await window.api.invoke('themes:read-content', themeFolder);
                    if (res && res.content) {
                        let styleTag = document.getElementById('dynamic-theme-style');
                        if (!styleTag) {
                            styleTag = document.createElement('style');
                            styleTag.id = 'dynamic-theme-style';
                            document.head.appendChild(styleTag);
                        }
                        styleTag.textContent = res.content;
                    } else {
                         
                        localStorage.removeItem('itd_current_theme_folder');
                    }
                } catch (e) {
                    console.error("Failed to load custom theme at startup:", e);
                }
            }
        };

        const applySettings = () => {
            const bgMode = localStorage.getItem('nowkie_bg') || 'dim';
            const accent = localStorage.getItem('nowkie_accent') || '#1d9bf0';
            const isSnow = localStorage.getItem('nowkie_snow_enabled') === 'true';

            document.documentElement.setAttribute('data-bg', bgMode);
            document.documentElement.style.setProperty('--color-primary', accent);
            
            setSnowEnabled(isSnow);
        };
        
         
        applyCustomTheme().then(() => {
            applySettings();
        });

        window.addEventListener('settingsUpdate', applySettings);
        return () => window.removeEventListener('settingsUpdate', applySettings);
    }, []);

    return (
        <UserProvider>
            <MusicProvider>
                <Router>
                    <ModalProvider>
                        {snowEnabled && <Snowfall />}
                        <ErrorBoundary>
                            <TitleBar />
                        </ErrorBoundary>
                        <AuthFlow>
                            <NotificationWatcher />
                            <Layout>
                                <Routes>
                                    <Route path="/" element={<Feed />} />
                                    <Route path="/explore" element={<Explore />} />
                                    <Route path="/music" element={<Music />} />
                                    <Route path="/profile/:username" element={<Profile />} />
                                    <Route path="/notifications" element={<Notifications />} />
                                    <Route path="/post/:id" element={<PostDetails />} />
                                    <Route path="/offline" element={<OfflinePage />} />
                                    <Route path="*" element={<Navigate to="/" replace />} />
                                </Routes>
                            </Layout>
                            <GlobalPlayer />
                        </AuthFlow>
                    </ModalProvider>
                </Router>
            </MusicProvider>
        </UserProvider>
    );
}

export default App;