import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';


import { UserProvider, useUser } from './context/UserContext';
import { ModalProvider } from './context/ModalContext';
import { MusicProvider } from './context/MusicContext';


import TitleBar from './components/TitleBar';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import NotificationWatcher from './components/NotificationWatcher';
import Snowfall from './components/Snowfall';
import GlobalPlayer from './components/GlobalPlayer'; 


import Feed from './pages/Feed';
import Explore from './pages/Explore';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import PostDetails from './pages/PostDetails';
import Music from './pages/Music'; 


import './App.css';
import './styles/TitleBar.css';
import './styles/Layout.css';
import './styles/PostCard.css';
import './styles/Feed.css';
import './styles/Profile.css';
import './styles/Explore.css';
import './styles/Modal.css';
import './styles/Sidebar.css';
import './styles/RightSidebar.css';
import './styles/VoicePlayer.css';
import './styles/ImageModal.css';
import './styles/Comment.css';
import './styles/GlobalPlayer.css';
import './styles/MusicLibrary.css';
import './styles/Skeleton.css';

/**
 * AppInitializer отвечает за проверку сессии при запуске приложения.
 * Находится внутри Router, чтобы иметь доступ к навигации.
 */
const AppInitializer = ({ children }) => {
    const { currentUser, setCurrentUser } = useUser();
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(false);

    useEffect(() => {
        const syncUser = async () => {
            if (window.api && window.api.getInitUser) {
                try {
                    const user = await window.api.getInitUser();
                    if (user && user.id) {
                        setCurrentUser(user);
                    } else {
                        setAuthError(true);
                    }
                } catch (e) {
                    console.error("User sync failed", e);
                    setAuthError(true);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };
        syncUser();
    }, [setCurrentUser]);

    const handleReLogin = async () => {
        setLoading(true);
        setAuthError(false);
        try {
            
            await window.api.openAuth(); 
            
        } catch (e) {
            setAuthError(true);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-indicator" style={{marginTop: 80}}>
                <div className="spinner"></div>
                <p>Загрузка данных итд...</p>
            </div>
        );
    }

    if (!currentUser || authError) {
        return (
            <div className="empty-state" style={{marginTop: 80}}>
                <h2>Вход не выполнен</h2>
                <p>Пожалуйста, авторизуйтесь для доступа к приложению.</p>
                <button 
                    onClick={handleReLogin}
                    style={{
                        marginTop: 20,
                        padding: '12px 24px',
                        background: 'var(--color-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '24px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    Войти через браузер
                </button>
            </div>
        );
    }

    return children;
};

function App() {
    const [snowEnabled, setSnowEnabled] = useState(localStorage.getItem('nowkie_snow_enabled') === 'true');

    useEffect(() => {
        const applySettings = () => {
            const currentTheme = localStorage.getItem('nowkie_theme') || 'dark';
            const isSnow = localStorage.getItem('nowkie_snow_enabled') === 'true';
            document.documentElement.setAttribute('data-theme', currentTheme);
            setSnowEnabled(isSnow);
        };

        applySettings();
        
        
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
                        
                        <AppInitializer>
                            
                            <NotificationWatcher />
                            
                            
                            <Layout>
                                <Routes>
                                    <Route path="/" element={<Feed />} />
                                    <Route path="/explore" element={<Explore />} />
                                    <Route path="/music" element={<Music />} />
                                    <Route path="/profile/:username" element={<Profile />} />
                                    <Route path="/notifications" element={<Notifications />} />
                                    <Route path="/post/:id" element={<PostDetails />} />
                                    
                                    
                                    <Route path="*" element={<Navigate to="/" replace />} />
                                </Routes>
                            </Layout>

                            
                            <GlobalPlayer />
                        </AppInitializer>
                    </ModalProvider>
                </Router>
            </MusicProvider>
        </UserProvider>
    );
}

export default App;