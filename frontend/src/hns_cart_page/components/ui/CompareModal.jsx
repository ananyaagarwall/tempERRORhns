import React from 'react';
import { FaTimes } from 'react-icons/fa';
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
          <h2>Compare Properties</h2>
          <button className="close-button" onClick={onClose} aria-label="Close">
            <FaTimes />
          </button>
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
                  // Skip image key as it's already in header
                  if (key === 'image' || key === 'id') return null;
                  
                  return (
                    <tr key={key}>
                      <td className="compare-label">{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</td>
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

