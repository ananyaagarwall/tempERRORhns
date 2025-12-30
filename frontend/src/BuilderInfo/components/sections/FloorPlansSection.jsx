import React, { useState } from 'react';

const WhyBuilderSection = () => {
  return (
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
};

const FloorPlansSection = () => {
  const [activeIdx, setActiveIdx] = useState(1);

  // Sample floor plan data
  const floorPlans = [
    {
      title: "Neelkanth Palm Avenue",
      subtitle: "Visit this Project",
      image: "/palm.jpg",
      projectName: "Vashi",
      bhkInfo: "2 - 4 BHK Flats"
    },
    {
      title: "Neelkanth Palm Avenue",
      subtitle: "Possession in 2027",
      image: "/palm.jpg",
      projectName: "Ghansoli",
      bhkInfo: "2 - 4 BHK Flats",
      price: "@₹20k per sq.ft.",
      location: "New block road, Nenar pin, Ghansoli west",
      tag: "Ongoing Project"
    },
    {
      title: "Neelkanth Palm Avenue",
      subtitle: "Visit this Project",
      image: "/palm.jpg",
      projectName: "Vashi",
      bhkInfo: "2 - 4 BHK Flats",
      price: "@₹60k per sq.ft."
    },
    {
      title: "Neelkanth Palm Avenue",
      subtitle: "Visit this Project",
      image: "/palm.jpg",
      projectName: "Vashi",
      bhkInfo: "2 - 4 BHK Flats",
      price: "@₹60k per sq.ft."
    },
    {
      title: "Neelkanth Palm Avenue",
      subtitle: "New Project",
      image: "/palm.jpg",
      projectName: "Nerul",
      bhkInfo: "3 - 5 BHK Flats",
      price: "@₹80k per sq.ft.",
      location: "Premium location, Nerul east"
    }
  ];

  const handlePrevious = () => {
    setActiveIdx((prevIdx) => (prevIdx === 0 ? floorPlans.length - 1 : prevIdx - 1));
  };

  const handleNext = () => {
    setActiveIdx((prevIdx) => (prevIdx === floorPlans.length - 1 ? 0 : prevIdx + 1));
  };

  const handleCardClick = (idx) => {
    setActiveIdx(idx);
  };

  return (
    <div>
      {/* Floor Plans Section */}
      <div className="my-6 xs:my-7 sm:my-8">
        <div className="flex items-center mb-4 xs:mb-5 sm:mb-6 px-2 xs:px-3 sm:px-0">
          <h2 className="ml-2 xs:ml-3 builder-section-heading ">Existing in demand floor plans</h2>
        </div>

        {/* Mobile & Tablet: Perfectly Responsive Horizontal Scroll */}
        <div className="block lg:hidden">
          <div className="overflow-x-auto hide-scrollbar" style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            padding: '12px 0 20px 0',
            scrollSnapType: 'x mandatory'
          }}>
            <style>
              {`
                    .hide-scrollbar::-webkit-scrollbar {
                      display: none;
                    }
                    .hide-scrollbar {
                      -ms-overflow-style: none;
                      scrollbar-width: none;
                    }
                    
                    /* Extra small mobile phones (320px - 359px) */
                    @media (max-width: 359px) {
                      .mobile-card {
                        width: 220px !important;
                        height: 260px !important;
                      }
                      .mobile-card h3 {
                        font-size: 0.875rem !important;
                      }
                      .mobile-card h4 {
                        font-size: 1rem !important;
                      }
                      .mobile-card p {
                        font-size: 0.75rem !important;
                      }
                      .mobile-card .text-base {
                        font-size: 0.875rem !important;
                      }
                    }
                    
                    /* Small mobile phones (360px - 375px) */
                    @media (min-width: 360px) and (max-width: 375px) {
                      .mobile-card {
                        width: 240px !important;
                        height: 280px !important;
                      }
                    }
                    
                    /* Large mobile phones (376px - 480px) */
                    @media (min-width: 376px) and (max-width: 480px) {
                      .mobile-card {
                        width: 280px !important;
                        height: 320px !important;
                      }
                    }
                    
                    /* Tablets (481px - 768px) */
                    @media (min-width: 481px) and (max-width: 768px) {
                      .mobile-card {
                        width: 300px !important;
                        height: 340px !important;
                      }
                    }
                    
                    /* Small laptops (769px - 1024px) */
                    @media (min-width: 769px) and (max-width: 1024px) {
                      .mobile-card {
                        width: 320px !important;
                        height: 360px !important;
                      }
                    }
                  `}
            </style>

            <div className="floorplans-mobile-row flex gap-3 xs:gap-4" style={{
              width: 'max-content',
              padding: '0 16px',
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'smooth'
            }}>
              {floorPlans.map((floorPlan, idx) => (
                <div
                  key={idx}
                  className="mobile-card flex-shrink-0 rounded-xl xs:rounded-xl sm:rounded-xl overflow-hidden shadow-lg"
                  style={{
                    width: '260px',
                    height: '300px',
                    border: '2px solid #1e3a8a',
                    borderRadius: '12px',
                    scrollSnapAlign: 'start',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    backgroundColor: 'white',
                    transition: 'transform 0.2s ease-in-out'
                  }}
                  onClick={() => handleCardClick(idx)}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div className="relative h-full">
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${floorPlan.image})` }}
                    ></div>
                    <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                    <div className="relative h-full flex flex-col justify-between p-3 xs:p-4 text-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm xs:text-base font-serif mb-1">{floorPlan.title}</h3>
                          <p className="text-xxs xs:text-xs opacity-90">{floorPlan.subtitle}</p>
                        </div>
                        {floorPlan.tag && (
                          <span className="bg-yellow-400 text-black text-xxs xs:text-xs font-serif px-2 py-1 rounded-full">
                            {floorPlan.tag}
                          </span>
                        )}
                      </div>

                      <div className="bg-black bg-opacity-50 rounded-lg p-2 xs:p-3 backdrop-blur-sm">
                        <h4 className="text-base xs:text-lg font-var(--hns-sans) mb-1">{floorPlan.projectName}</h4>
                        <p className="text-xs xs:text-sm mb-1">{floorPlan.bhkInfo}</p>
                        <p className="text-sm xs:text-base font-var(--hns-sans) text-yellow-300 mb-2">{floorPlan.price}</p>
                        {floorPlan.location && (
                          <div className="flex items-center text-xxs xs:text-xs opacity-90">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="xs:w-3 xs:h-3">
                              <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M12 22C16 18 20 14.4183 20 10C20 5.58172 16.4183 2 12 2C7.58172 2 4 5.58172 4 10C4 14.4183 8 18 12 22Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="ml-1">{floorPlan.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll Indicators */}
          <div className="flex justify-center mt-3 xs:mt-4 mb-4 xs:mb-6">
            <div className="flex space-x-1.5 xs:space-x-2">
              {floorPlans.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 xs:w-2 xs:h-2 rounded-full transition-all duration-300 ${idx === activeIdx ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: 3D Carousel */}
      <div className="relative p-4 xs:p-5 sm:p-6 hidden lg:block" style={{ border: '2px solid #1e3a8a', borderRadius: '8px', marginTop: '24px' }}>
        {/* Navigation Buttons */}
        <button
          onClick={handlePrevious}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-white rounded-full w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 flex items-center justify-center shadow-md hover:shadow-lg transition-all"
          aria-label="Previous"
          style={{ left: '20px', zIndex: 40 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="xs:w-4 xs:h-4 sm:w-5 sm:h-5">
            <path d="M15 18L9 12L15 6" stroke="#223A5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button
          onClick={handleNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-white rounded-full w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 flex items-center justify-center shadow-md hover:shadow-lg transition-all"
          aria-label="Next"
          style={{ right: '20px', zIndex: 40 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="xs:w-4 xs:h-4 sm:w-5 sm:h-5">
            <path d="M9 18L15 12L9 6" stroke="#223A5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Cards Container */}
        <div className="flex items-center justify-center relative" style={{ minHeight: '320px', perspective: '1000px' }}>
          {floorPlans.map((floorPlan, idx) => {
            // Calculate offset from active card
            let offset = idx - activeIdx;

            // Handle circular wrapping for continuous carousel
            const totalCards = floorPlans.length;
            if (offset < -2) offset += totalCards;
            if (offset > 2) offset -= totalCards;

            // Show only 5 cards: active + 2 on each side
            if (Math.abs(offset) > 2 && Math.abs(offset) < totalCards - 2) return null;

            let translateX = 0;
            let translateZ = 0;
            let scale = 1;
            let zIndex = 20;
            let opacity = 1;
            let rotateY = 0;

            if (offset === -2) {
              // Far left card (2nd from active)
              translateX = -320;
              translateZ = -100;
              scale = 0.7;
              zIndex = 5;
              opacity = 0.8;
              rotateY = 15;
            } else if (offset === -1) {
              // Near left card (1st from active)
              translateX = -160;
              translateZ = -50;
              scale = 0.85;
              zIndex = 15;
              opacity = 0.9;
              rotateY = 10;
            } else if (offset === 0) {
              // Active center card
              translateX = 0;
              translateZ = 0;
              scale = 1;
              zIndex = 25;
              opacity = 1;
              rotateY = 0;
            } else if (offset === 1) {
              // Near right card (1st from active)
              translateX = 160;
              translateZ = -50;
              scale = 0.85;
              zIndex = 15;
              opacity = 0.9;
              rotateY = -10;
            } else if (offset === 2) {
              // Far right card (2nd from active)
              translateX = 320;
              translateZ = -100;
              scale = 0.7;
              zIndex = 5;
              opacity = 0.8;
              rotateY = -15;
            }

            return (
              <div
                key={idx}
                className="absolute rounded-xl xs:rounded-xl sm:rounded-xl overflow-hidden shadow-lg transition-all duration-500"
                style={{
                  width: '280px',
                  height: '320px',
                  border: '4px solid #1e3a8a',
                  borderRadius: '16px',
                  zIndex,
                  opacity: 1,
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: `translateX(-50%) scale(${scale}) translateX(${translateX}px)`,
                  transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                }}
                onClick={() => setActiveIdx(idx)}
              >
                <div className="relative h-full">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${floorPlan.image})` }}
                  ></div>
                  <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                  <div className="relative h-full flex flex-col justify-between p-3 xs:p-4 text-white">
                    <div>
                      <h3 className="text-base xs:text-lg font-var(--hns-sans)">{floorPlan.title}</h3>
                      <p className="text-xs xs:text-sm">{floorPlan.subtitle}</p>
                      {floorPlan.tag && (
                        <span className="absolute top-4 right-4 bg-yellow-400 text-black text-xs font-var(--hns-sans) px-3 py-1 rounded-full">
                          {floorPlan.tag}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-2xl font-serif">{floorPlan.projectName}</h4>
                      <p className="text-base">{floorPlan.bhkInfo}</p>
                      <p className="text-base font-var(--hns-sans)">{floorPlan.price}</p>
                      {floorPlan.location && (
                        <div className="flex items-center mt-2">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M12 22C16 18 20 14.4183 20 10C20 5.58172 16.4183 2 12 2C7.58172 2 4 5.58172 4 10C4 14.4183 8 18 12 22Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="ml-1 text-xs">{floorPlan.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Why Builder Section */}
      <WhyBuilderSection />
    </div>
  );
};

export default FloorPlansSection;