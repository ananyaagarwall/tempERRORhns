import React from 'react';
import '../../blog_page_css/Newsletter.css';

const Newsletter = () => {
  return (
    <div className="newsletter-container">
      {/* Newsletter Signup */}
      <div className="newsletter-wrapper">
        <div className="newsletter-box">
          <div className="newsletter-content">
            <div className="newsletter-text">
              <h3>
                Get great articles direct to<br />
                your inbox
              </h3>
              <p>
                The latest news, articles, and resources, sent straight to your inbox every month.
              </p>
            </div>

            <div className="newsletter-form">
              <div className="newsletter-input">
                <input id="newsletter-email" name="email" type="email" placeholder="Email Address" autoComplete="email" />
                <span>📧</span>
              </div>
              <div className="newsletter-button">
                <button>Subscribe →</button>
              </div>
            </div>
          </div>

          {/* HouseNSeek Logo */}
          <div className="newsletter-logo">
            <img src="/HouseNSeek.png" alt="HouseNSeek" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Newsletter;
