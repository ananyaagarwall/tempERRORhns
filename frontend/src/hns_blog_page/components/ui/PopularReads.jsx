import React from 'react';
import { Link } from 'react-router-dom';
import '../../blog_page_css/PopularReads.css';
import { popularBlogs } from '../../data/blogData';

const COLORS = ['green', 'blue', 'yellow', 'purple', 'red', 'indigo'];

const PopularReads = () => {
  return (
    <div className="popular-reads-container hidden md:block">
      <div className="popular-reads-title">Popular Reads</div>
      <div className="popular-reads-list">
        {popularBlogs.map((article, idx) => (
          <Link
            key={article.id}
            to={`/blog/${article.slug}`}
            className="popular-reads-item"
            style={{ textDecoration: 'none' }}
          >
            <div className={`popular-reads-icon ${COLORS[idx % COLORS.length]}`}></div>
            <div>
              <h4 className="popular-reads-article-title">{article.title}</h4>
              <p className="popular-reads-time">{article.author} • {new Date(article.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default PopularReads;
