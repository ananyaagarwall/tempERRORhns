import React, { useEffect } from "react";
import { Search, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSearchSuggestions } from "../../../hooks/useSearchSuggestions";
import "../../hns_propertylisting_css/propertysearchbar.css";

export const PropertySearchBar = ({ initialLocation = "", onSearch }) => {
  const navigate = useNavigate();

  const { value, setValue, inputRef, handleChange, handleSelect,
    handleKeyDown, SuggestionsPortal,
  } = useSearchSuggestions({
    // Real-time filter as user types — same as landing page
    onFilter: (val) => {
      if (typeof onSearch === 'function') onSearch(val);
    },
    // Also fire on Enter / suggestion click
    onSelect: (phrase) => {
      if (typeof onSearch === 'function') onSearch(phrase);
    },
  });

  useEffect(() => {
    if (initialLocation) setValue(initialLocation);
  }, [initialLocation, setValue]);

  const handleBack = () => {
    if (window.history.length > 1) { navigate(-1); return; }
    navigate('/');
  };

  return (
    <div className="property-search-container">
      <div className="property-search-card">
        <div className="property-search-bar">
          <button className="icon-button" onClick={handleBack}>
            <ChevronLeft className="icon" />
          </button>
          <div className="input-wrapper" style={{ flex: 1 }}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search location, project, amenity, BHK..."
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="search-input"
              autoComplete="off"
            />
          </div>
          <button className="icon-button" onClick={() => handleSelect(value.trim())}>
            <Search className="icon" />
          </button>
        </div>
      </div>
      <SuggestionsPortal />
    </div>
  );
};
