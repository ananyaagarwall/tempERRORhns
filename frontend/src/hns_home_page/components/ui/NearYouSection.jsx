import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../home_page_css/NearYouSection.css";

// Fallback tabs if API fails or user location not detected
const FALLBACK_TABS = [
    { label: "Thane", key: "thane" },
    { label: "Airoli", key: "airoli" },
    { label: "Rabale", key: "rabale" },
    { label: "Ghansoli", key: "ghansoli" },
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
    const [tabs, setTabs] = useState(FALLBACK_TABS);
    const [activeTab, setActiveTab] = useState("thane");
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(false);
    const [locationsLoading, setLocationsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [nearestNodes, setNearestNodes] = useState([]);

    const tabRowRef = useRef(null);
    const cardsRowRef = useRef(null);
    const navigate = useNavigate();

    // Fetch nearest nodes when userLocation changes
    useEffect(() => {
        const fetchNearestNodes = async () => {
            setLocationsLoading(true);
            try {
                // Use userLocation if available, otherwise fetch default
                const locationToUse = userLocation || "Thane";
                const res = await fetch(`http://127.0.0.1:5000/api/nearest-nodes/${encodeURIComponent(locationToUse)}`);

                if (!res.ok) throw new Error('Failed to fetch nearest nodes');
                const data = await res.json();

                if (data.nearestNodes && Array.isArray(data.nearestNodes) && data.nearestNodes.length > 0) {
                    // Transform nodes into tab format
                    const locationTabs = data.nearestNodes.map(loc => ({
                        label: loc,
                        key: loc.toLowerCase().replace(/\s+/g, ''),
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
            } finally {
                setLocationsLoading(false);
            }
        };
        fetchNearestNodes();
    }, [userLocation]);

    // Fetch properties whenever activeTab changes
    useEffect(() => {
        const fetchProperties = async () => {
            setLoading(true);
            try {
                // Find the actual location name for the active tab
                const selectedTab = tabs.find(t => t.key === activeTab);
                const locationName = selectedTab ? selectedTab.label : activeTab;

                const res = await fetch(
                    `http://127.0.0.1:5000/api/properties/location/${encodeURIComponent(locationName)}`
                );
                if (!res.ok) throw new Error('Failed to fetch properties');
                const data = await res.json();

                // Map API response to component data structure
                const mapped = data.map((p, idx) => ({
                    id: p.id,
                    name: p.Property_Name,
                    img: p.image && p.image !== "/fallback.png" ? p.image : getFallbackImage(p.id, idx),
                    projects: p.projects || "N/A Projects",
                    price: p.Price_Starting_From || "N/A",
                    Existing_Configurations: p.Existing_Configurations || [],
                    location: p.Location || locationName,
                }));
                setProperties(mapped);
                setError(null);

                // Notify parent of location change if callback provided
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

        if (activeTab) {
            fetchProperties();
        }
    }, [activeTab, tabs, onLocationChange]);

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

        navigate('/properties');
    };

    // Filter properties based on searchFilters
    const filteredProperties = properties.filter(property => {
        // Price filter
        const priceValue = parsePriceInCr(property.price);
        const priceMatch = !searchFilters.priceRange || priceValue <= searchFilters.priceRange;

        // BHK Type filter
        let bhkMatch = true;
        if (searchFilters.bhkTypes && searchFilters.bhkTypes.length > 0) {
            if (property.Existing_Configurations && Array.isArray(property.Existing_Configurations)) {
                bhkMatch = searchFilters.bhkTypes.some(type =>
                    property.Existing_Configurations.some(cfg =>
                        cfg.type && cfg.type.toLowerCase().includes(type.replace('bhk', ' bhk'))
                    )
                );
            } else {
                bhkMatch = false;
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
            <div className="near-you-cards-container">
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
        </section>
    );
};

export default NearYouSection;
