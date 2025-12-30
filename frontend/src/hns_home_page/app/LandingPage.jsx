import React, { useRef, useEffect, useState } from 'react';
import HeaderSection from '../components/layout/HeaderSection';
import TrustedBuildersSection from '../components/ui/TrustedBuildersSection';
import PropertiesSection from '../components/ui/PropertiesSection';
import BudgetSection from '../components/ui/BudgetSection';
import BuildersSection from '../components/ui/BuildersSection';
import BlogSection from '../components/ui/BlogSection';
import FooterSection from '../components/layout/FooterSection';
import FooterNavBar from '../components/layout/FooterNavBar';
import ChatBot from '../components/ui/ChatBot';
import '../home_page_css/LandingPage.css';


const LandingPage = () => {
  const [geoStatus, setGeoStatus] = useState('');
  const [searchFilters, setSearchFilters] = useState({ location: "", priceRange: 0, bhkTypes: [] });
  useEffect(() => {
    // Geolocation logic
    if ('geolocation' in navigator) {
      setGeoStatus('Requesting location permission...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeoStatus('Location permission granted. Sending coordinates...');
          const { latitude, longitude } = position.coords;
          fetch('http://localhost:5000/api/geolocation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude, longitude })
          })
            .then((res) => res.json())
            .then((data) => {
              setGeoStatus('Coordinates sent! ' + (data.message || ''));
            })
            .catch((err) => {
              setGeoStatus('Failed to send coordinates.');
            });
        },
        (error) => {
          setGeoStatus('Location permission denied or unavailable.');
        }
      );
    } else {
      setGeoStatus('Geolocation is not supported by your browser.');
    }

    // Listen for filterLandingPage event
    const handleFilter = (e) => {
      setSearchFilters({
        location: e.detail.location || "",
        priceRange: e.detail.priceRange ?? 0,
        bhkTypes: e.detail.bhkTypes || []
      });
    };
    window.addEventListener('filterLandingPage', handleFilter);
    return () => window.removeEventListener('filterLandingPage', handleFilter);
  }, []);
  const triggerRef = useRef(null);
  const [showStickyFooterNav, setShowStickyFooterNav] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      // Show footer nav when the trigger element is above the viewport
      setShowStickyFooterNav(rect.bottom <= 0);
    };
    window.addEventListener('scroll', handleScroll);
    // Run once on mount in case already scrolled
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing-page-container">
      {/* Geolocation status message */}
      {geoStatus && (
        <div style={{ background: '#e0f7fa', color: '#00796b', padding: '8px', textAlign: 'center', fontSize: '0.95rem' }}>
          {geoStatus}
        </div>
      )}
      <HeaderSection />
      {/* Trigger ref at the end of HeaderSection */}
      <div ref={triggerRef} style={{ height: '1px', width: '100%', margin: 0, padding: 0 }} />
      {/* Sticky FooterNavBar at the top only when trigger is out of view */}
      {showStickyFooterNav && (
        <div className="sticky-nav-container">
          <FooterNavBar />
        </div>
      )}
      <PropertiesSection searchFilters={searchFilters} />
      <BuildersSection searchFilters={searchFilters} />
      <BudgetSection />
      <TrustedBuildersSection location={searchFilters.location} />
      <BlogSection id="blog-section" />
      <FooterSection />
      <ChatBot />
    </div>
  );
};
export default LandingPage;  