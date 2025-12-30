import React, { useState, useRef } from "react";
import FooterNavBar from "../../hns_home_page/components/layout/FooterNavBar.jsx";
import FooterSection from "../../hns_home_page/components/layout/FooterSection";
import PropertiesSection from "../../hns_home_page/components/ui/PropertiesSection";
import PropertyFilterSidebar from "../components/layout/PropertyFilterSidebar.jsx";
import SearchResults from "../components/ui/propertycards.jsx";
import { PropertySearchBar } from "../components/ui/propertysearchbar.jsx";
import MobileTagsSection from "../components/ui/MobileTagsSection.jsx";
import "../hns_propertylisting_css/propertylisting.css";
import DynamicBreadcrumb from "../../components/ui/DynamicBreadcrumb.jsx";

const PropertyListing = () => {
  const [searchFilters, setSearchFilters] = useState({ location: "", priceRange: 0, bhkTypes: [] });
  const sidebarRef = useRef(null);
  const [mobileTags, setMobileTags] = useState([]);
  
  const removeTagFromSidebar = (tagToRemove) => {
    if (sidebarRef.current) {
      sidebarRef.current.removeTag(tagToRemove);
    }
  };

  const handleTagsChange = (tags) => {
    setMobileTags(tags || []);
  };

  const handleSearch = (location) => {
    setSearchFilters((prev) => ({ ...prev, location }));
  };

  return (
    <div>
      <FooterNavBar />
      <DynamicBreadcrumb/>

      <div className="listing-layout">
        {/* Sidebar */}
        <PropertyFilterSidebar ref={sidebarRef} onTagsChange={handleTagsChange} />

        {/* Main Property Listings */}
        <div className="main-content">
          <PropertySearchBar initialLocation={searchFilters.location} onSearch={handleSearch} />
          <MobileTagsSection 
            allTags={mobileTags} 
            removeTag={removeTagFromSidebar} 
          />
          <PropertiesSection title="Projects Near You" align="left" showUnderline={false} searchFilters={searchFilters} />
          <SearchResults searchFilters={searchFilters} />
        </div>
      </div>

      <FooterSection />
    </div>
  );
};

export default PropertyListing;

