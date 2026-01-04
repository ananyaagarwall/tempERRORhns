import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CiLocationOn } from 'react-icons/ci';
import './SimilarProperties.css';

const SimilarProperties = ({ currentProperties }) => {
  const navigate = useNavigate();

  // Sample similar properties - in real app, this would come from API based on current properties
  const similarProperties = [
    {
      id: 101,
      name: 'Elite Residency',
      price: '₹ 2.2 Cr',
      location: 'Mumbai, Maharashtra',
      image: '/Rustomjee.jpg.png',
      bhk: '3 BHK',
      area: '1150 sq ft'
    },
    {
      id: 102,
      name: 'Garden View Apartments',
      price: '₹ 1.9 Cr',
      location: 'Pune, Maharashtra',
      image: '/Defining-Demand.jpg',
      bhk: '2 BHK',
      area: '980 sq ft'
    },
    {
      id: 103,
      name: 'Premium Heights',
      price: '₹ 4.2 Cr',
      location: 'Bangalore, Karnataka',
      image: '/World-View-tower.jpg',
      bhk: '4 BHK',
      area: '2400 sq ft'
    }
  ];

  const handlePropertyClick = (propertyId) => {
    navigate(`/property/${propertyId}`);
  };

  if (similarProperties.length === 0) {
    return null;
  }

  return (
    <div className="similar-properties">
      <div className="similar-properties-header">
        <h3>Similar Properties</h3>
        <p className="similar-properties-subtitle">You might also like</p>
      </div>

      <div className="similar-properties-grid">
        {similarProperties.map(property => (
          <div
            key={property.id}
            className="similar-property-card"
            onClick={() => handlePropertyClick(property.id)}
          >
            <div className="similar-property-image">
              <img 
                src={property.image || '/main-image.jpeg'} 
                alt={property.name}
              />
            </div>
            <div className="similar-property-content">
              <h4 className="similar-property-name">{property.name}</h4>
              <p className="similar-property-location">
                <CiLocationOn className="location-icon" />
                {property.location}
              </p>
              <div className="similar-property-details">
                <span className="similar-property-spec">{property.bhk}</span>
                <span className="similar-property-separator">•</span>
                <span className="similar-property-spec">{property.area}</span>
              </div>
              <div className="similar-property-price">{property.price}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimilarProperties;

