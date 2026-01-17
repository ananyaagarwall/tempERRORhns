import React from "react";
import { Home, ArrowLeft, User, Menu, X } from "lucide-react";

const PropertyHeader = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <header>
      <div className="flex items-center justify-between mt-4 sm:mt-6 px-4 sm:px-8 lg:px-16">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
            <span className="hover:text-blue-600 cursor-pointer transition-colors">View Builders</span>
            <span className="text-gray-400">›</span>
            <span className="hover:text-blue-600 cursor-pointer transition-colors">Neelkanth Palm Avenue</span>
            <span className="text-gray-400">›</span>
            <span className="font-medium text-gray-900">Detail</span>
          </div>
          {/* Mobile breadcrumb */}
          <div className="sm:hidden flex items-center gap-0.5 text-sm text-gray-600">
            <span className="hover:text-blue-600 cursor-pointer">Builders</span>
            <span className="text-gray-400">›</span>
            <span className="font-medium text-gray-900 truncate max-w-[8rem]">Neelkanth...</span>
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden sm:flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Home className="text-gray-600 w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <User className="text-gray-600 w-5 h-5" />
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="sm:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="w-5 h-5 text-gray-600" />
          ) : (
            <Menu className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
          <div className="px-4 py-4 space-y-4">
            <div className="flex items-center gap-3">
              <Home className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700">Home</span>
            </div>
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700">Profile</span>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex items-center gap-2">
                  <span>View Builders</span>
                  <span>›</span>
                  <span>Neelkanth Palm Avenue</span>
                  <span>›</span>
                  <span className="font-medium text-gray-900">Detail</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default PropertyHeader;