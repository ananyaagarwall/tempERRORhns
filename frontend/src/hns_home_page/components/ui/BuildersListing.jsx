import API_BASE_URL from '../../../config';
import React, { useState, useEffect } from 'react';
import { Search, Building2, MapPin, Award, CheckCircle, Calendar, ExternalLink, Phone, Mail, Heart } from 'lucide-react';
import { useCart } from '../../../hns_cart_page/js/CartContent.jsx';
import FooterNavBar from '../layout/FooterNavBar';
import DynamicBreadcrumb from '../../../components/ui/DynamicBreadcrumb';

const BuildersListing = () => {
  const [builders, setBuilders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  
  const { addBuilder, removeBuilder, isBuilderSaved } = useCart();

  useEffect(() => {
    fetchBuilders();
  }, []);

  const fetchBuilders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/builders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch builders');
      }

      const data = await response.json();
      setBuilders(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching builders:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredBuilders = builders
    .filter(builder => {
      const matchesSearch = 
        builder.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        builder.brand_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        builder.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        builder.location?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = 
        filterType === 'all' || 
        builder.builder_type?.toLowerCase().includes(filterType.toLowerCase());

      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.company_name || '').localeCompare(b.company_name || '');
        case 'projects':
          return (b.completed_projects || 0) - (a.completed_projects || 0);
        case 'established':
          return (b.established_year || 0) - (a.established_year || 0);
        default:
          return 0;
      }
    });

  const handleHeartClick = (e, builder) => {
    e.stopPropagation();
    if (isBuilderSaved(builder.rera_id)) {
      removeBuilder(builder.rera_id);
    } else {
      addBuilder(builder);
    }
  };

  const BuilderCard = ({ builder }) => (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100 relative">
      {/* Heart Button */}
      <button
        onClick={(e) => handleHeartClick(e, builder)}
        className={`absolute top-4 right-4 z-10 p-2.5 rounded-full backdrop-blur-md transition-all duration-300 ${
          isBuilderSaved(builder.rera_id)
            ? 'bg-red-500 text-white shadow-lg scale-110'
            : 'bg-white/90 text-gray-600 hover:bg-red-50 hover:text-red-500'
        }`}
        aria-label={isBuilderSaved(builder.rera_id) ? 'Remove from saved' : 'Save builder'}
      >
        <Heart
          size={20}
          fill={isBuilderSaved(builder.rera_id) ? 'currentColor' : 'none'}
          className="transition-all duration-300"
        />
      </button>

      {/* Header with Logo/Banner */}
      <div className="relative h-32 bg-gradient-to-r from-blue-600 to-indigo-600">
        {builder.cover_banner && (
          <img 
            src={builder.cover_banner} 
            alt={builder.company_name}
            className="w-full h-full object-cover"
          />
        )}
        {builder.verified && (
          <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <CheckCircle size={14} />
            Verified
          </div>
        )}
      </div>

      {/* Logo */}
      <div className="relative px-6 -mt-12">
        <div className="w-24 h-24 bg-white rounded-xl shadow-lg border-4 border-white flex items-center justify-center">
          {builder.builder_logo ? (
            <img 
              src={builder.builder_logo} 
              alt={builder.company_name}
              className="w-full h-full object-contain rounded-lg"
            />
          ) : (
            <Building2 size={40} className="text-blue-600" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 pt-4">
        <h3 className="text-xl font-bold text-gray-900 mb-1">
          {builder.company_name}
        </h3>
        {builder.brand_name && builder.brand_name !== builder.company_name && (
          <p className="text-sm text-gray-500 mb-3">{builder.brand_name}</p>
        )}

        {builder.short_description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {builder.short_description}
          </p>
        )}

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={16} className="text-blue-600 flex-shrink-0" />
            <span className="truncate">{builder.city}, {builder.state}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={16} className="text-blue-600 flex-shrink-0" />
            <span>Established {builder.established_year}</span>
          </div>

          {builder.builder_type && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Building2 size={16} className="text-blue-600 flex-shrink-0" />
              <span className="truncate">{builder.builder_type}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {builder.completed_projects || 0}
            </div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600">
              {builder.ongoing_projects || 0}
            </div>
            <div className="text-xs text-gray-600">Ongoing</div>
          </div>
        </div>

        <div className="space-y-2 mb-4 pb-4 border-b border-gray-100">
          {builder.contact_email && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Mail size={14} />
              <span className="truncate">{builder.contact_email}</span>
            </div>
          )}
          {builder.contact_number && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Phone size={14} />
              <span>{builder.contact_number}</span>
            </div>
          )}
        </div>

        {builder.rera_registered && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600" />
              <span className="text-xs font-semibold text-green-700">
                RERA ID: {builder.rera_id}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button 
            onClick={() => window.location.href = `/builder/${builder.company_name.replace(/\s+/g, '-')}`}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            View Details
          </button>
          {builder.website_url && builder.website_url !== 'NA' && (
            <a
              href={builder.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center px-3 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <ExternalLink size={18} />
            </a>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading builders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 mb-4">
            <Building2 size={48} className="mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Builders</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchBuilders}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <FooterNavBar />
      <DynamicBreadcrumb />

      {/* Hero Header */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-5 mb-6">
            <div className="p-4 bg-blue-50 rounded-2xl">
              <Building2 size={56} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                Our Builders
              </h1>
              <p className="mt-3 text-lg text-gray-600 max-w-3xl">
                Discover trusted and verified real estate developers across Navi Mumbai. 
                Explore premium projects, detailed profiles, and find the perfect builder for your dream home.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-gray-50 -mt-8 pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by builder name, city, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-6 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="mixed">Mixed-Use</option>
                <option value="luxury">Luxury</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-6 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="name">Sort by Name</option>
                <option value="projects">Sort by Projects</option>
                <option value="established">Sort by Year</option>
              </select>
            </div>

            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredBuilders.length}</span> of{' '}
              <span className="font-semibold text-gray-900">{builders.length}</span> builders
            </div>
          </div>
        </div>
      </div>

      {/* Builders Grid */}
      <div className="bg-gray-50 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredBuilders.length === 0 ? (
            <div className="text-center py-20">
              <Building2 size={80} className="mx-auto text-gray-300 mb-6" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">No Builders Found</h3>
              <p className="text-gray-600 text-lg">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredBuilders.map((builder) => (
                <BuilderCard key={builder.rera_id} builder={builder} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BuildersListing;