import React from "react";
import { Search, ChevronLeft } from "lucide-react";
import "../../hns_propertylisting_css/propertysearchbar.css";
import { usePropertySearchBar } from "../../hns_propertylisting_js/propertysearchbar.js";

export const PropertySearchBar = ({ initialLocation = "", onSearch }) => {
  const {
    location,
    setLocation,
    handleSearch,
    handleKeyPress,
    handleBack,
  } = usePropertySearchBar({ initialLocation, onSearch });

  return (
    <div className="property-search-container">
      <div className="property-search-card">
        <div className="property-search-bar">
          {/* Back Button */}
          <button className="icon-button" onClick={handleBack}>
            <ChevronLeft className="icon" />
          </button>

          {/* Search Input */}
          <div className="input-wrapper">
            <input
              type="text"
              placeholder="Search City/Locality..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyPress={handleKeyPress}
              className="search-input"
            />
          </div>

          {/* Search Icon */}
          <button className="icon-button" onClick={handleSearch}>
            <Search className="icon" />
          </button>
        </div>
      </div>
    </div>
  );
};
