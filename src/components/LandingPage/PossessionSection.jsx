import React from 'react';

const POSSESSION_PROJECTS = [
  {
    img: '/presidental.jpeg',
    date: 'Date in Dec 2025',
    name: 'Mahalaxmi',
    group: 'Prestige Group',
    details: '3,4 BHK   ₹6.15 Cr – ₹10.79 Cr',
  },
  {
    img: '/kalpa.jpg',
    date: 'Date in March 2029',
    name: 'Worli',
    group: 'Birla Estates',
    details: '4,5 BHK   ₹26 Cr – ₹32.11 Cr',
  },
  {
    img: '/lodha.jpg',
    date: 'Date in Oct 2026',
    name: 'Matunga',
    group: 'Lodha Group',
    details: '2,3,4 BHK   ₹4.22 Cr +',
  },
  {
    img: '/rustomujee.jpg',
    date: 'Date in Jan 2027',
    name: 'Chembur',
    group: 'Godrej Properties',
    details: '2,3 BHK   ₹2.8 Cr – ₹5.6 Cr',
  },
];

const PossessionSection = () => (
  <section 
    className="bg-[#F7F9FF] rounded-[18px] px-2 md:px-0 max-w-full box-border" 
    style={{
      paddingTop: '16px',  // Reduced from py-8 (32px) to 16px
      paddingBottom: '24px', // Reduced from py-8 (32px) to 24px
      marginTop: '8px',     // Reduced from my-8 (32px) to 8px
      marginBottom: '32px'  // Keep bottom margin for next section
    }}
  >
    <div style={{ textAlign: 'center', width: '100%' }}>
      <h2 className="section-heading">Search by Date of Possession</h2>
      <span className="section-underline" />
      <button className="bg-none text-[#223A5F] font-bold text-base md:text-lg border-none cursor-pointer flex items-center gap-2 mt-4 mb-2 ml-auto" style={{ display: 'inline-flex' }}>
  VIEW ALL <span className="text-lg font-bold">&#8250;</span>
</button>

    </div>
    <div className="flex gap-4 md:gap-7 overflow-x-auto pb-4 px-2 md:px-8">
      {POSSESSION_PROJECTS.map((proj, idx) => (
        <div key={idx} className="flex-shrink-0 w-[220px] md:w-[340px] h-[300px] md:h-[360px] rounded-[18px] overflow-hidden bg-cover bg-center relative shadow-md flex flex-col justify-end" style={{ backgroundImage: `url(${proj.img})`, border: '7px solid #3F4C7F' }}>
          {/* Date badge */}
          <div className="absolute top-4 left-0 bg-[#F9D87A] text-[#223A5F] font-bold text-sm md:text-base rounded-r-lg px-4 py-2 shadow z-10">
            {proj.date}
          </div>
          {/* Overlay for text readability */}
          <div className="absolute left-0 right-0 bottom-0 h-2/3 bg-gradient-to-t from-[#223A5Fcc] to-transparent z-10" />
          {/* Card Content */}
          <div className="relative z-20 text-white px-4 pb-6 pt-2 flex flex-col justify-end">
            <div className="font-serif font-bold text-lg md:text-2xl mb-1">{proj.name}</div>
            <div className="font-medium text-sm md:text-base mb-1 opacity-90">{proj.group}</div>
            <div className="font-medium text-sm md:text-base opacity-90">{proj.details}</div>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default PossessionSection;
