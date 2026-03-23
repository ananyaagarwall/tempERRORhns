import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const usePropertySearchBar = ({ initialLocation = "", onSearch } = {}) => {
  const [location, setLocation] = useState(initialLocation);
  const navigate = useNavigate();

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
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/');
  };

  return {
    location,
    setLocation,
    handleSearch,
    handleKeyPress,
    handleBack,
  };
};
