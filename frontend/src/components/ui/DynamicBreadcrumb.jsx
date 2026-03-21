import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaChevronRight } from 'react-icons/fa';
import './DynamicBreadcrumb.css';

/**
 * Route-to-label mapping for known pages.
 * Dynamic segments (e.g. :id, :slug) are handled via customLabels prop.
 */
const ROUTE_LABELS = {
  '/': 'Home',
  '/about': 'About Us',
  '/builders-page': 'Builders',
  '/properties': 'Projects',
  '/blogs': 'Blog',
  '/cart': 'My Saved Properties',
  '/saved-properties': 'My Saved Properties',
  '/login': 'Login',
  '/signup': 'Sign Up',
  '/builder': 'Builder',
  '/builder-info': 'Builder',
};

/**
 * Derive a human-readable label for any pathname.
 * Priority: customLabels > ROUTE_LABELS > smart guess from URL segments.
 */
const labelFor = (pathname, customLabels) => {
  if (customLabels[pathname]) return customLabels[pathname];
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname];

  // Dynamic routes: /property/:id, /blog/:slug, /builder/:name
  if (pathname.startsWith('/property/')) {
    return customLabels[pathname] || 'Property Details';
  }
  if (pathname.startsWith('/blog/')) {
    return customLabels[pathname] || 'Blog Post';
  }
  if (pathname.startsWith('/builder/')) {
    return customLabels[pathname] || decodeURIComponent(pathname.split('/').pop()).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  // Fallback: capitalise the last segment
  const last = pathname.split('/').filter(Boolean).pop() || '';
  return last.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Page';
};

/**
 * Determine the "parent" page for the current route so the breadcrumb
 * shows: Home > Parent > Current.
 */
const parentFor = (pathname) => {
  if (pathname.startsWith('/property/')) return { path: '/properties', label: 'Projects' };
  if (pathname.startsWith('/blog/')) return { path: '/blogs', label: 'Blog' };
  if (pathname.startsWith('/builder/')) return { path: '/builders-page', label: 'Builders' };
  return null; // no parent beyond Home
};

const DynamicBreadcrumb = ({ customLabels = {}, className = '' }) => {
  const location = useLocation();
  const pathname = location.pathname;

  // Don't render on the home page
  if (pathname === '/') return null;

  const crumbs = [];

  // 1. Home is always first
  crumbs.push({ label: 'Home', path: '/', isHome: true });

  // 2. Parent page (if applicable)
  const parent = parentFor(pathname);
  if (parent) {
    crumbs.push({ label: parent.label, path: parent.path });
  }

  // 3. Current page (last item, not clickable)
  crumbs.push({ label: labelFor(pathname, customLabels), path: pathname, isCurrent: true });

  return (
    <nav className={`dynamic-breadcrumb ${className}`} aria-label="breadcrumb">
      <div className="breadcrumb-container">
        <div className="breadcrumb-inner">
          <div className="breadcrumb-items">
            {crumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.path + idx}>
                {crumb.isCurrent ? (
                  <span className="breadcrumb-current">{crumb.label}</span>
                ) : (
                  <Link to={crumb.path} className="breadcrumb-link">
                    {crumb.isHome && <FaHome className="breadcrumb-icon" />}
                    <span>{crumb.label}</span>
                  </Link>
                )}

                {!crumb.isCurrent && (
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