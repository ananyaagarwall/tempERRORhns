import React from "react";
import { Check } from "lucide-react";
import { Card, CardContent } from "../ui/Card";
import Button from "../ui/Button";

import floorPlan2BHK from "../../../assets/floor-plan-2bhk.jpg";
import floorPlan3BHK from "../../../assets/floor-plan-3bhk.jpg";
import floorPlan4BHK from "../../../assets/floor-plan-4bhk.jpg";

const ExistingFloorPlansSection = () => {
  const [activeBHK, setActiveBHK] = React.useState("3bhk");

  const floorPlanDetails = {
    "2bhk": {
      title: "2 BHK Floor Plan", builtUpArea: "950 sq. ft (88.3 m²)", ceilingHeight: "2.8 – 2.9 meters (approx. 9.2 ft)", mainDoorFacing: "North/North-East", modularKitchen: "With Sitting area"
    },
    "3bhk": {
      title: "3 BHK Floor Plan", builtUpArea: "1260 sq. ft (117.1 m²)", ceilingHeight: "2.9 – 3.0 meters (approx. 9.5 ft)", mainDoorFacing: "East/North-East", modularKitchen: "With Sitting area"
    },
    "4bhk": {
      title: "4 BHK Floor Plan", builtUpArea: "1580 sq. ft (146.8 m²)", ceilingHeight: "3.0 – 3.1 meters (approx. 9.8 ft)", mainDoorFacing: "South-East/South", modularKitchen: "With Sitting area"
    }
  };

  const getFloorPlanImage = (bhk) => ({
    "2bhk": floorPlan2BHK, "3bhk": floorPlan3BHK, "4bhk": floorPlan4BHK
  })[bhk] || floorPlan3BHK;

  return (
    <section id="floor-plans" className="w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-8 sm:py-12 lg:py-16 bg-white">
      <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="w-8 sm:w-12 h-0.5 bg-gray-400" />
        <h2 className="text-base sm:text-lg font-medium text-gray-900">Floor Plans</h2>
      </div>
      
      <div className="flex justify-center mb-8 sm:mb-12">
        <div className="flex bg-gray-100 rounded-full p-1 overflow-x-auto">
          {Object.keys(floorPlanDetails).map((bhk) => (
            <button key={bhk} onClick={() => setActiveBHK(bhk)} className={`px-4 sm:px-8 py-2 sm:py-3 text-sm sm:text-lg font-semibold rounded-full transition-all whitespace-nowrap ${activeBHK === bhk ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"}`}>
              {bhk.replace('bhk', ' BHK').toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      
      <Card className="max-w-7xl mx-auto shadow-lg border border-gray-200 rounded-xl">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-1">{floorPlanDetails[activeBHK].title}</h3>
                <div className="w-12 sm:w-16 h-1 bg-blue-600 mb-4 sm:mb-6" />
              </div>
              
              <div className="space-y-4 sm:space-y-6">
                <div className="space-y-1"><p className="text-sm sm:text-lg text-gray-600">Built-up Area</p><p className="text-sm sm:text-lg text-gray-900 font-medium">{floorPlanDetails[activeBHK].builtUpArea}</p></div>
                <div className="space-y-1"><p className="text-sm sm:text-lg text-gray-600">Ceiling Height</p><p className="text-sm sm:text-lg text-gray-900 font-medium">{floorPlanDetails[activeBHK].ceilingHeight}</p></div>
                <div className="space-y-1"><p className="text-sm sm:text-lg text-gray-600">Main Door Facing</p><p className="text-sm sm:text-lg text-gray-900 font-medium">{floorPlanDetails[activeBHK].mainDoorFacing}</p></div>
                <div className="space-y-1 flex items-center gap-2">
                  <div><p className="text-sm sm:text-lg text-gray-600">Modular Kitchen</p><p className="text-sm sm:text-lg text-gray-900 font-medium">{floorPlanDetails[activeBHK].modularKitchen}</p></div>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0"><Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" /></div>
                </div>
              </div>
              
              <p className="text-sm sm:text-lg text-gray-900 cursor-pointer hover:text-blue-600 font-medium">View Room-Wise Measurements &gt;</p>
              <Button className="w-full sm:w-auto bg-gradient-to-r from-yellow-400 to-yellow-500 text-blue-900 hover:from-yellow-500 hover:to-yellow-600 rounded-full font-semibold py-2 sm:py-3 px-4 sm:px-6 text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200">Add to MyList</Button>
            </div>
            
            <div className="relative bg-blue-900 rounded-lg overflow-hidden min-h-[300px] sm:min-h-[400px] lg:min-h-[500px]">
              <img src={getFloorPlanImage(activeBHK)} alt={`${activeBHK.toUpperCase()} Floor Plan 3D View`} className="w-full h-full object-cover" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 space-y-2 hidden md:block">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-900 rounded-l-lg overflow-hidden border-2 border-blue-900"><img src={floorPlan2BHK} alt="View 1" className="w-full h-full object-cover" /></div>
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