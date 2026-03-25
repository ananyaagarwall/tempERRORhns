import API_BASE_URL from '../../../config';
import React from 'react';
import { Heart } from 'lucide-react';
import { useCart } from '../../../hns_cart_page/js/CartContent.jsx';

const Tag = ({ children }) => (
  <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] sm:text-[11px] text-gray-700 border-2 border-yellow-400">{children}</span>
);

const BuilderHeaderCard = ({ builder }) => {
  const { addBuilder, removeBuilder, isBuilderSaved } = useCart();

  const handleHeartClick = () => {
    if (!builder || !builder.rera_id) return;

    if (isBuilderSaved(builder.rera_id)) {
      removeBuilder(builder.rera_id);
    } else {
      addBuilder(builder);
    }
  };

  if (!builder) {
    return (
      <div className="bg-white rounded-none md:rounded-2xl shadow-sm border-0 md:border md:border-gray-100">
        <div className="p-4 md:p-5">
          <div className="text-center text-gray-500">Loading builder information...</div>
        </div>
      </div>
    );
  }

  const isSaved = isBuilderSaved(builder.rera_id);

  return (
    <div className="bg-white rounded-none md:rounded-2xl shadow-sm border-0 md:border md:border-gray-100 relative">
      {/* Heart Button */}
      <button
        onClick={handleHeartClick}
        className={`absolute top-4 right-4 z-10 p-3 rounded-full backdrop-blur-md transition-all duration-300 shadow-lg ${isSaved
            ? 'bg-red-500 text-white scale-110'
            : 'bg-white/90 text-gray-600 hover:bg-red-50 hover:text-red-500'
          }`}
        aria-label={isSaved ? 'Remove from saved builders' : 'Save builder'}
      >
        <Heart
          size={24}
          fill={isSaved ? 'currentColor' : 'none'}
          className="transition-all duration-300"
        />
      </button>

      <div className="p-4 md:p-5">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:items-start md:gap-0">
          <div className="flex flex-col items-center text-center gap-4 md:flex-row md:items-center md:text-left md:gap-4">
            {builder.builder_logo ? (
              <img
                src={(builder.builder_logo.startsWith('http') ? builder.builder_logo : `${API_BASE_URL}${builder.builder_logo.startsWith('/uploads/') ? builder.builder_logo : `/uploads/${builder.builder_logo}`}`)}
                alt={builder.company_name}
                className="h-24 w-24 rounded-full bg-gray-200 border-4 border-gray-100 shadow-sm md:h-24 md:w-24 object-cover"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-gray-200 border-4 border-gray-100 shadow-sm md:h-24 md:w-24 flex items-center justify-center">
                <span className="text-gray-400 text-xs">No Logo</span>
              </div>
            )}
            <div>
              <div
                className="text-gray-900 text-xl leading-tight md:text-2xl md:leading-tight lg:text-3xl lg:leading-tight"
                style={{
                  fontFamily: 'serif',
                  fontWeight: 1000
                }}
              >
                {builder.company_name || 'Builder Name'}
              </div>
              <div className="text-xs text-gray-500 md:text-sm" style={{ fontFamily: 'sans-serif' }}>
                {builder.location || [builder.city, builder.state].filter(Boolean).join(', ') || 'Location not specified'}
              </div>
              <div className="mt-3 flex flex-wrap justify-center gap-1 md:justify-start md:gap-2">
                {builder.builder_type && <Tag>{builder.builder_type}</Tag>}
                {builder.rera_registered && <Tag>RERA Registered</Tag>}
                {builder.verified && <Tag>Verified</Tag>}
                {builder.established_year && <Tag>Est. {builder.established_year}</Tag>}
              </div>
            </div>
          </div>
          <div className="flex w-full items-center justify-center gap-3 md:mt-0 md:w-auto md:gap-3 pr-12 md:pr-0">
            <div className="h-24 w-36 rounded-lg overflow-hidden md:h-24 md:w-36">
              {builder.cover_banner ? (
                <img src={(builder.cover_banner.startsWith('http') ? builder.cover_banner : `${API_BASE_URL}${builder.cover_banner.startsWith('/uploads/') ? builder.cover_banner : `/uploads/${builder.cover_banner}`}`)} alt={builder.company_name} className="h-full w-full object-cover" />
              ) : (
                <img src="/building.webp" alt="preview" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="h-24 w-36 rounded-lg overflow-hidden md:h-24 md:w-36">
              <img src="/World-View-tower.jpg" alt="preview" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuilderHeaderCard;