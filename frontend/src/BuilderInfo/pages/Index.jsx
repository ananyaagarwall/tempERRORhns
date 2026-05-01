import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import FooterNavBar from '../../hns_home_page/components/layout/FooterNavBar';
import FooterSection from '../../hns_home_page/components/layout/FooterSection';
import DynamicBreadcrumb from '../../components/ui/DynamicBreadcrumb';
import MobileFooter from '../../components/ui/MobileFooter';  // ← Added from second version

import Header from '../components/layout/Header';
import BuilderHero from '../components/sections/BuilderHero';
import BuilderHeaderCard from '../components/sections/BuilderHeaderCard';
import AboutSection from '../components/sections/AboutSection';
import DetailsSection from '../components/sections/DetailsSection';
import StatsCards from '../components/sections/StatsCards';
import ProjectsGrid from '../components/sections/ProjectsGrid';
import WhoWeAreSection from '../components/sections/WhoWeAreSection';
import FloorPlansSection from '../components/sections/FloorPlansSection';
import SearchByFilter from '../components/sections/SearchByFilter';
import ResourceHub from '../components/sections/ResourceHub';
import PropertyComparison from '../components/sections/PropertyComparison';
import ScheduleVistSection from '../components/sections/ScheduleVisit';

import { fetchBuilderByName, fetchBuilderByReraId } from '../../services/api';
import { resolveBuilderFromRouteToken } from '../../utils/entityRouting';

import '../../hns_home_page/home_page_css/TrustedBuildersSection.css';
import '../../hns_home_page/home_page_css/FooterSection.css';
import '../styles/builderPageLayout.css';

function BuilderInfoIndex() {
  const [builder, setBuilder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { builderToken, builderName } = useParams();
  const builderRouteToken = builderName || builderToken;

  useEffect(() => {
    const fetchBuilderData = async () => {
      try {
        setLoading(true);

        if (!builderRouteToken) {
          setError('No builder specified. Please select a builder from the search results.');
          setLoading(false);
          return;
        }

        try {
          let builderData = null;

          try {
            const resolved = await resolveBuilderFromRouteToken(builderRouteToken);
            if (resolved?.builder?.rera_id) {
              builderData = await fetchBuilderByReraId(resolved.builder.rera_id);
            } else if (resolved?.builder) {
              builderData = resolved.builder;
            }
          } catch (resolveError) {
            // Continue with direct fetch fallbacks.
          }

          if (!builderData) {
            try {
              builderData = await fetchBuilderByReraId(builderRouteToken);
            } catch (byIdError) {
              builderData = await fetchBuilderByName(builderRouteToken);
            }
          }

          setBuilder(builderData);
          setError(null);
        } catch (fetchError) {
          console.log(`Builder "${builderRouteToken}" not found in database`);
          setError(
            `Builder "${String(builderRouteToken).replace(/-/g, ' ')}" information is not available. This might be because the builder profile hasn't been added yet.`
          );
        }
      } catch (err) {
        console.log('Error fetching builder data:', err);
        setError('Failed to load builder information');
      } finally {
        setLoading(false);
      }
    };

    fetchBuilderData();
  }, [builderRouteToken]);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: '#EFF5FF' }}>
        <FooterNavBar sticky={true} />
        <DynamicBreadcrumb />
        <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
          <div className="text-lg text-gray-600">Loading builder information...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ background: '#EFF5FF' }}>
        <FooterNavBar sticky={true} />
        <DynamicBreadcrumb />
        <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
          <div className="text-lg text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#ffff' }}>
      <FooterNavBar sticky={true} />
      <DynamicBreadcrumb
        customLabels={{ [`/builder/${builderRouteToken}`]: builder?.company_name || 'Builder' }}
      />

      {/* Hero Strip */}
      <BuilderHero builder={builder} />

      <div className="w-full">
        <div className="builder-page-title" style={{ marginTop: 16 }}>
          <h2 className="builder-section-heading">
            Look into The <span style={{ color: '#2b2bb2' }}>Builders</span>
          </h2>
        </div>

        {/* Sections container with dynamic gap */}
        <div className="builder-sections-container">
          <div className="builder-section">
            <BuilderHeaderCard builder={builder} />
          </div>

          <div className="builder-section">
            <AboutSection builder={builder} />
          </div>

          <div className="builder-section">
            <DetailsSection builder={builder} />
          </div>

          <div className="builder-section">
            <StatsCards builder={builder} />
          </div>

          <div className="builder-section projects-grid-section">
            <ProjectsGrid title="Our popular projects" builderId={builder?.rera_id} />
          </div>

          <div className="builder-section projects-grid-section">
            <ProjectsGrid
              title="Our ongoing Projects"
              builderId={builder?.rera_id}
              statusFilter={['under construction', 'ongoing', 'in progress']}
            />
          </div>

          <div className="builder-section projects-grid-section">
            <ProjectsGrid
              title="Our completed Projects"
              builderId={builder?.rera_id}
              statusFilter={['completed', 'ready-to-move', 'ready to move']}
            />
          </div>

          <div className="builder-section projects-grid-section">
            <ProjectsGrid
              title="Our upcoming Projects"
              builderId={builder?.rera_id}
              statusFilter={['upcoming', 'pre-launch', 'pre launch']}
            />
          </div>

          <div className="builder-section who-we-are-section">
            <WhoWeAreSection />
          </div>

          <div className="builder-section floor-plans-section">
            <FloorPlansSection />
          </div>

          <div className="builder-section search-filter-section">
            <SearchByFilter />
          </div>

          <div className="builder-section resource-hub-section">
            <ResourceHub />
          </div>

          <div className="builder-section property-comparison-section">
            <PropertyComparison />
          </div>

          <div className="builder-section schedule-visit-section">
            <ScheduleVistSection />
          </div>
        </div>
      </div>

      {/* Footer */}
      <FooterSection />
      <MobileFooter />  {/* ← Restored from second version */}
    </div>
  );
}

export default BuilderInfoIndex;
