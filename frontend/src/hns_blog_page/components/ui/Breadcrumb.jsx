import { Link } from "react-router-dom";
import { FaHome, FaChevronRight } from "react-icons/fa";
import "../../blog_page_css/Breadcrumb.css"

const Breadcrumb = ({ blogTitle }) => {
  return (
    <div className="breadcrumb-container">
      <div className="breadcrumb-inner">
        <div className="breadcrumb-items">
        {/* Home */}
        <Link to="/" className="breadcrumb-link">
          <FaHome className="breadcrumb-icon" />
          <span>Home</span>
        </Link>

        {/* Blog */}
        <FaChevronRight className="breadcrumb-separator" />
        <Link to="/blogs" className="breadcrumb-link">
          Blog
        </Link>

        {/* Blog Title */}
        {blogTitle && (
          <>
            <FaChevronRight className="breadcrumb-separator" />
            <span className="breadcrumb-current">{blogTitle}</span>
          </>
        )}
        </div>
      </div>
    </div>
  );
};

export default Breadcrumb;
