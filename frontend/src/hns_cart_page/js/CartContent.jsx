// src/hns_cart_page/js/CartContent.jsx
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
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('propertyCart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('propertyCart', JSON.stringify(cartItems));
  }, [cartItems]);

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
        source: source, // 'listing' or 'featured'
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

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      isInCart,
      clearCart,
      cartCount: cartItems.length
    }}>
      {children}
    </CartContext.Provider>
  );
};