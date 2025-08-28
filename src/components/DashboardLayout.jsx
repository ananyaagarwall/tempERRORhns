import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Builder.jsx/Sidebar'; // Adjust import path if needed

const DashboardLayout = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  // Check if user is logged in and has appropriate role
  React.useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // If user is not admin and trying to access admin routes
    if (user.role !== 'admin' && window.location.pathname.startsWith('/dashboard/admin')) {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user) {
    return null; // Don't render anything while checking auth
  }

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