import React, { useState, useRef, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../../hns_cart_page/js/CartContent.jsx';
import { fetchBuilderProjects } from '../../../services/api';
import { buildPropertyPath } from '../../../utils/entityRouting';
import { pickProjectImage } from '../../../utils/projectImageUtils';

const firstText = (...values) => {
  for (const value of values) {
    if (Array.isArray(value)) {
      const found = value.find((item) => String(item || '').trim());
      if (found) return String(found).trim();
    } else if (value !== null && value !== undefined && String(value).trim()) {
      return String(value).trim();
    }
  }
  return '';
};

const formatCarpetArea = (project, property) => {
  const dbArea = firstText(property?.Carpet_Area);
  if (dbArea) return dbArea;

  const min = project?.carpet_area_min;
  const max = project?.carpet_area_max;
  if (min && max) return `${min}-${max} sq.ft.`;
  if (min) return `${min} sq.ft.`;
  if (max) return `Up to ${max} sq.ft.`;
  return '';
};

const formatPossession = (project, property) =>
  firstText(property?.Possession_Date, project?.possession_date, project?.completion_date);

const getPrimaryProperty = (project) => project?.primary_property || {};

const getProjectPropertyId = (project) =>
  project?.property_id || getPrimaryProperty(project)?.id || (Array.isArray(project?.property_ids) ? project.property_ids[0] : null);

const ProjectCard = ({ status = 'Ready-to-move', title, image, project, onHeartClick, isInCart, onOpen }) => {
  const property = getPrimaryProperty(project);
  const carpetArea = formatCarpetArea(project, property);
  const highlight = firstText(property?.Key_Highlights, property?.Highlights, project?.highlights, project?.usps);
  const possession = formatPossession(project, property);
  const charges = firstText(property?.Extra_Charges);
  const price = firstText(property?.Price_Starting_From, property?.Pricing, project?.price_range);

  return (
  <article
    className="rounded-xl border border-blue-300 bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-400 hover:scale-[1.005] transform origin-center relative cursor-pointer focus-within:ring-2 focus-within:ring-blue-400"
    onClick={onOpen}
  >
    {/* Heart Button */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        onHeartClick(project);
      }}
      className={`absolute top-2 right-2 z-10 p-2 rounded-full backdrop-blur-md transition-all duration-300 ${isInCart
          ? 'bg-red-500 text-white shadow-lg'
          : 'bg-white/90 text-gray-600 hover:bg-red-50 hover:text-red-500'
        }`}
      aria-label={isInCart ? 'Remove from cart' : 'Add to cart'}
    >
      <Heart
        size={18}
        fill={isInCart ? 'currentColor' : 'none'}
        className="transition-all duration-300"
      />
    </button>

    <div className="relative rounded-t-xl">
      <div className="h-36 md:h-48 bg-gray-200 overflow-hidden rounded-t-xl">
        <img src={image} alt={title} className="w-full h-full object-cover" />
      </div>
      <div className="absolute top-2 left-2 text-[10px] bg-yellow-300 px-2 py-0.5 rounded-full font-semibold">
        {status}
      </div>
    </div>
    <div className="p-2 md:p-3">
      <div className="font-serif text-gray-800 text-sm md:text-base">{title}</div>
      {(carpetArea || highlight) && (
        <div className="mt-1 text-xs md:text-sm text-gray-600">
          {carpetArea && <>Carpet Area: <span className="font-sans">{carpetArea}</span></>}
          {carpetArea && highlight && ' | '}
          {highlight}
        </div>
      )}
      {(possession || charges || price) && (
        <div className="text-xs md:text-sm text-gray-600">
          {possession && <>{possession}</>}
          {possession && (charges || price) && ' | '}
          {charges && <span>{charges}</span>}
          {charges && price && ' | '}
          {price && <span className="font-serif text-black">{price}</span>}
        </div>
      )}
    </div>
  </article>
  );
};

const ProjectsGrid = ({ title, builderId, statusFilter }) => {
  const sliderRef = useRef(null);
  const navigate = useNavigate();
  const [scrollPosition, setScrollPosition] = useState(0);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { addToCart, removeFromCart, isInCart } = useCart();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!builderId) return;
      try {
        setLoading(true);
        const data = await fetchBuilderProjects(builderId);
        if (!cancelled) {
          setProjects(Array.isArray(data) ? data : []);
          setError(null);
        }
      } catch {
        if (!cancelled) setError('No projects here');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [builderId]);

  const handleHeartClick = (project) => {
    const property = getPrimaryProperty(project);
    const propertyId = getProjectPropertyId(project);
    const propertyData = {
      id: propertyId || project.id,
      name: property.Property_Name || project.title,
      price: property.Price_Starting_From || property.Pricing || project.price_range || 'Contact for Price',
      location: property.Location || project.location || 'Location not specified',
      image: pickProjectImage(project, property),
      availability: property.Project_Status || project.property_status || project.status || 'Available',
      bhk: property.Existing_Configurations || project.configuration || 'N/A',
      area: property.Carpet_Area || formatCarpetArea(project, property) || 'N/A',
      builder: property.Builder_Name || project.builder_name || 'Builder',
      amenities: property.Key_Highlights || project.amenities || [],
      source: 'builder_profile'
    };

    if (isInCart(propertyData.id)) {
      removeFromCart(propertyData.id);
    } else {
      addToCart(propertyData, 'builder_profile');
    }
  };

  const openProjectProperty = (project) => {
    const propertyId = getProjectPropertyId(project);
    if (propertyId) {
      navigate(buildPropertyPath(propertyId));
    }
  };

  const scrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -260, behavior: 'smooth' });
      setScrollPosition(sliderRef.current.scrollLeft - 260);
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 260, behavior: 'smooth' });
      setScrollPosition(sliderRef.current.scrollLeft + 260);
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (!statusFilter) return true;
    const property = getPrimaryProperty(p);
    const status = (property.Project_Status || p.property_status || p.status || '').toLowerCase();
    return Array.isArray(statusFilter)
      ? statusFilter.some((s) => status.includes(s.toLowerCase()))
      : status.includes(String(statusFilter).toLowerCase());
  });

  if (!loading && !error && filteredProjects.length === 0) {
    return null;
  }

  return (
    <div className="bg-transparent md:bg-[#F7F9FF] rounded-none md:rounded-2xl border-0 md:border md:border-gray-100 p-3 md:p-5">
      <div className="flex justify-between items-center mb-4">
        <div className="builder-section-heading" style={{ marginBottom: 0 }}>{title}</div>
        <div className="hidden md:flex gap-2">
          <button
            onClick={scrollLeft}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-800 rounded-full w-8 h-8 flex items-center justify-center shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            onClick={scrollRight}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-800 rounded-full w-8 h-8 flex items-center justify-center shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          ref={sliderRef}
          className="flex gap-2 xs:gap-3 md:gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth -mx-2 px-2 md:-mx-3 md:px-3"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {loading && (
            <div className="text-sm text-gray-500">Loading projects...</div>
          )}
          {!loading && error && (
            <div className="text-sm text-red-600">{error}</div>
          )}
          {!loading && !error && filteredProjects.map((p) => {
            const property = getPrimaryProperty(p);
            const image = pickProjectImage(p, property);
            const propertyId = getProjectPropertyId(p);
            return (
              <div key={p.id} className="w-[240px] xs:w-[260px] sm:w-60 md:w-72 flex-shrink-0 my-1">
                <ProjectCard
                  title={property.Property_Name || p.title}
                  status={property.Project_Status || p.property_status || p.status || 'Ready-to-move'}
                  image={image}
                  project={p}
                  onHeartClick={handleHeartClick}
                  isInCart={isInCart(propertyId || p.id)}
                  onOpen={() => openProjectProperty(p)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProjectsGrid;
