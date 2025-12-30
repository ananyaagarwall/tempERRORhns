import React from 'react';

const SectionHeading = ({ title, isMobile = false, isTablet = false }) => {
  return (
    <div style={{ textAlign: 'center' }}>
      <h2 style={{ 
        fontSize: isTablet ? '2.1rem' : '2.5rem',
        fontWeight: 800,
        color: '#223A5F',
        margin: 0,
        letterSpacing: '-0.5px',
        fontFamily: "'Abril Fatface', serif"
      }}>
        {title}
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
  );
};

export default SectionHeading;