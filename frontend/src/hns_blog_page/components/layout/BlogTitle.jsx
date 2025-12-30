import React from 'react';
import "../../blog_page_css/BlogTitle.css";


const BlogTitle = ({ blog = {} }) => {
  return (
    <div className="blog-header-container">
      <div className="flex flex-col items-start">
        <h1 className="blog-header-title">
          {blog.title || "Blog"}
        </h1>
      </div>

      <div className="blog-header-meta">
        <span>5 min read</span>
        <span className="blog-header-dot">•</span>
        <span>Knowledge level</span>
        <span className="blog-header-dot">•</span>
        <span>
          Posted on{" "}
          {blog.created_at
            ? new Date(blog.created_at).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "2-digit",
              })
            : ""}
        </span>
      </div>

      <hr className="blog-header-divider" />
    </div>
  );
};

export default BlogTitle;
