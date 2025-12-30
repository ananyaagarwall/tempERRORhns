// Property Page Module Exports
// This file makes the property_page module easily accessible

// Main Page Component
export { default as PropertyListingPage } from './app/page';

// Layout Components
export { default as PropertyHeader } from './components/layouts/PropertyHeader';
export { default as PropertyFooter } from './components/layouts/PropertyFooter';
export { default as ResultsNavBar } from './components/layouts/ResultsNavBar';

// Section Components
export { default as BuilderProfile } from './components/sections/BuilderProfile';
export { default as PropertyHero } from './components/sections/PropertyHero';
export { default as MainContentSection } from './components/sections/MainContentSection';
export { default as ExistingFloorPlansSection } from './components/sections/ExistingFloorPlansSection';
export { default as ReadMoreAboutProperty } from './components/sections/ReadMoreAboutProperty';

// UI Components
export { default as Badge } from './components/ui/Badge';
export { default as Button } from './components/ui/Button';
export { Card, CardContent } from './components/ui/Card';

// Pages
export { default as PropertyIndex } from './pages/Index';
export { default as NotFound } from './pages/NotFound';

// Utilities
export { useStickyNav } from './property_page_js/useStickyNav';

// Styles
import './property_page_css/styles.css';
