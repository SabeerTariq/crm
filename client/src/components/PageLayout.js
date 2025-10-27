import React from 'react';
import Sidebar from './Sidebar';
import TodoSidebar from './TodoSidebar';
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
    </div>
  );
};

export default PageLayout;
