import API_BASE_URL from '../../../config';
import React from 'react';
import { Building2, MapPin } from 'lucide-react'; // Using lucide-react for icons
import { useNavigate } from 'react-router-dom';
import './ChatbotBuilderCard.css';

const ChatbotBuilderCard = ({ builder }) => {
  const navigate = useNavigate();

  const builderImage = builder.logo || `${API_BASE_URL}/public/building.webp`;

  const handleCardClick = () => {
    const companyName = builder.company_name || builder.name || builder.brand_name;
    const slug = companyName
      ? String(companyName)
          .toLowerCase()
          .trim()
          .replace(/[_\s]+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
      : '';

    if (slug) {
      navigate(`/builder/${slug}`);
      return;
    }

    if (builder.rera_id) {
      navigate(`/builder/${builder.rera_id}`);
      return;
    }

    navigate('/builders-page');
  };

  return (
    <div className="chatbot-builder-card" onClick={handleCardClick}>
      <img src={builderImage} alt={builder.company_name || builder.name || "Builder"} className="chatbot-builder-img" />
      <div className="chatbot-builder-info">
        <h3 className="chatbot-builder-name">{builder.company_name || builder.name}</h3>
        {builder.rera_id && <p className="chatbot-builder-rera">RERA ID: {builder.rera_id}</p>}
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

