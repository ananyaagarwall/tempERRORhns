import { useState } from "react";

export const usePropertySearchBar = ({ initialLocation = "", onSearch } = {}) => {
  const [location, setLocation] = useState(initialLocation);

  const handleSearch = () => {
    if (typeof onSearch === 'function') {
      onSearch(location.trim());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleBack = () => {
    console.log("Back button clicked");
  };

  return {
    location,
    setLocation,
    handleSearch,
    handleKeyPress,
    handleBack,
  };
};
