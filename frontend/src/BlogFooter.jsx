import React from 'react';

const BlogFooter = () => {
  return (
    <footer className="bg-[#0C1F52] text-white py-8 mt-8">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
        <div className="mb-4 md:mb-0 flex items-center gap-2">
          <img src="/HouseNSeek.png" alt="HouseNSeek Logo" className="h-8 w-auto opacity-80" />
          <span className="font-bold text-lg tracking-wide">HouseNSeek</span>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4 text-sm">
          <a href="/blogs" className="hover:underline transition-colors">Blogs</a>
          <a href="/about" className="hover:underline transition-colors">About</a>
          <a href="/contact" className="hover:underline transition-colors">Contact</a>
          <a href="/privacy" className="hover:underline transition-colors">Privacy Policy</a>
        </div>
        <div className="mt-4 md:mt-0 text-xs text-gray-300">
          &copy; {new Date().getFullYear()} HouseNSeek. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default BlogFooter;