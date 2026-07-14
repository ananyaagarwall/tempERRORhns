// src/hns_home_page/components/ui/NearYouSection.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import '../../home_page_css/NearYouSection.css';
import { pickProjectImage } from '../../../utils/projectImageUtils';
import { useNearestNodes } from '../../../queries/nodes';
import { usePropertiesByLocation } from '../../../queries/properties';

// Fallback tabs if nodes API fails or userLocation not detected
const FALLBACK_TABS = [
  { label: 'Thane', key: 'thane' },
  { label: 'Airoli', key: 'airoli' },
  { label: 'Ghansoli', key: 'ghansoli' },
  { label: 'Turbhe', key: 'turbhe' },
];

const FALLBACK_IMAGES = [
  '/palm.jpg', '/building.webp', '/lodha.jpg', '/kalpa.jpg',
  '/rustomujee.jpg', '/presidental.jpeg', '/World-View-tower.jpg',
  '/garden.jpeg', '/famous.jpg',
];

function getFallbackImage(propertyId, index) {
  const idx = propertyId
    ? propertyId % FALLBACK_IMAGES.length
    : index % FALLBACK_IMAGES.length;
  return FALLBACK_IMAGES[idx];
}

function parsePriceInCr(priceStr) {
  if (!priceStr) return 0;
  let val = priceStr.toString().replace(/₹|,|\+|\s/g, '').toLowerCase();
  try {
    if (val.includes('cr')) return parseFloat(val.replace('cr', ''));
    if (val.includes('lakh')) return parseFloat(val.replace('lakh', '')) / 100;
    return parseFloat(val);
  } catch {
    return 0;
  }
}

// Allowed locations for the NearYou section
const ALLOWED_LOCATIONS = ['koparkhairane', 'airoli', 'ghansoli', 'vashi'];
const normalize = (str) => str.toLowerCase().replace(/[\s-]/g, '');

const NearYouSection = ({ searchFilters = {}, onLocationChange, userLocation }) => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 700 : false
  );
  const [tabs, setTabs] = useState(FALLBACK_TABS);
  const [activeTab, setActiveTab] = useState(null);

  const tabRowRef = useRef(null);
  const cardsRowRef = useRef(null);
  const navigate = useNavigate();

  // ── Resize listener ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 700);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Nearest Nodes (TanStack Query) ───────────────────────────────────────
  // Falls back to 'Thane' so the query always fires even without geolocation
  const locationToQuery = userLocation || 'Thane';
  const {
    data: nodesData,
    isLoading: locationsLoading,
  } = useNearestNodes(locationToQuery);

  // Derive tabs from nodes data whenever it changes
  useEffect(() => {
    if (!nodesData) return;

    const nodes = nodesData.nearestNodes;
    if (Array.isArray(nodes) && nodes.length > 0) {
      const locationTabs = nodes
        .filter((loc) => ALLOWED_LOCATIONS.includes(normalize(loc)))
        .map((loc) => ({ label: loc, key: normalize(loc) }));

      if (locationTabs.length > 0) {
        setTabs(locationTabs);
        setActiveTab((prev) => prev ?? locationTabs[0].key);
        return;
      }
    }
    // Fallback
    setTabs(FALLBACK_TABS);
    setActiveTab((prev) => prev ?? FALLBACK_TABS[0].key);
  }, [nodesData]);

  // Set fallback active tab on first render if nodes haven't resolved yet
  useEffect(() => {
    if (locationsLoading || nodesData) return;
    setTabs(FALLBACK_TABS);
    setActiveTab((prev) => prev ?? FALLBACK_TABS[0].key);
  }, [locationsLoading, nodesData]);

  // ── Active tab label ──────────────────────────────────────────────────────
  const selectedTab = tabs.find((t) => t.key === activeTab);
  const locationName = selectedTab?.label ?? activeTab ?? '';

  // ── Properties for active tab (TanStack Query) ────────────────────────────
  // Cache key is the location name — switching back to a visited tab = 0 calls
  const {
    data: rawProperties,
    isLoading: loading,
    isError,
  } = usePropertiesByLocation(locationName);

  // Map raw API shape once
  const properties = useMemo(() => {
    if (!Array.isArray(rawProperties)) return [];
    return rawProperties.map((p, idx) => ({
      id: p.id,
      name: p.Property_Name,
      img:
        pickProjectImage(
          { id: p.project_id, builder_project_image: p.builder_project_image },
          p
        ) || getFallbackImage(p.id, idx),
      projects: p.projects || 'N/A Projects',
      price: p.Price_Starting_From || 'N/A',
      Existing_Configurations: p.Existing_Configurations || [],
      location: p.Location || locationName,
    }));
  }, [rawProperties, locationName]);

  // Notify parent of active location
  useEffect(() => {
    if (locationName && onLocationChange) onLocationChange(locationName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationName]);

  // ── Client-side filter ────────────────────────────────────────────────────
  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const priceValue = parsePriceInCr(property.price);
      const priceRangeMatch =
        !searchFilters.priceRange || priceValue * 100 <= searchFilters.priceRange;
      const minBudgetMatch =
        !searchFilters.minBudget || priceValue * 100 >= searchFilters.minBudget;
      const maxBudgetMatch =
        !searchFilters.maxBudget || priceValue * 100 <= searchFilters.maxBudget;
      const priceMatch = priceRangeMatch && minBudgetMatch && maxBudgetMatch;

      let bhkMatch = true;
      if (searchFilters.bhkTypes?.length > 0) {
        if (property.Existing_Configurations?.length > 0) {
          bhkMatch = searchFilters.bhkTypes.some((type) =>
            property.Existing_Configurations.some(
              (cfg) => cfg.type && cfg.type.toLowerCase().includes(type.replace('bhk', ' bhk'))
            )
          );
        }
        // If no config data, don't filter out
      }

      return priceMatch && bhkMatch;
    });
  }, [properties, searchFilters]);

  // ── Scroll helpers ────────────────────────────────────────────────────────
  const scrollCards = (direction) => {
    if (!cardsRowRef.current) return;
    cardsRowRef.current.scrollBy({
      left: direction === 'left' ? -720 : 720,
      behavior: 'smooth',
    });
  };

  const handleCardClick = (property) => {
    const propertyData = {
      id: property.id,
      name: property.name,
      projects: property.projects,
      price: property.price,
      img: property.img,
      location: property.location,
      clickedAt: new Date().toISOString(),
    };
    localStorage.setItem('lastClickedProperty', JSON.stringify(propertyData));
    let recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewedProperties') || '[]');
    const existingIndex = recentlyViewed.findIndex((p) => p.id === property.id);
    if (existingIndex !== -1) recentlyViewed.splice(existingIndex, 1);
    recentlyViewed.unshift(propertyData);
    recentlyViewed = recentlyViewed.slice(0, 5);
    localStorage.setItem('recentlyViewedProperties', JSON.stringify(recentlyViewed));
    navigate(`/property/${property.id}`);
  };

  return (
    <section className="near-you-section">
      {/* Section Header */}
      <div className="near-you-header">
        <h2 className="near-you-title">Near You</h2>
        <span className="near-you-underline" />
      </div>

      {/* Location Tabs */}
      <div className="near-you-tab-container">
        <div className="near-you-tab-row" ref={tabRowRef}>
          {locationsLoading ? (
            <div className="near-you-tabs-loading">Finding nearby areas...</div>
          ) : (
            tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`near-you-tab-button ${activeTab === tab.key ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Property Cards */}
      <div className="near-you-cards-container-wrapper" style={{ position: 'relative' }}>
        {!isMobile && (
          <>
            <button
              className="scroll-btn left"
              onClick={() => scrollCards('left')}
              aria-label="Scroll left"
            >
              <FaChevronLeft />
            </button>
            <button
              className="scroll-btn right"
              onClick={() => scrollCards('right')}
              aria-label="Scroll right"
            >
              <FaChevronRight />
            </button>
          </>
        )}
        <div className="near-you-cards-row" ref={cardsRowRef}>
          {loading ? (
            <div className="near-you-loading">Loading properties...</div>
          ) : isError ? (
            <div className="near-you-error">Failed to fetch properties</div>
          ) : filteredProperties.length === 0 ? (
            <div className="near-you-empty">No properties found in this location</div>
          ) : (
            filteredProperties.map((property, idx) => (
              <div
                key={property.id || idx}
                className="near-you-property-card"
                onClick={() => handleCardClick(property)}
              >
                <div
                  className="near-you-card-inner"
                  style={{
                    background: `url(${property.img || '/palm.jpg'}) center/cover no-repeat`,
                  }}
                >
                  <div className="near-you-card-overlay" />
                  <div className="near-you-card-content">
                    <div className="near-you-card-title">{property.name}</div>
                    <div className="near-you-card-location">📍 {property.location}</div>
                    <div className="near-you-card-price">{property.price}</div>
                    <div className="near-you-card-buttons">
                      <button className="near-you-card-btn">View Details</button>
                      <button className="near-you-card-btn secondary">See Reviews</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        .near-you-cards-container-wrapper:hover .scroll-btn { opacity: 1; }
        .scroll-btn {
          position: absolute; top: 50%; transform: translateY(-50%);
          z-index: 100; background: rgba(250, 248, 245, 0.65);
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.6); color: #223A5F;
          width: 52px; height: 52px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; box-shadow: 0 8px 24px rgba(34,58,95,0.15);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); opacity: 0;
        }
        .scroll-btn:hover {
          background: rgba(241, 217, 122, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.8);
          transform: translateY(-50%) scale(1.08);
          box-shadow: 0 10px 28px rgba(34,58,95,0.22);
        }
        .scroll-btn.left { left: 20px; }
        .scroll-btn.right { right: 20px; }
        .scroll-btn svg { font-size: 20px; }
      `}</style>
    </section>
  );
};

export default NearYouSection;