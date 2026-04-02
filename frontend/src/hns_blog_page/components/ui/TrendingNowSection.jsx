import React from 'react';
import { Link } from 'react-router-dom';
import "../../blog_page_css/TrendingNowSection.css";
import { trendingBlogs } from '../../data/blogData';

const TrendingNowSection = () => {
  return (
    <section className="trending-section">
      <div className="trending-header">
        <div className="icon-wrapper">
          <svg className="trending-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <h2 className="trending-title">Trending Now</h2>
      </div>

      <div className="trending-cards-container">
        {trendingBlogs.map((news, idx) => {
          const badges = ['Hot', 'Trending', 'New'];
          const categories = ['Exclusive', 'Breaking', 'Market'];
          return (
            <Link key={news.id} to={`/blog/${news.slug}`} className="trending-card-link">
              <article className="trending-card">
                <div className="card-image-wrapper">
                  <span className={`badge badge-${badges[idx].toLowerCase()}`}>
                    {badges[idx]}
                  </span>
                  <img
                    src={news.featured_image}
                    alt={news.featured_image_alt || news.title}
                    className="card-image"
                    loading="lazy"
                  />
                </div>

                <div className="card-content">
                  <div className="card-meta-top">
                    <span className="meta-category">{categories[idx]}</span>
                    <span className="meta-dot">•</span>
                    <span className="meta-date">{new Date(news.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  </div>

                  <h3 className="card-title">{news.title}</h3>

                  <div className="card-footer">
                    <span className="author-name">By {news.author}</span>
                    <div className="read-more-btn">
                      <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default TrendingNowSection;