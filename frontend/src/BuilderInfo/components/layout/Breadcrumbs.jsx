import React from 'react';

const Breadcrumbs = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 text-xs text-gray-500 py-2">
      <div className="flex items-center gap-2">
        <span>View Builders</span>
        <span>›</span>
        <span className="truncate max-w-[160px]">Neelkanth Palm Avenue</span>
        <span>›</span>
        <span className="text-gray-700">Detail</span>
      </div>
    </div>
  );
};

export default Breadcrumbs;


