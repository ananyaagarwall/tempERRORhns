import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

// Layout Components
import FooterNavBar from '../../hns_home_page/components/layout/FooterNavBar';
// import PropertyHeader from '../components/layouts/PropertyHeader';
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
import { fetchBuilderByName, fetchBuilderById, fetchBuilderProjectById, fetchPropertyById } from '../../services/api';
import { parsePropertyIdFromRouteToken } from '../../utils/entityRouting';

// Import styles
import '../property_page_css/styles.css';

const PropertyListingPage = () => {
  const [propertyData, setPropertyData] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [builderData, setBuilderData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { propertyToken } = useParams();

  useEffect(() => {
    const loadPropertyPageData = async () => {
      try {
        setLoading(true);
        setError(null);

        const propertyId = parsePropertyIdFromRouteToken(propertyToken);
        if (!propertyId) {
          setError('Invalid property route.');
          setPropertyData(null);
          setProjectData(null);
          setBuilderData(null);
          return;
        }

        const property = await fetchPropertyById(propertyId);
        setPropertyData(property);

        let project = null;
        if (property?.project_id) {
          try {
            project = await fetchBuilderProjectById(property.project_id);
          } catch (projectError) {
            console.log('Linked project could not be loaded for property page:', projectError);
          }
        }
        setProjectData(project);

        let builder = null;
        if (project?.builder_id) {
          try {
            builder = await fetchBuilderById(project.builder_id);
          } catch (builderError) {
            console.log('Builder fetch by RERA ID failed, falling back to builder name:', builderError);
          }
        }

        if (!builder && (property?.Builder_Name || project?.builder_name)) {
          try {
            builder = await fetchBuilderByName(property?.Builder_Name || project?.builder_name);
          } catch (builderByNameError) {
            console.log('Builder fetch by name failed for property page:', builderByNameError);
          }
        }

        setBuilderData(builder);
      } catch (error) {
        console.log('Error loading property page:', error);
        setError('Failed to load property details.');
        setPropertyData(null);
        setProjectData(null);
        setBuilderData(null);
      } finally {
        setLoading(false);
      }
    };

    loadPropertyPageData();
  }, [propertyToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
        <div className="fixed top-0 left-0 right-0 z-[1200] backdrop-blur-md bg-white/90 border-b border-gray-200/50 shadow-sm">
          <FooterNavBar />
        </div>
        <main className="pt-16 sm:pt-20 lg:pt-24 pb-16 lg:pb-0">
          <DynamicBreadcrumb />
          <div className="px-4 sm:px-8 lg:px-16 py-12 text-gray-600">Loading property details...</div>
        </main>
        <MobileFooter />
      </div>
    );
  }

  if (error || !propertyData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
        <div className="fixed top-0 left-0 right-0 z-[1200] backdrop-blur-md bg-white/90 border-b border-gray-200/50 shadow-sm">
          <FooterNavBar />
        </div>
        <main className="pt-16 sm:pt-20 lg:pt-24 pb-16 lg:pb-0">
          <DynamicBreadcrumb />
          <div className="px-4 sm:px-8 lg:px-16 py-12 text-red-600">{error || 'Property not found.'}</div>
        </main>
        <MobileFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      {/* Fixed Header with backdrop blur */}
      <div className="fixed top-0 left-0 right-0 z-[1200] backdrop-blur-md bg-white/90 border-b border-gray-200/50 shadow-sm">
        <FooterNavBar />
      </div>

      {/* Main Content */}
      <main className="pt-16 sm:pt-20 lg:pt-24 pb-16 lg:pb-0">
        <DynamicBreadcrumb />
        {/* <PropertyHeader propertyData={propertyData} /> */}
        {builderData && <BuilderProfile builderData={builderData} />}
        <PropertyHero propertyData={propertyData} projectData={projectData} />
        <MainContentSection propertyData={propertyData} projectData={projectData} builderData={builderData} />
        <ExistingFloorPlansSection propertyData={propertyData} projectData={projectData} />
        <ReadMoreAboutProperty propertyData={propertyData} projectData={projectData} />
        <PropertyFooter />
      </main>

      {/* Floating Call Button (Mobile Only) */}


      {/* Mobile Footer */}
      <MobileFooter />
    </div>
  );
};

export default PropertyListingPage;
