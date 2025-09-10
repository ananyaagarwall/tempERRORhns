import React from "react";
import { Menu, Home, ArrowLeft, Heart, Star, Shield, ArrowRight, Check, User, Building, MapPin, DollarSign, Clock } from "lucide-react";
import companyLogo from "../../assets/company-logo.png";
import propertyHero from "../../assets/property-hero.jpg";
import floorPlan2BHK from "../../assets/floor-plan-2bhk.jpg";
import floorPlan3BHK from "../../assets/floor-plan-3bhk.jpg";
import floorPlan4BHK from "../../assets/floor-plan-4bhk.jpg";
import locationMap from "../../assets/location-map.jpg";
import FooterNavBar from '../LandingPage/FooterNavBar';

// ==================== UI COMPONENTS ====================
const Button = ({ variant = "default", size = "default", className = "", children, ...props }) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    outline: "border border-input hover:bg-accent hover:text-accent-foreground"
  };
  const sizes = {
    default: "h-10 py-2 px-4",
    icon: "h-10 w-10"
  };
  
  return (
    <button className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Badge = ({ variant = "default", className = "", children }) => {
  const baseClasses = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  const variants = {
    default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
    outline: "text-foreground"
  };
  
  return (
    <div className={`${baseClasses} ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};

const Card = ({ className = "", children }) => {
  return (
    <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>
      {children}
    </div>
  );
};

const CardContent = ({ className = "", children }) => {
  return (
    <div className={`p-6 pt-0 ${className}`}>
      {children}
    </div>
  );
};

// ==================== NAVIGATION COMPONENT ====================
const ResultsNavBar = ({ overviewRef, floorPlansRef, amenitiesRef, mapRef }) => {
  const navRef = React.useRef(null);
  const [isSticky, setIsSticky] = React.useState(false);
  const [navbarTop, setNavbarTop] = React.useState(0);

  React.useEffect(() => {
    const navbar = navRef.current;
    if (!navbar) return;

    const initialTop = navbar.offsetTop;
    setNavbarTop(initialTop);

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      if (scrollTop >= initialTop) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToSection = (targetRef) => {
    if (!targetRef?.current) return;
    
    const navHeight = navRef.current ? navRef.current.getBoundingClientRect().height : 0;
    const elementTop = targetRef.current.getBoundingClientRect().top;
    const offsetPosition = elementTop + window.pageYOffset - navHeight - 16;
    
    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth"
    });
  };

  const scrollToReadMore = () => {
    const element = document.getElementById('read-more');
    if (!element) return;
    
    const navHeight = navRef.current ? navRef.current.getBoundingClientRect().height : 0;
    const elementTop = element.getBoundingClientRect().top;
    const offsetPosition = elementTop + window.pageYOffset - navHeight - 16;
    
    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth"
    });
  };

  return (
    <>
      {isSticky && (
        <div style={{ height: navRef.current?.getBoundingClientRect().height || 0 }} />
      )}
      
      <div ref={navRef} className={`z-40 bg-gray-50 border-b border-gray-200 shadow-sm transition-all duration-200 ${
          isSticky ? 'fixed top-20 left-0 right-0' : 'relative'
        }`}>
        <div className="px-16 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-700">
                <span className="text-sm font-medium">Results for your search</span>
                <ArrowRight className="w-4 h-4 text-gray-600" />
              </div>
              
              

            </div>
            
            <div className="flex items-center gap-8">
              <button onClick={() => scrollToSection(overviewRef)} className="text-blue-900 font-semibold text-sm hover:text-blue-700 transition-colors">
                Overview
              </button>
              <div className="w-px h-4 bg-gray-300"></div>
              <button onClick={() => scrollToSection(floorPlansRef)} className="text-gray-600 text-sm hover:text-gray-900 transition-colors">
                Floor Plans
              </button>
              <div className="w-px h-4 bg-gray-300"></div>
              <button onClick={() => scrollToSection(amenitiesRef)} className="text-gray-600 text-sm hover:text-gray-900 transition-colors">
                Amenities
              </button>
              <div className="w-px h-4 bg-gray-300"></div>
              <button onClick={() => scrollToSection(mapRef)} className="text-gray-600 text-sm hover:text-gray-900 transition-colors">
                Map
              </button>
              <div className="w-px h-4 bg-gray-300"></div>
              <button onClick={scrollToReadMore} className="text-gray-600 text-sm hover:text-gray-900 transition-colors">
                Read More
              </button>
            </div>
            
            <div className="flex items-center">
              <button className="w-8 h-8 bg-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors">
              {/*its the left arrow in the results nav bar, removing it is causing trouble for now. so this is basically useless but keeping the elements there in the center.*/}
              </button>
            </div>
        </div>
        </div>
      </div>
    </>
  );
};

// ==================== MAIN COMPONENTS ====================
const PropertyHeader = () => {
  return (
    <header className="relative pt-16">
      <div className="flex items-center justify-between mt-6 px-16">
        <div className="flex items-center gap-2">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>View Builders</span>
            <span>›</span>
            <span>Neelkanth Palm Avenue</span>
            <span>›</span>
            <span className="font-medium text-gray-900">Detail</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Home className="text-gray-600 w-5 h-5" />
          <User className="text-gray-600 w-5 h-5" />
        </div>
      </div>
    </header>
  );
};

const BuilderProfile = () => {
  return (
    <section className="px-16 py-8 border-b border-gray-200">
      <div className="flex items-center gap-8">
        <div className="w-32 h-32 bg-gray-300 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <h2 className="text-3xl font-bold text-gray-900 leading-tight">Builder Full Name</h2>
          <p className="text-xl text-gray-900">One line motto | Extra detail.</p>
          <p className="text-lg text-gray-600">This Property is at 7th Position in builders rankings.</p>
          
        </div>
        <div className="text-right space-y-1">
          <p className="text-lg font-bold text-gray-900">123 Cities | 23 Projects Done | 14 New Projects</p>
          <p className="text-lg text-gray-600 cursor-pointer hover:text-blue-600">Visit this Builder's Profile ›</p>
          <p className="text-lg text-blue-600 font-medium">Established: 1995</p>
        </div>
      </div>
    </section>
  );
};

const PropertyHero = () => {
  const scrollToMap = () => {
    const mapElement = document.getElementById('map-location');
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="px-16 py-8">
      <div className="grid lg:grid-cols-2 gap-12 items-start">
        {/* Property Image */}
        <div className="relative">
          <img 
            src={propertyHero} 
            alt="Neelkanth Palm Avenue" 
            className="w-full h-[500px] object-cover rounded-lg" 
          />
          <div className="absolute top-4 left-4">
            <div className="w-10 h-10 bg-black/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Heart className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="absolute top-4 right-4 bg-yellow-400 px-3 py-1 rounded-lg flex items-center gap-1">
            <Star className="w-4 h-4 text-gray-900 fill-current" />
            <span className="font-bold text-gray-900">95%</span>
          </div>
        </div>
        
        {/* Property Details */}
        <div className="space-y-6">
          {/* Badges */}
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className="bg-yellow-100 border-yellow-300 text-gray-900 px-3 py-1 rounded-full">Home</Badge>
            <Badge variant="outline" className="bg-yellow-100 border-yellow-300 text-gray-900 px-3 py-1 rounded-full">OC Verified</Badge>
            <Badge variant="outline" className="bg-yellow-100 border-yellow-300 text-gray-900 px-3 py-1 rounded-full">CC Verified</Badge>
            <Badge variant="outline" className="bg-yellow-100 border-yellow-300 text-gray-900 px-3 py-1 rounded-full">RERA Verified</Badge>
            <Badge variant="outline" className="bg-yellow-100 border-yellow-300 text-gray-900 px-3 py-1 rounded-full">2-4 BHK</Badge>
          </div>
          
          {/* Title and Address */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">Neelkanth Palm Avenue</h1>
            <div className="space-y-2">
              <p 
                className="text-lg text-gray-600 cursor-pointer hover:text-blue-600 transition-colors" 
                onClick={scrollToMap}
              >
                📍 Neelkanth Palm Avenue, Ghansoli, Navi Mumbai
              </p>
              <p className="text-2xl font-bold text-green-600">₹45 Lakh - ₹1.2 Cr</p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50 rounded-full px-6">
              Add to My List
            </Button>
            <Button className="bg-yellow-400 text-gray-900 hover:bg-yellow-500 rounded-full px-6">
              Request Visit
            </Button>
          </div>
        

                {/* Property Detail Boxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                {/* Carpet Area Box */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 002-2v-2" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">Carpet Area</h3>
                      <p className="text-xs text-gray-500 mb-2">Upto 2 L</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-gray-900">685.3 sq.ft. to</p>
                    <p className="text-lg font-bold text-gray-900">715.5 sq.ft.</p>
                  </div>
                  <button className="text-blue-600 text-xs font-medium mt-2 hover:underline">
                    View more rates →
                  </button>
                </div>

                {/* Pricing Box */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">Pricing</h3>
                      <p className="text-xs text-gray-500 mb-2">Upto 2 L</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-gray-900">1.56 Cr +</p>
                    <p className="text-sm text-gray-600">[Negotiable]</p>
                  </div>
                  <button className="text-blue-600 text-xs font-medium mt-2 hover:underline">
                    View detailed pricing →
                  </button>
                </div>

                {/* Highlights Box */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">Highlights</h3>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                      <span className="text-sm text-gray-700">Railway station</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                      <span className="text-sm text-gray-700">Hospital</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                      <span className="text-sm text-gray-700">Schools</span>
                    </div>
                  </div>
                  <button className="text-blue-600 text-xs font-medium mt-2 hover:underline">
                    View more nearby details →
                  </button>
                </div>

                {/* Extra Charges Box */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">Extra Charges</h3>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                      <span className="text-sm text-gray-700">Application Fee</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                      <span className="text-sm text-gray-700">Parking Fee</span>
                    </div>
                  </div>
                  <button className="text-blue-600 text-xs font-medium mt-2 hover:underline">
                    View detailed breakdown →
                  </button>
                </div>
              </div>

      </div>

      </div>
    </section>
  );
};

const ExistingFloorPlansSection = () => {
  const [activeBHK, setActiveBHK] = React.useState("3bhk");

  const floorPlanDetails = {
    "2bhk": {
      title: "2 BHK Floor Plan",
      builtUpArea: "950 sq. ft (88.3 m²)",
      ceilingHeight: "2.8 – 2.9 meters (approx. 9.2 ft)",
      mainDoorFacing: "North/North-East",
      modularKitchen: "With Sitting area"
    },
    "3bhk": {
      title: "3 BHK Floor Plan",
      builtUpArea: "1260 sq. ft (117.1 m²)",
      ceilingHeight: "2.9 – 3.0 meters (approx. 9.5 ft)",
      mainDoorFacing: "East/North-East",
      modularKitchen: "With Sitting area"
    },
    "4bhk": {
      title: "4 BHK Floor Plan",
      builtUpArea: "1580 sq. ft (146.8 m²)",
      ceilingHeight: "3.0 – 3.1 meters (approx. 9.8 ft)",
      mainDoorFacing: "South-East/South",
      modularKitchen: "With Sitting area"
    }
  };

  const getFloorPlanImage = (bhk) => {
    const images = {
      "2bhk": floorPlan2BHK,
      "3bhk": floorPlan3BHK,
      "4bhk": floorPlan4BHK
    };
    return images[bhk] || floorPlan3BHK;
  };

  return (
    <section id="floor-plans" className="w-[90%] mx-auto px-8 py-16 bg-white" >
      {/* Section Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-0.5 bg-gray-400" />
        <h2 className="text-lg font-medium text-gray-900">Floor Plans</h2>
      </div>
      
      {/* BHK Selector */}
      <div className="flex justify-center mb-12">
        <div className="flex bg-gray-100 rounded-full p-1">
          {Object.keys(floorPlanDetails).map((bhk) => (
            <button 
              key={bhk}
              onClick={() => setActiveBHK(bhk)} 
              className={`px-8 py-3 text-lg font-semibold rounded-full transition-all ${
                activeBHK === bhk ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
              }`}
            >
              {bhk.replace('bhk', ' BHK').toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      
      {/* Floor Plan Card */}
      <Card className="max-w-7xl mx-auto shadow-lg border border-gray-200">
        <CardContent className="p-0">
          <div className="grid lg:grid-cols-2 gap-0">
            {/* Details Section */}
            <div className="p-8 space-y-6">
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-1">
                  {floorPlanDetails[activeBHK].title}
                </h3>
                <div className="w-16 h-1 bg-blue-600 mb-6" />
              </div>
              
              <div className="space-y-6">
                <div className="space-y-1">
                  <p className="text-lg text-gray-600">Built-up Area</p>
                  <p className="text-lg text-gray-900 font-medium">
                    {floorPlanDetails[activeBHK].builtUpArea}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-lg text-gray-600">Ceiling Height</p>
                  <p className="text-lg text-gray-900 font-medium">
                    {floorPlanDetails[activeBHK].ceilingHeight}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-lg text-gray-600">Main Door Facing</p>
                  <p className="text-lg text-gray-900 font-medium">
                    {floorPlanDetails[activeBHK].mainDoorFacing}
                  </p>
                </div>
                <div className="space-y-1 flex items-center gap-2">
                  <div>
                    <p className="text-lg text-gray-600">Modular Kitchen</p>
                    <p className="text-lg text-gray-900 font-medium">
                      {floorPlanDetails[activeBHK].modularKitchen}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
              
              <p className="text-lg text-gray-900 cursor-pointer hover:text-blue-600 font-medium">
                View Room-Wise Measurements &gt;
              </p>
              <Button className="w-50 bg-gradient-to-r from-yellow-400 to-yellow-500 text-blue-900 hover:from-yellow-500 hover:to-yellow-600 rounded-full font-semibold py-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200">
                   Add to MyList
              </Button>


            </div>
            
            {/* Image Section */}
            <div className="relative bg-blue-900 rounded-lg overflow-hidden">
              <img 
                src={getFloorPlanImage(activeBHK)} 
                alt={`${activeBHK.toUpperCase()} Floor Plan 3D View`} 
                className="w-full h-full object-cover" 
              />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 space-y-2">
                <div className="w-16 h-16 bg-blue-900 rounded-l-lg overflow-hidden border-2 border-blue-900">
                  <img src={floorPlan2BHK} alt="View 1" className="w-full h-full object-cover" />
                </div>
                <div className="w-4 h-16 bg-blue-900 rounded-l-lg" />
                <div className="w-4 h-16 bg-blue-900 rounded-l-lg" />
              </div>
              
            </div>
          </div>
        </CardContent>
      </Card>
      
    </section>
  );
};

const MainContentSection = () => {
  const overviewRef = React.useRef(null);
  const floorPlansRef = React.useRef(null);
  const amenitiesRef = React.useRef(null);
  const mapRef = React.useRef(null);

  // Sidebar image carousel state and handlers
  const imageSources = React.useMemo(() => [propertyHero], []);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const navigateImage = (direction) => {
    if (imageSources.length === 0) return;
    setCurrentImageIndex((prev) => {
      if (direction === 'next') return (prev + 1) % imageSources.length;
      if (direction === 'prev') return (prev - 1 + imageSources.length) % imageSources.length;
      return prev;
    });
  };

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

  return (
    <section className="bg-white">
      <ResultsNavBar 
        amenitiesRef={amenitiesRef}
        overviewRef={overviewRef}
        floorPlansRef={floorPlansRef}
        mapRef={mapRef}
      />
      
      <div className="w-[90%] mx-auto px-8 py-16">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">

            {/* Amenities Section */}
            <div ref={amenitiesRef} id="amenities" className="grid grid-cols-4 gap-6">
              <div className="col-span-1">
                <div className="bg-blue-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <p className="text-center text-sm font-medium text-gray-900">
                  Key Highlights<br/>of this Property
                </p>
              </div>
              <div className="col-span-3">
                <div className="grid grid-cols-2 gap-4">
                  {highlights.map((highlight, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-yellow-500" />
                      <span className="text-sm text-gray-900">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Overview Section */}
            <div ref={overviewRef} id="overview" className="space-y-6">
              <div className="inline-flex items-center bg-blue-900 text-white px-4 py-2 rounded-full">
                <span className="text-sm font-medium">Overview</span>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  {overviewData.left.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                      <div className="flex justify-between items-center w-full">
                        <span className="text-sm text-gray-600">{item.label}</span>
                        <span className="text-sm font-bold text-gray-900">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  {overviewData.right.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                      <div className="flex justify-between items-center w-full">
                        <span className="text-sm text-gray-600">{item.label}</span>
                        <span className="text-sm font-bold text-gray-900">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            

            {/* Description Section */}
            <div className="space-y-6">
              <div className="inline-flex items-center bg-blue-900 text-white px-4 py-2 rounded-full">
                <span className="text-sm font-medium">Description</span>
              </div>
              <div>
                <p className="text-base font-bold text-gray-900 mb-2">
                  Address: 001, Ghansoli, Navi Mumbai
                </p>
                <p className="text-base text-gray-700 leading-relaxed mb-4">
                  This lovely 2bhk apartment/flat in ghansoli is available for sale in one of navi mumbai's most popular projects, neelkanth palm avenue. This is a east-Facing property. Constructed on a carpet area of 44 sq.M., the flat comprises 3 bedroom(s), 5 bathrooms and 3 balconies.
                </p>
                <button className="text-base text-blue-600 hover:text-blue-800 font-medium">
                  Read More &gt;&gt;
                </button>
              </div>
            </div>

            {/* Map Section */}
            <div className="space-y-6">
              <h2 ref={mapRef} id="map-location" className="text-2xl font-semibold text-gray-900">
                Map and Location
              </h2>
              <div className="mb-6">
                <img 
                  src={locationMap} 
                  alt="Neelkanth Palm Avenue Location" 
                  className="w-full h-[400px] object-cover rounded-lg" 
                />
              </div>
              <p className="text-base text-gray-700">
                View the overall area-wise assets and valuable insights with our map viewer, and get accurate descriptions, reviews and availability of facilities near this property!
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Main Property Card */}
            <Card className="bg-blue-900 text-white overflow-hidden rounded-3xl shadow-lg border-0">
              <CardContent className="p-0">
                <div className="relative group">
                  <img 
                    src={imageSources[currentImageIndex]} 
                    alt="Neelkanth Palm Avenue" 
                    className="w-full h-64 object-cover transition-opacity duration-200" 
                    id="property-image"
                  />
                  
                  {/* Add to MyList Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="bg-black/50 text-white text-xs px-2 py-1 rounded">Add to MyList</span>
                  </div>
                  
                  {/* Navigation Arrows 
                  <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button 
                      onClick={() => navigateImage('prev')}
                      className="w-8 h-8 bg-black/30 rounded-full flex items-center justify-center hover:bg-black/50 transition-colors">
                      <ArrowLeft className="w-4 h-4 text-white" />
                    </button>
                    <button 
                      onClick={() => navigateImage('next')}
                      className="w-8 h-8 bg-black/30 rounded-full flex items-center justify-center hover:bg-black/50 transition-colors">
                      <ArrowRight className="w-4 h-4 text-white" />
                    </button>
                  </div>*/}
                  
                <div className="p-6 space-y-4">
                  <div>
                      <h3 className="text-3xl font-bold text-white leading-tight mb-2">
                        Neelkanth Palm Avenue
                      </h3>
                    <p className="text-sm text-white/90 mb-4">One line motto | Extra detail.</p>
                  </div>
                    
                  <div>
                      <p className="text-sm text-white leading-relaxed">
                        An elegant blend of modern architecture and nature-inspired living. This premium residential project offers spacious 2, 3 & 4 BHK apartments ranging from 950 to 1800 sq. ft., designed to maximize light, ventilation, and comfort.
                      </p>
                  </div>
                    
                  <div className="space-y-3 pt-2">
                      <Button className="w-full bg-yellow-400 text-blue-900 hover:bg-yellow-500 text-sm px-6 py-3 rounded-full font-semibold shadow-lg ">
                        Add to My List
                      </Button>
                      <Button className="w-full bg-yellow-400 text-blue-900 hover:bg-yellow-500 text-sm px-6 py-3 rounded-full font-semibold shadow-lg">
                        Browse Nearby Listings
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* property recommendation here */}
            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-0 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6 space-y-4 h-70 flex items-center justify-center">
              
                    <div className="w-28 h-20 rounded-xl overflow-hidden flex-shrink-0">
                      <img 
                        src="/Pimg9.jpg" 
                        alt="Property" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Text Content */}
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-gray-900">The Oberoma</h2>
                      <p className="text-sm text-gray-700">Build creative, Serve Creative</p>
                      <p className="text-xs text-gray-600">123 Cities | 23 Projects | 14 New</p>
                    </div>
                    {/* CTA */}
                    <button className="text-sm font-semibold text-blue-600 hover:underline whitespace-nowrap">
                      View Project &gt;
                    </button>

                    
                
              </CardContent>
            </Card>
            
            {/* Request Home Tour Card */}
            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-0 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Schedule Home Tour</h3>

                <div className="space-y-3">
                  <Button className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-blue-900 hover:from-yellow-500 hover:to-yellow-600 rounded-full font-semibold py-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200">
                    View 3D Floor Plan (coming soon!)
                  </Button>
                  <Button className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-blue-900 hover:from-yellow-500 hover:to-yellow-600 rounded-full font-semibold py-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200">
                    Request Visit
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </section>
  );
};

const ReadMoreAboutProperty = () => {
  const [expandedCard, setExpandedCard] = React.useState(null);
  const [hoveredCard, setHoveredCard] = React.useState(null);

  const propertySections = [
    {
      id: "legal-financial",
      title: "Legal & Financial Trust",
      cards: [
        {
          id: "title-clearance",
          title: "Title Clearance & Due Diligence",
          subtitle: "Occupancy & Completion Certificate",
          location: "View in detail charts",
          description: "Comprehensive title verification and legal due diligence process ensuring clear property ownership. Includes occupancy certificate validation and completion certificate verification for regulatory compliance.",
          documentTitle: "Legal Documents",
          documentItems: ["Title Deed", "Occupancy Certificate", "Completion Certificate", "RERA Registration"]
        },
        {
          id: "bank-loan",
          title: "Bank Loan Approval",
          subtitle: "Which banks and what amount",
          location: "Confidential info is available only for the users..",
          description: "Detailed information about approved banks and loan amounts for this property. Includes interest rates, eligibility criteria, and documentation requirements for home loan applications.",
          documentTitle: "Loan Documents",
          documentItems: ["Bank Approval Letter", "Interest Rate Details", "Eligibility Criteria", "Document Checklist"]
        }
      ]
    },
    {
      id: "lifestyle",
      title: "Lifestyle & Liveability Insights",
      cards: [
        {
          id: "neighbourhood",
          title: "Neighbourhood",
          subtitle: "View your neighbourhood details",
          location: "Information regarding society and protocols",
          description: "Comprehensive neighborhood analysis including local amenities, community demographics, safety ratings, and quality of life indicators. Perfect for both full-time residents and remote workers.",
          documentTitle: "Neighborhood Guide",
          documentItems: ["Local Amenities", "Safety Ratings", "Community Profile", "Quality of Life Index"]
        },
        {
          id: "nearby-essentials",
          title: "Nearby Essentials",
          subtitle: "Hospitals, Schools, Emergency Services",
          location: "View plans, VIP passes and insurances provided.",
          description: "Essential services and facilities in the vicinity including healthcare, education, shopping, and transportation options. Detailed mapping of all nearby conveniences.",
          documentTitle: "Essential Services",
          documentItems: ["Healthcare Facilities", "Educational Institutions", "Shopping Centers", "Transportation"]
        }
      ]
    },
    {
      id: "accounts-finance",
      title: "Accounts and Finance",
      cards: [
        {
          id: "senior-advisor-1",
          title: "Senior Advisor",
          subtitle: "Full Time • Remote available",
          location: "Available for you",
          description: "Expert financial advisory services for property investment and management. Includes investment analysis, tax planning, and portfolio optimization strategies.",
          documentTitle: "Financial Advisory",
          documentItems: ["Investment Analysis", "Tax Planning", "Portfolio Strategy", "Risk Assessment"]
        },
        {
          id: "senior-advisor-2",
          title: "Senior Advisor",
          subtitle: "Full Time • Remote available",
          location: "Available for you",
          description: "Comprehensive financial planning and advisory services tailored to real estate investments. Expert guidance on property financing and investment strategies.",
          documentTitle: "Financial Planning",
          documentItems: ["Financial Planning", "Investment Strategy", "Risk Management", "Tax Optimization"]
        }
      ]
    }
  ];

  const toggleCard = (cardId) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  return (
    <div id="read-more" className="w-[90%] mx-auto px-8 py-16">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-0.5 bg-gray-400" />
        <h2 className="text-lg font-medium text-gray-900">View More Details</h2>
      </div>
      
      <div className="space-y-10">

        {propertySections.map((section) => (
          <div key={section.id} className="space-y-10">
            {/* Section Header */}
            <div className="flex items-center gap-4 group">
              <div className="w-16 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 group-hover:w-20" />
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{section.title}</h3>
            </div>
            
            {/* Cards Grid */}
            <div className="grid lg:grid-cols-2 gap-8">
              {section.cards.map((card) => (
                <div 
                  key={card.id} 
                  className={`group relative bg-white rounded-2xl border transition-all duration-500 cursor-pointer overflow-hidden ${
                    hoveredCard === card.id 
                      ? 'shadow-2xl border-blue-200 transform -translate-y-2 scale-[1.02]' 
                      : 'shadow-lg border-gray-100 hover:shadow-xl hover:border-gray-200'
                  }`} 
                  onMouseEnter={() => setHoveredCard(card.id)} 
                  onMouseLeave={() => setHoveredCard(null)} 
                  onClick={() => setExpandedCard(expandedCard === card.id ? null : card.id)}
                >
                  <div/>
                  
                  {/* Top Border Accent */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 transform scale-x-0 transition-transform duration-500 origin-left ${
                    hoveredCard === card.id ? 'scale-x-100' : ''
                  }`} />
                  
                  {/* Card Content */}
                  <div className="relative p-8">
                    {/* Header Section */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-start justify-between">
                        <h4 className="text-xl font-bold text-gray-900 leading-tight group-hover:text-blue-900 transition-colors duration-300">
                          {card.title}
                        </h4>
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center transition-all duration-300 ${
                          hoveredCard === card.id ? 'bg-blue-500 rotate-45' : ''
                        }`}>
                          <svg className={`w-3 h-3 transition-colors duration-300 ${
                            hoveredCard === card.id ? 'text-white' : 'text-gray-400'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                      </div>
                      
                      {/*<p className="text-sm font-medium text-gray-600 leading-relaxed">{card.subtitle}</p> */}
                      
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <p className="text-s text-gray-500 font-medium">
                          {card.location}
                        </p>
                      </div>
 
                    </div>
 
                    {/* Divider Line with Animation 
                    <div className="relative mb-6">
                      <div className="h-px bg-gray-200" />
                      <div className={`absolute top-0 left-0 h-px bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700 ${
                        hoveredCard === card.id ? 'w-full' : 'w-0'
                      }`} />
                    </div>*/}
                    
                    {/* Expanded Content */}
                    <div className={`transition-all duration-500 ease-in-out ${
                      expandedCard === card.id 
                        ? 'max-h-80 opacity-100' 
                        : 'max-h-0 opacity-0 overflow-hidden'
                    }`}>
                      <div className="space-y-6">
                        <p className="text-gray-700 leading-relaxed text-sm">
                          {card.description}
                        </p>
                        
                        {/* Documents Section */}
                        <div className="bg-gradient-to-br from-gray-50 to-blue-50/50 rounded-xl p-6 border border-gray-100">
                          <h5 className="font-bold text-gray-900 mb-4 text-sm">
                            {card.documentTitle}
                          </h5>
                          <div className="grid grid-cols-2 gap-3 mb-6">
                            {card.documentItems.map((item, index) => (
                              <div 
                                key={index} 
                                className="flex items-center gap-3 text-sm text-gray-700 bg-white/70 rounded-lg p-3 hover:bg-white transition-colors duration-200"
                              >
                                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex-shrink-0" />
                                <span className="font-medium">{item}</span>
                              </div>
                            ))}
                          </div>
                          <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl">
                            View Documents
                            <svg className="w-4 h-4 ml-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {/* Load More Button */}
        <div className="flex justify-center mt-12">
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            Load More
          </button>
        </div>
      </div>
    </div>
  );
};

const PropertyFooter = () => {
  return (
    <footer className="px-16 py-12">
      <div className="bg-gray-900 rounded-3xl p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-6 gap-4 h-full">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="bg-white rounded-full w-12 h-12" />
            ))}
          </div>
        </div>
        <div className="relative z-10">
          <h2 className="text-4xl font-semibold text-white leading-tight mb-8 max-w-2xl mx-auto">
            Look and find more, browsing with HouseNSeek!
          </h2>
          <div className="flex justify-center space-x-8">
            <div className="text-white/10 text-6xl font-bold">HOUSE</div>
            <div className="text-white/10 text-6xl font-bold">N</div>
            <div className="text-white/10 text-6xl font-bold">SEEK</div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// ==================== MAIN APP COMPONENT ====================
export const PropertyListingApp = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <FooterNavBar />
      </div>
      
      {/* Main Content */}
      <PropertyHeader />
      <BuilderProfile />
      <PropertyHero />
      <MainContentSection />
      <ExistingFloorPlansSection />
      <ReadMoreAboutProperty />
      <PropertyFooter />
    </div>
  );
};

export default PropertyListingApp; 