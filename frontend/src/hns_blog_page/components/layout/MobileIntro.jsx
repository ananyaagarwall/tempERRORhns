import API_BASE_URL from '../../../config';
import React from 'react';

const MobileIntro = ({ blog }) => {
  return (
    <div className="block md:hidden bg-white rounded-xl p-3 mt-2 mb-2 mx-2">
      <div className="text-sm text-gray-700 text-left">
        {blog.featured_image && (
          <img
            src={`${API_BASE_URL}/uploads/${blog.featured_image}`}
            alt={blog.featured_image_alt || blog.title}
            className="w-full object-cover rounded-lg mb-2"
            onError={(e) => {
              e.target.src = "/news.jpg";
            }}
          />
        )}
        <div className="text-base md:text-lg text-gray-700 mt-0 mb-0 text-left">
          {blog.intro_paragraph}
        </div>
      </div>
    </div>
  );
};

export default MobileIntro;
