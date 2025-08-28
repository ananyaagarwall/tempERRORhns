import React from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PropertyListingApp from './property/PropertyListingApp';
import { Toaster } from './property/ui/toaster.jsx';
import { Toaster as Sonner } from './property/ui/sooner.jsx';
import { TooltipProvider } from './property/ui/tooltip.jsx';


const queryClient = new QueryClient();

const Property = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div>
          <PropertyListingApp />
          <Toaster />
          <Sonner />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default Property; 