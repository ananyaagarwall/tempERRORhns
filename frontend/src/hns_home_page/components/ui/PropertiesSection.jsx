import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { CiLocationOn } from "react-icons/ci";
import { useCart } from '../../../hns_cart_page/js/CartContent.jsx';
import initPropertyCardHandlers from '../../home_page_js/propertyCards.js';
import '../../home_page_css/PropertiesSection.css';
import { fetchProperties } from '../../../services/api';

// Heart Icon Component
const HeartIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const AZURE_BASE = 'https://hnsblob001.blob.core.windows.net/hns-media';

// Returns the primary gallery image URL for a project, no API call needed.
function getCardImage(prop) {
  if (prop.project_id) {
    return `${AZURE_BASE}/projects/${prop.project_id}/gallery/img1.jpg`;
  }
  return prop.builder_project_image || prop.img || '/Presidential Towers.jpg.png';
}

const sampleProperty = {
  img: '/Presidential Towers.jpg.png',
  name: 'Sample Property',
  address: 'Sample Address, Navi Mumbai',
  features: '3 BHK | Pool',
  price: '₹ 1.2 Cr +',
  confidence: '93%',
};

function parsePriceInCr(priceStr) {
  if (!priceStr) return 0;
  // Take only the starting price if it's a range like "₹72 L – ₹2.5 Cr"
  const startPart = priceStr.toString().split('–')[0].split('-')[0];
  let val = startPart.replace(/₹|,|\+|\s/g, '').toLowerCase();
  try {
    if (val.includes('cr') || val.includes('crore')) {
      return parseFloat(val.replace('crore', '').replace('cr', ''));
    } else if (val.includes('lakh')) {
      return parseFloat(val.replace('lakh', '')) / 100;
    } else if (val.endsWith('l')) {
      // Handle shorthand "L" for Lakhs (e.g., "72l" → 72 lakhs → 0.72 Cr)
      return parseFloat(val.slice(0, -1)) / 100;
    } else {
      return parseFloat(val);
    }
  } catch {
    return 0;
  }
}

const PropertiesSection = ({ searchFilters = { location: '', priceRange: 0, minBudget: null, maxBudget: null, bhkTypes: [], bhkSearch: '', amenities: [] } }) => {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 700 : false);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cardsRowRef = useRef(null);
  const navigate = useNavigate();
  const { addToCart, removeFromCart, isInCart } = useCart();

  // Resize listener — mount/unmount only
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 700);
    window.addEventListener('resize', handleResize);
    initPropertyCardHandlers();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Re-fetch whenever any search filter changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchProperties({
      location: searchFilters.location || undefined,
      priceRange: searchFilters.priceRange || undefined,
      minBudget: searchFilters.minBudget ?? undefined,
      maxBudget: searchFilters.maxBudget ?? undefined,
      bhkTypes: searchFilters.bhkTypes?.length ? searchFilters.bhkTypes : undefined,
      bhkSearch: searchFilters.bhkSearch || undefined,
      amenities: searchFilters.amenities?.length ? searchFilters.amenities : undefined,
    })
      .then(data => {
        if (cancelled) return;
        const mapped = Array.isArray(data) ? data.map(p => ({
          id: p._id || p.id || '',
          name: p.Property_Name || '',
          address: p.Address || p.Location || '',
          price: p.Price_Starting_From || p.Pricing || '',
          confidence: p.confidence || '',
          img: p.image || p.builder_project_image || '/Presidential Towers.jpg.png',
          project_id: p.project_id || null,
          builder_project_image: p.builder_project_image || null,
          features: p.Features || '',
          Existing_Configurations: p.Existing_Configurations || [],
        })) : [];
        setProperties(mapped);
        setError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Failed to fetch properties');
        setProperties([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  // JSON.stringify makes array dep safe without causing infinite re-renders
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchFilters.location,
    searchFilters.priceRange,
    searchFilters.minBudget,
    searchFilters.maxBudget,
    JSON.stringify(searchFilters.bhkTypes),
    searchFilters.bhkSearch,
    JSON.stringify(searchFilters.amenities),
  ]);

  const scrollCards = (direction) => {
    if (!cardsRowRef.current) return;
    const scrollAmount = 720; // (340px card width + 20px gap) * 2
    cardsRowRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const handleHeartClick = (e, property) => {
    e.stopPropagation();
    if (isInCart(property.id)) {
      removeFromCart(property.id);
    } else {
      addToCart(property, 'featured'); // Mark as featured
    }
  };
  const renderPropertyCard = (prop, idx) => (
    <div
      className={`property-card-custom ${isMobile ? 'mobile-card' : ''}`}
      key={idx}
      onClick={() => {
        const propertyData = {
          id: prop.id,
          name: prop.name,
          address: prop.address,
          features: prop.features,
          price: prop.price,
          confidence: prop.confidence,
          clickedAt: new Date().toISOString()
        };
        localStorage.setItem('lastClickedProperty', JSON.stringify(propertyData));
        let recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewedProperties') || '[]');
        const existingIndex = recentlyViewed.findIndex(p => p.name === prop.name && p.address === prop.address);
        if (existingIndex !== -1) {
          recentlyViewed.splice(existingIndex, 1);
        }
        recentlyViewed.unshift(propertyData);
        recentlyViewed = recentlyViewed.slice(0, 5);
        localStorage.setItem('recentlyViewedProperties', JSON.stringify(recentlyViewed));
        navigate(`/property/${prop.id}`);
      }}
    >
      <img
        src={getCardImage(prop)}
        alt={prop.name}
        className="property-img-custom"
        loading="lazy"
        decoding="async"
        onError={(e) => {
          // Fallback chain: gallery blob → builder_project_image → static default
          const tried = e.currentTarget.dataset.tried || '';
          if (!tried.includes('bpi') && prop.builder_project_image) {
            e.currentTarget.dataset.tried = tried + 'bpi';
            e.currentTarget.src = prop.builder_project_image;
          } else if (!tried.includes('static')) {
            e.currentTarget.dataset.tried = (tried || '') + 'static';
            e.currentTarget.src = '/Presidential Towers.jpg.png';
          }
        }}
      />

      {/* Heart Button - TOP RIGHT */}
      <button
        className={`property-heart-button ${isInCart(prop.id) ? 'in-cart' : ''}`}
        onClick={(e) => handleHeartClick(e, prop)}
        aria-label={isInCart(prop.id) ? 'Remove from cart' : 'Add to cart'}
      >
        <HeartIcon filled={isInCart(prop.id)} />
      </button>



      <div className="property-overlay-custom">
        <div className="property-info-custom">
          <h2>{prop.name}</h2>
          <p className="property-address-custom"><CiLocationOn className="location-icon" />{prop.address}</p>
          <div className="property-bottom-row">
            <p className="property-details-custom">{prop.features}</p>
            <p className="property-price-custom">{prop.price}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const hasActiveFilter = !!(
    searchFilters.location ||
    searchFilters.priceRange > 0 ||
    searchFilters.minBudget !== null ||
    searchFilters.maxBudget !== null ||
    searchFilters.bhkTypes?.length > 0 ||
    searchFilters.bhkSearch ||
    searchFilters.amenities?.length > 0
  );

  return (
    <section className="property-section-custom">
      <div style={{ textAlign: 'center', marginBottom: '120px' }}>
        <h2 style={{
          fontSize: '2.5rem',
          fontWeight: 800,
          color: '#223A5F',
          margin: 0,
          letterSpacing: '-0.5px',
          fontFamily: "'Abril Fatface', serif"
        }}>
          Properties
        </h2>
        <span style={{
          display: 'block',
          width: '80px',
          height: '4px',
          background: 'linear-gradient(90deg, #F1D97A 0%, #e6c76a 100%)',
          margin: '12px auto 0',
          marginBottom: '20px',
          borderRadius: '2px',
          boxShadow: '0 2px 4px rgba(241, 217, 122, 0.3)'
        }} />
      </div>

      <div className="property-cards-row-wrapper">
        {!isMobile && (
          <>
            <button
              className="prop-scroll-btn left"
              onClick={() => scrollCards('left')}
              aria-label="Scroll left"
            >
              <FaChevronLeft />
            </button>
            <button
              className="prop-scroll-btn right"
              onClick={() => scrollCards('right')}
              aria-label="Scroll right"
            >
              <FaChevronRight />
            </button>
          </>
        )}
        <div className={`property-cards-row ${isMobile ? 'mobile-cards-row' : ''}`} ref={cardsRowRef}>
          {loading ? (
            <div style={{ color: '#223A5F', padding: '2rem', fontWeight: 600 }}>Loading properties...</div>
          ) : error ? (
            <div style={{ color: 'red', padding: '2rem', fontWeight: 600 }}>{error}</div>
          ) : properties.length === 0 ? (
            hasActiveFilter ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3rem 2rem',
                color: '#223A5F',
                textAlign: 'center',
                minWidth: '300px',
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem' }}>No properties found</h3>
                <p style={{ fontSize: '0.9rem', color: '#8a9bbf', margin: 0 }}>
                  Try a different location or adjust your filters.
                </p>
              </div>
            ) : (
              renderPropertyCard(sampleProperty, 0)
            )
          ) : (
            properties.map((prop, idx) => renderPropertyCard(prop, idx))
          )}
        </div>
      </div>

      <style>{`
        .property-cards-row-wrapper:hover .prop-scroll-btn {
          opacity: 1;
        }
        .prop-scroll-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 100;
          background: rgba(250, 248, 245, 0.65);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          color: #223A5F;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(34,58,95,0.15);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 0;
        }
        .prop-scroll-btn:hover {
          background: rgba(241, 217, 122, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.8);
          transform: translateY(-50%) scale(1.08);
          box-shadow: 0 10px 28px rgba(34,58,95,0.22);
        }
        .prop-scroll-btn.left {
          left: 20px;
        }
        .prop-scroll-btn.right {
          right: 20px;
        }
        .prop-scroll-btn svg {
          font-size: 20px;
        }
      `}</style>

    </section>
  );
};

export default PropertiesSection;