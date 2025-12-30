# Property Page Module

This module contains all components and functionality related to the property listing page.

## 📁 Structure

```
property_page/
├── app/
│   └── page.jsx                 # Main PropertyListingPage component
├── components/
│   ├── layouts/                 # Layout components
│   │   ├── PropertyHeader.jsx
│   │   ├── PropertyFooter.jsx
│   │   └── ResultsNavBar.jsx
│   ├── sections/                # Page sections
│   │   ├── BuilderProfile.jsx
│   │   ├── PropertyHero.jsx
│   │   ├── MainContentSection.jsx
│   │   ├── ExistingFloorPlansSection.jsx
│   │   └── ReadMoreAboutProperty.jsx
│   └── ui/                      # Reusable UI components
│       ├── Badge.jsx
│       ├── Button.jsx
│       └── Card.jsx
├── pages/                       # Page components
│   ├── Index.jsx
│   └── NotFound.jsx
├── property_page_css/           # Styles
│   └── styles.css
├── property_page_js/            # JavaScript utilities
│   └── useStickyNav.js
├── index.js                     # Module exports
└── README.md                    # This file
```

## 🚀 Usage

### Import the main component:
```javascript
import { PropertyListingPage } from './property_page';
```

### Import individual components:
```javascript
import { 
  PropertyHeader, 
  PropertyHero, 
  MainContentSection 
} from './property_page';
```

### Import utilities:
```javascript
import { useStickyNav } from './property_page';
```

## 🎯 Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Interactive Elements**: Floor plan selection, sticky navigation
- **Modular Structure**: Easy to maintain and extend
- **Type Safety**: Proper prop validation and error handling

## 🔧 Development

All components are self-contained and can be developed independently. The main page component (`app/page.jsx`) orchestrates all sections.

## 📱 Routes

- `/properties` - Main property listing page
