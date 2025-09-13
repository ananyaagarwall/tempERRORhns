import React from 'react';
import './css/BudgetSection.css';

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
    {/* Heading above the blue background */}
    <div className="section-heading-container">
      <h2 className="section-heading">Have a Budget?</h2>
      <span className="section-underline" />
    </div>
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
  </section>
);

export default BudgetSection;
