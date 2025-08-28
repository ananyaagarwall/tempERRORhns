import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBars } from 'react-icons/fa';

const BlogHeader = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="relative w-full">
      {/* Navigation Bar */}
      <div className="bg-[#1a3263] rounded-b-3xl px-8 py-3 flex items-center justify-between relative">
        {/* Logo */}
        <span className="text-white text-2xl font-bold tracking-wide">HousenSeek</span>

        {/* Centered Nav (desktop) */}
        <div className="flex-1 hidden md:flex justify-center gap-10">
          <Link to="/search" className="text-white text-lg hover:underline">Search</Link>
          <Link to="/" className="text-white text-lg hover:underline">Home</Link>
          <Link to="/builders" className="text-white text-lg hover:underline">Builders</Link>
          <Link to="/blogs" className="text-white text-lg hover:underline font-semibold">Blogs</Link>
          <button className="text-white text-2xl ml-4" aria-label="Open navigation menu"><FaBars /></button>
        </div>

        {/* Hamburger (mobile) */}
        <button className="block md:hidden text-white text-2xl focus:outline-none z-20" onClick={() => setMobileMenuOpen(v => !v)} aria-label="Open navigation menu">
          <FaBars />
        </button>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div ref={mobileMenuRef} className="absolute top-full left-0 w-full bg-[#1a3263] shadow-lg rounded-b-2xl flex flex-col items-center py-4 animate-fade-in z-30">
            <Link to="/search" className="text-white text-lg py-2 w-full text-center hover:bg-blue-900" onClick={() => setMobileMenuOpen(false)}>Search</Link>
            <Link to="/" className="text-white text-lg py-2 w-full text-center hover:bg-blue-900" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link to="/builders" className="text-white text-lg py-2 w-full text-center hover:bg-blue-900" onClick={() => setMobileMenuOpen(false)}>Builders</Link>
            <Link to="/blogs" className="text-white text-lg py-2 w-full text-center hover:bg-blue-900 font-semibold" onClick={() => setMobileMenuOpen(false)}>Blogs</Link>
          </div>
        )}
      </div>

      <div className="relative w-full bg-[#00000] text-center pt-10 pb-12 px-4 md:px-0 overflow-hidden">
        <div className="relative z-10 text-white" style={{ fontFamily: 'Merriweather, serif' }}>
          {children}
        </div>
      </div>
    </header>
  );
};

export default BlogHeader;
