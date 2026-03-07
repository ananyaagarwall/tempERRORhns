import React, { useState } from 'react';
import { Search, Filter, MapPin } from 'lucide-react';

const SearchByFilter = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="w-full mx-auto bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl shadow-lg overflow-hidden">
      {/* Search Header */}
      <div className="p-3 xs:p-4 sm:p-6 pb-3 xs:pb-4 sm:pb-4">
        <h2 className="builder-section-heading mb-2 xs:mb-3 sm:mb-4">Search by filtering locations here</h2>
        <div className="relative">
          <div className="absolute left-2 xs:left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Search size={14} className="w-3 h-3 xs:w-4 xs:h-4 sm:w-4 sm:h-4" />
          </div>
          <input
            type="text"
            placeholder="Type the Region"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 xs:pl-8 sm:pl-10 pr-10 xs:pr-12 sm:pr-16 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 text-xs xs:text-sm sm:text-base"
          />
          <button className="absolute right-1.5 xs:right-2 sm:right-3 top-1/2 transform -translate-y-1/2 p-1 xs:p-1.5 sm:p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            <MapPin size={14} className="w-3 h-3 xs:w-4 xs:h-4 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Map Container - Responsive */}
      <div className="relative h-40 xs:h-44 sm:h-48 md:h-64 lg:h-80 xl:h-96 bg-gray-100 mx-1 xs:mx-2 sm:mx-4 rounded-lg overflow-hidden">
        {/* Static Map Image */}
        <img
          src="https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/72.8777,19.0760,12,0/800x400?access_token=pk.eyJ1IjoicGxhY2Vob2xkZXIiLCJhIjoiY2xhY2Vob2xkZXIifQ.placeholder"
          alt="Map showing Mumbai region"
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to styled placeholder if image fails
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        {/* Fallback Map Placeholder */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 bg-blue-600 rounded-full flex items-center justify-center">
              <MapPin size={24} className="text-white sm:w-8 sm:h-8" />
            </div>
            <p className="text-sm sm:text-base text-gray-600 font-medium">Interactive Map</p>
            <p className="text-xs sm:text-sm text-gray-500">Search to explore locations</p>
          </div>
        </div>

        {/* Map controls - Mobile responsive */}
        <div className="absolute bottom-1 right-1 xs:bottom-2 xs:right-2 sm:bottom-4 sm:right-4 flex flex-col space-y-1 sm:space-y-2">
          <button className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 bg-white border border-gray-300 rounded shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 text-xs sm:text-base">
            +
          </button>
          <button className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 bg-white border border-gray-300 rounded shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 text-xs sm:text-base">
            -
          </button>
        </div>
      </div>

      {/* Bottom padding */}
      <div className="h-3 xs:h-4 sm:h-6"></div>

      {/* Custom CSS for text-xxs */}
      <style>{`
        .text-xxs {
          font-size: 0.65rem;
          line-height: 0.9rem;
        }
      `}</style>
    </div>
  );
};

export default SearchByFilter;
