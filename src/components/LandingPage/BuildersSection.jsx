import React, { useState, useRef, useEffect } from 'react';
import './css/BuildersSection.css';

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

  // Get responsive margins based on screen size
  const getResponsiveMargins = () => {
    const width = window.innerWidth;
    if (width <= 480) {
      return { padding: '12px', margin: '0 4px', paddingRight: '20px' };
    } else if (width <= 768) {
      return { padding: '16px', margin: '0 8px', paddingRight: '24px' };
    } else {
      return { padding: '20px', margin: '0 auto' };
    }
  };

  const responsiveStyles = getResponsiveMargins();

  return (
    <section 
      className={`landing-section bg-cream builders-section ${isMobile ? 'mobile' : ''}`}
      style={{
        padding: responsiveStyles.padding,
        margin: responsiveStyles.margin
      }}
    >
      <div className={`builders-section-header ${isMobile ? 'mobile' : ''}`}>
        <div style={{ textAlign: 'center' }}>
          <h2 className="section-heading">Near You</h2>
          <span className="section-underline" />
        </div>
      </div>
      
      {/* Tab Row - Subtle left margin adjustment */}
      <div 
        className={`builders-tab-row-container ${isMobile ? 'mobile' : ''} ${isTablet ? 'tablet' : ''}`}
      >
        <div
          className={`builders-tab-row-scrollable ${isMobile ? 'mobile' : ''}`}
          ref={tabRowRef}
        >
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`tab-button ${activeTab === tab.key ? 'active' : ''} ${isMobile ? 'mobile' : ''} ${isTablet ? 'tablet' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      

      
      <div 
        className={`builders-cards-container ${isMobile ? 'mobile' : ''}`}
      >
        <div
          className={`builders-cards-row ${isMobile ? 'mobile' : ''} ${isTablet ? 'tablet' : ''} ${isLaptop ? 'laptop' : ''}`}
          ref={cardsRowRef}
        >
          {visibleAreas.map((area, idx) => (
            <div 
              key={idx} 
              className={`builders-property-card group${area.img ? ' hoverable' : ''}`}
            >
              {area.img ? (
                <div className="builders-card-inner" style={{background: `url(${area.img}) center/cover no-repeat`, border: 'none'}}>
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
                <div className={`builders-card-empty ${isMobile ? 'mobile' : ''}`} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BuildersSection;
