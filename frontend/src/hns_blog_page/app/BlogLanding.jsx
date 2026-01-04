import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import FooterNavBar from "../../hns_home_page/components/layout/FooterNavBar";
import FooterSection from '../../hns_home_page/components/layout/FooterSection';
import KnowBeforeYouBuySection from '../components/ui/KnowBeforeYouBuySection';
import DynamicBreadcrumb from '../../components/ui/DynamicBreadcrumb';
import LatestBlog from '../components/ui/LatestBlog';
import TrendingNow from '../components/ui/TrendingNowSection';
import FamousSection from '../components/ui/FamousSection';
import MobileFooter from '../../components/ui/MobileFooter';
import '../blog_page_css/BlogPage.css';

import { fetchBlogs } from '../../services/api';

const BlogLanding = () => {
  const [blogs, setBlogs] = useState([]);
  const [category, setCategory] = useState('All');

  useEffect(() => {
    fetchBlogs()
      .then(setBlogs)
      .catch(console.error);
  }, []);

  const filteredBlogs = category === "All"
    ? blogs
    : blogs.filter(blog => blog.title && blog.title.toLowerCase().includes(category.toLowerCase()));

  return (
    <div className="blog-page-container">
      <FooterNavBar />

      <div>
        <DynamicBreadcrumb />
      </div>

      <div className="max-w-[1320px] mx-auto px-4 py-8">
        <KnowBeforeYouBuySection />
        <LatestBlog filteredBlogs={filteredBlogs} />
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-8">
        <TrendingNow />
        <FamousSection />
      </div>

      <FooterSection />
      <MobileFooter />  {/* Kept from the first version — important for mobile view */}
    </div>
  );
};

export default BlogLanding;