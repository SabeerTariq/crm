import React from 'react';
import Sidebar from './Sidebar';
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
    </div>
  );
};

export default PageLayout;
