import React, { useRef, useState } from 'react';
import { DollarSign, Calculator, FileCheck } from 'lucide-react';

const ResourceHub = () => {
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const services = [
    {
      id: 1,
      icon: <DollarSign size={24} />,
      title: "Payment Structure",
      description: "Your payment plan, your goal. Select your preferred property and view a clear breakdown of the payment milestones and amounts for every stage of the purchase."
    },
    {
      id: 2,
      icon: <Calculator size={24} />,
      title: "EMI Calculator",
      description: "Plan your purchase smartly. Instantly calculate your monthly EMI based on the property type, price, and tenure—customized for this specific project."
    },
    {
      id: 3,
      icon: <FileCheck size={24} />,
      title: "Terms & Bank Approvals",
      description: "Know before you sign. Access all project-specific terms & conditions, along with the list of banks that have approved financing for this property."
    }
  ];

  const checkScrollButtons = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 10);
    }
  };

  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: -260, behavior: 'smooth' });
      setTimeout(checkScrollButtons, 300);
    }
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: 260, behavior: 'smooth' });
      setTimeout(checkScrollButtons, 300);
    }
  };

  // Check scroll buttons on mount
  React.useEffect(() => {
    checkScrollButtons();
  }, []);

  return (
    <>
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .text-xxs {
          font-size: 0.65rem;
          line-height: 0.9rem;
        }
      `}</style>
      <div className="w-full max-w-6xl mx-auto p-1 xs:p-2 sm:p-4 lg:p-6 xl:p-8">
        <div className="bg-white rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg border-0 sm:border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="text-center pt-3 xs:pt-4 sm:pt-8 pb-2 xs:pb-3 sm:pb-6 px-2 xs:px-3 sm:px-4">
            <p className="text-xxs xs:text-xs sm:text-sm text-gray-500 font-serif tracking-wider uppercase mb-1 xs:mb-2">
              OUR FREE SERVICES
            </p>
            <h2 className="builder-section-heading">
              Resource Hub
            </h2>
          </div>

          {/* Services Layout */}
          <div className="px-1 xs:px-2 sm:px-4 lg:px-6 xl:px-8 pb-3 xs:pb-4 sm:pb-8">
            {/* Mobile: Horizontal Carousel */}
            <div className="lg:hidden relative">
              {/* Navigation Buttons */}
              <button
                onClick={scrollLeft}
                disabled={!canScrollLeft}
                className={`absolute left-0 top-1/2 transform -translate-y-1/2 z-10 w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center transition-all duration-200 ${canScrollLeft ? 'opacity-100 hover:shadow-lg' : 'opacity-50 cursor-not-allowed'
                  }`}
              >
                <svg className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={scrollRight}
                disabled={!canScrollRight}
                className={`absolute right-0 top-1/2 transform -translate-y-1/2 z-10 w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center transition-all duration-200 ${canScrollRight ? 'opacity-100 hover:shadow-lg' : 'opacity-50 cursor-not-allowed'
                  }`}
              >
                <svg className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Carousel Container */}
              <div
                ref={scrollContainerRef}
                onScroll={checkScrollButtons}
                className="overflow-x-auto -mx-2 px-2 scrollbar-hide"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
                onLoad={() => checkScrollButtons()}
              >
                <div className="flex gap-2 xs:gap-3 py-2">
                  {services.map((service, index) => (
                    <div key={service.id} className="flex-shrink-0 w-[240px] xs:w-[260px] sm:w-64">
                      <div className="bg-gray-50 rounded-lg p-2 xs:p-3 border-0 hover:shadow-md transition-all duration-300 hover:scale-[1.02] transform hover:border-blue-300">
                        {/* Icon */}
                        <div className="flex justify-center mb-2 xs:mb-3">
                          <div className="w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
                            {React.cloneElement(service.icon, { size: 20, className: 'w-5 h-5 xs:w-5.5 xs:h-5.5 sm:w-6 sm:h-6' })}
                          </div>
                        </div>
                        {/* Content */}
                        <div className="text-center">
                          {/* Title */}
                          <h3 className="text-xs xs:text-sm font-serif text-gray-900 mb-1 xs:mb-2">
                            {service.title}
                          </h3>
                          {/* Description */}
                          <p className="text-xxs xs:text-xs text-gray-600 leading-tight xs:leading-relaxed">
                            {service.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop: Horizontal Cards */}
            <div className="hidden lg:flex lg:flex-row lg:gap-0">
              {services.map((service, index) => (
                <div key={service.id} className="relative flex-1">
                  {/* Desktop Service Card - Horizontal Layout */}
                  <div className="bg-gray-50 rounded-xl p-6 h-full border border-gray-100 hover:shadow-md transition-shadow duration-300 mx-2">
                    {/* Icon */}
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
                        {service.icon}
                      </div>
                    </div>
                    {/* Content */}
                    <div className="text-center">
                      {/* Title */}
                      <h3 className="text-xl font-serif text-gray-900 mb-3">
                        {service.title}
                      </h3>
                      {/* Description */}
                      <p className="text-base text-gray-600 leading-relaxed">
                        {service.description}
                      </p>
                    </div>
                  </div>

                  {/* Vertical Border (Desktop only) */}
                  {index < services.length - 1 && (
                    <div className="absolute top-1/2 -right-0 transform -translate-y-1/2 w-px h-32 bg-gray-200"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResourceHub;