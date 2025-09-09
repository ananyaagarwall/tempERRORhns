import React from "react";
import { Menu, Home, ArrowLeft, Heart, Star, Shield, ArrowRight, Check, User, Building, MapPin, DollarSign, Clock } from "lucide-react";
import companyLogo from "../../assets/company-logo.png";
import propertyHero from "../../assets/property-hero.jpg";
import floorPlan2BHK from "../../assets/floor-plan-2bhk.jpg";
import floorPlan3BHK from "../../assets/floor-plan-3bhk.jpg";
import floorPlan4BHK from "../../assets/floor-plan-4bhk.jpg";
import locationMap from "../../assets/location-map.jpg";

// UI Components
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

// Main Components
const PropertyHeader = () => {
  return (
    <header className="relative">
      <div className="bg-blue-100 h-20 w-full relative">
        <div className="absolute left-16 top-6">
          <h1 className="text-2xl font-bold text-blue-900">HousenSeek</h1>
        </div>
        <nav className="flex items-center justify-center gap-20 pt-6">
          <Button variant="ghost" className="text-blue-900 hover:text-blue-700 text-lg font-medium">Search</Button>
          <Button variant="ghost" className="text-blue-900 hover:text-blue-700 text-lg font-medium">Home</Button>
          <Button variant="ghost" className="text-blue-900 hover:text-blue-700 text-lg font-medium">Builders</Button>
          <Button variant="ghost" className="text-blue-900 hover:text-blue-700 text-lg font-medium">Blogs</Button>
        </nav>
        <div className="absolute right-8 top-6 flex items-center gap-4">
          <Home className="text-blue-900 w-6 h-6" />
          <User className="text-blue-900 w-6 h-6" />
          <Menu className="text-blue-900 w-6 h-6" />
        </div>
      </div>
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
        </div>
      </div>
    </section>
  );
};

const PropertyHero = () => {
  return (
    <section className="px-16 py-8">
      <div className="grid lg:grid-cols-2 gap-12 items-start">
        <div className="relative">
          <img src={propertyHero} alt="Neelkanth Palm Avenue" className="w-full h-[400px] object-cover rounded-lg" />
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
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className="bg-yellow-100 border-yellow-300 text-gray-900 px-3 py-1 rounded-full">Home</Badge>
            <Badge variant="outline" className="bg-yellow-100 border-yellow-300 text-gray-900 px-3 py-1 rounded-full">OC Verified</Badge>
            <Badge variant="outline" className="bg-yellow-100 border-yellow-300 text-gray-900 px-3 py-1 rounded-full">CC Verified</Badge>
            <Badge variant="outline" className="bg-yellow-100 border-yellow-300 text-gray-900 px-3 py-1 rounded-full">RERA Verified</Badge>
            <Badge variant="outline" className="bg-yellow-100 border-yellow-300 text-gray-900 px-3 py-1 rounded-full">2-4 BHK</Badge>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">Neelkanth Palm Avenue</h1>
            <p className="text-lg text-gray-600">Neelkanth Palm Avenue, Ghansoli, Navi Mumbai</p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50 rounded-full px-6">Add to My List</Button>
            <Button className="bg-yellow-400 text-gray-900 hover:bg-yellow-500 rounded-full px-6">Contact Builder</Button>
          </div>
        </div>
      </div>
    </section>
  );
};

const PropertyConfigurations = () => {
  const configurations = [
    {
      id: "2bhk",
      title: "Exclusive 2 bedroom apts",
      image: floorPlan2BHK,
      badge: "2BHK",
      carpetArea: "685-715 sq.ft.",
      features: "Spacious balconies",
      fittings: "Premium fittings from Jaquar & Havells.",
      maintenance: "₹2.5/sq.ft.",
      age: "2 Years old"
    },
    {
      id: "3bhk",
      title: "Elegant 3 bedroom houses",
      image: floorPlan3BHK,
      badge: "3BHK",
      carpetArea: "950–1080 sq.ft.",
      features: "Large living areas",
      fittings: "Premium fittings from Jaquar & Havells.",
      maintenance: "₹3.0/sq.ft.",
      age: "2 Years old"
    },
    {
      id: "4bhk",
      title: "Phrase words for BHKs",
      image: floorPlan4BHK,
      badge: "4BHK",
      carpetArea: "1250–1480 sq.ft.",
      features: "Premium layouts",
      fittings: "Premium fittings from Jaquar & Havells.",
      maintenance: "₹3.5/sq.ft.",
      age: "2 Years old"
    }
  ];

  return (
    <section className="px-16 py-12 bg-white">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-0.5 bg-gray-400" />
        <h2 className="text-lg font-medium text-gray-900">Existing Configurations</h2>
      </div>
      <div className="flex justify-end mb-8">
        <div className="flex bg-gray-100 rounded-full p-1">
          <button className="px-6 py-3 text-lg font-semibold text-gray-600">Search by Building</button>
          <button className="px-6 py-3 text-lg font-semibold text-gray-900 bg-white rounded-full shadow-sm">Search by Rooms</button>
        </div>
      </div>
      <div className="relative">
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide custom-scrollbar">
          {configurations.map((config, index) => (
            <Card key={config.id} className="min-w-[400px] shadow-lg overflow-hidden property-card">
              <div className="relative">
                <div className="absolute top-4 left-4 z-10">
                  <div className="bg-gray-800 px-4 py-1 rounded-full">
                    <span className="text-lg font-semibold text-white">{config.badge}</span>
                  </div>
                </div>
                <img src={config.image} alt={config.title} className="w-full h-60 object-cover" />
              </div>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 leading-7">{config.title}</h3>
                <div className="space-y-2 text-base">
                  <p className="text-gray-600">
                    <span>Carpet Area: </span>
                    <span className="text-gray-900 font-medium">{config.carpetArea}</span>
                    <span> | {config.features}</span>
                  </p>
                  <p className="text-gray-600">{config.fittings}</p>
                  <p className="text-gray-600">
                    <span>{config.age} | Maintenance: </span>
                    <span className="text-gray-900 font-medium">{config.maintenance}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" size="icon" className="w-12 h-12 rounded-full border-gray-300">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Button>
          <Button variant="outline" size="icon" className="w-12 h-12 rounded-full border-gray-300">
            <ArrowRight className="w-5 h-5 text-gray-600" />
          </Button>
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
    switch (bhk) {
      case "2bhk": return floorPlan2BHK;
      case "3bhk": return floorPlan3BHK;
      case "4bhk": return floorPlan4BHK;
      default: return floorPlan3BHK;
    }
  };

  return (
    <section className="px-16 py-12 bg-white">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-0.5 bg-gray-400" />
        <h2 className="text-lg font-medium text-gray-900">Existing Floor Plans</h2>
      </div>
      <div className="flex justify-center mb-12">
        <div className="flex bg-gray-100 rounded-full p-1">
          <button onClick={() => setActiveBHK("2bhk")} className={`px-8 py-3 text-lg font-semibold rounded-full transition-all ${activeBHK === "2bhk" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"}`}>2 BHK</button>
          <button onClick={() => setActiveBHK("3bhk")} className={`px-8 py-3 text-lg font-semibold rounded-full transition-all ${activeBHK === "3bhk" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"}`}>3 BHK</button>
          <button onClick={() => setActiveBHK("4bhk")} className={`px-8 py-3 text-lg font-semibold rounded-full transition-all ${activeBHK === "4bhk" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"}`}>4 BHK</button>
        </div>
      </div>
      <Card className="max-w-7xl mx-auto shadow-lg border border-gray-200">
        <CardContent className="p-0">
          <div className="grid lg:grid-cols-2 gap-0">
            <div className="p-8 space-y-6">
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-1">{floorPlanDetails[activeBHK].title}</h3>
                <div className="w-16 h-1 bg-blue-600 mb-6" />
              </div>
              <div className="space-y-6">
                <div className="space-y-1">
                  <p className="text-lg text-gray-600">Built-up Area</p>
                  <p className="text-lg text-gray-900 font-medium">{floorPlanDetails[activeBHK].builtUpArea}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-lg text-gray-600">Ceiling Height</p>
                  <p className="text-lg text-gray-900 font-medium">{floorPlanDetails[activeBHK].ceilingHeight}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-lg text-gray-600">Main Door Facing</p>
                  <p className="text-lg text-gray-900 font-medium">{floorPlanDetails[activeBHK].mainDoorFacing}</p>
                </div>
                <div className="space-y-1 flex items-center gap-2">
                  <div>
                    <p className="text-lg text-gray-600">Modular Kitchen</p>
                    <p className="text-lg text-gray-900 font-medium">{floorPlanDetails[activeBHK].modularKitchen}</p>
                  </div>
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
              <p className="text-lg text-gray-900 cursor-pointer hover:text-blue-600 font-medium">View Room-Wise Measurements &gt;</p>
            </div>
            <div className="relative bg-blue-900 rounded-lg overflow-hidden">
              <img src={getFloorPlanImage(activeBHK)} alt={`${activeBHK.toUpperCase()} Floor Plan 3D View`} className="w-full h-full object-cover" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 space-y-2">
                <div className="w-16 h-16 bg-blue-900 rounded-l-lg overflow-hidden border-2 border-blue-900">
                  <img src={floorPlan2BHK} alt="View 1" className="w-full h-full object-cover" />
                </div>
                <div className="w-4 h-16 bg-blue-900 rounded-l-lg" />
                <div className="w-4 h-16 bg-blue-900 rounded-l-lg" />
              </div>
              <p className="absolute bottom-4 left-4 text-lg text-white cursor-pointer hover:text-yellow-400">View more pictures by room &gt;</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end gap-4 mt-6">
        <Button variant="outline" size="icon" className="w-12 h-12 rounded-full border-gray-300">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Button>
        <Button variant="outline" size="icon" className="w-12 h-12 rounded-full border-gray-300">
          <ArrowRight className="w-5 h-5 text-gray-600" />
        </Button>
      </div>
    </section>
  );
};

const FloorPlansSection = () => {
  return (
    <section className="bg-white">
      <div className="sticky top-0 z-50 bg-gray-50 border-b border-gray-200 shadow-sm">
        <div className="px-16 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-700">
                <span className="text-sm font-medium">Results for 3 BHKs</span>
                <ArrowRight className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors">
                  <ArrowLeft className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <button className="text-blue-900 font-semibold text-sm hover:text-blue-700 transition-colors">Overview</button>
              <div className="w-px h-4 bg-gray-300"></div>
              <button className="text-gray-600 text-sm hover:text-gray-900 transition-colors">Amenities</button>
              <div className="w-px h-4 bg-gray-300"></div>
              <button className="text-gray-600 text-sm hover:text-gray-900 transition-colors">Society</button>
              <div className="w-px h-4 bg-gray-300"></div>
              <button className="text-gray-600 text-sm hover:text-gray-900 transition-colors">Builder Details</button>
              <div className="w-px h-4 bg-gray-300"></div>
              <button className="text-gray-600 text-sm hover:text-gray-900 transition-colors">Society Review</button>
            </div>
            <div className="flex items-center">
              <button className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors">
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="px-16 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-4 gap-6">
              <div className="col-span-1">
                <div className="bg-blue-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <p className="text-center text-sm font-medium text-gray-900">Key Highlights<br/>of this Property</p>
              </div>
              <div className="col-span-3">
                <div className="grid grid-cols-2 gap-4">
                  {["Recently Renovated", "Gated Society", "Visitor Parking Available", "Corner Property", "Overlooking Park/Garden", "On-Call Maintenance Staff"].map((highlight, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-yellow-500" />
                      <span className="text-sm text-gray-900">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="inline-flex items-center bg-blue-900 text-white px-4 py-2 rounded-full">
                <span className="text-sm font-medium">Description</span>
              </div>
              <div>
                <p className="text-base font-bold text-gray-900 mb-2">Address: 001, Ghansoli, Navi Mumbai</p>
                <p className="text-base text-gray-700 leading-relaxed mb-4">This lovely 2bhk apartment/flat in ghansoli is available for sale in one of navi mumbai's most popular projects, neelkanth palm avenue. This is a east-Facing property. Constructed on a carpet area of 44 sq.M., the flat comprises 3 bedroom(s), 5 bathrooms and 3 balconies.</p>
                <button className="text-base text-blue-600 hover:text-blue-800 font-medium">Read More &gt;&gt;</button>
              </div>
            </div>
            <div className="space-y-6">
              <div className="inline-flex items-center bg-blue-900 text-white px-4 py-2 rounded-full">
                <span className="text-sm font-medium">Rental Details</span>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  {[
                    { label: "Property Type", value: "3 BHK Flat" },
                    { label: "Carpet Area", value: "1250 sq.ft." },
                    { label: "Built-up Area", value: "1260 sq. ft. (117.1 m.sq.)" },
                    { label: "Super Built-up Area", value: "1294 sq.ft." },
                    { label: "Price", value: "₹ 75 Lakh" }
                  ].map((item, index) => (
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
                  {[
                    { label: "RERA ID", value: "P51800012345" },
                    { label: "Parking", value: "With extra charges" },
                    { label: "Approved by Authorities", value: "Yes | PMC | BBMP" },
                    { label: "Price per Sq. Ft.", value: "₹8,500" },
                    { label: "Loan Availability", value: "Approved by SBI | HDFC" }
                  ].map((item, index) => (
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
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900">Map and Location</h2>
              <div className="mb-6">
                <img src={locationMap} alt="Neelkanth Palm Avenue Location" className="w-full h-[400px] object-cover rounded-lg" />
              </div>
              <p className="text-base text-gray-700">View the overall area-wise assets and valuable insights with our map viewer, and get accurate descriptions, reviews and availability of facilities near this property!</p>
            </div>
          </div>
          <div className="space-y-6">
            <Card className="bg-blue-900 text-white overflow-hidden rounded-xl shadow-lg border-0">
              <CardContent className="p-0">
                <div className="relative">
                  <img src={propertyHero} alt="Neelkanth Palm Avenue" className="w-full h-48 object-cover" />
                  <div className="absolute inset-0 flex items-center justify-between px-4 opacity-30">
                    <div className="w-8 h-8 bg-black/20 rounded-full flex items-center justify-center">
                      <ArrowLeft className="w-4 h-4 text-white" />
                    </div>
                    <div className="w-8 h-8 bg-black/20 rounded-full flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white leading-tight mb-2">Neelkanth Palm Avenue</h3>
                    <p className="text-sm text-white/90 mb-4">One line motto | Extra detail.</p>
                  </div>
                  <div>
                    <p className="text-sm text-white leading-relaxed">An elegant blend of modern architecture and nature-inspired living. This premium residential project offers spacious 2, 3 & 4 BHK apartments ranging from 950 to 1800 sq. ft., designed to maximize light, ventilation, and comfort.</p>
                  </div>
                  <div className="space-y-3 pt-2">
                    <div className="flex gap-3">
                      <Button className="bg-yellow-400 text-gray-900 hover:bg-yellow-500 text-sm px-6 py-2 rounded-lg font-medium flex-1">Share</Button>
                      <Button className="bg-yellow-400 text-gray-900 hover:bg-yellow-500 text-sm px-6 py-2 rounded-lg font-medium flex-1">My List</Button>
                    </div>
                    <Button className="w-full bg-yellow-400 text-gray-900 hover:bg-yellow-500 text-sm px-6 py-2 rounded-lg font-medium">Browse Nearby Listings</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-gray-200">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Price Breakdown</h3>
                <div className="text-2xl font-bold text-gray-900">₹8,500 Per Sqm.</div>
                <Button className="w-full bg-yellow-400 text-gray-900 hover:bg-yellow-500 rounded-full">View Price Breakdown</Button>
              </CardContent>
            </Card>
            <Card className="border border-gray-200">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Request Home Tour</h3>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 bg-white text-gray-900 border-gray-300">In Person</Button>
                  <Button variant="outline" className="flex-1 text-gray-600 border-gray-300">Virtual</Button>
                </div>
                <div className="space-y-2">
                  <Button className="w-full bg-yellow-400 text-gray-900 hover:bg-yellow-500 rounded-full">View 3D Floor Plan</Button>
                  <Button className="w-full bg-yellow-400 text-gray-900 hover:bg-yellow-500 rounded-full">Share This Property</Button>
                  <Button className="w-full bg-yellow-400 text-gray-900 hover:bg-yellow-500 rounded-full">Contact Builder</Button>
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
          title: "Bank Loan Approval:",
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
          location: "View plans, VIP pases and insurances provided.",
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

  return (
    <section className="px-16 py-12 bg-gray-50">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-600">View more details</span>
          <div className="w-8 h-px bg-gray-400"></div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Read More About This Property</h2>
        <p className="text-lg text-gray-600">Get detailed insights about legal aspects, financial information, and lifestyle factors</p>
      </div>
      <div className="space-y-12">
        {propertySections.map((section) => (
          <div key={section.id} className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-0.5 bg-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900">{section.title}</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {section.cards.map((card) => (
                <Card key={card.id} className={`transition-all duration-300 cursor-pointer ${hoveredCard === card.id ? 'shadow-lg scale-105' : 'shadow-md'}`} onMouseEnter={() => setHoveredCard(card.id)} onMouseLeave={() => setHoveredCard(null)} onClick={() => setExpandedCard(expandedCard === card.id ? null : card.id)}>
                  <CardContent className="p-6">
                    <div className="space-y-2 mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">{card.title}</h4>
                      <p className="text-sm text-gray-600">{card.subtitle}</p>
                      <p className="text-xs text-gray-500">{card.location}</p>
                    </div>
                    {expandedCard === card.id && (
                      <div className="space-y-4 border-t pt-4">
                        <p className="text-gray-700 leading-relaxed mb-4">{card.description}</p>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h5 className="font-semibold text-gray-900 mb-3">{card.documentTitle}</h5>
                          <div className="space-y-2">
                            {card.documentItems.map((item, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                          <button className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">View Documents</button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-12">
        <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          Load More
        </button>
      </div>
    </section>
  );
};

const LocationSection = () => {
  return (
    <section className="px-16 py-12 bg-white">
    </section>
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
          <h2 className="text-4xl font-semibold text-white leading-tight mb-8 max-w-2xl mx-auto">Look and find more, browsing with HouseNSeek!</h2>
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

// Main App Component
export const PropertyListingApp = () => {
  return (
    <div className="min-h-screen bg-background">
      <PropertyHeader />
      <BuilderProfile />
      <PropertyHero />
      <PropertyConfigurations />
      <ExistingFloorPlansSection />
      <FloorPlansSection />
      <ReadMoreAboutProperty />
      <LocationSection />
      <PropertyFooter />
    </div>
  );
};

export default PropertyListingApp; 