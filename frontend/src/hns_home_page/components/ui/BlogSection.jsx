import React from 'react';

const featured = {
  img: '/building.webp',
  title: 'Real Estate Market Update: Q2 Trends & Insights',
  subtitle: 'A snapshot of current property prices, demand, and buyer behavior.',
  tagline: 'Stay ahead of the curve with every curve!',
  button: 'View Article',
};

const articles = [
  {
    img: '/kalpa.jpg',
    title: 'Paperwork During Buying Property',
    subtitle: '10 Documents You Need for Property Purchase',
    icon: '→',
  },
  {
    img: 'palm.jpg',
    title: "Home Buying 101: A Beginner's Guide",
    subtitle: 'Start smart, buy smarter',
  },
  {
    img: 'presidental.jpeg',
    title: 'Down Payment Demystified',
    subtitle: 'How much down payment is ideal, and how it impacts your loan burden.',
  },
  {
    img: 'rustomujee.jpg',
    title: 'What is CIBIL Score and Why It Matters?',
    subtitle: 'Learn how your credit score impacts your home loan approval.',
  },
  {
    img: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=800&q=80',
    title: 'Why Green Homes Are the New Standard',
    subtitle: 'Explore how eco-friendly features are becoming non-negotiable.',
  },
  {
    img: 'lodha.jpg',
    title: 'Top 7 Questions to ask a Builder before Booking',
    subtitle: 'Don\'t fall for the brochure—know what really matters.',
  },
];

const BlogSection = () => {
  const handleFeaturedClick = () => {
    console.log('Featured article clicked');
  };

  const handleArticleClick = (article) => {
    console.log(`Article clicked: ${article.title}`);
  };

  return (
    <section className="blog-section">
      <div className="section-header">
        <h2 className="section-title">
          Know Before You Buy
        </h2>
        <span className="section-underline" />
      </div>

      {/* Featured Article Card */}
      <button className="featured-card" onClick={handleFeaturedClick}>
        <img src={featured.img} alt={featured.title} className="featured-image" />
        <div className="featured-overlay" />
        <div className="latest-badge"><span>Latest</span></div>
        <div className="featured-content">
          <h2 className="featured-title">{featured.title}</h2>
          <p className="featured-subtitle">{featured.subtitle}</p>
          <p className="featured-tagline">{featured.tagline}</p>
          <div className="featured-button">VIEW ARTICLE</div>
        </div>
      </button>

      {/* Grid of Other Articles */}
      <div className="articles-grid">
        {articles.map((article, idx) => (
          <button
            key={idx}
            className="article-card"
            onClick={() => handleArticleClick(article)}
            // The background image is now handled in CSS for better control
          >
            <img src={article.img} alt={article.title} className="article-image" />
            <div className="article-content">
              <h3 className="article-title">{article.title}</h3>
              <p className="article-subtitle">{article.subtitle}</p>
            </div>
            {/*{article.icon && <div className="article-icon">{article.icon}</div>}*/}
          </button>
        ))}
      </div>

      <style jsx>{`
        .blog-section {
          padding: 40px 20px;
          max-width: 1200px;
          margin: 0 auto;
          box-sizing: border-box;
        }
        .section-header {
          text-align: center;
          margin-bottom: 40px;
        }
        .section-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: #223A5F;
          margin: 0;
          letter-spacing: -0.5px;
          font-family: "'Abril Fatface', serif";
        }
        .section-underline {
          display: block;
          width: 80px;
          height: 4px;
          background: linear-gradient(90deg, #F1D97A 0%, #e6c76a 100%);
          margin: 12px auto 0;
          border-radius: 2px;
          box-shadow: 0 2px 4px rgba(241, 217, 122, 0.3);
        }
        
        /* --- Featured Card Styles --- */
        .featured-card {
          width: 100%;
          height: 350px;
          border-radius: 24px;
          overflow: hidden;
          position: relative;
          display: block;
          border: none;
          cursor: pointer;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          text-align: left;
          margin-bottom: 32px;
          background: #223A5F;
        }
        .featured-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(34, 58, 95, 0.2);
        }
        .featured-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        
          transition: transform 0.4s ease;
        }
        .featured-card:hover .featured-image {
          transform: scale(1.05);
        }
        .featured-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%);
          z-index: 2;
        }
        .latest-badge {
          position: absolute;
          left: 24px;
          top: 24px;
          z-index: 3;
        }
        .latest-badge span {
          background: #F9D87A;
          color: #223A5F;
          font-weight: 700;
          font-size: 14px;
          border-radius: 20px;
          padding: 8px 16px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .featured-content {
          position: absolute;
          left: 24px;
          bottom: 24px;
          right: 24px;
          z-index: 3;
          color: #fff;
        }
        .featured-title {
          font-size: clamp(1.25rem, 4vw, 1.75rem);
          font-weight: 700;
          margin: 0 0 8px 0;
          line-height: 1.2;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }
        .featured-subtitle, .featured-tagline {
          font-size: clamp(0.9rem, 2vw, 1rem);
          margin: 0 0 8px 0;
          opacity: 0.9;
          line-height: 1.4;
        }
        .featured-tagline {
          font-weight: 600;
          margin-bottom: 20px;
          font-style: italic;
        }
        .featured-button {
          background: #F9D87A;
          color: #223A5F;
          font-weight: 700;
          font-size: 14px;
          border-radius: 20px;
          padding: 10px 20px;
          display: inline-block;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* --- Articles Grid (Desktop First) --- */
        .articles-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .article-card {
          border: none;
          cursor: pointer;
          text-align: left;
          padding: 0;
          position: relative;
          border-radius: 18px;
          overflow: hidden;
          height: 250px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          background: #223A5F; /* Fallback color */
        }
        .article-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(34, 58, 95, 0.15);
        }
        .article-image {
          position: absolute;
          top: 0; left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 1;
          transition: transform 0.4s ease;
        }
        .article-card:hover .article-image {
          transform: scale(1.05);
        }
        .article-content {
          padding: 20px;
          color: #fff;
          z-index: 2;
          position: relative;
          background: linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%);
        }
        .article-title {
          font-size: 1.1rem;
          font-weight: 700;
          line-height: 1.3;
          margin: 0 0 4px 0;
          text-shadow: 0 2px 4px rgba(0,0,0,0.7);
        }
        .article-subtitle {
          font-size: 0.9rem;
          opacity: 0.9;
          line-height: 1.4;
          margin: 0;
          font-weight: 400;
          text-shadow: 0 1px 2px rgba(0,0,0,0.6);
        }
        .article-icon {
          position: absolute;
          right: 16px;
          bottom: 16px;
          background: #F9D87A;
          color: #223A5F;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 700;
          z-index: 3;
        }

        /* --- Tablet Responsiveness (<= 1024px) --- */
        @media (min-width: 426px) and (max-width: 1025px) {
          
          .articles-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .article-card:first-child {
            grid-column: span 1; /* Reset column span for 2-col layout */
            height: 300px; /* Keep it taller */
          }
          .article-card:first-child .article-title {
            font-size: 1.3rem; /* Keep title larger */
          }
        }

        /* --- Mobile Responsiveness (<= 425px) --- */
        @media (max-width: 425px) {
          .section-title {
            font-size: 2rem;
          }
          .featured-card {
            height: 300px;
            margin-bottom: 24px;
          }
          .articles-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .article-card {
            flex-direction: row; /* Key change for mobile */
            height: auto; /* Key change for mobile */
            min-height: 120px;
            background: #ffffff;
            border: 1px solid #e0e0e0;
          }
          .article-card:hover {
             box-shadow: 0 4px 12px rgba(34, 58, 95, 0.1);
          }
          .article-image {
            position: relative; /* Unset absolute positioning */
            width: 100px; /* Give image a fixed width */
            height: auto;
            flex-shrink: 0;
            object-fit: cover;
          }
          .article-card:hover .article-image {
            transform: none; /* Disable zoom on mobile list view */
          }
          .article-content {
            color: #223A5F; /* Change text color for light background */
            background: none; /* Remove gradient */
            padding: 16px;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .article-title {
            font-size: 1rem;
            text-shadow: none; /* Remove shadow */
          }
          .article-subtitle {
            font-size: 0.85rem;
            color: #556278;
            opacity: 1;
            text-shadow: none; /* Remove shadow */
          }
          .article-icon {
            position: absolute;
            width: 32px;
            height: 32px;
            font-size: 16px;
            right: 12px;
            bottom: 12px;
          }
        }
      `}</style>
    </section>
  );
};

export default BlogSection;