import React, { useEffect, useState, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';  
import { DynamicComponent } from './core/ComponentRegistry';

import Sidebar from './components/Sidebar';
import RightSidebar from './components/RightSidebar';
import MobileNav from './components/MobileNav';
import GlobalPlayer from './components/GlobalPlayer';
import AuthFlow from './components/AuthFlow';
import TitleBar from './components/TitleBar';
import ErrorBoundary from './components/ErrorBoundary';
import NotificationWatcher from './components/NotificationWatcher';
import Snowfall from './components/Snowfall';

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
            <DynamicComponent name="Layout.MobileNav" fallback={MobileNav} />
            <DynamicComponent name="Global.Player" fallback={GlobalPlayer} />
        </div>
    );
};

 
 
const AnimatedPage = ({ children }) => {
     
    const location = useLocation();
    
    return (
        <div 
            key={location.pathname} 
            className="page-enter-active"
        >
            {children}
        </div>
    );
};

 
const RouteEl = ({ name, fallback }) => (
    <AnimatedPage>
        <DynamicComponent name={name} fallback={fallback} />
    </AnimatedPage>
);

function App() {
    const [snowEnabled, setSnowEnabled] = useState(localStorage.getItem('nowkie_snow_enabled') === 'true');

    const applySettings = useCallback(() => {
        const bgMode = localStorage.getItem('nowkie_bg') || 'dim';
        const accent = localStorage.getItem('nowkie_accent') || '#1d9bf0';
        const isSnow = localStorage.getItem('nowkie_snow_enabled') === 'true';

        document.documentElement.setAttribute('data-bg', bgMode);
        document.documentElement.style.setProperty('--color-primary', accent);
        setSnowEnabled(isSnow);
    }, []);

    useEffect(() => {
        applySettings();
        window.addEventListener('settingsUpdate', applySettings);
        return () => window.removeEventListener('settingsUpdate', applySettings);
    }, [applySettings]);

    return (
        <>
            {snowEnabled && <Snowfall />}
            <ErrorBoundary>
                <TitleBar />
            </ErrorBoundary>

            <AuthFlow>
                <NotificationWatcher />
                
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