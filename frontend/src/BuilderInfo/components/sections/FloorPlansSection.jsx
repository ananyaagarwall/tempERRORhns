import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchBuilderProjects } from "../../../services/api";
import { fetchEntityMedia } from "../../../services/mediaService";
import { buildPropertyPath } from "../../../utils/entityRouting";
import {
  pickProjectImage,
  pickFloorPlanPreview,
} from "../../../utils/projectImageUtils";

const WhyBuilderSection = () => (
  <div className="my-6 xs:my-7 sm:my-8 mx-2 xs:mx-3 sm:mx-4 md:mx-0">
    <div className="bg-white rounded-xl xs:rounded-2xl border border-gray-200 p-4 xs:p-5 sm:p-6 md:p-8 shadow-sm">
      <div className="flex flex-col xs:flex-row xs:justify-between xs:items-start sm:flex-row sm:justify-between sm:items-center">
        <div className="mb-3 xs:mb-0">
          <h2 className="text-lg xs:text-xl sm:text-2xl font-serif text-gray-900 mb-1 xs:mb-2">
            Why this Builder?
          </h2>
          <p className="text-gray-600 text-xs xs:text-sm sm:text-base">
            Details about its promises, motto and branding.
          </p>
        </div>
        <button className="flex items-center text-blue-600 hover:text-blue-700 font-sans-serif text-xs xs:text-m sm:text-base transition-colors mt-2 xs:mt-0">
          View more
          <svg
            className="ml-1 w-3 h-3 xs:w-4 xs:h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
);

const formatBhkInfo = (project) => {
  const configs = Array.isArray(project?.unit_configs)
    ? project.unit_configs
    : [];
  const labels = [
    ...new Set(configs.map((row) => row.bhk_type).filter(Boolean)),
  ];
  if (labels.length > 0) return labels.join(" · ");
  if (
    Array.isArray(project?.configuration) &&
    project.configuration.length > 0
  ) {
    return project.configuration
      .map((item) => item.type || item.bhk_type)
      .filter(Boolean)
      .join(" · ");
  }
  return "Floor plans available";
};

const FloorPlanCard = ({ floorPlan, onClick }) => (
  <div
    className="relative h-full cursor-pointer"
    onClick={onClick}
    onKeyDown={(event) => event.key === "Enter" && onClick()}
    role="button"
    tabIndex={0}
  >
    <div className="absolute inset-0 flex items-center justify-center bg-white">
      <img
        src={floorPlan.image}
        alt={floorPlan.title}
        className="max-w-full max-h-full object-contain p-2"
      />
    </div>
    <div className="absolute inset-0 bg-black/30" />
    <div className="relative h-full flex flex-col justify-between p-3 xs:p-4 text-white">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm xs:text-base font-serif mb-1">
            {floorPlan.title}
          </h3>
          <p className="text-xxs xs:text-xs opacity-90">{floorPlan.subtitle}</p>
        </div>
        {floorPlan.tag && (
          <span className="bg-yellow-400 text-black text-xxs xs:text-xs font-serif px-2 py-1 rounded-full">
            {floorPlan.tag}
          </span>
        )}
      </div>
      <div className="bg-black bg-opacity-50 rounded-lg p-2 xs:p-3 backdrop-blur-sm">
        <h4 className="text-base xs:text-lg font-var(--hns-sans) mb-1">
          {floorPlan.projectName}
        </h4>
        <p className="text-xs xs:text-sm mb-1">{floorPlan.bhkInfo}</p>
        {floorPlan.price && (
          <p className="text-sm xs:text-base font-var(--hns-sans) text-yellow-300 mb-2">
            {floorPlan.price}
          </p>
        )}
        {floorPlan.location && (
          <div className="flex items-center text-xxs xs:text-xs opacity-90">
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="xs:w-3 xs:h-3"
            >
              <path
                d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 22C16 18 20 14.4183 20 10C20 5.58172 16.4183 2 12 2C7.58172 2 4 5.58172 4 10C4 14.4183 8 18 12 22Z"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="ml-1">{floorPlan.location}</span>
          </div>
        )}
      </div>
    </div>
  </div>
);

const FloorPlansSection = ({ builder }) => {
  const navigate = useNavigate();
  const [activeIdx, setActiveIdx] = useState(0);
  const [floorPlans, setFloorPlans] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!builder?.id) {
        setFloorPlans([]);
        return;
      }

      setLoading(true);
      try {
        const projects = await fetchBuilderProjects(builder.id);
        const cards = await Promise.all(
          (Array.isArray(projects) ? projects : []).map(async (project) => {
            const property = project?.primary_property || {};
            const media = await fetchEntityMedia(
              "project",
              project.id,
              "floor_plan",
            );
            const floorPlanImage = pickFloorPlanPreview(media);
            const image = floorPlanImage || pickProjectImage(project, property);

            return {
              projectId: project.id,
              propertyId: project.property_id || property.id,
              title: project.title || property.Property_Name || "Project",
              subtitle:
                property.Project_Status ||
                project.property_status ||
                project.status ||
                "View floor plans",
              image,
              projectName:
                property.Location || project.location || "Location on request",
              bhkInfo: formatBhkInfo(project),
              price:
                property.Price_Starting_From ||
                property.Pricing ||
                project.price_range ||
                "",
              location:
                project.full_address ||
                property.Address ||
                project.location ||
                "",
              tag: property.Project_Status || project.status || "",
            };
          }),
        );

        if (!cancelled) {
          setFloorPlans(cards.filter((card) => card.image));
          setActiveIdx(0);
        }
      } catch {
        if (!cancelled) setFloorPlans([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [builder?.id]);

  const handlePrevious = () => {
    setActiveIdx((prevIdx) =>
      prevIdx === 0 ? floorPlans.length - 1 : prevIdx - 1,
    );
  };

  const handleNext = () => {
    setActiveIdx((prevIdx) =>
      prevIdx === floorPlans.length - 1 ? 0 : prevIdx + 1,
    );
  };

  const openProperty = (card) => {
    if (card?.propertyId) {
      navigate(buildPropertyPath(card.propertyId));
    }
  };

  if (loading) {
    return (
      <div className="my-6 xs:my-7 sm:my-8 px-2 xs:px-3 sm:px-0">
        <div className="text-sm text-gray-500">Loading floor plans...</div>
      </div>
    );
  }

  if (floorPlans.length === 0) {
    return <WhyBuilderSection />;
  }

  return (
    <div>
      <div className="my-6 xs:my-7 sm:my-8">
        <div className="flex items-center mb-4 xs:mb-5 sm:mb-6 px-2 xs:px-3 sm:px-0">
          <h2 className="ml-2 xs:ml-3 builder-section-heading">
            Existing in demand floor plans
          </h2>
        </div>

        <div className="block lg:hidden">
          <div
            className="overflow-x-auto hide-scrollbar"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              padding: "12px 0 20px 0",
              scrollSnapType: "x mandatory",
            }}
          >
            <style>{`
              .hide-scrollbar::-webkit-scrollbar { display: none; }
              .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            <div
              className="floorplans-mobile-row flex gap-3 xs:gap-4"
              style={{
                width: "max-content",
                padding: "0 16px",
                scrollSnapType: "x mandatory",
                WebkitOverflowScrolling: "touch",
                scrollBehavior: "smooth",
              }}
            >
              {floorPlans.map((floorPlan, idx) => (
                <div
                  key={`${floorPlan.projectId}-${idx}`}
                  className="mobile-card flex-shrink-0 rounded-xl overflow-hidden shadow-lg"
                  style={{
                    width: "280px",
                    height: "380px",
                    border: "2px solid #CFD2DB",
                    borderRadius: "12px",
                    scrollSnapAlign: "start",
                    overflow: "hidden",
                    backgroundColor: "white",
                  }}
                  onClick={() => openProperty(floorPlan)}
                >
                  <FloorPlanCard
                    floorPlan={floorPlan}
                    onClick={() => openProperty(floorPlan)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        className="relative p-4 xs:p-5 sm:p-6 hidden lg:block"
        style={{
          border: "2px solid #CFD2DB",
          borderRadius: "8px",
          marginTop: "24px",
        }}
      >
        <button
          onClick={handlePrevious}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md"
          aria-label="Previous"
          style={{ left: "20px", zIndex: 40 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18L9 12L15 6"
              stroke="#223A5F"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          onClick={handleNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md"
          aria-label="Next"
          style={{ right: "20px", zIndex: 40 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 18L15 12L9 6"
              stroke="#223A5F"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div
          className="flex items-center justify-center relative"
          style={{ minHeight: "320px", perspective: "1000px" }}
        >
          {floorPlans.map((floorPlan, idx) => {
            let offset = idx - activeIdx;
            const totalCards = floorPlans.length;
            if (offset < -2) offset += totalCards;
            if (offset > 2) offset -= totalCards;
            if (Math.abs(offset) > 2 && Math.abs(offset) < totalCards - 2)
              return null;

            let translateX = 0;
            let scale = 1;
            let zIndex = 20;
            let rotateY = 0;

            if (offset === -2) {
              translateX = -320;
              scale = 0.7;
              zIndex = 5;
              rotateY = 15;
            } else if (offset === -1) {
              translateX = -160;
              scale = 0.85;
              zIndex = 15;
              rotateY = 10;
            } else if (offset === 1) {
              translateX = 160;
              scale = 0.85;
              zIndex = 15;
              rotateY = -10;
            } else if (offset === 2) {
              translateX = 320;
              scale = 0.7;
              zIndex = 5;
              rotateY = -15;
            }

            return (
              <div
                key={`${floorPlan.projectId}-${idx}`}
                className="absolute rounded-xl overflow-hidden shadow-lg transition-all duration-500"
                style={{
                  width: "320px",
                  height: "420px",
                  border: "4px solid #CFD2DB",
                  borderRadius: "16px",
                  zIndex,
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: `translateX(-50%) scale(${scale}) translateX(${translateX}px) rotateY(${rotateY}deg)`,
                  transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  overflow: "hidden",
                  cursor: "pointer",
                }}
                onClick={() => setActiveIdx(idx)}
              >
                <FloorPlanCard
                  floorPlan={floorPlan}
                  onClick={() => openProperty(floorPlan)}
                />
              </div>
            );
          })}
        </div>
      </div>

      <WhyBuilderSection />
    </div>
  );
};

export default FloorPlansSection;
