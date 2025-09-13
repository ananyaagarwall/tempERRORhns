import React, { useState, useEffect } from 'react';
import { FaBars, FaTimes, FaUserCircle, FaRegUserCircle } from 'react-icons/fa';
import { MdTravelExplore, MdHome, MdBusiness, MdArticle } from 'react-icons/md';
import { Link } from 'react-router-dom';
import './css/FooterNavBar.css';

const FooterNavBar = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  // Simulate user state: null for guest, {name: 'John'} for logged in
  const [user] = useState(null); // Change to {name: 'John'} to simulate logged in

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;

  // Colorful, big action cards for footer
  const actionCards = [
    { label: 'Builders', icon: <MdBusiness size={38} color="#A21CAF" style={{ filter: 'drop-shadow(0 0 6px #A21CAF99)' }} />, to: '#builders', desc: 'Explore trusted builders' },
    { label: 'Projects', icon: <MdHome size={38} color="#22C55E" style={{ filter: 'drop-shadow(0 0 6px #22C55E99)' }} />, to: '#projects', desc: 'View all projects' },
    { label: 'Blogs', icon: <MdArticle size={38} color="#F59E42" style={{ filter: 'drop-shadow(0 0 6px #F59E4299)' }} />, to: '/blogs', desc: 'Read property news & tips' },
    { label: 'About Us', icon: <MdTravelExplore size={38} color="#3B82F6" style={{ filter: 'drop-shadow(0 0 6px #3B82F6AA)' }} />, to: '#about', desc: 'Learn about us' },
  ];

  return (
    <>
      <div className={`footer-navbar ${isMobile ? 'footer-navbar-mobile' : 'footer-navbar-desktop'}`}>

        {/* Logo Image from public */}
        <img 
          src="/HouseNSeek.png" 
          alt="HouseNSeek Logo" 
          className={`footer-logo ${isMobile ? 'footer-logo-mobile' : ''}`}
        />
        {/* Desktop Navigation */}
        {!isMobile && (
          <nav className="footer-nav">
            <a href="#builders" className="footer-nav-link">Builders</a>
            <a href="#projects" className="footer-nav-link">Projects</a>
            <Link to="/blogs" className="footer-nav-link">Blogs</Link>
            <a href="#about" className="footer-nav-link">About Us</a>
            <Link to="/login" className="footer-nav-link" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaRegUserCircle size={22} /></Link>
          </nav>
        )}
        {/* Mobile Hamburger Icon */}
        {isMobile && (
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="hamburger-button"
          >
            {showMenu ? <FaTimes /> : <FaBars />}
          </button>
        )}
      </div>
      {/* Mobile Menu Overlay */}
      {isMobile && showMenu && (
        <div className="mobile-menu-overlay">

          {/* Top: Welcome card */}
          <div className="welcome-card">
            <button
              onClick={() => setShowMenu(false)}
              aria-label="Close menu"
              className="close-menu-button"
            >
              &times;
            </button>
            <div className="user-info-container">
              <FaUserCircle size={36} color="#fff" className="user-icon" />
            <div>
                <div className="user-name">
                  {user ? `Hi, ${user.name}` : 'Welcome Guest'}
              </div>
                <div className="user-status">
                  {user ? <span>Profile &bull; <span className="profile-link">Manage Profile</span></span> : 'Guest Profile'}
            </div>
              </div>
            </div>
            {!user && (
              <Link to="/login" className="login-button" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaRegUserCircle size={24} /></Link>
            )}
          </div>
          {/* Action cards */}
          <div className="action-cards-container">
            {actionCards.map((card, idx) => (
              <a
                key={card.label}
                href={card.to}
                    className="action-card"
              >
                <div>
                  <div className="action-card-title">{card.label}</div>
                  <div className="action-card-desc">{card.desc}</div>
                </div>
                <span className="action-card-icon">{card.icon}</span>
                  </a>
                ))}
          </div>
          {/* CSS moved to external file */}
        </div>
      )}
    </>
  );
};

export default FooterNavBar;