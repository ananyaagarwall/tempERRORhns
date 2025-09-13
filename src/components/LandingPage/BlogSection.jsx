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
    subtitle: 'Learn how your credit score impacts your home loan approval and interest rate.',
  },
  {
    img: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=800&q=80',
    title: 'Why Green Homes Are the New Standard',
    subtitle: 'Explore how eco-friendly features are becoming non-negotiable for buyers.',
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

  const handleArticleClick = (article, index) => {
    console.log(`Article clicked: ${article.title}`);
  };

  return (
    <section className="blog-section">
      <div className="section-header">
        <h2 className="section-title">Know Before You Buy</h2>
        <span className="section-underline" />
      </div>
      <button className="featured-card" onClick={handleFeaturedClick}>
        <img src={featured.img} alt="Featured" className="featured-image" />
        <div className="featured-overlay" />
        <div className="latest-badge"><span>Latest</span></div>
        <div className="featured-content">
          <h2 className="featured-title">{featured.title}</h2>
          <p className="featured-subtitle">{featured.subtitle}</p>
          <p className="featured-tagline">{featured.tagline}</p>
          <div className="featured-button">VIEW ARTICLE</div>
        </div>
      </button>
      <div className="articles-grid">
        {articles.map((article, idx) => (
          <button
            key={idx}
            className="article-card"
            onClick={() => handleArticleClick(article, idx)}
            style={{
              backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.65) 100%), url(${article.img})`
            }}
          >
            <div className="article-content">
              <h3 className="article-title">{article.title}</h3>
              <p className="article-subtitle">{article.subtitle}</p>
            </div>
            {article.icon && <div className="article-icon">{article.icon}</div>}
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
          margin: 0 0 12px 0;
          letter-spacing: -0.5px;
        }
        .section-underline {
          display: block;
          width: 80px;
          height: 4px;
          background: linear-gradient(90deg, #F1D97A 0%, #e6c76a 100%);
          margin: 0 auto;
          border-radius: 2px;
          box-shadow: 0 2px 4px rgba(241, 217, 122, 0.3);
        }
        .featured-card {
          width: 100%;
          height: 300px;
          border-radius: 24px;
          overflow: hidden;
          position: relative;
          background: #223A5F;
          display: block;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
          margin-bottom: 24px;
        }
        .featured-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(34, 58, 95, 0.2);
        }
        .featured-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          position: absolute;
          left: 0;
          top: 0;
          z-index: 1;
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
          z-index: ;
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
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 0 8px 0;
          line-height: 1.1;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }
        .featured-subtitle {
          font-size: 16px;
          margin: 0 0 4px 0;
          opacity: 0.9;
          line-height: 1.4;
        }
        .featured-tagline {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 20px 0;
          font-style: italic;
          opacity: 0.95;
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

        /* ------- DEFAULT GRID: 3 columns, bigger cards ------- */
        .articles-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          align-items: stretch;
        }
        .article-card {
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          height: 230px;
          border-radius: 18px;
          overflow: hidden;
          position: relative;
          border: none;
          cursor: pointer;
          text-align: left;
          padding: 0;
          background-size: cover !important;
          background-position: center !important;
        }
        .article-content {
          padding: 18px 16px 20px 18px;
          color: #fff;
          z-index: 2;
          position: absolute;
          left: 0; right: 0; bottom: 0;
          width: 100%;
        }
        .article-title {
          font-size: clamp(1rem, 2.4vw, 1.34rem);
          font-weight: 800;
          margin-bottom: 0;
          line-height: 1.2;
          text-shadow: 0 3px 6px rgba(0,0,0,0.7), 0 1px 2px rgba(0,0,0,0.8);
          background: rgba(0,0,0,0.23);
          padding: 7px 10px;
          border-radius: 7px;
          max-width: 93%;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          white-space: normal;
        }
        .article-subtitle {
          font-size: clamp(13px, 2vw, 16px);
          opacity: 0.92;
          margin-top: 7px;
          line-height: 1.26;
          font-weight: 500;
          text-shadow: 0 1px 2px rgba(0,0,0,0.6);
          background: rgba(0,0,0,0.13);
          padding: 4px 8px;
          border-radius: 5px;
          display: block;
        }
        .article-icon {
          position: absolute;
          right: 14px;
          bottom: 14px;
          background: #F9D87A;
          color: #223A5F;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 700;
          z-index: 3;
        }

        /* ------- LAPTOP (769px - 1200px): bigger cards/text ------- */
        @media (min-width: 769px) and (max-width: 1200px) {
          .article-card {
            height: 264px;
            border-radius: 20px;
          }
          .article-content {
            padding: 26px 24px 24px 26px;
          }
          .article-title {
            font-size: 1.6rem;
            padding: 11px 16px;
          }
          .article-subtitle {
            font-size: 1.08rem;
            padding: 7px 14px;
          }
          .article-icon {
            width: 38px;
            height: 38px;
            font-size: 20px;
          }
        }

        /* ------ MOBILE (≤480px): 1 column and small cards as before ------ */
        @media (max-width: 480px) {
          .articles-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .article-card {
            height: 135px;
            border-radius: 12px;
          }
          .article-content {
            padding: 10px 10px 12px 12px;
          }
          .article-title {
            font-size: clamp(0.91rem, 4vw, 1.11rem);
            font-weight: 900;
            padding: 7px 7px;
            line-height: 1.19;
            max-width: 99vw;
          }
          .article-subtitle,
          .article-icon {
            display: none;
          }
        }
      `}</style>
    </section>
  );
};

export default BlogSection;