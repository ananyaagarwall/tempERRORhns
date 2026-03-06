import API_BASE_URL from '../../config';
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import FooterNavBar from "../../hns_home_page/components/layout/FooterNavBar.jsx";
import FooterSection from '../../hns_home_page/components/layout/FooterSection';
import Breadcrumb from '../components/ui/Breadcrumb';
import { FaUserCircle } from 'react-icons/fa';
import BlogSummary from '../components/layout/BlogSummary';
import ShareCommunity from '../components/ui/ShareCommunity';
import InThisArticle from '../components/layout/InThisArticle';
import PopularReads from '../components/ui/PopularReads';
import BlogTitle from '../components/layout/BlogTitle'; 
import MainContent from '../components/layout/MainContent';
import MobileIntro from '../components/layout/MobileIntro';
import Newsletter from '../components/ui/Newsletter';
import { handleScroll } from '../blog_page_js/blog_page.js';

const BlogDetail = () => {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [activeSection, setActiveSection] = useState('section-1');

  // Function to handle scroll and update active section
  

  useEffect(() => {
    const onScroll = () => handleScroll(setActiveSection);
    window.addEventListener('scroll', onScroll);
    // Run once on mount to set initial active section
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [setActiveSection]);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/api/blogs`).then(res => {
      const found = res.data.find(b => b.slug === slug);
      if (found) {
        setBlog(found);
        setNotFound(false);
        // Fetch AI summary (optional - don't fail if API is down)
        axios.get(`${API_BASE_URL}/api/blogs/${slug}/summary`).then(summaryRes => {
          setAiSummary(summaryRes.data.summary || '');
        }).catch((err) => {
          console.log('AI summary not available:', err.message);
          setAiSummary('');
        });
      } else {
        setNotFound(true);
      }
      setLoading(false);
    }).catch(() => {
      setNotFound(true);
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-lg">Loading...</div>;
  if (notFound || !blog) return <div className="min-h-screen flex items-center justify-center text-lg text-red-600">Blog not found.</div>;

  return (
    <>
    <div className="blog-page-container min-h-screen flex flex-col">
      {/* Place your header at the top, not as a wrapper */}
      <FooterNavBar blog={blog} />

      <div className="blog-section-cream">
        <Breadcrumb blogTitle={blog.title} />
      </div>

      {/* Blog Detail Header */}
      <BlogTitle blog={blog} />

      {/* Mobile: Intro image and paragraph */}
      <MobileIntro blog={blog} />
      
      {/* Mobile: In this article */}
      <InThisArticle blog={blog} activeSection={activeSection} setActiveSection={setActiveSection} isMobile={true} />

      <div className="relative px-0">
        <div className="w-full bg-white relative">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 p-4 lg:p-10 items-start relative">
            {/* Main Content */}
            <main className="flex-1 min-w-0">
              <MainContent blog={blog} />
            </main>

            {/* Sidebar */}
            <aside className="w-full lg:w-1/3 flex flex-col gap-0 lg:gap-8 lg:sticky lg:top-6 mt-0 lg:mt-0">
              <BlogSummary aiSummary={aiSummary} />

              {/* Share with your community box for desktop */}
              <ShareCommunity isMobile={false} />

              {/* Desktop "In this article" section */}
              <InThisArticle blog={blog} activeSection={activeSection} setActiveSection={setActiveSection} isMobile={false} />

              {/* Popular Reads Section */}
              <PopularReads />
            </aside>
          </div>
        </div>
      </div>
      
      {/* Newsletter Section */}
      <Newsletter />
      
      <FooterSection />
    </div>
    </>
  );
};

export default BlogDetail;
