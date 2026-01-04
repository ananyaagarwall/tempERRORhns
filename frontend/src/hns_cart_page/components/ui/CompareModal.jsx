import React from 'react';
import { FaTimes, FaArrowLeft } from 'react-icons/fa'; // Added FaArrowLeft
import './CompareModal.css';

const CompareModal = ({ properties, onClose }) => {
  if (!properties || properties.length === 0) {
    return null;
  }

  // Get all unique keys from all properties for comparison
  const getAllKeys = () => {
    const keys = new Set(['name', 'price', 'location', 'bhk', 'area', 'builder', 'availability']);
    properties.forEach(prop => {
      if (prop.amenities) keys.add('amenities');
      Object.keys(prop).forEach(key => keys.add(key));
    });
    return Array.from(keys);
  };

  const comparisonKeys = getAllKeys();

  const formatValue = (key, value) => {
    if (key === 'amenities' && Array.isArray(value)) {
      return value.join(', ');
    }
    return value || 'N/A';
  };

  return (
    <div className="compare-modal-overlay" onClick={onClose}>
      <div className="compare-modal" onClick={(e) => e.stopPropagation()}>
        <div className="compare-modal-header">
          <div className="header-left">
            {/* Back Button */}
            <button
              className="back-button"
              onClick={onClose}
              aria-label="Back to properties"
            >
              <FaArrowLeft size={20} />
              <span className="back-text">Back</span>
            </button>
          </div>

          <h2>Compare Properties</h2>

          <div className="header-right">
            {/* Close Button */}
            <button
              className="close-button"
              onClick={onClose}
              aria-label="Close comparison"
            >
              <FaTimes size={20} />
            </button>
          </div>
        </div>

        <div className="compare-modal-content">
          <div className="compare-table-container">
            <table className="compare-table">
              <thead>
                <tr>
                  <th className="compare-property-header">Property</th>
                  {properties.map((property, index) => (
                    <th key={index} className="compare-property-column">
                      <div className="compare-property-card-header">
                        <img
                          src={property.image || '/main-image.jpeg'}
                          alt={property.name}
                          className="compare-property-image"
                        />
                        <h3>{property.name}</h3>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonKeys.map((key) => {
                  if (key === 'image' || key === 'id') return null;

                  return (
                    <tr key={key}>
                      <td className="compare-label">
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                      </td>
                      {properties.map((property, index) => (
                        <td key={index} className="compare-value">
                          {formatValue(key, property[key])}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompareModal;