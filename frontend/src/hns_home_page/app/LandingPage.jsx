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
import ConsultingSection from '../components/ui/ConsultingSection';
import FooterSection from '../components/layout/FooterSection';
import FooterNavBar from '../components/layout/FooterNavBar';
import MobileFooter from '../../components/ui/MobileFooter';
import ChatBot from '../components/ui/ChatBot';               // <-- always rendered
import '../home_page_css/LandingPage.css';
import { getCookie, setCookie } from '../../utils/cookieUtils';



const LandingPage = () => {
  const [geoStatus, setGeoStatus] = useState('');
  const [userLocation, setUserLocation] = useState(null); // District from geolocation
  const [searchFilters, setSearchFilters] = useState({
    location: '',
    priceRange: 0,
    minBudget: null,
    maxBudget: null,
    bhkTypes: [],
    bhkSearch: '',
    amenities: [],
  });

  /* ---------- Geolocation Effect ---------- */
  useEffect(() => {
    // Check if location is already stored in cookies
    const storedLocation = getCookie('user_location');
    if (storedLocation) {
      setUserLocation(storedLocation);
      setGeoStatus('');
      return; 
    }

    // Geolocation
    if ('geolocation' in navigator) {
      setGeoStatus('Requesting location permission...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeoStatus('');
          const { latitude, longitude } = position.coords;
          fetch(`${API_BASE_URL}/api/geolocation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude, longitude }),
          })
            .then((res) => res.json())
            .then((data) => {
              let locValue = data.received?.district || data.received?.full_address || null;
              if (locValue) {
                setUserLocation(locValue);
                setCookie('user_location', locValue, 7);
              }
            })
            .catch(() => { });
        },
        () => setGeoStatus('')
      );
    } else {
      setGeoStatus('');
    }
  }, []);

  /* ---------- Search Filter Listener Effect ---------- */
  useEffect(() => {
    const handleFilter = (e) => {
      console.log('LandingPage: Received filterLandingPage event', e.detail);
      setSearchFilters({
        location: e.detail.location || '',
        priceRange: e.detail.priceRange ?? 0,
        minBudget: e.detail.minBudget ?? null,
        maxBudget: e.detail.maxBudget ?? null,
        bhkTypes: e.detail.bhkTypes || [],
        bhkSearch: e.detail.bhkSearch || '',
        amenities: e.detail.amenities || [],
      });
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
      {/* Show only while permission prompt is pending */}
      {geoStatus && (
        <div
          style={{
            background: '#e0f7fa',
            color: '#00796b',
            padding: '8px',
            textAlign: 'center',
            fontSize: '0.95rem',
          }}
        >
          {geoStatus}
        </div>
      )}

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
      <ConsultingSection />

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