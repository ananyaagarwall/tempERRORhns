const API_URL = 'http://localhost:5000/api';

export const fetchProperties = async () => {
    try {
        const response = await fetch(`${API_URL}/properties`);
        if (!response.ok) throw new Error('Failed to fetch properties');
        return await response.json();
    } catch (error) {
        console.error('Error fetching properties:', error);
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