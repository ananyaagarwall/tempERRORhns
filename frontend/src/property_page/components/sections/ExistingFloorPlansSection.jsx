import React, { useRef, useState, useCallback, useEffect } from "react";
import { Check, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import Button from "../ui/Button";
import { useMedia } from "../../../hooks/useMedia";

import floorPlan2BHK from "../../../assets/floor-plan-2bhk.jpg";
import floorPlan3BHK from "../../../assets/floor-plan-3bhk.jpg";
import floorPlan4BHK from "../../../assets/floor-plan-4bhk.jpg";
import roomImg1 from "../../../assets/roomimg1.jpeg";
import roomImg3 from "../../../assets/roomimg3.jpeg";
import roomImg8 from "../../../assets/roomimg8.avif";

// ─── Data ────────────────────────────────────────────────────────────────────

const floorPlanDetails = {
  "2bhk": {
    "type-i": {
      title: "2 BHK – Type I",
      builtUpArea: "850 sq. ft (79.0 m²)",
      ceilingHeight: "2.7 – 2.8 m (approx. 9.0 ft)",
      mainDoorFacing: "East",
      modularKitchen: "Compact Open Kitchen",
      img: floorPlan2BHK,
    },
    "type-ii": {
      title: "2 BHK – Type II",
      builtUpArea: "950 sq. ft (88.3 m²)",
      ceilingHeight: "2.8 – 2.9 m (approx. 9.2 ft)",
      mainDoorFacing: "North / North-East",
      modularKitchen: "With Sitting Area",
      img: floorPlan2BHK,
    },
    "type-iii": {
      title: "2 BHK – Type III",
      builtUpArea: "1,050 sq. ft (97.5 m²)",
      ceilingHeight: "2.9 m (approx. 9.5 ft)",
      mainDoorFacing: "West",
      modularKitchen: "Extended Kitchen with Utility",
      img: floorPlan2BHK,
    },
  },
  "3bhk": {
    "type-i": {
      title: "3 BHK – Type I",
      builtUpArea: "1,200 sq. ft (111.5 m²)",
      ceilingHeight: "2.9 – 3.0 m (approx. 9.5 ft)",
      mainDoorFacing: "East / North-East",
      modularKitchen: "With Sitting Area",
      img: floorPlan3BHK,
    },
    "type-ii": {
      title: "3 BHK – Type II",
      builtUpArea: "1,350 sq. ft (125.4 m²)",
      ceilingHeight: "3.0 m (approx. 9.8 ft)",
      mainDoorFacing: "South / South-East",
      modularKitchen: "Large Island Kitchen",
      img: floorPlan3BHK,
    },
    "type-iii": {
      title: "3 BHK – Type III (Corner)",
      builtUpArea: "1,450 sq. ft (134.7 m²)",
      ceilingHeight: "3.0 – 3.1 m (approx. 10.0 ft)",
      mainDoorFacing: "North-West (Corner Unit)",
      modularKitchen: "Extended with Breakfast Counter",
      img: floorPlan3BHK,
    },
  },
  "4bhk": {
    "type-i": {
      title: "4 BHK – Type I",
      builtUpArea: "1,580 sq. ft (146.8 m²)",
      ceilingHeight: "3.0 – 3.1 m (approx. 9.8 ft)",
      mainDoorFacing: "South-East / South",
      modularKitchen: "With Sitting Area",
      img: floorPlan4BHK,
    },
    "type-ii": {
      title: "4 BHK – Type II (Premium)",
      builtUpArea: "1,780 sq. ft (165.4 m²)",
      ceilingHeight: "3.1 – 3.2 m (approx. 10.2 ft)",
      mainDoorFacing: "East / North-East",
      modularKitchen: "Chef's Kitchen with Island",
      img: floorPlan4BHK,
    },
    "type-iii": {
      title: "4 BHK – Type III (Penthouse)",
      builtUpArea: "2,100 sq. ft (195.1 m²)",
      ceilingHeight: "3.3 – 3.5 m (approx. 11.0 ft)",
      mainDoorFacing: "All-Round View (Top Floor)",
      modularKitchen: "Open Plan Kitchen with Bar",
      img: floorPlan4BHK,
    },
  },
};

const BHK_LABELS = { "2bhk": "2 BHK", "3bhk": "3 BHK", "4bhk": "4 BHK" };
const TYPE_LABELS  = { "type-i": "Type I", "type-ii": "Type II", "type-iii": "Type III" };

const DEFAULT_ROOM_IMAGES = [
  { src: roomImg1, label: "Living Room" },
  { src: roomImg3, label: "Bedroom" },
  { src: roomImg8, label: "Kitchen" },
  { src: roomImg1, label: "Master Bedroom" },
  { src: roomImg3, label: "Bathroom" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Horizontal peek-carousel for floor plan images.
 *  Shows the active slide fully and peeks the next one on the right. */
function FloorPlanCarousel({ slides, activeIndex, onIndexChange, onImageClick }) {
  const trackRef = useRef(null);
  const isDragging = useRef(false);
  const startX    = useRef(0);
  const scrollX   = useRef(0);

  const goTo = useCallback(
    (idx) => onIndexChange(Math.max(0, Math.min(slides.length - 1, idx))),
    [slides.length, onIndexChange]
  );

  // Sync scroll position when activeIndex changes
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const activeSlide = track.children[activeIndex];
    if (activeSlide) {
      track.scrollTo({ left: activeSlide.offsetLeft - 16, behavior: "smooth" });
    }
  }, [activeIndex]);

  // ── drag / touch handlers ──
  const onPointerDown = (e) => {
    isDragging.current = true;
    startX.current = e.clientX;
    scrollX.current = trackRef.current.scrollLeft;
    trackRef.current.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!isDragging.current) return;
    trackRef.current.scrollLeft = scrollX.current - (e.clientX - startX.current);
  };
  const onPointerUp = (e) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const delta = e.clientX - startX.current;
    if (Math.abs(delta) > 40) goTo(activeIndex + (delta < 0 ? 1 : -1));
    else goTo(activeIndex); // snap back
  };

  return (
    <div className="fp-carousel-wrapper">
      {/* ── Track ── */}
      <div
        ref={trackRef}
        className="fp-carousel-track"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {slides.map((slide, i) => (
          <div key={i} className="fp-slide">
            <div 
              className="fp-slide-inner" 
              onClick={() => onImageClick && onImageClick(slide)}
              style={{ cursor: "zoom-in" }}
            >
              <img
                src={slide.src}
                alt={slide.label}
                className="fp-slide-img"
                draggable={false}
              />
              {/* Type tag – top left */}
              <div className="fp-type-tag">{slide.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Controls row ── */}
      <div className="fp-controls">
        <div className="fp-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => goTo(i)}
              className={`fp-dot${i === activeIndex ? " fp-dot--active" : ""}`}
            />
          ))}
        </div>
        <div className="fp-arrows">
          <button
            className="fp-arrow-btn"
            onClick={() => goTo(activeIndex - 1)}
            disabled={activeIndex === 0}
            aria-label="Previous"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="fp-counter">
            {activeIndex + 1} / {slides.length}
          </span>
          <button
            className="fp-arrow-btn"
            onClick={() => goTo(activeIndex + 1)}
            disabled={activeIndex === slides.length - 1}
            aria-label="Next"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Small horizontal carousel for room images. */
function RoomCarousel({ images }) {
  const [idx, setIdx] = useState(0);
  const trackRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollX = useRef(0);

  const goTo = (i) => setIdx(Math.max(0, Math.min(images.length - 1, i)));

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const activeSlide = track.children[idx];
    if (activeSlide) {
      track.scrollTo({ left: activeSlide.offsetLeft - 16, behavior: "smooth" });
    }
  }, [idx]);

  const onPointerDown = (e) => {
    isDragging.current = true;
    startX.current = e.clientX;
    scrollX.current = trackRef.current.scrollLeft;
    trackRef.current.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!isDragging.current) return;
    trackRef.current.scrollLeft = scrollX.current - (e.clientX - startX.current);
  };
  const onPointerUp = (e) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const delta = e.clientX - startX.current;
    if (Math.abs(delta) > 30) goTo(idx + (delta < 0 ? 1 : -1));
    else goTo(idx);
  };

  return (
    <div className="room-carousel-wrapper">
      <div className="room-carousel-header">
        <span className="room-carousel-label">Room Views</span>
        <div className="fp-arrows">
          <button
            className="fp-arrow-btn"
            onClick={() => goTo(idx - 1)}
            disabled={idx === 0}
            aria-label="Previous room"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            className="fp-arrow-btn"
            onClick={() => goTo(idx + 1)}
            disabled={idx === images.length - 1}
            aria-label="Next room"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
      <div
        ref={trackRef}
        className="room-track"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {images.map((img, i) => (
          <div
            key={i}
            className={`room-slide${i === idx ? " room-slide--active" : ""}`}
            onClick={() => goTo(i)}
          >
            <img src={img.src} alt={img.label} className="room-slide-img" draggable={false} />
            <div className="room-slide-label">{img.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Collapsible/expandable details panel. */
function DetailsPanel({ plan, activeBHK, activeType, onTypeChange, collapsed, onToggle }) {
  return (
    <div className={`fp-details-panel ${collapsed ? "fp-details-panel--collapsed" : "fp-details-panel--expanded"}`}>
      {/* Header with toggle */}
      <div className="fp-details-header">
        <div className="fp-details-title-group">
          <h3 className="fp-details-title">
            {collapsed ? BHK_LABELS[activeBHK] : plan.title}
          </h3>
          {!collapsed && <div className="fp-details-accent" />}
        </div>
        <button
          className="fp-collapse-btn"
          onClick={onToggle}
          aria-label={collapsed ? "Expand details" : "Collapse details"}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          {!collapsed && <span className="fp-collapse-btn-text">Collapse</span>}
        </button>
      </div>

      {/* Collapsible body */}
      <div className={`fp-details-body${collapsed ? " fp-details-body--hidden" : ""}`}>
        {/* Unified Premium Type Switcher placed cleanly inside the panel */}
        <div className="fp-type-container">
          {Object.keys(floorPlanDetails[activeBHK]).map((type) => (
            <button
              key={type}
              onClick={() => onTypeChange(type)}
              className={`fp-type-tab${activeType === type ? " fp-type-tab--active" : ""}`}
            >
              {TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        {/* Compact Spec Grid */}
        <div className="fp-spec-grid">
          <div className="fp-detail-row">
            <span className="fp-detail-label">Built-up Area</span>
            <span className="fp-detail-value">{plan.builtUpArea}</span>
          </div>
          <div className="fp-detail-row">
            <span className="fp-detail-label">Ceiling Height</span>
            <span className="fp-detail-value">{plan.ceilingHeight}</span>
          </div>
          <div className="fp-detail-row">
            <span className="fp-detail-label">Main Door Facing</span>
            <span className="fp-detail-value">{plan.mainDoorFacing}</span>
          </div>
          <div className="fp-detail-row fp-detail-row--kitchen">
            <div>
              <span className="fp-detail-label">Modular Kitchen</span>
              <span className="fp-detail-value">{plan.modularKitchen}</span>
            </div>
            <div className="fp-check-badge">
              <Check size={12} />
            </div>
          </div>
        </div>

        <button className="fp-link-btn">View Room-Wise Measurements →</button>

        <Button className="fp-cta-btn">
          Add to MyList
        </Button>
      </div>

      {/* Highly polished, compact collapsed summary badges */}
      {collapsed && (
        <div className="fp-details-summary">
          <div className="fp-summary-badge">
            <span className="fp-summary-label">Area</span>
            <span className="fp-summary-val">{plan.builtUpArea.split(" ")[0]} sqft</span>
          </div>
          <div className="fp-summary-badge">
            <span className="fp-summary-label">Facing</span>
            <span className="fp-summary-val">{plan.mainDoorFacing}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────

const ExistingFloorPlansSection = ({ projectData }) => {
  const [activeBHK,  setActiveBHK]  = useState("3bhk");
  const [activeType, setActiveType] = useState("type-i");
  const [slideIdx,   setSlideIdx]   = useState(0);
  const [collapsed,  setCollapsed]  = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);

  const dialogRef = useRef(null);

  useEffect(() => {
    if (zoomedImage && dialogRef.current) {
      dialogRef.current.showModal();
    }
  }, [zoomedImage]);

  // Media from DB
  const { urls: floorPlanUrls, loading: mediaLoading } = useMedia(
    "project",
    projectData?.id ?? null,
    "floor_plan"
  );
  const hasMediaPlans = floorPlanUrls.length > 0;

  // Group the dynamic floor plan URLs by BHK type
  const dynamicBHKGroups = {
    "2bhk": [],
    "3bhk": [],
    "4bhk": []
  };

  if (hasMediaPlans) {
    floorPlanUrls.forEach((url, index) => {
      const urlLower = url.toLowerCase();
      if (urlLower.includes("2bhk") || urlLower.includes("2-bhk") || urlLower.includes("2_bhk") || urlLower.includes("2 bhk")) {
        dynamicBHKGroups["2bhk"].push({ src: url, label: `2 BHK Plan ${dynamicBHKGroups["2bhk"].length + 1}` });
      } else if (urlLower.includes("3bhk") || urlLower.includes("3-bhk") || urlLower.includes("3_bhk") || urlLower.includes("3 bhk")) {
        dynamicBHKGroups["3bhk"].push({ src: url, label: `3 BHK Plan ${dynamicBHKGroups["3bhk"].length + 1}` });
      } else if (urlLower.includes("4bhk") || urlLower.includes("4-bhk") || urlLower.includes("4_bhk") || urlLower.includes("4 bhk")) {
        dynamicBHKGroups["4bhk"].push({ src: url, label: `4 BHK Plan ${dynamicBHKGroups["4bhk"].length + 1}` });
      } else {
        // Fallback distribution by index
        const bhkKeys = ["2bhk", "3bhk", "4bhk"];
        const targetBhk = bhkKeys[index % 3];
        dynamicBHKGroups[targetBhk].push({ src: url, label: `${BHK_LABELS[targetBhk]} Plan ${dynamicBHKGroups[targetBhk].length + 1}` });
      }
    });
  }

  // Build slides for active BHK
  const activeBhkDynamicSlides = hasMediaPlans ? dynamicBHKGroups[activeBHK] : [];
  const slides = activeBhkDynamicSlides.length > 0
    ? activeBhkDynamicSlides
    : Object.entries(floorPlanDetails[activeBHK]).map(([key, val]) => ({
        src: val.img,
        label: TYPE_LABELS[key],
      }));

  const handleBHKChange = (bhk) => {
    setActiveBHK(bhk);
    setActiveType("type-i");
    setSlideIdx(0);
  };

  const handleSlideChange = (idx) => {
    setSlideIdx(idx);
    // Sync type selector to the visible slide (static mode or dynamic mode)
    const typeKeys = Object.keys(floorPlanDetails[activeBHK]);
    if (typeKeys[idx]) {
      setActiveType(typeKeys[idx]);
    }
  };

  const handleTypeChange = (type) => {
    setActiveType(type);
    const idx = Object.keys(floorPlanDetails[activeBHK]).indexOf(type);
    if (idx >= 0) {
      // Limit selection index to available slides
      const maxIdx = slides.length - 1;
      setSlideIdx(Math.min(idx, maxIdx));
    }
  };

  const plan = floorPlanDetails[activeBHK][activeType];

  return (
    <>
      {/* ── Inline styles scoped to this section ── */}
      <style>{`
        /* ── Section wrapper ── */
        .fp-section {
          width: 100%;
          max-width: 80rem;
          margin: 0 auto;
          padding: 2.5rem 1rem 3rem;
          background: #fff;
        }
        /* ── Section heading ── */
        .fp-heading-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
        }
        .fp-heading-line {
          width: 2.5rem;
          height: 2px;
          background: #9ca3af;
          flex-shrink: 0;
        }
        .fp-heading-text {
          font-size: 1.05rem;
          font-weight: 600;
          color: #111827;
          letter-spacing: 0.01em;
        }

        /* ── BHK Tabs (Premium Segmented Control) ── */
        .fp-bhk-container {
          display: inline-flex;
          background: #f3f4f6;
          padding: 0.25rem;
          border-radius: 9999px;
          border: 1px solid #e5e7eb;
          margin-bottom: 1.5rem;
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        .fp-bhk-tab {
          padding: 0.5rem 1.25rem;
          border-radius: 9999px;
          font-size: 0.85rem;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
          background: transparent;
          color: #4b5563;
          white-space: nowrap;
          outline: none;
        }
        .fp-bhk-tab:hover {
          color: #1e3a8a;
        }
        .fp-bhk-tab--active {
          background: #ffffff;
          color: #1e3a8a;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        /* ── Main content block ── */
        .fp-main-content {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          width: 100%;
        }

        /* ── Top row layout ── */
        .fp-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
          width: 100%;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @media (min-width: 1024px) {
          .fp-layout--expanded {
            grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
            align-items: start;
          }
          .fp-layout--collapsed {
            grid-template-columns: minmax(0, 1.76fr) minmax(0, 0.24fr);
            align-items: start;
          }
        }

        /* ── LEFT column ── */
        .fp-left {
          display: flex;
          flex-direction: column;
          width: 100%;
        }

        /* ── RIGHT column ── */
        .fp-right {
          display: flex;
          flex-direction: column;
          width: 100%;
        }

        /* ── Floor Plan Carousel ── */
        .fp-carousel-wrapper {
          background: #f0f4ff;
          border: 1.5px solid #c7d2fe;
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(30,58,138,0.08);
          width: 100%;
        }
        .fp-carousel-track {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
          padding: 1rem 1rem 0.5rem;
          cursor: grab;
          -webkit-overflow-scrolling: touch;
        }
        .fp-carousel-track::-webkit-scrollbar { display: none; }
        .fp-carousel-track:active { cursor: grabbing; }
        .fp-slide {
          flex: 0 0 88%;
          scroll-snap-align: start;
        }
        .fp-slide-inner {
          position: relative;
          border-radius: 0.6rem;
          overflow: hidden;
          background: #1e3a8a;
          border: 1.5px solid #3b5cc4;
          box-shadow: 0 3px 10px rgba(0,0,0,0.18);
          aspect-ratio: 4/3;
        }
        .fp-slide-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
          background: #1e3a8a;
          padding: 0.5rem;
        }
        /* Type tag on top-left */
        .fp-type-tag {
          position: absolute;
          top: 0.55rem;
          left: 0.55rem;
          background: rgba(0,0,0,0.55);
          color: #fff;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          padding: 0.2rem 0.55rem;
          border-radius: 999px;
          backdrop-filter: blur(4px);
          text-transform: uppercase;
        }
        /* Controls */
        .fp-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 1rem 0.75rem;
        }
        .fp-dots {
          display: flex;
          gap: 5px;
          align-items: center;
        }
        .fp-dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: #c7d2fe;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0;
        }
        .fp-dot--active {
          width: 18px;
          background: #1e3a8a;
        }
        .fp-arrows {
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }
        .fp-arrow-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 1.5px solid #c7d2fe;
          background: #fff;
          color: #1e3a8a;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.18s ease;
        }
        .fp-arrow-btn:hover:not(:disabled) {
          background: #1e3a8a;
          color: #fff;
          border-color: #1e3a8a;
        }
        .fp-arrow-btn:disabled {
          opacity: 0.35;
          cursor: default;
        }
        .fp-counter {
          font-size: 0.72rem;
          color: #6b7280;
          min-width: 2.5rem;
          text-align: center;
        }

        /* ── Room Carousel (Stretch full width below) ── */
        .fp-bottom-row {
          width: 100%;
        }
        .room-carousel-wrapper {
          background: #fafafa;
          border: 1.5px solid #e5e7eb;
          border-radius: 0.875rem;
          overflow: hidden;
          box-shadow: 0 1px 6px rgba(0,0,0,0.06);
          width: 100%;
        }
        .room-carousel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.65rem 1rem 0.5rem;
          border-bottom: 1px solid #e5e7eb;
        }
        .room-carousel-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #374151;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .room-track {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          scrollbar-width: none;
          padding: 0.75rem 1rem;
          -webkit-overflow-scrolling: touch;
          cursor: grab;
          width: 100%;
        }
        .room-track::-webkit-scrollbar { display: none; }
        .room-track:active { cursor: grabbing; }
        .room-slide {
          flex: 0 0 45%;
          border-radius: 0.5rem;
          overflow: hidden;
          border: 1.5px solid #e5e7eb;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #f3f4f6;
        }
        @media (min-width: 640px) {
          .room-slide {
            flex: 0 0 28%;
          }
        }
        @media (min-width: 1024px) {
          .room-slide {
            flex: 0 0 18.5%;
          }
        }
        .room-slide--active {
          border-color: #1e3a8a;
          box-shadow: 0 0 0 2px rgba(30, 58, 138, 0.15);
        }
        .room-slide-img {
          width: 100%;
          aspect-ratio: 16/10;
          object-fit: cover;
          display: block;
        }
        .room-slide-label {
          font-size: 0.68rem;
          font-weight: 600;
          color: #374151;
          padding: 0.35rem 0.5rem;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          background: #fff;
        }

        /* ── RIGHT: Details Panel ── */
        .fp-details-panel {
          background: #fff;
          border: 1.5px solid #e5e7eb;
          border-radius: 0.75rem;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .fp-details-panel--expanded {
          padding: 0.75rem;
        }
        .fp-details-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 0.6rem;
          border-bottom: 1px solid #f3f4f6;
          gap: 0.5rem;
        }
        .fp-details-title {
          font-size: 0.9rem;
          font-weight: 800;
          color: #1e3a8a;
          line-height: 1.2;
          margin: 0;
        }
        .fp-details-accent {
          width: 1.5rem;
          height: 3.5px;
          background: #2563eb;
          border-radius: 2px;
          margin-top: 0.3rem;
        }
        .fp-collapse-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.2rem;
          font-size: 0.65rem;
          font-weight: 700;
          color: #2563eb;
          background: #eff6ff;
          border: 1.5px solid #bfdbfe;
          border-radius: 999px;
          padding: 0.25rem 0.55rem;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }
        .fp-collapse-btn:hover {
          background: #dbeafe;
          border-color: #3b82f6;
        }
        /* Body */
        .fp-details-body {
          padding-top: 0.6rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .fp-details-body--hidden {
          display: none;
        }

        /* ── Compact Spec Grid ── */
        .fp-spec-grid {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }
        .fp-detail-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.4rem 0.55rem;
          background: #f9fafb;
          border-radius: 0.4rem;
          border: 1px solid #f3f4f6;
        }
        .fp-detail-label {
          font-size: 0.68rem;
          color: #6b7280;
          font-weight: 600;
        }
        .fp-detail-value {
          font-size: 0.76rem;
          color: #111827;
          font-weight: 700;
        }
        .fp-detail-row--kitchen {
          align-items: center;
        }
        .fp-detail-row--kitchen > div {
          display: flex;
          flex-direction: column;
          gap: 0.05rem;
        }
        .fp-check-badge {
          width: 20px;
          height: 20px;
          background: #22c55e;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          flex-shrink: 0;
        }
        .fp-link-btn {
          font-size: 0.72rem;
          color: #2563eb;
          font-weight: 700;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          padding: 0.1rem 0;
          transition: color 0.15s;
        }
        .fp-link-btn:hover { color: #1d4ed8; }
        .fp-cta-btn {
          width: 100%;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%) !important;
          color: #1e3a8a !important;
          border-radius: 9999px !important;
          font-weight: 700 !important;
          font-size: 0.78rem !important;
          padding: 0.5rem 1rem !important;
          box-shadow: 0 3px 8px rgba(251,191,36,0.3) !important;
          transition: all 0.2s ease !important;
          border: none !important;
          cursor: pointer !important;
        }
        .fp-cta-btn:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 5px 12px rgba(251,191,36,0.4) !important;
        }

        /* ── Collapsed details layout adjustments ── */
        .fp-details-panel--collapsed {
          padding: 0.5rem;
        }
        .fp-details-panel--collapsed .fp-details-header {
          border-bottom: none;
          padding-bottom: 0;
        }
        .fp-details-panel--collapsed .fp-details-title {
          font-size: 0.78rem;
          font-weight: 800;
        }
        .fp-details-panel--collapsed .fp-collapse-btn {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          padding: 0;
        }
        .fp-details-summary {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          padding: 0.5rem 0.15rem 0.15rem;
          border-top: 1px solid #f3f4f6;
          margin-top: 0.4rem;
        }
        .fp-summary-badge {
          display: flex;
          flex-direction: column;
          background: #f9fafb;
          border-radius: 0.35rem;
          padding: 0.25rem 0.4rem;
          border: 1px solid #f3f4f6;
        }
        .fp-summary-badge .fp-detail-label {
          font-size: 0.6rem;
          font-weight: 500;
          color: #9ca3af;
          margin-bottom: 0.05rem;
        }
        .fp-summary-val {
          font-size: 0.68rem;
          font-weight: 700;
          color: #374151;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ── Unified Premium Type Switcher ── */
        .fp-type-container {
          display: flex;
          background: #f3f4f6;
          padding: 2px;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          width: 100%;
        }
        .fp-type-tab {
          flex: 1;
          text-align: center;
          padding: 0.3rem 0.4rem;
          font-size: 0.72rem;
          font-weight: 700;
          color: #4b5563;
          border-radius: 4px;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          outline: none;
        }
        .fp-type-tab:hover {
          color: #1e3a8a;
        }
        .fp-type-tab--active {
          background: #ffffff;
          color: #1e3a8a;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }

        /* ── Loading skeleton ── */
        .fp-skeleton {
          height: 320px;
          border-radius: 1rem;
          background: linear-gradient(90deg, #f0f4ff 25%, #dde4fa 50%, #f0f4ff 75%);
          background-size: 200% 100%;
          animation: fp-shimmer 1.5s infinite;
        }
        @keyframes fp-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @media (max-width: 640px) {
          .fp-section { padding: 1.5rem 0.75rem 2rem; }
          .fp-slide { flex: 0 0 85%; }
          .fp-slide-inner { aspect-ratio: 1.15; } /* increase length of floor plan slightly */
          .room-slide { flex: 0 0 52%; }
          .room-slide-img { aspect-ratio: 4/3; } /* increase length of rooms pic slightly */
          .fp-details-panel { border-radius: 0.75rem; }

          /* Make Floor Plan details section more compact on mobile */
          .fp-details-panel--expanded {
            padding: 0.55rem;
          }
          .fp-details-body {
            gap: 0.45rem;
          }
          .fp-type-tab {
            padding: 0.25rem 0.35rem;
            font-size: 0.68rem;
          }
          .fp-spec-grid {
            gap: 0.3rem;
          }
          .fp-detail-row {
            padding: 0.3rem 0.45rem;
          }
          .fp-detail-label {
            font-size: 0.62rem;
          }
          .fp-detail-value {
            font-size: 0.7rem;
          }
          .fp-link-btn {
            font-size: 0.68rem;
            padding: 0.05rem 0;
          }
          .fp-cta-btn {
            font-size: 0.74rem !important;
            padding: 0.4rem 0.8rem !important;
          }
        }

        /* ── Zoom Dialog styles ── */
        .fp-zoom-dialog {
          border: none;
          background: transparent;
          padding: 0;
          max-width: 90vw;
          max-height: 90vh;
          outline: none;
          overflow: visible;
          border-radius: 0.75rem;
        }
        .fp-zoom-dialog::backdrop {
          background-color: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(4px);
        }
        .fp-zoom-dialog-content {
          position: relative;
          background: #fff;
          padding: 0.5rem;
          border-radius: 0.75rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .fp-zoom-img {
          max-width: 100%;
          max-height: 80vh;
          object-fit: contain;
          border-radius: 0.5rem;
          display: block;
        }
        .fp-zoom-close-btn {
          position: absolute;
          top: -1.25rem;
          right: -1.25rem;
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 50%;
          background: #fff;
          border: 1px solid #e5e7eb;
          color: #1f2937;
          font-size: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: all 0.2s;
          z-index: 50;
          line-height: 1;
        }
        .fp-zoom-close-btn:hover {
          background: #f3f4f6;
          color: #000;
          transform: scale(1.05);
        }
        @media (max-width: 640px) {
          .fp-zoom-close-btn {
            top: 0.5rem;
            right: 0.5rem;
            width: 2rem;
            height: 2rem;
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(4px);
          }
        }
      `}</style>

      <section id="floor-plans" className="fp-section">

        {/* ── Section heading ── */}
        <div className="fp-heading-row">
          <div className="fp-heading-line" />
          <h2 className="fp-heading-text">Floor Plans</h2>
        </div>

        {/* ── BHK Tabs – Left aligned premium pill container ── */}
        <div className="fp-bhk-container">
          {Object.keys(floorPlanDetails).map((bhk) => (
            <button
              key={bhk}
              onClick={() => handleBHKChange(bhk)}
              className={`fp-bhk-tab${activeBHK === bhk ? " fp-bhk-tab--active" : ""}`}
            >
              {BHK_LABELS[bhk]}
            </button>
          ))}
        </div>

        {/* ── Loading state ── */}
        {mediaLoading && <div className="fp-skeleton" />}

        {/* ── Main layout ── */}
        {!mediaLoading && (
          <div className="fp-main-content">
            
            {/* Top row: Floor plans and details panel */}
            <div className={`fp-layout ${collapsed ? "fp-layout--collapsed" : "fp-layout--expanded"}`}>

              {/* LEFT: Floor plan carousel */}
              <div className="fp-left">
                <FloorPlanCarousel
                  slides={slides}
                  activeIndex={slideIdx}
                  onIndexChange={handleSlideChange}
                  onImageClick={(slide) => setZoomedImage(slide.src)}
                />
              </div>

              {/* RIGHT: Details panel */}
              <div className="fp-right">
                <DetailsPanel
                  plan={plan}
                  activeBHK={activeBHK}
                  activeType={activeType}
                  onTypeChange={handleTypeChange}
                  collapsed={collapsed}
                  onToggle={() => setCollapsed((c) => !c)}
                />
              </div>

            </div>

            {/* Bottom Row: Room views spanning full width of the container */}
            <div className="fp-bottom-row">
              <RoomCarousel images={DEFAULT_ROOM_IMAGES} />
            </div>

          </div>
        )}

      </section>

      {zoomedImage && (
        <dialog
          ref={dialogRef}
          closedby="any"
          onClose={() => setZoomedImage(null)}
          onClick={(e) => {
            if (e.target === dialogRef.current) {
              dialogRef.current.close();
            }
          }}
          className="fp-zoom-dialog"
          aria-label="Zoomed floor plan"
        >
          <div className="fp-zoom-dialog-content">
            <img src={zoomedImage} alt="Zoomed floor plan" className="fp-zoom-img" />
            <button className="fp-zoom-close-btn" onClick={() => dialogRef.current?.close()}>
              &times;
            </button>
          </div>
        </dialog>
      )}
    </>
  );
};

export default ExistingFloorPlansSection;
