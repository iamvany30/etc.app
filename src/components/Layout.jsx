import React from 'react';
 
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';
import MobileNav from './MobileNav';

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <Sidebar />
      <main className="content">
        {children}
      </main>
      <RightSidebar />
      <MobileNav />
    </div>
  );
};

export default Layout;