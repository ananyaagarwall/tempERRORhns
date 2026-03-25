import API_BASE_URL from '../../../config';
import React from 'react';
import { CiLocationOn } from "react-icons/ci";
import { useNavigate } from 'react-router-dom';
import './ChatbotPropertyCard.css';

const ChatbotPropertyCard = ({ property }) => {
  const navigate = useNavigate();

  const pickProjectImage = (p) => {
    // Ensure the image URL is absolute or correctly prefixed for the backend
    const normalizeUrl = (url) => {
      if (!url) return '';
      if (url.startsWith('http')) return url;
      return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
    };

    if (p.builder_project_image) return normalizeUrl(p.builder_project_image);
    // Fallback to a default image if no image is available
    return `${API_BASE_URL}/public/building.webp`; // Ensure this path is correct
  };

  const imageUrl = pickProjectImage(property);

  return (
    <div className="chatbot-property-card" onClick={() => navigate(`/property/${property.id}`)}>
      <img src={imageUrl} alt={property.name} className="chatbot-property-img" />
      <div className="chatbot-property-info">
        <h3 className="chatbot-property-name">{property.Property_Name}</h3>
        <p className="chatbot-property-address"><CiLocationOn className="chatbot-location-icon" /> {property.Location}</p>
        <div className="chatbot-property-details-row">
          {property.Existing_Configurations &&
            typeof property.Existing_Configurations === 'string' &&
            property.Existing_Configurations.length > 0 &&
            (() => {
              try {
                const configs = JSON.parse(property.Existing_Configurations);
                if (Array.isArray(configs) && configs.length > 0) {
                  // Assuming configs is an array of objects like [{ type: "2BHK" }, { type: "3BHK" }]
                  // Or a simple array like ["2BHK", "3BHK"]
                  const features = configs.map(config => typeof config === 'object' && config !== null && 'type' in config ? config.type : String(config)).join(', ');
                  return <p className="chatbot-property-features">{features}</p>;
                }
              } catch (e) {
                console.error("Failed to parse Existing_Configurations:", e);
              }
              return null;
            })()
          }
          <p className="chatbot-property-price">{property.Price_Starting_From || property.Pricing}</p>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPropertyCard;
