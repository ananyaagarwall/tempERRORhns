import React, { useState } from "react";
import { Heart, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { normalizeImageUrl } from "../../../utils/imageUtils";
import { useMedia } from "../../../hooks/useMedia";
import { useCart } from "../../../hns_cart_page/js/CartContent.jsx";
import propertyHero from "../../../assets/property-hero.jpg";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import "../../../hns_home_page/home_page_css/PropertiesSection.css";

const HeartIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const normalizeConfigLabel = (config) => {
  if (!config) {
    return "";
  }
  if (typeof config === "string") {
    return config;
  }
  if (typeof config === "object") {
    return config.type || config.bhk_type || config.label || "";
  }
  return String(config);
};

function _safeList(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") { try { return JSON.parse(val); } catch { return []; } }
  return [];
}

const PropertyHero = ({ propertyData, projectData }) => {
  const { addToCart, removeFromCart, isInCart } = useCart();
  const [slideIndex, setSlideIndex] = useState(0);

  // Media API — provides DB-persisted gallery images.
  // Falls back gracefully to raw project fields while the media table is empty.
  const { urls: mediaUrls } = useMedia(
    'project',
    projectData?.id ?? null,
    'gallery',  // gallery only — floor plans shown in ExistingFloorPlansSection
  );

  const configLabels = Array.from(
    new Set(
      [
        ...(Array.isArray(projectData?.unit_configs) ? projectData.unit_configs.map((item) => item?.bhk_type) : []),
        ...(Array.isArray(propertyData?.Existing_Configurations)
          ? propertyData.Existing_Configurations.map(normalizeConfigLabel)
          : []),
      ]
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    )
  );

  const badgeLabels = Array.from(
    new Set(
      [
        propertyData?.Project_Status,
        propertyData?.RERA_ID ? "RERA Verified" : null,
        propertyData?.Lift_Availability ? "Lift Available" : null,
        configLabels[0],
      ]
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    )
  );

  const propertyName = propertyData?.Property_Name || projectData?.title || "Property";
  const propertyAddress =
    propertyData?.Address || projectData?.full_address || propertyData?.Location || projectData?.location || "Address not available";
  const propertyPrice =
    propertyData?.Pricing || propertyData?.Price_Starting_From || projectData?.price_range || "Price on request";
  // Merge: Media-table URLs first (DB-driven, ordered), then raw entity fields as fallback.
  const rawFallback = [
    propertyData?.builder_project_image,
    projectData?.project_image,
    ..._safeList(projectData?.image_urls),
  ]
    .map(normalizeImageUrl)
    .filter(Boolean);
  const merged = [...mediaUrls, ...rawFallback];
  const dedupedImages = [...new Set(merged)];
  const sliderImages = dedupedImages.length > 0 ? dedupedImages : [propertyHero];
  const slideCount = sliderImages.length;
  const prevSlide = () => setSlideIndex(i => (i - 1 + slideCount) % slideCount);
  const nextSlide = () => setSlideIndex(i => (i + 1) % slideCount);
  const propertyImage = sliderImages[0];
  const areaLabel =
    propertyData?.Carpet_Area ||
    (projectData?.carpet_area_min && projectData?.carpet_area_max
      ? `${projectData.carpet_area_min} - ${projectData.carpet_area_max} sq.ft.`
      : projectData?.carpet_area_min
        ? `${projectData.carpet_area_min} sq.ft.`
        : "Area on request");
  const highlightItems = [
    ...(Array.isArray(projectData?.highlights) ? projectData.highlights : []),
    ...(Array.isArray(propertyData?.Highlights) ? propertyData.Highlights : []),
    ...(Array.isArray(propertyData?.Key_Highlights) ? propertyData.Key_Highlights : []),
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, 3);
  const extraChargeItems = [
    propertyData?.Extra_Charges,
    propertyData?.Parking ? `Parking: ${propertyData.Parking}` : null,
  ].filter(Boolean);

  const scrollToMap = () => {
    const mapElement = document.getElementById("map-location");
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleHeartClick = (event) => {
    event.stopPropagation();
    if (!propertyData?.id) {
      return;
    }

    if (isInCart(propertyData.id)) {
      removeFromCart(propertyData.id);
      return;
    }

    addToCart(
      {
        id: propertyData.id,
        name: propertyName,
        address: propertyAddress,
        location: propertyData?.Location || propertyAddress,
        price: propertyPrice,
        img: propertyImage,
        image: propertyImage,
        features: configLabels.join(", ") || "Property",
        bhk: configLabels.join(", ") || "Property",
        area: areaLabel,
        amenities: Array.isArray(projectData?.project_amenities)
          ? projectData.project_amenities.map((item) => item?.name).filter(Boolean)
          : [],
        availability: propertyData?.Project_Status || projectData?.status || "Available",
      },
      "featured"
    );
  };

  const isPropertyInCart = propertyData?.id ? isInCart(propertyData.id) : false;

  return (
    <section className="px-4 sm:px-6 md:px-8 lg:px-16 py-6 sm:py-8">
      <div className="property-hero-grid grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-start">
        <div className="property-hero-carousel relative rounded-lg overflow-hidden">
          {/* ── Slide image ── */}
          <img
            src={sliderImages[slideIndex]}
            alt={`${propertyName} — image ${slideIndex + 1} of ${slideCount}`}
            className="w-full h-full rounded-lg transition-opacity duration-300"
            style={{ objectFit: 'cover' }}
          />

          {/* ── Heart button (top-left) ── */}
          <button
            onClick={handleHeartClick}
            className={`property-heart-button ${isPropertyInCart ? "in-cart" : ""}`}
            style={{ position: "absolute", top: "14px", left: "14px", zIndex: 10 }}
            aria-label={isPropertyInCart ? "Remove from cart" : "Add to cart"}
          >
            <HeartIcon filled={isPropertyInCart} />
          </button>

          {/* ── Rating badge (top-right) ── */}
          <div className="absolute top-4 right-4 bg-yellow-400 px-3 py-1 rounded-lg flex items-center gap-1 z-10">
            <Star className="w-4 h-4 text-gray-900 fill-current" />
            <span className="font-bold text-gray-900">95%</span>
          </div>

          {/* ── Prev / Next arrows (only when > 1 image) ── */}
          {slideCount > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/65 text-white rounded-full w-9 h-9 flex items-center justify-center z-10 transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/65 text-white rounded-full w-9 h-9 flex items-center justify-center z-10 transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* ── Dot indicators ── */}
          {slideCount > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {sliderImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlideIndex(i)}
                  aria-label={`Go to image ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-200 ${
                    i === slideIndex ? "w-5 bg-white" : "w-2 bg-white/50 hover:bg-white/75"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Badge variant="outline" className="bg-yellow-100 border-yellow-300 text-gray-900 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
              Home
            </Badge>
            {badgeLabels.map((label, index) => (
              <Badge
                key={`${label}-${index}`}
                variant="outline"
                className="bg-yellow-100 border-yellow-300 text-gray-900 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm"
              >
                {label}
              </Badge>
            ))}
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 leading-tight">
              {propertyName}
            </h1>
            <div className="space-y-2">
              <p
                className="text-sm sm:text-base md:text-lg text-gray-600 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={scrollToMap}
              >
                {propertyAddress}
              </p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{propertyPrice}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button
              variant="outline"
              className="border-blue-500 text-blue-600 hover:bg-blue-50 rounded-full px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base"
              onClick={handleHeartClick}
            >
              {isPropertyInCart ? "Added to My List" : "Add to My List"}
            </Button>
            <Button className="bg-yellow-400 text-gray-900 hover:bg-yellow-500 rounded-full px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base">
              Request Visit
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-4 mt-4 sm:mt-6 md:mt-8">
            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 002-2v-2" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Carpet Area</h3>
                  <p className="text-xs text-gray-500 mb-2">From project data</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-lg font-bold text-gray-900">{areaLabel}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Pricing</h3>
                  <p className="text-xs text-gray-500 mb-2">Live property pricing</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-lg font-bold text-gray-900">{propertyPrice}</p>
                {projectData?.price_per_sqft ? (
                  <p className="text-sm text-gray-600">Rs. {projectData.price_per_sqft}/sq.ft.</p>
                ) : null}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6 hover:shadow-lg transition-shadow">
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
                {(highlightItems.length > 0 ? highlightItems : ["Property details available"]).map((item, index) => (
                  <div key={`${item}-${index}`} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6 hover:shadow-lg transition-shadow">
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
                {(extraChargeItems.length > 0 ? extraChargeItems : ["No additional charges listed"]).map((item, index) => (
                  <div key={`${item}-${index}`} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PropertyHero;
