import React, { useState, useRef } from 'react';
import { useCart } from '../js/CartContent.jsx';
import { Trash2, Heart, MapPin, Home, Maximize, Calculator, X, ArrowRight, Sparkles } from 'lucide-react';
import FooterNavBar from '../../hns_home_page/components/layout/FooterNavBar.jsx';
import FooterSection from '../../hns_home_page/components/layout/FooterSection.jsx';
import MobileFooter from '../../components/ui/MobileFooter.jsx';
import '../css/CartPage.css';
import { useNavigate } from 'react-router-dom';
import DynamicBreadcrumb from '../../components/ui/DynamicBreadcrumb.jsx';

const CartPage = () => {
  const { cartItems, removeFromCart } = useCart();
  const [compareList, setCompareList] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Mortgage Calculator State
  const [loanAmount, setLoanAmount] = useState(5000000);
  const [interestRate, setInterestRate] = useState(8.5);
  const [loanTenure, setLoanTenure] = useState(20);

  const mobileCalculatorRef = useRef(null);
  const navigate = useNavigate();

  // Separate properties by source
  const listingProperties = cartItems.filter(item => item.source === 'listing');
  const featuredProperties = cartItems.filter(item => item.source === 'featured');
  const allProperties = cartItems;

  const displayedProperties = activeTab === 'all' ? allProperties :
                              activeTab === 'listing' ? listingProperties :
                              featuredProperties;

  const toggleCompare = (propertyId) => {
    setCompareList(prev => {
      if (prev.includes(propertyId)) {
        return prev.filter(id => id !== propertyId);
      }
      if (prev.length >= 3) {
        alert('You can compare up to 3 properties at a time');
        return prev;
      }
      return [...prev, propertyId];
    });
  };

  const calculateEMI = () => {
    const principal = loanAmount;
    const rate = interestRate / 12 / 100;
    const time = loanTenure * 12;
    if (rate === 0) return principal / time;
    const emi = (principal * rate * Math.pow(1 + rate, time)) / (Math.pow(1 + rate, time) - 1);
    return emi;
  };

  const emi = calculateEMI();
  const totalAmount = emi * loanTenure * 12;
  const totalInterest = totalAmount - loanAmount;

  const getAvailabilityColor = (status) => {
    switch (status) {
      case 'Available': return 'bg-emerald-500';
      case 'Under Offer': return 'bg-amber-500';
      case 'Sold Out': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const scrollToMobileCalculator = () => {
    mobileCalculatorRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
    setShowCalculator(true);
  };

  const handleCalculatorClick = () => {
    if (window.innerWidth < 1024) { // Tailwind 'lg' breakpoint
      scrollToMobileCalculator();
    } else {
      setShowCalculator(prev => !prev);
    }
  };

  const CompareModal = () => {
    const compareProperties = cartItems.filter(item => compareList.includes(item.id));
    
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Compare Properties</h2>
            <button onClick={() => setShowCompare(false)} className="text-white hover:bg-white/20 p-2 rounded-lg transition">
              <X size={24} />
            </button>
          </div>
          
          <div className="overflow-x-auto p-6">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Feature</th>
                  {compareProperties.map(prop => (
                    <th key={prop.id} className="py-4 px-4">
                      <img src={prop.image} alt={prop.name} className="w-32 h-24 object-cover rounded-lg mb-2 mx-auto" />
                      <p className="font-semibold text-sm text-gray-800">{prop.name}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {['price', 'location', 'bhk', 'area', 'builder', 'availability'].map(key => (
                  <tr key={key} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4 font-medium text-gray-600 capitalize">{key}</td>
                    {compareProperties.map(prop => (
                      <td key={prop.id} className="py-4 px-4 text-center text-gray-800">
                        {prop[key]}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4 font-medium text-gray-600">Amenities</td>
                  {compareProperties.map(prop => (
                    <td key={prop.id} className="py-4 px-4 text-center">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {prop.amenities?.slice(0, 3).map((amenity, i) => (
                          <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{amenity}</span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const EMICalculatorContent = () => (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900">EMI Calculator</h3>
        <button 
          onClick={() => setShowCalculator(false)} 
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>
      </div>

      <div className="space-y-6">
        {/* Loan Amount */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Loan Amount: ₹{(loanAmount / 100000).toFixed(1)} Lakhs
          </label>
          <input 
            type="range"
            min="500000"
            max="50000000"
            step="100000"
            value={loanAmount}
            onChange={(e) => setLoanAmount(Number(e.target.value))}
            className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>₹5L</span>
            <span>₹5Cr</span>
          </div>
        </div>

        {/* Interest Rate */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Interest Rate: {interestRate.toFixed(1)}%
          </label>
          <input 
            type="range"
            min="6"
            max="15"
            step="0.1"
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>6%</span>
            <span>15%</span>
          </div>
        </div>

        {/* Loan Tenure */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Loan Tenure: {loanTenure} Years
          </label>
          <input 
            type="range"
            min="5"
            max="30"
            step="1"
            value={loanTenure}
            onChange={(e) => setLoanTenure(Number(e.target.value))}
            className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>5 Yrs</span>
            <span>30 Yrs</span>
          </div>
        </div>

        {/* Results */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Monthly EMI</p>
            <p className="text-3xl font-bold text-blue-600">₹{emi.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <p className="text-xs text-gray-600 mb-1">Principal</p>
              <p className="text-lg font-semibold text-gray-900">₹{(loanAmount / 100000).toFixed(1)}L</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Interest</p>
              <p className="text-lg font-semibold text-gray-900">₹{(totalInterest / 100000).toFixed(1)}L</p>
            </div>
          </div>
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Total Amount</p>
            <p className="text-xl font-bold text-gray-900">₹{(totalAmount / 10000000).toFixed(2)} Cr</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <FooterNavBar sticky={true} />

        {/* Custom Navbar */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-gray-900">My Saved Properties</h1>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{cartItems.length}</span> properties saved
              </div>
            </div>
          </div>
        </div>

        <DynamicBreadcrumb/>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
              <div className="flex gap-2">
                <button onClick={() => setActiveTab('all')} className={`px-6 py-2.5 rounded-lg font-medium transition ${activeTab === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  All Properties ({allProperties.length})
                </button>
                <button onClick={() => setActiveTab('listing')} className={`px-6 py-2.5 rounded-lg font-medium transition flex items-center gap-2 ${activeTab === 'listing' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  <Home size={16} /> Search Results ({listingProperties.length})
                </button>
                <button onClick={() => setActiveTab('featured')} className={`px-6 py-2.5 rounded-lg font-medium transition flex items-center gap-2 ${activeTab === 'featured' ? 'bg-amber-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  <Sparkles size={16} /> Featured ({featuredProperties.length})
                </button>
              </div>

              <div className="flex gap-3">
                {compareList.length >= 2 && (
                  <button onClick={() => setShowCompare(true)} className="bg-gradient-to-r from-purple-600 to-purple-700 text-gray-600 px-5 py-2.5 rounded-lg hover:from-purple-700 hover:to-purple-800 transition shadow-md font-medium text-sm">
                    Compare ({compareList.length})
                  </button>
                )}
                <button 
                  onClick={handleCalculatorClick}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-gray-600 px-5 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-md font-medium flex items-center gap-2 text-sm"
                >
                  <Calculator size={18} />
                  EMI Calculator
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Properties List */}
            <div className="lg:col-span-2 space-y-4">
              {displayedProperties.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-16 text-center">
                  <Heart size={64} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                    {activeTab === 'all' ? 'No saved properties yet' :
                     activeTab === 'listing' ? 'No properties from search results' :
                     'No featured properties saved'}
                  </h3>
                  <p className="text-gray-600 mb-6">Start exploring and save properties you love!</p>
                  <button onClick={() => navigate('/properties')} className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition font-medium">
                    Browse Properties
                  </button>
                </div>
              ) : (
                displayedProperties.map(property => (
                  <div key={property.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition overflow-hidden">
                    <div className="flex flex-col sm:flex-row">
                      <div className="sm:w-80 h-64 sm:h-auto relative overflow-hidden group">
                        <img 
                          src={property.image || '/main-image.jpeg'} 
                          alt={property.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                        />
                        <div className={`absolute top-4 left-4 ${getAvailabilityColor(property.availability)} text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg`}>
                          {property.availability}
                        </div>
                        {property.source === 'featured' && (
                          <div className="absolute top-4 right-4 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                            <Sparkles size={12} /> Featured
                          </div>
                        )}
                      </div>

                      <div className="flex-1 p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">{property.name}</h3>
                            <div className="flex items-center text-gray-600 mb-3">
                              <MapPin size={16} className="mr-1" />
                              <span className="text-sm">{property.location}</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => removeFromCart(property.id)}
                            className="text-red-500 hover:bg-red-50 p-2.5 rounded-lg transition"
                            title="Remove from cart"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-4 mb-4">
                          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
                            <Home size={18} className="text-blue-600" />
                            <span className="font-semibold text-gray-900">{property.bhk}</span>
                          </div>
                          <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg">
                            <Maximize size={18} className="text-green-600" />
                            <span className="font-semibold text-gray-900">{property.area}</span>
                          </div>
                        </div>

                        {property.amenities && property.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {property.amenities.slice(0, 4).map((amenity, i) => (
                              <span key={i} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                                {amenity}
                              </span>
                            ))}
                            {property.amenities.length > 4 && (
                              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                                +{property.amenities.length - 4} more
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                          <div className="text-3xl font-bold text-blue-600">{property.price}</div>
                          <div className="flex gap-2">
                            <label className="flex items-center gap-2 cursor-pointer bg-purple-50 px-4 py-2 rounded-lg hover:bg-purple-100 transition">
                              <input 
                                type="checkbox"
                                checked={compareList.includes(property.id)}
                                onChange={() => toggleCompare(property.id)}
                                className="w-4 h-4 accent-purple-600"
                              />
                              <span className="text-sm font-medium text-purple-900">Compare</span>
                            </label>
                            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2">
                              View Details <ArrowRight size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Sidebar Calculator - Only visible on lg+ */}
            <div className="hidden lg:block lg:col-span-1">
              {showCalculator && <EMICalculatorContent />}
            </div>
          </div>

          {/* Mobile Full-Width Calculator at Bottom */}
          <div ref={mobileCalculatorRef} className="lg:hidden mt-12">
            {showCalculator && <EMICalculatorContent />}
          </div>
        </div>

        {/* Compare Modal */}
        {showCompare && <CompareModal />}
      </div>

      <FooterSection />
      <MobileFooter />
    </>
  );
};

export default CartPage;