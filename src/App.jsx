import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Signup from './components/Signup';
import AdminDashboard from './components/AdminDashboard';
import './App.css';
import AddBuilder from './components/Builder.jsx/addBuilder';
import BlogManagement from './components/BlogManagement';
import AdminBlog from './components/AdminBlog';
import ManagePropertyInBuilderProfile from './components/Builder.jsx/ManagePropertyInBuilderProfile';
import PropertiesManagement from './components/PropertiesManagement';
import ProjectAdd from './components/ProjectAdd';
import DashboardLayout from './components/DashboardLayout';
import LandingPage from './components/LandingPage/LandingPage';
import BlogLanding from './components/BlogLanding';
import BlogDetail from './components/BlogDetail';
import FooterNavBar from './components/LandingPage/FooterNavBar';
import ProjectList from './components/ProjectList';
import Property from './components/property';
import GeoLocation from './components/Builder.jsx/geoLocation';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    return <Navigate to="/login" />;
  }
  return children;
};

// Admin Route component
const AdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" />;
  }
  return children;
};

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route path="admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="add-builder" element={
            <AdminRoute>
              <AddBuilder />
            </AdminRoute>
          } />
          <Route path="blogs" element={
            <AdminRoute>
              <BlogManagement />
            </AdminRoute>
          } />
          <Route path="create-blog" element={
            <AdminRoute>
              <AdminBlog />
            </AdminRoute>
          } />
          <Route path="builders" element={
            <AdminRoute>
              <ManagePropertyInBuilderProfile />
            </AdminRoute>
          } />
          <Route path="properties" element={
            <AdminRoute>
              <PropertiesManagement />
            </AdminRoute>
          } />
          <Route path="add-project" element={
            <AdminRoute>
              <ProjectAdd />
            </AdminRoute>
          } />
          {/* Add ProjectList route for admin */}
          <Route path="projects" element={
            <AdminRoute>
              <ProjectList />
            </AdminRoute>
          } />
          <Route path="geo-location" element={
            <ProtectedRoute>
              <GeoLocation />
            </ProtectedRoute>
          } />
        </Route>

        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/properties" element={<Property />} />
        <Route path="/blogs" element={<BlogLanding />} />
        <Route path="/blog/:slug" element={<BlogDetail />} />
      </Routes>
    </>
  );
}

export default App;