import React from 'react';
import "../../blog_page_css/InThisArticle.css";

const InThisArticle = ({ blog, activeSection, setActiveSection, isMobile = false }) => {
  return (
    <div className={`in-this-article-container ${isMobile ? 'block md:hidden' : 'hidden md:block'}`}>
      <div className="in-this-article-title">In this article</div>
      <div className="relative">
        <ul className="in-this-article-list">
          {blog.subheading1 && (
            <li className="in-this-article-item">
              <a
                href="#section-1"
                onClick={() => setActiveSection('section-1')}
                className={`in-this-article-link ${activeSection === 'section-1' ? 'active' : ''}`}
              >
                {blog.subheading1}
              </a>
              {activeSection === 'section-1' && <div className="active-indicator"></div>}
            </li>
          )}
          {blog.subheading2 && (
            <li className="in-this-article-item">
              <a
                href="#section-2"
                onClick={() => setActiveSection('section-2')}
                className={`in-this-article-link ${activeSection === 'section-2' ? 'active' : ''}`}
              >
                {blog.subheading2}
              </a>
              {activeSection === 'section-2' && <div className="active-indicator"></div>}
            </li>
          )}
          {blog.subheading3 && (
            <li className="in-this-article-item">
              <a
                href="#section-3"
                onClick={() => setActiveSection('section-3')}
                className={`in-this-article-link ${activeSection === 'section-3' ? 'active' : ''}`}
              >
                {blog.subheading3}
              </a>
              {activeSection === 'section-3' && <div className="active-indicator"></div>}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default InThisArticle;
