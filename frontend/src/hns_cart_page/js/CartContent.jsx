import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../../services/apiInstance';

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
        bhk: property.bhk || (property.features && property.features !== 'Builder Project' ? property.features : '3 BHK'),
        area: property.carpetArea || property.area || '1200 sq ft',
        builder: property.builder || 'Builder Name',
        amenities: property.highlights || property.amenities || [],
        features: property.features || undefined, // Store features field for builder detection
        source: source, // 'listing' or 'featured'
        addedAt: new Date().toISOString()
      }];
    });

    if (property?.id) {
      api.post('/favorites', { property_id: property.id })
        .catch((error) => {
          console.warn('Failed to persist favorite:', error);
        });
    }
  };

  const removeFromCart = (propertyId) => {
    setCartItems(prev => prev.filter(item => item.id !== propertyId));

    if (propertyId) {
      api.delete('/favorites', { data: { property_id: propertyId } })
        .catch((error) => {
          console.warn('Failed to remove favorite:', error);
        });
    }
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
      const exists = prev.find(item => item.id === builder.id);
      if (exists) {
        return prev;
      }
      return [...prev, {
        id: builder.id,
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

  const removeBuilder = (builderId) => {
    setSavedBuilders(prev => prev.filter(item => item.id !== builderId));
  };

  const isBuilderSaved = (builderId) => {
    return savedBuilders.some(item => item.id === builderId);
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
