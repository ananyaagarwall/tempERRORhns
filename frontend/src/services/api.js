import { API_API_URL as API_URL } from "../config";

export const fetchBuilderProjectById = async (id) => {
    try {
        const response = await fetch(`${API_URL}/projects/${id}`);
        if (!response.ok) throw new Error('Failed to fetch builder project');
        return await response.json();
    } catch (error) {
        console.error('Error fetching builder project:', error);
        throw error;
    }
};
export const fetchBuilderByName = async (name) => {
    try {
        const response = await fetch(`${API_URL}/builders/name/${encodeURIComponent(name)}`);
        if (!response.ok) throw new Error('Failed to fetch builder');
        return await response.json();
    } catch (error) {
        console.error('Error fetching builder:', error);
        throw error;
    }
};

export const fetchBuilderById = async (builderId) => {
    try {
        const response = await fetch(`${API_URL}/builders/${builderId}`);
        if (!response.ok) throw new Error('Failed to fetch builder');
        return await response.json();
    } catch (error) {
        console.error('Error fetching builder by ID:', error);
        throw error;
    }
};

// Kept for backwards compatibility — prefer fetchBuilderById
export const fetchBuilderByReraId = fetchBuilderById;

export const fetchBuilderProjects = async (builderId, status = '') => {
    try {
        let url = `${API_URL}/builders/${builderId}/projects`;
        if (status) {
            url += `?status=${encodeURIComponent(status)}`;
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch builder projects');
        return await response.json();
    } catch (error) {
        console.error('Error fetching builder projects:', error);
        throw error;
    }
};

export const fetchBuilders = async (location = '') => {
    try {
        const params = new URLSearchParams();
        if (location) params.append('location', location);

        const response = await fetch(`${API_URL}/builders${location ? `?${params.toString()}` : ''}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch builders');
        return await response.json();
    } catch (error) {
        console.error('Error fetching builders:', error);
        throw error;
    }
};

export const fetchProperties = async (filters = {}) => {
    try {
        const params = new URLSearchParams();

        if (filters.location) params.append('location', filters.location);

        // priceRange (desktop slider) is in Lakhs → convert to Crores
        if (filters.priceRange && filters.priceRange > 0) {
            params.append('price', (filters.priceRange / 100).toFixed(2));
        }

        //  minBudget & maxBudget (mobile) in Lakhs → convert to Crores
        if (filters.minBudget !== null && filters.minBudget !== undefined) {
            params.append('min_price', (filters.minBudget / 100).toFixed(2));
        }
        if (filters.maxBudget !== null && filters.maxBudget !== undefined) {
            params.append('max_price', (filters.maxBudget / 100).toFixed(2));
        }

        if (filters.bhkTypes && Array.isArray(filters.bhkTypes)) {
            filters.bhkTypes.forEach(type => params.append('type', type));
        }

        // bhkSearch: raw BHK string from search bar suggestion (e.g. "2 BHK")
        if (filters.bhkSearch) params.append('bhk_search', filters.bhkSearch);

        if (filters.amenities && Array.isArray(filters.amenities)) {
            filters.amenities.forEach((amenity) => params.append('amenities', amenity));
        }

        if (filters.amenityCategories && Array.isArray(filters.amenityCategories)) {
            filters.amenityCategories.forEach((category) => params.append('amenity_category', category));
        }

        if (filters.propertyStatus && Array.isArray(filters.propertyStatus)) {
            filters.propertyStatus.forEach((status) => params.append('property_status', status));
        }

        if (filters.societyTypes && Array.isArray(filters.societyTypes)) {
            filters.societyTypes.forEach((type) => params.append('society_type', type));
        }

        const response = await fetch(`${API_URL}/properties/search?${params.toString()}`);

        if (!response.ok) throw new Error('Failed to fetch properties');

        return await response.json();
    } catch (error) {
        console.error('Error fetching properties:', error);
        throw error;
    }
};

export const fetchPropertyFilters = async (location = '') => {
    try {
        const params = new URLSearchParams();
        if (location) params.append('location', location);
        const response = await fetch(`${API_URL}/properties/filters${params.toString() ? `?${params.toString()}` : ''}`);
        if (!response.ok) throw new Error('Failed to fetch property filters');
        return await response.json();
    } catch (error) {
        console.error('Error fetching property filters:', error);
        throw error;
    }
};

export const fetchPropertyById = async (id) => {
    try {
        const response = await fetch(`${API_URL}/properties/${id}`);
        if (!response.ok) throw new Error('Failed to fetch property');
        return await response.json();
    } catch (error) {
        console.error('Error fetching property:', error);
        throw error;
    }
};

export const fetchNearestNodes = async (location) => {
    try {
        const safeLocation = String(location || "").trim();
        if (!safeLocation) {
            return { primaryLocation: "", foundInArray: false, nearestNodes: [] };
        }
        const response = await fetch(`${API_URL}/nearest-nodes/${encodeURIComponent(safeLocation)}`);
        if (!response.ok) throw new Error('Failed to fetch nearest nodes');
        return await response.json();
    } catch (error) {
        console.error('Error fetching nearest nodes:', error);
        throw error;
    }
};

export const fetchPropertiesByMultipleLocations = async (locations = []) => {
    try {
        const locationsArray = Array.isArray(locations) ? locations : [locations];
        const cleaned = locationsArray
            .map((loc) => String(loc || "").trim())
            .filter(Boolean);
        if (cleaned.length === 0) {
            return [];
        }

        const params = new URLSearchParams();
        params.append('locations', cleaned.join(','));

        const response = await fetch(`${API_URL}/properties/multiple-locations?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch properties by multiple locations');
        return await response.json();
    } catch (error) {
        console.error('Error fetching properties by multiple locations:', error);
        throw error;
    }
};

export const fetchPropertyPois = async (propertyId, options = {}) => {
    try {
        const params = new URLSearchParams();
        if (options.radius_m) {
            params.append('radius_m', String(options.radius_m));
        }
        if (options.types) {
            const typesValue = Array.isArray(options.types) ? options.types.join(',') : String(options.types);
            params.append('types', typesValue);
        }
        const query = params.toString();
        const response = await fetch(`${API_URL}/properties/${propertyId}/pois${query ? `?${query}` : ''}`);
        if (!response.ok) throw new Error('Failed to fetch nearby places');
        return await response.json();
    } catch (error) {
        console.error('Error fetching nearby places:', error);
        throw error;
    }
};

export const createProperty = async (propertyData) => {
    try {
        const response = await fetch(`${API_URL}/properties`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(propertyData),
        });
        if (!response.ok) throw new Error('Failed to create property');
        return await response.json();
    } catch (error) {
        console.error('Error creating property:', error);
        throw error;
    }
};

export const fetchBlogs = async () => {
    try {
        const response = await fetch(`${API_URL}/blogs`);
        if (!response.ok) throw new Error('Failed to fetch blogs');
        return await response.json();
    } catch (error) {
        console.error('Error fetching blogs:', error);
        throw error;
    }
};
