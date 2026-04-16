import React from 'react';
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

import { latestBlogs } from '../data/blogData';

const BlogLanding = () => {
  return (
    <div className="blog-page-container">
      <FooterNavBar />

      <div>
        <DynamicBreadcrumb />
      </div>

      <div className="max-w-[1320px] mx-auto px-4 pt-6 pb-8">
        <KnowBeforeYouBuySection />
        <LatestBlog filteredBlogs={latestBlogs} />
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-2">
        <TrendingNow />
        <FamousSection />
      </div>

      <FooterSection />
      <MobileFooter />
    </div>
  );
};

export default BlogLanding;