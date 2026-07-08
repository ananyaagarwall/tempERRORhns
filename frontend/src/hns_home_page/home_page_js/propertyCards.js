/**
 * Property Cards Click Handler
 * This script handles click events for property cards and stores information in localStorage
 */

const initPropertyCardHandlers = () => {
  // Select all property cards
  const propertyCards = document.querySelectorAll('.property-card-custom');
  
  // Add click event listener to each card
  propertyCards.forEach((card, index) => {
    card.addEventListener('click', () => {
      // Get property information from the card
      const propertyName = card.querySelector('.property-info-custom h2')?.textContent || 'Unknown Property';
      const propertyAddress = card.querySelector('.property-address-custom')?.textContent || 'Unknown Address';
      const propertyFeatures = card.querySelector('.property-details-custom')?.textContent || 'No features';
      const propertyPrice = card.querySelector('.property-price-custom')?.textContent || 'Price not available';
      
      // Create property object
      const propertyData = {
        index,
        name: propertyName,
        address: propertyAddress,
        features: propertyFeatures,
        price: propertyPrice,
        clickedAt: new Date().toISOString()
      };
      
      // Store in localStorage
      localStorage.setItem('lastClickedProperty', JSON.stringify(propertyData));
      
      // Also store in recently viewed properties array (max 5 items)
      let recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewedProperties') || '[]');
      
      // Check if this property is already in the recently viewed list
      const existingIndex = recentlyViewed.findIndex(p => p.name === propertyName && p.address === propertyAddress);
      
      // If it exists, remove it so we can add it to the front
      if (existingIndex !== -1) {
        recentlyViewed.splice(existingIndex, 1);
      }
      
      // Add to the beginning of the array
      recentlyViewed.unshift(propertyData);
      
      // Keep only the 5 most recent properties
      recentlyViewed = recentlyViewed.slice(0, 5);
      
      // Save back to localStorage
      localStorage.setItem('recentlyViewedProperties', JSON.stringify(recentlyViewed));
    });
  });
};

// Export the initialization function for use in other files
export default initPropertyCardHandlers;