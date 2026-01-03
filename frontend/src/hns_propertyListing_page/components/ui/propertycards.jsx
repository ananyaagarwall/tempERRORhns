import React, { useEffect, useState } from 'react';
import { fetchProperties } from '../../../services/api';
import '../../hns_propertylisting_css/propertycards.css';

// Minimal UI shims to avoid external dependencies
const Button = ({ children, className = '', variant = 'default', ...props }) => (
  <button
    className={`ui-btn ${variant === 'outline' ? 'ui-btn-outline' : 'ui-btn-solid'} ${className}`}
    {...props}
  >
    {children}
  </button>
);

const Badge = ({ children, className = '', ...props }) => (
  <span className={`ui-badge ${className}`} {...props}>{children}</span>
);

const ChevronLeft = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const ChevronRight = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PropertyCard = ({ property }) => {
  const [currentThumbnail, setCurrentThumbnail] = useState(0);
  const [isAddedToList, setIsAddedToList] = useState(false);
  const [isVisitScheduled, setIsVisitScheduled] = useState(false);

  const thumbnailImages = [
    { src: '/Defining-Demand.jpg', alt: `${property.name} exterior view` },
    { src: '/World-View-tower.jpg', alt: `${property.name} floor plan` },
    { src: '/presidental.jpeg', alt: `${property.name} interior view` },
    { src: '/Rustomjee.jpg.png', alt: `${property.name} amenities` }
  ];

  const nextThumbnail = () => {
    setCurrentThumbnail((prev) => {
      const maxPosition = Math.max(0, thumbnailImages.length - 2); // show 2 at a time
      return prev >= maxPosition ? 0 : prev + 1;
    });
  };

  const prevThumbnail = () => {
    setCurrentThumbnail((prev) => {
      const maxPosition = Math.max(0, thumbnailImages.length - 2);
      return prev <= 0 ? maxPosition : prev - 1;
    });
  };

  return (
    <div className="property-card">
      <div className="property-images">
        <div className="main-image">
          {property.status && (
            <Badge className="status-badge ready-to-move-badge">
              {property.status}
            </Badge>
          )}
          <img 
            src={property.img || '/main-image.jpeg'} 
            alt={`${property.name} main view`}
            className="main-property-image"
          />
        </div>
        <div className="thumbnail-slider">
          <div className="thumbnail-container">
            <div 
              className="thumbnail-track"
              style={{ 
                transform: `translateX(-${currentThumbnail * 208}px)`,
                width: `${thumbnailImages.length * 208}px`
              }}
            >
              {thumbnailImages.map((image, index) => (
                <img 
                  key={index}
                  src={image.src}
                  alt={image.alt}
                  className="thumbnail-image"
                />
              ))}
            </div>
          </div>
          <div className="thumbnail-controls">
            <button 
              onClick={prevThumbnail}
              className="thumbnail-btn thumbnail-btn-prev"
              aria-label="Previous image"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="thumbnail-dots">
              {Array.from({ length: Math.max(1, thumbnailImages.length - 1) }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentThumbnail(index)}
                  className={`thumbnail-dot ${index === currentThumbnail ? 'active' : ''}`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
            <button 
              onClick={nextThumbnail}
              className="thumbnail-btn thumbnail-btn-next"
              aria-label="Next image"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
      
      <div className="property-details">
        <div className="property-header">
          <h2 className="property-name">{property.name}</h2>
          <div className="property-price">
            <span className="price-amount">{property.price}</span>
            {property.pricePerSqft ? (
              <>
                <span className="price-separator"> | </span>
                <span className="price-per-sqft">{property.pricePerSqft}</span>
              </>
            ) : null}
          </div>
        </div>
        
        <div className="property-info">
          {property.carpetArea && (
            <p className="carpet-area">Carpet Area: {property.carpetArea}</p>
          )}
          {property.location && (
            <p className="description">Location: {property.location}</p>
          )}
          {(property.parking || property.security) && (
            <p className="premium-features">
              {property.parking ? `Parking: ${property.parking}` : ''}
              {property.parking && property.security ? ' | ' : ''}
              {property.security ? `Security: ${property.security}` : ''}
            </p>
          )}
          {property.connectivity && property.connectivity.length > 0 && (
            <p className="age-maintenance">Connectivity: {property.connectivity.join(', ')}</p>
          )}
        </div>
        
        <div className="highlights-section">
          <span className="highlights-label">Highlights:</span>
          <div className="highlights-list">
            {property.highlights.slice(0, property.maxBadges).map((highlight, index) => (
              <Badge key={index} className="highlight-badge">
                {highlight}
              </Badge>
            ))}
            {property.highlights.length > property.maxBadges && (
              <Badge className="highlight-badge more-highlights">
                +{property.highlights.length - property.maxBadges} More
              </Badge>
            )}
          </div>
        </div>
        
        <div className="action-buttons">
          <Button variant="outline" className="add-to-list-btn">
            Add to My List
          </Button>
          <Button className="schedule-visit-btn">Schedule a Visit</Button>
        </div>
      </div>
    </div>
  );
};

const SearchResults = ({ searchFilters = { location: '', priceRange: 0, bhkTypes: [] } }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchProperties({ location: searchFilters.location, priceRange: searchFilters.priceRange, bhkTypes: searchFilters.bhkTypes });
        const mapped = (Array.isArray(data) ? data : []).map((p) => {
          const highlights = [];
          if (Array.isArray(p.Highlights)) highlights.push(...p.Highlights);
          if (Array.isArray(p.Key_Highlights)) highlights.push(...p.Key_Highlights);
          if (Array.isArray(p.Connectivity)) highlights.push(...p.Connectivity);
          return {
            id: p.id || p._id,
            name: p.Property_Name || '',
            status: p.Project_Status || '',
            img: p.builder_project_image || p.image || '',
            price: p.Pricing || p.Price_Starting_From || '',
            pricePerSqft: '',
            carpetArea: p.Carpet_Area || '',
            location: p.Location || p.Address || '',
            parking: p.Parking || '',
            security: p.Security || '',
            connectivity: Array.isArray(p.Connectivity) ? p.Connectivity : [],
            highlights,
            maxBadges: 6,
          };
        });
        setProperties(mapped);
        setError(null);
      } catch (e) {
        setError('Failed to fetch properties');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [searchFilters.location, searchFilters.priceRange, JSON.stringify(searchFilters.bhkTypes)]);

  return (
    <div className="search-results-wrapper">
      <div className="search-results-container">
        <h1 className="search-results-heading">Results for your Search</h1>
        {loading && <div>Loading...</div>}
        {error && <div>{error}</div>}
        {!loading && !error && properties.map((prop) => (
          <PropertyCard key={prop.id || Math.random()} property={prop} />
        ))}
      </div>
    </div>
  );
};

export { PropertyCard };
export default SearchResults;
