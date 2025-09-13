// temporary test change
import React from 'react';
import { SocialIcon } from 'react-social-icons'
import { FaPhoneAlt, FaMapMarkerAlt, FaEnvelope } from "react-icons/fa";
import './css/FooterSection.css';
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
    icon: <FaMapMarkerAlt className="footer-icon" />
  },
  { 
    label: 'Email',
    text: 'hello@housenseek.com',
    url: 'mailto:hello@housenseek.com',
    icon: <FaEnvelope className="footer-icon" />
  },
  { 
    label: 'Phone',
    text: '+91 123-456-7890',
    url: 'tel:+911234567890',
    icon: <FaPhoneAlt className="footer-icon" />
  },
];

const socialLinks = [
  { label: 'Twitter', url: 'https://twitter.com/' },
  { label: 'Facebook', url: 'https://facebook.com/' },
  { label: 'Instagram', url: 'https://instagram.com/' },
];

const FooterSection = () => (
  <footer className="footer">
    <div className="footer-container">
      {/* Brand & Info */}
      <div className="footer-brand">
      <img 
  src="/HouseNSeek.png"
  alt="HouseNSeek Logo"
  className="footer-logo"
/>
        <div className="footer-description">
          The best real estate platform for buying, selling, and renting apartments and homes in India.
        </div>
        <div className="footer-social">
          {socialLinks.map((s, i) => (
            <SocialIcon 
              key={i}
              url={s.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{height: 35, width: 35}}
              fgColor="#fff"
              bgColor="transparent"
            />
          ))}
        </div>
      </div>
      {/* Quick Links */}
      <div className="footer-links">
        <div className="footer-heading">Quick Links</div>
        <ul className="footer-list">
          {footerLinks.map((l, i) => (
            <li key={i} className="footer-list-item">
              <span className="footer-list-arrow">▶</span>
              <a href={l.to} className="footer-link">{l.label}</a>
            </li>
          ))}
        </ul>
      </div>
      {/* Site Links */}
      <div className="footer-links">
        <div className="footer-heading">Site Links</div>
        <ul className="footer-list">
          {siteLinks.map((l, i) => (
            <li key={i} className="footer-list-item">
              <span className="footer-list-arrow">▶</span>
              <a href={l.to} className="footer-link">{l.label}</a>
            </li>
          ))}
        </ul>
      </div>
      {/* Contact Links */}
      <div className="footer-links">
        <div className="footer-heading">Contact links</div>
        <ul className="footer-list">
          {contactLinks.map((c, i) => (
            <li key={i} className="footer-contact-item">
              <a href={c.url} target="_blank" rel="noopener noreferrer" className="footer-contact-link">
                {c.icon}
                <span className="footer-contact-text">{c.text}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
    <div className="footer-divider" />
    <div className="footer-copyright">
      © {new Date().getFullYear()} HouseNSeek. All rights reserved.
    </div>
  </footer>
);

export default FooterSection;
