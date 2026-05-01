import React from "react";

const toTextList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[|,]/g)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [String(value)];
};

const ReadMoreAboutProperty = ({ propertyData, projectData }) => {
  // CHANGED: State is now an array to hold multiple open IDs
  const [expandedCards, setExpandedCards] = React.useState([]);
  const [hoveredCard, setHoveredCard] = React.useState(null);

  // Helper function to toggle a card's open/closed state
  const toggleCard = (id) => {
    setExpandedCards((prev) => 
      prev.includes(id) 
        ? prev.filter((cardId) => cardId !== id) // Close: Remove ID from array
        : [...prev, id] // Open: Add ID to array
    );
  };
  const propertyName = propertyData?.Property_Name || projectData?.title || "this property";
  const propertyLocation = propertyData?.Location || projectData?.location || "your location";

  const loanItems = React.useMemo(
    () => toTextList(propertyData?.Loan_Availability),
    [propertyData?.Loan_Availability]
  );
  const connectivityItems = React.useMemo(
    () => toTextList(propertyData?.Connectivity),
    [propertyData?.Connectivity]
  );
  const approvedItems = React.useMemo(
    () => toTextList(propertyData?.Approved_by_Authorities),
    [propertyData?.Approved_by_Authorities]
  );

  const propertySections = React.useMemo(
    () => [
      {
        id: "legal-financial",
        title: "Legal & Financial Trust",
        cards: [
          {
            id: "title-clearance",
            title: "Title Clearance & Due Diligence",
            subtitle: "Occupancy & Completion Certificate",
            location: propertyData?.RERA_ID ? `RERA ID: ${propertyData.RERA_ID}` : "RERA details on request",
            description: `Legal due diligence for ${propertyName} including ownership checks, approvals, and compliance.`,
            documentTitle: "Legal Documents",
            documentItems: [
              "Title Deed",
              "Occupancy Certificate",
              "Completion Certificate",
              ...(propertyData?.RERA_ID ? ["RERA Registration"] : []),
              ...(approvedItems.length ? ["Authority Approvals"] : []),
            ],
          },
          {
            id: "bank-loan",
            title: "Bank Loan Approval",
            subtitle: "Which banks and what amount",
            location: loanItems.length ? `Banks: ${loanItems.slice(0, 3).join(" | ")}` : "Loan availability on request",
            description: loanItems.length
              ? `Loan availability for ${propertyName}: ${loanItems.join(", ")}.`
              : `Loan options for ${propertyName} will be shared after verification.`,
            documentTitle: "Loan Documents",
            documentItems: [
              "Bank Approval Letter",
              "Interest Rate Details",
              "Eligibility Criteria",
              "Document Checklist",
            ],
          },
        ],
      },
      {
        id: "lifestyle",
        title: "Lifestyle & Liveability Insights",
        cards: [
          {
            id: "neighbourhood",
            title: "Neighbourhood",
            subtitle: "View your neighbourhood details",
            location: `Location: ${propertyLocation}`,
            description: connectivityItems.length
              ? `Connectivity around ${propertyLocation}: ${connectivityItems.slice(0, 4).join(" • ")}.`
              : `Neighbourhood insights for ${propertyLocation} will be available once location points of interest are mapped.`,
            documentTitle: "Neighborhood Guide",
            documentItems: ["Local Amenities", "Safety Ratings", "Community Profile", "Quality of Life Index"],
          },
          {
            id: "nearby-essentials",
            title: "Nearby Essentials",
            subtitle: "Hospitals, Schools...",
            location: connectivityItems.length ? "Based on connectivity data" : "Coming soon",
            description:
              "Nearby essentials can be auto-populated once we map hospitals, schools, shopping, and transit around the property location.",
            documentTitle: "Essential Services",
            documentItems: ["Healthcare Facilities", "Educational Institutions", "Shopping Centers", "Transportation"],
          },
        ],
      },
      {
        id: "accounts-finance",
        title: "Accounts and Finance",
        cards: [
          {
            id: "senior-advisor-1",
            title: "Senior Advisor",
            subtitle: "Full Time • Remote available",
            location: "Available for you",
            description: "Expert financial advisory services for property investment and management...",
            documentTitle: "Financial Advisory",
            documentItems: ["Investment Analysis", "Tax Planning", "Portfolio Strategy", "Risk Assessment"],
          },
          {
            id: "senior-advisor-2",
            title: "Senior Advisor",
            subtitle: "Full Time • Remote available",
            location: "Available for you",
            description: "Comprehensive financial planning and advisory services tailored to real estate investments...",
            documentTitle: "Financial Planning",
            documentItems: ["Financial Planning", "Investment Strategy", "Risk Management", "Tax Optimization"],
          },
        ],
      },
    ],
    [
      approvedItems.length,
      connectivityItems,
      loanItems,
      propertyData?.RERA_ID,
      propertyLocation,
      propertyName,
    ]
  );
  return (
    <div id="read-more" className="w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-8 sm:py-12 lg:py-16">
      <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="w-8 sm:w-12 h-0.5 bg-gray-400" />
        <h2 className="text-base sm:text-lg font-medium text-gray-900">View More Details</h2>
      </div>

      <div className="space-y-8 sm:space-y-10">
        {propertySections.map((section) => (
          <div key={section.id} className="space-y-6 sm:space-y-10">
            <div className="flex items-center gap-3 sm:gap-4 group">
              <div className="w-12 sm:w-16 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 group-hover:w-16 sm:group-hover:w-20" />
              <h3 className="text-lg sm:text-2xl font-bold text-gray-900 tracking-tight">{section.title}</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
              {section.cards.map((card) => {
                const uniqueCardId = `${section.id}-${card.id}`;
                // CHANGED: Check if the ID exists in the array
                const isExpanded = expandedCards.includes(uniqueCardId);
                const isHovered = hoveredCard === uniqueCardId;

                return (
                  <div
                    key={uniqueCardId}
                    className={`group relative bg-white rounded-2xl border transition-all duration-500 cursor-pointer overflow-hidden ${isHovered ? 'shadow-2xl border-blue-200 transform -translate-y-2 scale-[1.02]' : 'shadow-lg border-gray-100 hover:shadow-xl hover:border-gray-200'}`}
                    onMouseEnter={() => setHoveredCard(uniqueCardId)}
                    onMouseLeave={() => setHoveredCard(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      // CHANGED: Use the toggle function instead of simple set state
                      toggleCard(uniqueCardId);
                    }}
                  >
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 transform scale-x-0 transition-transform duration-500 origin-left ${isHovered ? 'scale-x-100' : ''}`} />

                    <div className="relative p-4 sm:p-6 lg:p-8">
                      <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                        <div className="flex items-start justify-between">
                          <h4 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight group-hover:text-blue-900 transition-colors duration-300">{card.title}</h4>

                          <div className={`flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all duration-300 ${isExpanded ? 'bg-blue-500 rotate-45' : isHovered ? 'bg-blue-100' : 'bg-gray-100'}`}>
                            <svg className={`w-2.5 h-2.5 sm:w-3 sm:h-3 transition-colors duration-300 ${isExpanded ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse" />
                          <p className="text-xs sm:text-sm text-gray-500 font-medium">{card.location}</p>
                        </div>
                      </div>

                      <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                        <div className="space-y-4 sm:space-y-6">
                          <p className="text-gray-700 leading-relaxed text-xs sm:text-sm">{card.description}</p>
                          <div className="bg-gradient-to-br from-gray-50 to-blue-50/50 rounded-xl p-4 sm:p-6 border border-gray-100">
                            <h5 className="font-bold text-gray-900 mb-3 sm:mb-4 text-xs sm:text-sm">{card.documentTitle}</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
                              {card.documentItems.map((item, index) => (
                                <div key={index} className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700 bg-white/70 rounded-lg p-2 sm:p-3 hover:bg-white transition-colors duration-200">
                                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex-shrink-0" /><span className="font-medium">{item}</span>
                                </div>
                              ))}
                            </div>
                            <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-xl font-semibold text-xs sm:text-sm hover:from-blue-700 hover:to-indigo-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl">
                              View Documents
                              <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div className="flex justify-center mt-8 sm:mt-12">
          <button className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
            Load More
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReadMoreAboutProperty;

