import React from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Calendar, MapPin, Award } from "lucide-react";

const BuilderProfile = ({ builderData }) => {
  const navigate = useNavigate();
  
  // Extract builder information with fallback values
  const builderName = builderData?.company_name || builderData?.builder_name || "Builder Name";
  const builderMotto = builderData?.motto || builderData?.tagline || "Building Dreams | Creating Realities";
  const builderRanking = builderData?.ranking || builderData?.rank || 7;
  const totalCities = builderData?.total_cities || builderData?.cities || 123;
  const completedProjects = builderData?.completed_projects || builderData?.projects_done || 23;
  const newProjects = builderData?.new_projects || builderData?.ongoing_projects || 14;
  const established = builderData?.established_year || builderData?.year_established || 1995;
  
  // Handle navigation to builder info page
  const handleBuilderClick = () => {
    const builderNameParam = builderName.replace(/\s+/g, '-').toLowerCase();
    navigate(`/builder/${builderNameParam}`);
  };
  
  return (
    <section className="px-4 sm:px-8 lg:px-16 py-6 sm:py-8 border-b border-gray-200 bg-white">
      <div className="flex flex-col lg:flex-row items-center justify-center lg:items-center gap-6 lg:gap-8 text-center lg:text-left max-w-6xl mx-auto">
        {/* Builder Logo */}
        <div 
          className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
          onClick={handleBuilderClick}
        >
          {builderData?.logo ? (
            <img src={builderData.logo} alt={builderName} className="w-full h-full object-cover rounded-2xl" />
          ) : (
            <Building2 className="w-8 h-8 sm:w-12 sm:h-12 text-blue-600" />
          )}
        </div>
        
        {/* Builder Info */}
        <div className="flex-1 space-y-2 sm:space-y-3">
          <h2 
            className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight cursor-pointer hover:text-blue-600 transition-colors"
            onClick={handleBuilderClick}
          >
            {builderName}
          </h2>
          <p className="text-lg sm:text-xl text-gray-900">{builderMotto}</p>
          <div className="flex items-center justify-center lg:justify-start gap-2 text-sm sm:text-lg text-gray-600">
            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
            <span>This Property is at {builderRanking}th Position in builders rankings.</span>
          </div>
        </div>
        
        {/* Builder Stats */}
        <div className="w-full lg:w-auto lg:text-right space-y-2 sm:space-y-3">
          <div className="flex flex-wrap justify-center lg:justify-end lg:flex-row gap-2 sm:gap-3 lg:gap-4">
            <div className="flex items-center gap-2 text-sm sm:text-lg font-bold text-gray-900">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 lg:hidden" />
              <span>{totalCities} Cities</span>
            </div>
            <div className="flex items-center gap-2 text-sm sm:text-lg font-bold text-gray-900">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 lg:hidden" />
              <span>{completedProjects} Projects Done</span>
            </div>
            <div className="flex items-center gap-2 text-sm sm:text-lg font-bold text-gray-900">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 lg:hidden" />
              <span>{newProjects} New Projects</span>
            </div>
          </div>
          
          <div className="space-y-1 sm:space-y-2">
            <p 
              className="text-sm sm:text-lg text-gray-600 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={handleBuilderClick}
            >
              Visit this Builder's Profile ›
            </p>
            <div className="flex items-center justify-center lg:justify-end gap-2 text-sm sm:text-lg text-blue-600 font-medium">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Established: {established}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BuilderProfile;