import React from 'react';
import { Link } from 'react-router-dom';
import "../../blog_page_css/TrendingNowSection.css";

const TrendingNowSection = () => {
  const trendingItems = [
    {
      id: 'trend1',
      featured_image: '/1484471303-realty-getty.jpg',
      featured_image_alt: 'Navi Mumbai',
      title: 'Navi Mumbai Set for Major Infrastructure Boost',
      category: 'Exclusive',
      badge: 'Hot',
      author: 'Admin',
      created_at: new Date().toISOString(),
      slug: 'navi-mumbai-infra',
    },
    {
      id: 'trend2',
      featured_image: '/Defining-Demand.jpg',
      featured_image_alt: 'Trade Rumors',
      title: "Boeser Trade Rumors: What's the Reality?",
      category: 'Breaking',
      badge: 'Breaking',
      author: 'Editor',
      created_at: new Date().toISOString(),
      slug: 'boeser-trade-rumors',
    },
    {
      id: 'trend3',
      featured_image: '/news.jpg',
      featured_image_alt: 'Real Estate Market',
      title: 'Maharashtra Real Estate Market Hits New High',
      category: 'Market',
      badge: 'Exclusive',
      author: 'Reporter',
      created_at: new Date().toISOString(),
      slug: 'maharashtra-market-high',
    },
  ];

  return (
    <div className="trending-section">
      <div className="trending-header">
      <svg className="trending-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"> <path strokeLinecap="round" strokeLinejoin="round" d="M19 7v4H5V7a2 2 0 012-2h10a2 2 0 012 2z" /> <path strokeLinecap="round" strokeLinejoin="round" d="M5 11v6a2 2 0 002 2h10a2 2 0 002-2v-6" /> </svg>

        <span className="trending-title">Trending Now</span>
       
      </div>

      <div className="trending-cards">
        {trendingItems.map((news) => (
          <Link key={news.id} to={`/blog/${news.slug}`} className="trending-card-link">
            <div className="trending-card">
              <div className="card-image-container">
                <img
                  src={news.featured_image}
                  alt={news.featured_image_alt || news.title}
                  className="card-image"
                />
                <div className="image-overlay"></div>
              </div>

              <div className="card-content">
                <h3 className="card-title">{news.title}</h3>
                <div className="card-meta">
                  <span>By {news.author}</span>
                </div>
                <div className="card-footer">
                  <span className="read-more">Read More</span>
                  <svg className="read-more-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <span className="card-date">{new Date(news.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TrendingNowSection;
