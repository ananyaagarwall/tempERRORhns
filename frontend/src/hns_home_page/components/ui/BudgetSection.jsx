import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../home_page_css/BudgetSection.css';
import { usePropertiesBudget } from '../../../queries/properties';

// ---------------------------------------------------------------------------
// Budget bracket definitions — only images/labels/price bounds are hardcoded.
// Locations come from the live API.
// ---------------------------------------------------------------------------
const BUDGET_BRACKETS = [
  {
    img: '/World-View-tower.jpg',
    title: 'Budget-Friendly Homes',
    subtitle: 'Compact & affordable 1/2 BHK',
    details: '300–550 sq. ft. | Up to ₹70 Lakhs',
    priceMin: 0,
    priceMax: 70,
  },
  {
    img: '/depositphotos.jpg',
    title: 'Mid Range Properties',
    subtitle: 'Spacious 2/3 BHK with amenities',
    details: '550–900 sq. ft. | ₹70 Lakhs – ₹1.5 Crore',
    priceMin: 70,
    priceMax: 150,
  },
  {
    img: '/building.webp',
    title: 'Pre-Launch / Investment Picks',
    subtitle: 'High-growth nodes, early pricing',
    details: '400–1000 sq. ft. | ₹1.5 – ₹2.5 Crore',
    priceMin: 150,
    priceMax: 250,
  },
  {
    img: '/residence-agencies.avif',
    title: 'Luxury Apartments',
    subtitle: 'Premium living, skyline views',
    details: '1200+ sq. ft. | ₹2.5 Crore+',
    priceMin: 250,
    priceMax: 99999,
  },
];

// ---------------------------------------------------------------------------
// Parse a variety of price-string formats → value in Lakhs (number | null)
// Examples handled:
//   "45 Lakhs"  "1.2 Crore"  "₹80L"  "2Cr"  "85"  "1,20,000"
// ---------------------------------------------------------------------------
function parsePriceToLakhs(str) {
  if (!str) return null;

  // Normalise: strip currency symbol, commas, extra spaces → lowercase
  const s = str
    .toString()
    .toLowerCase()
    .replace(/[₹,]/g, '')
    .trim();

  // Match "X crore / cr / c" (must come before lakh check)
  const croreMatch = s.match(/([\d.]+)\s*(?:crore|cr\b|c\b)/);
  if (croreMatch) return parseFloat(croreMatch[1]) * 100;

  // Match "X lakh / lac / l"
  const lakhMatch = s.match(/([\d.]+)\s*(?:lakh|lac|l\b)/);
  if (lakhMatch) return parseFloat(lakhMatch[1]);

  // Bare number — if it looks like rupees (>= 100000) convert, else treat as Lakhs
  const num = parseFloat(s);
  if (!isNaN(num)) {
    return num >= 100000 ? num / 100000 : num;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Classify a price-in-lakhs into one of the 4 bracket indices (0–3)
// ---------------------------------------------------------------------------
function getBracketIndex(priceLakhs) {
  if (priceLakhs < 70) return 0;
  if (priceLakhs < 150) return 1;
  if (priceLakhs < 250) return 2;
  return 3;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const BudgetSection = () => {
  const navigate = useNavigate();

  // usePropertiesBudget uses TanStack Query with `select` to expose only
  // {Price_Starting_From, Location} — no re-renders from unrelated fields.
  // Shares cache key with useProperties({}) so no duplicate network call.
  const { data: priceLocationList = [], isLoading: loading, isError } = usePropertiesBudget();

  // Classify properties into budget brackets using useMemo — only recomputes
  // when priceLocationList changes.
  const bracketLocations = useMemo(() => {
    const sets = [new Set(), new Set(), new Set(), new Set()];
    priceLocationList.forEach((prop) => {
      const priceLakhs = parsePriceToLakhs(prop.Price_Starting_From);
      if (priceLakhs === null) return;
      const loc = (prop.Location || '').trim();
      if (!loc) return;
      sets[getBracketIndex(priceLakhs)].add(loc);
    });
    return sets.map((s) => Array.from(s).sort());
  }, [priceLocationList]);

  const fetchError = isError;

  const handleOptionClick = (bracket, locations) => {
    navigate('/properties', {
      state: {
        priceMin: bracket.priceMin,
        priceMax: bracket.priceMax,
        city: 'Navi Mumbai',
        nodes: locations,
        budgetLabel: bracket.title,
      },
    });
  };

  return (
    <section className="budget-section">
      {/* Heading */}
      <div style={{ textAlign: 'center', marginBottom: '32px', position: 'relative', zIndex: 10 }}>
        <h2 style={{
          fontSize: '2.5rem',
          fontWeight: 800,
          color: '#223A5F',
          margin: 0,
          letterSpacing: '-0.5px',
          fontFamily: "'Abril Fatface', serif"
        }}>
          Budget Properties
        </h2>
        <span style={{
          display: 'block',
          width: '80px',
          height: '4px',
          background: 'linear-gradient(90deg, #F1D97A 0%, #e6c76a 100%)',
          margin: '12px auto 0',
          borderRadius: '2px',
          boxShadow: '0 2px 4px rgba(241, 217, 122, 0.3)'
        }} />
        <p style={{
          color: '#6b7280',
          fontSize: '1rem',
          marginTop: '12px',
          fontFamily: "'Raleway', sans-serif"
        }}>
          Explore homes across Navi Mumbai — tailored to your budget
        </p>
      </div>

      <div style={{ position: 'relative', zIndex: 2 }}>
        <div className="budget-bg" />
        <div className="budget-container">
          <div className="budget-card-outer">
            <h3 className="budget-title">Find by Budget</h3>
            <div className="budget-subtitle">
              What's your range? Select a category to explore listings in Navi Mumbai.
            </div>

            {loading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280', fontFamily: "'Raleway', sans-serif" }}>
                Loading properties…
              </div>
            ) : (
              <div className="budget-options-list">
                {BUDGET_BRACKETS.map((bracket, index) => {
                  const locations = bracketLocations[index] || [];
                  return (
                    <div
                      key={index}
                      className="budget-option-row budget-option-clickable"
                      onClick={() => handleOptionClick(bracket, locations)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleOptionClick(bracket, locations)}
                      aria-label={`View ${bracket.title} properties in Navi Mumbai`}
                    >
                      <img
                        src={bracket.img}
                        alt={bracket.title}
                        className="budget-option-img"
                      />
                      <div className="budget-option-info">
                        <div className="budget-option-title">{bracket.title}</div>
                        <div className="budget-option-subtitle">{bracket.subtitle}</div>
                        <div className="budget-option-details">{bracket.details}</div>
                      </div>
                      <div className="budget-option-locations">
                        <span className="budget-locations-label">Areas</span>
                        {locations.length > 0 ? (
                          locations.map((loc, i) => (
                            <span key={i} className="budget-location-pill">{loc}</span>
                          ))
                        ) : (
                          <span
                            className="budget-location-pill"
                            style={{ opacity: 0.5, fontStyle: 'italic' }}
                          >
                            {fetchError ? 'Unavailable' : 'Coming soon'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BudgetSection;
