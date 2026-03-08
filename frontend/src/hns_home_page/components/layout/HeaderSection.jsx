import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FaSearch, FaBars, FaTimes, FaHome, FaBuilding, FaRegFileAlt, FaEnvelope, FaUser, FaUserCircle, FaRegUserCircle } from 'react-icons/fa';
import headerBg from '../../../assets/Header.img1.gradient1.png'; 
import { Link, useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton, useUser, SignInButton } from '@clerk/clerk-react';
import '../../home_page_css/HeaderSection.css'; 

const HeaderSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const navigate = useNavigate();
  // const [activeMenu, setActiveMenu] = useState('Projects');
  const { user } = useUser();
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  // Price slider state (single slider for max price)
  const [priceRange, setPriceRange] = useState(0); // 0 means "All Range"
  const [showPriceRangeSlider, setShowPriceRangeSlider] = useState(false);
  const [isSearchbarExpanded, setIsSearchbarExpanded] = useState(false);
  // Budget Min/Max for mobile & tablet
  const [minBudget, setMinBudget] = useState(null); // null => No Min
  const [maxBudget, setMaxBudget] = useState(null); // null => No Max
  const [showMinDropdown, setShowMinDropdown] = useState(false);
  const [showMaxDropdown, setShowMaxDropdown] = useState(false);
  const budgetOptions = [
    null,
    5, 10, 15, 20, 25, 30, 35, 40, 45, 50,
    55, 60, 70, 80, 90, 100, 125, 150, 175, 200,
  ]; // values in Lakhs (L); null represents No Min/No Max
  
  // BHK Type dropdown state
  const [selectedBhkTypes, setSelectedBhkTypes] = useState([]);
  const [showBhkDropdown, setShowBhkDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [showBhkMobile, setShowBhkMobile] = useState(false);
  const bhkTriggerRef = useRef(null);
  
  // Search type state (properties or builders)
  const [searchType, setSearchType] = useState('properties'); // 'properties' or 'builders'
  
  const bhkOptions = [
    { id: '1bhk', label: '1 BHK' },
    { id: '2bhk', label: '2 BHK' },
    { id: '3bhk', label: '3 BHK' },
    { id: '4bhk', label: '4 BHK' },
    { id: '4plus', label: '4+ BHK' }
  ];
  
  const formatCr = (val) => {
    if (val >= 50) return '₹50Cr+';
    if (val === 0) return '₹0';
    return `₹${val}Cr`;  // Fixed template literal syntax
  };

  const handlePriceRangeChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setPriceRange(value);
    console.log('Price range changed to:', value); // Debug log
  };

  const updateBhkDropdownPosition = () => {
    const triggerEl = bhkTriggerRef.current;
    if (!triggerEl) return;
    const rect = triggerEl.getBoundingClientRect();
    const dropdownHeight = 250;
      const spaceBelow = window.innerHeight - rect.bottom;
      const shouldShowAbove = spaceBelow < dropdownHeight || rect.bottom > window.innerHeight * 0.6;
      setDropdownPosition({
        top: shouldShowAbove ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        showAbove: shouldShowAbove
      });
  };

  const toggleBhkDropdown = () => {
    const next = !showBhkDropdown;
    setShowBhkDropdown(next);
    if (next) {
      updateBhkDropdownPosition();
    }
  };

  const handleBhkTypeToggle = (bhkId) => {
    setSelectedBhkTypes(prev => {
      if (prev.includes(bhkId)) {
        return prev.filter(id => id !== bhkId);
      } else {
        return [...prev, bhkId];
      }
    });
  };

  const getBhkDisplayText = () => {
    if (selectedBhkTypes.length === 0) return 'All Type';
    
    // Get selected options in order and format them
    const selectedOptions = bhkOptions
      .filter(option => selectedBhkTypes.includes(option.id))
      .map(option => option.label)
      .join(',');
    
    return selectedOptions;
  };

  const togglePriceRangeSlider = () => {
    const newState = !showPriceRangeSlider;
    setShowPriceRangeSlider(newState);
    setIsSearchbarExpanded(newState);
  };

  const formatBudgetLabel = (val, fallback) => {
    if (val === null || val === undefined) return fallback;
    if (val >= 100) {
      const cr = (val / 100).toFixed(val % 100 === 0 ? 0 : 1);
      return `₹ ${cr} Cr`;
    }
    return `₹ ${val} L`;
  };

  const handleSelectMin = (val) => {
    setMinBudget(val);
    setShowMinDropdown(false);
    if (maxBudget !== null && val !== null && val > maxBudget) {
      setMaxBudget(null);
    }
  };

  const handleSelectMax = (val) => {
    setMaxBudget(val);
    setShowMaxDropdown(false);
    if (minBudget !== null && val !== null && val < minBudget) {
      setMinBudget(null);
    }
  };

  const closePriceRange = () => {
    setShowPriceRangeSlider(false);
    setIsSearchbarExpanded(false);
  };

  const handleLogin = () => {/* your login logic here */};
  const handleSignup = () => {/* your signup logic here */};

  // Updated toggle function with scroll prevention
 const toggleMenu = () => {
  const newShowMenu = !showMenu;
  setShowMenu(newShowMenu);

  if (newShowMenu) {
    // Save current scroll position and lock body
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
  } else {
    // Restore scroll position
    const scrollY = document.body.style.top;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    window.scrollTo(0, parseInt(scrollY || '0') * -1);
  }
};

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    
    // Add click outside handler to close price range slider only
    const handleClickOutside = (event) => {
      const priceRangeDropdowns = document.querySelectorAll('.price-range-dropdown, .mobile-price-range-dropdown');
      const priceRangeTriggers = document.querySelectorAll('.price-range-trigger, .mobile-price-range-trigger');
      const priceRangeSliders = document.querySelectorAll('.simple-price-range-slider');
      const expandedContent = document.querySelector('.expanded-price-content');
      const bhkDropdowns = document.querySelectorAll('.bhk-dropdown');
      const bhkTriggers = document.querySelectorAll('.bhk-dropdown-trigger');
      
      let clickedInsideDropdown = false;
      priceRangeDropdowns.forEach(dropdown => {
        if (dropdown && dropdown.contains(event.target)) {
          clickedInsideDropdown = true;
        }
      });
      
      let clickedOnTrigger = false;
      priceRangeTriggers.forEach(trigger => {
        if (trigger && trigger.contains(event.target)) {
          clickedOnTrigger = true;
        }
      });
      
      let clickedOnSlider = false;
      priceRangeSliders.forEach(slider => {
        if (slider && slider.contains(event.target)) {
          clickedOnSlider = true;
        }
      });
      
      let clickedOnExpandedContent = false;
      if (expandedContent && expandedContent.contains(event.target)) {
        clickedOnExpandedContent = true;
      }
      
      let clickedOnBhkDropdown = false;
      bhkDropdowns.forEach(dropdown => {
        if (dropdown && dropdown.contains(event.target)) {
          clickedOnBhkDropdown = true;
        }
      });
      
      let clickedOnBhkTrigger = false;
      bhkTriggers.forEach(trigger => {
        if (trigger && trigger.contains(event.target)) {
          clickedOnBhkTrigger = true;
        }
      });
      
      // Close BHK dropdown if clicking outside
      if (!clickedOnBhkDropdown && !clickedOnBhkTrigger && showBhkDropdown) {
        setShowBhkDropdown(false);
      }
      
      // Don't close price range if clicking on trigger, dropdown, slider, or expanded content
      if (!clickedInsideDropdown && !clickedOnTrigger && !clickedOnSlider && !clickedOnExpandedContent && showPriceRangeSlider) {
        closePriceRange();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPriceRangeSlider, showBhkDropdown]);

  // Keep BHK dropdown anchored to trigger while scrolling/resizing
  useEffect(() => {
    if (!showBhkDropdown) return;
    const handleScroll = () => updateBhkDropdownPosition();
    const handleResize2 = () => updateBhkDropdownPosition();
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize2);
    // initial sync
    updateBhkDropdownPosition();
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize2);
    };
  }, [showBhkDropdown]);

  // Cleanup effect for body styles
useEffect(() => {
  return () => {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
  };
}, []);

  const bgImg = windowWidth <= 600 ? '/main-image.jpeg' : headerBg;
  const bgSize = windowWidth <= 600 ? 'contain' : 'cover';
  const bgRepeat = 'no-repeat';
  const bgPosition = 'center';

  const propertyData = [
    { name: "Lodha", location: "Lodha World Towers, Mumbai", score: "98%", img: "/lodha.jpg" },
    { name: "Kalpataru", location: "Kalpataru Residency, Pune", score: "95%", img: "/kalpa.jpg" },
    { name: "Rustomjee", location: "Rustomjee Seasons, Mumbai", score: "97%", img: "/rustomujee.jpg" },
    { name: "Presidential", location: "Presidential Towers, Bangalore", score: "96%", img: "/presidental.jpeg" },
  ];

  const handleCardClick = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % propertyData.length);
  };

  const isMobile = windowWidth <= 768;
  const isSmallMobile = windowWidth <= 350;
  const isTablet = windowWidth > 768 && windowWidth <= 1024;
  const isLaptop = windowWidth > 1024 && windowWidth <= 1440;
  const isDesktop = windowWidth > 1440;

  // Responsive navbar positioning and sizing
  const getNavbarStyles = () => {
    if (isMobile) {
      return {
        top: '20px',
        left: isSmallMobile ? '12px' : '20px',
        width: isSmallMobile ? 'calc(100% - 24px)' : 'calc(100% - 40px)',
        height: '56px',
        borderRadius: '16px',
        padding: isSmallMobile ? '0 8px' : '0 16px',
      };
    } else if (isTablet) {
      return {
        top: '24px',
        left: '24px',
        width: 'calc(100% - 48px)',
        height: '60px',
        borderRadius: '20px',
        padding: '0 20px',
      };
    } else if (isLaptop) {
      return {
        top: '32px',
        left: '32px',
        width: 'calc(100% - 64px)',
        height: '64px',
        borderRadius: '22px',
        padding: '0 24px',
      };
    } else {
      return {
        top: '36px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '1200px',
        height: '64px',
        borderRadius: '22px',
        padding: '0 24px',
      };
    }
  };

  const navbarStyles = getNavbarStyles();
  const [location, setLocation] = useState("");

  // List of valid locations for autocorrect---------------------------------------------
  const VALID_LOCATIONS = ["Thane", "Ghansoli", "Airoli", "Koparkharaine"];


  function levenshtein(a, b) {
    const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        if (a[i - 1].toLowerCase() === b[j - 1].toLowerCase()) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = 1 + Math.min(matrix[i - 1][j], matrix[i][j - 1], matrix[i - 1][j - 1]);
        }
      }
    }
    return matrix[a.length][b.length];
  }

  function autocorrectLocation(input) {
    if (!input) return input;
    let best = VALID_LOCATIONS[0];
    let minDist = levenshtein(input, best);
    for (let i = 1; i < VALID_LOCATIONS.length; i++) {
      const dist = levenshtein(input, VALID_LOCATIONS[i]);
      if (dist < minDist) {
        minDist = dist;
        best = VALID_LOCATIONS[i];
      }
    }
    // Only autocorrect if the match is reasonably close (distance <= 3 or input is a substring)
    if (minDist <= 3 || VALID_LOCATIONS.some(loc => loc.toLowerCase().includes(input.toLowerCase()))) {
      return best;
    }
    return input;
  }

  return (
<div 
  className="header-section relative w-full text-white overflow-hidden"
  style={{
    backgroundImage: `url(${headerBg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    // CHANGED: If mobile, use 60vh, otherwise 100vh
    height: isMobile ? '60vh' : '100vh',           
    minHeight: isMobile ? '60dvh' : '100dvh',       
  }}
>

      {/* Main Navbar */}
     {!(isMobile && showMenu) && (
    <nav
      className="custom-navbar header-navbar"
      style={{
        position: 'absolute',
        ...navbarStyles,
        background: 'rgba(30, 48, 80, 0.18)',
        border: '1px solid rgba(255,255,255,0.35)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 50,
        boxSizing: 'border-box',
        boxShadow: '0 2px 16px rgba(34,58,95,0.10)',
      }}
    >
          {/* Logo inside navbar */}
          <img 
            src="/HouseNSeek.png" 
            alt="HouseNSeek Logo" 
            className="header-logo"
            style={{ 
              height: isMobile ? (isSmallMobile ? 24 : 28) : isTablet ? 32 : 36, 
              width: 'auto', 
              marginRight: isMobile ? (isSmallMobile ? 8 : 12) : isTablet ? 16 : 24, 
              marginLeft: 0, 
              zIndex: 31,
              flexShrink: 0
            }} 
          />

          {/* Desktop Navigation */}
          {!isMobile && (
            <div className="desktop-nav" style={{ 
              display: 'flex', 
              gap: isTablet ? 24 : isLaptop ? 32 : 40, 
              alignItems: 'center',
              flexWrap: 'nowrap',
              overflow: 'hidden'
            }}>
              <Link to="/builder" className="nav-link" style={{ 
                fontSize: isTablet ? '13px' : isLaptop ? '14px' : '16px'
              }}>Builders</Link>
              <Link to="/properties" className="nav-link" style={{ 
                fontSize: isTablet ? '13px' : isLaptop ? '14px' : '16px'
              }}>Projects</Link>
              <Link to="/blogs" className="nav-link" style={{ 
                fontSize: isTablet ? '13px' : isLaptop ? '14px' : '16px'
              }}>Blog</Link>
             <Link to="/cart" className="nav-link" style={{ fontSize: isTablet ? '13px' : isLaptop ? '14px' : '16px' }}>
                Cart
              </Link>
             <Link to="/about" className="nav-link" style={{ 
                fontSize: isTablet ? '13px' : isLaptop ? '14px' : '16px'
              }}>About Us</Link>
              <SignedOut>
                <Link to="/login" className="nav-link" style={{ 
                  fontSize: isTablet ? '13px' : isLaptop ? '14px' : '16px'
                }}><FaRegUserCircle size={22} /></Link>
              </SignedOut>
              <SignedIn>
                <div style={{ marginLeft: '4px', display: 'flex' }}>
                  <UserButton afterSignOutUrl="/" />
                </div>
              </SignedIn>
              </div>
          )}

          {/* Mobile Hamburger Menu */}
          {isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: isSmallMobile ? 6 : 10 }}>
              {/* Search icon - opens mobile search overlay */}
              <button
                onClick={() => setShowMobileSearch(true)}
                className="mobile-nav-search-toggle"
                aria-label="Open search"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: isSmallMobile ? '18px' : '20px',
                  cursor: 'pointer',
                  padding: isSmallMobile ? '6px' : '8px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FaSearch />
              </button>
              {/* Hamburger */}
              <button
                onClick={toggleMenu}
                className="mobile-menu-toggle"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: isSmallMobile ? '18px' : '20px',
                  cursor: 'pointer',
                  padding: isSmallMobile ? '6px' : '8px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {showMenu ? <FaTimes /> : <FaBars />}
              </button>
            </div>
          )}
        </nav>
      )}

      {/* Mobile Menu Overlay */}
      {isMobile && showMenu && (
        <div
          className="mobile-menu-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            background: '#f7f9ff',
            zIndex: 100,
            animation: 'slideInMenu 0.32s cubic-bezier(.4,2,.6,1)',
            boxShadow: '0 8px 32px rgba(34,58,95,0.18)',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            fontFamily: 'Inter, Arial, sans-serif',
            overflow: 'hidden',
          }}
        >
          {/* Top: Welcome card */}
          <div className="welcome-card" style={{ 
            background: 'linear-gradient(90deg, #23487c 60%, #3f4c7f 100%)', 
            borderRadius: '0 0 20px 20px', 
            boxShadow: '0 4px 18px rgba(34,58,95,0.18)', 
            minHeight: 80, 
            padding: '14px 16px 10px 16px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'flex-start', 
            position: 'relative' 
          }}>
            <button
              onClick={toggleMenu}
              aria-label="Close menu"
              className="close-menu-btn"
              style={{
                position: 'absolute', right: 12, top: 10,
                background: 'none', border: 'none', color: '#fff', fontSize: 40, cursor: 'pointer', padding: 8, borderRadius: 8, fontWeight: 700, lineHeight: 1, boxShadow: '0 2px 8px rgba(34,58,95,0.10)', transition: 'background 0.18s, transform 0.18s',
              }}
              onMouseOver={e => { e.currentTarget.style.background='#2d5a9f'; e.currentTarget.style.transform='scale(1.12)'; }}
              onMouseOut={e => { e.currentTarget.style.background='none'; e.currentTarget.style.transform='none'; }}
            >
              &times;
            </button>
            <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4, marginTop: 2 }}>
              <SignedIn>
                <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '50%', padding: '2px', display: 'flex' }}>
                  <UserButton afterSignOutUrl="/" />
                </div>
              </SignedIn>
              <SignedOut>
                <FaUserCircle size={36} color="#fff" className="user-avatar" style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '50%' }} />
              </SignedOut>
              <div>
                <div className="user-name" style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem', marginBottom: 1 }}>
                  {user ? `Hi, ${user.firstName || user.username || 'User'}` : 'Welcome Guest'}
                </div>
                <div className="user-status" style={{ color: '#eaf1ff', fontWeight: 500, fontSize: '0.92rem' }}>
                  {user ? <span>Profile &bull; <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Manage Profile</span></span> : 'Guest Profile'}
                </div>
              </div>
            </div>
            <SignedOut>
              <Link 
                to="/login" 
                onClick={toggleMenu}
                className="login-signup-btn"
                style={{ 
                  marginTop: 4, 
                  background: '#fff', 
                  color: '#23487c', 
                  fontWeight: 700, 
                  fontSize: '1.02rem', 
                  border: 'none', 
                  borderRadius: 12, 
                  padding: '7px 0', 
                  width: '92%', 
                  marginLeft: '4%', 
                  boxShadow: '0 3px 12px rgba(34,58,95,0.13)', 
                  cursor: 'pointer', 
                  letterSpacing: 0.5, 
                  transition: 'background 0.18s, color 0.18s', 
                  display: 'block', 
                  textAlign: 'center', 
                  textDecoration: 'none' 
                }}
              >
                Login / Signup
              </Link>
            </SignedOut>
          </div>
          
      {/* Action cards */}
<div className="action-cards-container" style={{ 
  width: '100%', 
  display: 'flex', 
  flexDirection: 'column', 
  gap: 16,           // ← Reduced gap for better fit
  marginTop: 16, 
  padding: '0 0 40px 0',
  overflowY: 'auto',
  flex: 1
}}>
  {/* Builder */}
  <Link 
    to="/builder" 
    onClick={toggleMenu}
    className="action-card"
  >
    <div>
      <div className="action-card-title">Builders</div>
      <div className="action-card-description">Find your dream home</div>
    </div>
    <span className="action-card-icon icon-projects">🏢</span>
  </Link>

  {/* Projects */}
  <Link 
    to="/properties" 
    onClick={toggleMenu}
    className="action-card"
  >
    <div>
      <div className="action-card-title">Projects</div>
      <div className="action-card-description">Explore top real estate projects</div>
    </div>
    <span className="action-card-icon icon-buy">🏠</span>
  </Link>

{/* CART ITEM */}
  <Link 
    to="/cart" 
    onClick={toggleMenu}
    className="action-card"
  >
    <div>
      <div className="action-card-title">Cart</div>
      <div className="action-card-description">View saved properties</div>
    </div>
    <span className="action-card-icon icon-cart">🛒</span>
  </Link>

  {/* Blog */}
  <Link 
    to="/blogs" 
    onClick={toggleMenu}
    className="action-card"
  >
    <div>
      <div className="action-card-title">Blog</div>
      <div className="action-card-description">Read property news & tips</div>
    </div>
    <span className="action-card-icon icon-blog">📰</span>
  </Link>

  {/* About Us */}
  <Link 
    to="/about" 
    onClick={toggleMenu}
    className="action-card"
  >
    <div>
      <div className="action-card-title">About Us</div>
      <div className="action-card-description">Get in touch with us</div>
    </div>
    <span className="action-card-icon icon-contact">✉</span>
  </Link>
</div>
          {/* Animation styles moved to HeaderSection.css */}
        </div>
      )}     
      {/* We've removed the full search dropdown to only keep the price range dropdown */}
      {/* Main Section */}
      <main 
        className={`relative z-10 flex items-center justify-between max-w-[1400px] mx-auto px-8 header-main ${isMobile ? 'mobile' : ''}`}
        style={isMobile ? {
          height: '60vh',
          alignItems: 'center',
        } : {
          height: '100%',
        }}
      >
        {/* Left: Hero Text */}
        <div
          className={`flex flex-col justify-center hero-text-container ${isMobile ? 'mobile' : ''}`}
          style={isMobile ? {
            alignItems: 'flex-end',
            textAlign: 'left',
            paddingLeft: '20px',
            paddingRight: '20px',
            width: '100%',
            justifyContent: 'center',
          } : {}}
        >
          <h1
            className={`font-serif font-bold leading-tight mb-3 hero-heading ${isMobile ? 'mobile' : ''} ${isTablet ? 'tablet' : ''} ${isLaptop ? 'laptop' : ''}`}
            style={isMobile ? { textAlign: 'left' } : {}}
          >
            No Brokers, No Noise — <br /> Just Smart Choices.
          </h1>
          <p
            className={`text-base text-white/70 font-quicksand hero-subheading ${isMobile ? 'mobile' : ''} ${isTablet ? 'tablet' : ''}`}
            style={isMobile ? { textAlign: 'left' } : {}}
          >
            "One home. One decision. One clean journey."
          </p>
          
          {/* Removed old large mobile search button to keep navbar icons only */}
        </div>
      </main>

      {/* Mobile Search Overlay */}
      {isMobile && showMobileSearch && (
        <div className="mobile-search-overlay">
          <div className="mobile-search-container">
            {/* Header */}
            <div className="mobile-search-header">
              <h3 className="mobile-search-title">
                Search Properties
              </h3>
              <button
                onClick={() => setShowMobileSearch(false)}
                className="mobile-search-close-btn"
                aria-label="Close search"
              >
                <FaTimes />
              </button>
            </div>
            
            {/* Location Input */}
            <div className="mobile-search-field-container">
              <label className="mobile-search-label">
                Location
              </label>
              <div className="mobile-search-input-container">
                <input 
                  type="text" 
                  placeholder="Enter location..." 
                  className="mobile-search-input"
                  autoFocus
                />
                <button style={{
                  background: '#2563EB',
                  border: 'none',
                  color: 'white',
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}>
                  <FaSearch style={{ fontSize: '14px' }} />
                </button>
              </div>
            </div>
            
            {/* Budget (Mobile) */}
            <div className="mobile-search-field-container">
              <label className="mobile-search-label">Budget in ₹</label>
              <div className="mobile-budget-container">
                <div className="budget-pill-wrap">
                <div className="budget-pill" onClick={() => { setShowMinDropdown(!showMinDropdown); setShowMaxDropdown(false); }}>
                  {formatBudgetLabel(minBudget, 'No Min')}
                  <span className="budget-caret">▼</span>
                </div>
                {showMinDropdown && (
                    <div className="mobile-budget-dropdown left">
                    {budgetOptions.map((opt, idx) => (
                      <div key={`min-${idx}`} className="budget-option" onClick={() => handleSelectMin(opt)}>
                        {formatBudgetLabel(opt, 'No Min')}
                      </div>
                    ))}
                  </div>
                )}
                </div>
                <span className="budget-to">to</span>
                <div className="budget-pill-wrap">
                  <div className="budget-pill" onClick={() => { setShowMaxDropdown(!showMaxDropdown); setShowMinDropdown(false); }}>
                    {formatBudgetLabel(maxBudget, 'No Max')}
                    <span className="budget-caret">▼</span>
                  </div>
                {showMaxDropdown && (
                    <div className="mobile-budget-dropdown right">
                    {budgetOptions.map((opt, idx) => (
                      <div key={`max-${idx}`} className="budget-option" onClick={() => handleSelectMax(opt)}>
                        {formatBudgetLabel(opt, 'No Max')}
                      </div>
                    ))}
                  </div>
                )}
                </div>
              </div>
            </div>           
            {/* Property Type */}
            <div className="mobile-search-field-container" style={{ position: 'relative' }}>
              <label className="mobile-search-label">BHK Type</label>
              <div style={{ position: 'relative' }}>
                <div
                  className="mobile-search-select-container"
                  onClick={() => setShowBhkMobile(!showBhkMobile)}
                  style={{ cursor: 'pointer', position: 'relative' }}
                >
                  <div className="mobile-search-select" style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ flex: 1, paddingLeft: 8, fontWeight: 500 }}>
                      {getBhkDisplayText()}
                    </span>
                  </div>
                  <span style={{ position: 'absolute', right: '12px', pointerEvents: 'none', color: '#333', fontSize: '14px', top: '50%', transform: 'translateY(-50%)' }}>▼</span>
                </div>
                {showBhkMobile && (
                  <div
                    className="mobile-budget-dropdown"
                    style={{ width: '100%', left: 0, right: 0, top: 'calc(100% + 6px)' }}
                  >
                    {bhkOptions.map(option => (
                      <div
                        key={`m-${option.id}`}
                        onClick={() => handleBhkTypeToggle(option.id)}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: '14px',
                          fontWeight: 500,
                          color: selectedBhkTypes.includes(option.id) ? '#23487c' : '#333',
                          backgroundColor: selectedBhkTypes.includes(option.id) ? '#eaf1ff' : 'transparent',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedBhkTypes.includes(option.id)}
                          readOnly
                          style={{ marginRight: 10 }}
                        />
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>            
            {/* Search Button */}
            <button 
              className="mobile-search-submit-btn"
              onClick={() => {
                // Perform search
                setShowMobileSearch(false);
              }}>
              <FaSearch style={{ marginRight: '10px', fontSize: '14px' }} />
              Search Properties
            </button>
            {/* Cancel Button */}
            <button
              className="mobile-search-cancel-btn"
              onClick={() => setShowMobileSearch(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
        {/* Search Bar (hide on mobile) */}
      {!isMobile && (
        <div
          style={{
            position: 'absolute',
            zIndex: 200,
            left: '50%',
            transform: 'translateX(-50%)',
            top: windowWidth <= 350 ? 'calc(100vh - 80px)' : isMobile ? 'calc(100vh - 100px)' : 'calc(100vh - 140px)',
            width: isTablet ? '90%' : isLaptop ? '92%' : '1000px',
            maxWidth: isTablet ? '700px' : isLaptop ? '860px' : '1000px',
            transformOrigin: 'top center',
          }}
        >
          <div
            className="searchbar-responsive"
            style={{
              position: 'relative',
              width: '100%',
              minHeight: isSearchbarExpanded ? '140px' : (isMobile ? 'auto' : '64px'),
              background: '#fff',
              border: '2px solid #e5e7eb',
              borderRadius: windowWidth <= 350 ? '10px' : isMobile ? '18px' : '30px',
              boxShadow: windowWidth <= 350 ? '0 2px 8px 0 rgba(34, 58, 95, 0.10)' : '0 4px 16px 0 rgba(34, 58, 95, 0.13)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              justifyContent: 'flex-start',
              padding: isMobile ? '6px 2px' : isTablet ? '12px 16px' : isLaptop ? '12px 20px' : '14px 28px',
              gap: '16px',
              overflow: 'visible', // Ensure dropdowns are not clipped
              whiteSpace: 'normal',
              flexWrap: 'nowrap',
              boxSizing: 'border-box',
              transition: 'all 0.3s ease',
            }}
          >
          {/* Row wrapper for non-expanded state */}
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            width: '100%',
            gap: isMobile ? '4px' : isTablet ? '10px' : isLaptop ? '12px' : '18px',
          }}>
            {/* Location Input Group */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              flex: 2,
              maxWidth: isTablet ? 170 : isLaptop ? 200 : 220,
              minWidth: isMobile ? 160 : isTablet ? 130 : isLaptop ? 150 : 140,
              justifyContent: 'center',
              width: 'auto',
            }}>
            <label style={{ fontSize: isMobile ? '0.85rem' : isTablet ? '0.9rem' : '1rem', color: '#969696', fontWeight: 500, marginBottom: 2, marginLeft: 0, textAlign: 'left', display: 'block' }}>Enter Location</label>
            <div className="searchbar-input-wrap" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              height: isMobile ? '36px' : 32, 
              paddingLeft: 0, 
              paddingRight: 0, 
              width: '100%',
            }}>
              <input
                type="text"
                placeholder="Enter Location"
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: windowWidth <= 350 ? '0.75rem' : 
                           isMobile ? '0.95rem' : 
                           isTablet ? '1rem' : '1.08rem',
                  color: '#1A1A1A',
                  background: 'transparent',
                  width: '100%',
                  padding: '0',
                  textAlign: 'left',
                  height: windowWidth <= 350 ? '26px' : undefined,
                }}
                className="searchbar-input enter-location-input"
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
              <FaSearch style={{ color: '#888', fontSize: isMobile ? '1rem' : '1.08rem', marginLeft: 0, cursor: 'pointer' }} />
            </div>
          </div>
          {/* Divider */}
          <div style={{ width: 1, height: isMobile ? 18 : 32, background: '#bdbdbd', margin: isMobile ? '8px 0' : '0 10px' }} />
          {/* Price Range Group */}
          <div style={{ 
            minWidth: isMobile ? 120 : isTablet ? 130 : isLaptop ? 140 : 160,
            flex: 1,
            width: 'auto',
            marginTop: 0,
            position: 'relative',
          }}>
            <div 
               onClick={togglePriceRangeSlider}
               className="price-range-trigger"
               style={{ 
                 cursor: 'pointer',
                 position: 'relative',
                 zIndex: 50,
               }}
             >
              <label style={{ fontSize: isMobile ? '0.85rem' : isTablet ? '0.9rem' : '1rem', color: '#969696', fontWeight: 500, marginBottom: 2, marginLeft: 0, textAlign: 'left', display: 'block' }}>Price Range</label>
              <div style={{
                position: 'relative',
                height: isMobile ? 36 : 32,
                border: 'none',
                paddingLeft: 0,
                paddingRight: 0,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
              }}>
                <span style={{ fontSize: windowWidth <= 350 ? '0.75rem' : isMobile ? '0.95rem' : '1.08rem', fontWeight: 600, color: '#222' }}>
                  {priceRange === 0 ? 'All Range' : `Up to ${formatCr(priceRange)}`}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: '14px', color: '#888' }}>▼</span>
              </div>
            </div>
          </div>
          {/* Divider - hidden on mobile */}
          {!isMobile && <div style={{ width: 1, height: 32, background: '#ececec', margin: '0 10px' }} />}
          {/* BHK Type Group */}
          <div style={{ 
            minWidth: isMobile ? 120 : isTablet ? 130 : isLaptop ? 140 : 160,
            flex: 1,
            width: 'auto',
            marginTop: 0,
            position: 'relative',
          }}>
            <label style={{ fontSize: isMobile ? '0.85rem' : isTablet ? '0.9rem' : '1rem', color: '#969696', fontWeight: 500, marginBottom: 2, marginLeft: 0, textAlign: 'left', display: 'block' }}>Type</label>
            <div 
              onClick={toggleBhkDropdown}
              className="bhk-dropdown-trigger"
              ref={bhkTriggerRef}
              style={{
                position: 'relative',
                height: isMobile ? 36 : 32,
                background: '#fff',
                borderRadius: '16px',
                border: 'none',
                paddingLeft: 0,
                paddingRight: 8,
                width: '100%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span style={{
                fontSize: windowWidth <= 350 ? '0.75rem' : 
                         isMobile ? '0.95rem' : 
                         isTablet ? '1rem' : '1.08rem',
                fontWeight: 600,
                color: '#222',
                textAlign: 'left',
                flex: 1,
              }}>
                {getBhkDisplayText()}
              </span>
              <span style={{ 
                position: 'absolute', 
                right: 6, 
                pointerEvents: 'none', 
                color: '#888', 
                fontSize: isMobile ? '1rem' : '1.08rem', 
                transform: showBhkDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }}>▼</span>
            </div>
            
          </div>
          
          {/* Search Button */}
          <button
            className="searchbar-btn"
              style={{
                background: '#F1D97A',
                color: '#222',
                fontWeight: 600,
                fontSize: windowWidth <= 350 ? '0.75rem' : 
                         isMobile ? '0.85rem' : 
                         isTablet ? '0.95rem' : isLaptop ? '0.98rem' : '1.08rem',
                border: 'none',
                borderRadius: isMobile ? '10px' : '24px',
                padding: windowWidth <= 350 ? '0 4px' : 
                         isMobile ? '0 8px' : isTablet ? '0 16px' : isLaptop ? '0 18px' : '0 28px',
                height: windowWidth <= 350 ? '26px' : 
                        isMobile ? '28px' : isTablet ? '44px' : isLaptop ? '44px' : '56px',
                lineHeight: windowWidth <= 350 ? '26px' : 
                            isMobile ? '28px' : isTablet ? '44px' : isLaptop ? '44px' : '56px',
                marginLeft: '10px',
                boxShadow: '0 2px 8px rgba(241,217,122,0.18)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.18s, box-shadow 0.18s, transform 0.18s',
                width: 'auto',
                marginTop: 0,
                flexShrink: 0,
              }}
            onClick={() => {
              const correctedLocation = autocorrectLocation(location);
              window.dispatchEvent(new CustomEvent('filterLandingPage', {
                detail: {
                  location: correctedLocation,
                  priceRange,
                  bhkTypes: selectedBhkTypes
                }
              }));
            }}
            >
              Search
            </button>
          </div>
          
          {/* Expanded Price Range Content - Simple working slider */}
          {isSearchbarExpanded && (
            <div className="expanded-price-content" style={{ width: '100%', paddingTop: '10px', borderTop: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: 500 }}>Min: ₹0</span>
                <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: 500 }}>Max: {formatCr(priceRange || 50)}</span>
              </div>
              
              {/* Simple working slider */}
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={priceRange}
                onChange={handlePriceRangeChange}
                style={{
                  width: '100%',
                  height: '6px',
                  appearance: 'none',
                  background: `linear-gradient(to right, #F1D97A 0%, #F1D97A ${(priceRange/50)*100}%, #e5e7eb ${(priceRange/50)*100}%, #e5e7eb 100%)`,
                  borderRadius: '10px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
                className="simple-price-range-slider"
              />
            </div>
          )}
          </div>
        </div>
      )}
      
      {/* BHK Dropdown Portal - Renders outside container */}
      {showBhkDropdown && createPortal(
        <div className="bhk-dropdown" style={{
          position: 'fixed',
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          width: `${Math.max(dropdownPosition.width, 200)}px`,
          background: '#fff',
          border: '2px solid #e5e7eb',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          zIndex: 99999, // Maximum z-index
          padding: '8px 0',
          maxHeight: '300px',
          overflowY: 'auto',
        }}>
          {bhkOptions.map(option => (
            <div
              key={option.id}
              onClick={() => handleBhkTypeToggle(option.id)}
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                fontSize: '14px',
                fontWeight: 500,
                color: selectedBhkTypes.includes(option.id) ? '#F1D97A' : '#333',
                backgroundColor: selectedBhkTypes.includes(option.id) ? '#fff9e6' : 'transparent',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!selectedBhkTypes.includes(option.id)) {
                  e.target.style.backgroundColor = '#f8f9fa';
                }
              }}
              onMouseLeave={(e) => {
                if (!selectedBhkTypes.includes(option.id)) {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{
                width: '16px',
                height: '16px',
                border: `2px solid ${selectedBhkTypes.includes(option.id) ? '#F1D97A' : '#ccc'}`,
                borderRadius: '3px',
                marginRight: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: selectedBhkTypes.includes(option.id) ? '#F1D97A' : 'transparent',
              }}>
                {selectedBhkTypes.includes(option.id) && (
                  <span style={{ color: '#000', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
                )}
              </div>
              {option.label}
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

export default HeaderSection;
