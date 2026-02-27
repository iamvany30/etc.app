/* @source src/App.js */
import React, { useEffect, useState, useCallback, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';


import { useUserStore } from './store/userStore'; 
import { useMusicStore } from './store/musicStore';
import { useDownloadStore } from './store/downloadStore';


import { DynamicComponent } from './core/ComponentRegistry';
import { updateRemoteAllowedLinks } from './utils/linkUtils';


import Sidebar from './components/Sidebar';
import RightSidebar from './components/RightSidebar';
import BottomDock from './components/BottomDock'; 
import ScrollToTop from './components/ScrollToTop'; 
import TitleBar from './components/TitleBar';
import ErrorBoundary from './components/ErrorBoundary';
import Snowfall from './components/Snowfall';
import UploadManager from './components/UploadManager';
import DynamicIsland from './components/DynamicIsland';
import CustomBackground from './components/CustomBackground';
import AuthFlow from './components/AuthFlow';
import NotificationWatcher from './components/NotificationWatcher';
import DownloadWatcher from './components/DownloadWatcher'; 
import PresenceManager from './components/PresenceManager'; 
import ContextMenuManager from './components/ContextMenuManager';
import DiscordManager from './components/DiscordManager'; 
import InternalBrowser from './components/InternalBrowser';
import ModalManager from './components/ModalManager';
import AccountSwitchOverlay from './components/AccountSwitchOverlay';
import AnnouncementWatcher from './components/AnnouncementWatcher';
import ServerStatusWatcher from './components/ServerStatusWatcher'; 
import LockScreen from './components/LockScreen';


import './App.css';
import './styles/Layout.css';


const Feed = lazy(() => import('./pages/Feed'));
const Explore = lazy(() => import('./pages/Explore'));
const Profile = lazy(() => import('./pages/Profile'));
const Notifications = lazy(() => import('./pages/Notifications'));
const PostDetails = lazy(() => import('./pages/PostDetails'));
const Music = lazy(() => import('./pages/Music'));
const Login = lazy(() => import('./pages/Login'));
const Downloads = lazy(() => import('./pages/Downloads'));
const Bookmarks = lazy(() => import('./pages/Bookmarks'));
const RecentPosts = lazy(() => import('./pages/RecentPosts'));
const DevPage = lazy(() => import('./pages/DevPage'));



const PageLoader = () => (
    <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%', 
        width: '100%',
        color: 'var(--color-text-secondary)'
    }}>
        <div className="spinner-mini" style={{ width: 24, height: 24, borderWidth: 3 }} />
    </div>
);

const DefaultLayout = () => {
    const [contentKey, setContentKey] = useState(0);

    useEffect(() => {
        const handleRefresh = () => setContentKey(prev => prev + 1);
        window.addEventListener('content-refresh', handleRefresh);
        return () => window.removeEventListener('content-refresh', handleRefresh);
    }, []);

    return (
        <div className="layout">
            <DynamicComponent name="Layout.Sidebar" fallback={Sidebar} />
            <main className="content hide-scrollbar" key={contentKey}>
                <Suspense fallback={<PageLoader />}>
                    <Outlet />
                </Suspense>
            </main>
            <DynamicComponent name="Layout.RightSidebar" fallback={RightSidebar} />
        </div>
    );
};


const RouteEl = ({ name, fallback: Fallback }) => (
    <div className="page-container">
        <Suspense fallback={<PageLoader />}>
            <DynamicComponent name={name} fallback={Fallback} />
        </Suspense>
    </div>
);

function App() {
    
    const currentUser = useUserStore(state => state.currentUser);
    const switchingTarget = useUserStore(state => state.switchingTarget);
    const isOverlayExiting = useUserStore(state => state.isOverlayExiting);
    
    const [snowEnabled, setSnowEnabled] = useState(localStorage.getItem('nowkie_snow_enabled') === 'true');
    const navigate = useNavigate();
    const location = useLocation();

    const isDevWindow = location.pathname === '/dev' || location.pathname === '#/dev';

    
    useEffect(() => {
        
        if (process.env.NODE_ENV === 'production' && !isDevWindow) return;
        if (!window.api?.invoke) return;

        const syncInterval = setInterval(() => {
            try {
                
                
                window.api.invoke('debug:update-state-snapshot', {
                    user: {
                        currentUser: useUserStore.getState().currentUser?.id,
                        accountsCount: useUserStore.getState().accounts.length
                    },
                    music: {
                        isPlaying: useMusicStore.getState().isPlaying,
                        currentTrack: useMusicStore.getState().currentTrack?.title
                    },
                    download: {
                        activeCount: Object.keys(useDownloadStore.getState().downloads).length
                    }
                });
            } catch (e) {
                
            }
        }, 2000); 

        return () => clearInterval(syncInterval);
    }, [isDevWindow]);

    const applySettings = useCallback(() => {
        const bgMode = localStorage.getItem('nowkie_bg') || 'dim';
        const accent = localStorage.getItem('nowkie_accent') || '#1d9bf0';
        const isSnow = localStorage.getItem('nowkie_snow_enabled') === 'true';
        const perfMode = localStorage.getItem('nowkie_perf_mode') || 'high';

        document.documentElement.setAttribute('data-bg', bgMode);
        document.documentElement.setAttribute('data-perf', perfMode);
        document.documentElement.style.setProperty('--color-primary', accent);
        
        const hexToRgb = (hex) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `${r}, ${g}, ${b}`;
        };
        document.documentElement.style.setProperty('--color-primary-rgb', hexToRgb(accent));
        
        const glassRGB = bgMode === 'black' ? '0,0,0' : (bgMode === 'dim' ? '21,32,43' : '255,255,255');
        document.documentElement.style.setProperty('--glass-bg-rgb', glassRGB);

        setSnowEnabled(isSnow);
    }, []);

    useEffect(() => {
        applySettings();
        updateRemoteAllowedLinks();
        window.addEventListener('settingsUpdate', applySettings);
        return () => window.removeEventListener('settingsUpdate', applySettings);
    }, [applySettings]);
    
    useEffect(() => {
        if (!window.api?.on) return;
        const unsubscribe = window.api.on('navigate-to', (path) => {
            if (path) setTimeout(() => navigate(path), 50);
        });
        return () => unsubscribe();
    }, [navigate]);

    
    if (isDevWindow) {
        return (
            <React.Fragment>
                <ModalManager />
                <DynamicIsland />
                <ContextMenuManager />
                <Suspense fallback={<PageLoader />}>
                    <Routes>
                        <Route path="/dev" element={<DevPage />} />
                    </Routes>
                </Suspense>
            </React.Fragment>
        );
    }

    return (
        <>
            <CustomBackground />
            <AccountSwitchOverlay targetUser={switchingTarget} isExiting={isOverlayExiting} />
            {snowEnabled && <Snowfall />}
            <ErrorBoundary><TitleBar /></ErrorBoundary>
            <ModalManager />
            <LockScreen />

            <AuthFlow>
                {}
                <React.Fragment key={currentUser?.id || 'guest'}>
                    <DynamicIsland />
                    <ContextMenuManager />
                    
                    {}
                    <NotificationWatcher />
                    <DownloadWatcher />
                    <AnnouncementWatcher />
                    <ServerStatusWatcher /> 
                    <PresenceManager />
                    <DiscordManager />
                    
                    {}
                    <ScrollToTop />
                    <BottomDock />
                    <UploadManager />
                    <InternalBrowser />

                    <Suspense fallback={<PageLoader />}>
                        <Routes>
                            <Route element={<DefaultLayout />}>
                                <Route path="/" element={<RouteEl name="Page.Feed" fallback={Feed} />} />
                                <Route path="/explore" element={<RouteEl name="Page.Explore" fallback={Explore} />} />
                                <Route path="/notifications" element={<RouteEl name="Page.Notifications" fallback={Notifications} />} />
                                <Route path="/music" element={<RouteEl name="Page.Music" fallback={Music} />} />
                                <Route path="/profile/:username" element={<RouteEl name="Page.Profile" fallback={Profile} />} />
                                <Route path="/post/:id" element={<RouteEl name="Page.PostDetails" fallback={PostDetails} />} />
                                <Route path="/downloads" element={<Downloads />} />
                                <Route path="/bookmarks" element={<RouteEl name="Page.Bookmarks" fallback={Bookmarks} />} />
                                <Route path="/recent" element={<RouteEl name="Page.RecentPosts" fallback={RecentPosts} />} />
                            </Route>

                            <Route path="/login" element={<Login />} />
                            <Route path="/login/refresh_token/:token" element={<Login />} />
                            
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </Suspense>
                </React.Fragment>
            </AuthFlow>
        </>
    );
}

export default App;