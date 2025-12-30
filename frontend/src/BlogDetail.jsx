import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import BlogHeader from './BlogHeader';
import BlogFooter from './BlogFooter';

// Add CSS for hiding scrollbar
const scrollbarHideStyles = `
  .scrollbar-hide {
    -ms-overflow-style: none;  /* Internet Explorer 10+ */
    scrollbar-width: none;  /* Firefox */
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;  /* Safari and Chrome */
  }
  .main-content-scroll {
    -ms-overflow-style: none;  /* Internet Explorer 10+ */
    scrollbar-width: none;  /* Firefox */
  }
  .main-content-scroll::-webkit-scrollbar {
    display: none;  /* Safari and Chrome */
  }
`;

const BlogDetail = () => {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [activeSection, setActiveSection] = useState('section-1');

  // Function to handle scroll and update active section
  const handleScroll = () => {
    const sections = ['section-1', 'section-2', 'section-3'];
    const scrollPosition = window.scrollY + 200; // Offset for better detection

    for (let i = sections.length - 1; i >= 0; i--) {
      const element = document.getElementById(sections[i]);
      if (element && element.offsetTop <= scrollPosition) {
        setActiveSection(sections[i]);
        break;
      }
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setLoading(true);
    axios.get(`http://localhost:5000/api/blogs`).then(res => {
      const found = res.data.find(b => b.slug === slug);
      if (found) {
        setBlog(found);
        setNotFound(false);
        // Fetch AI summary
        axios.get(`http://localhost:5000/api/blogs/${slug}/summary`).then(summaryRes => {
          setAiSummary(summaryRes.data.summary || '');
        }).catch(() => {
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
      <style>{scrollbarHideStyles}</style>
    <div className="min-h-screen flex flex-col bg-white">
      <BlogHeader>
        <div className="max-w-6xl mx-auto w-full px-4 md:px-0 pt-2 pb-2">
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1 text-xs md:text-sm text-gray-700 mb-2 font-sans tracking-wide text-left">
              <Link
                to="/blogs"
                className="inline-flex items-center gap-1 bg-transparent hover:bg-gray-100 text-[#0C1F52] hover:text-blue-900 font-semibold py-1 px-2 rounded-lg transition-all duration-200 text-xs md:text-sm"
              >
                BLOG
              </Link>
              <span>&gt; DETAIL &gt;</span>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-black mb-1 leading-tight font-['Abril_Fatface'] text-left">
              {blog.title}
            </h1>
          </div>
          <div
            className="flex flex-wrap items-center gap-2 mb-4 text-[10px] md:text-base"
            style={{ color: '#727271', fontFamily: 'Poppins, sans-serif' }}
          >
            <span>5 min read</span>
            <span className="hidden md:inline">•</span>
            <span>Knowledge level</span>
            <span className="hidden md:inline">•</span>
            <span>
              Posted on {new Date(blog.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: '2-digit' })}
            </span>
          </div>
          <hr
            className="mb-0"
            style={{
              border: 'none',
              borderBottom: '2px solid #d1d5db',
              margin: '0',
              width: '100%'
            }}
          />
        </div>
      </BlogHeader>

      {/* Mobile: Intro image and paragraph */}
      <div className="block md:hidden bg-white rounded-xl p-4 mt-[-35px] mb-0 mx-2">
        <div className="text-sm text-gray-700 text-left">
          {blog.featured_image && (
            <img
              src={`http://localhost:5000/uploads/${blog.featured_image}`}
              alt={blog.featured_image_alt || blog.title}
              className="w-full object-cover rounded-lg mb-2"
            />
          )}
          <div className="text-base md:text-lg text-gray-700 mt-0 mb-0 text-left">
            {blog.intro_paragraph}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-5 mb-3 block md:hidden -mt-1">
        <div className="font-bold mb-2 text-black">In this article</div>
        <div className="relative">
          <ul className="space-y-3 ml-8">
            {blog.subheading1 && (
              <li className="relative">
                <a href="#section-1" onClick={() => setActiveSection('section-1')} className={`hover:underline cursor-pointer font-normal text-base ${activeSection === 'section-1' ? 'text-blue-600' : 'text-black'}`}>
                  {blog.subheading1}
                </a>
                {activeSection === 'section-1' && (
                  <div className="absolute -left-4 top-0 bottom-0 w-1 bg-blue-600"></div>
                )}
              </li>
            )}
            {blog.subheading2 && (
              <li className="relative">
                <a href="#section-2" onClick={() => setActiveSection('section-2')} className={`hover:underline cursor-pointer font-normal text-base ${activeSection === 'section-2' ? 'text-blue-600' : 'text-black'}`}>
                  {blog.subheading2}
                </a>
                {activeSection === 'section-2' && (
                  <div className="absolute -left-4 top-0 bottom-0 w-1 bg-blue-600"></div>
                )}
              </li>
            )}
            {blog.subheading3 && (
              <li className="relative">
                <a href="#section-3" onClick={() => setActiveSection('section-3')} className={`hover:underline cursor-pointer font-normal text-base ${activeSection === 'section-3' ? 'text-blue-600' : 'text-black'}`}>
                  {blog.subheading3}
                </a>
                {activeSection === 'section-3' && (
                  <div className="absolute -left-4 top-0 bottom-0 w-1 bg-blue-600"></div>
                )}
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="relative -mt-1z-10 px-0">
        <div className="w-full bg-white relative">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 p-4 lg:p-10 items-start relative">
            <div className="w-full lg:w-2/3 lg:pr-8 h-auto lg:h-[calc(100vh+400px)] overflow-y-auto lg:overflow-y-auto overflow-y-visible main-content-scroll mb-8 lg:mb-0 text-left">
              {/* Desktop/tablet only: Intro image and paragraph */}
              <div className="hidden md:block">
                {blog.featured_image && (
                  <img src={`http://localhost:5000/uploads/${blog.featured_image}`} alt={blog.featured_image_alt || blog.title} className="w-full object-cover rounded-lg mb-6" />
                )}
                <div className="text-lg text-gray-700 mb-6 text-left">{blog.intro_paragraph}</div>
              </div>

              {blog.subheading1 && <h2 id="section-1" className="text-2xl font-bold text-gray-800 mt-8 mb-2 text-justify">{blog.subheading1}</h2>}
              {blog.content1 && <p className="text-gray-700 mb-4 whitespace-pre-line text-left">{blog.content1}</p>}
              {blog.image1 && (
                <img src={`http://localhost:5000/uploads/${blog.image1}`} alt={blog.alt_text1 || ''} className="w-full object-cover rounded-lg mb-6" />
              )}

              {blog.subheading2 && <h2 id="section-2" className="text-2xl font-bold text-gray-800 mt-8 mb-2 text-justify">{blog.subheading2}</h2>}
              {blog.content2 && <p className="text-gray-700 mb-4 whitespace-pre-line text-left">{blog.content2}</p>}
              {blog.image2 && (
                <img src={`http://localhost:5000/uploads/${blog.image2}`} alt={blog.alt_text2 || ''} className="w-full object-cover rounded-lg mb-6" />
              )}

              {blog.subheading3 && <h2 id="section-3" className="text-2xl font-bold text-gray-800 mt-8 mb-2 text-justify">{blog.subheading3}</h2>}
              {blog.content3 && <p className="text-gray-700 mb-4 whitespace-pre-line text-left">{blog.content3}</p>}
              {blog.image3 && (
                <img src={`http://localhost:5000/uploads/${blog.image3}`} alt={blog.alt_text3 || ''} className="w-full object-cover rounded-lg mb-6" />
              )}

              {blog.interlinks?.length > 0 && (
                <div className="mt-8 text-left">
                  <h3 className="text-lg font-bold mb-2 text-justify">Related Articles</h3>
                  <ul className="list-disc ml-6">
                    {blog.interlinks.map((link, idx) => (
                      <li key={idx}><a href={link} className="text-blue-700 hover:underline" target="_blank" rel="noopener noreferrer">{link}</a></li>
                    ))}
                  </ul>
                </div>
              )}

              {blog.external_links?.length > 0 && (
                <div className="mt-6 text-left">
                  <h3 className="text-lg font-bold mb-2 text-justify">External Resources</h3>
                  <ul className="list-disc ml-6">
                    {blog.external_links.map((link, idx) => (
                      <li key={idx}><a href={link} className="text-blue-700 hover:underline" target="_blank" rel="noopener noreferrer">{link}</a></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <aside className="w-full lg:w-1/3 flex flex-col gap-6 lg:sticky lg:top-6 order-first lg:order-last mt-8 lg:mt-0">
              <div
  className="text-white rounded-xl shadow p-5 hidden md:block"
  style={{ backgroundColor: '#0E1E68' }}
>
  {/* AI summary will be rendered here */}
  <div className="bg-blue-50 rounded-xl p-4 mb-4">
    <div className="font-bold text-lg mb-2 text-blue-900">Blog Summary </div>
    <div className="text-sm text-blue-900">{aiSummary ? aiSummary : 'Summary not available.'}</div>
  </div>
</div>

{/* Share with your community box for desktop */}
<div className="bg-blue-100 rounded-xl shadow p-4 flex flex-col items-start hidden md:flex mt-2">
  <div className="font-semibold text-blue-900 mb-2">Share with your community!</div>
  <div className="flex gap-3">
    <a href="https://www.facebook.com/sharer/sharer.php?u=https://housenseek.com" target="_blank" rel="noopener noreferrer" className="text-blue-900 hover:text-blue-700 text-2xl transition-colors">
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    </a>
    <a href="https://www.linkedin.com/sharing/share-offsite/?url=https://housenseek.com" target="_blank" rel="noopener noreferrer" className="text-blue-900 hover:text-blue-700 text-2xl transition-colors">
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    </a>
    <a href="https://twitter.com/intent/tweet?url=https://housenseek.com&text=Check%20out%20this%20great%20article%20on%20HouseNSeek!" target="_blank" rel="noopener noreferrer" className="text-blue-900 hover:text-blue-700 text-2xl transition-colors">
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
      </svg>
    </a>
  </div>
</div>

              {/* Mobile: In this article */}
              

              {/* Mobile: Share with your community */}
              <div className="bg-blue-100 rounded-xl shadow p-4 flex flex-col items-start block md:hidden mt-[-50px]">
                <div className="font-semibold text-blue-900 mb-2">Share with your community!</div>
                <div className="flex gap-3">
                  <a href="https://www.facebook.com/sharer/sharer.php?u=https://housenseek.com" target="_blank" rel="noopener noreferrer" className="text-blue-900 hover:text-blue-700 text-2xl transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  <a href="https://www.linkedin.com/sharing/share-offsite/?url=https://housenseek.com" target="_blank" rel="noopener noreferrer" className="text-blue-900 hover:text-blue-700 text-2xl transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                  <a href="https://twitter.com/intent/tweet?url=https://housenseek.com&text=Check%20out%20this%20great%20article%20on%20HouseNSeek!" target="_blank" rel="noopener noreferrer" className="text-blue-900 hover:text-blue-700 text-2xl transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </a>
                </div>
              </div>

              {/* Desktop "In this article" section (hide on mobile) */}
      <div className="bg-white rounded-xl p-4 hidden md:block">
        <div className="font-bold mb-3 text-black">In this article</div>
        <div className="relative">
          <ul className="space-y-4 ml-8">
            {blog.subheading1 && (
              <li className="relative">
                <a href="#section-1" onClick={() => setActiveSection('section-1')} className={`hover:underline cursor-pointer font-normal text-base ${activeSection === 'section-1' ? 'text-blue-600' : 'text-black'}`}>
                  {blog.subheading1}
                </a>
                {activeSection === 'section-1' && (
                  <div className="absolute -left-4 top-0 bottom-0 w-1 bg-blue-600"></div>
                )}
              </li>
            )}
            {blog.subheading2 && (
              <li className="relative">
                <a href="#section-2" onClick={() => setActiveSection('section-2')} className={`hover:underline cursor-pointer font-normal text-base ${activeSection === 'section-2' ? 'text-blue-600' : 'text-black'}`}>
                  {blog.subheading2}
                </a>
                {activeSection === 'section-2' && (
                  <div className="absolute -left-4 top-0 bottom-0 w-1 bg-blue-600"></div>
                )}
              </li>
            )}
            {blog.subheading3 && (
              <li className="relative">
                <a href="#section-3" onClick={() => setActiveSection('section-3')} className={`hover:underline cursor-pointer font-normal text-base ${activeSection === 'section-3' ? 'text-blue-600' : 'text-black'}`}>
                  {blog.subheading3}
                </a>
                {activeSection === 'section-3' && (
                  <div className="absolute -left-4 top-0 bottom-0 w-1 bg-blue-600"></div>
                )}
              </li>
            )}
          </ul>
        </div>
      </div>

              {/* Popular Reads Section */}
              <div className="bg-white rounded-xl p-4 hidden md:block">
                <div className="font-bold mb-3 text-black text-lg">Popular Reads</div>
                <div className="space-y-3">
                  <div className="flex gap-3 items-start">
                    <div className="w-12 h-12 bg-green-200 rounded-lg flex-shrink-0"></div>
                    <div>
                      <h4 className="font-medium text-base text-black mb-1">Hidden Costs of Home Buying</h4>
                      <p className="text-sm text-black">5 min read</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="w-12 h-12 bg-blue-200 rounded-lg flex-shrink-0"></div>
                    <div>
                      <h4 className="font-medium text-base text-black mb-1">EMI Myths You Should Ignore</h4>
                      <p className="text-sm text-black">4 min read</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="w-12 h-12 bg-yellow-200 rounded-lg flex-shrink-0"></div>
                    <div>
                      <h4 className="font-medium text-base text-black mb-1">Home Loan Terms Explained</h4>
                      <p className="text-sm text-black">6 min read</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="w-12 h-12 bg-purple-200 rounded-lg flex-shrink-0"></div>
                    <div>
                      <h4 className="font-medium text-base text-black mb-1">How Much House Can You Afford?</h4>
                      <p className="text-sm text-black">7 min read</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="w-12 h-12 bg-red-200 rounded-lg flex-shrink-0"></div>
                    <div>
                      <h4 className="font-medium text-base text-black mb-1">Tax Benefits for Homeowners</h4>
                      <p className="text-sm text-black">5 min read</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="w-12 h-12 bg-indigo-200 rounded-lg flex-shrink-0"></div>
                    <div>
                      <h4 className="font-medium text-base text-black mb-1">Renting vs Buying Today</h4>
                      <p className="text-sm text-black">8 min read</p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
      
      {/* Newsletter section with blue gradient */}
      <div className="bg-white pt-0 pb-8">
        {/* Newsletter Signup */}
        <div className="max-w-4xl mx-auto mb-12 relative px-4">
          <div className="bg-black rounded-xl p-8 md:p-16 text-white relative">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="md:w-2/3">
                <h3 className="text-2xl md:text-4xl font-bold mb-4 leading-tight">
                  Get great articles direct to<br />
                  your inbox
                </h3>
                <p className="text-gray-700 text-xs md:text-sm">The latest news, articles, and resources, sent straight to your inbox every month.</p>
              </div>
              <div className="md:w-1/3 flex flex-col gap-3">
                <div className="relative">
                  <input type="email" placeholder="Email Address" className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 text-sm" />
                  <span className="absolute right-3 top-2 text-gray-400 text-sm">📧</span>
                </div>
                <div className="flex justify-end">
                  <button className="bg-white hover:bg-gray-200 hover:scale-105 text-black px-3 py-1.5 rounded-full font-medium transition-all duration-200 text-xs md:text-sm transform">Subscribe →</button>
                </div>
              </div>
            </div>
            {/* HouseNSeek Logo */}
            <div className="absolute bottom-0 right-4">
              <img src="/HouseNSeek.png" alt="HouseNSeek" className="h-12 md:h-24 w-auto opacity-20" />
            </div>
          </div>
        </div>
      </div>
      
      {/* White background section for quote, statistics, and placeholders */}
      <div className="bg-white pt-8 pb-4 md:pb-20">
        {/* Quote Section */}
        <div className="max-w-5xl mx-auto mb-8 md:mb-16 text-center px-4">
          <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold text-black mb-4 font-['Abril_Fatface']">Some Cheek quote<br className="hidden md:block"></br>
            about the article</h2>
          <p className="text-lg md:text-xl lg:text-2xl text-black font-['Abril_Fatface']">Some Cheek quote about the article</p>
        </div>
        
        {/* Statistics Section */}
        <div className="max-w-7xl mx-auto mb-8 md:mb-16 px-4">
          <div className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-8 lg:gap-12">
            <div className="text-center">
              <div className="text-2xl md:text-6xl lg:text-7xl font-bold text-black mb-2 md:mb-4 font-['Abril_Fatface']">90%</div>
              <p className="text-xs md:text-lg lg:text-xl text-black">Of users learn from here</p>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-6xl lg:text-7xl font-bold text-black mb-2 md:mb-4 font-['Abril_Fatface']">90%</div>
              <p className="text-xs md:text-lg lg:text-xl text-black">start their journey with housenseek</p>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-6xl lg:text-7xl font-bold text-black mb-2 md:mb-4 font-['Abril_Fatface']">90%</div>
              <p className="text-xs md:text-lg lg:text-xl text-black">start their journey with housenseek</p>
            </div>
          </div>
        </div>
        
        {/* Placeholder Blocks */}
        <div className="max-w-7xl mx-auto mb-6 md:mb-12 px-4">
          <div className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-6 lg:gap-8">
            <div className="bg-gray-300 h-20 md:h-64 flex items-center justify-center">
              <span className="text-gray-600 text-xs md:text-base">Placeholder</span>
            </div>
            <div className="bg-gray-300 h-20 md:h-64 flex items-center justify-center">
              <span className="text-gray-600 text-xs md:text-base">Placeholder</span>
            </div>
            <div className="bg-gray-300 h-20 md:h-64 flex items-center justify-center">
              <span className="text-gray-600 text-xs md:text-base">Placeholder</span>
            </div>
          </div>
        </div>
        
        {/* Related Posts Section */}
        <div className="w-full mb-2 md:mb-12 bg-[#FFFBF2]">
          <div className="max-w-7xl mx-auto border-t border-gray-300 pt-2 md:pt-8 p-2 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 md:mb-6 gap-2 md:gap-4">
              <div>
                <div className="text-xs md:text-sm text-gray-500 mb-2">Blogs and Articles</div>
                <h3 className="text-xl md:text-3xl font-bold text-gray-800">Related posts</h3>
              </div>
              <div className="flex bg-[#FFFBF2] border border-gray-300 rounded-full p-0.5 md:p-1">
                <button className="px-2 py-1 md:px-4 md:py-2 bg-white hover:bg-gray-100 text-black-800 rounded-full text-xs md:text-sm font-bold shadow-sm transition-all duration-200 hover:scale-105 transform">BY LEVEL</button>
                <button className="px-2 py-1 md:px-4 md:py-2 bg-transparent hover:bg-gray-100 text-black-800 rounded-full text-xs md:text-sm font-medium transition-all duration-200 hover:scale-105 transform">BY CATEGORY</button>
              </div>
            </div>
            
            {/* Navigation Tabs */}
            <div className="flex flex-nowrap gap-2 md:gap-8 mb-4 md:mb-8 overflow-x-auto">
              <button className="text-gray-800 font-bold border-b-2 border-gray-800 pb-2 whitespace-nowrap text-xs md:text-base transition-all duration-200 hover:scale-105 transform">Regional Level</button>
              <button className="text-gray-500 hover:text-gray-700 whitespace-nowrap text-xs md:text-base transition-all duration-200 hover:scale-105 transform">Local Level</button>
              <button className="text-gray-500 hover:text-gray-700 whitespace-nowrap text-xs md:text-base transition-all duration-200 hover:scale-105 transform">Knowledge Level</button>
            </div>
            

            
            {/* Desktop-sized grid with 2 visible columns */}
            <div className="overflow-x-auto scrollbar-hide">
              <div className="min-w-max">
                {/* Single Table with 4 columns - only 2 visible on desktop */}
                <div style={{ width: 'max-content' }}>
                  {/* Row 1 */}
                  <div className="grid grid-cols-4 border-b border-gray-300">
                    <div className="border-r border-gray-300 p-1 md:p-4 w-[300px] md:w-[550px]">
                      <div className="flex gap-1 md:gap-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 mb-0.5 md:mb-2 text-xs md:text-lg">Germany Work Permit After Studies</h4>
                          <p className="text-gray-600 text-xs md:text-sm mb-0.5 md:mb-2 leading-tight md:leading-relaxed">Germany offers excellent post-study work opportunities for international graduates. The country's strong economy and demand for skilled professionals make it an attractive destination.</p>
                          <p className="text-gray-500 text-xs">5 min read • Work in Germany</p>
                        </div>
                        <div className="w-8 h-8 md:w-16 md:h-16 bg-yellow-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-yellow-600 text-xs md:text-lg">🇩🇪</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-r border-gray-300 p-1 md:p-4 w-[300px] md:w-[550px]">
                      <div className="flex gap-1 md:gap-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 mb-0.5 md:mb-2 text-xs md:text-lg">New Zealand Student Life Guide</h4>
                          <p className="text-gray-600 text-xs md:text-sm mb-0.5 md:mb-2 leading-tight md:leading-relaxed">New Zealand offers a unique blend of academic excellence and outdoor adventure. Students can enjoy world-class education while experiencing the country's stunning natural beauty.</p>
                          <p className="text-gray-500 text-xs">4 min read • Study in NZ</p>
                        </div>
                        <div className="w-8 h-8 md:w-16 md:h-16 bg-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 text-xs md:text-lg">🇳🇿</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-r border-gray-300 p-1 md:p-4 w-[300px] md:w-[550px]">
                      <div className="flex gap-1 md:gap-4">
                <div className="flex-1">
                          <h4 className="font-bold text-gray-800 mb-0.5 md:mb-2 text-xs md:text-lg">Study in Singapore - Tech Hub</h4>
                          <p className="text-gray-600 text-xs md:text-sm mb-0.5 md:mb-2 leading-tight md:leading-relaxed">Singapore has emerged as a leading destination for technology and innovation studies. With its cutting-edge research facilities and strong industry connections.</p>
                          <p className="text-gray-500 text-xs">6 min read • Study in Singapore</p>
                        </div>
                        <div className="w-8 h-8 md:w-16 md:h-16 bg-red-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-red-600 text-xs md:text-lg">🇸🇬</span>
                </div>
                </div>
              </div>
              
                    <div className="p-1 md:p-4 w-[300px] md:w-[550px]">
                      <div className="flex gap-1 md:gap-4">
                <div className="flex-1">
                          <h4 className="font-bold text-gray-800 mb-0.5 md:mb-2 text-xs md:text-lg">Study in Japan - Culture & Innovation</h4>
                          <p className="text-gray-600 text-xs md:text-sm mb-0.5 md:mb-2 leading-tight md:leading-relaxed">Japan combines traditional culture with cutting-edge technology, making it a fascinating destination for international students.</p>
                          <p className="text-gray-500 text-xs">7 min read • Study in Japan</p>
                        </div>
                        <div className="w-8 h-8 md:w-16 md:h-16 bg-red-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-red-600 text-xs md:text-lg">🇯🇵</span>
                        </div>
                </div>
                </div>
              </div>
              
                  {/* Row 2 */}
                  <div className="grid grid-cols-4">
                    <div className="border-r border-gray-300 p-1 md:p-4 w-[300px] md:w-[550px]">
                      <div className="flex gap-1 md:gap-4">
                <div className="flex-1">
                          <h4 className="font-bold text-gray-800 mb-0.5 md:mb-2 text-xs md:text-lg">Study in Sweden - Sustainability Focus</h4>
                          <p className="text-gray-600 text-xs md:text-sm mb-0.5 md:mb-2 leading-tight md:leading-relaxed">Sweden is a leader in sustainability and environmental studies. With its innovative approach to education and strong emphasis on research, it's perfect for students interested in green technology.</p>
                          <p className="text-gray-500 text-xs">5 min read • Study in Sweden</p>
                        </div>
                        <div className="w-8 h-8 md:w-16 md:h-16 bg-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 text-xs md:text-lg">🇸🇪</span>
                </div>
                </div>
              </div>
              
                    <div className="border-r border-gray-300 p-1 md:p-4 w-[300px] md:w-[550px]">
                      <div className="flex gap-1 md:gap-4">
                <div className="flex-1">
                          <h4 className="font-bold text-gray-800 mb-0.5 md:mb-2 text-xs md:text-lg">Study in Netherlands - Business Hub</h4>
                          <p className="text-gray-600 text-xs md:text-sm mb-0.5 md:mb-2 leading-tight md:leading-relaxed">The Netherlands is a major business and finance hub in Europe. With its international outlook, excellent business schools, and strong economy, it's ideal for students pursuing careers in business.</p>
                          <p className="text-gray-500 text-xs">6 min read • Study in Netherlands</p>
                        </div>
                        <div className="w-8 h-8 md:w-16 md:h-16 bg-red-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-red-600 text-xs md:text-lg">🇳🇱</span>
                </div>
                </div>
              </div>
              
                    <div className="border-r border-gray-300 p-1 md:p-4 w-[300px] md:w-[550px]">
                      <div className="flex gap-1 md:gap-4">
                <div className="flex-1">
                          <h4 className="font-bold text-gray-800 mb-0.5 md:mb-2 text-xs md:text-lg">Study in Switzerland - Luxury & Precision</h4>
                          <p className="text-gray-600 text-xs md:text-sm mb-0.5 md:mb-2 leading-tight md:leading-relaxed">Switzerland is known for its precision engineering, luxury industries, and high-quality education. Students can learn from world-renowned institutions while experiencing the country's stunning Alpine landscapes.</p>
                          <p className="text-gray-500 text-xs">8 min read • Study in Switzerland</p>
                        </div>
                        <div className="w-8 h-8 md:w-16 md:h-16 bg-red-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-red-600 text-xs md:text-lg">🇨🇭</span>
                </div>
                </div>
              </div>
              
                    <div className="p-1 md:p-4 w-[300px] md:w-[550px]">
                      <div className="flex gap-1 md:gap-4">
                <div className="flex-1">
                          <h4 className="font-bold text-gray-800 mb-0.5 md:mb-2 text-xs md:text-lg">Study in Denmark - Happiness & Innovation</h4>
                          <p className="text-gray-600 text-xs md:text-sm mb-0.5 md:mb-2 leading-tight md:leading-relaxed">Denmark consistently ranks as one of the happiest countries in the world. With its focus on work-life balance, innovative design, and excellent education system, it offers a unique learning experience.</p>
                          <p className="text-gray-500 text-xs">5 min read • Study in Denmark</p>
                        </div>
                        <div className="w-8 h-8 md:w-16 md:h-16 bg-red-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-red-600 text-xs md:text-lg">🇩🇰</span>
                        </div>
                      </div>
                    </div>
                </div>
                </div>
              </div>
            </div>
            
            {/* Pagination and View More */}
            <div className="flex flex-col md:flex-row items-center justify-between mt-4 md:mt-8 gap-2 md:gap-4">
              <div className="flex gap-1 md:gap-2">
                <button 
                  onClick={() => {
                    const container = document.querySelector('.overflow-x-auto');
                    if (container) {
                      container.scrollBy({ left: -1100, behavior: 'smooth' });
                    }
                  }}
                  className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:scale-110 transition-all duration-200 cursor-pointer text-sm md:text-base transform"
                >
                  ←
                </button>
                <button 
                  onClick={() => {
                    const container = document.querySelector('.overflow-x-auto');
                    if (container) {
                      container.scrollBy({ left: 1100, behavior: 'smooth' });
                    }
                  }}
                  className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:scale-110 transition-all duration-200 cursor-pointer text-sm md:text-base transform"
                >
                  →
                </button>
              </div>
              <div className="flex justify-end w-full md:w-auto">
                <button className="bg-yellow-400 hover:bg-yellow-500 hover:scale-105 text-gray-800 px-3 py-1.5 rounded-full font-medium transition-all duration-200 text-xs md:text-sm transform">
                  View More &gt;
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BlogFooter />
    </div>
    </>
  );
};

export default BlogDetail;