import React from "react";

const PropertyFooter = () => {
  return (
    <footer className="px-4 py-8 sm:px-8 sm:py-10 lg:px-16 lg:py-12">
      <div className="bg-gray-900 rounded-3xl p-6 sm:p-8 lg:p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-6 gap-4 h-full">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="bg-white rounded-full w-12 h-12" />
            ))}
          </div>
        </div>
        <div className="relative z-10">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-white leading-tight mb-4 sm:mb-6 md:mb-8 max-w-xs sm:max-w-md md:max-w-2xl mx-auto">
            Look and find more, browsing with HouseNSeek!
          </h2>
          <div className="flex justify-center space-x-2 sm:space-x-4 md:space-x-8">
            <div className="text-white/10 text-3xl sm:text-4xl md:text-6xl font-bold">HOUSE</div>
            <div className="text-white/10 text-3xl sm:text-4xl md:text-6xl font-bold">N</div>
            <div className="text-white/10 text-3xl sm:text-4xl md:text-6xl font-bold">SEEK</div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PropertyFooter;