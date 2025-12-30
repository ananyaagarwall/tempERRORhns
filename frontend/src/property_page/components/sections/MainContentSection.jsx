import React from "react";
import { Shield, Check, ArrowLeft, ArrowRight } from "lucide-react";
import ResultsNavBar from "../layouts/ResultsNavBar";
import { Card, CardContent } from "../ui/Card";
import Button from "../ui/Button";

import propertyHero from "../../../assets/property-hero.jpg"; // Using as placeholder
import locationMap from "../../../assets/location-map.jpg";

const MainContentSection = () => {
  const overviewRef = React.useRef(null);
  const floorPlansRef = React.useRef(null); // This ref is passed for nav, but the component is separate
  const amenitiesRef = React.useRef(null);
  const mapRef = React.useRef(null);

  const imageSources = React.useMemo(() => [propertyHero], []);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  const [showAllLeftOverview, setShowAllLeftOverview] = React.useState(false);
  const [showAllRightOverview, setShowAllRightOverview] = React.useState(false);

  const overviewData = {
    left: [
      { label: "Possession Date", value: "Dec 2025" },
      { label: "RERA Number", value: "P51800012345" },
      { label: "Address", value: "Ghansoli, Navi Mumbai" },
      { label: "Property Type", value: "3 BHK Flat" },
      { label: "Price Range", value: "₹45 Lakh - ₹1.2 Cr" }
    ],
    right: [
      { label: "Carpet Area", value: "1250 sq.ft." },
      { label: "Built-up Area", value: "1260 sq. ft." },
      { label: "Parking", value: "With extra charges" },
      { label: "Approved by", value: "PMC | BBMP" },
      { label: "Loan Availability", value: "SBI | HDFC" }
    ]
  };

  const highlights = [
    "Recently Renovated", "Gated Society", "Visitor Parking Available", 
    "Corner Property", "Overlooking Park/Garden", "On-Call Maintenance Staff"
  ];

  // No longer slicing here, will do it conditionally in the map
  // const displayedLeftOverview = showAllLeftOverview ? overviewData.left : overviewData.left.slice(0, 3);
  // const displayedRightOverview = showAllRightOverview ? overviewData.right : overviewData.right.slice(0, 3);

  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <ResultsNavBar 
        amenitiesRef={amenitiesRef}
        overviewRef={overviewRef}
        floorPlansRef={floorPlansRef}
        mapRef={mapRef}
      />
      
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-4 sm:py-6 md:py-8 lg:py-12 xl:py-16">
        <div className="grid lg:grid-cols-3 gap-6 md:gap-10 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8 sm:space-y-10 lg:space-y-12">

            {/* Amenities Section */}
            <div ref={amenitiesRef} id="amenities" className="bg-gradient-to-br from-blue-50 to-white p-6 sm:p-8 rounded-2xl shadow-lg border-0 md:border-2 md:border-blue-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-900 rounded-full w-10 h-10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Key Highlights</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {highlights.map((highlight, index) => (
                  <div key={index} className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <Check className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-900 font-medium">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Overview Section */}
            <div ref={overviewRef} id="overview" className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border-0 md:border md:border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="inline-flex items-center bg-blue-900 text-white px-5 py-2.5 rounded-full">
                  <span className="text-sm sm:text-base font-semibold">Overview</span>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {overviewData.left.map((item, index) => (
                    <div 
                      key={index} 
                      className={`flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white shadow-sm hover:shadow-md transition-all border-0 md:border md:border-gray-100 ${!showAllLeftOverview && index >= 3 ? 'hidden md:flex' : ''}`}
                    >
                      <Check className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-1">
                        <span className="text-sm text-gray-600 font-medium">{item.label}</span>
                        <span className="text-sm font-bold text-gray-900">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  {overviewData.right.map((item, index) => (
                    <div 
                      key={index} 
                      className={`flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white shadow-sm hover:shadow-md transition-all border-0 md:border md:border-gray-100 ${!showAllRightOverview && index >= 3 ? 'hidden md:flex' : ''}`}
                    >
                      <Check className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-1">
                        <span className="text-sm text-gray-600 font-medium">{item.label}</span>
                        <span className="text-sm font-bold text-gray-900">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {(overviewData.left.length > 3 || overviewData.right.length > 3) && (
                <div className="md:hidden mt-6 text-center">
                  <button
                    onClick={() => {
                      setShowAllLeftOverview(!showAllLeftOverview);
                      setShowAllRightOverview(!showAllRightOverview);
                    }}
                    className="text-blue-600 hover:text-blue-800 font-semibold text-sm px-6 py-2 rounded-full border-2 border-blue-600 hover:bg-blue-50 transition-all"
                  >
                    {(showAllLeftOverview || showAllRightOverview) ? "View Less" : "View All"}
                  </button>
                </div>
              )}
            </div>

            {/* Description Section */}
            <div className="bg-gradient-to-br from-yellow-50 to-white p-6 sm:p-8 rounded-2xl shadow-lg border-0 md:border-2 md:border-yellow-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="inline-flex items-center bg-blue-900 text-white px-5 py-2.5 rounded-full">
                  <span className="text-sm sm:text-base font-semibold">Description</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border-0 md:border md:border-gray-200">
                <p className="text-base font-bold text-gray-900 mb-3">
                  Address: 001, Ghansoli, Navi Mumbai
                </p>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                  This lovely 2bhk apartment/flat in ghansoli is available for sale in one of navi mumbai's most popular projects, neelkanth palm avenue. This is a east-Facing property. Constructed on a carpet area of 44 sq.M., the flat comprises 3 bedroom(s), 5 bathrooms and 3 balconies.
                </p>
                <button className="text-sm sm:text-base text-blue-600 hover:text-blue-800 font-semibold hover:underline">
                  Read More &gt;&gt;
                </button>
              </div>
            </div>

            {/* Map Section */}
            <div ref={mapRef} id="map-location" className="bg-gradient-to-br from-green-50 to-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-lg border-0 md:border-2 md:border-green-100">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Map and Location</h2>
              <div className="mb-4 sm:mb-6 rounded-xl overflow-hidden shadow-md border-0 md:border-2 md:border-gray-200">
                <img 
                  src={locationMap} 
                  alt="Neelkanth Palm Avenue Location" 
                  className="w-full h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px] object-cover" 
                />
              </div>
              <div className="bg-white p-4 sm:p-5 rounded-xl border-0 md:border md:border-gray-200">
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  View the overall area-wise assets and valuable insights with our map viewer, and get accurate descriptions, reviews and availability of facilities near this property!
                </p>
              </div>
            </div>
          </div>
          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden">
            {/* Main Property Card */}
            <Card className="bg-blue-900 text-white overflow-hidden rounded-2xl sm:rounded-3xl shadow-lg border-0">
              <CardContent className="p-0">
                <div className="relative group">
                  <img 
                    src={imageSources[currentImageIndex]} 
                    alt="Neelkanth Palm Avenue" 
                    className="w-full h-48 sm:h-64 object-cover" 
                  />
                  <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
                    <span className="bg-black/50 text-white text-xs px-2 py-1 rounded">Add to MyList</span>
                  </div>
                </div>
                <div className="p-3 sm:p-4 md:p-5 lg:p-6 space-y-2 sm:space-y-3 md:space-y-4">
                  <div>
                    <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-white leading-tight mb-2">Neelkanth Palm Avenue</h3>
                    <p className="text-xs sm:text-sm text-white/90 mb-2 sm:mb-3 md:mb-4">One line motto | Extra detail.</p>
                  </div>
                  <p className="text-xs sm:text-sm text-white leading-relaxed break-words">
                    An elegant blend of modern architecture and nature-inspired living. This premium residential project offers spacious 2, 3 & 4 BHK apartments ranging from 950 to 1800 sq. ft., designed to maximize light, ventilation, and comfort.
                  </p>
                  <div className="space-y-2 sm:space-y-3 pt-2">
                    <Button className="w-full bg-yellow-400 text-blue-900 hover:bg-yellow-500 text-xs sm:text-sm px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-full font-semibold shadow-lg">Add to My List</Button>
                    <Button className="w-full bg-yellow-400 text-blue-900 hover:bg-yellow-500 text-xs sm:text-sm px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-full font-semibold shadow-lg">Browse Nearby Listings</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Related Property Cards */}
            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-0 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 max-w-full overflow-hidden">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
                  <div className="w-16 h-14 sm:w-20 sm:h-16 md:w-24 md:h-18 lg:w-20 lg:h-16 rounded-xl overflow-hidden flex-shrink-0">
                    <img src="/Pimg9.jpg" alt="Property" className="w-full h-full object-cover"/>
                  </div>
                  <div className="flex-1 overflow-hidden lg:overflow-visible">
                    <h2 className="text-xs sm:text-sm lg:text-sm font-bold text-gray-900 truncate lg:whitespace-normal">The Oberoma</h2>
                    <p className="text-xs sm:text-sm lg:text-xs text-gray-700 truncate">Build creative, Serve Creative</p>
                    <p className="text-xs text-gray-600 truncate">123 Cities | 23 Projects | 14 New</p>
                  </div>
                  <button className="text-xs sm:text-sm font-semibold text-blue-600 hover:underline whitespace-nowrap flex-shrink-0">View &gt;</button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-0 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 max-w-full overflow-hidden">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
                  <div className="w-16 h-14 sm:w-20 sm:h-16 md:w-24 md:h-18 lg:w-20 lg:h-16 rounded-xl overflow-hidden flex-shrink-0">
                    <img src="/Pimg9.jpg" alt="Property" className="w-full h-full object-cover"/>
                  </div>
                  <div className="flex-1 overflow-hidden lg:overflow-visible">
                    <h2 className="text-xs sm:text-sm lg:text-sm font-bold text-gray-900 truncate lg:whitespace-normal">The Oberoma TWO</h2>
                    <p className="text-xs sm:text-sm lg:text-xs text-gray-700 truncate">Build creative, Serve Creative</p>
                    <p className="text-xs text-gray-600 truncate">123 Cities | 23 Projects | 14 New</p>
                  </div>
                  <button className="text-xs sm:text-sm font-semibold text-blue-600 hover:underline whitespace-nowrap flex-shrink-0">View &gt;</button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-0 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 max-w-full overflow-hidden">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
                  <div className="w-16 h-14 sm:w-20 sm:h-16 md:w-24 md:h-18 lg:w-20 lg:h-16 rounded-xl overflow-hidden flex-shrink-0">
                    <img src="/Pimg9.jpg" alt="Property" className="w-full h-full object-cover"/>
                  </div>
                  <div className="flex-1 overflow-hidden lg:overflow-visible">
                    <h2 className="text-xs sm:text-sm lg:text-sm font-bold text-gray-900 truncate lg:whitespace-normal">The Oberoma THREE</h2>
                    <p className="text-xs sm:text-sm lg:text-xs text-gray-700 truncate">Build creative, Serve Creative</p>
                    <p className="text-xs text-gray-600 truncate">123 Cities | 23 Projects | 14 New</p>
                  </div>
                  <button className="text-xs sm:text-sm font-semibold text-blue-600 hover:underline whitespace-nowrap flex-shrink-0">View &gt;</button>
                </div>
              </CardContent>
            </Card>

            {/* Schedule Home Tour Card */}
            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-0 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 max-w-full overflow-hidden">
              <CardContent className="p-3 sm:p-4 md:p-6 space-y-2 sm:space-y-3 md:space-y-4">
                <h3 className="text-xs sm:text-sm md:text-lg font-bold text-gray-900">Schedule Home Tour</h3>
                <div className="space-y-2 sm:space-y-3">
                  <Button className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-blue-900 hover:from-yellow-500 hover:to-yellow-600 rounded-full font-semibold py-2 sm:py-3 text-xs sm:text-sm shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200">View 3D Floor Plan (coming soon!)</Button>
                  <Button className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-blue-900 hover:from-yellow-500 hover:to-yellow-600 rounded-full font-semibold py-2 sm:py-3 text-xs sm:text-sm shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200">Request Visit</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MainContentSection;