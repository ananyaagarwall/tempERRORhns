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
      

      {/* Mobile Footer */}
      <MobileFooter />
    </div>
  );
};

export default PropertyListingPage;