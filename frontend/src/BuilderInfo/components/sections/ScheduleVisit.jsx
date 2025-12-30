import React from 'react';
import { ArrowRight } from 'lucide-react';

const ScheduleVisitSection = () => {
  return (
    <div className="w-full max-w-6xl mx-auto p-2 sm:p-4 lg:p-6 xl:p-8">
      <div className="bg-gray-900 rounded-lg sm:rounded-2xl overflow-hidden">
        <div className="relative p-6 sm:p-8 lg:p-12">
          {/* Content Container */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            {/* Left Content */}
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif text-white mb-2 sm:mb-3">
                Schedule a Visit with Us?
              </h2>
              <p className="text-sm sm:text-base text-gray-400">
                Don't worry, we are here to help
              </p>
            </div>

            {/* Right Button */}
            <div className="flex-shrink-0">
              <button className="bg-white hover:bg-gray-100 text-gray-900 font-var(--hns-sans) px-4 sm:px-6 py-2 sm:py-3 rounded-full flex items-center gap-2 transition-colors duration-300 text-sm sm:text-base">
                Let's Talk
                <ArrowRight size={16} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Background Pattern/Decoration (Optional) */}
          <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 opacity-5 pointer-events-none">
            <div className="w-full h-full bg-gradient-to-br from-white to-transparent rounded-full blur-3xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleVisitSection;