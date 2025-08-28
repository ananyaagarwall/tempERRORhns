import React, { useState, useRef, useEffect } from 'react';

const TABS = [
  { label: 'Western Mumbai', key: 'western' },
  { label: 'Central Mumbai', key: 'central' },
  { label: 'Mumbai South', key: 'south' },
  { label: 'Thane', key: 'thane' },
];

const AREAS = {
  western: [
    {
      name: 'Andheri',
      img: '/palm.jpg',
      projects: '240+ New Projects',
      price: '₹90L - 5.4 Cr',
    },
    {
      name: 'Kandivali',
      img: '/garden.jpeg',
      projects: '67+ New Projects',
      price: '₹2.2 Cr - 3.2 Cr',
    },
    {
      name: 'Bandra',
      img: '/rustomujee.jpg',
      projects: '70+ New Projects',
      price: '₹1.2 Cr - 9.4 Cr',
    },
    {
      name: 'Borivali',
      img: '/lodha.jpg',
      projects: '55+ New Projects',
      price: '₹1.1 Cr - 4.2 Cr',
    },
    {
      name: 'Malad',
      img: '/presidental.jpeg',
      projects: '80+ New Projects',
      price: '₹1.3 Cr - 4.8 Cr',
    },
    {
      name: 'Goregaon',
      img: '/kalpa.jpg',
      projects: '60+ New Projects',
      price: '₹1.5 Cr - 5.2 Cr',
    },
    {
      name: 'Vile Parle',
      img: '/news.jpg',
      projects: '45+ New Projects',
      price: '₹2.0 Cr - 7.0 Cr',
    },
  ],
  central: [
    {
      name: 'Dadar',
      img: '/capsule.jpeg',
      projects: '120+ New Projects',
      price: '₹1.5 Cr - 6.2 Cr',
    },
    {
      name: 'Kurla',
      img: '/famous.jpg',
      projects: '80+ New Projects',
      price: '₹90L - 2.8 Cr',
    },
    {
      name: 'Chembur',
      img: '/building.webp',
      projects: '60+ New Projects',
      price: '₹1.2 Cr - 4.5 Cr',
    },
    {
      name: 'Ghatkopar',
      img: '/Defining-Demand.jpg',
      projects: '50+ New Projects',
      price: '₹1.0 Cr - 3.8 Cr',
    },
  ],
  south: [
    {
      name: 'Colaba',
      img: '/residence-agencies.avif',
      projects: '60+ New Projects',
      price: '₹2.5 Cr - 12 Cr',
    },
    {
      name: 'Cuffe Parade',
      img: '/World-View-tower.jpg',
      projects: '40+ New Projects',
      price: '₹3.0 Cr - 15 Cr',
    },
    {
      name: 'Marine Drive',
      img: '/depositphotos.jpg',
      projects: '30+ New Projects',
      price: '₹4.0 Cr - 20 Cr',
    },
    {
      name: 'Worli',
      img: '/home-loan.webp',
      projects: '55+ New Projects',
      price: '₹2.8 Cr - 10 Cr',
    },
  ],
  thane: [
    {
      name: 'Thane West',
      img: '/HouseNSeek.png',
      projects: '110+ New Projects',
      price: '₹80L - 3.5 Cr',
    },
    {
      name: 'Ghodbunder',
      img: '/presidental.jpeg',
      projects: '70+ New Projects',
      price: '₹1.2 Cr - 4.0 Cr',
    },
    {
      name: 'Majiwada',
      img: '/lodha.jpg',
      projects: '60+ New Projects',
      price: '₹1.0 Cr - 3.2 Cr',
    },
    {
      name: 'Kolshet',
      img: '/garden.jpeg',
      projects: '50+ New Projects',
      price: '₹90L - 2.5 Cr',
    },
  ],
};

const BuildersSection = () => {
  const [activeTab, setActiveTab] = useState('western');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isLaptop, setIsLaptop] = useState(false);
  const tabRowRef = useRef(null);
  const cardsRowRef = useRef(null);
  
  let areas = AREAS[activeTab] || [];
  if (areas.length < 4) {
    areas = [...areas, ...Array(4 - areas.length).fill({})];
  }
  const visibleAreas = areas;

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsTablet(width <= 1024 && width > 768);
      setIsLaptop(width <= 1440 && width > 1024);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <section 
      className="landing-section bg-cream" 
      style={{
        paddingTop: isMobile ? 20 : 32, 
        paddingBottom: isMobile ? 4 : 8, // Reduced from 8:12 to 4:8
        marginBottom: isMobile ? 12 : 16, // Added margin bottom
        width: '100vw', 
        maxWidth: '100vw', 
        overflowX: 'hidden'
      }}
    >
      <div style={{
        textAlign: 'center', 
        margin: isMobile ? '0 0 20px 0' : '0 0 32px 0'
      }}>
        <h2 className="section-heading">Near You</h2>
        <span className="section-underline" />
      </div>
      
      {/* Tab Row - Fixed for Mobile */}
      <div 
        className="builders-tab-row-container" 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          width: '100%', 
          position: 'relative', 
          marginBottom: isMobile ? 16 : 12,
          paddingLeft: isMobile ? 16 : 24,
          paddingRight: isMobile ? 16 : 24,
          overflow: 'visible'
        }}
      >
        <div
          className="builders-tab-row-scrollable"
          ref={tabRowRef}
          style={{
            display: 'flex',
            gap: isMobile ? 12 : 12,
            overflow: isMobile ? 'auto' : 'hidden',
            scrollBehavior: 'smooth',
            width: '100%',
            paddingBottom: isMobile ? 4 : 0,
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="tab-button"
              style={{
                background: 'none',
                color: '#23487c',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: isMobile ? 13 : (isTablet ? 15 : 16),
                padding: isMobile ? '8px 16px' : (isTablet ? '9px 15px' : '10px 18px'),
                boxShadow: 'none',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.18s',
                borderBottom: activeTab === tab.key ? '3px solid #F9D87A' : '3px solid transparent',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                minWidth: isMobile ? 'auto' : 'fit-content'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      <style>{`
        .section-heading {
          font-size: ${isMobile ? '1.8rem' : (isTablet ? '2.1rem' : '2.5rem')};
          font-weight: 800;
          color: #223A5F;
          margin: 0;
          letter-spacing: -0.5px;
        }
        
        .section-underline {
          display: block;
          width: ${isMobile ? '60px' : (isTablet ? '70px' : '80px')};
          height: ${isMobile ? '3px' : '4px'};
          background: linear-gradient(90deg, #F1D97A 0%, #e6c76a 100%);
          margin: ${isMobile ? '8px auto 0' : '12px auto 0'};
          border-radius: 2px;
          box-shadow: 0 2px 4px rgba(241, 217, 122, 0.3);
        }
        
        .builders-tab-row-scrollable::-webkit-scrollbar {
          height: ${isMobile ? '2px' : '0'};
        }
        
        .builders-tab-row-scrollable::-webkit-scrollbar-track {
          background: rgba(241, 217, 122, 0.1);
          border-radius: 4px;
        }
        
        .builders-tab-row-scrollable::-webkit-scrollbar-thumb {
          background: rgba(241, 217, 122, 0.5);
          border-radius: 4px;
        }
        
        .tab-button:hover {
          color: #16386d !important;
          background: rgba(241, 217, 122, 0.05) !important;
        }
        
        .tab-button:active {
          transform: translateY(1px);
        }
        
        .builders-card-title,
        .builders-card-projects,
        .builders-card-price {
          color: #E6E1E1 !important;
        }
        .builders-card-btn {
          color: #223A5F !important;
          border-color: #E6E1E1 !important;
        }
        
        .builders-property-card {
          width: ${isMobile ? '280px' : (isTablet ? '300px' : (isLaptop ? '320px' : '340px'))};
          height: ${isMobile ? '240px' : (isTablet ? '210px' : (isLaptop ? '260px' : '220px'))};
          border-radius: ${isMobile ? '16px' : '22px'};
          flex-shrink: 0;
          overflow: hidden;
          position: relative;
          transition: transform 0.3s ease;
        }
        
        .builders-property-card.hoverable:hover {
          transform: translateY(-8px);
        }
        
        .builders-card-inner {
          width: 100%;
          height: 100%;
          position: relative;
          border-radius: ${isMobile ? '16px' : '22px'};
        }
        
        .builders-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%);
          border-radius: ${isMobile ? '16px' : '22px'};
        }
        
        .builders-card-content {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: ${isMobile ? '14px' : (isTablet ? '18px' : (isLaptop ? '22px' : '20px'))};
          z-index: 2;
        }
        
        .builders-card-title {
          font-size: ${isMobile ? '1.1rem' : (isTablet ? '1.3rem' : (isLaptop ? '1.35rem' : '1.4rem'))};
          font-weight: 700;
          margin-bottom: ${isMobile ? '4px' : (isLaptop ? '10px' : '8px')};
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }
        
        .builders-card-projects {
          font-size: ${isMobile ? '0.8rem' : (isTablet ? '0.9rem' : (isLaptop ? '0.92rem' : '0.95rem'))};
          margin-bottom: ${isMobile ? '3px' : (isLaptop ? '6px' : '5px')};
          opacity: 0.9;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }
        
        .builders-card-price {
          font-size: ${isMobile ? '0.95rem' : (isTablet ? '1.05rem' : (isLaptop ? '1.08rem' : '1.1rem'))};
          font-weight: 600;
          margin-bottom: ${isMobile ? '8px' : (isLaptop ? '14px' : '12px')};
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }
        
        .builders-card-buttons {
          display: flex;
          gap: ${isMobile ? '6px' : (isLaptop ? '12px' : '10px')};
          flex-wrap: ${isMobile ? 'wrap' : 'nowrap'};
          justify-content: ${isMobile ? 'flex-start' : 'flex-start'};
        }
        
        .builders-card-btn {
          background: rgba(255,255,255,0.9);
          border: 1px solid #E6E1E1;
          border-radius: ${isMobile ? '5px' : '8px'};
          padding: ${isMobile ? '5px 8px' : (isTablet ? '7px 12px' : (isLaptop ? '8px 15px' : '8px 14px'))};
          font-size: ${isMobile ? '0.7rem' : (isTablet ? '0.8rem' : (isLaptop ? '0.82rem' : '0.85rem'))};
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          backdrop-filter: blur(10px);
          flex: ${isMobile ? '1' : 'none'};
          min-width: ${isMobile ? '0' : 'auto'};
          text-align: center;
        }
        
        .builders-card-btn:hover {
          background: rgba(255,255,255,1);
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
      `}</style>
      
      <div 
        className="builders-cards-container" 
        style={{ 
          position: 'relative', 
          width: '100vw', 
          maxWidth: '100vw', 
          overflowX: 'auto', 
          WebkitOverflowScrolling: 'touch' 
        }}
      >
        <div
          className="builders-cards-row"
          ref={cardsRowRef}
          style={{
            display: 'flex',
            gap: isMobile ? 16 : (isTablet ? 24 : (isLaptop ? 28 : 32)),
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingLeft: isMobile ? 16 : (isTablet ? 18 : 24),
            paddingRight: isMobile ? 16 : (isTablet ? 18 : 24),
            scrollBehavior: 'smooth',
            overflowX: 'auto',
            flexWrap: 'nowrap',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {visibleAreas.map((area, idx) => (
            <div 
              key={idx} 
              className={`builders-property-card group${area.img ? ' hoverable' : ''}`}
            >
              {area.img ? (
                <div className="builders-card-inner" style={{background: `url(${area.img}) center/cover no-repeat`}}>
                  <div className="builders-card-overlay" />
                  
                  <div className="builders-card-content">
                    <div className="builders-card-title">{area.name}</div>
                    <div className="builders-card-projects">{area.projects}</div>
                    <div className="builders-card-price">{area.price}</div>
                    <div className="builders-card-buttons">
                      <button className="builders-card-btn">See builder</button>
                      <button className="builders-card-btn">See Reviews</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  width: '100%', 
                  height: '100%', 
                  background: '#f5f7fa', 
                  borderRadius: isMobile ? 16 : 22
                }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BuildersSection;
