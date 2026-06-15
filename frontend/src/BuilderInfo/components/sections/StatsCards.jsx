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

  // ── Years of Legacy: calculated from established_year (already in DB) ──
  const currentYear = new Date().getFullYear();
  const yearsOfLegacy = builder.established_year ? currentYear - builder.established_year : 0;

  // ── Projects Delivered: completed_projects (already in DB) ──
  const projectsDelivered = builder.completed_projects || 0;

  // ── Happy Families: driven by total_units_sold from DB.
  //    Add `total_units_sold` (Integer) to the Builder model.
  //    Falls back gracefully to 0 if not yet populated.
  const happyFamilies = builder.total_units_sold || 0;

  // Format happy families: show "X.XK+" for thousands, "X.XM+" for millions,
  // plain number for < 1000, or "—" when the field hasn't been filled yet.
  const formatFamilies = (n) => {
    if (!n) return '—';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K+`;
    return `${n}+`;
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 sm:gap-6">
      <Card title={`${projectsDelivered}+`} subtitle="Projects Delivered" gradientFrom="#FFE993" gradientTo="#FFC83A" />
      <Card title={`${yearsOfLegacy}+`} subtitle="Years Of Legacy" gradientFrom="#FFE993" gradientTo="#FFC83A" />
      <Card title={formatFamilies(happyFamilies)} subtitle="Happy Families" gradientFrom="#FFE993" gradientTo="#FFC83A" />
    </div>
  );
};

export default StatsCards;