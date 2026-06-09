import API_BASE_URL from '../../../config';
import React, { useState, useEffect } from 'react';
import { Search, Building2, MapPin, CheckCircle, Calendar, ExternalLink, Phone, Mail, X, Map, ChevronRight, ChevronLeft, SlidersHorizontal } from 'lucide-react';
import { useSearchSuggestions } from '../../../hooks/useSearchSuggestions';
import { useCart } from '../../../hns_cart_page/js/CartContent.jsx';
import FooterNavBar from '../layout/FooterNavBar';
import DynamicBreadcrumb from '../../../components/ui/DynamicBreadcrumb';

/* ─── Design Tokens ─── */
const C = {
  navy: '#223A5F',
  navyLight: '#2d4e80',
  gold: '#F1D97A',
  goldDark: '#e6c75e',
  white: '#ffffff',
  bg: '#f5f6fa',
  cardBg: '#ffffff',
  border: '#e5e9f5',
  textPrimary: '#1a2a4a',
  textSecondary: '#5a6a87',
  textMuted: '#8a9bbf',
  success: '#22c55e',
  successLight: '#dcfce7',
  accent: '#4A7CFF',
  accentLight: '#eef3ff',
};

const font = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

/* ─── Heart SVG ─── */
const HeartSVG = ({ filled }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill={filled ? '#e74c3c' : 'none'} stroke={filled ? '#e74c3c' : '#8a9bbf'} strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

/* ══════════════════════════════════════════════════════════════
   Horizontal Builder Card (defined globally to prevent unmounting/glitching)
   ══════════════════════════════════════════════════════════════ */
const BuilderCard = ({ builder, saved, hovered, onMouseEnter, onMouseLeave, onHeartClick }) => {
  return (
    <div
      className="nbl-card"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        borderColor: hovered ? C.gold : C.border,
        boxShadow: hovered
          ? '0 12px 40px -8px rgba(34,58,95,0.18), 0 2px 12px rgba(241,217,122,0.14)'
          : '0 2px 16px -4px rgba(34,58,95,0.08)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
      }}
    >
      {/* Thumbnail */}
      <div className="nbl-card-thumb">
        {builder.cover_banner ? (
          <img src={builder.cover_banner} alt={builder.company_name} />
        ) : (
          <div className="nbl-card-thumb-fallback">
            <Building2 size={32} style={{ color: C.navy, opacity: 0.4 }} />
          </div>
        )}
        {/* Verified badge */}
        {builder.verified && (
          <span className="nbl-verified-badge">
            <CheckCircle size={10} /> Verified
          </span>
        )}
      </div>

      {/* Details */}
      <div className="nbl-card-body">
        <div className="nbl-card-top">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 className="nbl-card-name">{builder.company_name}</h3>
            <div className="nbl-card-location">
              <MapPin size={13} />
              <span>{builder.city}, {builder.state}</span>
            </div>
          </div>
          {/* Heart */}
          <button
            className="nbl-heart-btn"
            onClick={onHeartClick}
            aria-label={saved ? 'Remove from saved' : 'Save builder'}
            style={{
              background: saved ? 'rgba(231,76,60,0.08)' : 'transparent',
              borderColor: saved ? 'rgba(231,76,60,0.25)' : C.border,
            }}
          >
            <HeartSVG filled={saved} />
          </button>
        </div>

        {/* Stats row */}
        <div className="nbl-card-stats">
          <div className="nbl-stat">
            <Building2 size={13} />
            <span><strong>{builder.completed_projects || 0}</strong> Completed</span>
          </div>
          <div className="nbl-stat">
            <Calendar size={13} />
            <span><strong>{builder.ongoing_projects || 0}</strong> Ongoing</span>
          </div>
          {builder.established_year && (
            <div className="nbl-stat">
              <Calendar size={13} />
              <span>Est. {builder.established_year}</span>
            </div>
          )}
        </div>

        {/* Bottom row */}
        <div className="nbl-card-bottom">
          {builder.rera_registered && (
            <span className="nbl-rera-pill">
              <CheckCircle size={11} /> RERA Verified
            </span>
          )}
          {builder.builder_type && (
            <span className="nbl-type-pill">{builder.builder_type}</span>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              className="nbl-view-btn"
              onClick={() => window.location.href = `/builder/${builder.company_name.replace(/\s+/g, '-')}`}
            >
              View Details
            </button>
            {builder.website_url && builder.website_url !== 'NA' && (
              <a href={builder.website_url} target="_blank" rel="noopener noreferrer" className="nbl-ext-link">
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   Map Placeholder (defined globally to prevent unmounting/glitching)
   ══════════════════════════════════════════════════════════════ */
const MapPlaceholder = ({ filteredBuilders }) => (
  <div className="nbl-map-inner">
    {/* Decorative dots */}
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.12 }}>
      <defs>
        <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="20" cy="20" r="1.5" fill={C.navy} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#mapGrid)" />
      {/* Fake roads */}
      <line x1="0" y1="30%" x2="100%" y2="35%" stroke={C.border} strokeWidth="2" />
      <line x1="0" y1="60%" x2="100%" y2="55%" stroke={C.border} strokeWidth="2" />
      <line x1="25%" y1="0" x2="30%" y2="100%" stroke={C.border} strokeWidth="2" />
      <line x1="65%" y1="0" x2="60%" y2="100%" stroke={C.border} strokeWidth="2" />
    </svg>
    {/* Pins for builders */}
    {filteredBuilders.slice(0, 6).map((b, i) => {
      const positions = [
        { top: '22%', left: '30%' }, { top: '35%', left: '65%' },
        { top: '55%', left: '25%' }, { top: '48%', left: '72%' },
        { top: '70%', left: '45%' }, { top: '28%', left: '50%' },
      ];
      const pos = positions[i] || positions[0];
      return (
        <div key={b.rera_id || i} className="nbl-map-pin" style={{ top: pos.top, left: pos.left }}>
          <div className="nbl-map-pin-dot">{i + 1}</div>
          <div className="nbl-map-pin-label">{b.company_name?.split(' ')[0]}</div>
        </div>
      );
    })}
    {/* Center label */}
    <div className="nbl-map-center-label">
      <Map size={18} style={{ marginBottom: 4 }} />
      <span>Navi Mumbai</span>
      <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>Interactive map coming soon</span>
    </div>
    {/* Go to map button */}
    <button className="nbl-map-goto-btn">
      <Map size={15} /> Go to map
    </button>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════ */
const NewBuilderListing = () => {
  const [builders, setBuilders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [mapExpanded, setMapExpanded] = useState(true);      // map panel visibility
  const [mapFullWidth, setMapFullWidth] = useState(false);    // map takes full width

  const { addBuilder, removeBuilder, isBuilderSaved } = useCart();

  /* ── Fetch ── */
  const fetchBuilders = async (q = '', isSearch = false) => {
    try {
      if (isSearch) setSearching(true);
      else setLoading(true);
      const token = localStorage.getItem('token');
      const url = q
        ? `${API_BASE_URL}/api/builders/search?q=${encodeURIComponent(q)}`
        : `${API_BASE_URL}/api/builders`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to fetch builders');
      const data = await response.json();
      setBuilders(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const { value: searchTerm, inputRef: searchInputRef, handleChange: handleSearchChange,
    handleKeyDown: handleSearchKeyDown, SuggestionsPortal,
  } = useSearchSuggestions({
    onFilter: (val) => fetchBuilders(val, true),
    onSelect: (phrase) => fetchBuilders(phrase, true),
  });

  useEffect(() => { fetchBuilders(); }, []);

  const filteredBuilders = builders
    .filter(b =>
      filterType === 'all' || b.builder_type?.toLowerCase().includes(filterType.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return (a.company_name || '').localeCompare(b.company_name || '');
        case 'projects': return (b.completed_projects || 0) - (a.completed_projects || 0);
        case 'established': return (b.established_year || 0) - (a.established_year || 0);
        default: return 0;
      }
    });

  const handleHeartClick = (e, builder) => {
    e.stopPropagation();
    if (isBuilderSaved(builder.rera_id)) removeBuilder(builder.rera_id);
    else addBuilder(builder);
  };

  /* ── Active filter chips ── */
  const activeFilters = [];
  if (filterType !== 'all') activeFilters.push({ label: filterType.charAt(0).toUpperCase() + filterType.slice(1), key: 'type' });
  if (sortBy !== 'name') activeFilters.push({ label: `Sort: ${sortBy === 'projects' ? 'Projects' : 'Year'}`, key: 'sort' });
  if (searchTerm) activeFilters.push({ label: `"${searchTerm}"`, key: 'search' });

  const removeFilter = (key) => {
    if (key === 'type') setFilterType('all');
    if (key === 'sort') setSortBy('name');
    if (key === 'search') { handleSearchChange(''); fetchBuilders('', true); }
  };

  // Nested components moved outside the main NewBuilderListing component definition to prevent unmounting/glitching on state updates.

  /* ══════════════════════════════════════════════════════════════
     STYLES (embedded)
     ══════════════════════════════════════════════════════════════ */
  const styles = `
    @keyframes nblSpin { to { transform: rotate(360deg); } }
    @keyframes nblFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

    .nbl-page { min-height: 100vh; background: ${C.bg}; font-family: ${font}; }

    /* ── Hero Stripe ── */
    .bl-hero-stripe {
      position: relative;
      width: 100%;
      min-height: 220px;
      background-size: cover;
      background-position: center;
      background-attachment: fixed;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .bl-hero-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(34,58,95,0.88) 0%, rgba(45,78,128,0.78) 50%, rgba(34,58,95,0.85) 100%);
    }
    .bl-hero-content {
      position: relative;
      z-index: 1;
      text-align: center;
      padding: 2.5rem 2rem;
      max-width: 780px;
    }
    .bl-hero-title {
      font-size: clamp(1.6rem, 4vw, 2.6rem);
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 6px;
      letter-spacing: -0.5px;
      font-family: 'Abril Fatface', serif;
      text-shadow: 0 2px 20px rgba(0,0,0,0.3);
    }
    .bl-hero-accent {
      width: 60px;
      height: 3px;
      background: linear-gradient(90deg, #F1D97A, #e6c75e);
      border-radius: 2px;
      margin: 8px auto 14px;
      box-shadow: 0 2px 12px rgba(241,217,122,0.5);
    }
    .bl-hero-desc {
      color: rgba(255,255,255,0.90);
      font-size: 0.95rem;
      margin: 0 auto;
      line-height: 1.6;
      max-width: 580px;
      font-weight: 400;
    }
    .bl-hero-stats {
      display: flex;
      justify-content: center;
      gap: 2.5rem;
      flex-wrap: wrap;
      margin-top: 1.2rem;
    }
    .bl-hero-stat-num {
      font-size: 1.5rem;
      font-weight: 800;
      display: block;
    }
    .bl-hero-stat-label {
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.70);
    }

    /* ── Search Card (floating) ── */
    .nbl-search-float {
      max-width: 1400px;
      margin: -28px auto 0;
      padding: 0 28px;
      position: relative;
      z-index: 10;
    }
    .nbl-search-card {
      background: ${C.white};
      border-radius: 18px;
      box-shadow: 0 8px 40px rgba(34,58,95,0.12), 0 1px 3px rgba(0,0,0,0.04);
      padding: 18px 22px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .nbl-search-row {
      display: flex;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;
    }
    .nbl-search-input-wrap {
      flex: 1 1 260px;
      position: relative;
      min-width: 0;
    }
    .nbl-search-input {
      width: 100%;
      height: 44px;
      padding: 0 16px 0 42px;
      border: 1.5px solid ${C.border};
      border-radius: 12px;
      font-size: 0.9rem;
      color: ${C.textPrimary};
      font-family: ${font};
      outline: none;
      background: ${C.bg};
      transition: all 0.2s ease;
      box-sizing: border-box;
    }
    .nbl-search-input:focus { border-color: ${C.accent}; background: #fff; }
    .nbl-search-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: ${C.textMuted};
      z-index: 1;
    }
    .nbl-filter-select {
      height: 44px;
      padding: 0 14px;
      border: 1.5px solid ${C.border};
      border-radius: 12px;
      font-size: 0.88rem;
      color: ${C.textPrimary};
      font-family: ${font};
      outline: none;
      background: ${C.bg};
      cursor: pointer;
      transition: all 0.2s ease;
      box-sizing: border-box;
    }
    .nbl-filter-select:focus { border-color: ${C.accent}; }

    /* Filter chips */
    .nbl-chips-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
    }
    .nbl-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 14px;
      background: ${C.accentLight};
      color: ${C.accent};
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      border: 1px solid rgba(74,124,255,0.18);
      cursor: default;
      animation: nblFadeIn 0.2s ease;
    }
    .nbl-chip button {
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      color: ${C.accent};
      display: flex;
      align-items: center;
      opacity: 0.6;
      transition: opacity 0.15s;
    }
    .nbl-chip button:hover { opacity: 1; }
    .nbl-chip-count {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 12px;
      background: rgba(34,58,95,0.06);
      color: ${C.textSecondary};
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 600;
      margin-left: auto;
    }

    /* ── Main Layout ── */
    .nbl-main {
      max-width: 1400px;
      margin: 24px auto 0;
      padding: 0 28px 80px;
      display: flex;
      gap: 24px;
      align-items: flex-start;
    }
    .nbl-list-panel {
      flex: 1 1 0%;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .nbl-list-header {
      font-size: 1.3rem;
      font-weight: 800;
      color: ${C.textPrimary};
      margin: 0;
      letter-spacing: -0.3px;
    }

    /* ── Map Panel ── */
    .nbl-map-panel {
      width: 380px;
      flex-shrink: 0;
      position: sticky;
      top: 90px;
      border-radius: 20px;
      background: ${C.white};
      border: 1.5px solid ${C.border};
      box-shadow: 0 4px 24px rgba(34,58,95,0.08);
      overflow: hidden;
      transition: width 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.3s;
    }
    .nbl-map-panel.collapsed {
      width: 0;
      border: none;
      box-shadow: none;
      overflow: hidden;
      opacity: 0;
      padding: 0;
    }
    .nbl-map-panel.fullwidth {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      z-index: 999;
      border-radius: 0;
      top: 0;
    }
    .nbl-map-toggle {
      position: absolute;
      top: 12px;
      right: 12px;
      z-index: 10;
      width: 34px;
      height: 34px;
      border-radius: 10px;
      background: ${C.white};
      border: 1.5px solid ${C.border};
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: ${C.navy};
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: all 0.2s;
    }
    .nbl-map-toggle:hover { background: ${C.bg}; }
    .nbl-map-inner {
      position: relative;
      height: 520px;
      background: linear-gradient(145deg, #eef2f9 0%, #f8f9fc 50%, #e8ecf4 100%);
      overflow: hidden;
    }
    .nbl-map-panel.fullwidth .nbl-map-inner { height: 100vh; }

    /* Map decorations */
    .nbl-map-pin {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      transform: translate(-50%, -50%);
      cursor: pointer;
      transition: transform 0.2s;
    }
    .nbl-map-pin:hover { transform: translate(-50%, -50%) scale(1.15); }
    .nbl-map-pin-dot {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: ${C.accent};
      color: #fff;
      font-size: 0.72rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(74,124,255,0.35);
      border: 2px solid #fff;
    }
    .nbl-map-pin-label {
      margin-top: 3px;
      font-size: 0.62rem;
      font-weight: 600;
      color: ${C.textSecondary};
      background: rgba(255,255,255,0.85);
      padding: 1px 6px;
      border-radius: 6px;
      white-space: nowrap;
    }
    .nbl-map-center-label {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      color: ${C.navy};
      font-weight: 700;
      font-size: 1rem;
      opacity: 0.35;
      pointer-events: none;
    }
    .nbl-map-goto-btn {
      position: absolute;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 28px;
      background: ${C.accent};
      color: #fff;
      border: none;
      border-radius: 24px;
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(74,124,255,0.35);
      transition: all 0.2s;
      font-family: ${font};
    }
    .nbl-map-goto-btn:hover { background: #3a6ae8; transform: translateX(-50%) translateY(-2px); }

    /* Collapsed state: show a thin sidebar toggle */
    .nbl-map-collapsed-toggle {
      position: fixed;
      right: 20px;
      bottom: 90px;
      z-index: 100;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: ${C.accent};
      color: #fff;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(74,124,255,0.4);
      transition: all 0.2s;
    }
    .nbl-map-collapsed-toggle:hover { transform: scale(1.08); }

    /* ── Horizontal Card ── */
    .nbl-card {
      display: flex;
      background: ${C.cardBg};
      border-radius: 16px;
      border: 1.5px solid ${C.border};
      overflow: hidden;
      transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
      cursor: default;
      animation: nblFadeIn 0.35s ease both;
    }
    .nbl-card-thumb {
      width: 180px;
      min-height: 150px;
      flex-shrink: 0;
      position: relative;
      overflow: hidden;
      background: linear-gradient(135deg, ${C.navy} 0%, ${C.navyLight} 100%);
    }
    .nbl-card-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .nbl-card-thumb-fallback {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .nbl-verified-badge {
      position: absolute;
      top: 10px;
      left: 10px;
      background: ${C.success};
      color: #fff;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 0.65rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 3px;
      box-shadow: 0 2px 6px rgba(34,197,94,0.3);
    }
    .nbl-card-body {
      flex: 1;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-width: 0;
    }
    .nbl-card-top {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .nbl-card-name {
      font-size: 1.05rem;
      font-weight: 750;
      color: ${C.textPrimary};
      margin: 0 0 4px;
      letter-spacing: -0.2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .nbl-card-location {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.8rem;
      color: ${C.textSecondary};
    }
    .nbl-card-location svg { flex-shrink: 0; color: ${C.accent}; }
    .nbl-heart-btn {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 1.5px solid ${C.border};
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .nbl-heart-btn:hover { background: rgba(231,76,60,0.06); }

    .nbl-card-stats {
      display: flex;
      gap: 16px;
      margin: 10px 0;
      flex-wrap: wrap;
    }
    .nbl-stat {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.78rem;
      color: ${C.textSecondary};
    }
    .nbl-stat svg { color: ${C.navy}; flex-shrink: 0; }
    .nbl-stat strong { color: ${C.textPrimary}; font-weight: 700; }

    .nbl-card-bottom {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .nbl-rera-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 10px;
      background: ${C.successLight};
      color: #15803d;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 700;
      border: 1px solid rgba(34,197,94,0.2);
    }
    .nbl-type-pill {
      padding: 3px 10px;
      background: rgba(34,58,95,0.06);
      color: ${C.textSecondary};
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 600;
    }
    .nbl-view-btn {
      padding: 8px 20px;
      background: linear-gradient(135deg, ${C.navy}, ${C.navyLight});
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      font-family: ${font};
      letter-spacing: 0.02em;
      transition: all 0.2s;
      box-shadow: 0 2px 10px rgba(34,58,95,0.2);
    }
    .nbl-view-btn:hover { box-shadow: 0 4px 16px rgba(34,58,95,0.3); }
    .nbl-ext-link {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      border: 1.5px solid ${C.border};
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${C.navy};
      text-decoration: none;
      transition: all 0.2s;
      flex-shrink: 0;
    }
    .nbl-ext-link:hover { background: ${C.gold}; border-color: ${C.goldDark}; }

    /* ── Loading / Error / Empty ── */
    .nbl-center-state {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      text-align: center;
      flex-direction: column;
      gap: 12px;
    }
    .nbl-spinner {
      width: 44px; height: 44px; border-radius: 50%;
      border: 4px solid ${C.border}; border-top-color: ${C.navy};
      animation: nblSpin 0.8s linear infinite;
    }

    /* ── Responsive ── */
    @media (max-width: 1024px) {
      .nbl-map-panel { display: none; }
      .nbl-map-collapsed-toggle { display: flex; }
      .nbl-main { padding: 0 16px 80px; }
      .bl-hero-stripe { min-height: 180px; }
      .bl-hero-content { padding: 2rem 1.5rem; }
      .bl-hero-title { font-size: 1.8rem; }
      .bl-hero-desc { font-size: 0.88rem; }
      .bl-hero-stat-num { font-size: 1.3rem; }
      .bl-hero-stats { gap: 2rem; margin-top: 1rem; }
      .nbl-search-float { padding: 0 16px; }
    }
    @media (min-width: 1025px) {
      .nbl-map-collapsed-toggle { display: none; }
    }
    @media (max-width: 639px) {
      .bl-hero-stripe {
        min-height: 140px;
        background-attachment: scroll;
      }
      .bl-hero-content { padding: 1.5rem 1.2rem; }
      .bl-hero-title { font-size: 1.4rem; margin-bottom: 4px; }
      .bl-hero-accent { width: 40px; height: 2.5px; margin: 6px auto 10px; }
      .bl-hero-desc { font-size: 0.78rem; line-height: 1.5; }
      .bl-hero-stats { display: none; }
      .nbl-search-card { padding: 14px 14px; border-radius: 14px; }
      .nbl-search-float { margin-top: -20px; }
      .nbl-search-input { height: 40px; font-size: 0.85rem; }
      .nbl-filter-select { height: 40px; font-size: 0.82rem; }
      .nbl-card { flex-direction: column; }
      .nbl-card-thumb { width: 100%; min-height: 140px; max-height: 160px; }
      .nbl-card-body { padding: 14px 16px; }
      .nbl-card-stats { gap: 10px; }
      .nbl-main { margin-top: 16px; }
      .nbl-search-float { padding: 0 12px; }
      .nbl-main { padding: 0 12px 60px; }
    }
  `;

  /* ══════════════════════════════════════════════════════════════
     LOADING
     ══════════════════════════════════════════════════════════════ */
  if (loading) {
    return (
      <div className="nbl-page">
        <style>{styles}</style>
        <FooterNavBar />
        <DynamicBreadcrumb />
        <div className="nbl-center-state" style={{ minHeight: '70vh' }}>
          <div className="nbl-spinner" />
          <p style={{ color: C.textSecondary, fontWeight: 600 }}>Loading builders...</p>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════
     ERROR
     ══════════════════════════════════════════════════════════════ */
  if (error) {
    return (
      <div className="nbl-page">
        <style>{styles}</style>
        <FooterNavBar />
        <DynamicBreadcrumb />
        <div className="nbl-center-state" style={{ minHeight: '70vh' }}>
          <Building2 size={48} style={{ color: '#e74c3c' }} />
          <h2 style={{ color: C.textPrimary, fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Error Loading Builders</h2>
          <p style={{ color: C.textSecondary }}>{error}</p>
          <button onClick={() => fetchBuilders()} className="nbl-view-btn" style={{ marginTop: 8 }}>Try Again</button>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════
     MAIN RENDER
     ══════════════════════════════════════════════════════════════ */
  return (
    <div className="nbl-page">
      <style>{styles}</style>
      <FooterNavBar />
      <DynamicBreadcrumb />

      {/* ── Hero Blob ── */}
      {/* ── Hero Image Stripe ── */}
      <div
        className="bl-hero-stripe"
        style={{
          backgroundImage: `url("${builders.find(b => b.cover_banner)?.cover_banner
            || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1920&q=80'
            }")`,
        }}
      >
        <div className="bl-hero-overlay" />
        <div className="bl-hero-content">
          <h1 className="bl-hero-title">Our Builders</h1>
          <div className="bl-hero-accent" />
          <p className="bl-hero-desc">
            The masterminds behind Navi Mumbai's skyline — vetted, verified, and building your future one floor at a time.
          </p>
          <div className="bl-hero-stats">
            <div style={{ textAlign: 'center' }}>
              <span className="bl-hero-stat-num" style={{ color: C.gold, fontFamily: font }}>
                {builders.length}+
              </span>
              <span className="bl-hero-stat-label">Trusted Builders</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span className="bl-hero-stat-num" style={{ color: C.gold, fontFamily: font }}>
                {builders.reduce((sum, b) => sum + (b.completed_projects || 0), 0)}+
              </span>
              <span className="bl-hero-stat-label">Projects Delivered</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span className="bl-hero-stat-num" style={{ color: C.gold, fontFamily: font }}>
                100%
              </span>
              <span className="bl-hero-stat-label">RERA Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Floating Search Card ── */}
      <div className="nbl-search-float">
        <div className="nbl-search-card">
          <div className="nbl-search-row">
            <div className="nbl-search-input-wrap">
              <Search size={16} className="nbl-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by builder name, project, city..."
                value={searchTerm}
                onChange={e => handleSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                autoComplete="off"
                className="nbl-search-input"
              />
              {searching && (
                <div style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  width: '14px', height: '14px', borderRadius: '50%',
                  border: `2px solid ${C.border}`, borderTopColor: C.navy,
                  animation: 'nblSpin 0.7s linear infinite',
                }} />
              )}
              <SuggestionsPortal />
            </div>

            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="nbl-filter-select">
              <option value="all">All Types</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="mixed">Mixed-Use</option>
              <option value="luxury">Luxury</option>
            </select>

            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="nbl-filter-select">
              <option value="name">Sort by Name</option>
              <option value="projects">Sort by Projects</option>
              <option value="established">Sort by Year</option>
            </select>
          </div>

          {/* Filter Chips Row */}
          {activeFilters.length > 0 && (
            <div className="nbl-chips-row">
              <SlidersHorizontal size={14} style={{ color: C.textMuted }} />
              {activeFilters.map(f => (
                <span key={f.key} className="nbl-chip">
                  {f.label}
                  <button onClick={() => removeFilter(f.key)}><X size={12} /></button>
                </span>
              ))}
              <span className="nbl-chip-count">
                <strong style={{ color: C.navy }}>{filteredBuilders.length}</strong> of {builders.length} builders
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="nbl-main">
        {/* Left: Cards */}
        <div className="nbl-list-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="nbl-list-header">Best options</h2>
            {!mapExpanded && (
              <button
                className="nbl-map-expand-btn"
                onClick={() => setMapExpanded(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: C.accentLight,
                  color: C.accent,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: font,
                }}
              >
                <Map size={14} /> Show Map
              </button>
            )}
          </div>

          {filteredBuilders.length === 0 && !searching ? (
            <div className="nbl-center-state">
              <Building2 size={56} style={{ color: C.border }} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: C.textPrimary, margin: 0 }}>No Builders Found</h3>
              <p style={{ color: C.textSecondary }}>Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredBuilders.map(builder => {
              const saved = isBuilderSaved(builder.rera_id);
              const hovered = hoveredCard === builder.rera_id;
              return (
                <BuilderCard
                  key={builder.rera_id || builder.company_name}
                  builder={builder}
                  saved={saved}
                  hovered={hovered}
                  onMouseEnter={() => setHoveredCard(builder.rera_id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onHeartClick={(e) => handleHeartClick(e, builder)}
                />
              );
            })
          )}
        </div>

        {/* Right: Map */}
        <div className={`nbl-map-panel ${mapExpanded ? '' : 'collapsed'} ${mapFullWidth ? 'fullwidth' : ''}`}>
          <button
            className="nbl-map-toggle"
            onClick={() => {
              if (mapFullWidth) setMapFullWidth(false);
              else setMapExpanded(false);
            }}
            title={mapFullWidth ? 'Exit fullscreen' : 'Collapse map'}
          >
            <X size={16} />
          </button>
          <MapPlaceholder filteredBuilders={filteredBuilders} />
        </div>
      </div>

      {/* Floating toggle when map is collapsed (desktop) */}
      {!mapExpanded && (
        <button className="nbl-map-collapsed-toggle" onClick={() => setMapExpanded(true)} title="Show map">
          <Map size={22} />
        </button>
      )}
    </div>
  );
};

export default NewBuilderListing;
