import React from 'react';
import "../../blog_page_css/BlogSummary.css";

const BlogSummary = ({ aiSummary }) => {
  return (
    <div className="blog-summary-container">
      <div className="blog-summary-box">
        <div className="blog-summary-title">Blog Summary</div>
        <div className="blog-summary-text">
          {aiSummary ? aiSummary : 'Summary not available.'}
        </div>
      </div>
    </div>
  );
};

export default BlogSummary;

