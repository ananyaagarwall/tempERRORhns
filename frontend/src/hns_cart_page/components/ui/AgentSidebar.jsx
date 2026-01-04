import React from 'react';
import { FaPhone, FaEnvelope, FaWhatsapp, FaUser } from 'react-icons/fa';
import './AgentSidebar.css';

const AgentSidebar = () => {
  // Sample agent data - in real app, this would come from API
  const agent = {
    name: 'Rajesh Kumar',
    role: 'Senior Property Consultant',
    phone: '+91 98765 43210',
    email: 'rajesh.kumar@housenseek.com',
    experience: '8+ years',
    propertiesSold: '250+',
    rating: 4.8,
    image: '/agent-avatar.jpg' // Placeholder
  };

  const handleCall = () => {
    window.location.href = `tel:${agent.phone}`;
  };

  const handleEmail = () => {
    window.location.href = `mailto:${agent.email}`;
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent('Hello, I am interested in properties from HouseNSeek.');
    window.open(`https://wa.me/${agent.phone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  return (
    <div className="agent-sidebar">
      <div className="agent-header">
        <h3 className="agent-title">Contact Agent</h3>
        <p className="agent-subtitle">Get expert assistance</p>
      </div>

      <div className="agent-card">
        <div className="agent-avatar">
          {agent.image ? (
            <img src={agent.image} alt={agent.name} />
          ) : (
            <div className="agent-avatar-placeholder">
              <FaUser />
            </div>
          )}
        </div>

        <div className="agent-info">
          <h4 className="agent-name">{agent.name}</h4>
          <p className="agent-role">{agent.role}</p>
          <div className="agent-stats">
            <span className="agent-stat-item">
              <strong>{agent.experience}</strong> Experience
            </span>
            <span className="agent-stat-item">
              <strong>{agent.propertiesSold}</strong> Properties Sold
            </span>
          </div>
          <div className="agent-rating">
            <span className="rating-stars">⭐⭐⭐⭐⭐</span>
            <span className="rating-value">{agent.rating}</span>
          </div>
        </div>

        <div className="agent-contact-actions">
          <button className="contact-button primary" onClick={handleCall}>
            <FaPhone />
            Call Now
          </button>
          <button className="contact-button secondary" onClick={handleWhatsApp}>
            <FaWhatsapp />
            WhatsApp
          </button>
          <button className="contact-button secondary" onClick={handleEmail}>
            <FaEnvelope />
            Email
          </button>
        </div>

        <div className="agent-contact-details">
          <div className="contact-detail-item">
            <FaPhone className="contact-icon" />
            <span>{agent.phone}</span>
          </div>
          <div className="contact-detail-item">
            <FaEnvelope className="contact-icon" />
            <span>{agent.email}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentSidebar;

