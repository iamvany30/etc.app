import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';
import MobileNav from './MobileNav';
import '../styles/Layout.css';

const Layout = ({ children }) => {
     
    const [contentKey, setContentKey] = useState(0);

    useEffect(() => {
        const handleRefresh = () => {
            console.log("Hard refresh triggered for content");
             
            setContentKey(prev => prev + 1);
        };

        window.addEventListener('content-refresh', handleRefresh);
        return () => window.removeEventListener('content-refresh', handleRefresh);
    }, []);

    return (
        <div className="layout">
            <Sidebar />
            
              
            <main className="content" key={contentKey}>
                {children}
            </main>
            
            <RightSidebar />
            <MobileNav />
        </div>
    );
};

export default Layout;