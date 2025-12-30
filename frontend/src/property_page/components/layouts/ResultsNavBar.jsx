import React, { useState, useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";

const ResultsNavBar = ({ overviewRef, floorPlansRef, amenitiesRef, mapRef }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [mainNavbarHeight, setMainNavbarHeight] = useState(80);
  const [isSticky, setIsSticky] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const navRef = useRef(null);
  const navbarInitialTop = useRef(0);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    const updateMainNavbarHeight = () => {
      const mainNavbar = document.querySelector('.fixed.top-0');
      if (mainNavbar) {
        setMainNavbarHeight(mainNavbar.offsetHeight);
      }
    };

    const updateNavbarPosition = () => {
      if (navRef.current && navbarInitialTop.current === 0) {
        navbarInitialTop.current = navRef.current.offsetTop;
      }
    };

    checkMobile();
    updateMainNavbarHeight();
    updateNavbarPosition();
    
    window.addEventListener('resize', checkMobile);
    window.addEventListener('resize', updateMainNavbarHeight);
    window.addEventListener('load', updateNavbarPosition);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('resize', updateMainNavbarHeight);
      window.removeEventListener('load', updateNavbarPosition);
    };
  }, []);

  // Handle sticky behavior and active section detection
  useEffect(() => {
    const handleScroll = () => {
      // Sticky behavior
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const shouldBeSticky = scrollTop > navbarInitialTop.current - mainNavbarHeight;
      setIsSticky(shouldBeSticky);

      // Active section detection - fixed logic
      const navHeight = navRef.current?.offsetHeight || 60;
      const triggerPoint = mainNavbarHeight + navHeight + 50;
      
      const sections = [
        { ref: overviewRef, name: 'overview' },
        { ref: floorPlansRef, name: 'floor-plans' },
        { ref: amenitiesRef, name: 'amenities' },
        { ref: mapRef, name: 'map' }
      ];

      // Check for "Read More" section first
      const readMoreElement = document.getElementById('read-more');
      if (readMoreElement) {
        const readMoreRect = readMoreElement.getBoundingClientRect();
        if (readMoreRect.top <= triggerPoint) {
          setActiveSection('read-more');
          return;
        }
      }

      // Find the currently active section
      let currentSection = 'overview'; // default
      
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        if (section.ref?.current) {
          const rect = section.ref.current.getBoundingClientRect();
          
          // If section top is above or at trigger point, it's potentially active
          if (rect.top <= triggerPoint) {
            currentSection = section.name;
          } else {
            // Once we find a section that's below trigger point, stop
            break;
          }
        }
      }
      
      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mainNavbarHeight, overviewRef, floorPlansRef, amenitiesRef, mapRef]); 

  const calculateOffset = () => {
    const footerNavBar = document.querySelector('.fixed.top-0'); // Assuming FooterNavBar is the fixed element at top
    let totalOffset = 0;
    if (footerNavBar) {
      totalOffset += footerNavBar.offsetHeight;
    }
    // For desktop (top-sticky), we need the combined height of fixed navs for correct scroll offset.
    // For mobile (bottom-sticky), the offset calculation for scroll is handled in scrollToSection directly.
    return isMobile ? 0 : totalOffset + (navRef.current?.offsetHeight || 0) + 16;
  };

  const scrollToSection = (targetRef) => {
    if (!targetRef?.current) return;
    
    const offset = calculateOffset(); 
    const elementTop = targetRef.current.getBoundingClientRect().top;
    
    let offsetPosition;
    if (isMobile) {
      // For bottom-sticky on mobile, ensure target section is visible above the fixed nav
      offsetPosition = elementTop + window.pageYOffset - (window.innerHeight - (navRef.current?.offsetHeight || 0) - 16); // 16px extra margin
    } else {
      // For top-sticky on desktop
      offsetPosition = elementTop + window.pageYOffset - offset;
    }
    
    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth"
    });
  };

  const scrollToReadMore = () => {
    const element = document.getElementById('read-more');
    if (!element) return;
    
    const offset = calculateOffset(); 
    const elementTop = element.getBoundingClientRect().top;

    let offsetPosition;
    if (isMobile) {
      offsetPosition = elementTop + window.pageYOffset - (window.innerHeight - (navRef.current?.offsetHeight || 0) - 16);
    } else {
      offsetPosition = elementTop + window.pageYOffset - offset;
    }
    
    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth"
    });
  };

  return (
    <>
      {/* Placeholder for sticky nav on desktop to prevent content jump */}
      {isSticky && !isMobile && <div style={{ height: navRef.current?.offsetHeight || 60 }} />}
      
      <div 
        ref={navRef} 
        className={`z-40 bg-white shadow-md border-b-2 border-gray-200 transition-all duration-300
          ${
            isSticky 
              ? isMobile 
                ? 'fixed bottom-0 left-0 right-0 border-t-2' 
                : 'fixed left-0 right-0'
              : 'relative'
          }
        `}
        style={isSticky && !isMobile ? { top: `${mainNavbarHeight}px` } : {}}
      >
        <div className="px-4 sm:px-8 lg:px-16 py-3 sm:py-4 min-h-[60px] flex items-center">
          <div className="w-full flex flex-col lg:flex-row items-start lg:items-center justify-between lg:justify-center gap-2 lg:gap-0">
            {/* Desktop Search Info */}
            <div className="hidden lg:flex items-center gap-4 lg:absolute lg:left-16">
              <div className="flex items-center gap-2 text-gray-700">
                <span className="text-sm font-medium whitespace-nowrap">Results for your search</span>
                <ArrowRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
              </div>
            </div>
            
            {/* Mobile Search Info */}
            <div className="lg:hidden flex items-center gap-2 text-gray-700 mb-1">
              <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Property Details</span>
            </div>
            
            {/* Desktop Navigation - Centered */}
            <div className="hidden lg:flex items-center gap-3 xl:gap-6">
              <button 
                onClick={() => scrollToSection(overviewRef)} 
                className={`px-2 xl:px-3 py-2 font-semibold text-xs xl:text-sm rounded-lg transition-colors whitespace-nowrap ${
                  activeSection === 'overview' 
                    ? 'bg-blue-100 text-blue-900' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                Overview
              </button>
              <div className="w-px h-4 bg-gray-300"></div>
              <button 
                onClick={() => scrollToSection(floorPlansRef)} 
                className={`px-2 xl:px-3 py-2 font-semibold text-xs xl:text-sm rounded-lg transition-colors whitespace-nowrap ${
                  activeSection === 'floor-plans' 
                    ? 'bg-blue-100 text-blue-900' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                Floor Plans
              </button>
              <div className="w-px h-4 bg-gray-300"></div>
              <button 
                onClick={() => scrollToSection(amenitiesRef)} 
                className={`px-2 xl:px-3 py-2 font-semibold text-xs xl:text-sm rounded-lg transition-colors whitespace-nowrap ${
                  activeSection === 'amenities' 
                    ? 'bg-blue-100 text-blue-900' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                Amenities
              </button>
              <div className="w-px h-4 bg-gray-300"></div>
              <button 
                onClick={() => scrollToSection(mapRef)} 
                className={`px-2 xl:px-3 py-2 font-semibold text-xs xl:text-sm rounded-lg transition-colors whitespace-nowrap ${
                  activeSection === 'map' 
                    ? 'bg-blue-100 text-blue-900' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                Map
              </button>
              <div className="w-px h-4 bg-gray-300"></div>
              <button 
                onClick={scrollToReadMore} 
                className={`px-2 xl:px-3 py-2 font-semibold text-xs xl:text-sm rounded-lg transition-colors whitespace-nowrap ${
                  activeSection === 'read-more' 
                    ? 'bg-blue-100 text-blue-900' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                Read More
              </button>
            </div>

            {/* Mobile Navigation */}
            <div className="lg:hidden w-full flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
              <button 
                onClick={() => scrollToSection(overviewRef)} 
                className={`px-2.5 py-1.5 font-semibold text-xs rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeSection === 'overview' 
                    ? 'bg-blue-100 text-blue-900' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                Overview
              </button>
              <button 
                onClick={() => scrollToSection(floorPlansRef)} 
                className={`px-2.5 py-1.5 font-semibold text-xs rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeSection === 'floor-plans' 
                    ? 'bg-blue-100 text-blue-900' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                Plans
              </button>
              <button 
                onClick={() => scrollToSection(amenitiesRef)} 
                className={`px-2.5 py-1.5 font-semibold text-xs rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeSection === 'amenities' 
                    ? 'bg-blue-100 text-blue-900' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                Amenities
              </button>
              <button 
                onClick={() => scrollToSection(mapRef)} 
                className={`px-2.5 py-1.5 font-semibold text-xs rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeSection === 'map' 
                    ? 'bg-blue-100 text-blue-900' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                Map
              </button>
              <button 
                onClick={scrollToReadMore} 
                className="px-2.5 py-1.5 text-gray-600 font-semibold text-xs hover:bg-gray-100 hover:text-gray-900 transition-colors whitespace-nowrap rounded-lg flex-shrink-0"
              >
                More
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResultsNavBar;