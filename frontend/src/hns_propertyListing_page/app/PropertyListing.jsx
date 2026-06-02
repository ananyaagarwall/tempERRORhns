import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import FooterNavBar from "../../hns_home_page/components/layout/FooterNavBar.jsx";
import FooterSection from "../../hns_home_page/components/layout/FooterSection";
import DynamicBreadcrumb from "../../components/ui/DynamicBreadcrumb.jsx";
import MobileFooter from "../../components/ui/MobileFooter.jsx";
import PropertiesSection from "../../hns_home_page/components/ui/PropertiesSection";
import PropertyFilterSidebar from "../components/layout/PropertyFilterSidebar.jsx";
import SearchResults from "../components/ui/propertycards.jsx";
import { PropertySearchBar } from "../components/ui/propertysearchbar.jsx";
import MobileTagsSection from "../components/ui/MobileTagsSection.jsx";
import "../hns_propertylisting_css/propertylisting.css";

const PropertyListing = () => {
  const routeState = useLocation().state || {};
  const {
    priceMax: initPriceMax = 0,
    city: initCity = "Navi Mumbai",
    nodes: initNodes = [],
    // Passed from landing page search bar
    location: initLocation = "",
    priceRange: initPriceRange = 0,
    minBudget: initMinBudget = null,
    maxBudget: initMaxBudget = null,
    bhkTypes: initBhkTypes = [],
  } = routeState;

  // Convert lakhs → Crores for the slider if coming from BudgetSection (priceMax in Lakhs)
  const initPriceCr = initPriceMax > 0
    ? Math.round((initPriceMax / 100) * 10) / 10
    : initPriceRange || 0;

  // Seed location: explicit location > first node from budget section > empty
  const initLocSeed = initLocation || (initNodes.length > 0 ? initNodes[0] : "");

  const [searchFilters, setSearchFilters] = useState({
    location: initLocSeed,
    priceRange: initPriceCr,
    minBudget: initMinBudget,
    maxBudget: initMaxBudget,
    bhkTypes: initBhkTypes,
    propertyStatus: [],
    amenities: [],
    societyTypes: [],
  });
  const [city, setCity] = useState(initCity);
  const [budgetNodes] = useState(initNodes);

  const sidebarRef = useRef(null);
  const [mobileTags, setMobileTags] = useState([]);

  // If URL state changes (e.g., user navigates back then forward), sync
  useEffect(() => {
    if (routeState.priceMax) {
      const cr = Math.round((routeState.priceMax / 100) * 10) / 10;
      setSearchFilters((prev) => ({ ...prev, priceRange: cr }));
    }
    if (routeState.city) setCity(routeState.city);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeTagFromSidebar = (tagToRemove) => {
    if (sidebarRef.current) {
      sidebarRef.current.removeTag(tagToRemove);
    }
  };

  const handleTagsChange = (tags) => {
    setMobileTags(tags || []);
  };

  const handleSearch = (locationInput) => {
    setSearchFilters((prev) => ({ ...prev, location: locationInput }));
    // Update city tag if user typed something that looks like a city
    if (locationInput && locationInput.trim()) {
      setCity(locationInput.trim());
    }
  };

  const handlePriceChange = (priceCr) => {
    setSearchFilters((prev) => ({ ...prev, priceRange: priceCr }));
  };

  const handleSidebarFiltersChange = (filters) => {
    setSearchFilters((prev) => ({
      ...prev,
      propertyStatus: filters.propertyStatus || [],
      amenities: filters.amenities || [],
      societyTypes: filters.societyType || [],
    }));
  };

  const handleCityRemove = () => {
    setCity("");
  };

  const handleNodeSelect = (nodeName) => {
    setSearchFilters((prev) => ({ ...prev, location: nodeName }));
  };

  return (
    <div>
      <FooterNavBar />
      <DynamicBreadcrumb />

      <div className="listing-layout">
        {/* Sidebar */}
        <PropertyFilterSidebar
          ref={sidebarRef}
          onTagsChange={handleTagsChange}
          city={city}
          filterLocation={searchFilters.location || city}
          onCityRemove={handleCityRemove}
          initialPriceCr={initPriceCr}
          onPriceChange={handlePriceChange}
          onFiltersChange={handleSidebarFiltersChange}
        />

        {/* Main Property Listings */}
        <div className="main-content">
          <PropertySearchBar
            initialLocation={searchFilters.location}
            onSearch={handleSearch}
          />
          <MobileTagsSection allTags={mobileTags} removeTag={removeTagFromSidebar} />
          <PropertiesSection
            title="Projects Near You"
            align="left"
            showUnderline={false}
            searchFilters={searchFilters}
          />
          <SearchResults
            searchFilters={searchFilters}
            budgetNodes={budgetNodes}
            onNodeSelect={handleNodeSelect}
          />
        </div>
      </div>

      <FooterSection />
      <MobileFooter />
    </div>
  );
};

export default PropertyListing;
