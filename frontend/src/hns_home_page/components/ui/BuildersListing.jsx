import API_BASE_URL from '../../../config';
import React, { useState, useEffect } from 'react';
import { Search, Building2, MapPin, Award, CheckCircle, Calendar, ExternalLink, Phone, Mail, Heart } from 'lucide-react';
import { useSearchSuggestions } from '../../../hooks/useSearchSuggestions';
import { useCart } from '../../../hns_cart_page/js/CartContent.jsx';
import FooterNavBar from '../layout/FooterNavBar';
import DynamicBreadcrumb from '../../../components/ui/DynamicBreadcrumb';

/* ─── Design Tokens (matches landing page) ─── */
const C = {
  navy: '#223A5F',
  navyLight: '#2d4e80',
  gold: '#F1D97A',
  goldDark: '#e6c75e',
  white: '#ffffff',
  bg: '#f7f9ff',
  cardBg: '#ffffff',
  border: '#e5e9f5',
  textPrimary: '#1a2a4a',
  textSecondary: '#5a6a87',
  textMuted: '#8a9bbf',
  success: '#22c55e',
  successLight: '#dcfce7',
};

const font = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

/* ─── Heart SVG ─── */
const HeartSVG = ({ filled }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill={filled ? '#e74c3c' : 'none'} stroke={filled ? '#e74c3c' : '#5a6a87'} strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const BuildersListing = () => {
  const [builders, setBuilders] = useState([]);
  const [loading, setLoading] = useState(true);   // initial page load only
  const [searching, setSearching] = useState(false); // lightweight filter indicator
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [hoveredCard, setHoveredCard] = useState(null);

  const { addBuilder, removeBuilder, isBuilderSaved } = useCart();

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

  /* ── Builder Card ── */
  const BuilderCard = ({ builder }) => {
    const saved = isBuilderSaved(builder.rera_id);
    const hovered = hoveredCard === builder.rera_id;

    return (
      <div
        onMouseEnter={() => setHoveredCard(builder.rera_id)}
        onMouseLeave={() => setHoveredCard(null)}
        style={{
          background: C.cardBg,
          borderRadius: '20px',
          border: `1.5px solid ${hovered ? C.gold : C.border}`,
          boxShadow: hovered
            ? '0 20px 60px -10px rgba(34,58,95,0.22), 0 4px 16px rgba(241,217,122,0.18)'
            : '0 4px 24px -4px rgba(34,58,95,0.10)',
          overflow: 'hidden',
          position: 'relative',
          fontFamily: font,
          transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
          transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
          cursor: 'default',
        }}
      >
        {/* Heart Button */}
        <button
          onClick={(e) => handleHeartClick(e, builder)}
          aria-label={saved ? 'Remove from saved' : 'Save builder'}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 10,
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: `1.5px solid ${saved ? 'rgba(231,76,60,0.3)' : 'rgba(255,255,255,0.6)'}`,
            background: saved ? 'rgba(231,76,60,0.12)' : 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          }}
        >
          <HeartSVG filled={saved} />
        </button>

        {/* Cover Banner */}
        <div style={{
          height: '120px',
          background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyLight} 60%, #3f5f9f 100%)`,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {builder.cover_banner && (
            <img
              src={builder.cover_banner}
              alt={builder.company_name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
            />
          )}
          {/* Gold accent line at bottom */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: '3px',
            background: `linear-gradient(90deg, ${C.gold}, ${C.goldDark})`,
          }} />
          {/* Verified Badge */}
          {builder.verified && (
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              background: C.success,
              color: C.white,
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              letterSpacing: '0.04em',
              boxShadow: '0 2px 8px rgba(34,197,94,0.3)',
            }}>
              <CheckCircle size={12} /> Verified
            </div>
          )}
        </div>

        {/* Logo */}
        <div style={{ padding: '0 24px', marginTop: '-36px', position: 'relative', zIndex: 2 }}>
          <div style={{
            width: '72px',
            height: '72px',
            background: C.white,
            borderRadius: '16px',
            border: `3px solid ${C.white}`,
            boxShadow: '0 4px 20px rgba(34,58,95,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {builder.builder_logo ? (
              <img
                src={builder.builder_logo}
                alt={builder.company_name}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <Building2 size={36} style={{ color: C.navy }} />
            )}
          </div>
        </div>

        {/* Card Body */}
        <div style={{ padding: '12px 24px 24px 24px' }}>
          <h3 style={{
            fontSize: '1.2rem',
            fontWeight: 800,
            color: C.textPrimary,
            margin: '0 0 4px 0',
            letterSpacing: '-0.3px',
            fontFamily: font,
          }}>
            {builder.company_name}
          </h3>
          {builder.brand_name && builder.brand_name !== builder.company_name && (
            <p style={{ fontSize: '0.82rem', color: C.textMuted, margin: '0 0 8px 0', fontWeight: 500 }}>
              {builder.brand_name}
            </p>
          )}
          {builder.short_description && (
            <p style={{
              fontSize: '0.85rem',
              color: C.textSecondary,
              margin: '0 0 16px 0',
              lineHeight: 1.55,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {builder.short_description}
            </p>
          )}

          {/* Meta info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.83rem', color: C.textSecondary }}>
              <MapPin size={14} style={{ color: C.navy, flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {builder.city}, {builder.state}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.83rem', color: C.textSecondary }}>
              <Calendar size={14} style={{ color: C.navy, flexShrink: 0 }} />
              <span>Est. {builder.established_year}</span>
            </div>
            {builder.builder_type && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.83rem', color: C.textSecondary }}>
                <Building2 size={14} style={{ color: C.navy, flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{builder.builder_type}</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            <div style={{
              background: 'rgba(34,58,95,0.06)',
              border: `1px solid rgba(34,58,95,0.12)`,
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: C.navy, fontFamily: font }}>{builder.completed_projects || 0}</div>
              <div style={{ fontSize: '0.73rem', color: C.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Completed</div>
            </div>
            <div style={{
              background: 'rgba(241,217,122,0.12)',
              border: `1px solid rgba(241,217,122,0.4)`,
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: C.goldDark, fontFamily: font }}>{builder.ongoing_projects || 0}</div>
              <div style={{ fontSize: '0.73rem', color: C.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ongoing</div>
            </div>
          </div>

          {/* Contact */}
          {(builder.contact_email || builder.contact_number) && (
            <div style={{
              marginBottom: '14px',
              paddingBottom: '14px',
              borderBottom: `1px solid ${C.border}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
            }}>
              {builder.contact_email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.78rem', color: C.textMuted }}>
                  <Mail size={13} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{builder.contact_email}</span>
                </div>
              )}
              {builder.contact_number && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.78rem', color: C.textMuted }}>
                  <Phone size={13} style={{ flexShrink: 0 }} />
                  <span>{builder.contact_number}</span>
                </div>
              )}
            </div>
          )}

          {/* RERA Badge */}
          {builder.rera_registered && (
            <div style={{
              background: C.successLight,
              border: `1px solid rgba(34,197,94,0.3)`,
              borderRadius: '10px',
              padding: '8px 12px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
            }}>
              <CheckCircle size={14} style={{ color: C.success, flexShrink: 0 }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803d' }}>
                RERA: {builder.rera_id}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => window.location.href = `/builder/${builder.company_name.replace(/\s+/g, '-')}`}
              style={{
                flex: 1,
                background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyLight} 100%)`,
                color: C.white,
                border: 'none',
                borderRadius: '10px',
                padding: '11px 20px',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: font,
                letterSpacing: '0.03em',
                transition: 'all 0.2s ease',
                boxShadow: '0 3px 12px rgba(34,58,95,0.25)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${C.navyLight} 0%, #3f6faf 100%)`; e.currentTarget.style.boxShadow = '0 5px 18px rgba(34,58,95,0.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${C.navy} 0%, ${C.navyLight} 100%)`; e.currentTarget.style.boxShadow = '0 3px 12px rgba(34,58,95,0.25)'; }}
            >
              View Details
            </button>
            {builder.website_url && builder.website_url !== 'NA' && (
              <a
                href={builder.website_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  border: `1.5px solid ${C.border}`,
                  background: C.white,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: C.navy,
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = C.gold; e.currentTarget.style.borderColor = C.goldDark; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.white; e.currentTarget.style.borderColor = C.border; }}
              >
                <ExternalLink size={16} />
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ── Loading State ── */
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: font }}>
        <FooterNavBar />
        <DynamicBreadcrumb />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              border: `4px solid ${C.border}`, borderTopColor: C.navy,
              animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
            }} />
            <p style={{ color: C.textSecondary, fontWeight: 600, fontSize: '1rem' }}>Loading builders...</p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Error State ── */
  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: font }}>
        <FooterNavBar />
        <DynamicBreadcrumb />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
          <div style={{
            background: C.white, borderRadius: '20px', padding: '48px',
            boxShadow: '0 8px 40px rgba(34,58,95,0.12)', textAlign: 'center', maxWidth: '400px',
          }}>
            <Building2 size={56} style={{ color: '#e74c3c', marginBottom: '16px' }} />
            <h2 style={{ color: C.textPrimary, fontSize: '1.5rem', fontWeight: 800, margin: '0 0 8px' }}>Error Loading Builders</h2>
            <p style={{ color: C.textSecondary, marginBottom: '20px' }}>{error}</p>
            <button
              onClick={fetchBuilders}
              style={{
                background: `linear-gradient(135deg, ${C.navy}, ${C.navyLight})`,
                color: C.white, border: 'none', borderRadius: '10px',
                padding: '12px 28px', fontWeight: 700, fontSize: '0.95rem',
                cursor: 'pointer', fontFamily: font,
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main Render ── */
  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: font }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

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

        /* ── Search Bar ── */
        .bl-search-wrapper {
          background: #f7f9ff;
          padding: 0 24px 24px;
          overflow: hidden;
        }
        .bl-search-card {
          max-width: 1360px;
          margin: -18px auto 0;
          background: #ffffff;
          border-radius: 14px;
          border: 1.5px solid #e5e9f5;
          box-shadow: 0 6px 24px rgba(34,58,95,0.08);
          padding: 14px 18px;
          box-sizing: border-box;
          overflow: hidden;
        }
        .bl-search-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
          width: 100%;
        }
        .bl-search-input-wrap {
          flex: 1 1 220px;
          position: relative;
          min-width: 0;
        }
        .bl-search-input {
          width: 100%;
          padding-left: 38px;
          height: 42px;
          border: 1.5px solid #e5e9f5;
          border-radius: 10px;
          font-size: 0.88rem;
          color: #1a2a4a;
          outline: none;
          background: #f7f9ff;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .bl-search-input:focus { border-color: #223A5F; }
        .bl-filter-select {
          height: 42px;
          padding: 0 12px;
          border: 1.5px solid #e5e9f5;
          border-radius: 10px;
          font-size: 0.85rem;
          color: #1a2a4a;
          outline: none;
          background: #f7f9ff;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
        }
        .bl-count-badge {
          margin-left: auto;
          background: rgba(34,58,95,0.08);
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 0.80rem;
          color: #5a6a87;
          font-weight: 600;
          white-space: nowrap;
          box-sizing: border-box;
        }

        /* ── Mobile (< 640px) ── */
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
          .bl-search-wrapper { padding: 0 10px 14px; }
          .bl-search-card { padding: 10px; margin-top: -10px; border-radius: 12px; }
          .bl-search-row { gap: 6px; }
          .bl-search-input-wrap { flex: 1 1 100%; min-width: 0; }
          .bl-search-input { height: 38px; font-size: 0.82rem; padding-left: 34px; }
          .bl-filter-select { height: 36px; font-size: 0.78rem; flex: 1 1 calc(50% - 3px); padding: 0 8px; }
          .bl-count-badge { margin-left: 0; width: 100%; text-align: center; padding: 5px 10px; font-size: 0.76rem; }
        }

        /* ── Tablet (640–1024px) ── */
        @media (min-width: 640px) and (max-width: 1024px) {
          .bl-hero-stripe { min-height: 180px; }
          .bl-hero-content { padding: 2rem 1.5rem; }
          .bl-hero-title { font-size: 1.8rem; }
          .bl-hero-desc { font-size: 0.88rem; }
          .bl-hero-stat-num { font-size: 1.3rem; }
          .bl-hero-stats { gap: 2rem; margin-top: 1rem; }
          .bl-search-wrapper { padding: 0 20px 24px; }
        }
      `}</style>
      <FooterNavBar />
      <DynamicBreadcrumb />

      {/* ── Hero Image Stripe ── */}
      <div
        className="bl-hero-stripe"
        style={{
          backgroundImage: `url("${
            builders.find(b => b.cover_banner)?.cover_banner
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
                {/* rera_registered is a boolean on the Builder model — count verified builders */}
                {builders.length > 0
                  ? `${Math.round((builders.filter(b => b.rera_registered).length / builders.length) * 100)}%`
                  : '100%'}
              </span>
              <span className="bl-hero-stat-label">RERA Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters / Search Bar ── */}
      <div className="bl-search-wrapper">
        <div className="bl-search-card">
          <div className="bl-search-row">
            {/* Search Input */}
            <div className="bl-search-input-wrap">
              <Search
                size={15}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.textMuted, zIndex: 1 }}
              />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search builders..."
                value={searchTerm}
                onChange={e => handleSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                autoComplete="off"
                className="bl-search-input"
                style={{
                  paddingRight: searching ? '40px' : '14px',
                  borderColor: searching ? C.navy : C.border,
                  fontFamily: font,
                }}
              />
              {searching && (
                <div style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  width: '14px', height: '14px', borderRadius: '50%',
                  border: `2px solid ${C.border}`, borderTopColor: C.navy,
                  animation: 'spin 0.7s linear infinite',
                }} />
              )}
              <SuggestionsPortal />
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="bl-filter-select"
              style={{ fontFamily: font }}
            >
              <option value="all">All Types</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="mixed">Mixed-Use</option>
              <option value="luxury">Luxury</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bl-filter-select"
              style={{ fontFamily: font }}
            >
              <option value="name">Sort by Name</option>
              <option value="projects">Sort by Projects</option>
              <option value="established">Sort by Year</option>
            </select>

            {/* Count Badge */}
            <div className="bl-count-badge">
              <span style={{ color: C.navy, fontWeight: 800 }}>{filteredBuilders.length}</span>
              {' '}of{' '}
              <span style={{ color: C.navy, fontWeight: 800 }}>{builders.length}</span>
              {' '}builders
            </div>
          </div>
        </div>
      </div>

      {/* ── Builders Grid ── */}
      <div style={{ background: C.bg, paddingBottom: '80px', padding: '0 32px 80px' }}>
        <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
          <div style={{ position: 'relative' }}>
            {filteredBuilders.length === 0 && !searching ? (
              <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <Building2 size={72} style={{ color: C.border, marginBottom: '20px' }} />
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: C.textPrimary, margin: '0 0 8px' }}>No Builders Found</h3>
                <p style={{ color: C.textSecondary, fontSize: '1.02rem' }}>Try adjusting your search or filters</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '28px',
              }}>
                {filteredBuilders.map(builder => (
                  <BuilderCard key={builder.rera_id || builder.company_name} builder={builder} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuildersListing;