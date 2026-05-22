import React from 'react';
import { Trash2 } from 'lucide-react';
import '../../../hns_home_page/home_page_css/TrustedBuildersSection.css';
import './CartBuilderCard.css';

const CartBuilderCard = ({ builder, onRemove }) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  return (
    <div 
      className="cart-builder-card"
      style={{
        backgroundImage: `url(${builder.image || builder.img || '/palm.jpg'})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        minWidth: isMobile ? '280px' : '340px',
        width: '100%',
        height: isMobile ? '360px' : '400px',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(34,58,95,0.18), 0 2px 8px #93A2B0',
        border: '6px solid #C8D9E9',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      {/* Remove Button - TOP RIGHT */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(builder.rera_id);
        }}
        className="cart-builder-remove-button"
        aria-label="Remove builder"
        title="Remove from cart"
      >
        <Trash2 size={18} />
      </button>

      {/* Card Overlay with Info */}
      <div className="card-overlay" style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: '24px',
        height: '40%',
        background: 'rgba(241,241,241,0.85)',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
      }}>
        {(builder.builder_logo || builder.logo) && (
          <img
            src={builder.builder_logo || builder.logo}
            alt={builder.company_name || builder.brand_name || builder.name}
            className="builder-logo"
            style={{
              width: isMobile ? '44px' : '56px',
              height: isMobile ? '44px' : '56px',
              borderRadius: '50%',
              marginBottom: '10px',
              objectFit: 'cover',
              background: '#fff',
              border: '2px solid #e0e0e0',
            }}
          />
        )}

        {/* Builder Title */}
        <div
          className="builder-title"
          style={{
            fontFamily: "'Abril Fatface', serif",
            fontWeight: 700,
            fontSize: isMobile ? '20px' : '26px',
            color: '#223A5F',
            marginBottom: '4px',
            textAlign: 'center',
            padding: '0 12px',
          }}
        >
          {builder.company_name || builder.brand_name || builder.name}
        </div>

        {/* Builder Subtitle (Location) */}
        <div
          className="builder-subtitle"
          style={{
            fontWeight: 500,
            fontSize: isMobile ? '13px' : '17px',
            color: '#223A5F',
            opacity: 0.92,
            marginBottom: '3px',
            textAlign: 'center',
            padding: '0 12px',
          }}
        >
          {builder.city
            ? `${builder.city}${builder.state ? ', ' + builder.state : ''}`
            : builder.location || builder.address || ''}
        </div>
        
        {/* Builder Price */}
        <div 
          className="builder-price"
          style={{
            fontWeight: 700,
            fontSize: isMobile ? '14px' : '18px',
            color: '#223A5F',
            textAlign: 'center',
            padding: '0 12px',
          }}
        >
          {builder.price}
        </div>
      </div>
    </div>
  );
};

export default CartBuilderCard;
