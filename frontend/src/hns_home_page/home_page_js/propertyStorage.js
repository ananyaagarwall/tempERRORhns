/**
 * Property Storage Utility Functions
 * Provides utility functions to work with property data stored in localStorage
 */

/**
 * Get the last clicked property from localStorage
 * @returns {Object|null} The property data or null if not found
 */
export const getLastClickedProperty = () => {
  try {
    const propertyData = localStorage.getItem('lastClickedProperty');
    return propertyData ? JSON.parse(propertyData) : null;
  } catch (error) {
    return null;
  }
};

/**
 * Get recently viewed properties from localStorage
 * @returns {Array} Array of recently viewed properties (up to 5)
 */
export const getRecentlyViewedProperties = () => {
  try {
    const recentlyViewed = localStorage.getItem('recentlyViewedProperties');
    return recentlyViewed ? JSON.parse(recentlyViewed) : [];
  } catch (error) {
    return [];
  }
};

/**
 * Clear all property data from localStorage
 */
export const clearPropertyData = () => {
  try {
    localStorage.removeItem('lastClickedProperty');
    localStorage.removeItem('recentlyViewedProperties');
  } catch (error) {
    // silent fail
  }
};