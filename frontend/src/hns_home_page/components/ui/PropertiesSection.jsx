// src/hns_home_page/components/ui/PropertiesSection.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { CiLocationOn } from 'react-icons/ci';
import { useCart } from '../../../hns_cart_page/js/CartContent.jsx';
import initPropertyCardHandlers from '../../home_page_js/propertyCards.js';
import '../../home_page_css/PropertiesSection.css';
import { useProperties } from '../../../queries/properties';
import { useDebounce } from '../../../hooks/useDebounce';

// Heart Icon Component
const HeartIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const AZURE_BASE = 'https://hnsblob001.blob.core.windows.net/hns-media';

function getCardImage(prop) {
  const primary = prop.builder_project_image || (prop.img && prop.img !== '/Presidential Towers.jpg.png' ? prop.img : null);
  if (primary) return primary;

  if (prop.project_id) {
    return `${AZURE_BASE}/projects/${prop.project_id}/gallery/img1.jpg`;
  }
  return '/Presidential Towers.jpg.png';
}

const sampleProperty = {
  img: '/Presidential Towers.jpg.png',
  name: 'Sample Property',
  address: 'Sample Address, Navi Mumbai',
  features: '3 BHK | Pool',
  price: '₹ 1.2 Cr +',
  confidence: '93%',
};

// Map raw API shape to the shape this component needs
function mapProperty(p) {
  return {
    id: p._id || p.id || '',
    name: p.Property_Name || '',
    address: p.Location || p.Address || '',
    price: p.Price_Starting_From || p.Pricing || '',
    confidence: p.confidence || '',
    img: p.image || p.builder_project_image || '/Presidential Towers.jpg.png',
    project_id: p.project_id || null,
    builder_project_image: p.builder_project_image || null,
    features: p.Features || '',
    Existing_Configurations: p.Existing_Configurations || [],
  };
}

const DEFAULT_FILTERS = {
  location: '',
  priceRange: 0,
  minBudget: null,
  maxBudget: null,
  bhkTypes: [],
  bhkSearch: '',
  amenities: [],
};

const PropertiesSection = ({ searchFilters = DEFAULT_FILTERS }) => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 700 : false
  );
  const cardsRowRef = useRef(null);
  const navigate = useNavigate();
  const { addToCart, removeFromCart, isInCart } = useCart();

  // Debounce the entire filters object — prevents a TQ query on every keystroke
  const debouncedFilters = useDebounce(searchFilters, 400);

  // Build a clean, serialisable filters object for the query key
  const queryFilters = {
    location: debouncedFilters.location || undefined,
    priceRange: debouncedFilters.priceRange || undefined,
    minBudget: debouncedFilters.minBudget ?? undefined,
    maxBudget: debouncedFilters.maxBudget ?? undefined,
    bhkTypes: debouncedFilters.bhkTypes?.length ? debouncedFilters.bhkTypes : undefined,
    bhkSearch: debouncedFilters.bhkSearch || undefined,
    amenities: debouncedFilters.amenities?.length ? debouncedFilters.amenities : undefined,
  };

  // TanStack Query — caches result, deduplicates identical filter combos
  const { data: rawData, isLoading, isFetching, isError } = useProperties(queryFilters);

  const properties = Array.isArray(rawData) ? rawData.map(mapProperty) : [];

  // Resize listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 700);
    window.addEventListener('resize', handleResize);
    initPropertyCardHandlers();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scrollCards = (direction) => {
    if (!cardsRowRef.current) return;
    const scrollAmount = 720;
    cardsRowRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleHeartClick = (e, property) => {
    e.stopPropagation();
    if (isInCart(property.id)) {
      removeFromCart(property.id);
    } else {
      addToCart(property, 'featured');
    }
  };

  const handleCardClick = (prop) => {
    const propertyData = {
      id: prop.id,
      name: prop.name,
      address: prop.address,
      features: prop.features,
      price: prop.price,
      confidence: prop.confidence,
      clickedAt: new Date().toISOString(),
    };
    localStorage.setItem('lastClickedProperty', JSON.stringify(propertyData));
    let recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewedProperties') || '[]');
    const existingIndex = recentlyViewed.findIndex(
      (p) => p.name === prop.name && p.address === prop.address
    );
    if (existingIndex !== -1) recentlyViewed.splice(existingIndex, 1);
    recentlyViewed.unshift(propertyData);
    recentlyViewed = recentlyViewed.slice(0, 5);
    localStorage.setItem('recentlyViewedProperties', JSON.stringify(recentlyViewed));
    navigate(`/property/${prop.id}`);
  };

  const renderPropertyCard = (prop, idx) => (
    <div
      className={`property-card-custom ${isMobile ? 'mobile-card' : ''}`}
      key={prop.id || idx}
      onClick={() => handleCardClick(prop)}
    >
      <img
        src={getCardImage(prop)}
        alt={prop.name}
        className="property-img-custom"
        loading="lazy"
        decoding="async"
        onError={(e) => {
          const tried = e.currentTarget.dataset.tried || '';
          if (!tried.includes('img1') && prop.project_id) {
            e.currentTarget.dataset.tried = tried + 'img1';
            e.currentTarget.src = `${AZURE_BASE}/projects/${prop.project_id}/gallery/img1.jpg`;
          } else if (!tried.includes('static')) {
            e.currentTarget.dataset.tried = (tried || '') + 'static';
            e.currentTarget.src = '/Presidential Towers.jpg.png';
          }
        }}
      />

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
          <p className="property-address-custom">
            <CiLocationOn className="location-icon" />
            {prop.address}
          </p>
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
        <h2
          style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            color: '#223A5F',
            margin: 0,
            letterSpacing: '-0.5px',
            fontFamily: "'Abril Fatface', serif",
          }}
        >
          Properties
        </h2>
        <span
          style={{
            display: 'block',
            width: '80px',
            height: '4px',
            background: 'linear-gradient(90deg, #F1D97A 0%, #e6c76a 100%)',
            margin: '12px auto 0',
            marginBottom: '20px',
            borderRadius: '2px',
            boxShadow: '0 2px 4px rgba(241, 217, 122, 0.3)',
          }}
        />
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
          {isLoading ? (
            <div style={{ color: '#223A5F', padding: '2rem', fontWeight: 600 }}>
              Loading properties...
            </div>
          ) : isError ? (
            <div style={{ color: 'red', padding: '2rem', fontWeight: 600 }}>
              Failed to fetch properties
            </div>
          ) : properties.length === 0 ? (
            hasActiveFilter ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '3rem 2rem',
                  color: '#223A5F',
                  textAlign: 'center',
                  minWidth: '300px',
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
                  No properties found
                </h3>
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
          {/* Background refetch indicator (subtle) */}
          {isFetching && !isLoading && (
            <div
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#F1D97A',
                opacity: 0.7,
              }}
              title="Refreshing..."
            />
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
        .prop-scroll-btn.left { left: 20px; }
        .prop-scroll-btn.right { right: 20px; }
        .prop-scroll-btn svg { font-size: 20px; }
      `}</style>
    </section>
  );
};

export default PropertiesSection;