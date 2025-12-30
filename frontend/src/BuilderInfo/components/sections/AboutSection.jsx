import React, { useState, useEffect } from 'react';

const AboutSection = ({ builder }) => {
  if (!builder) {
    return (
      <div className="bg-gray-50 rounded-none border-0 border-gray-100 p-4 md:rounded-2xl md:border md:p-5">
        <div className="text-center text-gray-500">Loading about information...</div>
      </div>
    );
  }
  const [currentSlide, setCurrentSlide] = useState(0);

  const propertyImages = [
    "/residence-agencies.avif",
    "/building.webp",
    "/World-View-tower.jpg"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % propertyImages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-50 rounded-none border-0 border-gray-100 p-4 md:rounded-2xl md:border md:p-5 grid gap-6 md:grid-cols-2" >
      <div className="order-1">
        <h2 className="builder-section-heading">About Us</h2>
        <p className="text-sm leading-relaxed text-gray-800 md:text-base" style={{ fontFamily: 'sans-serif' }}>
          {builder.detailed_description || builder.short_description ||
            `${builder.company_name} is a renowned real estate developer known for delivering quality projects. 
                  With a commitment to excellence and customer satisfaction, we have established ourselves as a trusted name in the industry.`}
          <span className="cursor-pointer text-blue-600"> Read More &gt;&gt;</span>
        </p>
      </div>
      <div className="order-2 flex items-center justify-center">
        <div className="carousel-container relative h-48 w-full max-w-sm overflow-hidden rounded-lg shadow-lg md:h-52 md:w-72">
          {propertyImages.map((img, index) => (
            <div
              key={index}
              className="carousel-item absolute h-full w-full transition-all duration-500 ease-in-out"
              style={{
                transform: `translateX(${(index - currentSlide) * 100}%)`,
                opacity: index === currentSlide ? 1 : 0.7
              }}
            >
              <img src={img} alt={`property-${index}`} className="h-full w-full object-cover" />
            </div>
          ))}

          <div className="carousel-dots absolute bottom-2 left-0 right-0 flex justify-center gap-2">
            {propertyImages.map((_, index) => (
              <button
                key={index}
                className={`h-2 w-2 rounded-full ${index === currentSlide ? 'bg-white' : 'bg-gray-400'}`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutSection;


