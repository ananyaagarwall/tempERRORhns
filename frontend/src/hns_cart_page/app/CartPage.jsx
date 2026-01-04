import React, { useState } from 'react';
import CartPropertyCard from '../components/ui/CartPropertyCard';
import CompareModal from '../components/ui/CompareModal';
import MortgageCalculator from '../components/ui/MortgageCalculator';
import AgentSidebar from '../components/ui/AgentSidebar';
import SimilarProperties from '../components/ui/SimilarProperties';
import FooterNavBar from '../../hns_home_page/components/layout/FooterNavBar';     // Top sticky nav
import FooterSection from '../../hns_home_page/components/layout/FooterSection';   // Main footer
import MobileFooter from '../../components/ui/MobileFooter';                        // Mobile bottom nav
import '../css/CartPage.css';

const CartPage = () => {
  const [cartProperties, setCartProperties] = useState([
    {
      id: 1,
      name: 'Luxury Apartment Complex',
      price: '₹ 2.5 Cr',
      location: 'Mumbai, Maharashtra',
      image: '/Defining-Demand.jpg',
      availability: 'Available',
      bhk: '3 BHK',
      area: '1200 sq ft',
      builder: 'ABC Builders',
      amenities: ['Parking', 'Gym', 'Swimming Pool', 'Security']
    },
    {
      id: 2,
      name: 'Modern Residency',
      price: '₹ 1.8 Cr',
      location: 'Pune, Maharashtra',
      image: '/World-View-tower.jpg',
      availability: 'Under Offer',
      bhk: '2 BHK',
      area: '950 sq ft',
      builder: 'XYZ Developers',
      amenities: ['Parking', 'Gym', 'Garden']
    },
    {
      id: 3,
      name: 'Premium Villa',
      price: '₹ 4.5 Cr',
      location: 'Bangalore, Karnataka',
      image: '/presidental.jpeg',
      availability: 'Sold Out',
      bhk: '4 BHK',
      area: '2500 sq ft',
      builder: 'Premium Builders',
      amenities: ['Parking', 'Gym', 'Swimming Pool', 'Security', 'Clubhouse']
    }
  ]);

  const [compareList, setCompareList] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const handleCompareToggle = (propertyId) => {
    setCompareList(prev => {
      if (prev.includes(propertyId)) {
        return prev.filter(id => id !== propertyId);
      } else if (prev.length < 3) {
        return [...prev, propertyId];
      } else {
        alert('You can compare maximum 3 properties at a time');
        return prev;
      }
    });
  };

  const handleRemoveFromCart = (propertyId) => {
    setCartProperties(prev => prev.filter(prop => prop.id !== propertyId));
    setCompareList(prev => prev.filter(id => id !== propertyId));
  };

  const propertiesToCompare = cartProperties.filter(prop => compareList.includes(prop.id));

  return (
    <div className="cart-page-wrapper">
      {/* Sticky Top Navigation - appears on scroll */}
      <FooterNavBar />

      {/* Main Page Content */}
      <div className="cart-page-container max-w-[1320px] mx-auto px-4 py-8">
        <div className="cart-header">
          <h1>My Cart</h1>
          <p className="cart-subtitle">Manage your saved properties</p>
        </div>

        <div className="cart-content">
          <div className="cart-main">
            {/* Cart Properties List */}
            <div className="cart-properties-section">
              {cartProperties.length === 0 ? (
                <div className="empty-cart">
                  <p>Your cart is empty</p>
                  <p className="empty-cart-subtitle">Add properties to your cart to see them here</p>
                </div>
              ) : (
                <>
                  <div className="cart-actions-header">
                    <span className="cart-count">
                      {cartProperties.length} {cartProperties.length === 1 ? 'Property' : 'Properties'}
                    </span>
                    {compareList.length > 0 && (
                      <button 
                        className="compare-button"
                        onClick={() => setShowCompareModal(true)}
                      >
                        Compare ({compareList.length})
                      </button>
                    )}
                  </div>

                  <div className="cart-properties-list">
                    {cartProperties.map(property => (
                      <CartPropertyCard
                        key={property.id}
                        property={property}
                        isInCompare={compareList.includes(property.id)}
                        onCompareToggle={handleCompareToggle}
                        onRemove={handleRemoveFromCart}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Similar Properties */}
            <SimilarProperties currentProperties={cartProperties} />
          </div>

          {/* Sidebar */}
          <div className="cart-sidebar">
            <MortgageCalculator />
            <AgentSidebar />
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <FooterSection />

      {/* Mobile Bottom Navigation */}
      <MobileFooter />

      {/* Compare Modal */}
      {showCompareModal && (
        <CompareModal
          properties={propertiesToCompare}
          onClose={() => setShowCompareModal(false)}
        />
      )}
    </div>
  );
};

export default CartPage;