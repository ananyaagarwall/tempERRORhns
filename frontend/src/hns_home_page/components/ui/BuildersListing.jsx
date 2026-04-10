import API_BASE_URL from '../../../config';
import React, { useState, useEffect } from 'react';
import { Search, Building2, MapPin, Award, CheckCircle, Calendar, ExternalLink, Phone, Mail, Heart } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);

  const { addBuilder, removeBuilder, isBuilderSaved } = useCart();

  useEffect(() => {
    fetchBuilders();
  }, []);

  const fetchBuilders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/builders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch builders');
      const data = await response.json();
      setBuilders(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching builders:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredBuilders = builders
    .filter(b => {
      const matchesSearch =
        b.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.brand_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.location?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType =
        filterType === 'all' || b.builder_type?.toLowerCase().includes(filterType.toLowerCase());
      return matchesSearch && matchesType;
    })
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
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
      <FooterNavBar />
      <DynamicBreadcrumb />

      {/* ── Hero ── */}
      <div style={{ background: C.white }}>
        <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '64px 32px 48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '20px',
              background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyLight} 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(34,58,95,0.25)',
              flexShrink: 0,
            }}>
              <Building2 size={42} style={{ color: C.gold }} />
            </div>
            <div>
              <h1 style={{
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 800,
                color: C.navy,
                margin: '0 0 8px',
                letterSpacing: '-0.5px',
                fontFamily: "'Abril Fatface', serif",
              }}>
                Our Builders
              </h1>
              {/* Gold accent underline */}
              <div style={{
                width: '60px', height: '4px',
                background: `linear-gradient(90deg, ${C.gold}, ${C.goldDark})`,
                borderRadius: '2px', marginBottom: '12px',
                boxShadow: '0 2px 8px rgba(241,217,122,0.4)',
              }} />
              <p style={{ color: C.textSecondary, fontSize: '1.02rem', margin: 0, lineHeight: 1.6, maxWidth: '600px' }}>
                Discover trusted and verified real estate developers across Navi Mumbai.
                Explore premium projects, detailed profiles, and find the perfect builder for your dream home.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters / Search Bar ── */}
      <div style={{ background: C.bg, padding: '0 32px 32px' }}>
        <div style={{ maxWidth: '1360px', margin: '0 auto', marginTop: '-24px' }}>
          <div style={{
            background: C.white,
            borderRadius: '16px',
            border: `1.5px solid ${C.border}`,
            boxShadow: '0 8px 32px rgba(34,58,95,0.10)',
            padding: '20px 24px',
          }}>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Search Input */}
              <div style={{ flex: '1 1 280px', position: 'relative', minWidth: '220px' }}>
                <Search
                  size={17}
                  style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: searchFocused ? C.navy : C.textMuted, transition: 'color 0.2s' }}
                />
                <input
                  type="text"
                  placeholder="Search by builder name, city, or type..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  style={{
                    width: '100%',
                    paddingLeft: '42px',
                    paddingRight: '16px',
                    height: '46px',
                    border: `1.5px solid ${searchFocused ? C.navy : C.border}`,
                    borderRadius: '10px',
                    fontSize: '0.93rem',
                    color: C.textPrimary,
                    fontFamily: font,
                    outline: 'none',
                    background: '#f7f9ff',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box',
                    boxShadow: searchFocused ? `0 0 0 3px rgba(34,58,95,0.08)` : 'none',
                  }}
                />
              </div>

              {/* Type Filter */}
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                style={{
                  height: '46px',
                  padding: '0 16px',
                  border: `1.5px solid ${C.border}`,
                  borderRadius: '10px',
                  fontSize: '0.90rem',
                  color: C.textPrimary,
                  fontFamily: font,
                  outline: 'none',
                  background: '#f7f9ff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: '150px',
                }}
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
                style={{
                  height: '46px',
                  padding: '0 16px',
                  border: `1.5px solid ${C.border}`,
                  borderRadius: '10px',
                  fontSize: '0.90rem',
                  color: C.textPrimary,
                  fontFamily: font,
                  outline: 'none',
                  background: '#f7f9ff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: '150px',
                }}
              >
                <option value="name">Sort by Name</option>
                <option value="projects">Sort by Projects</option>
                <option value="established">Sort by Year</option>
              </select>

              {/* Count Badge */}
              <div style={{
                marginLeft: 'auto',
                background: `rgba(34,58,95,0.08)`,
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '0.83rem',
                color: C.textSecondary,
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}>
                <span style={{ color: C.navy, fontWeight: 800 }}>{filteredBuilders.length}</span>
                {' '}of{' '}
                <span style={{ color: C.navy, fontWeight: 800 }}>{builders.length}</span>
                {' '}builders
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Builders Grid ── */}
      <div style={{ background: C.bg, paddingBottom: '80px', padding: '0 32px 80px' }}>
        <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
          {filteredBuilders.length === 0 ? (
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
  );
};

export default BuildersListing;