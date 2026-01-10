import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  // Property Cart
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('propertyCart');
    return saved ? JSON.parse(saved) : [];
  });

  // Builder Cart
  const [savedBuilders, setSavedBuilders] = useState(() => {
    const saved = localStorage.getItem('builderCart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('propertyCart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('builderCart', JSON.stringify(savedBuilders));
  }, [savedBuilders]);

  // Property Functions
  const addToCart = (property, source = 'featured') => {
    setCartItems(prev => {
      const exists = prev.find(item => item.id === property.id);
      if (exists) {
        return prev;
      }
      return [...prev, {
        id: property.id,
        name: property.name,
        price: property.price,
        location: property.address || property.location,
        image: property.img || property.image,
        availability: property.status || 'Available',
        bhk: property.features || property.bhk || '3 BHK',
        area: property.carpetArea || property.area || '1200 sq ft',
        builder: property.builder || 'Builder Name',
        amenities: property.highlights || property.amenities || [],
        source: source,
        addedAt: new Date().toISOString()
      }];
    });
  };

  const removeFromCart = (propertyId) => {
    setCartItems(prev => prev.filter(item => item.id !== propertyId));
  };

  const isInCart = (propertyId) => {
    return cartItems.some(item => item.id === propertyId);
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Builder Functions
  const addBuilder = (builder) => {
    setSavedBuilders(prev => {
      const exists = prev.find(item => item.rera_id === builder.rera_id);
      if (exists) {
        return prev;
      }
      return [...prev, {
        rera_id: builder.rera_id,
        company_name: builder.company_name,
        brand_name: builder.brand_name,
        builder_logo: builder.builder_logo,
        city: builder.city,
        state: builder.state,
        established_year: builder.established_year,
        completed_projects: builder.completed_projects,
        ongoing_projects: builder.ongoing_projects,
        builder_type: builder.builder_type,
        contact_email: builder.contact_email,
        contact_number: builder.contact_number,
        website_url: builder.website_url,
        rera_registered: builder.rera_registered,
        verified: builder.verified,
        short_description: builder.short_description,
        addedAt: new Date().toISOString()
      }];
    });
  };

  const removeBuilder = (reraId) => {
    setSavedBuilders(prev => prev.filter(item => item.rera_id !== reraId));
  };

  const isBuilderSaved = (reraId) => {
    return savedBuilders.some(item => item.rera_id === reraId);
  };

  const clearBuilders = () => {
    setSavedBuilders([]);
  };

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, removeFromCart, isInCart,
      savedBuilders, addBuilder, removeBuilder, isBuilderSaved,
      builderCount: savedBuilders.length
    }}>
      {children}
    </CartContext.Provider>
  );
};