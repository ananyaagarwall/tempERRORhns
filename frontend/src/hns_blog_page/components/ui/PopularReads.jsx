import React from 'react';
import '../../blog_page_css/PopularReads.css';

const PopularReads = () => {
  const popularArticles = [
    { id: 1, title: "Hidden Costs of Home Buying", readTime: "5 min read", color: "green" },
    { id: 2, title: "EMI Myths You Should Ignore", readTime: "4 min read", color: "blue" },
    { id: 3, title: "Home Loan Terms Explained", readTime: "6 min read", color: "yellow" },
    { id: 4, title: "How Much House Can You Afford?", readTime: "7 min read", color: "purple" },
    { id: 5, title: "Tax Benefits for Homeowners", readTime: "5 min read", color: "red" },
    { id: 6, title: "Renting vs Buying Today", readTime: "8 min read", color: "indigo" }
  ];

  return (
    <div className="popular-reads-container hidden md:block">
      <div className="popular-reads-title">Popular Reads</div>
      <div className="popular-reads-list">
        {popularArticles.map((article) => (
          <div key={article.id} className="popular-reads-item">
            <div className={`popular-reads-icon ${article.color}`}></div>
            <div>
              <h4 className="popular-reads-article-title">{article.title}</h4>
              <p className="popular-reads-time">{article.readTime}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PopularReads;
