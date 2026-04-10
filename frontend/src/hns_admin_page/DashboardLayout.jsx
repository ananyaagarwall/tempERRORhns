import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Builder.jsx/Sidebar'; // Adjust import path if needed

const DashboardLayout = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <Sidebar />
      <div style={{ 
        flexGrow: 1, 
        padding: '20px', 
        boxSizing: 'border-box', 
        overflowY: 'auto',
        backgroundColor: '#f3f4f6'
      }}>
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout; 
