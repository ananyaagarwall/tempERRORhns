import React, { useState, useEffect } from 'react';
import { FaBars, FaTimes, FaUserCircle } from 'react-icons/fa';
import { MdTravelExplore, MdHome, MdBusiness, MdArticle } from 'react-icons/md';
import { Link } from 'react-router-dom';

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
    { label: 'Search', icon: <MdTravelExplore size={38} color="#3B82F6" style={{ filter: 'drop-shadow(0 0 6px #3B82F6AA)' }} />, to: '#search', desc: 'Find properties' },
    { label: 'Home', icon: <MdHome size={38} color="#22C55E" style={{ filter: 'drop-shadow(0 0 6px #22C55E99)' }} />, to: '#home', desc: 'Go to homepage' },
    { label: 'Builders', icon: <MdBusiness size={38} color="#A21CAF" style={{ filter: 'drop-shadow(0 0 6px #A21CAF99)' }} />, to: '#builders', desc: 'Explore trusted builders' },
    { label: 'Blogs', icon: <MdArticle size={38} color="#F59E42" style={{ filter: 'drop-shadow(0 0 6px #F59E4299)' }} />, to: '/blogs', desc: 'Read property news & tips' },
  ];

  return (
    <>
      <div
        style={{
          width: '100%',
          background: '#23487c',
          borderRadius: '0 0 40px 40px',
          boxShadow: '0 2px 16px 0 rgba(34, 58, 95, 0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '0 20px' : '0 32px',
          height: isMobile ? 64 : 72,
          margin: 0,
          zIndex: 10,
        }}
      >
        {/* Logo Image from public */}
        <img 
          src="/HouseNSeek.png" 
          alt="HouseNSeek Logo" 
          style={{ 
            height: isMobile ? 32 : 36, 
            width: 'auto', 
            borderRadius: 10 
          }} 
        />
        {/* Desktop Navigation */}
        {!isMobile && (
          <nav style={{ display: 'flex', gap: 56, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <a href="#Search" style={{ color: '#fff', fontWeight: 600, fontSize: 18, textDecoration: 'none' }}>Search</a>
            <a href="#Home" style={{ color: '#fff', fontWeight: 600, fontSize: 18, textDecoration: 'none' }}>Home</a>
            <a href="#Builders" style={{ color: '#fff', fontWeight: 600, fontSize: 18, textDecoration: 'none' }}>Builders</a>
            <a href="#Blogs" style={{ color: '#fff', fontWeight: 600, fontSize: 18, textDecoration: 'none' }}>Blogs</a>
          </nav>
        )}
        {/* Mobile Hamburger Icon */}
        {isMobile && (
          <button
            onClick={() => setShowMenu(!showMenu)}
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
        )}
      </div>
      {/* Mobile Menu Overlay */}
      {isMobile && showMenu && (
        <div
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            top: 0,
            width: '100vw',
            minHeight: '100vh',
            background: '#f7f9ff',
            zIndex: 100,
            animation: 'slideUpMenu 0.32s cubic-bezier(.4,2,.6,1)',
            boxShadow: '0 -8px 32px rgba(34,58,95,0.18)',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            fontFamily: 'Inter, Arial, sans-serif',
          }}
        >
          {/* Top: Welcome card */}
          <div style={{ background: 'linear-gradient(90deg, #23487c 60%, #3f4c7f 100%)', borderRadius: '0 0 20px 20px', boxShadow: '0 4px 18px rgba(34,58,95,0.18)', minHeight: 80, padding: '14px 16px 10px 16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', position: 'relative' }}>
            <button
              onClick={() => setShowMenu(false)}
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
              <Link to="/login" style={{ marginTop: 4, background: '#fff', color: '#23487c', fontWeight: 700, fontSize: '1.02rem', border: 'none', borderRadius: 12, padding: '7px 0', width: '92%', marginLeft: '4%', boxShadow: '0 3px 12px rgba(34,58,95,0.13)', cursor: 'pointer', letterSpacing: 0.5, transition: 'background 0.18s, color 0.18s', display: 'block', textAlign: 'center', textDecoration: 'none' }}>Login / Signup</Link>
            )}
          </div>
          {/* Action cards */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 18, marginTop: 18, padding: '0 0 24px 0' }}>
            {actionCards.map((card, idx) => (
              <a
                key={card.label}
                href={card.to}
                    style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: 18, boxShadow: '0 2px 8px rgba(34,58,95,0.08)', padding: '14px 14px', margin: '0 12px', textDecoration: 'none', cursor: 'pointer', border: '2px solid #f7f9ff', transition: 'box-shadow 0.18s, border 0.18s', minHeight: 56,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#23487c', fontSize: '1.08rem', marginBottom: 1 }}>{card.label}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.98rem', whiteSpace: 'normal', lineHeight: 1.2, maxWidth: 170 }}>{card.desc}</div>
                </div>
                <span style={{ fontSize: 38, marginLeft: 10, display: 'flex', alignItems: 'center' }}>{card.icon}</span>
                  </a>
                ))}
          </div>
          <style>{`
            @keyframes slideUpMenu {
              0% { transform: translateY(100px); opacity: 0; }
              100% { transform: translateY(0); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </>
  );
};

export default FooterNavBar; 