import React, { useState, useEffect } from 'react';

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

  // Mobile Layout with Desktop-Style Card Content
  if (isMobile) {
    return (
      <section
        style={{
          background: '#F7F9FF',
          borderRadius: 18,
          padding: '24px 0 32px 0',
          margin: '24px 0',
          maxWidth: '100vw',
          boxSizing: 'border-box',
          position: 'relative',
          overflowX: 'hidden',
        }}
      >
        <div style={{
          textAlign: 'center',
          margin: '0 0 24px 0',
          paddingLeft: 16,
          paddingRight: 16,
        }}>
          <h2 style={{
            fontSize: '1.8rem',
            fontWeight: 800,
            color: '#223A5F',
            margin: 0,
            letterSpacing: '-0.5px'
          }}>
            Explore Trusted Builders in Area
          </h2>
          <span style={{
            display: 'block',
            width: '60px',
            height: '3px',
            background: 'linear-gradient(90deg, #F1D97A 0%, #e6c76a 100%)',
            margin: '8px auto 0',
            borderRadius: '2px',
            boxShadow: '0 2px 4px rgba(241, 217, 122, 0.3)'
          }} />
        </div>

        {/* Mobile Cards Container with Desktop Styling */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            overflow: 'auto',
            paddingLeft: 16,
            paddingRight: 16,
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {BUILDERS.map((builder, idx) => (
            <div
              key={idx}
              style={{
                minWidth: '280px',
                width: '280px',
                height: '320px',
                borderRadius: BORDER_RADIUS,
                background: `url(${builder.img}) center/cover no-repeat`,
                boxShadow: '0 8px 32px rgba(34,58,95,0.18), 0 2px 8px #93A2B0',
                border: '6px solid #C8D9E9',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                flexShrink: 0,
                cursor: 'pointer',
              }}
              onClick={() => setActiveIdx(idx)}
            >
              {/* Desktop-style overlay with exact same styling */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 20, // Same as desktop (24px scaled for mobile)
                  height: '40%', // Same percentage as desktop
                  background: 'rgba(241,241,241,0.85)', // Exact same background
                  zIndex: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0, // Same as desktop
                  boxShadow: activeIdx === idx ? '0 2px 12px #223A5F22' : 'none', // Same active shadow
                }}
              >
                {builder.logo && (
                  <img
                    src={builder.logo}
                    alt={builder.name}
                    style={{
                      width: 44, // Scaled from desktop 56px
                      height: 44,
                      borderRadius: '50%',
                      marginBottom: 8, // Scaled from desktop 10px
                      objectFit: 'cover',
                      background: '#fff',
                      border: '2px solid #e0e0e0',
                    }}
                  />
                )}
                {/* Title with exact desktop font family and styling */}
                <div
                  style={{
                    fontFamily: 'Abril Fatface, serif', // Same as desktop
                    fontWeight: 700, // Same as desktop
                    fontSize: 20, // Scaled from desktop 26px
                    color: '#223A5F', // Same as desktop
                    marginBottom: 3, // Scaled from desktop 4px
                    textAlign: 'center',
                  }}
                >
                  {builder.name}
                </div>
                {/* Subtitle with exact desktop styling */}
                <div
                  style={{
                    fontWeight: 500, // Same as desktop
                    fontSize: 13, // Scaled from desktop 17px
                    color: '#223A5F', // Same as desktop
                    opacity: 0.92, // Same as desktop
                    marginBottom: 2, // Scaled from desktop 3px
                    textAlign: 'center',
                  }}
                >
                  {builder.subtitle}
                </div>
                {/* Price with exact desktop styling */}
                <div
                  style={{
                    fontWeight: 700, // Same as desktop
                    fontSize: 14, // Scaled from desktop 18px
                    color: '#223A5F', // Same as desktop
                    textAlign: 'center',
                  }}
                >
                  {builder.price}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile scroll indicator dots */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          marginTop: 20,
        }}>
          {BUILDERS.map((_, idx) => (
            <div
              key={idx}
              style={{
                width: activeIdx === idx ? 20 : 8,
                height: 8,
                borderRadius: 4,
                background: activeIdx === idx ? '#223A5F' : '#e0e0e0',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}
              onClick={() => setActiveIdx(idx)}
            />
          ))}
        </div>

        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </section>
    );
  }

  // Desktop/Tablet Layout (carousel without arrows)
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
        textAlign: 'center',
        margin: '0 0 32px 0',
      }}>
        <h2 style={{
          fontSize: isTablet ? '2.1rem' : '2.5rem',
          fontWeight: 800,
          color: '#223A5F',
          margin: 0,
          letterSpacing: '-0.5px'
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
            const offset = idx - activeIdx;
            if (Math.abs(offset) > 2) return null;

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
                  transition: 'all 0.45s cubic-bezier(.4,2,.6,1)',
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
    </section>
  );
};

export default TrustedBuildersSection;
