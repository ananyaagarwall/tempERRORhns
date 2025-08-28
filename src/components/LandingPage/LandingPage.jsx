import React, { useRef, useEffect, useState } from 'react';
import HeaderSection from './HeaderSection';
import PossessionSection from './PossessionSection';
import TrustedBuildersSection from './TrustedBuildersSection';
import PropertiesSection from './PropertiesSection';
import BudgetSection from './BudgetSection';
import BuildersSection from './BuildersSection';
import BlogSection from './BlogSection';
import FooterSection from './FooterSection';
import FooterNavBar from './FooterNavBar';
import './LandingPage.css';

const LandingPage = () => {
  const triggerRef = useRef(null);
  const [showStickyFooterNav, setShowStickyFooterNav] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setShowStickyFooterNav(rect.top <= 0);
    };
    window.addEventListener('scroll', handleScroll);
    // Run once on mount in case already scrolled
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ background: '#FFFBF2' }}>
      <HeaderSection />
      {/* Trigger ref just before PropertiesSection */}
      <div ref={triggerRef} />
      {/* Sticky FooterNavBar at the top only when trigger is out of view */}
      {showStickyFooterNav && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          zIndex: 100,
        }}>
          <FooterNavBar />
        </div>
      )}
      <PropertiesSection />
      <BuildersSection />
      <PossessionSection />
      <BudgetSection />
      <TrustedBuildersSection />
      <BlogSection id="blog-section" />
      <FooterSection />
    </div>
  );
};

export default LandingPage; 