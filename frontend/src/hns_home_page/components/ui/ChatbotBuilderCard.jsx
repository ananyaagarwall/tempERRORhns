import API_BASE_URL from '../../../config';
import React from 'react';
import { Building2, MapPin } from 'lucide-react'; // Using lucide-react for icons
import { useNavigate } from 'react-router-dom';
import './ChatbotBuilderCard.css';

const ChatbotBuilderCard = ({ builder }) => {
  const navigate = useNavigate();

  const builderImage = builder.logo || `${API_BASE_URL}/public/building.webp`;

  const handleCardClick = () => {
    // Assuming a builder detail page exists, e.g., /builders/:reraId
    // For now, let's navigate to a generic builder page or the builder's projects if available
    if (builder.rer-id) {
      navigate(`/builder/${builder.rer-id}`);
    } else if (builder.name) {
      // Fallback if RERA ID is not available, navigate by name (might need a different route/component)
      navigate(`/builders?name=${encodeURIComponent(builder.name)}`);
    }
  };

  return (
    <div className="chatbot-builder-card" onClick={handleCardClick}>
      <img src={builderImage} alt={builder.name || "Builder"} className="chatbot-builder-img" />
      <div className="chatbot-builder-info">
        <h3 className="chatbot-builder-name">{builder.name || builder.company_name}</h3>
        {builder.rer-id && <p className="chatbot-builder-rera">RERA ID: {builder.rer-id}</p>}
        {(builder.completed_projects !== undefined || builder.ongoing_projects !== undefined) && (
          <div className="chatbot-builder-projects-row">
            {builder.completed_projects !== undefined && (
              <p className="chatbot-builder-projects-done"><Building2 className="chatbot-icon" /> {builder.completed_projects} Done</p>
            )}
            {builder.ongoing_projects !== undefined && (
              <p className="chatbot-builder-projects-ongoing"><Building2 className="chatbot-icon" /> {builder.ongoing_projects} Ongoing</p>
            )}
          </div>
        )}
        {builder.cities && (
            <p className="chatbot-builder-location"><MapPin className="chatbot-icon" /> {builder.cities}</p>
        )}
      </div>
    </div>
  );
};

export default ChatbotBuilderCard;

