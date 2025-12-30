import React, { useState } from 'react';
import "../../blog_page_css/KnowBeforeYouBuySection.css";

const KnowBeforeYouBuySection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const cards = [
    {
      id: 1,
      backgroundImage: '/news.jpg',
      title: 'Paperwork During Buying Property',
      text: '10 Documents You Need for Property Purchase'
    },
    {
      id: 2,
      backgroundImage: '/hanging.webp',
      title: 'Home Buying 101: A Beginner\'s Guide',
      text: 'Start smart, buy smarter'
    },
    {
      id: 3,
      backgroundImage: '/property.jpg',
      title: 'Down Payment Demystified',
      text: 'How much down payment is ideal, and how it impacts your loan burden.'
    },
    {
      id: 4,
      backgroundImage: '/palm.jpg',
      title: 'What is CIBIL Score and Why It Matters?',
      text: 'Learn how your credit score impacts your home loan approval and interest rate.'
    },
    {
      id: 5,
      backgroundImage: '/garden.jpeg',
      title: 'Why Green Homes Are the New Standard',
      text: 'Explore how eco-friendly features are becoming non-negotiable for buyers.'
    },
    {
      id: 6,
      backgroundImage: '/presidental.jpeg',
      title: 'Top 7 Questions to ask a Builder before Booking',
      text: 'Don\'t fall for the brochure—know what really matters.'
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === cards.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? cards.length - 1 : prev - 1));
  };

  return (
    <section className="kbyb-section">
      {/* Section Header */}
      <div className="kbyb-header">
        <h2 className="kbyb-header">Know Before You Buy</h2>
      </div>

      {/* Featured Article */}
      <div className="kbyb-featured">
        <div className="kbyb-overlay"></div>
        <div className="kbyb-featured-content">
          <span className="kbyb-latest-badge">Latest</span>
          <h3 className="kbyb-featured-title">Real Estate Market Update: Q2 Trends & Insights</h3>
          <p className="kbyb-featured-text">
            A snapshot of current property prices, demand, and buyer behavior. 
            <span className="font-bold"> Stay ahead of the curve with every curve!</span>
          </p>
          <button className="cta-button">VIEW ARTICLE</button>
        </div>
      </div>

      {/* Desktop Grid View */}
      <div className="kbyb-grid-desktop">
        {cards.map((card) => (
          <div key={card.id} className="kbyb-card" style={{ backgroundImage: `url(${card.backgroundImage})` }}>
            <div className="kbyb-card-overlay"></div>
            <div className="kbyb-card-content">
              <h4 className="kbyb-card-title">{card.title}</h4>
              <p className="kbyb-card-text">{card.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Carousel View */}
      <div className="kbyb-carousel-mobile">
        <div className="carousel-container">
          <button className="carousel-arrow carousel-prev" onClick={prevSlide}>
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="carousel-slides">
            {cards.map((card, index) => (
              <div 
                key={card.id} 
                className={`carousel-slide ${index === currentSlide ? 'active' : ''}`}
                style={{ backgroundImage: `url(${card.backgroundImage})` }}
              >
                <div className="kbyb-card-overlay"></div>
                <div className="kbyb-card-content">
                  <h4 className="kbyb-card-title">{card.title}</h4>
                  <p className="kbyb-card-text">{card.text}</p>
                </div>
              </div>
            ))}
          </div>

          <button className="carousel-arrow carousel-next" onClick={nextSlide}>
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Carousel Indicators */}
        <div className="carousel-indicators">
          {cards.map((_, index) => (
            <button
              key={index}
              className={`carousel-indicator ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default KnowBeforeYouBuySection;
