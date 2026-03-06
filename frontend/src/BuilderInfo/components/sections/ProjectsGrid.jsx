import API_BASE_URL from '../../../config';
import React, { useState, useRef, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useCart } from '../../../hns_cart_page/js/CartContent.jsx';
import { fetchBuilderProjects } from '../../../services/api';

const ProjectCard = ({ status = 'Ready-to-move', title, image, project, onHeartClick, isInCart }) => (
  <div className="rounded-xl border border-blue-300 bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-400 hover:scale-[1.005] transform origin-center relative">
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
      <div className="mt-1 text-xs md:text-sm text-gray-600">Carpet Area: <span className="font-sans">685–715 sq.ft.</span> | Spacious balconies</div>
      <div className="text-xs md:text-sm text-gray-600">2 Years old | Maintenance: <span className="font-serif text-black">₹2.5/sq.ft.</span></div>
    </div>
  </div>
);

const withBackendOrigin = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

const normalizeUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/uploads/')) return withBackendOrigin(url);
  return withBackendOrigin(`/uploads/${url}`);
};

const looksLikeUrl = (val) => {
  if (!val || typeof val !== 'string') return false;
  const s = val.trim().toLowerCase();
  return s.startsWith('http') || s.startsWith('/uploads/') || s.includes('.') || s.includes('/');
};

const pickProjectImage = (project) => {
  if (project.project_image) return normalizeUrl(project.project_image);
  if (project.image_urls) {
    try {
      const parsed = typeof project.image_urls === 'string' && project.image_urls.trim().startsWith('[')
        ? JSON.parse(project.image_urls)
        : project.image_urls.split(',');
      const first = Array.isArray(parsed) ? parsed[0] : null;
      if (first && looksLikeUrl(String(first))) return normalizeUrl(String(first).trim());
    } catch { }
  }
  if (Array.isArray(project.floor_plans) && project.floor_plans.length > 0) {
    const firstPlan = String(project.floor_plans[0]);
    if (looksLikeUrl(firstPlan)) return normalizeUrl(firstPlan);
  }
  return '/building.webp';
};

const ProjectsGrid = ({ title, builderId, statusFilter }) => {
  const sliderRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { addToCart, removeFromCart, isInCart } = useCart();

  useEffect(() => {
    const load = async () => {
      if (!builderId) return;
      try {
        setLoading(true);
        let statusParam = '';
        if (statusFilter) {
          if (Array.isArray(statusFilter) && statusFilter.length > 0) {
            statusParam = statusFilter[0];
          } else if (typeof statusFilter === 'string') {
            statusParam = statusFilter;
          }
        }
        const data = await fetchBuilderProjects(builderId, statusParam);
        setProjects(Array.isArray(data) ? data : []);
        setError(null);
      } catch (e) {
        setError('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [builderId, statusFilter]);

  const handleHeartClick = (project) => {
    const propertyData = {
      id: project.id,
      name: project.title,
      price: project.price || 'Contact for Price',
      location: project.location || 'Location not specified',
      image: pickProjectImage(project),
      availability: project.status || 'Available',
      bhk: project.configuration || '2-3 BHK',
      area: project.carpet_area || 'N/A',
      builder: project.builder_name || 'Builder',
      amenities: project.amenities || [],
      source: 'builder_profile'
    };

    if (isInCart(project.id)) {
      removeFromCart(project.id);
    } else {
      addToCart(propertyData, 'builder_profile');
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
    const status = (p.status || '').toLowerCase();
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
            const image = pickProjectImage(p);
            return (
              <div key={p.id} className="w-[240px] xs:w-[260px] sm:w-60 md:w-72 flex-shrink-0 my-1">
                <ProjectCard
                  title={p.title}
                  status={p.status || 'Ready-to-move'}
                  image={image}
                  project={p}
                  onHeartClick={handleHeartClick}
                  isInCart={isInCart(p.id)}
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