

import React, { useEffect, useState, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DynamicComponent } from './core/ComponentRegistry';


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
import PresenceManager from './components/PresenceManager'; 
import ContextMenuManager from './components/ContextMenuManager';


import Feed from './pages/Feed';
import Explore from './pages/Explore';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import PostDetails from './pages/PostDetails';
import Music from './pages/Music';
import Login from './pages/Login';
import OfflinePage from './pages/OfflinePage';
import StatusPage from './pages/StatusPage';

import './App.css';
import './styles/Layout.css';

const DefaultLayout = ({ children }) => {
    return (
        <div className="layout">
            <DynamicComponent name="Layout.Sidebar" fallback={Sidebar} />
            <main className="content hide-scrollbar">
                {children}
            </main>
            <DynamicComponent name="Layout.RightSidebar" fallback={RightSidebar} />
        </div>
    );
};


const RouteEl = ({ name, fallback }) => (
    <div className="page-container">
        <DynamicComponent name={name} fallback={fallback} />
    </div>
);

function App() {
    const [snowEnabled, setSnowEnabled] = useState(localStorage.getItem('nowkie_snow_enabled') === 'true');

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
        window.addEventListener('settingsUpdate', applySettings);
        return () => window.removeEventListener('settingsUpdate', applySettings);
    }, [applySettings]);

    return (
        <>
            <CustomBackground />
            {snowEnabled && <Snowfall />}
            
            <ErrorBoundary>
                <TitleBar />
            </ErrorBoundary>

            <AuthFlow>
                <DynamicIsland />
                <ContextMenuManager />
                <NotificationWatcher />
                <PresenceManager />
                <ScrollToTop />

                <BottomDock />
                <UploadManager />

                <DynamicComponent name="Layout.MainWrapper" fallback={DefaultLayout}>
                    <Routes>
                        <Route path="/" element={<RouteEl name="Page.Feed" fallback={Feed} />} />
                        <Route path="/explore" element={<RouteEl name="Page.Explore" fallback={Explore} />} />
                        <Route path="/notifications" element={<RouteEl name="Page.Notifications" fallback={Notifications} />} />
                        <Route path="/music" element={<RouteEl name="Page.Music" fallback={Music} />} />
                        
                        <Route path="/profile/:username" element={<RouteEl name="Page.Profile" fallback={Profile} />} />
                        <Route path="/post/:id" element={<RouteEl name="Page.PostDetails" fallback={PostDetails} />} />
                        
                        <Route path="/status" element={<StatusPage />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/offline" element={<OfflinePage />} />
                        
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </DynamicComponent>
            </AuthFlow>
        </>
    );
}

export default App;