import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  let val = priceStr.toString().replace(/₹|,|\+|\s/g, '').toLowerCase();
  try {
    if (val.includes('cr')) {
      return parseFloat(val.replace('cr', ''));
    } else if (val.includes('lakh')) {
      return parseFloat(val.replace('lakh', '')) / 100;
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

      <div className="property-confidence-badge">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 4 }}>
          <rect x="2" y="3" width="20" height="18" rx="6" fill="none" />
          <path d="M12 17.5L7.5 15.5V7.5C7.5 6.39543 8.39543 5.5 9.5 5.5H14.5C15.6046 5.5 16.5 6.39543 16.5 7.5V15.5L12 17.5Z" stroke="#223A5F" strokeWidth="1.5" />
          <path d="M12 10.5L12.866 12.134C12.9472 12.2872 13.0906 12.3978 13.2598 12.4292L15.0711 12.7712C15.4952 12.8492 15.6682 13.3722 15.3522 13.6682L13.9522 14.9682C13.8252 15.0862 13.7652 15.2662 13.8002 15.4412L14.1712 17.2412C14.2562 17.6652 13.8032 17.9902 13.4292 17.7712L12 16.9412L10.5708 17.7712C10.1968 17.9902 9.74377 17.6652 9.82877 17.2412L10.1998 15.4412C10.2348 15.2662 10.1748 15.0862 10.0478 14.9682L8.64777 13.6682C8.33177 13.3722 8.50477 12.8492 8.92877 12.7712L10.7402 12.4292C10.9094 12.3978 11.0528 12.2872 11.134 12.134L12 10.5Z" stroke="#223A5F" strokeWidth="1.2" />
        </svg>
        <span>{prop.confidence}</span>
      </div>
      
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

      <style>{`
        .mobile-cards-row {
          padding: 20px 10px ;
          margin: 30px 0;
          gap: 12px ;
        }
        .mobile-card {
          width: 220px !important;
          height: 300px !important;
          margin: 10px 2px;
        }

        .section-heading {
          margin-bottom: 0 !important;
        }
        .section-underline {
          display: block !important;
          width: 80px !important;
          height: 4px !important;
          background: linear-gradient(90deg, #F1D97A 0%, #e6c76a 100%) !important;
          margin: 12px auto 0 !important;
          border-radius: 2px !important;
          box-shadow: 0 2px 4px rgba(241, 217, 122, 0.3) !important;
        }
        .property-header-stack {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          margin-bottom: 32px;
        }
        .property-header-stack-mobile {
          margin-bottom: 24px;
          margin-top: 0.5rem;
        }
        .property-toggle-pill-group-mobile {
          background: #f7f9ff;
          border-radius: 22px;
          box-shadow: 0 2px 12px 0 rgba(34,58,95,0.10);
          padding: 8px 6px;
          margin-bottom: 0.5rem;
          display: flex;
          gap: 10px;
          z-index: 20;
          position: relative;
        }
        .property-toggle-pill-btn {
          background: #fcfbf7;
          border: 1.5px solid #e6eaf0;
          border-radius: 32px;
          font-weight: 700;
          color: #223A5F;
          transition: background 0.18s, color 0.18s, box-shadow 0.18s;
          padding: 10px 18px;
          font-size: 0.85rem;
          cursor: pointer;
          z-index: 20;
          position: relative;
        }
        .property-toggle-pill-btn:active, .property-toggle-pill-btn:focus {
          background: #e6eaf0 !important;
          color: #23487c !important;
          box-shadow: 0 2px 8px 0 rgba(34,58,95,0.13);
        }
        .property-toggle-pill-btn:hover {
          background: #f1f5fa !important;
          color: #23487c !important;
          box-shadow: 0 2px 8px 0 rgba(34,58,95,0.13);
        }
        .property-viewall-link {
          font-size: 1.02rem;
          margin-left: 0;
          position: static;
          font-weight: 700;
          color: #223A5F;
          text-decoration: none;
          letter-spacing: 0.5px;
          margin-bottom: 0.5rem;
          display: inline-block;
        }
        .property-section-custom {
          padding: 24px 16px;
          box-sizing: border-box;
          max-width: 1460px;
          margin: 24px auto 60px auto;
          transition: background 0.18s;
          overflow: hidden;
          border-radius: 24px;
        }
        .property-cards-row-wrapper {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
         padding: 20px 0;        /* Reduced from 40px */
          margin: 20px 0 0 0;    /* Add positive top margin instead of negative */
          overflow: hidden;
          background: white;
          border-radius: 8px;
        }
        .property-cards-row {
          display: flex;
          flex-direction: row;
          flex-wrap: nowrap;
          gap: 20px;
          justify-content: flex-start;
          align-items: flex-start;
          width: 100%;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding: 20px 16px;     /* Reduced from 40px */
          margin: 0;              /* Remove negative margin */
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
          scroll-snap-type: x mandatory;
          position: relative;
          left: 0;
          right: 0;
        }
        .property-cards-row::-webkit-scrollbar {
          display: none;
        }
        .property-card-custom {
          position: relative;
          width: 340px;
          height: 360px;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(34,58,95,0.13);
          background: #222;
          flex-shrink: 0;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 10px solid #42555F;
          cursor: pointer;
          z-index: 1;
          scroll-snap-align: start;
        }
        .property-card-custom:hover {
          transform: translateY(-8px);
          box-shadow: 0 8px 32px rgba(34,58,95,0.25), 0 4px 16px rgba(34,58,95,0.15);
          z-index: 10;
        }
        .property-card-custom:hover .property-img-custom {
          filter: brightness(1.1);
          transform: scale(1.02);
        }
        .property-card-custom:hover .property-confidence-badge {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(34,58,95,0.2);
        }
        .property-img-custom {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: brightness(0.88);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .property-confidence-badge {
          position: absolute;
          top: 14px;
          right: 14px;
          background: #F1D97A;
          color: #223A5F;
          border-radius: 8px;
          padding: 4px 10px;
          font-weight: 700;
          font-size: 0.92rem;
          display: flex;
          align-items: center;
          box-shadow: 0 2px 8px rgba(34,58,95,0.10);
          z-index: 2;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .property-overlay-custom {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 20px 16px 16px 16px;
          background: linear-gradient(180deg, rgba(0,0,0,0.10) 50%, rgba(0,0,0,0.85) 100%);
          z-index: 1;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .property-card-custom:hover .property-overlay-custom {
          background: linear-gradient(180deg, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.9) 100%);
        }
        .property-info-custom h2 {
          color: #fff;
          font-size: 1.4rem;
          font-weight: 700;
          margin: 0 0 8px 0;
          text-shadow: 0 2px 8px rgba(0,0,0,0.5);
        }
        .property-address-custom, .property-details-custom, .property-price-custom {
          color: #fff;
          margin: 0 0 4px 0;
          font-size: 1.05rem;
          opacity: 0.92;
          text-shadow: 0 1px 4px rgba(0,0,0,0.5);
          display: flex;
          align-items: flex-start;
          gap: 4px;
          line-height: 1.3;
          word-break: break-word;
        }
        .property-bottom-row {
          display: flex;
          flex-direction: column;  /* Stack items vertically */
          padding-left: 12px; /* Align items to the left */
          margin-top: 16px;
}
        .property-details-custom {
          margin: 0;
          flex: 1;
        }
        .property-price-custom {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 700;
          text-align: left;
        }
        .location-icon {
          flex-shrink: 0;
          margin-top: 2px;
          font-size: 1.2rem;
          color: #ffffff;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.8));
        }

        .property-toggle-pill-group {
          display: flex;
          gap: 10px;
          z-index: 20;
          position: relative;
        }

        .property-header-row-responsive {
          width: 100%;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          gap: 0;
          margin-top: 8px;
          margin-bottom: 24px;
          z-index: 20;
          position: relative;
        }

        /* Tablet Styles (701px - 1024px) */
        @media (min-width: 701px) and (max-width: 1024px) {
          .property-section-custom {
            padding: 20px 24px;
            margin: 16px auto 48px auto;
            max-width: 1000px;
          }
          .section-heading {
            font-size: 2.2rem;
          }
          .property-cards-row-wrapper {
            padding: 36px 0;
            margin: -36px 0;
          }
          .property-cards-row {
            gap: 18px;
            padding: 36px 16px;
            margin: -36px 0;
          }
          .property-card-custom {
            width: 280px;
            height: 320px;
            border-radius: 16px;
            border: 8px solid #42555F;
          }
          .property-info-custom h2 { font-size: 1.25rem; }
          .property-address-custom, .property-details-custom { font-size: 0.95rem; }
          .property-price-custom { font-size: 1.05rem; }
          .property-confidence-badge { padding: 3px 9px; font-size: 0.85rem; }
        }

        /* Mobile Styles (up to 700px) */
        @media (max-width: 700px) {
        .property-address-custom {
          color: #fff;
          margin: 8px 10px 4px 0;
          font-size: 1.05rem;
          opacity: 0.92;
          text-shadow: 0 1px 4px rgba(0,0,0,0.5);
          display: flex;
          align-items: flex-start; /* <-- change from center to flex-start */
          gap: 4px;
          line-height: 1.3;
          word-break: break-word;
        }
        .location-icon {
          flex-shrink: 0;
          margin-top: 2px; /* optional: tweak for perfect alignment */
          font-size: 1.1rem;
          color: #ffffff;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.8));
        }
          .property-section-custom {
            padding: 16px 10px 24px 10px;
            margin: 20px 10px 32px 10px;
            border-radius: 18px;
          }

          .section-heading {
            font-size: 1.8rem;
          }

          .section-underline {
            width: 60px;
            height: 10px;
          }

          .property-toggle-pill-btn {
            padding: 8px 12px;
            font-size: 0.8rem;
          }

          .property-header-stack-mobile {
            margin-bottom: 40px;
          }

          .property-cards-row {
            gap: 16px;
            padding: 32px 16px;
            margin: 32px 10px;
            overflow-y: hidden;
          }

          .property-cards-row-wrapper {
            padding: 32px 0;
            margin: 32px 0;
            overflow: visible;
          }

          .property-card-custom {
            width: 260px;
            height: 300px;
            border-radius: 16px;
            border: 6px solid #42555F;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1;
          }
          
          .property-card-custom:hover {
            transform: translateY(-6px);
            box-shadow: 0 6px 24px rgba(34,58,95,0.25), 0 3px 12px rgba(34,58,95,0.15);
            z-index: 10;
          }
          
          .property-card-custom:hover .property-img-custom {
            filter: brightness(1.1);
            transform: scale(1.03);
          }

          .property-confidence-badge {
            top: 10px;
            right: 10px;
            padding: 3px 8px;
            font-size: 0.8rem;
          }

          .property-overlay-custom {
            padding: 16px 12px;
            background: linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.9) 100%);
          }

          .property-info-custom h2 {
            font-size: 1.2rem;
            margin-bottom: 6px;
          }

          .property-address-custom, .property-details-custom {
            font-size: 0.9rem;
            margin-bottom: 3px;
          }

          .property-bottom-row {
            margin-top: 12px;
            padding-left: 12px;
          }
          
          .property-details-custom {
            margin: 10;
            flex: 1;
          }
          
          .property-price-custom {
            font-size: 1.05rem;
            margin-top: 4px;
          }
          
          .property-buttons-custom {
            gap: 6px;
            margin-top: 8px;
          }
          
          .property-btn-custom {
            padding: 5px 8px;
            font-size: 0.75rem;
          }
        }

        /* Small Mobile (320px - 480px) */
        @media (max-width: 480px) {
          .property-section-custom {
            padding: 16px 10px 24px 10px;
            margin: 8px 10px 32px 10px;
            border-radius: 18px;
          }

          .section-heading {
            font-size: 1.6rem;
          }

          .section-underline {
            width: 50px;
            height: 2px;
          }

          .property-toggle-pill-btn {
            padding: 6px 10px;
            font-size: 0.75rem;
          }

          .property-cards-row {
            gap: 12px;
            padding: 12px 10px;
            margin: 12px 10px;
            overflow-y: hidden;
          }

          .property-cards-row-wrapper {
            padding: 12px 0;
            margin: -12px 0;
            overflow: visible;
          }

          .property-card-custom {
            width: 240px;
            height: 280px;
            border-radius: 12px;
            border: 4px solid #42555F;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1;
          }
          
          .property-card-custom:hover {
            transform: translateY(-4px);
            box-shadow: 0 4px 20px rgba(34,58,95,0.25), 0 2px 8px rgba(34,58,95,0.15);
            z-index: 10;
          }
          
          .property-card-custom:hover .property-img-custom {
            filter: brightness(1.1);
            transform: scale(1.01);
          }

          .property-confidence-badge {
            top: 8px;
            right: 8px;
            padding: 2px 6px;
            font-size: 0.75rem;
          }

          .property-overlay-custom {
            padding: 12px 10px;
          }

          .property-info-custom h2 {
            font-size: 1rem;
            margin-bottom: 4px;
          }

          .property-address-custom, .property-details-custom {
            font-size: 0.8rem;
            margin-bottom: 2px;
          }

          .property-bottom-row {
            margin-top: 4px;
            padding-left: 12px;
          }
          
          .property-details-custom {
            margin: 0;
            flex: 1;
          }
          
          .property-price-custom {
            font-size: 0.95rem;
            margin-top: 3px;
          }
        }

        /* Extra Small Mobile (below 320px) */
        @media (max-width: 319px) {
          .property-section-custom {
            padding: 16px 16px 24px 16px;
            margin: 8px 16px 32px 16px;
            border-radius: 18px;
          }

          .section-heading {
            font-size: 1.4rem;
          }

          .property-toggle-pill-btn {
            padding: 5px 8px;
            font-size: 0.7rem;
          }

          .property-cards-row {
            gap: 10px;
            padding: 10px 10px;
            margin: -10px 0;
            overflow-y: hidden;
          }

          .property-cards-row-wrapper {
            padding: 10px 0;
            margin: -10px 0;
            overflow: visible;
          }

          .property-card-custom {
            width: 220px;
            height: 260px;
            border: 3px solid #42555F;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1;
          }
          
          .property-card-custom:hover {
            transform: translateY(-3px);
            box-shadow: 0 3px 16px rgba(34,58,95,0.25), 0 2px 6px rgba(34,58,95,0.15);
            z-index: 10;
          }
          
          .property-card-custom:hover .property-img-custom {
            filter: brightness(1.1);
            transform: scale(1.01);
          }

          .property-confidence-badge {
            top: 6px;
            right: 6px;
            padding: 2px 5px;
            font-size: 0.7rem;
          }

          .property-overlay-custom {
            padding: 10px 8px;
          }

          .property-info-custom h2 {
            font-size: 0.9rem;
            margin-bottom: 3px;
          }

          .property-address-custom, .property-details-custom {
            font-size: 0.75rem;
            margin-bottom: 2px;
          }

          .property-bottom-row {
            
            margin-top: 10px;
            padding-left: 12px;
          }
          
          .property-details-custom {
            margin: 0;
            flex: 1;
          }
          
          .property-price-custom {
            margin: 0;
            font-size: 0.85rem;
            margin-top: 2px;
            text-align: left;
          }
        }
      `}</style>
    </section>
  );
};

export default PropertiesSection;
