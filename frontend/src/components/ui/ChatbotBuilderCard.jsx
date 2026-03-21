import API_BASE_URL from '../../config';
import React from 'react';
import { Building2, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ChatbotBuilderCard.css';

const ChatbotBuilderCard = ({ builder }) => {
  const navigate = useNavigate();

  const builderImage = builder.logo || `${API_BASE_URL}/public/building.webp`;

  const handleCardClick = () => {
    // Navigate to builder detail page
    if (builder.rera_id) {
      navigate(`/builder/${builder.rera_id}`);
    } else if (builder.company_name) {
      navigate(`/builders?name=${encodeURIComponent(builder.company_name)}`);
    }
  };

  return (
    <div 
      className="chatbot-builder-card" 
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      <img 
        src={builderImage} 
        alt={builder.company_name || builder.name || "Builder"} 
        className="chatbot-builder-img"
        onError={(e) => {
          e.target.src = 'http://localhost:5000/public/building.webp';
        }}
      />
      <div className="chatbot-builder-info">
        <h3 className="chatbot-builder-name">
          {builder.company_name || builder.name || 'Builder'}
        </h3>
        {builder.rera_id && (
          <p className="chatbot-builder-rera">RERA ID: {builder.rera_id}</p>
        )}
        {(builder.completed_projects !== undefined || builder.ongoing_projects !== undefined) && (
          <div className="chatbot-builder-projects-row">
            {builder.completed_projects !== undefined && (
              <p className="chatbot-builder-projects-done">
                <Building2 className="chatbot-icon" size={14} /> 
                {builder.completed_projects} Done
              </p>
            )}
            {builder.ongoing_projects !== undefined && (
              <p className="chatbot-builder-projects-ongoing">
                <Building2 className="chatbot-icon" size={14} /> 
                {builder.ongoing_projects} Ongoing
              </p>
            )}
          </div>
        )}
        {(builder.city || builder.cities) && (
          <p className="chatbot-builder-location">
            <MapPin className="chatbot-icon" size={14} /> 
            {builder.cities || builder.city}
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatbotBuilderCard;