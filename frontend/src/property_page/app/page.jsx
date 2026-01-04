import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";

// Layout Components
import FooterNavBar from '../../hns_home_page/components/layout/FooterNavBar';
import PropertyHeader from '../components/layouts/PropertyHeader';
import PropertyFooter from '../components/layouts/PropertyFooter';
import DynamicBreadcrumb from '../../components/ui/DynamicBreadcrumb.jsx';
import MobileFooter from '../../components/ui/MobileFooter.jsx'; // Added from second version

// Section Components
import BuilderProfile from '../components/sections/BuilderProfile';
import PropertyHero from '../components/sections/PropertyHero';
import MainContentSection from '../components/sections/MainContentSection';
import ExistingFloorPlansSection from '../components/sections/ExistingFloorPlansSection';
import ReadMoreAboutProperty from '../components/sections/ReadMoreAboutProperty';

// Import API services
import { fetchBuilderByName } from '../../services/api';

// Import styles
import '../property_page_css/styles.css';

const PropertyListingPage = () => {
  const [builderData, setBuilderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const { id } = useParams(); // Get property ID from URL

  useEffect(() => {
    const fetchBuilderData = async () => {
      try {
        setLoading(true);

        // Get builder name from navigation state or fallback
        const builderName = location.state?.builderName || "Hiranandani Group";

        try {
          const builder = await fetchBuilderByName(builderName);
          setBuilderData(builder);
          return;
        } catch (err) {
          console.log(`Builder "${builderName}" not found, using fallback data`);
        }

        // Fallback static data if API fails
        setBuilderData({
          company_name: "Hiranandani Group",
          motto: "Building Dreams | Creating Realities",
          ranking: 7,
          total_cities: 123,
          completed_projects: 23,
          new_projects: 14,
          established_year: 1995
        });
      } catch (error) {
        console.log('Error in builder data fetch, using fallback');
        setBuilderData({
          company_name: "Hiranandani Group",
          motto: "Building Dreams | Creating Realities",
          ranking: 7,
          total_cities: 123,
          completed_projects: 23,
          new_projects: 14,
          established_year: 1995
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBuilderData();
  }, [location.state]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      {/* Fixed Header with backdrop blur */}
      <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/90 border-b border-gray-200/50 shadow-sm">
        <FooterNavBar />
      </div>

      {/* Dynamic Breadcrumb */}
      <DynamicBreadcrumb
        customLabels={{
          [`/property/${id}`]: location.state?.propertyName || 'Property Details'
        }}
      />

      {/* Main Content */}
      <main className="pt-16 sm:pt-20 lg:pt-24 pb-16 lg:pb-0">
        <PropertyHeader />
        {!loading && <BuilderProfile builderData={builderData} />}
        <PropertyHero />
        <MainContentSection />
        <ExistingFloorPlansSection />
        <ReadMoreAboutProperty />
        <PropertyFooter />
      </main>

      {/* Floating Call Button (Mobile Only) */}
      <div className="fixed bottom-24 right-4 z-30 lg:hidden">
        <button className="w-14 h-14 bg-gradient-to-r from-yellow-400 to-yellow-500 text-blue-900 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
        </button>
      </div>

      {/* Mobile Footer */}
      <MobileFooter />
    </div>
  );
};

export default PropertyListingPage;