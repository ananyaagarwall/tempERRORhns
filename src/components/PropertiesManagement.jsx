import React, { useState } from 'react';
// import Navbar from './Navbar'; // Adjust path as needed

const PropertiesManagement = () => {
  const [propertyForm, setPropertyForm] = useState({
    propertyTitle: '',
    propertyType: '',
    description: '',
    price: '',
    location: '',
    address: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    availabilityStatus: '',
    images: [], // Array to hold image files
    listingDate: '',
    contactNumber: '',
    email: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Basic validation function (will expand later)
  const validateField = (name, value) => {
    let error = '';
    // Add validation logic here for all fields based on user requirements
    switch (name) {
      case 'propertyTitle':
        if (!value) {
          error = 'Property Title is required';
        } else if (value.length < 5) {
          error = 'Must be at least 5 characters';
        } else if (value.length > 150) {
          error = 'Cannot exceed 150 characters';
        } else if (/[<>{}]+/.test(value)) {
          error = 'Cannot contain special characters like <, >, {, }';
        }
        break;
      case 'propertyType':
        if (!value) {
          error = 'Property Type is required';
        }
        // TODO: Add check against allowed values
        break;
      case 'description':
        if (!value) {
          error = 'Description is required';
        } else if (value.length < 50) {
          error = 'Must be at least 50 characters';
        }
        // TODO: Strip HTML/script tags
        break;
      case 'price':
        if (!value) {
          error = 'Price is required';
        } else if (isNaN(value) || parseFloat(value) < 0) {
          error = 'Must be a positive number';
        }
        // TODO: Cannot contain letters or symbols
        break;
      case 'location':
        if (!value) {
          error = 'Location is required';
        } else if (value.length > 200) {
          error = 'Cannot exceed 200 characters';
        }
        // TODO: Alphanumeric with commas/spaces validation
        break;
      case 'address':
        if (!value) {
          error = 'Address is required';
        } else if (value.length > 300) {
          error = 'Cannot exceed 300 characters';
        }
        break;
      case 'bedrooms':
        if (!value) {
          error = 'Bedrooms is required';
        } else if (isNaN(value) || parseInt(value, 10) < 0 || parseInt(value, 10) > 20) {
          error = 'Must be a number between 0 and 20';
        }
        break;
      case 'bathrooms':
        if (!value) {
          error = 'Bathrooms is required';
        } else if (isNaN(value) || parseInt(value, 10) < 0 || parseInt(value, 10) > 20) {
          error = 'Must be a number between 0 and 20';
        }
        break;
      case 'area':
        if (!value) {
          error = 'Area is required';
        } else if (isNaN(value) || parseFloat(value) < 0) {
          error = 'Must be a positive number';
        }
        break;
      case 'availabilityStatus':
        if (!value) {
          error = 'Availability Status is required';
        }
        // TODO: Add check against allowed values
        break;
      case 'listingDate':
        if (!value) {
          error = 'Listing Date is required';
        } else if (new Date(value) > new Date()) {
          error = 'Cannot be a future date';
        }
        break;
      case 'contactNumber':
        if (!value) {
          error = 'Contact Number is required';
        } else if (!/^\d{10}$/.test(value)) {
          error = 'Must be a 10-digit number';
        }
        break;
      case 'email':
        if (value && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(value)) {
          error = 'Invalid email format';
        }
        break;
      case 'images':
        // TODO: Implement image validation
        break;
      default:
        break;
    }
    setFormErrors(prevErrors => ({ ...prevErrors, [name]: error }));
    return error;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPropertyForm({
      ...propertyForm,
      [name]: value,
    });
    // Validate field on change
    validateField(name, value);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    // Basic image validation (can be enhanced)
    let imageError = '';
    if (files.length > 10) {
      imageError = 'Maximum 10 images allowed.';
    } else {
      for (const file of files) {
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
          imageError = 'Only JPG and PNG image formats are allowed.';
          break;
        }
        if (file.size > 2 * 1024 * 1024) { // 2MB
          imageError = `File ${file.name} exceeds the maximum size of 2MB.`;
          break;
        }
      }
    }

    setPropertyForm({
      ...propertyForm,
      images: files,
    });
    setFormErrors(prevErrors => ({ ...prevErrors, images: imageError }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate all fields before submitting
    let errors = {};
    Object.keys(propertyForm).forEach(fieldName => {
      // For images, validation is handled in handleFileChange, just check if there's an existing error
      if (fieldName === 'images') {
        if (formErrors.images) errors.images = formErrors.images;
      } else {
        const error = validateField(fieldName, propertyForm[fieldName]);
        if (error) errors[fieldName] = error;
      }
    });

    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      setIsSubmitting(true);
      // TODO: Implement actual submission logic (API call, etc.)
      console.log('Form Data:', propertyForm);
      alert('Property form submitted successfully!');
      setIsSubmitting(false);
    } else {
      console.log('Form has errors:', errors);
    }
  };

  // Refined inline styles
  const formGroupStyle = {
    marginBottom: '25px',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#555',
    fontSize: '15px',
  };

  const inputStyle = (isInvalid) => ({
    width: '100%',
    padding: '12px 15px',
    border: `1px solid ${isInvalid ? '#f44336' : '#ccc'}`,
    borderRadius: '4px',
    fontSize: '16px',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease-in-out',
    '&:focus': { // Adding focus style
      borderColor: isInvalid ? '#f44336' : '#185a9d',
      outline: 'none',
      boxShadow: isInvalid ? '0 0 0 0.2rem rgba(244, 67, 54, 0.25)' : '0 0 0 0.2rem rgba(24, 90, 157, 0.25)',
    },
  });

  const textareaStyle = (isInvalid) => ({
    ...inputStyle(isInvalid),
    minHeight: '120px',
    resize: 'vertical',
  });

  const fileInputStyle = {
    // Needs custom styling for a button-like appearance
  };

  const selectStyle = (isInvalid) => inputStyle(isInvalid);

  const buttonStyle = {
    padding: '12px 24px',
    borderRadius: '5px',
    border: 'none',
    fontWeight: '600',
    fontSize: '16px',
    cursor: 'pointer',
    marginRight: '15px',
    transition: 'background-color 0.2s ease-in-out, opacity 0.2s ease-in-out',
  };

  const saveButtonStyle = {
    ...buttonStyle,
    background: 'linear-gradient(45deg, #185a9d 0%, #43cea2 100%)',
    color: '#fff',
    boxShadow: '0 4px 10px rgba(24,90,157,0.2)',
    opacity: isSubmitting ? 0.7 : 1,
    pointerEvents: isSubmitting ? 'none' : 'auto',
  };

  const cancelButtonStyle = {
    ...buttonStyle,
    background: '#e0e0e0',
    color: '#555',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  };

  const errorTextStyle = {
    color: '#f44336',
    fontSize: '13px',
    marginTop: '5px',
  };

  const fileInputContainerStyle = {
    marginBottom: '25px',
    border: '1px dashed #ccc',
    padding: '20px',
    borderRadius: '4px',
    textAlign: 'center',
    cursor: 'pointer',
    background: '#f9f9f9',
    transition: 'border-color 0.2s ease-in-out, background 0.2s ease-in-out',
    '&:hover': {
      borderColor: '#185a9d',
      background: '#f0f8ff'
    },
  };

  const fileInputLabelStyle = {
    display: 'block',
    fontSize: '16px',
    fontWeight: '600',
    color: '#555',
    marginBottom: '10px'
  };

  const fileListStyle = {
    marginTop: '10px',
    fontSize: '14px',
    color: '#555',
    textAlign: 'left'
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f5f5f5', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      {/* Sidebar */}
      {/* <Navbar vertical sidebarLinksOverride={[
        { name: 'Dashboard', path: '/dashboard/admin' },
        { name: 'Leads', path: '/dashboard/leads' },
        { name: 'Properties', path: '/dashboard/properties' },
        { name: 'Add Builder', path: '/dashboard/add-builder' },
        { name: 'Blogs', path: '/dashboard/blogs' },
        { name: 'Categories', path: '/dashboard/categories' }
      ]} /> */}

      {/* Main Content */}
      <div style={{ flex: 1, padding: '32px 40px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#333', marginBottom: 30 }}>View Listings</div>
        <div style={{ textAlign: 'center', padding: '50px', color: '#888', fontSize: '18px' }}>
          No listings to display. Add new properties using the form.
        </div>
      </div>
    </div>
  );
};

export default PropertiesManagement; 