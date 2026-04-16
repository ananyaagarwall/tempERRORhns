import React from 'react';
import { Link } from 'react-router-dom';
import "../../blog_page_css/FamousSection.css";
import { famousBlogs } from '../../data/blogData';

const FamousSection = () => {
  return (
    <div className="famous-section">
      <h2 className="famous-heading">
        Curated Picks Just for You
      </h2>

      <div className="famous-cards">
        {famousBlogs.map((blog) => (
          <div key={blog.id} className="famous-card group">
            <div className="famous-img-container">
              <img
                src={blog.featured_image}
                alt={blog.featured_image_alt || blog.title}
                className="famous-img"
              />
              <div className="famous-img-overlay"></div>
            </div>

            <div className="famous-card-body">
              <h3 className="famous-title">{blog.title}</h3>
              <div className="famous-date">
                <span>{new Date(blog.created_at).toLocaleDateString()}</span>
              </div>
              <p className="famous-intro">{blog.intro_paragraph?.slice(0, 80)}...</p>
              <div className="famous-link">
                <Link to={`/blog/${blog.slug}`} className="famous-view">View Post</Link>
                <svg className="famous-arrow" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FamousSection;
