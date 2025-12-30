import React from 'react';
import '../../home_page_css/BudgetSection.css';
import SectionHeading from './SectionHeading';

const BUDGET_OPTIONS = [
  {
    img: '/World-View-tower.jpg',
    title: 'Budget-Friendly Homes',
    details: '300–550 sq. ft. | ₹30–70 Lakhs',
    locations: ['Mira Road', 'Vasai', 'Virar', 'Kalyan'],
  },
  {
    img: '/depositphotos.jpg',
    title: 'Mid Range Properties',
    details: '550–900 sq. ft. | ₹80 Lakhs–₹1.8 Crore',
    locations: ['Thane', 'Ghansoli', 'Airoli', 'Vashi'],
  },
  {
    img: '/building.webp',
    title: 'Pre-Launch / Investment Picks',
    details: '400–1000 sq. ft. | ₹90 Lakhs–₹1.5 Crore',
    locations: ['Panvel', 'Chembur', 'Wadala', 'Byculla'],
  },
  {
    img: '/residence-agencies.avif',
    title: 'Luxury Apartments',
    details: '1200+ sq. ft. | ₹2.5 Crore +',
    locations: ['Worli', 'Bandra', 'Juhu', 'Andheri'],
  },
];

const BudgetSection = () => (
  <section className="budget-section">
    {/* Heading container with proper positioning */}
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
    </div>
    
    <div style={{ position: 'relative', zIndex: 2 }}>
      {/* Blue background behind the white card */}
      <div className="budget-bg" />
      <div className="budget-container">
      <div className="budget-card-outer">
        <h3 className="budget-title">Find by budget</h3>
        <div className="budget-subtitle">What's your Budget range?</div>
        <div className="budget-options-list">
          {BUDGET_OPTIONS.map((option, index) => (
            <div key={index} className="budget-option-row">
              <img
                src={option.img}
                alt={option.title}
                className="budget-option-img"
              />
              <div className="budget-option-info">
                <div className="budget-option-title">{option.title}</div>
                <div className="budget-option-details">{option.details}</div>
              </div>
              <div className="budget-option-locations">
                {option.locations.join(' | ')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </div>
  </section>
);

export default BudgetSection;
