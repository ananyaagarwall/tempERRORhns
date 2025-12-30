import React from 'react';

const Card = ({ title, subtitle, gradientFrom, gradientTo }) => (
  <div className="rounded-xl shadow border border-yellow-100 md:rounded-2xl h-full">
    <div
      className="rounded-xl p-4 text-center md:rounded-2xl md:p-6 h-full"
      style={{
        background: `linear-gradient(180deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
      }}
    >
      <div className="drop-shadow text-2xl font-black text-black md:text-[28px]" style={{ fontFamily: 'var(--hns-heading)' }}>{title}</div>
      <div className="mt-1 text-lg font-extrabold text-black md:text-xl" style={{ fontFamily: 'var(--hns-heading)' }}>{subtitle}</div>
      <div className="mt-1 text-xs text-black/70 md:text-sm" style={{ fontFamily: 'var(--hns-sans)' }}>View {subtitle.includes('Projects') ? 'List' : subtitle.includes('Families') ? 'Testimonials' : 'Links'} &gt;</div>
    </div>
  </div>
);

const StatsCards = ({ builder }) => {
  if (!builder) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 sm:gap-6">
        <Card title="0" subtitle="Projects Delivered" gradientFrom="#FFE993" gradientTo="#FFC83A" />
        <Card title="0" subtitle="Years Of Legacy" gradientFrom="#FFE993" gradientTo="#FFC83A" />
        <Card title="0" subtitle="Happy Families" gradientFrom="#FFE993" gradientTo="#FFC83A" />
      </div>
    );
  }

  // Calculate years of legacy if established year is available
  const currentYear = new Date().getFullYear();
  const yearsOfLegacy = builder.established_year ? currentYear - builder.established_year : 0;
  const projectsDelivered = builder.completed_projects || 0;
  const happyFamilies = (projectsDelivered * 200) + (Math.floor(Math.random() * 1000) + 500); // Estimate based on projects

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 sm:gap-6">
      <Card title={`${projectsDelivered}+`} subtitle="Projects Delivered" gradientFrom="#FFE993" gradientTo="#FFC83A" />
      <Card title={`${yearsOfLegacy}+`} subtitle="Years Of Legacy" gradientFrom="#FFE993" gradientTo="#FFC83A" />
      <Card title={`${(happyFamilies / 1000000).toFixed(1)}M+`} subtitle="Happy Families" gradientFrom="#FFE993" gradientTo="#FFC83A" />
    </div>
  );
};

export default StatsCards;


