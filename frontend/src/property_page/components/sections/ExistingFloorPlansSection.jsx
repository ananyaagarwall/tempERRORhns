import React from "react";
import { Check } from "lucide-react";
import { Card, CardContent } from "../ui/Card";
import Button from "../ui/Button";

import floorPlan2BHK from "../../../assets/floor-plan-2bhk.jpg";
import floorPlan3BHK from "../../../assets/floor-plan-3bhk.jpg";
import floorPlan4BHK from "../../../assets/floor-plan-4bhk.jpg";

const floorPlanDetails = {
  "2bhk": {
    "type-i": {
      title: "2 BHK – Type I",
      builtUpArea: "850 sq. ft (79.0 m²)",
      ceilingHeight: "2.7 – 2.8 meters (approx. 9.0 ft)",
      mainDoorFacing: "East",
      modularKitchen: "Compact Open Kitchen",
      img: floorPlan2BHK,
    },
    "type-ii": {
      title: "2 BHK – Type II",
      builtUpArea: "950 sq. ft (88.3 m²)",
      ceilingHeight: "2.8 – 2.9 meters (approx. 9.2 ft)",
      mainDoorFacing: "North / North-East",
      modularKitchen: "With Sitting Area",
      img: floorPlan2BHK,
    },
    "type-iii": {
      title: "2 BHK – Type III",
      builtUpArea: "1,050 sq. ft (97.5 m²)",
      ceilingHeight: "2.9 meters (approx. 9.5 ft)",
      mainDoorFacing: "West",
      modularKitchen: "Extended Kitchen with Utility",
      img: floorPlan2BHK,
    },
  },
  "3bhk": {
    "type-i": {
      title: "3 BHK – Type I",
      builtUpArea: "1,200 sq. ft (111.5 m²)",
      ceilingHeight: "2.9 – 3.0 meters (approx. 9.5 ft)",
      mainDoorFacing: "East / North-East",
      modularKitchen: "With Sitting Area",
      img: floorPlan3BHK,
    },
    "type-ii": {
      title: "3 BHK – Type II",
      builtUpArea: "1,350 sq. ft (125.4 m²)",
      ceilingHeight: "3.0 meters (approx. 9.8 ft)",
      mainDoorFacing: "South / South-East",
      modularKitchen: "Large Island Kitchen",
      img: floorPlan3BHK,
    },
    "type-iii": {
      title: "3 BHK – Type III (Corner)",
      builtUpArea: "1,450 sq. ft (134.7 m²)",
      ceilingHeight: "3.0 – 3.1 meters (approx. 10.0 ft)",
      mainDoorFacing: "North-West (Corner Unit)",
      modularKitchen: "Extended with Breakfast Counter",
      img: floorPlan3BHK,
    },
  },
  "4bhk": {
    "type-i": {
      title: "4 BHK – Type I",
      builtUpArea: "1,580 sq. ft (146.8 m²)",
      ceilingHeight: "3.0 – 3.1 meters (approx. 9.8 ft)",
      mainDoorFacing: "South-East / South",
      modularKitchen: "With Sitting Area",
      img: floorPlan4BHK,
    },
    "type-ii": {
      title: "4 BHK – Type II (Premium)",
      builtUpArea: "1,780 sq. ft (165.4 m²)",
      ceilingHeight: "3.1 – 3.2 meters (approx. 10.2 ft)",
      mainDoorFacing: "East / North-East",
      modularKitchen: "Chef's Kitchen with Island",
      img: floorPlan4BHK,
    },
    "type-iii": {
      title: "4 BHK – Type III (Penthouse)",
      builtUpArea: "2,100 sq. ft (195.1 m²)",
      ceilingHeight: "3.3 – 3.5 meters (approx. 11.0 ft)",
      mainDoorFacing: "All-Round View (Top Floor)",
      modularKitchen: "Open Plan Kitchen with Bar",
      img: floorPlan4BHK,
    },
  },
};

const BHK_LABELS = { "2bhk": "2 BHK", "3bhk": "3 BHK", "4bhk": "4 BHK" };
const TYPE_LABELS = { "type-i": "Type I", "type-ii": "Type II", "type-iii": "Type III" };

const ExistingFloorPlansSection = () => {
  const [activeBHK, setActiveBHK] = React.useState("3bhk");
  const [activeType, setActiveType] = React.useState("type-i");

  const handleBHKChange = (bhk) => {
    setActiveBHK(bhk);
    setActiveType("type-i");
  };

  const plan = floorPlanDetails[activeBHK][activeType];

  return (
    <section id="floor-plans" className="w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-8 sm:py-12 lg:py-16 bg-white">
      <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="w-8 sm:w-12 h-0.5 bg-gray-400" />
        <h2 className="text-base sm:text-lg font-medium text-gray-900">Floor Plans</h2>
      </div>

      {/* BHK selector */}
      <div className="flex justify-center mb-4">
        <div className="flex bg-gray-100 rounded-full p-1 overflow-x-auto">
          {Object.keys(floorPlanDetails).map((bhk) => (
            <button
              key={bhk}
              onClick={() => handleBHKChange(bhk)}
              className={`px-4 sm:px-8 py-2 sm:py-3 text-sm sm:text-lg font-semibold rounded-full transition-all whitespace-nowrap ${
                activeBHK === bhk ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
              }`}
            >
              {BHK_LABELS[bhk]}
            </button>
          ))}
        </div>
      </div>

      {/* Type sub-selector */}
      <div className="flex justify-center mb-8 sm:mb-12">
        <div className="flex gap-2">
          {Object.keys(floorPlanDetails[activeBHK]).map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`px-4 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-full border transition-all whitespace-nowrap ${
                activeType === type
                  ? "bg-blue-900 text-white border-blue-900 shadow-sm"
                  : "bg-white text-gray-600 border-gray-300 hover:border-blue-300 hover:text-blue-700"
              }`}
            >
              {TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      <Card className="max-w-7xl mx-auto shadow-lg border border-gray-200 rounded-xl">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-1">{plan.title}</h3>
                <div className="w-12 sm:w-16 h-1 bg-blue-600 mb-4 sm:mb-6" />
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div className="space-y-1">
                  <p className="text-sm sm:text-lg text-gray-600">Built-up Area</p>
                  <p className="text-sm sm:text-lg text-gray-900 font-medium">{plan.builtUpArea}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm sm:text-lg text-gray-600">Ceiling Height</p>
                  <p className="text-sm sm:text-lg text-gray-900 font-medium">{plan.ceilingHeight}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm sm:text-lg text-gray-600">Main Door Facing</p>
                  <p className="text-sm sm:text-lg text-gray-900 font-medium">{plan.mainDoorFacing}</p>
                </div>
                <div className="space-y-1 flex items-center gap-2">
                  <div>
                    <p className="text-sm sm:text-lg text-gray-600">Modular Kitchen</p>
                    <p className="text-sm sm:text-lg text-gray-900 font-medium">{plan.modularKitchen}</p>
                  </div>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                </div>
              </div>

              <p className="text-sm sm:text-lg text-gray-900 cursor-pointer hover:text-blue-600 font-medium">
                View Room-Wise Measurements &gt;
              </p>
              <Button className="w-full sm:w-auto bg-gradient-to-r from-yellow-400 to-yellow-500 text-blue-900 hover:from-yellow-500 hover:to-yellow-600 rounded-full font-semibold py-2 sm:py-3 px-4 sm:px-6 text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200">
                Add to MyList
              </Button>
            </div>

            <div className="relative bg-blue-900 rounded-lg overflow-hidden min-h-[300px] sm:min-h-[400px] lg:min-h-[500px]">
              <img
                src={plan.img}
                alt={`${plan.title} Floor Plan`}
                className="w-full h-full object-cover"
              />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 space-y-2 hidden md:block">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-900 rounded-l-lg overflow-hidden border-2 border-blue-900">
                  <img src={floorPlan2BHK} alt="View 1" className="w-full h-full object-cover" />
                </div>
                <div className="w-3 h-12 sm:w-4 sm:h-16 bg-blue-900 rounded-l-lg" />
                <div className="w-3 h-12 sm:w-4 sm:h-16 bg-blue-900 rounded-l-lg" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default ExistingFloorPlansSection;
