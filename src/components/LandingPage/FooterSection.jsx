// temporary test change
import React from 'react';
import { FaPhoneAlt, FaMapMarkerAlt, FaEnvelope, FaTwitter, FaFacebook, FaInstagram } from "react-icons/fa";
console.log("Testing if Git detects this change");
const footerLinks = [
  { label: 'Home', to: '/' },
  { label: 'About Us', to: '/about' },
  { label: 'Blogs', to: '/blogs' },
  { label: 'Sell', to: '/sell' },
  { label: 'Buy', to: '/buy' },
];

const siteLinks = [
  { label: 'Terms & Conditions', to: '/terms' },
  { label: 'Disclaimer', to: '/disclaimer' },
  { label: 'Contact Us', to: '/contact' },
  { label: 'GDPR', to: '/gdpr' },
  { label: 'Usage Policy', to: '/usage' },
];

const contactLinks = [
  { 
    label: 'Location',
    text: 'Mumbai, India',
    url: 'https://maps.google.com/?q=Mumbai,India',
    icon: <FaMapMarkerAlt style={{fontSize: 18, color: '#fff'}} />
  },
  { 
    label: 'Email',
    text: 'hello@housenseek.com',
    url: 'mailto:hello@housenseek.com',
    icon: <FaEnvelope style={{fontSize: 18, color: '#fff'}} />
  },
  { 
    label: 'Phone',
    text: '+91 123-456-7890',
    url: 'tel:+911234567890',
    icon: <FaPhoneAlt style={{fontSize: 18, color: '#fff'}} />
  },
];

const socialLinks = [
  { label: 'Twitter', url: 'https://twitter.com/', icon: <FaTwitter /> },
  { label: 'Facebook', url: 'https://facebook.com/', icon: <FaFacebook /> },
  { label: 'Instagram', url: 'https://instagram.com/', icon: <FaInstagram /> },
];

const FooterSection = () => (
  <footer style={{background: '#223A5F', color: '#fff', padding: '48px 0 24px 0', fontFamily: 'Quicksand, sans-serif', fontSize: 16, marginTop: 60}}>
    <div style={{maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 32, padding: '0 24px'}}>
      {/* Brand & Info */}
      <div style={{flex: '1 1 220px', minWidth: 200, marginBottom: 24}}>
      <img 
  src="/HouseNSeek.png"
  alt="HouseNSeek Logo"
  style={{
    height: 60,
    width: 160, // Fixed width
    objectFit: 'contain', // Prevents distortion
    marginBottom: 12,
  }}
/>
        <div style={{fontSize: 15, opacity: 0.85, marginBottom: 18}}>
          The best real estate platform for buying, selling, and renting apartments and homes in India.
        </div>
        <div style={{display: 'flex', gap: 16, marginTop: 8}}>
          {socialLinks.map((s, i) => (
            <a 
              key={i}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                height: 35, 
                width: 35, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#fff',
                textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '50%',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              {s.icon}
            </a>
          ))}
        </div>
      </div>
      {/* Quick Links */}
      <div style={{flex: '1 1 160px', minWidth: 140, marginBottom: 24}}>
        <div style={{fontWeight: 700, fontSize: 18, marginBottom: 14}}>Quick Links</div>
        <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
          {footerLinks.map((l, i) => (
            <li key={i} style={{marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8}}>
              <span style={{fontSize: 18, color: '#fff'}}>▶</span>
              <a href={l.to} style={{color: '#fff', textDecoration: 'none', fontWeight: 500}}>{l.label}</a>
            </li>
          ))}
        </ul>
      </div>
      {/* Site Links */}
      <div style={{flex: '1 1 160px', minWidth: 140, marginBottom: 24}}>
        <div style={{fontWeight: 700, fontSize: 18, marginBottom: 14}}>Site Links</div>
        <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
          {siteLinks.map((l, i) => (
            <li key={i} style={{marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8}}>
              <span style={{fontSize: 18, color: '#fff'}}>▶</span>
              <a href={l.to} style={{color: '#fff', textDecoration: 'none', fontWeight: 500}}>{l.label}</a>
            </li>
          ))}
        </ul>
      </div>
      {/* Contact Info */}
      <div style={{flex: '1 1 200px', minWidth: 180, marginBottom: 24}}>
        <div style={{fontWeight: 700, fontSize: 18, marginBottom: 14}}>Contact Info</div>
        <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
          {contactLinks.map((c, i) => (
            <li key={i} style={{marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12}}>
              {c.icon}
              <a href={c.url} style={{color: '#fff', textDecoration: 'none', fontWeight: 500}}>{c.text}</a>
            </li>
          ))}
        </ul>
      </div>
    </div>
    {/* Copyright */}
    <div style={{borderTop: '1px solid rgba(255,255,255,0.2)', marginTop: 32, padding: '24px 24px 0 24px', textAlign: 'center', opacity: 0.8, fontSize: 14}}>
      © 2024 HouseNSeek. All rights reserved.
    </div>
  </footer>
);

export default FooterSection;
