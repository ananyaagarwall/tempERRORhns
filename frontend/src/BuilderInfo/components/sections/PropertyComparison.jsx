import React from 'react';
import { Bookmark, ChevronRight, Search } from 'lucide-react';

const PropertyComparison = () => {
  return (
    <div className="w-full max-w-4xl mx-auto p-2 sm:p-4 lg:p-6">
      <div className="bg-white rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg border-2 border-yellow-200 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-6 pb-2 sm:pb-4 gap-4 sm:gap-0 bg-gradient-to-r from-blue-50 to-yellow-50">
          <div>
            <h2 className="builder-section-heading mb-1">
              View our Bonus feature?
            </h2>
            <p className="text-sm text-gray-600 flex items-center">
              Compare Societies by clicking here
              <ChevronRight size={16} className="ml-1" />
            </p>
          </div>
          <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center font-semibold">
            View more
            <ChevronRight size={16} className="ml-1" />
          </button>
        </div>

        {/* Main Content */}
        <div className="px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Property Card */}
            <div className="flex-1 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border-2 border-blue-100 shadow-sm">
              {/* Property Header */}
              <div className="flex justify-between items-start mb-3 sm:mb-4">
                <div className="flex-1 pr-2">
                  <h3 className="text-base sm:text-lg lg:text-xl font-serif text-gray-900 mb-2 leading-tight" style={{ fontFamily: "'Abril Fatface', serif" }}>
                    Ultimate Project Name One for Sample
                  </h3>
                  <div className="flex flex-col xs:flex-row gap-2 xs:gap-4 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                    <div>
                      <span className="text-green-600 font-semibold">Start:</span> Jan 22
                    </div>
                    <div>
                      <span className="text-gray-500 font-semibold">Possession:</span> May 26
                    </div>
                  </div>
                </div>
                <button className="p-1.5 sm:p-2 hover:bg-yellow-100 rounded-full transition-colors flex-shrink-0 border border-yellow-300">
                  <Bookmark size={16} className="sm:w-5 sm:h-5 text-yellow-500" />
                </button>
              </div>

              {/* Price and Type */}
              <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 lg:gap-8 mb-4 sm:mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-400 rounded-sm"></div>
                  <div>
                    <div className="text-base sm:text-lg lg:text-xl font-bold text-gray-900" style={{ fontFamily: "'Abril Fatface', serif" }}>₹90 Lakhs</div>
                    <div className="text-xs text-gray-500">Starting from</div>
                  </div>
                </div>

                <div className="hidden xs:flex items-center justify-center px-2">
                  <span className="text-lg sm:text-2xl text-yellow-400 font-bold">vs</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-400 rounded-sm"></div>
                  <div>
                    <div className="text-base sm:text-lg lg:text-xl font-bold text-gray-900" style={{ fontFamily: "'Abril Fatface', serif" }}>3.4 BHKs</div>
                    <div className="text-xs text-gray-500">Type</div>
                  </div>
                </div>
              </div>

              {/* Highlights */}
              <div className="mb-4 sm:mb-6">
                <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-2 sm:mb-3">Highlights</h4>
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                  <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
                    <div className="text-xs sm:text-sm font-semibold text-green-600">Yes</div>
                    <div className="text-xs text-gray-500">Balcony</div>
                  </div>
                  <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
                    <div className="text-xs sm:text-sm font-semibold text-blue-600">2-3 kms</div>
                    <div className="text-xs text-gray-500">Metro</div>
                  </div>
                  <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
                    <div className="text-xs sm:text-sm font-semibold text-yellow-600">Free</div>
                    <div className="text-xs text-gray-500">Parking</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col xs:flex-row gap-2 sm:gap-3">
                <button className="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 border-2 border-blue-200 rounded-lg text-xs sm:text-sm font-semibold text-blue-700 hover:bg-blue-50 transition-colors">
                  View Project
                </button>
                <button className="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 rounded-lg text-xs sm:text-sm font-bold hover:from-yellow-500 hover:to-yellow-600 transition-colors shadow-sm">
                  My List
                </button>
              </div>
            </div>

            {/* Comparison Search Box */}
            <div className="lg:w-80">
              <div className="border-2 border-dashed border-yellow-300 bg-gradient-to-br from-yellow-50 to-white rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 xl:p-8 text-center h-full flex flex-col justify-center min-h-[180px] sm:min-h-[200px] lg:min-h-[240px] xl:min-h-[280px] hover:border-yellow-400 transition-colors">
                <div className="mb-2 sm:mb-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                    <Search size={20} className="sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2" style={{ fontFamily: "'Abril Fatface', serif" }}>
                    Search Your Property
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    to Compare Here
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* View Results Button */}
          <div className="mt-4 sm:mt-6 text-center">
            <button className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg text-white text-sm sm:text-base font-semibold transition-colors flex items-center justify-center gap-2 mx-auto shadow-md">
              View Results
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyComparison;