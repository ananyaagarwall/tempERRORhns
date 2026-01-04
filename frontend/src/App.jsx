import React, { createContext, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './hns_cart_page/js/CartContent'; // Import CartProvider
import Navbar from './hns_admin_page/Navbar';
import Login from './hns_admin_page/Login';
import Signup from './hns_admin_page/Signup';
import AdminDashboard from './hns_admin_page/AdminDashboard';
import BuilderDashboard from './hns_admin_page/BuilderDashboard';
import './App.css';
import AddBuilder from './Builder.jsx/addBuilder';
import BlogManagement from './hns_admin_page/BlogManagement';
import AdminBlog from './hns_admin_page/AdminBlog';
import ManagePropertyInBuilderProfile from './Builder.jsx/ManagePropertyInBuilderProfile';
import PropertiesManagement from './hns_admin_page/PropertiesManagement';
import ProjectAdd from './hns_admin_page/ProjectAdd';
import DashboardLayout from './hns_admin_page/DashboardLayout';
import LandingPage from './hns_home_page/app/LandingPage';
import BlogLanding from './hns_blog_page/app/BlogLanding';
import BlogDetail from './hns_blog_page/app/BlogDetail';
import FooterNavBar from './hns_home_page/components/layout/FooterNavBar';
import ProjectList from './hns_admin_page/ProjectList';
import PropertyListing from './hns_propertyListing_page/app/PropertyListing';
import GeoLocation from './Builder.jsx/geoLocation';
import BuilderInfoIndex from './BuilderInfo/pages/Index';
import PropertyListingPage from './property_page/app/page';
import CartPage from './hns_cart_page/app/CartPage';
import ChatBot from './components/ui/ChatBot';
import AboutUs from './hns_home_page/components/ui/AboutUs';
import BuildersListing from './hns_home_page/components/ui/BuildersListing';

// Chatbot Context
export const ChatbotContext = createContext();

const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    return <Navigate to="/login" />;
  }
  return children;
};

const AdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" />;
  }
  return children;
};

function App() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  return (
    <CartProvider>
      <ChatbotContext.Provider value={{ isChatbotOpen, setIsChatbotOpen }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/builder-dashboard"
            element={
              <ProtectedRoute>
                <BuilderDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route
              path="admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="add-builder"
              element={
                <AdminRoute>
                  <AddBuilder />
                </AdminRoute>
              }
            />
            <Route
              path="blogs"
              element={
                <AdminRoute>
                  <BlogManagement />
                </AdminRoute>
              }
            />
            <Route
              path="create-blog"
              element={
                <AdminRoute>
                  <AdminBlog />
                </AdminRoute>
              }
            />
            <Route
              path="builders"
              element={
                <AdminRoute>
                  <ManagePropertyInBuilderProfile />
                </AdminRoute>
              }
            />
            <Route
              path="properties"
              element={
                <AdminRoute>
                  <PropertiesManagement />
                </AdminRoute>
              }
            />
            <Route
              path="add-project"
              element={
                <AdminRoute>
                  <ProjectAdd />
                </AdminRoute>
              }
            />
            <Route
              path="projects"
              element={
                <AdminRoute>
                  <ProjectList />
                </AdminRoute>
              }
            />
            <Route
              path="geo-location"
              element={
                <ProtectedRoute>
                  <GeoLocation />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/properties" element={<PropertyListing />} />
          <Route path="/property/:id" element={<PropertyListingPage />} />
          <Route path="/builder" element={<BuilderInfoIndex />} />
          <Route path="/builder-info" element={<BuilderInfoIndex />} />
          <Route path="/builder/:builderName" element={<BuilderInfoIndex />} />
          <Route path="/blogs" element={<BlogLanding />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/builders-page" element={<BuildersListing />} />
        </Routes>

        {/* ChatBot rendered outside Routes but inside Context Provider */}
        <ChatBot />
      </ChatbotContext.Provider>
    </CartProvider>
  );
}

export default App;