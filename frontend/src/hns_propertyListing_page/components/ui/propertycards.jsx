// src/hns_propertyListing_page/components/ui/propertycards.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../../hns_cart_page/js/CartContent';
import { fetchProperties } from '../../../services/api';
import '../../hns_propertylisting_css/propertycards.css';

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
    <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronRight = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Heart Icon Component
const HeartIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const PropertyCard = ({ property }) => {
  const [currentThumbnail, setCurrentThumbnail] = useState(0);
  const [showAllHighlights, setShowAllHighlights] = useState(false);
  const navigate = useNavigate();
  const { addToCart, removeFromCart, isInCart } = useCart();

  const thumbnailImages = [
    { src: '/Defining-Demand.jpg', alt: `${property.name} exterior view` },
    { src: '/World-View-tower.jpg', alt: `${property.name} floor plan` },
    { src: '/presidental.jpeg', alt: `${property.name} interior view` },
    { src: '/Rustomjee.jpg.png', alt: `${property.name} amenities` }
  ];

  const nextThumbnail = () => {
    setCurrentThumbnail((prev) => {
      const maxPosition = Math.max(0, thumbnailImages.length - 2);
      return prev >= maxPosition ? 0 : prev + 1;
    });
  };

  const prevThumbnail = () => {
    setCurrentThumbnail((prev) => {
      const maxPosition = Math.max(0, thumbnailImages.length - 2);
      return prev <= 0 ? maxPosition : prev - 1;
    });
  };

  const handleHeartClick = () => {
    if (isInCart(property.id)) {
      removeFromCart(property.id);
    } else {
      // Mark as 'listing' source when adding from search results
      addToCart(property, 'listing');
    }
  };

  const handleAddToList = () => {
    if (!isInCart(property.id)) {
      // Mark as 'listing' source when adding from search results
      addToCart(property, 'listing');
    }
  };

  const handleCardClick = () => {
    if (!property?.id) return;
    navigate(`/property/${property.id}`);
  };

  const handleCardKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCardClick();
    }
  };

  const stopCardNavigation = (event) => {
    event.stopPropagation();
  };

  const visibleHighlights = showAllHighlights
    ? property.highlights
    : property.highlights.slice(0, property.maxBadges);

  return (
    <div
      className="property-card"
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      role="link"
      tabIndex={0}
      aria-label={property?.name ? `Open ${property.name}` : 'Open property'}
    >
      <div className="property-images">
        <div className="main-image" style={{ position: 'relative' }}>
          {/* Heart Button - TOP RIGHT */}
          <button
            className={`property-heart-button ${isInCart(property.id) ? 'in-cart' : ''}`}
            onClick={(event) => {
              stopCardNavigation(event);
              handleHeartClick();
            }}
            aria-label={isInCart(property.id) ? 'Remove from cart' : 'Add to cart'}
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
              zIndex: 3
            }}
          >
            <HeartIcon filled={isInCart(property.id)} />
          </button>

          {property.status && (
            <Badge className="status-badge ready-to-move-badge">
              {property.status}
            </Badge>
          )}
          <img
            src={property.img || '/main-image.jpeg'}
            alt={`${property.name} main view`}
            className="main-property-image"
            onError={(e) => {
              const tried = e.currentTarget.dataset.tried || '';
              if (!tried.includes('fb') && property.imgFallback) {
                e.currentTarget.dataset.tried = tried + 'fb';
                e.currentTarget.src = property.imgFallback;
              } else if (!tried.includes('static')) {
                e.currentTarget.dataset.tried = (tried || '') + 'static';
                e.currentTarget.src = '/main-image.jpeg';
              }
            }}
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
              onClick={(event) => {
                stopCardNavigation(event);
                prevThumbnail();
              }}
              className="thumbnail-btn thumbnail-btn-prev"
              aria-label="Previous image"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="thumbnail-dots">
              {Array.from({ length: Math.max(1, thumbnailImages.length - 1) }).map((_, index) => (
                <button
                  key={index}
                  onClick={(event) => {
                    stopCardNavigation(event);
                    setCurrentThumbnail(index);
                  }}
                  className={`thumbnail-dot ${index === currentThumbnail ? 'active' : ''}`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
            <button
              onClick={(event) => {
                stopCardNavigation(event);
                nextThumbnail();
              }}
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
            {property.pricePerSqft && (
              <>
                <span className="price-separator"> | </span>
                <span className="price-per-sqft">{property.pricePerSqft}</span>
              </>
            )}
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
            {visibleHighlights.map((highlight, index) => (
              <Badge key={index} className="highlight-badge">
                {highlight}
              </Badge>
            ))}
            {property.highlights.length > property.maxBadges && (
              <button
                type="button"
                className="highlight-badge more-highlights"
                onClick={(event) => {
                  stopCardNavigation(event);
                  setShowAllHighlights((prev) => !prev);
                }}
              >
                {showAllHighlights
                  ? "Show Less"
                  : `+${property.highlights.length - property.maxBadges} More`}
              </button>
            )}
          </div>
        </div>

        <div className="action-buttons">
          <Button
            variant="outline"
            className="add-to-list-btn"
            onClick={(event) => {
              stopCardNavigation(event);
              handleAddToList();
            }}
          >
            {isInCart(property.id) ? '✓ Added to List' : 'Add to My List'}
          </Button>
          <Button className="schedule-visit-btn">Schedule a Visit</Button>
        </div>
      </div>
    </div>
  );
};

const SearchResults = ({
  searchFilters = { location: '', priceRange: 0, bhkTypes: [] },
  budgetNodes = [],
  onNodeSelect
}) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchProperties({
          location: searchFilters.location,
          priceRange: searchFilters.priceRange,
          bhkTypes: searchFilters.bhkTypes,
          amenities: searchFilters.amenities,
          propertyStatus: searchFilters.propertyStatus,
          societyTypes: searchFilters.societyTypes,
        });

        const mapped = (Array.isArray(data) ? data : []).map((p) => {
          const highlights = [];
          if (Array.isArray(p.Highlights)) highlights.push(...p.Highlights);
          if (Array.isArray(p.Key_Highlights)) highlights.push(...p.Key_Highlights);
          if (Array.isArray(p.Connectivity)) highlights.push(...p.Connectivity);
          const dedupedHighlights = Array.from(
            new Set(
              highlights
                .map((item) => String(item || "").trim())
                .filter(Boolean)
            )
          );
          const projectId = p.project_id || null;
          const azureGallery = projectId
            ? `https://hnsblob001.blob.core.windows.net/hns-media/projects/${projectId}/gallery/img1.jpg`
            : null;
          return {
            id: p.id || p._id,
            name: p.Property_Name || '',
            status: p.Project_Status || '',
            img: azureGallery || p.builder_project_image || p.image || '',
            imgFallback: p.builder_project_image || p.image || '',
            price: p.Pricing || p.Price_Starting_From || '',
            pricePerSqft: '',
            carpetArea: p.Carpet_Area || '',
            location: p.Location || p.Address || '',
            parking: p.Parking || '',
            security: p.Security || '',
            connectivity: Array.isArray(p.Connectivity) ? p.Connectivity : [],
            highlights: dedupedHighlights,
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
  }, [
    searchFilters.location,
    searchFilters.priceRange,
    JSON.stringify(searchFilters.bhkTypes),
    JSON.stringify(searchFilters.amenities),
    JSON.stringify(searchFilters.propertyStatus),
    JSON.stringify(searchFilters.societyTypes),
  ]);

  return (
    <div className="search-results-wrapper">
      <div className="search-results-container">
        <div className="search-results-header">
          <h1 className="search-results-heading">Results for your Search</h1>

          {/* Node Selector Row - shown when coming from BudgetSection */}
          {budgetNodes.length > 0 && (
            <div className="node-selector-container">
              <div className="node-selector-row">
                {budgetNodes.map((node) => (
                  <button
                    key={node}
                    onClick={() => onNodeSelect && onNodeSelect(node)}
                    className={`node-tab-button ${searchFilters.location === node ? "active" : ""}`}
                  >
                    {node}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {loading && <div className="loading-spinner">Loading properties...</div>}
        {error && <div className="error-message">{error}</div>}

        {!loading && !error && properties.length === 0 && (
          <div className="no-results">No properties found matching your criteria</div>
        )}

        {!loading && !error && properties.map((prop) => (
          <PropertyCard key={prop.id || Math.random()} property={prop} />
        ))}
      </div>
    </div>
  );
};

export { PropertyCard };
export default SearchResults;
