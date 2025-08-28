import React, { useState, useEffect } from 'react';
import { FaSearch, FaBars, FaTimes, FaHome, FaBuilding, FaRegFileAlt, FaEnvelope, FaUser, FaUserCircle } from 'react-icons/fa';
import headerBg from '../../assets/Header.img1.gradient1.png';
import { Link, useNavigate } from 'react-router-dom';

const HeaderSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('Projects');
  const [user, setUser] = useState(null);

  const handleLogin = () => {/* your login logic here */};
  const handleSignup = () => {/* your signup logic here */};

  // Updated toggle function with scroll prevention
  const toggleMenu = () => {
    const newShowMenu = !showMenu;
    setShowMenu(newShowMenu);
    
    // Prevent body scroll when menu is open
    if (newShowMenu) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
  };

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cleanup effect for body styles
  useEffect(() => {
    return () => {
      // Cleanup body styles when component unmounts
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
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
  const isTablet = windowWidth > 768 && windowWidth <= 1024;
  const isLaptop = windowWidth > 1024 && windowWidth <= 1440;
  const isDesktop = windowWidth > 1440;

  // Responsive navbar positioning and sizing
  const getNavbarStyles = () => {
    if (isMobile) {
      return {
        top: '20px',
        left: '20px',
        width: 'calc(100% - 40px)',
        height: '56px',
        borderRadius: '16px',
        padding: '0 16px',
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

  return (
    <div
      className="relative w-full h-screen text-white bg-cover bg-center overflow-hidden"
      style={{
        background: '#FFFFFF',
        backgroundImage: `url(${headerBg})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#16386d] to-[rgba(0,0,0,0.1)] z-0" />

      {/* Main Navbar */}
      {!(isMobile && showMenu) && (
        <nav
          className="custom-navbar"
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
            zIndex: 30,
            boxSizing: 'border-box',
            boxShadow: '0 2px 16px rgba(34,58,95,0.10)',
            overflow: 'hidden',
          }}
        >
          {/* Logo inside navbar */}
          <img 
            src="/HouseNSeek.png" 
            alt="HouseNSeek Logo" 
            style={{ 
              height: isMobile ? 28 : isTablet ? 32 : 36, 
              width: 'auto', 
              marginRight: isMobile ? 12 : isTablet ? 16 : 24, 
              marginLeft: 0, 
              zIndex: 31,
              flexShrink: 0
            }} 
          />

          {/* Desktop Navigation */}
          {!isMobile && (
            <div style={{ 
              display: 'flex', 
              gap: isTablet ? 24 : isLaptop ? 32 : 40, 
              alignItems: 'center',
              flexWrap: 'nowrap',
              overflow: 'hidden'
            }}>
              <a href="#projects" style={{ 
                color: '#fff', 
                fontWeight: 600, 
                fontSize: isTablet ? '13px' : isLaptop ? '14px' : '16px', 
                textDecoration: 'none',
                whiteSpace: 'nowrap'
              }}>Projects</a>
              <a href="#buy" style={{ 
                color: '#fff', 
                fontWeight: 600, 
                fontSize: isTablet ? '13px' : isLaptop ? '14px' : '16px', 
                textDecoration: 'none',
                whiteSpace: 'nowrap'
              }}>Buy</a>
              <Link to="/properties" style={{ 
                color: '#fff', 
                fontWeight: 600, 
                fontSize: isTablet ? '13px' : isLaptop ? '14px' : '16px', 
                textDecoration: 'none',
                whiteSpace: 'nowrap'
              }}>Properties</Link>
              <Link to="/blogs" style={{ 
                color: '#fff', 
                fontWeight: 600, 
                fontSize: isTablet ? '13px' : isLaptop ? '14px' : '16px', 
                textDecoration: 'none',
                whiteSpace: 'nowrap'
              }}>Blog</Link>
              <a href="#contact" style={{ 
                color: '#fff', 
                fontWeight: 600, 
                fontSize: isTablet ? '13px' : isLaptop ? '14px' : '16px', 
                textDecoration: 'none',
                whiteSpace: 'nowrap'
              }}>Contact Us</a>
              <Link to="/login" style={{ 
                color: '#fff', 
                fontWeight: 600, 
                fontSize: isTablet ? '13px' : isLaptop ? '14px' : '16px', 
                textDecoration: 'none',
                whiteSpace: 'nowrap'
              }}>Login / Signup</Link>
            </div>
          )}

          {/* Mobile Hamburger Menu */}
          {isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button
                onClick={toggleMenu}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '8px',
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
          <div style={{ 
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
              style={{
                position: 'absolute', right: 12, top: 10,
                background: 'none', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer', padding: 6, borderRadius: 8, fontWeight: 700, lineHeight: 1, boxShadow: '0 2px 8px rgba(34,58,95,0.10)', transition: 'background 0.18s, transform 0.18s',
              }}
              onMouseOver={e => { e.currentTarget.style.background='#2d5a9f'; e.currentTarget.style.transform='scale(1.12)'; }}
              onMouseOut={e => { e.currentTarget.style.background='none'; e.currentTarget.style.transform='none'; }}
            >
              &times;
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4, marginTop: 2 }}>
              <FaUserCircle size={36} color="#fff" style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '50%' }} />
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem', marginBottom: 1 }}>
                  {user ? `Hi, ${user.name}` : 'Welcome Guest'}
                </div>
                <div style={{ color: '#eaf1ff', fontWeight: 500, fontSize: '0.92rem' }}>
                  {user ? <span>Profile &bull; <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Manage Profile</span></span> : 'Guest Profile'}
                </div>
              </div>
            </div>
            {!user && (
              <Link 
                to="/login" 
                onClick={toggleMenu}
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
            )}
          </div>
          
          {/* Action cards */}
          <div style={{ 
            width: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 18, 
            marginTop: 18, 
            padding: '0 0 24px 0',
            overflowY: 'auto',
            flex: 1
          }}>
            {/* Projects */}
            <a 
              href="#projects" 
              onClick={() => { setActiveMenu('Projects'); toggleMenu(); }}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                background: '#fff', 
                borderRadius: 18, 
                boxShadow: '0 2px 8px rgba(34,58,95,0.08)', 
                padding: '14px 14px', 
                margin: '0 12px', 
                textDecoration: 'none', 
                cursor: 'pointer', 
                border: activeMenu === 'Projects' ? '2px solid #23487c' : '2px solid #f7f9ff', 
                transition: 'box-shadow 0.18s, border 0.18s', 
                minHeight: 56 
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: '#23487c', fontSize: activeMenu === 'Projects' ? '1rem' : '1.08rem', marginBottom: 1 }}>Projects</div>
                <div style={{ color: '#6b7280', fontSize: activeMenu === 'Projects' ? '0.89rem' : '0.98rem', whiteSpace: 'normal', lineHeight: 1.2, maxWidth: 170 }}>Explore top real estate projects</div>
              </div>
              <span style={{ fontSize: 36, marginLeft: 10, marginRight: 2, background: '#eaf1ff', borderRadius: '50%', padding: '7px', boxShadow: '0 2px 8px rgba(34,58,95,0.10)' }}>🏢</span>
            </a>
            
            {/* Buy */}
            <a 
              href="#buy" 
              onClick={() => { setActiveMenu('Buy'); toggleMenu(); }}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                background: '#fff', 
                borderRadius: 18, 
                boxShadow: '0 2px 8px rgba(34,58,95,0.08)', 
                padding: '14px 14px', 
                margin: '0 12px', 
                textDecoration: 'none', 
                cursor: 'pointer', 
                border: activeMenu === 'Buy' ? '2px solid #23487c' : '2px solid #f7f9ff', 
                transition: 'box-shadow 0.18s, border 0.18s', 
                minHeight: 56 
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: '#23487c', fontSize: activeMenu === 'Buy' ? '1rem' : '1.08rem', marginBottom: 1 }}>Buy</div>
                <div style={{ color: '#6b7280', fontSize: activeMenu === 'Buy' ? '0.89rem' : '0.98rem', whiteSpace: 'normal', lineHeight: 1.2, maxWidth: 170 }}>Find your dream home</div>
              </div>
              <span style={{ fontSize: 36, marginLeft: 10, marginRight: 2, background: '#e0f7ef', borderRadius: '50%', padding: '7px', boxShadow: '0 2px 8px rgba(34,58,95,0.10)' }}>🏠</span>
            </a>
            
            {/* Properties */}
            <Link 
              to="/properties" 
              onClick={() => { setActiveMenu('Properties'); toggleMenu(); }}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                background: '#fff', 
                borderRadius: 18, 
                boxShadow: '0 2px 8px rgba(34,58,95,0.08)', 
                padding: '14px 14px', 
                margin: '0 12px', 
                textDecoration: 'none', 
                cursor: 'pointer', 
                border: activeMenu === 'Properties' ? '2px solid #23487c' : '2px solid #f7f9ff', 
                transition: 'box-shadow 0.18s, border 0.18s', 
                minHeight: 56 
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: '#23487c', fontSize: activeMenu === 'Properties' ? '1rem' : '1.08rem', marginBottom: 1 }}>Properties</div>
                <div style={{ color: '#6b7280', fontSize: activeMenu === 'Properties' ? '0.89rem' : '0.98rem', whiteSpace: 'normal', lineHeight: 1.2, maxWidth: 170 }}>Browse all properties</div>
              </div>
              <span style={{ fontSize: 36, marginLeft: 10, marginRight: 2, background: '#fff2e0', borderRadius: '50%', padding: '7px', boxShadow: '0 2px 8px rgba(34,58,95,0.10)' }}>🏘️</span>
            </Link>
            
            {/* Blog */}
            <Link 
              to="/blogs" 
              onClick={() => { setActiveMenu('Blog'); toggleMenu(); }}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                background: '#fff', 
                borderRadius: 18, 
                boxShadow: '0 2px 8px rgba(34,58,95,0.08)', 
                padding: '14px 14px', 
                margin: '0 12px', 
                textDecoration: 'none', 
                cursor: 'pointer', 
                border: activeMenu === 'Blog' ? '2px solid #23487c' : '2px solid #f7f9ff', 
                transition: 'box-shadow 0.18s, border 0.18s', 
                minHeight: 56 
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: '#23487c', fontSize: activeMenu === 'Blog' ? '1rem' : '1.08rem', marginBottom: 1 }}>Blog</div>
                <div style={{ color: '#6b7280', fontSize: activeMenu === 'Blog' ? '0.89rem' : '0.98rem', whiteSpace: 'normal', lineHeight: 1.2, maxWidth: 170 }}>Read property news & tips</div>
              </div>
              <span style={{ fontSize: 36, marginLeft: 10, marginRight: 2, background: '#f3f1ff', borderRadius: '50%', padding: '7px', boxShadow: '0 2px 8px rgba(34,58,95,0.10)' }}>📰</span>
            </Link>
            
            {/* Contact Us */}
            <a 
              href="#contact" 
              onClick={() => { setActiveMenu('Contact Us'); toggleMenu(); }}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                background: '#fff', 
                borderRadius: 18, 
                boxShadow: '0 2px 8px rgba(34,58,95,0.08)', 
                padding: '14px 14px', 
                margin: '0 12px', 
                textDecoration: 'none', 
                cursor: 'pointer', 
                border: activeMenu === 'Contact Us' ? '2px solid #23487c' : '2px solid #f7f9ff', 
                transition: 'box-shadow 0.18s, border 0.18s', 
                minHeight: 56 
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: '#23487c', fontSize: activeMenu === 'Contact Us' ? '1rem' : '1.08rem', marginBottom: 1 }}>Contact Us</div>
                <div style={{ color: '#6b7280', fontSize: activeMenu === 'Contact Us' ? '0.89rem' : '0.98rem', whiteSpace: 'normal', lineHeight: 1.2, maxWidth: 170 }}>Get in touch with us</div>
              </div>
              <span style={{ fontSize: 36, marginLeft: 10, marginRight: 2, background: '#fff6e0', borderRadius: '50%', padding: '7px', boxShadow: '0 2px 8px rgba(34,58,95,0.10)' }}>✉️</span>
            </a>
          </div>
          
          <style>{`
            @keyframes slideInMenu {
              0% { transform: translateX(-40px); opacity: 0; }
              100% { transform: translateX(0); opacity: 1; }
            }
          `}</style>
        </div>
      )}

      {/* Main Section */}
      <main
        className="relative z-10 flex items-center justify-between max-w-[1400px] h-full mx-auto px-8"
        style={{ 
          height: '100%', 
          marginBottom: isMobile ? '0' : '20px',
          padding: isMobile ? '0 10px' : isTablet ? '0 40px' : '0 80px',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: isMobile ? 'center' : 'space-between',
          textAlign: isMobile ? 'center' : 'left',
        }}
      >
        {/* Left: Hero Text */}
        <div
          className="flex flex-col justify-center"
          style={{
            maxWidth: isMobile ? '100%' : '60%',
            minWidth: isMobile ? 'auto' : '500px',
            flex: '1 1 0%',
            textAlign: isMobile ? 'center' : 'left',
            marginTop: isMobile ? '110px' : 0,
            marginBottom: isMobile ? '16px' : 0,
            padding: isMobile ? '0 0 0 0' : '0',
          }}
        >
          <h1
            className="font-serif font-bold leading-tight mb-3"
            style={{ 
              fontSize: isMobile ? '2.1rem' : isTablet ? '2.8rem' : isLaptop ? '3.2rem' : '3.5rem', 
              lineHeight: 1.1,
              marginBottom: isMobile ? '10px' : '24px',
              fontWeight: 800,
              letterSpacing: isMobile ? '-0.5px' : '0',
            }}
          >
            No Brokers, No Noise — <br /> Just Smart Choices.
          </h1>
          <p
            className="text-base text-white/70 font-quicksand"
            style={{ 
              fontSize: isMobile ? '0.98rem' : isTablet ? '1.05rem' : '1.15rem', 
              marginTop: '0.5rem',
              marginBottom: isMobile ? '24px' : 0,
              fontWeight: 500,
            }}
          >
            "One home. One decision. One clean journey."
          </p>
        </div>
      </main>

      {/* Search Bar (hide on mobile) */}
      {!isMobile && (
        <div
          className="searchbar-responsive"
          style={{
            position: 'absolute',
            zIndex: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: windowWidth <= 350 ? '8px' : isMobile ? '24px' : '72px',
            width: isTablet ? '90%' : isLaptop ? '95%' : '1000px',
            maxWidth: isTablet ? '700px' : isLaptop ? '900px' : '1000px',
            minHeight: isMobile ? 'auto' : '64px',
            borderRadius: windowWidth <= 350 ? '10px' : isMobile ? '18px' : '30px',
            background: '#fff',
            border: '2px solid #e5e7eb',
            boxShadow: windowWidth <= 350 ? '0 2px 8px 0 rgba(34, 58, 95, 0.10)' : '0 4px 16px 0 rgba(34, 58, 95, 0.13)',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: isMobile ? '6px 2px' : '14px 28px',
            gap: isMobile ? '4px' : isTablet ? '12px' : '18px',
            transition: 'width 0.2s, height 0.2s, border-radius 0.2s',
            overflowX: 'visible',
            whiteSpace: 'normal',
            flexWrap: windowWidth <= 350 ? 'wrap' : 'nowrap',
            boxSizing: 'border-box',
          }}
        >
          {/* Location Input Group */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            flex: 2,
            maxWidth: isTablet ? 180 : 220,
            minWidth: isMobile ? 160 : 140,
            justifyContent: 'center',
            width: 'auto',
          }}>
            <label style={{ fontSize: isMobile ? '0.85rem' : isTablet ? '0.9rem' : '1rem', color: '#969696', fontWeight: 500, marginBottom: 2, marginLeft: 2 }}>Enter Keyword</label>
            <div className="searchbar-input-wrap" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              background: '#fff', 
              borderRadius: '16px', 
              height: isMobile ? '36px' : 32, 
              paddingLeft: 10, 
              paddingRight: 8, 
              boxShadow: '0 2px 8px rgba(34,58,95,0.13), 0 1.5px 6px rgba(34,58,95,0.10) inset',
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
                  background: '#fff',
                  width: '100%',
                  padding: windowWidth <= 350 ? '0 0.5px' : '0 2px',
                  textAlign: 'left',
                  height: windowWidth <= 350 ? '26px' : undefined,
                }}
                className="searchbar-input enter-location-input"
              />
              <FaSearch style={{ color: '#888', fontSize: isMobile ? '1rem' : '1.08rem', marginLeft: 4, cursor: 'pointer' }} />
            </div>
          </div>
          {/* Divider */}
          <div style={{ width: 1, height: isMobile ? 18 : 32, background: '#bdbdbd', margin: isMobile ? '8px 0' : '0 10px' }} />
          {/* Price Range Group */}
          <div style={{ 
            minWidth: isMobile ? 120 : isTablet ? 140 : 160,
            flex: 1,
            width: 'auto',
            marginTop: 0,
          }}>
            <label style={{ fontSize: isMobile ? '0.85rem' : isTablet ? '0.9rem' : '1rem', color: '#969696', fontWeight: 500, marginBottom: 2, marginLeft: 0, textAlign: 'left', display: 'block' }}>Price Range</label>
            <div style={{
              position: 'relative',
              height: isMobile ? 36 : 32,
              background: '#fff',
              borderRadius: '16px',
              border: 'none',
              paddingLeft: 8,
              paddingRight: 8,
              width: '100%'
            }}>
              <select
                style={{
                  border: 'none',
                  outline: 'none',
                  fontWeight: 600,
                  fontSize: windowWidth <= 350 ? '0.75rem' : 
                           isMobile ? '0.95rem' : 
                           isTablet ? '1rem' : '1.08rem',
                  color: '#222',
                  background: '#fff',
                  cursor: 'pointer',
                  width: '100%',
                  appearance: 'none',
                  paddingRight: 16,
                  boxShadow: 'none',
                  margin: 'auto',
                  textAlign: 'left',
                  padding: windowWidth <= 350 ? '0 0.5px' : undefined,
                  height: windowWidth <= 350 ? '26px' : undefined,
                }}
                className="searchbar-select"
              >
                <option style={{ color: '#222', fontWeight: 600, textAlign: 'left' }}>All Range</option>
                <option style={{ textAlign: 'left' }}>Under 50L</option>
                <option style={{ textAlign: 'left' }}>50L - 1Cr</option>
                <option style={{ textAlign: 'left' }}>1Cr - 2Cr</option>
                <option style={{ textAlign: 'left' }}>Above 2Cr</option>
              </select>
              <span style={{ position: 'absolute', right: 6, pointerEvents: 'none', color: '#888', fontSize: isMobile ? '1rem' : '1.08rem', top: '50%', transform: 'translateY(-50%)' }}>▼</span>
            </div>
          </div>
          {/* Divider - hidden on mobile */}
          {!isMobile && <div style={{ width: 1, height: 32, background: '#ececec', margin: '0 10px' }} />}
          {/* Type Group */}
          <div style={{ 
            minWidth: isMobile ? 120 : isTablet ? 140 : 160,
            flex: 1,
            width: 'auto',
            marginTop: 0,
          }}>
            <label style={{ fontSize: isMobile ? '0.85rem' : isTablet ? '0.9rem' : '1rem', color: '#969696', fontWeight: 500, marginBottom: 2, marginLeft: 0, textAlign: 'left', display: 'block' }}>Type</label>
            <div style={{
              position: 'relative',
              height: isMobile ? 36 : 32,
              background: '#fff',
              borderRadius: '16px',
              border: 'none',
              paddingLeft: 8,
              paddingRight: 8,
              width: '100%'
            }}>
              <select
                style={{
                  border: 'none',
                  outline: 'none',
                  fontWeight: 600,
                  fontSize: windowWidth <= 350 ? '0.75rem' : 
                           isMobile ? '0.95rem' : 
                           isTablet ? '1rem' : '1.08rem',
                  color: '#222',
                  background: '#fff',
                  cursor: 'pointer',
                  width: '100%',
                  appearance: 'none',
                  paddingRight: 16,
                  boxShadow: 'none',
                  margin: 'auto',
                  textAlign: 'left',
                  padding: windowWidth <= 350 ? '0 0.5px' : undefined,
                  height: windowWidth <= 350 ? '26px' : undefined,
                }}
                className="searchbar-select"
              >
                <option style={{ color: '#222', fontWeight: 600, textAlign: 'left' }}>All Type</option>
                <option style={{ textAlign: 'left' }}>Apartment</option>
                <option style={{ textAlign: 'left' }}>Villa</option>
                <option style={{ textAlign: 'left' }}>Plot</option>
                <option style={{ textAlign: 'left' }}>Commercial</option>
              </select>
              <span style={{ position: 'absolute', right: 6, pointerEvents: 'none', color: '#888', fontSize: isMobile ? '1rem' : '1.08rem', top: '50%', transform: 'translateY(-50%)' }}>▼</span>
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
                       isTablet ? '1rem' : '1.08rem',
              border: 'none',
              borderRadius: isMobile ? '10px' : '24px',
              padding: windowWidth <= 350 ? '0 4px' : 
                       isMobile ? '0 8px' : '0 28px',
              height: windowWidth <= 350 ? '26px' : 
                      isMobile ? '28px' : '56px',
              lineHeight: windowWidth <= 350 ? '26px' : 
                          isMobile ? '28px' : '56px',
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
          >
            Search
          </button>

          <style>{`
            .searchbar-input:focus {
              box-shadow: 0 0 0 2px #3b82f6;
              border-radius: 10px;
              background: #f8fafc;
            }
            .enter-location-input::placeholder {
              color: #1A1A1A !important;
              opacity: 1;
            }
            .searchbar-select:focus {
              box-shadow: 0 0 0 2px #3b82f6;
              border-radius: 10px;
              background: #f8fafc;
            }
            .searchbar-btn:hover {
              background: #e6c75e !important;
              box-shadow: 0 4px 18px 0 rgba(241,217,122,0.28);
              transform: translateY(-2px) scale(1.03);
            }
            .searchbar-btn:active {
              background: #e6c75e !important;
              box-shadow: 0 2px 8px 0 rgba(241,217,122,0.18);
              transform: scale(0.98);
            }
            .searchbar-select option {
              text-align: left;
              font-weight: 700;
              color: #1a1a1a;
              font-size: 1.08rem;
            }
            .searchbar-select {
              text-align: left;
              text-align-last: left;
            }
            @media (max-width: 1024px) and (min-width: 769px) {
              .searchbar-responsive {
                width: 90% !important;
                min-width: 0 !important;
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default HeaderSection;
