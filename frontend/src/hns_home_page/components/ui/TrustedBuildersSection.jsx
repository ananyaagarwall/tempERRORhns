import API_BASE_URL from '../../../config';
import React, { useState, useEffect } from 'react';
import { useCart } from '../../../hns_cart_page/js/CartContent.jsx';
import { normalizeImageUrl } from '../../../utils/imageUtils';
import "../../home_page_css/TrustedBuildersSection.css";
import '../../home_page_css/PropertiesSection.css';

// Heart Icon Component
const HeartIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);


const BORDER_RADIUS = 12;
const FALLBACK_BUILDER_IMAGE = '/palm.jpg';

const readResponseBody = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
};

const TrustedBuildersSection = ({ location }) => {
  const [builders, setBuilders] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addToCart, removeFromCart, isInCart } = useCart();

  useEffect(() => {
    const fetchBuilders = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch(`${API_BASE_URL}/api/builders`);
        const data = await readResponseBody(response);

        if (!response.ok) {
          const message = typeof data === 'object'
            ? data?.error || data?.message || `Failed to fetch builders (${response.status})`
            : data?.slice(0, 160) || `Failed to fetch builders (${response.status})`;
          throw new Error(message);
        }

        const formattedData = (Array.isArray(data) ? data : []).map(builder => ({
          id: builder._id || builder.id || `builder-${builder.company_name}-${builder.location || builder.city}`,
          img: normalizeImageUrl(builder.cover_banner) || normalizeImageUrl(builder.builder_logo) || normalizeImageUrl(builder.project_image) || FALLBACK_BUILDER_IMAGE,
          logo: normalizeImageUrl(builder.builder_logo) || '',
          name: builder.company_name || builder.brand_name || 'Trusted Builder',
          subtitle: builder.location || [builder.city, builder.state].filter(Boolean).join(', '),
          price: [
            builder.project_count !== null && builder.project_count !== undefined ? `${builder.project_count} Projects` : '',
            builder.completed_projects !== null && builder.completed_projects !== undefined ? `${builder.completed_projects} Completed` : '',
            builder.ongoing_projects !== null && builder.ongoing_projects !== undefined ? `${builder.ongoing_projects} Ongoing` : '',
          ].filter(Boolean).join(' • '),
        })).filter(builder => builder.name || builder.subtitle);
        setBuilders(formattedData);
      } catch (error) {
        console.error('Error fetching builders:', error);
        setError(error.message || 'Unable to load builder projects.');
      } finally {
        setLoading(false);
      }
    };
    fetchBuilders();
  }, []);

  const handleHeartClick = (e, builder) => {
    e.stopPropagation();
    if (isInCart(builder.id)) {
      removeFromCart(builder.id);
    } else {
      // Convert builder to property format for cart
      const builderAsProperty = {
        id: builder.id,
        name: builder.name,
        address: builder.subtitle,
        location: builder.subtitle,
        price: builder.price,
        img: builder.img,
        image: builder.img,
        features: 'Builder Project',
        bhk: 'N/A',
        area: 'N/A',
        builder: builder.name,
        amenities: [],
        status: 'Available'
      };
      addToCart(builderAsProperty, 'featured'); // Mark as featured
    }
  };

  // Filter builders by location if provided
  const locationFilteredBuilders = location && location.trim() ?
    builders.filter(b => b.subtitle && b.subtitle.toLowerCase().includes(location.toLowerCase())) :
    builders;
  const filteredBuilders = locationFilteredBuilders.length > 0 ? locationFilteredBuilders : builders;
  const sectionTitle = location && location.trim()
    ? `Explore Trusted Builders in ${location}`
    : 'Explore Trusted Builders in Area';
  
  const handlePrevious = () => {
    setActiveIdx((prevIdx) => (prevIdx === 0 ? filteredBuilders.length - 1 : prevIdx - 1));
  };
  
  const handleNext = () => {
    setActiveIdx((prevIdx) => (prevIdx === filteredBuilders.length - 1 ? 0 : prevIdx + 1));
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

  useEffect(() => {
    if (filteredBuilders.length === 0) {
      setActiveIdx(0);
      return;
    }

    if (activeIdx >= filteredBuilders.length) {
      setActiveIdx(0);
    }
  }, [activeIdx, filteredBuilders.length]);

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
            {sectionTitle}
          </h2>
          <span className="trusted-builders-underline mobile" />
        </div>

        {/* Mobile Cards Container with Simple Cards */}
        <div className="mobile-cards-container">
          {/* Simple scrollable row of cards */}
          <div className="mobile-cards-row">
            {(loading || error || filteredBuilders.length === 0) && (
              <div className="trusted-builders-state mobile">
                {loading
                  ? 'Loading trusted builders...'
                  : error || 'No trusted builder projects found yet.'}
              </div>
            )}

            {/* Show all cards in a scrollable row */}
            {filteredBuilders.map((builder, idx) => (
            <div
              key={idx}
              className="mobile-builder-card"
              style={{
                backgroundImage: `url(${builder.img})`,
                height: '360px',      // Fixed height to prevent any vertical shifting
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                position: 'relative'
              }}
            >
              {/* Heart Button - TOP RIGHT */}
              <button
                className={`property-heart-button ${isInCart(builder.id) ? 'in-cart' : ''}`}
                onClick={(e) => handleHeartClick(e, builder)}
                aria-label={isInCart(builder.id) ? 'Remove from cart' : 'Add to cart'}
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  zIndex: 3
              }}
            >
                <HeartIcon filled={isInCart(builder.id)} />
              </button>

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

        <style>{`
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
      className={`trusted-builders-section ${isTablet ? 'tablet' : 'desktop'}`}
      style={{
        background: '#F7F9FF',
        borderRadius: 18,
        padding: isTablet ? '36px 0 44px 0' : '48px 0 56px 0',
        margin: '40px 0',
        maxWidth: '100vw',
        boxSizing: 'border-box',
        position: 'relative',
        scrollMarginTop: 120,
        overflow: 'visible',
      }}
    >
      <div
        className={`trusted-builders-header ${isTablet ? 'tablet' : 'desktop'}`}
        style={{ zIndex: 5 }}
      >
        <h2
          className={`trusted-builders-heading ${isTablet ? 'tablet' : 'desktop'}`}
          style={{ position: 'relative', zIndex: 5 }}
        >
          {sectionTitle}
        </h2>
        <span className={`trusted-builders-underline ${isTablet ? 'tablet' : 'desktop'}`} />
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
        {(loading || error || filteredBuilders.length === 0) && (
          <div className="trusted-builders-state">
            {loading
              ? 'Loading trusted builders...'
              : error || 'No trusted builder projects found yet.'}
          </div>
        )}

        {/* Navigation Buttons */}
        {filteredBuilders.length > 0 && (
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
            display: 'flex',
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
        )}
        
        {filteredBuilders.length > 0 && (
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
            display: 'flex',
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
        )}
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
          {filteredBuilders.map((builder, idx) => {
            // Calculate offset considering circular carousel
            let offset = idx - activeIdx;
            
            // Handle circular wrapping for the last card
            if (activeIdx === filteredBuilders.length - 1) {
              if (idx === 0) offset = 1; // Position the first card to the right
              else if (idx === 1) offset = 2; // Position the second card further right
            }
            
            // Handle circular wrapping for the first card
            if (activeIdx === 0) {
              if (idx === filteredBuilders.length - 1) offset = -1; // Position the last card to the left
              else if (idx === filteredBuilders.length - 2) offset = -2; // Position the second-to-last card further left
            }
            
            // Skip cards that are too far away
            if (Math.abs(offset) > 2 && 
                !(activeIdx === filteredBuilders.length - 1 && (idx === 0 || idx === 1)) && 
                !(activeIdx === 0 && (idx === filteredBuilders.length - 1 || idx === filteredBuilders.length - 2))
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
                {/* Heart Button - TOP RIGHT */}
                <button
                  className={`property-heart-button ${isInCart(builder.id) ? 'in-cart' : ''}`}
                  onClick={(e) => handleHeartClick(e, builder)}
                  aria-label={isInCart(builder.id) ? 'Remove from cart' : 'Add to cart'}
                  style={{
                    position: 'absolute',
                    top: '14px',
                    right: '14px',
                    zIndex: 30
                  }}
                >
                  <HeartIcon filled={isInCart(builder.id)} />
                </button>

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
      
      <style>{`
        .carousel-nav-button:hover {
          background: rgba(255, 255, 255, 1) !important;
          transform: translateY(-50%) scale(1.05) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25) !important;
        }
        
        .carousel-nav-button:active {
          transform: translateY(-50%) scale(0.95) !important;
          boxShadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
        }
      `}</style>
    </section>
  );
};

export default TrustedBuildersSection;
