import React from 'react';
import { CiLocationOn } from "react-icons/ci";
import { useNavigate } from 'react-router-dom';
import './ChatbotPropertyCard.css';

const ChatbotPropertyCard = ({ property }) => {
  const navigate = useNavigate();

  const pickProjectImage = (p) => {
    const normalizeUrl = (url) => {
      if (!url) return '';
      if (url.startsWith('http')) return url;
      return `http://localhost:5000${url.startsWith('/') ? url : `/${url}`}`;
    };

    if (p.builder_project_image) return normalizeUrl(p.builder_project_image);
    return 'http://localhost:5000/public/building.webp';
  };

  const imageUrl = pickProjectImage(property);

  // Parse configurations safely
  const getConfigurations = () => {
    const config = property.Existing_Configurations;
    if (!config) return '';
    
    try {
      if (typeof config === 'string') {
        const parsed = JSON.parse(config);
        if (Array.isArray(parsed)) {
          return parsed.map(c => 
            typeof c === 'object' && c !== null && c.type ? c.type : String(c)
          ).join(', ');
        }
      }
      return String(config);
    } catch (e) {
      return String(config);
    }
  };

  return (
    <div 
      className="chatbot-property-card" 
      onClick={() => navigate(`/property/${property.id}`)}
      style={{ cursor: 'pointer' }}
    >
      <img 
        src={imageUrl} 
        alt={property.Property_Name || 'Property'} 
        className="chatbot-property-img" 
        onError={(e) => {
          e.target.src = 'http://localhost:5000/public/building.webp';
        }}
      />
      <div className="chatbot-property-info">
        <h3 className="chatbot-property-name">
          {property.Property_Name || 'Property'}
        </h3>
        <p className="chatbot-property-address">
          <CiLocationOn className="chatbot-location-icon" /> 
          {property.Location || 'Location not specified'}
        </p>
        <div className="chatbot-property-details-row">
          {getConfigurations() && (
            <p className="chatbot-property-features">{getConfigurations()}</p>
          )}
          <p className="chatbot-property-price">
            {property.Price_Starting_From || property.Pricing || 'Price on request'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPropertyCard;