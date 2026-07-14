import API_BASE_URL from '../../config';
import React from 'react';
import { Building2, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ChatbotBuilderCard.css';

const FALLBACK_BUILDING_IMAGE = '/building.webp';

const ChatbotBuilderCard = ({ builder }) => {
  const navigate = useNavigate();

  const builderImage = builder.builder_logo || builder.logo || FALLBACK_BUILDING_IMAGE;

  const handleCardClick = () => {
    if (builder.id) {
      const slug = builder.company_name
        ?.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      if (slug) {
        navigate(`/builder/${slug}`);
        return;
      }
    }

    navigate('/builders-page');
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
          if (!e.currentTarget.dataset.errorResolved) {
            e.currentTarget.dataset.errorResolved = "true";
            e.currentTarget.src = FALLBACK_BUILDING_IMAGE;
          }
        }}
      />
      <div className="chatbot-builder-info">
        <h3 className="chatbot-builder-name">
          {builder.company_name || builder.name || 'Builder'}
        </h3>
        {builder.id && (
          <p className="chatbot-builder-rera">Builders ID: {builder.id}</p>
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
        {(builder.city || builder.location || builder.cities) && (
          <p className="chatbot-builder-location">
            <MapPin className="chatbot-icon" size={14} /> 
            {builder.cities || builder.city || builder.location}
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatbotBuilderCard;
