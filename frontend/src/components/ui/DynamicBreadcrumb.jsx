import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaChevronRight } from 'react-icons/fa';
import './DynamicBreadcrumb.css';

const DynamicBreadcrumb = ({ customLabels = {}, className = '' }) => {
  const location = useLocation();
  const pathname = location.pathname;
  
  // Define breadcrumb configuration for each route
  const getBreadcrumbConfig = () => {
    // Home page - no breadcrumb
    if (pathname === '/') {
      return [];
    }
    
    // About Us page
    if (pathname === '/about') {
      return [
        { label: 'Home', path: '/', isLast: false },
        { label: 'About Us', path: '/about', isLast: true }
      ];
    }
    
    // Builders page
    if (pathname === '/builders-page') {
      return [
        { label: 'Home', path: '/', isLast: false },
        { label: 'Builders', path: '/builders-page', isLast: true }
      ];
    }
    
    // Properties/Projects page
    if (pathname === '/properties') {
      return [
        { label: 'Home', path: '/', isLast: false },
        { label: 'Projects', path: '/properties', isLast: true }
      ];
    }
    
    // Blog listing page
    if (pathname === '/blogs') {
      return [
        { label: 'Home', path: '/', isLast: false },
        { label: 'Blog', path: '/blogs', isLast: true }
      ];
    }
    
    // Individual blog post
    if (pathname.startsWith('/blog/')) {
      const blogTitle = customLabels[pathname] || 'Blog Post';
      return [
        { label: 'Home', path: '/', isLast: false },
        { label: 'Blog', path: '/blogs', isLast: false },
        { label: blogTitle, path: pathname, isLast: true }
      ];
    }
    
    // Individual builder page
    if (pathname.startsWith('/builder/')) {
      const builderName = customLabels[pathname] || 'Builder';
      return [
        { label: 'Home', path: '/', isLast: false },
        { label: 'Builders', path: '/builders-page', isLast: false },
        { label: builderName, path: pathname, isLast: true }
      ];
    }
    
    // Default fallback - show Home only
    return [
      { label: 'Home', path: '/', isLast: true }
    ];
  };
  
  const breadcrumbs = getBreadcrumbConfig();
  
  // Don't render breadcrumb on home page
  if (breadcrumbs.length === 0) {
    return null;
  }
  
  return (
    <nav className={`dynamic-breadcrumb ${className}`} aria-label="breadcrumb">
      <div className="breadcrumb-container">
        <div className="breadcrumb-inner">
          <div className="breadcrumb-items">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.path}>
                {index === 0 ? (
                  // Home icon for first item
                  <Link to={crumb.path} className="breadcrumb-link">
                    <FaHome className="breadcrumb-icon" />
                    <span>{crumb.label}</span>
                  </Link>
                ) : crumb.isLast ? (
                  // Current page (not clickable)
                  <span className="breadcrumb-current">{crumb.label}</span>
                ) : (
                  // Middle items (clickable)
                  <Link to={crumb.path} className="breadcrumb-link">
                    {crumb.label}
                  </Link>
                )}
                
                {/* Separator */}
                {!crumb.isLast && (
                  <FaChevronRight className="breadcrumb-separator" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DynamicBreadcrumb;