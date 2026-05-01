import React from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Check, MapPin, Building2, Calendar } from "lucide-react";
import ResultsNavBar from "../layouts/ResultsNavBar";
import { Card, CardContent } from "../ui/Card";
import Button from "../ui/Button";

import API_BASE_URL from "../../../config";
import propertyHero from "../../../assets/property-hero.jpg"; // Using as placeholder

import { getCookie } from "../../../utils/cookieUtils";
import { fetchNearestNodes, fetchPropertiesByMultipleLocations, fetchPropertyPois } from "../../../services/api";
import { buildPropertyPath } from "../../../utils/entityRouting";
import PropertyMap from "../../../components/maps/PropertyMap";

const normalizeConfigLabel = (config) => {
  if (!config) return "";
  if (typeof config === "string") return config;
  if (typeof config === "object") {
    return config.type || config.bhk_type || config.label || "";
  }
  return String(config);
};

const stringifyMaybeList = (value) => {
  if (!value) return "";
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean).join(" | ");
  }
  return String(value);
};

const pickPropertyImage = (property) => {
  const normalizeUrl = (url) => {
    if (!url) return "";
    const value = String(url);
    if (value.startsWith("http")) return value;
    return `${API_BASE_URL}${value.startsWith("/") ? value : `/${value}`}`;
  };

  return normalizeUrl(property?.builder_project_image) || normalizeUrl(property?.image) || "/Pimg9.jpg";
};

const MainContentSection = ({ propertyData, projectData }) => {
  const navigate = useNavigate();
  const overviewRef = React.useRef(null);
  const floorPlansRef = React.useRef(null);
  const amenitiesRef = React.useRef(null);
  const mapRef = React.useRef(null);

  const imageSources = React.useMemo(() => {
    const heroImage = propertyData?.builder_project_image || projectData?.project_image || propertyHero;
    return [heroImage];
  }, [propertyData?.builder_project_image, projectData?.project_image]);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  const [showAllLeftOverview, setShowAllLeftOverview] = React.useState(false);
  const [showAllRightOverview, setShowAllRightOverview] = React.useState(false);
  const [showFullDescription, setShowFullDescription] = React.useState(false);

  const configLabels = React.useMemo(() => {
    const projectConfigs = Array.isArray(projectData?.unit_configs)
      ? projectData.unit_configs.map((item) => item?.bhk_type)
      : [];
    const propertyConfigs = Array.isArray(propertyData?.Existing_Configurations)
      ? propertyData.Existing_Configurations.map(normalizeConfigLabel)
      : [];

    return Array.from(
      new Set(
        [...projectConfigs, ...propertyConfigs]
          .map((item) => String(item || "").trim())
          .filter(Boolean)
      )
    );
  }, [projectData?.unit_configs, propertyData?.Existing_Configurations]);

  const overviewData = React.useMemo(() => {
    const propertyLocation = propertyData?.Location || projectData?.location || "";
    const priceRange = propertyData?.Pricing || propertyData?.Price_Starting_From || projectData?.price_range || "";

    return {
      left: [
        { label: "Possession", value: propertyData?.Possession_Date || projectData?.possession_date || "On request" },
        { label: "RERA ID", value: propertyData?.RERA_ID || "On request" },
        { label: "Location", value: propertyLocation || "On request" },
        { label: "Config", value: configLabels.join(", ") || "On request" },
        { label: "Price", value: priceRange || "On request" },
      ],
      right: [
        { label: "Carpet Area", value: propertyData?.Carpet_Area || "On request" },
        { label: "Built-up", value: propertyData?.Built_up_Area || "On request" },
        { label: "Parking", value: propertyData?.Parking || "On request" },
        { label: "Approved by", value: stringifyMaybeList(propertyData?.Approved_by_Authorities) || "On request" },
        { label: "Loans", value: stringifyMaybeList(propertyData?.Loan_Availability) || "On request" },
      ],
    };
  }, [
    propertyData?.Possession_Date,
    projectData?.possession_date,
    propertyData?.RERA_ID,
    propertyData?.Location,
    projectData?.location,
    propertyData?.Pricing,
    propertyData?.Price_Starting_From,
    projectData?.price_range,
    propertyData?.Carpet_Area,
    propertyData?.Built_up_Area,
    propertyData?.Parking,
    propertyData?.Approved_by_Authorities,
    propertyData?.Loan_Availability,
    configLabels,
  ]);

  const highlights = React.useMemo(() => {
    const merged = [
      ...(Array.isArray(projectData?.highlights) ? projectData.highlights : []),
      ...(Array.isArray(propertyData?.Highlights) ? propertyData.Highlights : []),
      ...(Array.isArray(propertyData?.Key_Highlights) ? propertyData.Key_Highlights : []),
      ...(Array.isArray(propertyData?.Connectivity) ? propertyData.Connectivity : []),
    ]
      .map((item) => String(item || "").trim())
      .filter(Boolean);

    const deduped = Array.from(new Set(merged));
    return deduped.length > 0 ? deduped.slice(0, 6) : ["Highlights on request"];
  }, [projectData?.highlights, propertyData?.Highlights, propertyData?.Key_Highlights, propertyData?.Connectivity]);

  const propertyName = propertyData?.Property_Name || projectData?.title || "Property";
  const propertyAddress =
    propertyData?.Address ||
    projectData?.full_address ||
    propertyData?.Location ||
    projectData?.location ||
    "Address not available";
  const propertyPrice =
    propertyData?.Pricing || propertyData?.Price_Starting_From || projectData?.price_range || "Price on request";

  const coordinates = React.useMemo(() => {
    const latRaw = propertyData?.latitude ?? projectData?.latitude;
    const lngRaw = propertyData?.longitude ?? projectData?.longitude;
    const lat = latRaw === null || latRaw === undefined ? null : Number(latRaw);
    const lng = lngRaw === null || lngRaw === undefined ? null : Number(lngRaw);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return { latitude: null, longitude: null };
    }
    return { latitude: lat, longitude: lng };
  }, [propertyData?.latitude, propertyData?.longitude, projectData?.latitude, projectData?.longitude]);

  const shortDescription = React.useMemo(() => {
    const locationPhrase = propertyData?.Location ? ` in ${propertyData.Location}` : "";
    const carpetPhrase = propertyData?.Carpet_Area ? ` Carpet area: ${propertyData.Carpet_Area}.` : "";
    return `${propertyName}${locationPhrase} is available with pricing ${propertyPrice}.${carpetPhrase}`;
  }, [propertyName, propertyData?.Location, propertyData?.Carpet_Area, propertyPrice]);

  const longDescription = React.useMemo(() => {
    const details = [
      projectData?.description || "Project description available on request.",
      propertyData?.Builder_Name || projectData?.builder_name
        ? `Builder: ${propertyData?.Builder_Name || projectData?.builder_name}`
        : "",
      propertyPrice ? `Price: ${propertyPrice}` : "",
      propertyData?.Carpet_Area ? `Carpet area: ${propertyData.Carpet_Area}` : "",
      propertyData?.RERA_ID ? `RERA ID: ${propertyData.RERA_ID}` : "",
      propertyData?.Possession_Date || projectData?.possession_date
        ? `Possession: ${propertyData?.Possession_Date || projectData?.possession_date}`
        : "",
      configLabels.length ? `Configurations: ${configLabels.join(", ")}` : "",
    ]
      .map((item) => String(item || "").trim())
      .filter(Boolean);

    return details.join("\n");
  }, [
    projectData?.description,
    propertyData?.Builder_Name,
    projectData?.builder_name,
    propertyPrice,
    propertyData?.RERA_ID,
    propertyData?.Possession_Date,
    projectData?.possession_date,
    configLabels,
  ]);

  const [nearbyProperties, setNearbyProperties] = React.useState([]);
  const [nearbyLoading, setNearbyLoading] = React.useState(false);
  const [nearbyPois, setNearbyPois] = React.useState(null);
  const [poisLoading, setPoisLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const loadPois = async () => {
      if (!propertyData?.id) {
        setNearbyPois(null);
        return;
      }
      if (coordinates.latitude === null || coordinates.longitude === null) {
        setNearbyPois(null);
        return;
      }
      try {
        setPoisLoading(true);
        const data = await fetchPropertyPois(propertyData.id, {
          radius_m: 2000,
          types: ["school", "hospital", "pharmacy", "supermarket", "park"],
        });
        if (!cancelled) {
          setNearbyPois(data);
        }
      } catch (error) {
        if (!cancelled) {
          setNearbyPois(null);
        }
      } finally {
        if (!cancelled) {
          setPoisLoading(false);
        }
      }
    };

    loadPois();
    return () => {
      cancelled = true;
    };
  }, [propertyData?.id, coordinates.latitude, coordinates.longitude]);

  React.useEffect(() => {
    let cancelled = false;

    const loadNearby = async () => {
      const seedLocation = String(getCookie("user_location") || "").trim();
      if (!seedLocation) {
        setNearbyProperties([]);
        return;
      }

      try {
        setNearbyLoading(true);

        const nodes = await fetchNearestNodes(seedLocation);
        const orderedLocations = Array.from(
          new Set(
            [nodes?.primaryLocation, ...(Array.isArray(nodes?.nearestNodes) ? nodes.nearestNodes : [])]
              .map((loc) => String(loc || "").trim())
              .filter(Boolean)
          )
        );

        const properties = await fetchPropertiesByMultipleLocations(orderedLocations);
        const deduped = Array.from(
          new Map(
            (Array.isArray(properties) ? properties : [])
              .filter((prop) => prop && prop.id !== propertyData?.id)
              .map((prop) => [prop.id, prop])
          ).values()
        );

        if (!cancelled) {
          setNearbyProperties(deduped.slice(0, 3));
        }
      } catch (error) {
        if (!cancelled) {
          setNearbyProperties([]);
        }
      } finally {
        if (!cancelled) {
          setNearbyLoading(false);
        }
      }
    };

    loadNearby();

    return () => {
      cancelled = true;
    };
  }, [propertyData?.id]);

  return (
    <section className="py-4 sm:py-8 lg:py-16 bg-gray-50/30">
      <ResultsNavBar 
        amenitiesRef={amenitiesRef}
        overviewRef={overviewRef}
        floorPlansRef={floorPlansRef}
        mapRef={mapRef}
      />
      
      {/* Changed px-2 to px-4 for better mobile gutters */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-4 sm:py-6 lg:py-12">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* === Main Content Column === */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-10">

            {/* Highlights / Amenities Section */}
            <div ref={amenitiesRef} id="amenities" className="bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-blue-100/50">
              <div className="flex items-center gap-3 mb-5 sm:mb-6">
                <div className="bg-blue-900 rounded-xl w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shadow-md shadow-blue-900/10">
                  <Shield className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Key Highlights</h2>
              </div>
              
              {/* Changed mobile grid to 2 columns for compactness */}
              <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-4">
                {highlights.map((highlight, index) => (
                  <div key={index} className="flex items-start sm:items-center gap-2 sm:gap-3 bg-gray-50/80 p-3 sm:p-4 rounded-xl border border-gray-100">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 flex-shrink-0 mt-0.5 sm:mt-0" />
                    <span className="text-xs sm:text-base text-gray-800 font-medium leading-tight">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Overview Section */}
            <div ref={overviewRef} id="overview" className="bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-5 sm:mb-6">
                <div className="inline-flex items-center bg-blue-900 text-white px-4 py-1.5 sm:px-5 sm:py-2.5 rounded-full shadow-md shadow-blue-900/20">
                  <span className="text-sm sm:text-base font-semibold">Overview</span>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                {/* Left Column */}
                <div className="space-y-3">
                  {overviewData.left.map((item, index) => (
                    <div 
                      key={index} 
                      className={`flex justify-between items-center p-3 sm:p-4 rounded-xl bg-gray-50 border border-gray-100 ${!showAllLeftOverview && index >= 3 ? 'hidden md:flex' : 'flex'}`}
                    >
                      <span className="text-xs sm:text-sm text-gray-500 font-medium">{item.label}</span>
                      <span className="text-sm sm:text-base font-bold text-gray-900 text-right">{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* Right Column */}
                <div className="space-y-3">
                  {overviewData.right.map((item, index) => (
                    <div 
                      key={index} 
                      className={`flex justify-between items-center p-3 sm:p-4 rounded-xl bg-gray-50 border border-gray-100 ${!showAllRightOverview && index >= 3 ? 'hidden md:flex' : 'flex'}`}
                    >
                      <span className="text-xs sm:text-sm text-gray-500 font-medium">{item.label}</span>
                      <span className="text-sm sm:text-base font-bold text-gray-900 text-right">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile View Toggle Button */}
              {(overviewData.left.length > 3 || overviewData.right.length > 3) && (
                <div className="md:hidden mt-5">
                  <button
                    onClick={() => {
                      setShowAllLeftOverview(!showAllLeftOverview);
                      setShowAllRightOverview(!showAllRightOverview);
                    }}
                    className="w-full flex items-center justify-center text-blue-600 font-semibold text-sm py-2.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 transition-all"
                  >
                    {(showAllLeftOverview || showAllRightOverview) ? "Show Less" : "View All Details"}
                  </button>
                </div>
              )}
            </div>

	            {/* Description Section */}
	            <div className="bg-gradient-to-br from-yellow-50/50 to-white p-5 sm:p-8 rounded-2xl shadow-sm border border-yellow-100">
	              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
	                <MapPin className="w-4 h-4 text-blue-600" />
	                Address Details
	              </h3>
	              <div className="bg-white/80 p-4 rounded-xl border border-yellow-100/50 backdrop-blur-sm">
	                <p className="text-sm sm:text-base text-gray-800 font-medium mb-2">{propertyAddress}</p>
	                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-3">
	                  {shortDescription}
	                </p>
	                {showFullDescription && longDescription ? (
	                  <div className="mt-3 whitespace-pre-line text-xs sm:text-sm text-gray-600 leading-relaxed">
	                    {longDescription}
	                  </div>
	                ) : null}
	                <button
	                  type="button"
	                  onClick={() => setShowFullDescription((prev) => !prev)}
	                  className="text-xs sm:text-sm text-blue-600 font-bold hover:text-blue-800"
	                  aria-expanded={showFullDescription}
	                >
	                  {showFullDescription ? "Show Less" : "Read Full Description"}
	                </button>
	              </div>
	            </div>

            {/* Map Section */}
            <div ref={mapRef} id="map-location" className="overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-200">
              <div className="p-5 sm:p-6 border-b border-gray-100">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Location & Neighborhood</h2>
              </div>
              <div className="relative">
                <PropertyMap
                  latitude={coordinates.latitude}
                  longitude={coordinates.longitude}
                  radiusM={nearbyPois?.radius_m || 2000}
                  poisByType={nearbyPois?.pois || {}}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
              </div>
              <div className="p-4 bg-gray-50 space-y-2">
                <p className="text-xs sm:text-sm text-gray-600 text-center">
                  {coordinates.latitude === null || coordinates.longitude === null
                    ? "Add coordinates from Admin to enable map + nearby places."
                    : "Explore nearby schools, hospitals, and essentials around this property."}
                </p>
                {poisLoading ? (
                  <p className="text-xs text-gray-500 text-center">Loading nearby places…</p>
                ) : nearbyPois?.pois ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-gray-600">
                    {Object.entries(nearbyPois.pois)
                      .filter(([, list]) => Array.isArray(list) && list.length)
                      .slice(0, 6)
                      .map(([type, list]) => (
                        <div key={type} className="bg-white/70 border border-gray-100 rounded-lg px-2 py-1.5">
                          <div className="font-semibold text-gray-800 capitalize">{type.replace(/_/g, " ")}</div>
                          <div className="text-gray-500">{list.length} found</div>
                        </div>
                      ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>


          {/* === Sidebar / Right Column === */}
          <div className="space-y-5 sm:space-y-6">
            
            {/* Main Property Card */}
            <Card className="bg-blue-900 text-white overflow-hidden rounded-2xl sm:rounded-3xl shadow-lg border-0">
	              <CardContent className="p-0">
		                <div className="relative group">
		                  <img 
		                    src={imageSources[currentImageIndex]} 
		                    alt={propertyName} 
		                    className="w-full h-48 sm:h-64 object-cover" 
		                  />
	                </div>
		                <div className="p-3 sm:p-4 md:p-5 lg:p-6 space-y-2 sm:space-y-3 md:space-y-4">
		                  <div>
		                    <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-white leading-tight mb-2">{propertyName}</h3>
		                    <p className="text-xs sm:text-sm text-white/90 mb-2 sm:mb-3 md:mb-4">{propertyData?.Builder_Name || projectData?.builder_name || "Builder details on request"}</p>
	                  </div>
	                  <p className="text-xs sm:text-sm text-white leading-relaxed break-words">
	                    {projectData?.description || "Project description available on request."}
	                  </p>
	                  <div className="space-y-2 sm:space-y-3 pt-2">
	                    <Button className="w-full bg-yellow-400 text-blue-900 hover:bg-yellow-500 text-xs sm:text-sm px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-full font-semibold shadow-lg">Add to My List</Button>
	                    <Button
                        onClick={() => {
                          const element = document.getElementById("nearby-properties");
                          if (element) {
                            element.scrollIntoView({ behavior: "smooth", block: "start" });
                          }
                        }}
                        className="w-full bg-yellow-400 text-blue-900 hover:bg-yellow-500 text-xs sm:text-sm px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-full font-semibold shadow-lg"
                      >
                        Browse Nearby Listings
                      </Button>
	                  </div>
	                </div>
              </CardContent>
            </Card>            
         
            {/* Action Card: Schedule Tour */}
            <Card className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <CardContent className="p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-gray-900">Interested?</h3>
                    <p className="text-xs text-gray-500">Book a visit or view plans</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                    <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-black hover:from-blue-700 hover:to-blue-800 rounded-xl font-semibold py-3 text-sm shadow-md">
                      Request Site Visit
                    </button>
                  <button className="w-full bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-xl font-semibold py-3 text-sm">
                    View 3D Plan <span className="text-[10px] ml-1 text-gray-400 font-normal">(Coming Soon)</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Related Properties List */}
            <div id="nearby-properties" className="space-y-3">
              <h4 className="px-1 text-sm font-semibold text-gray-500 uppercase tracking-wider">Nearby Properties</h4>
              {nearbyLoading ? (
                <div className="px-1 text-sm text-gray-500">Loading nearby properties…</div>
              ) : nearbyProperties.length === 0 ? (
                <div className="px-1 text-sm text-gray-500">
                  {getCookie("user_location")
                    ? "No nearby properties found."
                    : "Enable location on the landing page to see nearby properties."}
                </div>
	              ) : (
	                nearbyProperties.map((prop, index) => {
	                  const nearbyPropertyId =
	                    prop?.id ?? prop?.property_id ?? prop?.propertyId ?? prop?.Property_ID ?? "";
	                  const destination = buildPropertyPath(nearbyPropertyId);

	                  return (
	                    <Card
	                      key={String(nearbyPropertyId || prop?.Property_Name || index)}
	                      className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
	                      onClick={() => navigate(destination)}
	                      role="link"
	                      tabIndex={0}
	                      onKeyDown={(event) => {
	                        if (event.key === "Enter" || event.key === " ") {
	                          event.preventDefault();
	                          navigate(destination);
	                        }
	                      }}
	                      aria-label={prop?.Property_Name ? `Open ${prop.Property_Name}` : "Open property"}
	                    >
	                      <CardContent className="p-3">
	                        <div className="flex items-center gap-3">
	                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 relative">
	                            <div className="absolute inset-0 bg-gray-300 animate-pulse group-hover:hidden" />
	                            <img
	                              src={pickPropertyImage(prop)}
	                              alt={prop?.Property_Name || "Property"}
	                              className="w-full h-full object-cover relative z-10"
	                              onError={(e) => {
	                                e.target.src = "/Pimg9.jpg";
	                              }}
	                            />
	                          </div>

	                          <div className="flex-1 min-w-0">
	                            <h2 className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
	                              {prop?.Property_Name || "Property"}
	                            </h2>
	                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
	                              <Building2 className="w-3 h-3" />
	                              <span className="truncate">{prop?.Location || "Location on request"}</span>
	                            </div>
	                            <p className="text-[11px] text-gray-400 mt-1 truncate">
	                              {prop?.Pricing || prop?.Price_Starting_From || "Price on request"}
	                            </p>
	                          </div>

	                          <div className="flex-shrink-0 self-center">
	                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
	                              <span className="text-gray-400 group-hover:text-blue-600">›</span>
	                            </div>
	                          </div>
	                        </div>
	                      </CardContent>
	                    </Card>
	                  );
	                })
	              )}
	</div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default MainContentSection;






