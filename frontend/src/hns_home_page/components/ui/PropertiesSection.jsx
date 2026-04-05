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

const PropertiesSection = ({ searchFilters }) => {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 700 : false);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cardsRowRef = useRef(null);
  const navigate = useNavigate();
  const { addToCart, removeFromCart, isInCart } = useCart();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 700);
    window.addEventListener('resize', handleResize);
    initPropertyCardHandlers();

    const getProperties = async () => {
      try {
        const data = await fetchProperties({ location: searchFilters.location });
        const mapped = Array.isArray(data) ? data.map(p => ({
          id: p._id || p.id || '',
          name: p.Property_Name || '',
          address: p.Address || p.Location || '',
          price: p.Price_Starting_From || p.Pricing || '',
          confidence: p.confidence || '',
          img: p.image || '/Presidential Towers.jpg.png',
          features: p.Features || '',
          Existing_Configurations: p.Existing_Configurations || [],
        })) : [];
        setProperties(mapped);
        setError(null);
      } catch (err) {
        setError('Failed to fetch properties');
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };
    getProperties();

    return () => window.removeEventListener('resize', handleResize);
  }, [searchFilters.location]);

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
      <img src={prop.img} alt={prop.name} className="property-img-custom" />

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
              className="scroll-btn left"
              onClick={() => scrollCards('left')}
              aria-label="Scroll left"
            >
              <FaChevronLeft />
            </button>
            <button
              className="scroll-btn right"
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
            renderPropertyCard(sampleProperty, 0)
          ) : (
            properties
              .filter(prop => {
                const priceValue = parsePriceInCr(prop.price);
                const priceMatch = !searchFilters.priceRange || (priceValue && priceValue <= searchFilters.priceRange);
                let bhkMatch = true;
                if (searchFilters.bhkTypes && searchFilters.bhkTypes.length > 0) {
                  if (prop.Existing_Configurations && Array.isArray(prop.Existing_Configurations)) {
                    bhkMatch = searchFilters.bhkTypes.some(type =>
                      prop.Existing_Configurations.some(cfg => cfg.type && cfg.type.toLowerCase().includes(type.replace('bhk', ' bhk')))
                    );
                  } else {
                    bhkMatch = false;
                  }
                }
                return priceMatch && bhkMatch;
              })
              .map((prop, idx) => renderPropertyCard(prop, idx))
          )}
        </div>
      </div>

    </section>
  );
};

export default PropertiesSection;
