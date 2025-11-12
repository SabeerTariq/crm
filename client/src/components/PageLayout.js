import React from 'react';
import Sidebar from './Sidebar';
import TodoSidebar from './TodoSidebar';
import NotificationSidebar from './NotificationSidebar';
import './PageLayout.css';

const PageLayout = ({ children, className = '' }) => {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div 
        className={`main-content ${className}`}
      >
        {children}
      </div>
      <TodoSidebar />
      <NotificationSidebar />
    </div>
  );
};

export default PageLayout;
