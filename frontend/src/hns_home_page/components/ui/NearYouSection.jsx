import API_BASE_URL from '../../../config';
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import "../../home_page_css/NearYouSection.css";
import { pickProjectImage } from '../../../utils/projectImageUtils';

// Fallback tabs if API fails or user location not detected
// Note: Rabale, Juinagar, Kharghar, Khandeshwar are excluded from Near You section
const FALLBACK_TABS = [
    { label: "Thane", key: "thane" },
    { label: "Airoli", key: "airoli" },
    { label: "Ghansoli", key: "ghansoli" },
    { label: "Turbhe", key: "turbhe" },
];

// Fallback images when property image is not available
const FALLBACK_IMAGES = [
    "/palm.jpg",
    "/building.webp",
    "/lodha.jpg",
    "/kalpa.jpg",
    "/rustomujee.jpg",
    "/presidental.jpeg",
    "/World-View-tower.jpg",
    "/garden.jpeg",
    "/famous.jpg",
];

// Get a fallback image based on property id/index for consistency
function getFallbackImage(propertyId, index) {
    const idx = propertyId ? (propertyId % FALLBACK_IMAGES.length) : (index % FALLBACK_IMAGES.length);
    return FALLBACK_IMAGES[idx];
}

// Helper to robustly parse price in Cr from string
function parsePriceInCr(priceStr) {
    if (!priceStr) return 0;
    let val = priceStr.toString().replace(/₹|,|\+|\s/g, '').toLowerCase();
    try {
        if (val.includes('cr')) {
            return parseFloat(val.replace('cr', ''));
        } else if (val.includes('lakh')) {
            return parseFloat(val.replace('lakh', '')) / 100;
        } else {
            return parseFloat(val);
        }
    } catch {
        return 0;
    }
}

const NearYouSection = ({ searchFilters = {}, onLocationChange, userLocation }) => {
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 700 : false);
    const [tabs, setTabs] = useState(FALLBACK_TABS);
    const [activeTab, setActiveTab] = useState(null);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(false);
    const [locationsLoading, setLocationsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [nearestNodes, setNearestNodes] = useState([]);
    const selectedTab = tabs.find(t => t.key === activeTab);
    const locationName = selectedTab?.label ?? activeTab;

    const tabRowRef = useRef(null);
    const cardsRowRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 700);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const scrollCards = (direction) => {
        if (!cardsRowRef.current) return;
        const scrollAmount = 720; // 2 cards scroll
        cardsRowRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    };

    // Fetch nearest nodes when userLocation changes
    useEffect(() => {
        const fetchNearestNodes = async () => {
            setLocationsLoading(true);
            try {
                // Use userLocation if available, otherwise fetch default
                const locationToUse = userLocation || "Thane";
                const res = await fetch(`${API_BASE_URL}/api/nearest-nodes/${encodeURIComponent(locationToUse)}`);

                if (!res.ok) throw new Error('Failed to fetch nearest nodes');
                const data = await res.json();

                if (data.nearestNodes && Array.isArray(data.nearestNodes) && data.nearestNodes.length > 0) {
                    // Transform nodes into tab format
                const allowedLocations = [
                "koparkhairane",
                "airoli",
                "ghansoli",
                "vashi",
                ];

                const normalize = str =>
                str.toLowerCase().replace(/[\s-]/g, "");

                const locationTabs = data.nearestNodes
                .filter(loc => allowedLocations.includes(normalize(loc)))
                .map(loc => ({
                    label: loc,
                    key: normalize(loc),
                }));
                    setTabs(locationTabs);
                    setNearestNodes(data.nearestNodes);
                    // Set first location as active
                    setActiveTab(locationTabs[0].key);
                } else {
                    // Fallback to default tabs
                    setTabs(FALLBACK_TABS);
                    setNearestNodes(FALLBACK_TABS.map(t => t.label));
                    setActiveTab(FALLBACK_TABS[0].key);
                }
            } catch (err) {
                console.error("Error fetching nearest nodes:", err);
                // Keep fallback tabs if API fails
                setTabs(FALLBACK_TABS);
                setNearestNodes(FALLBACK_TABS.map(t => t.label));
                setActiveTab(FALLBACK_TABS[0].key); 
            } finally {
                setLocationsLoading(false);
            }
        };
        fetchNearestNodes();
    }, [userLocation]);

   // Fetch properties whenever activeTab changes

useEffect(() => {
    if (!activeTab) return;

    const fetchProperties = async () => {
        setLoading(true);
        try {
            // Find the actual location name for the active tab
            const selectedTab = tabs.find(t => t.key === activeTab);
            const locationName = selectedTab ? selectedTab.label : activeTab;

            const res = await fetch(
            `${API_BASE_URL}/api/properties/location/${encodeURIComponent(locationName)}`
        );

        if (!res.ok) throw new Error("Failed to fetch properties");

        const data = await res.json();

            const mapped = data.map((p, idx) => ({
            id: p.id,
            name: p.Property_Name,
            img:
                pickProjectImage(
                    { id: p.project_id, builder_project_image: p.builder_project_image },
                    p
                ) || getFallbackImage(p.id, idx),
            projects: p.projects || "N/A Projects",
            price: p.Price_Starting_From || "N/A",
            Existing_Configurations: p.Existing_Configurations || [],
            location: p.Location || locationName,
        }));

            setProperties(mapped);
            setError(null);

            if (onLocationChange) {
                onLocationChange(locationName);
            }
        } catch (err) {
            console.error("Error fetching properties:", err);
            setError("Failed to fetch properties");
            setProperties([]);
        } finally {
            setLoading(false);
        }
    };

    fetchProperties();
}, [activeTab, onLocationChange]);

    const handleTabClick = (tabKey) => {
        setActiveTab(tabKey);
    };

    const handleCardClick = (property) => {
        // Store property data in localStorage and update recently viewed
        const propertyData = {
            id: property.id,
            name: property.name,
            projects: property.projects,
            price: property.price,
            img: property.img,
            location: property.location,
            clickedAt: new Date().toISOString()
        };
        localStorage.setItem('lastClickedProperty', JSON.stringify(propertyData));

        let recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewedProperties') || '[]');
        const existingIndex = recentlyViewed.findIndex(p => p.id === property.id);
        if (existingIndex !== -1) {
            recentlyViewed.splice(existingIndex, 1);
        }
        recentlyViewed.unshift(propertyData);
        recentlyViewed = recentlyViewed.slice(0, 5);
        localStorage.setItem('recentlyViewedProperties', JSON.stringify(recentlyViewed));

        navigate(`/property/${property.id}`);
    };

    // Filter properties based on searchFilters
    const filteredProperties = properties.filter(property => {
        // Price filter
        const priceValue = parsePriceInCr(property.price);
        
        // Desktop priceRange filter (max price)
        const priceRangeMatch = !searchFilters.priceRange || (priceValue * 100) <= searchFilters.priceRange;

        // Mobile min/max budget filters
        const minBudgetMatch = !searchFilters.minBudget || (priceValue * 100) >= searchFilters.minBudget;
        const maxBudgetMatch = !searchFilters.maxBudget || (priceValue * 100) <= searchFilters.maxBudget;

        const priceMatch = priceRangeMatch && minBudgetMatch && maxBudgetMatch;

        // BHK Type filter
        let bhkMatch = true;
        if (searchFilters.bhkTypes && searchFilters.bhkTypes.length > 0) {
            if (property.Existing_Configurations && Array.isArray(property.Existing_Configurations) && property.Existing_Configurations.length > 0) {
                bhkMatch = searchFilters.bhkTypes.some(type =>
                    property.Existing_Configurations.some(cfg =>
                        cfg.type && cfg.type.toLowerCase().includes(type.replace('bhk', ' bhk'))
                    )
                );
            } else {
                // No configuration data — don't filter out this property
                bhkMatch = true;
            }
        }

        return priceMatch && bhkMatch;
    });

    return (
        <section className="near-you-section">
            {/* Section Header */}
            <div className="near-you-header">
                <h2 className="near-you-title">Near You</h2>
                <span className="near-you-underline" />
            </div>

            {/* Location Tabs - Shows 4 nearest locations */}
            <div className="near-you-tab-container">
                <div className="near-you-tab-row" ref={tabRowRef}>
                    {locationsLoading ? (
                        <div className="near-you-tabs-loading">Finding nearby areas...</div>
                    ) : (
                        tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => handleTabClick(tab.key)}
                                className={`near-you-tab-button ${activeTab === tab.key ? "active" : ""}`}
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
                    ) : error ? (
                        <div className="near-you-error">{error}</div>
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
                                        background: `url(${property.img || "/palm.jpg"}) center/cover no-repeat`,
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
                .near-you-cards-container-wrapper:hover .scroll-btn {
                    opacity: 1;
                }
                .scroll-btn {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    z-index: 100;
                    background: rgba(250, 248, 245, 0.65);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.6);
                    color: #223A5F;
                    width: 52px;
                    height: 52px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 8px 24px rgba(34,58,95,0.15);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    opacity: 0;
                }
                .scroll-btn:hover {
                    background: rgba(241, 217, 122, 0.9);
                    border: 1px solid rgba(255, 255, 255, 0.8);
                    transform: translateY(-50%) scale(1.08);
                    box-shadow: 0 10px 28px rgba(34,58,95,0.22);
                }
                .scroll-btn.left {
                    left: 20px;
                }
                .scroll-btn.right {
                    right: 20px;
                }
                .scroll-btn svg {
                    font-size: 20px;
                }
            `}</style>
        </section>
    );
};

export default NearYouSection;