import React from 'react';
import { FaTrash, FaBalanceScale } from 'react-icons/fa';
import { CiLocationOn } from 'react-icons/ci';
import { useNavigate } from 'react-router-dom';
import './CartPropertyCard.css';

const CartPropertyCard = ({ property, isInCompare, onCompareToggle, onRemove }) => {
  const navigate = useNavigate();

  const getAvailabilityClass = (availability) => {
    switch (availability) {
      case 'Available':
        return 'available';
      case 'Under Offer':
        return 'under-offer';
      case 'Sold Out':
        return 'sold-out';
      default:
        return 'available';
    }
  };

  const handleCardClick = () => {
    navigate(`/property/${property.id}`);
  };

  return (
    <div className="cart-property-card">
      <div className="cart-property-image" onClick={handleCardClick}>
        <img src={property.image || '/main-image.jpeg'} alt={property.name} />
        <span className={`availability-tag ${getAvailabilityClass(property.availability)}`}>
          {property.availability}
        </span>
      </div>

      <div className="cart-property-content">
        <div className="cart-property-header" onClick={handleCardClick}>
          <h3 className="cart-property-name">{property.name}</h3>
          <p className="cart-property-location">
            <CiLocationOn className="location-icon" />
            {property.location}
          </p>
        </div>

        <div className="cart-property-details">
          <div className="property-specs">
            <span className="spec-item">{property.bhk}</span>
            <span className="spec-separator">•</span>
            <span className="spec-item">{property.area}</span>
          </div>
          <div className="property-price">{property.price}</div>
        </div>

        {property.amenities && property.amenities.length > 0 && (
          <div className="property-amenities">
            {property.amenities.slice(0, 3).map((amenity, index) => (
              <span key={index} className="amenity-tag">{amenity}</span>
            ))}
            {property.amenities.length > 3 && (
              <span className="amenity-tag">+{property.amenities.length - 3} more</span>
            )}
          </div>
        )}

        <div className="cart-property-actions">
          <label className="compare-toggle">
            <input
              type="checkbox"
              checked={isInCompare}
              onChange={() => onCompareToggle(property.id)}
              disabled={!isInCompare && !onCompareToggle}
            />
            <span className="toggle-label">
              <FaBalanceScale className="compare-icon" />
              Add to Compare
            </span>
          </label>
          <button 
            className="remove-button"
            onClick={() => onRemove(property.id)}
            aria-label="Remove from cart"
          >
            <FaTrash />
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPropertyCard;

