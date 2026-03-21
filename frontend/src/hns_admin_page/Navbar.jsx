import API_BASE_URL from '../config';
import React, { useState, useEffect } from 'react';

const TrustedBuildersSection = () => {
  const [builders, setBuilders] = useState([]);
  const [activeIdx, setActiveIdx] = useState(2);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const fetchBuilders = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/projects`);
        const data = await response.json();
        const formattedData = data.map(project => ({
          img: project.project_image ? `${API_BASE_URL}${project.project_image}` : '/default-image.jpg',
          logo: '',
          name: project.title,
          subtitle: project.location,
          price: project.price_range,
        }));
        setBuilders(formattedData);
      } catch (error) {
        console.error('Error fetching builders:', error);
      }
    };

    fetchBuilders();
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  let cardWidth = 380, cardHeight = 400, cardOffset = 160, centerScale = 1.08;
  let visibleCount = 5;
  if (windowWidth < 600) {
    cardWidth = 90 * windowWidth / 100;
    cardHeight = 260;
    cardOffset = 0;
    centerScale = 1.0;
    visibleCount = 1;
  } else if (windowWidth < 900) {
    cardWidth = 280;
    cardHeight = 320;
    cardOffset = 110;
    centerScale = 1.04;
    visibleCount = 3;
  }

  const startIdx = Math.max(0, activeIdx - Math.floor(visibleCount / 2));
  const endIdx = Math.min(builders.length, startIdx + visibleCount);
  const visibleBuilders = builders.slice(startIdx, endIdx);
  const centerIdx = startIdx + Math.floor(visibleCount / 2);

  const handlePrev = () => setActiveIdx(idx => Math.max(Math.floor(visibleCount / 2), idx - 1));
  const handleNext = () => setActiveIdx(idx => Math.min(builders.length - Math.ceil(visibleCount / 2), idx + 1));

  let isMobile = windowWidth < 900;

  return (
    <section style={{
      paddingTop: windowWidth < 600 ? '120px' : '140px', // Prevent overlap with sticky navbar
      background: '#F7F9FF',
      borderRadius: 18,
      paddingBottom: windowWidth < 600 ? '40px' : '80px',
      margin: windowWidth < 600 ? '24px 0' : '48px 0',
      maxWidth: '100vw',
      boxSizing: 'border-box',
    }}>
      <div style={{ textAlign: 'center', margin: windowWidth < 600 ? '0 0 16px 0' : '0 0 32px 0' }}>
        <h2 className="section-heading">Explore Trusted Builders in Area</h2>
        <div style={{
          width: windowWidth < 600 ? 32 : 60,
          height: 5,
          background: '#F9D87A',
          borderRadius: 4,
          margin: windowWidth < 600 ? '8px auto 0 auto' : '12px auto 0 auto',
        }} />
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        position: 'relative',
        minHeight: cardHeight + 32,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: windowWidth < 600 ? '100vw' : windowWidth < 900 ? 700 : 1200,
          position: 'relative',
          height: cardHeight,
          margin: '0 auto',
          overflow: isMobile ? 'auto' : 'visible',
          WebkitOverflowScrolling: isMobile ? 'touch' : undefined,
        }}>
          {builders.map((builder, idx) => {
            const offset = idx - activeIdx;
            if (isMobile || Math.abs(offset) > 2) return null;
            let translateX = offset < 0 ? -cardWidth * 0.55 : offset > 0 ? cardWidth * 0.55 : 0;
            let scale = offset === 0 ? centerScale : (Math.abs(offset) === 2 ? 0.88 : 0.92);
            let zIndex = offset === 0 ? 100 : 10 - Math.abs(offset);
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
                  borderRadius: 12,
                  background: `url(${builder.img}) center/cover no-repeat`,
                  boxShadow: '0 8px 32px rgba(34,58,95,0.18), 0 2px 8px #93A2B0',
                  border: '6px solid #C8D9E9',
                  zIndex,
                  opacity: 1,
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: `translateX(-50%) scale(${scale}) translateX(${translateX}px)` ,
                  transition: 'all 0.45s cubic-bezier(.4,2,.6,1)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  cursor: 'pointer',
                }}
                onClick={() => !isMobile && setActiveIdx(idx)}
              >
                <div style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 24,
                  height: windowWidth < 600 ? '48%' : '40%',
                  background: 'rgba(241,241,241,0.85)',
                  zIndex: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <div style={{ fontFamily: 'Abril Fatface, serif', fontWeight: 700, fontSize: windowWidth < 600 ? 15 : 26, color: '#223A5F' }}>{builder.name}</div>
                  <div style={{ fontWeight: 500, fontSize: windowWidth < 600 ? 10 : 17, color: '#223A5F', opacity: 0.92 }}>{builder.subtitle}</div>
                  <div style={{ fontWeight: 700, fontSize: windowWidth < 600 ? 12 : 18, color: '#223A5F' }}>{builder.price}</div>
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