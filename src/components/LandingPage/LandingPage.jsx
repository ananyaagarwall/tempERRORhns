import React, { useRef, useEffect, useState } from 'react';
import HeaderSection from './HeaderSection';
import TrustedBuildersSection from './TrustedBuildersSection';
import PropertiesSection from './PropertiesSection';
import BudgetSection from './BudgetSection';
import BuildersSection from './BuildersSection';
import BlogSection from './BlogSection';
import FooterSection from './FooterSection';
import FooterNavBar from './FooterNavBar';
import './css/LandingPage.css';

const LandingPage = () => {
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
      <HeaderSection />
      {/* Trigger ref at the end of HeaderSection */}
      <div ref={triggerRef} style={{ height: '1px', width: '100%', margin: 0, padding: 0 }} />
      {/* Sticky FooterNavBar at the top only when trigger is out of view */}
      {showStickyFooterNav && (
        <div className="sticky-nav-container">
          <FooterNavBar />
        </div>
      )}
      <PropertiesSection />
      <BuildersSection />
      <BudgetSection />
      <TrustedBuildersSection />
      <BlogSection id="blog-section" />
      <FooterSection />
    </div>
  );
};

export default LandingPage;