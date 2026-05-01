import React from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Calendar, MapPin, Award, ChevronRight } from "lucide-react";
import { buildBuilderPath } from "../../../utils/entityRouting";

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
  
  // Handle navigation
  const handleBuilderClick = async () => {
    const builderPath = await buildBuilderPath(builderData);
    navigate(builderPath);
  };
  
  return (
    <section className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-6 sm:py-8">
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-8">
          
          {/* --- TOP SECTION: Logo & Identity (Side-by-side on mobile) --- */}
          <div className="flex flex-row items-center lg:items-center gap-4 w-full lg:w-auto">
            {/* Logo */}
            <div 
              className="w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-100 flex-shrink-0 flex items-center justify-center cursor-pointer overflow-hidden"
              onClick={handleBuilderClick}
            >
              {builderData?.builder_logo || builderData?.logo ? (
                <img src={builderData?.builder_logo || builderData?.logo} alt={builderName} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-8 h-8 sm:w-12 sm:h-12 text-blue-600" />
              )}
            </div>

            {/* Name & Motto */}
            <div className="flex-1 min-w-0 space-y-1">
              <h2 
                className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight truncate cursor-pointer hover:text-blue-600 transition-colors"
                onClick={handleBuilderClick}
              >
                {builderName}
              </h2>
              <p className="text-xs sm:text-base lg:text-xl text-gray-500 line-clamp-1">{builderMotto}</p>
              
              {/* Ranking Badge - Mobile Optimized */}
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-md w-fit mt-1">
                <Award className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Rank #{builderRanking} in India</span>
              </div>
            </div>
          </div>

          {/* --- MIDDLE SECTION: Stats Grid (Divided columns on mobile) --- */}
          <div className="w-full lg:flex-1 lg:px-8">
            <div className="grid grid-cols-3 divide-x divide-gray-100 border border-gray-100 rounded-xl bg-gray-50/50 p-3 lg:border-none lg:bg-transparent lg:divide-x-0 lg:p-0 lg:flex lg:justify-center lg:gap-8">
              
              {/* Stat 1 */}
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left px-1">
                <span className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{completedProjects}</span>
                <span className="text-[10px] sm:text-xs lg:text-sm text-gray-500 font-medium uppercase tracking-wide mt-0.5">Projects</span>
              </div>

              {/* Stat 2 */}
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left px-1">
                <span className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{totalCities}</span>
                <span className="text-[10px] sm:text-xs lg:text-sm text-gray-500 font-medium uppercase tracking-wide mt-0.5">Cities</span>
              </div>

              {/* Stat 3 */}
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left px-1">
                <span className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">{newProjects}</span>
                <span className="text-[10px] sm:text-xs lg:text-sm text-blue-600/80 font-medium uppercase tracking-wide mt-0.5">Ongoing</span>
              </div>

            </div>
          </div>

          {/* --- BOTTOM SECTION: Actions & Meta --- */}
          <div className="w-full lg:w-auto flex flex-row lg:flex-col items-center justify-between lg:items-end gap-4 mt-2 lg:mt-0">
            {/* Established Date */}
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 bg-gray-100 lg:bg-transparent px-3 py-1.5 rounded-full lg:p-0 lg:rounded-none">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Est. {established}</span>
            </div>

            {/* Visit Profile Button */}
            <button 
              onClick={handleBuilderClick}
              className="group flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm sm:text-base font-semibold rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-200"
            >
              View Builder
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

        </div>
      </div>
    </section>
  );
};

export default BuilderProfile;
