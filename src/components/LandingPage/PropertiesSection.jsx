import React, { useState, useRef, useEffect } from 'react';

// Hardcoded API URL to avoid ReferenceError in browser
const API_URL = 'http://localhost:5000/api';

const PropertiesSection = () => {
  const [activeTab, setActiveTab] = useState('navi');
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 700 : false);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cardsRowRef = useRef(null);

  // Function to transform backend data to frontend format
  const transformProjectData = (projects) => {
    return projects.map(project => {
      // Always use the sample image for now
      const img = 'dummy_building.jpeg';
      // Parse amenities and join them
      let amenities = [];
      try {
        amenities = project.amenities ? JSON.parse(project.amenities) : [];
        if (!Array.isArray(amenities)) amenities = [amenities];
      } catch {
        amenities = project.amenities ? [project.amenities] : [];
      }
      const features = amenities.length > 0 ? amenities.join(' | ') : 'Basic Amenities';
      // Build address from flat_number, location, and full_address
      const addressParts = [];
      if (project.flat_number) addressParts.push(project.flat_number);
      if (project.location) addressParts.push(project.location);
      if (project.full_address) addressParts.push(project.full_address);
      const address = addressParts.length > 0 ? addressParts.join(', ') : 'Location details coming soon';
      return {
        img,
        name: project.title || 'Project Title',
        address: address,
        features: features,
        price: project.price_range && project.price_range.trim() !== '' ? project.price_range : '₹ Price on request',
        confidence: '95%',
        id: project.id
      };
    });
  };

  // Fallback data in case API fails
  const fallbackData = [
    {
      img: '/main-image.jpeg',
      name: 'Sample Project',
      address: 'Location details coming soon',
      features: 'Basic Amenities',
      price: '₹ Price on request',
      confidence: '95%',
      id: 'fallback-1'
    }
  ];

  // Fetch projects from backend
  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/projects`);
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const data = await response.json();
      const transformedData = transformProjectData(data);
      setProperties(transformedData);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load properties. Please try again later.');
      // Use fallback data instead of empty array
      setProperties(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 700);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scrollByCard = (direction) => {
    const row = cardsRowRef.current;
    if (!row) return;
    const card = row.querySelector('.property-card-custom');
    if (!card) return;
    const scrollAmount = card.offsetWidth + 20; // 20px gap
    row.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
  };

  return (
    <section className="property-section-custom">
      {/* Header and Toggle Group - now above card row */}
      <div className="property-header-vertical">
        <div className={`property-header-stack${isMobile ? ' property-header-stack-mobile' : ''}`}>
          <h2 className="section-heading property-section-title-center">Properties</h2>
          <span className="section-underline" />
          {isMobile && (
            <div className="property-toggle-pill-group property-toggle-pill-group-mobile" style={{ marginTop: 12, marginBottom: 8 }}>
              <button
                className={`property-toggle-pill-btn${activeTab === 'navi' ? ' active' : ''}`}
                onClick={() => setActiveTab('navi')}
              >
                BUY IN NAVI MUMBAI
              </button>
              <button
                className={`property-toggle-pill-btn${activeTab === 'newcity' ? ' active' : ''}`}
                onClick={() => setActiveTab('newcity')}
              >
                EXPLORE NEW CITY
              </button>
            </div>
          )}
        </div>
        {isMobile ? (
          <a className="property-viewall-link property-viewall-mobile-below" href="#" style={{ margin: '0 0 10px 0', display: 'block', textAlign: 'right', fontWeight: 600 }}>VIEW ALL &gt;</a>
        ) : (
          <div className="property-header-row-responsive" style={{ width: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 0, marginTop: 8, marginBottom: 8 }}>
            <div className="property-toggle-pill-group">
              <button
                className={`property-toggle-pill-btn${activeTab === 'navi' ? ' active' : ''}`}
                onClick={() => setActiveTab('navi')}
              >
                BUY IN NAVI MUMBAI
              </button>
              <button
                className={`property-toggle-pill-btn${activeTab === 'newcity' ? ' active' : ''}`}
                onClick={() => setActiveTab('newcity')}
              >
                EXPLORE NEW CITY
              </button>
            </div>
            <a className="property-viewall-link" href="#">VIEW ALL &gt;</a>
          </div>
        )}
      </div>
      {/* Property Cards Row with Arrows */}
      <div className="property-cards-row-wrapper">
        {/* Removed left arrow button */}
        <div className="property-cards-row" ref={cardsRowRef}>
          {properties.map((prop, idx) => (
            <div className="property-card-custom" key={prop.id || idx}>
              <img 
                src={prop.img} 
                alt={prop.name} 
                className="property-img-custom"
                onError={(e) => {
                  e.target.src = '/main-image.jpeg'; // Fallback image
                }}
              />
              {/* Confidence Badge (right, styled like previous right badge) */}
              <div className="property-confidence-badge">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 4 }}>
                  <rect x="2" y="3" width="20" height="18" rx="6" fill="none"/>
                  <path d="M12 17.5L7.5 15.5V7.5C7.5 6.39543 8.39543 5.5 9.5 5.5H14.5C15.6046 5.5 16.5 6.39543 16.5 7.5V15.5L12 17.5Z" stroke="#223A5F" strokeWidth="1.5"/>
                  <path d="M12 10.5L12.866 12.134C12.9472 12.2872 13.0906 12.3978 13.2598 12.4292L15.0711 12.7712C15.4952 12.8492 15.6682 13.3722 15.3522 13.6682L13.9522 14.9682C13.8252 15.0862 13.7652 15.2662 13.8002 15.4412L14.1712 17.2412C14.2562 17.6652 13.8032 17.9902 13.4292 17.7712L12 16.9412L10.5708 17.7712C10.1968 17.9902 9.74377 17.6652 9.82877 17.2412L10.1998 15.4412C10.2348 15.2662 10.1748 15.0862 10.0478 14.9682L8.64777 13.6682C8.33177 13.3722 8.50477 12.8492 8.92877 12.7712L10.7402 12.4292C10.9094 12.3978 11.0528 12.2872 11.134 12.134L12 10.5Z" stroke="#223A5F" strokeWidth="1.2"/>
                </svg>
                <span>{prop.confidence}</span>
              </div>
              <div className="property-overlay-custom">
                <div className="property-info-custom">
                  <h2>{prop.name}</h2>
                  <p className="property-address-custom">📍 {prop.address}</p>
                  <p className="property-details-custom">{prop.features}</p>
                  <p className="property-price-custom">{prop.price}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Removed right arrow button */}
      </div>
      <style>{`
        .section-heading {
          margin-bottom: 0 !important;
        }
        .section-underline {
          margin-top: 0 !important;
          display: block;
          width: 80px;
          height: 4px;
          background: linear-gradient(90deg, #F1D97A 0%, #e6c76a 100%);
          margin: 12px auto 0;
          border-radius: 2px;
          box-shadow: 0 2px 4px rgba(241, 217, 122, 0.3);
        }
        .property-header-stack {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          margin-bottom: 18px;
        }
        .property-header-stack-mobile {
          margin-bottom: 0.5rem;
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
          background: #f9f6ee;
          border-radius: 18px;
          padding: 24px;
          box-sizing: border-box;
          max-width: 1460px;
          margin: 0 auto;
          transition: background 0.18s;
        }
        .property-cards-row-wrapper {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
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
          transition: transform 0.2s;
          border: 10px solid #42555F;
        }
        .property-card-custom:hover {
          transform: translateY(-6px) scale(1.02);
        }
        .property-img-custom {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: brightness(0.88);
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
        }
        .property-overlay-custom {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 20px 16px;
          background: linear-gradient(180deg, rgba(0,0,0,0.10) 50%, rgba(0,0,0,0.85) 100%);
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
        }
        .property-price-custom {
          font-size: 1.15rem;
          font-weight: 700;
          margin-top: 6px;
        }

        /* Mobile Styles (up to 700px) */
        @media (max-width: 700px) {
          .property-section-custom {
            padding: 16px;
            margin: 0 8px;
            border-radius: 12px;
          }

          .section-heading {
            font-size: 1.8rem;
          }

          .section-underline {
            width: 60px;
            height: 3px;
          }

          .property-toggle-pill-btn {
            padding: 8px 12px;
            font-size: 0.8rem;
          }

          .property-cards-row {
            gap: 16px;
          }

          .property-card-custom {
            width: 280px;
            height: 320px;
            border-radius: 16px;
            border: 6px solid #42555F;
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

          .property-price-custom {
            font-size: 1.05rem;
            margin-top: 4px;
          }
        }

        /* Small Mobile (320px - 480px) */
        @media (max-width: 480px) {
          .property-section-custom {
            padding: 12px;
            margin: 0 4px;
            border-radius: 10px;
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
          }

          .property-card-custom {
            width: 240px;
            height: 280px;
            border-radius: 12px;
            border: 4px solid #42555F;
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

          .property-price-custom {
            font-size: 0.95rem;
            margin-top: 3px;
          }
        }

        /* Extra Small Mobile (below 320px) */
        @media (max-width: 319px) {
          .property-section-custom {
            padding: 10px;
            margin: 0 2px;
          }

          .section-heading {
            font-size: 1.4rem;
          }

          .property-toggle-pill-btn {
            padding: 5px 8px;
            font-size: 0.7rem;
          }

          .property-card-custom {
            width: 220px;
            height: 260px;
            border: 3px solid #42555F;
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

          .property-price-custom {
            font-size: 0.85rem;
            margin-top: 2px;
          }
        }
      `}</style>
    </section>
  );
};

export default PropertiesSection;
