/* eslint-disable no-unused-vars */
import React, { createContext, useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn, useAuth } from '@clerk/clerk-react';
import { CartProvider } from './hns_cart_page/js/CartContent'; // Import CartProvider
import Login from './hns_admin_page/Login';
import Signup from './hns_admin_page/Signup';
import AdminSetup from './hns_admin_page/AdminSetup';
import AdminDashboard from './hns_admin_page/AdminDashboard';
import BuilderDashboard from './hns_admin_page/BuilderDashboard';
import './App.css';
import api, { getOrCreateGuestId, setAuthTokenGetter } from './services/apiInstance';

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
import ProfilePage from './ProfilePage';

// Chatbot Context
export const ChatbotContext = createContext();

const ProtectedRoute = ({ children }) => {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
};

const AdminRoute = ({ children }) => {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [adminState, setAdminState] = useState(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setAdminState({ allowed: false, needsSetup: false });
      return;
    }

    const checkAdmin = async () => {
      try {
        const token = await getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const res = await api.get('/auth/me', { headers });
        const profile = res.data || {};
        const isPrimaryAdmin = profile.is_primary_admin === true;
        const hasAdminRole = profile.role === 'admin';
        const hasVerifiedSession = profile.admin_session_verified === true;

        if (isPrimaryAdmin && hasAdminRole && hasVerifiedSession) {
          setAdminState({ allowed: true, needsSetup: false });
          return;
        }

        if (isPrimaryAdmin) {
          setAdminState({ allowed: false, needsSetup: true });
          return;
        }

        setAdminState({ allowed: false, needsSetup: false });
      } catch (err) {
        setAdminState({ allowed: false, needsSetup: false });
      }
    };
    checkAdmin();
  }, [isLoaded, isSignedIn, getToken]);

  if (!isLoaded || adminState === null) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 12 }}>
        <div style={{ width: 36, height: 36, border: '4px solid #23487c', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#23487c', fontWeight: 600 }}>Verifying admin access...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  if (adminState.needsSetup) {
    return <Navigate to="/admin-setup" replace />;
  }

  if (!adminState.allowed) {
    return <Navigate to="/" replace />;
  }

  return children;
};


const UserSync = () => {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  
  useEffect(() => {
    let cancelled = false;

    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const syncGuest = async (attempt = 0) => {
      if (!isLoaded || !isSignedIn || cancelled) {
        return;
      }

      const guestId = getOrCreateGuestId();
      const token = await getToken({ skipCache: attempt > 0 });

      if (!token) {
        if (attempt < 5 && !cancelled) {
          await wait(800);
          return syncGuest(attempt + 1);
        }
        console.warn('User sync skipped: Clerk session token not available yet.');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      try {
        // Ensure local user row exists and keep frontend role/profile in sync.
        const profileRes = await api.get('/auth/me', { headers });
        if (!cancelled && profileRes?.data) {
          localStorage.setItem('user', JSON.stringify(profileRes.data));
        }
      } catch (err) {
        if (attempt < 5 && err?.response?.status === 401 && !cancelled) {
          await wait(800);
          return syncGuest(attempt + 1);
        }
        console.error('Error syncing user profile:', err?.response?.data || err);
        return;
      }

      if (guestId) {
        try {
          await api.post('/auth/merge-guest', { guest_id: guestId }, { headers });
          console.log('Successfully merged guest data');
        } catch (err) {
          if (attempt < 5 && err?.response?.status === 401 && !cancelled) {
            await wait(800);
            return syncGuest(attempt + 1);
          }
          console.error('Error merging guest data:', err?.response?.data || err);
        }
      }
    };

    syncGuest();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    if (!isLoaded) {
      setAuthTokenGetter(null);
      return;
    }

    setAuthTokenGetter(() => getToken());
    return () => setAuthTokenGetter(null);
  }, [isLoaded, getToken]);
  
  return null;
};

function App() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  return (
    <CartProvider>
      <UserSync />
      <ChatbotContext.Provider value={{ isChatbotOpen, setIsChatbotOpen }}>
        <Routes>
          <Route path="/login/*" element={<Login />} />
          <Route path="/signup/*" element={<Signup />} />
          <Route path="/admin-setup" element={<AdminSetup />} />
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
          <Route path="/profile/*" element={<ProfilePage />} />
          <Route path="/properties" element={<PropertyListing />} />
          <Route path="/property/:propertyToken" element={<PropertyListingPage />} />
          <Route path="/builder" element={<Navigate to="/builders-page" replace />} />
          <Route path="/builder-info" element={<Navigate to="/builders-page" replace />} />
          <Route path="/builder/:builderName" element={<BuilderInfoIndex />} />
          <Route path="/builder-info/:builderName" element={<BuilderInfoIndex />} />
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
