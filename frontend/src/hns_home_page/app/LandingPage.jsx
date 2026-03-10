import API_BASE_URL from '../../config';
// src/hns_home_page/app/LandingPage.jsx
import React, { useRef, useEffect, useState } from 'react';
import HeaderSection from '../components/layout/HeaderSection';
import TrustedBuildersSection from '../components/ui/TrustedBuildersSection';
import PropertiesSection from '../components/ui/PropertiesSection';
import BudgetSection from '../components/ui/BudgetSection';
import BuildersSection from '../components/ui/BuildersSection';
import NearYouSection from '../components/ui/NearYouSection';
import BlogSection from '../components/ui/BlogSection';
import FooterSection from '../components/layout/FooterSection';
import FooterNavBar from '../components/layout/FooterNavBar';
import MobileFooter from '../../components/ui/MobileFooter';
import ChatBot from '../components/ui/ChatBot';               // <-- always rendered
import '../home_page_css/LandingPage.css';


const LandingPage = () => {
  const [geoStatus, setGeoStatus] = useState('');
  const [userLocation, setUserLocation] = useState(null); // District from geolocation
  const [searchFilters, setSearchFilters] = useState({
    location: '',
    priceRange: 0,
    bhkTypes: [],
  });

  /* ---------- Geolocation + Filter Listener ---------- */
  useEffect(() => {
    // Geolocation
    if ('geolocation' in navigator) {
      setGeoStatus('Requesting location permission...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeoStatus('Location permission granted. Sending coordinates...');
          const { latitude, longitude } = position.coords;
          fetch(`${API_BASE_URL}/api/geolocation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude, longitude }),
          })
            .then((res) => res.json())
            .then((data) => {
              setGeoStatus('Coordinates sent! ' + (data.message || ''));
              // Extract district/location from response
              if (data.received && data.received.district) {
                setUserLocation(data.received.district);
              } else if (data.received && data.received.full_address) {
                // Try to extract a known area from full address
                setUserLocation(data.received.full_address);
              }
            })
            .catch(() => setGeoStatus('Failed to send coordinates.'));
        },
        () => setGeoStatus('Location permission denied or unavailable.')
      );
    } else {
      setGeoStatus('Geolocation is not supported by your browser.');
    }

    // Filter event from header/search bar
    const handleFilter = (e) => {
      setSearchFilters({
        location: e.detail.location || '',
        priceRange: e.detail.priceRange ?? 0,
        bhkTypes: e.detail.bhkTypes || [],
      });
      // Also update userLocation if user searches for a specific location
      if (e.detail.location) {
        setUserLocation(e.detail.location);
      }
    };
    window.addEventListener('filterLandingPage', handleFilter);
    return () => window.removeEventListener('filterLandingPage', handleFilter);
  }, []);

  /* ---------- Sticky FooterNavBar ---------- */
  const triggerRef = useRef(null);
  const [showStickyFooterNav, setShowStickyFooterNav] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setShowStickyFooterNav(rect.bottom <= 0);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing-page-container">



      <HeaderSection />

      {/* Trigger for sticky nav */}
      <div
        ref={triggerRef}
        style={{ height: '1px', width: '100%', margin: 0, padding: 0 }}
      />

      {/* Sticky top nav when scrolled past header */}
      {showStickyFooterNav && (
        <div className="sticky-nav-container">
          <FooterNavBar />
        </div>
      )}

      <PropertiesSection searchFilters={searchFilters} />
      <NearYouSection searchFilters={searchFilters} userLocation={userLocation} />

      <BudgetSection />
      <TrustedBuildersSection location={searchFilters.location} />
      <BlogSection id="blog-section" />
      <FooterSection />

      {/* MobileFooter is always visible on small screens */}
      <MobileFooter />

      {/* ChatBot is always mounted – floating trigger hidden via CSS on mobile */}
      <ChatBot />
    </div>
  );
};

export default LandingPage;