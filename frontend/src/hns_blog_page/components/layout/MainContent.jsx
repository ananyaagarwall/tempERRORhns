import API_BASE_URL from '../../../config';
import React from 'react';
import '../../blog_page_css/MainContent.css';

const MainContent = ({ blog }) => {
  return (
    <div className="main-content">
      {/* Desktop/tablet only: Intro image and paragraph */}
      <div className="intro-section">
        {blog.featured_image && (
          <img
            src={`${API_BASE_URL}/uploads/${blog.featured_image}`}
            alt={blog.featured_image_alt || blog.title}
            className="intro-image"
            onError={(e) => {
              e.target.src = "/news.jpg";
            }}
          />
        )}
        <div className="intro-text">{blog.intro_paragraph}</div>
      </div>

      {blog.subheading1 && <h2 id="section-1" className="section-heading">{blog.subheading1}</h2>}
      {blog.content1 && <p className="section-content">{blog.content1}</p>}
      {blog.image1 && (
        <img
          src={`${API_BASE_URL}/uploads/${blog.image1}`}
          alt={blog.alt_text1 || ''}
          className="content-image"
          onError={(e) => {
            e.target.src = "/news.jpg";
          }}
        />
      )}

      {blog.subheading2 && <h2 id="section-2" className="section-heading">{blog.subheading2}</h2>}
      {blog.content2 && <p className="section-content">{blog.content2}</p>}
      {blog.image2 && (
        <img
          src={`${API_BASE_URL}/uploads/${blog.image2}`}
          alt={blog.alt_text2 || ''}
          className="content-image"
          onError={(e) => {
            e.target.src = "/news.jpg";
          }}
        />
      )}

      {blog.subheading3 && <h2 id="section-3" className="section-heading">{blog.subheading3}</h2>}
      {blog.content3 && <p className="section-content">{blog.content3}</p>}
      {blog.image3 && (
        <img
          src={`${API_BASE_URL}/uploads/${blog.image3}`}
          alt={blog.alt_text3 || ''}
          className="content-image"
          onError={(e) => {
            e.target.src = "/news.jpg";
          }}
        />
      )}

      {blog.interlinks?.length > 0 && (
        <div className="links-section">
          <h3 className="links-heading">Related Articles</h3>
          <ul className="links-list">
            {blog.interlinks.map((link, idx) => (
              <li key={idx}>
                <a href={link} className="link" target="_blank" rel="noopener noreferrer">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {blog.external_links?.length > 0 && (
        <div className="links-section">
          <h3 className="links-heading">External Resources</h3>
          <ul className="links-list">
            {blog.external_links.map((link, idx) => (
              <li key={idx}>
                <a href={link} className="link" target="_blank" rel="noopener noreferrer">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MainContent;
