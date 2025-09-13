import React, { useState, useEffect } from 'react';
import './css/TrustedBuildersSection.css';

const BUILDERS = [
  {
    img: '/lodha.jpg',
    logo: '',
    name: 'Lodha Splendora',
    subtitle: '3,4,5 BHK, Thane',
    price: '₹ 5.4 – 12.1 Cr',
  },
  {
    img: '/kalpa.jpg',
    logo: '',
    name: 'Kalpataru Residency',
    subtitle: '2,3,4 BHK, Parel',
    price: '₹ 2.2 – 7.29 Cr',
  },
  {
    img: '/rustomujee.jpg',
    logo: '',
    name: 'Rustomjee Seasons',
    subtitle: '2,3,4 BHK, Bandra East',
    price: '₹ 3.2 – 8.5 Cr',
  },
  {
    img: '/presidental.jpeg',
    logo: '',
    name: 'Presidential Towers',
    subtitle: '3,4,5 BHK, Worli',
    price: '₹ 1.8 – 4.2 Cr',
  },
  {
    img: '/garden.jpeg',
    logo: '',
    name: 'Garden View Heights',
    subtitle: '2,3 BHK, Goregaon East',
    price: '₹ 2.5 – 6.7 Cr',
  },
];

const BORDER_RADIUS = 12;

const TrustedBuildersSection = () => {
  const [activeIdx, setActiveIdx] = useState(2);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  const handlePrevious = () => {
    setActiveIdx((prevIdx) => (prevIdx === 0 ? BUILDERS.length - 1 : prevIdx - 1));
  };
  
  const handleNext = () => {
    setActiveIdx((prevIdx) => (prevIdx === BUILDERS.length - 1 ? 0 : prevIdx + 1));
  };

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsTablet(width <= 1024 && width > 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Responsive values
  let cardWidth = 380, cardHeight = 400, centerScale = 1.08;
  let visibleCount = 5;

  if (isTablet) {
    cardWidth = 320;
    cardHeight = 360;
    centerScale = 1.05;
  }

  // Mobile Layout with Simple Cards (No Carousel)
  if (isMobile) {
    return (
      <section className="trusted-builders-section mobile">

        <div className="trusted-builders-header mobile">
          <h2 className="trusted-builders-heading mobile">
            Explore Trusted Builders in Area
          </h2>
          <span className="trusted-builders-underline mobile" />
        </div>

        {/* Mobile Cards Container with Simple Cards */}
        <div className="mobile-cards-container">
          {/* Simple scrollable row of cards */}
          <div className="mobile-cards-row">

            {/* Show all cards in a scrollable row */}
            {BUILDERS.map((builder, idx) => (
            <div
              key={idx}
              className="mobile-builder-card"
              style={{
                backgroundImage: `url(${builder.img})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              {/* Card overlay with info */}
              <div className="card-overlay">

                {builder.logo && (
                  <img
                    src={builder.logo}
                    alt={builder.name}
                    className="builder-logo"
                  />
                )}
                {/* Title */}
                <div className="builder-title">

                  {builder.name}
                </div>
                {/* Subtitle */}
                <div className="builder-subtitle">

                  {builder.subtitle}
                </div>
                {/* Price */}
                <div className="builder-price">

                  {builder.price}
                </div>
              </div>
            </div>
            ))}
          </div>
        </div>

        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </section>
    );
  }

  // Desktop/Tablet Layout (carousel with navigation arrows)
  return (
    <section
      style={{
        background: '#F7F9FF',
        borderRadius: 18,
        padding: isTablet ? '36px 0 44px 0' : '48px 0 56px 0',
        margin: '40px 0',
        maxWidth: '100vw',
        boxSizing: 'border-box',
        position: 'relative',
        scrollMarginTop: 120,
      }}
    >
      <div style={{
        width: '100%',
        position: 'relative',
        margin: '0 0 32px 0',
        marginBottom: isTablet ? '40px' : '50px', // Added extra spacing between heading and content
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{
            fontSize: isTablet ? '2.1rem' : '2.5rem',
            fontWeight: 800,
            color: '#223A5F',
            margin: 0,
            letterSpacing: '-0.5px',
            fontFamily: "'Abril Fatface', serif"
          }}>
            Explore Trusted Builders in Area
          </h2>
          <span style={{
            display: 'block',
            width: isTablet ? '70px' : '80px',
            height: '4px',
            background: 'linear-gradient(90deg, #F1D97A 0%, #e6c76a 100%)',
            margin: '12px auto 0',
            borderRadius: '2px',
            boxShadow: '0 2px 4px rgba(241, 217, 122, 0.3)'
          }} />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'stretch',
          position: 'relative',
          minHeight: cardHeight + 32,
          paddingTop: '80px',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Navigation Buttons */}
        <button 
          onClick={handlePrevious}
          className="carousel-nav-button prev-button"
          aria-label="Previous"
          style={{
            position: 'absolute',
            left: isTablet ? '10%' : '15%',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 30,
            background: 'rgba(255, 255, 255, 0.9)',
            border: 'none',
            borderRadius: '50%',
            width: isTablet ? '44px' : '50px',
            height: isTablet ? '44px' : '50px',
            display: isMobile ? 'flex' : 'none',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            cursor: 'pointer',
            transition: 'all 0.3s ease-in-out',
              opacity: 0.9,
              '&:hover': {
                opacity: 1,
                transform: 'translateY(-50%) scale(1.05)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)'
              }
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="#223A5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        <button 
          onClick={handleNext}
          className="carousel-nav-button next-button"
          aria-label="Next"
          style={{
            position: 'absolute',
            right: isTablet ? '10%' : '15%',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 30,
            background: 'rgba(255, 255, 255, 0.9)',
            border: 'none',
            borderRadius: '50%',
            width: isTablet ? '44px' : '50px',
            height: isTablet ? '44px' : '50px',
            display: isMobile ? 'flex' : 'none',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            cursor: 'pointer',
            transition: 'all 0.3s ease-in-out',
              opacity: 0.9,
              '&:hover': {
                opacity: 1,
                transform: 'translateY(-50%) scale(1.05)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)'
              }
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 6L15 12L9 18" stroke="#223A5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {/* Carousel Container */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: isTablet ? 1000 : 1200,
            position: 'relative',
            height: cardHeight,
            margin: '0 auto',
            overflow: 'visible',
          }}
        >
          {BUILDERS.map((builder, idx) => {
            // Calculate offset considering circular carousel
            let offset = idx - activeIdx;
            
            // Handle circular wrapping for the last card
            if (activeIdx === BUILDERS.length - 1) {
              if (idx === 0) offset = 1; // Position the first card to the right
              else if (idx === 1) offset = 2; // Position the second card further right
            }
            
            // Handle circular wrapping for the first card
            if (activeIdx === 0) {
              if (idx === BUILDERS.length - 1) offset = -1; // Position the last card to the left
              else if (idx === BUILDERS.length - 2) offset = -2; // Position the second-to-last card further left
            }
            
            // Skip cards that are too far away
            if (Math.abs(offset) > 2 && 
                !(activeIdx === BUILDERS.length - 1 && (idx === 0 || idx === 1)) && 
                !(activeIdx === 0 && (idx === BUILDERS.length - 1 || idx === BUILDERS.length - 2))
               ) return null;

            let translateX = offset < 0 ? -cardWidth * 0.55 : offset > 0 ? cardWidth * 0.55 : 0;
            let scale = offset === 0 ? centerScale : Math.abs(offset) === 2 ? 0.88 : 0.92;
            let zIndex = offset === 0 ? 20 : 10 - Math.abs(offset);
            if (zIndex < 1) zIndex = 1;

            if (Math.abs(offset) === 2) {
              translateX = offset < 0 ? -cardWidth * 1.1 : cardWidth * 1.1;
              zIndex = 8;
            }

            return (
              <div
                key={idx}
                style={{
                  width: cardWidth,
                  height: cardHeight,
                  borderRadius: BORDER_RADIUS,
                  background: `url(${builder.img}) center/cover no-repeat`,
                  boxShadow: '0 8px 32px rgba(34,58,95,0.18), 0 2px 8px #93A2B0',
                  border: '6px solid #C8D9E9',
                  zIndex,
                  opacity: 1,
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: `translateX(-50%) scale(${scale}) translateX(${translateX}px)`,
                  transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  cursor: 'pointer',
                }}
                onClick={() => setActiveIdx(idx)}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 24,
                    height: '40%',
                    background: 'rgba(241,241,241,0.85)',
                    zIndex: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    boxShadow: offset === 0 ? '0 2px 12px #223A5F22' : 'none',
                  }}
                >
                  {builder.logo && (
                    <img
                      src={builder.logo}
                      alt={builder.name}
                      style={{
                        width: isTablet ? 48 : 56,
                        height: isTablet ? 48 : 56,
                        borderRadius: '50%',
                        marginBottom: 10,
                        objectFit: 'cover',
                        background: '#fff',
                        border: '2px solid #e0e0e0',
                      }}
                    />
                  )}
                  <div
                    style={{
                      fontFamily: 'Abril Fatface, serif',
                      fontWeight: 700,
                      fontSize: isTablet ? 22 : 26,
                      color: '#223A5F',
                      marginBottom: 4,
                      textAlign: 'center',
                    }}
                  >
                    {builder.name}
                  </div>
                  <div
                    style={{
                      fontWeight: 500,
                      fontSize: isTablet ? 15 : 17,
                      color: '#223A5F',
                      opacity: 0.92,
                      marginBottom: 3,
                      textAlign: 'center',
                    }}
                  >
                    {builder.subtitle}
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: isTablet ? 16 : 18,
                      color: '#223A5F',
                      textAlign: 'center',
                    }}
                  >
                    {builder.price}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <style jsx>{`
        .carousel-nav-button:hover {
          background: rgba(255, 255, 255, 1) !important;
          transform: translateY(-50%) scale(1.05) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25) !important;
        }
        
        .carousel-nav-button:active {
          transform: translateY(-50%) scale(0.95) !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
        }
      `}</style>
    </section>
  );
};

export default TrustedBuildersSection;
