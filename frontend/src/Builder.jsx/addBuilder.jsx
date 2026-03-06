import API_BASE_URL from '../config';
import React, { useState, useRef } from 'react';
// import Sidebar from './Sidebar'; // Removed Sidebar import
import Tabs from './Tabs';

const validateEmail = (email) => {
  // Enhanced email regex
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
};

const validateYear = (year) => {
  return /^\d{4}$/.test(year) && Number(year) >= 1800 && Number(year) <= new Date().getFullYear();
};

const validatePhone = (phone) => {
  return /^\d{10}$/.test(phone);
};

const validatePinCode = (pinCode) => {
  return /^\d{6}$/.test(pinCode);
};

const validateWebsiteUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const validateReraId = (reraId) => {
  // Basic RERA ID format validation (can be enhanced based on specific state formats)
  return /^[A-Z]{2}\/[A-Z]{2}\/\d{4}\/\d{6}$/.test(reraId);
};

const validateFileSize = (file, maxSizeMB = 5) => {
  return file.size <= maxSizeMB * 1024 * 1024;
};

const validateFileType = (file, allowedTypes) => {
  return allowedTypes.includes(file.type);
};

const validateDashboardName = (name) => {
  return name.trim().length >= 3;
};

const AddBuilder = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [builders, setBuilders] = useState([]);
  const [form, setForm] = useState({
    companyName: '',
    brandName: '',
    establishedYear: '',
    builderType: '',
    reraRegistered: false,
    reraId: '',
    corporateAddress: '',
    city: '',
    state: '',
    pinCode: '',
    contactEmail: '',
    contactNumber: '',
    websiteUrl: '',
    builderLogo: null,
    coverBanner: null,
    certificates: [],
    location: '',
    shortDescription: '',
    detailedDescription: '',
    completedProjects: '',
    ongoingProjects: '',
    awards: [],
  });
  const [editIndex, setEditIndex] = useState(null);
  const [errors, setErrors] = useState({});
  const [originalForm, setOriginalForm] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const formRef = useRef(null);
  const [awardInput, setAwardInput] = useState('');

  const steps = [
    { id: 1, title: 'Basic Information' },
    { id: 2, title: 'About & Highlights' },
    { id: 3, title: 'Media & Documents' },
    { id: 4, title: 'Review & Submit' }
  ];

  const getFieldError = (name, value) => {
    switch (name) {
      case 'companyName':
        return value.trim().length < 3 ? 'Company name must be at least 3 characters long.' : '';
      case 'brandName':
        return value.trim().length > 0 && value.trim().length < 3 ? 'Brand name must be at least 3 characters long if provided.' : '';
      case 'establishedYear':
        return validateYear(value) ? '' : 'Please enter a valid year between 1800 and current year.';
      case 'builderType':
        return value ? '' : 'Please select a builder type.';
      case 'reraId':
        return form.reraRegistered && !validateReraId(value) ? 'Please enter a valid RERA ID (e.g., MH/RE/1234/567890).' : '';
      case 'corporateAddress':
        return value.trim().length < 10 ? 'Please enter a complete corporate address (minimum 10 characters).' : '';
      case 'city':
        return value.trim().length < 2 ? 'Please enter a valid city name.' : '';
      case 'state':
        return value.trim().length < 2 ? 'Please enter a valid state name.' : '';
      case 'pinCode':
        return validatePinCode(value) ? '' : 'Please enter a valid 6-digit PIN code.';
      case 'contactEmail':
        return validateEmail(value) ? '' : 'Please enter a valid email address.';
      case 'contactNumber':
        return validatePhone(value) ? '' : 'Please enter a valid 10-digit phone number.';
      case 'websiteUrl':
        return validateWebsiteUrl(value) ? '' : 'Please enter a valid website URL.';
      case 'builderLogo':
        if (!value) return '';
        if (!validateFileType(value, ['image/jpeg', 'image/png', 'image/jpg'])) {
          return 'Logo must be a JPG or PNG file.';
        }
        if (!validateFileSize(value, 2)) {
          return 'Logo size must be less than 2MB.';
        }
        return '';
      case 'coverBanner':
        if (!value) return '';
        if (!validateFileType(value, ['image/jpeg', 'image/png', 'image/jpg'])) {
          return 'Banner must be a JPG or PNG file.';
        }
        if (!validateFileSize(value, 5)) {
          return 'Banner size must be less than 5MB.';
        }
        return '';
      case 'certificates':
        if (value.length === 0) return 'At least one certificate is required.';
        for (const file of value) {
          if (!validateFileType(file, ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'])) {
            return 'Certificates must be PDF or image files (JPG/PNG).';
          }
          if (!validateFileSize(file, 5)) {
            return 'Each certificate must be less than 5MB.';
          }
        }
        return '';
      case 'location':
        return value.trim().length < 3 ? 'Please enter a valid location.' : '';
      case 'dashboardName':
        return validateDashboardName(value) ? '' : 'Dashboard name must be at least 3 letters.';
      case 'reraRegistered':
        return value ? '' : 'Please select if RERA registered.';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setForm(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name === 'certificates') {
      const fileArr = Array.from(e.target.files || []);
      setForm(prev => ({ ...prev, certificates: fileArr }));
      setErrors(prev => ({ ...prev, certificates: getFieldError('certificates', fileArr) }));
    } else if (name === 'builderLogo' || name === 'coverBanner') {
      const file = e.target.files?.[0] || null;
      setForm(prev => ({ ...prev, [name]: file }));
      setErrors(prev => ({ ...prev, [name]: getFieldError(name, file) }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
      setErrors(prev => ({ ...prev, [name]: getFieldError(name, value) }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch(step) {
      case 1:
        // Basic Information validation
        if (!form.companyName.trim()) newErrors.companyName = 'Company name is required';
        if (!form.establishedYear) newErrors.establishedYear = 'Established year is required';
        if (!form.builderType) newErrors.builderType = 'Builder type is required';
        if (form.reraRegistered && !form.reraId) newErrors.reraId = 'RERA ID is required';
        if (!form.corporateAddress.trim()) newErrors.corporateAddress = 'Corporate address is required';
        if (!form.city.trim()) newErrors.city = 'City is required';
        if (!form.state.trim()) newErrors.state = 'State is required';
        if (!form.pinCode) newErrors.pinCode = 'PIN code is required';
        if (!form.contactEmail) newErrors.contactEmail = 'Contact email is required';
        if (!form.contactNumber) newErrors.contactNumber = 'Contact number is required';
        if (!form.websiteUrl) newErrors.websiteUrl = 'Website URL is required';
        break;
      
      case 2:
        // About & Highlights validation
        if (!form.shortDescription.trim()) newErrors.shortDescription = 'Short description is required';
        if (!form.detailedDescription.trim()) newErrors.detailedDescription = 'Detailed description is required';
        if (!form.completedProjects) newErrors.completedProjects = 'Number of completed projects is required';
        if (!form.ongoingProjects) newErrors.ongoingProjects = 'Number of ongoing projects is required';
        break;
      
      case 3:
        // Media & Documents validation
        if (!form.builderLogo) newErrors.builderLogo = 'Builder logo is required';
        if (!form.coverBanner) newErrors.coverBanner = 'Cover banner is required';
        if (form.certificates.length === 0) newErrors.certificates = 'At least one certificate is required';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 3) {
        handleSubmit();
      } else {
        setCurrentStep(prev => prev + 1);
      }
    } else {
      scrollToFirstError();
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    try {
      const formData = new FormData();
      
      // Add user_id (you might need to get this from your auth context or state)
      formData.append('user_id', 1); // Temporary hardcoded user_id for testing
      
      // Append all form fields
      Object.keys(form).forEach(key => {
        if (key === 'awards') {
          formData.append(key, JSON.stringify(form[key]));
      } else if (key === 'builderLogo' || key === 'coverBanner') {
        if (form[key]) {
            formData.append(key, form[key]);
        }
        } else if (key === 'certificates') {
          form.certificates.forEach((cert, index) => {
            formData.append(`certificates`, cert);
          });
      } else {
          formData.append(key, form[key]);
      }
    });

      console.log('Submitting form data:', Object.fromEntries(formData));

      const response = await fetch(`${API_BASE_URL}/api/builders`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create builder profile');
      }

      const data = await response.json();
      console.log('Success response:', data);
      
      setSuccessMsg('Builder profile created successfully!');
      setErrorMsg('');
      
      // Reset form after successful submission
    setForm({
      companyName: '',
      brandName: '',
      establishedYear: '',
      builderType: '',
      reraRegistered: false,
      reraId: '',
      corporateAddress: '',
      city: '',
      state: '',
      pinCode: '',
      contactEmail: '',
      contactNumber: '',
      websiteUrl: '',
      builderLogo: null,
      coverBanner: null,
      certificates: [],
      location: '',
        shortDescription: '',
        detailedDescription: '',
        completedProjects: '',
        ongoingProjects: '',
        awards: [],
      });
      setCurrentStep(1);
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrorMsg(error.message || 'Failed to create builder profile');
      setSuccessMsg('');
    }
  };

  const handleEdit = (idx) => {
    const builderToEdit = builders[idx];
    // Create a deep copy of the builder data
    const formData = {
      ...builderToEdit,
      builderLogo: builderToEdit.builderLogo ? new File([builderToEdit.builderLogo], builderToEdit.builderLogo.name) : null,
      coverBanner: builderToEdit.coverBanner ? new File([builderToEdit.coverBanner], builderToEdit.coverBanner.name) : null,
      certificates: builderToEdit.certificates.map(cert => 
        new File([cert], cert.name)
      )
    };
    setForm(formData);
    setOriginalForm(formData); // Store original data
    setEditIndex(idx);
    setErrors({});
  };

  const handleCancelEdit = () => {
    setForm({
      companyName: '',
      brandName: '',
      establishedYear: '',
      builderType: '',
      reraRegistered: false,
      reraId: '',
      corporateAddress: '',
      city: '',
      state: '',
      pinCode: '',
      contactEmail: '',
      contactNumber: '',
      websiteUrl: '',
      builderLogo: null,
      coverBanner: null,
      certificates: [],
      location: '',
      shortDescription: '',
      detailedDescription: '',
      completedProjects: '',
      ongoingProjects: '',
      awards: [],
    });
    setEditIndex(null);
    setOriginalForm(null);
    setErrors({});
  };

  const scrollToFirstError = () => {
    const firstErrorKey = Object.keys(errors)[0];
    if (firstErrorKey) {
      const el = document.querySelector(`[name="${firstErrorKey}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleDelete = (idx) => {
    setBuilders(builders.filter((_, i) => i !== idx));
    if (editIndex === idx) {
      setForm({
        companyName: '',
        brandName: '',
        establishedYear: '',
        builderType: '',
        reraRegistered: false,
        reraId: '',
        corporateAddress: '',
        city: '',
        state: '',
        pinCode: '',
        contactEmail: '',
        contactNumber: '',
        websiteUrl: '',
        builderLogo: null,
        coverBanner: null,
        certificates: [],
        location: '',
        shortDescription: '',
        detailedDescription: '',
        completedProjects: '',
        ongoingProjects: '',
        awards: [],
      });
      setEditIndex(null);
    }
    setSuccessMsg('Builder deleted successfully!');
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  // Enhanced isFormInvalid logic
  const requiredFields = [
    'companyName', 'establishedYear', 'builderType', 'corporateAddress',
    'city', 'state', 'pinCode', 'contactEmail', 'contactNumber', 'websiteUrl', 'location'
  ];
  if (form.reraRegistered) requiredFields.push('reraId');

  const isFormInvalid =
    Object.values(errors).some((err) => err) ||
    requiredFields.some((field) => !form[field]) ||
    form.certificates.length === 0;

  // Updated styles for a more elegant look
  const styles = {
    container: {
    minHeight: '100vh',
    display: 'flex',
      background: '#f8fafc',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    },
    mainContent: {
    flex: 1,
      padding: '40px',
    },
    formContainer: {
      maxWidth: '800px',
      margin: '0 auto',
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
      padding: '32px',
    },
    navContainer: {
    display: 'flex',
      gap: '12px',
      marginBottom: '32px',
      borderBottom: '1px solid #e2e8f0',
      paddingBottom: '12px',
    },
    navButton: {
      padding: '8px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
      border: 'none',
      background: 'transparent',
      color: '#64748b',
      '&:hover': {
        background: '#f1f5f9',
      },
    },
    activeNavButton: {
      background: '#f1f5f9',
      color: '#1e293b',
    },
    formTitle: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '32px',
    textAlign: 'center',
    },
    section: {
      marginBottom: '32px',
      padding: '24px',
      background: '#f8fafc',
      borderRadius: '12px',
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
      gap: '8px',
    },
    formGroup: {
      marginBottom: '20px',
    },
    label: {
    display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      color: '#475569',
      marginBottom: '8px',
    },
    input: {
    width: '100%',
      padding: '10px 12px',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      fontSize: '14px',
      color: '#1e293b',
      transition: 'all 0.2s',
      '&:focus': {
        borderColor: '#3b82f6',
        boxShadow: '0 0 0 3px rgba(59,130,246,0.1)',
    outline: 'none',
      },
    },
    textarea: {
    width: '100%',
      padding: '10px 12px',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      fontSize: '14px',
      color: '#1e293b',
      minHeight: '100px',
      resize: 'vertical',
      transition: 'all 0.2s',
      '&:focus': {
        borderColor: '#3b82f6',
        boxShadow: '0 0 0 3px rgba(59,130,246,0.1)',
        outline: 'none',
      },
    },
    select: {
      width: '100%',
      padding: '10px 12px',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      fontSize: '14px',
      color: '#1e293b',
      background: 'white',
      transition: 'all 0.2s',
      '&:focus': {
        borderColor: '#3b82f6',
        boxShadow: '0 0 0 3px rgba(59,130,246,0.1)',
        outline: 'none',
      },
    },
    checkbox: {
    display: 'flex',
    alignItems: 'center',
      gap: '8px',
      marginBottom: '16px',
    },
    checkboxInput: {
      width: '16px',
      height: '16px',
      borderRadius: '4px',
      border: '1px solid #e2e8f0',
    },
    fileUpload: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    fileUploadButton: {
      padding: '8px 16px',
      background: '#f1f5f9',
      border: '1px dashed #cbd5e1',
      borderRadius: '8px',
      color: '#475569',
      fontSize: '14px',
    cursor: 'pointer',
      transition: 'all 0.2s',
      '&:hover': {
        background: '#e2e8f0',
      },
    },
    previewImage: {
      maxWidth: '200px',
      maxHeight: '120px',
      borderRadius: '8px',
      objectFit: 'cover',
    },
    button: {
      padding: '12px 24px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
    cursor: 'pointer',
      transition: 'all 0.2s',
    border: 'none',
    },
    primaryButton: {
      background: '#3b82f6',
      color: 'white',
      '&:hover': {
        background: '#2563eb',
      },
    },
    secondaryButton: {
      background: '#f1f5f9',
      color: '#475569',
      '&:hover': {
        background: '#e2e8f0',
      },
    },
    errorMessage: {
      color: '#ef4444',
      fontSize: '12px',
      marginTop: '4px',
    },
    successMessage: {
      color: '#22c55e',
      fontSize: '14px',
      marginBottom: '16px',
      padding: '12px',
      background: '#f0fdf4',
      borderRadius: '8px',
      border: '1px solid #dcfce7',
    },
    submitButton: {
      padding: '12px 24px',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
    cursor: 'pointer',
      transition: 'all 0.2s',
      border: 'none',
      background: '#3b82f6',
      color: 'white',
      width: '100%',
      marginTop: '32px',
      '&:hover': {
        background: '#2563eb',
      },
      '&:disabled': {
        background: '#93c5fd',
        cursor: 'not-allowed',
      },
    },
    progressBar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '40px',
      padding: '0 20px',
    },
    progressStep: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
      flex: 1,
    },
    progressCircle: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: '#e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#64748b',
      fontWeight: '600',
      marginBottom: '8px',
    },
    progressCircleActive: {
      backgroundColor: '#3b82f6',
      color: 'white',
    },
    progressTitle: {
      fontSize: '14px',
      color: '#64748b',
      textAlign: 'center',
    },
    progressLine: {
      position: 'absolute',
      top: '20px',
      right: '-50%',
      width: '100%',
      height: '2px',
      backgroundColor: '#e2e8f0',
      zIndex: -1,
    },
    progressLineActive: {
      backgroundColor: '#3b82f6',
    },
    stepContent: {
      marginTop: '32px',
    },
    navigationButtons: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '32px',
      gap: '16px',
    },
  };

  // Add helper functions for file previews and icons
  const getFileIcon = (file) => {
    if (!file) return null;
    if (file.type === 'application/pdf') return '📄';
    if (file.type.startsWith('image/')) return '🖼️';
    return '📁';
  };

  const getImagePreview = (file) => file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null;

  const handleAboutChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddAward = () => {
    if (awardInput.trim()) {
      setForm(prev => ({
        ...prev,
        awards: [...prev.awards, awardInput.trim()]
      }));
        setAwardInput('');
    }
  };

  const handleRemoveAward = (index) => {
    setForm(prev => ({
      ...prev,
      awards: prev.awards.filter((_, i) => i !== index)
    }));
  };

  // Glassmorphism card animation keyframes
  const fadeInUp = {
    animation: 'fadeInUp 0.8s cubic-bezier(.23,1.01,.32,1)'
  };
  // Add keyframes to the page
  if (typeof window !== 'undefined' && !document.getElementById('fadeInUpKeyframes')) {
    const style = document.createElement('style');
    style.id = 'fadeInUpKeyframes';
    style.innerHTML = `
      @keyframes fadeInUp {
        0% { opacity: 0; transform: translateY(40px); }
        100% { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }

  return (
    <div style={styles.container}>
      <div style={styles.mainContent}>
        <div style={styles.formContainer}>
          {/* Progress Bar */}
          <div style={styles.progressBar}>
            {steps.map((step, index) => (
              <div key={step.id} style={styles.progressStep}>
                <div
              style={{
                    ...styles.progressCircle,
                    ...(currentStep >= step.id ? styles.progressCircleActive : {}),
              }}
            >
                  {step.id}
                </div>
                <div style={styles.progressTitle}>{step.title}</div>
                {index < steps.length - 1 && (
                  <div
              style={{
                      ...styles.progressLine,
                      ...(currentStep > step.id ? styles.progressLineActive : {}),
              }}
                  />
                )}
              </div>
            ))}
          </div>

          {successMsg && <div style={styles.successMessage}>{successMsg}</div>}
          {errorMsg && <div style={styles.errorMessage}>{errorMsg}</div>}

          {/* Step Content */}
          <div style={styles.stepContent}>
            {currentStep === 1 && (
            <div>
              <h3 style={styles.sectionTitle}>Basic Information</h3>
              <div style={styles.section}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Company Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    name="companyName"
                    value={form.companyName}
                    onChange={handleChange}
                    style={styles.input}
                    required
                    placeholder="Enter company name"
                  />
                  {errors.companyName && <div style={styles.errorMessage}>{errors.companyName}</div>}
              </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Brand Name</label>
                  <input
                    type="text"
                    name="brandName"
                    value={form.brandName}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="Enter brand name (optional)"
                  />
                  {errors.brandName && <div style={styles.errorMessage}>{errors.brandName}</div>}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Established Year <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="number"
                    name="establishedYear"
                    value={form.establishedYear}
                    onChange={handleChange}
                    style={styles.input}
                    required
                    placeholder="Enter year of establishment"
                  />
                  {errors.establishedYear && <div style={styles.errorMessage}>{errors.establishedYear}</div>}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Builder Type <span style={{ color: '#ef4444' }}>*</span></label>
                  <select
                    name="builderType"
                    value={form.builderType}
                    onChange={handleChange}
                    style={styles.select}
                    required
                  >
                    <option value="">Select builder type</option>
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Mixed">Mixed</option>
                </select>
                  {errors.builderType && <div style={styles.errorMessage}>{errors.builderType}</div>}
                </div>

                <div style={styles.checkbox}>
                  <input
                    type="checkbox"
                    name="reraRegistered"
                    checked={form.reraRegistered}
                    onChange={handleChange}
                    style={styles.checkboxInput}
                  />
                  <label style={styles.label}>RERA Registered</label>
                </div>

                {form.reraRegistered && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>RERA ID <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      type="text"
                      name="reraId"
                      value={form.reraId}
                      onChange={handleChange}
                      style={styles.input}
                      required
                      placeholder="Enter RERA ID"
                    />
                    {errors.reraId && <div style={styles.errorMessage}>{errors.reraId}</div>}
                  </div>
                )}
              </div>

              <h3 style={styles.sectionTitle}>Contact Information</h3>
              <div style={styles.section}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Corporate Address <span style={{ color: '#ef4444' }}>*</span></label>
                  <textarea
                    name="corporateAddress"
                    value={form.corporateAddress}
                    onChange={handleChange}
                    style={styles.textarea}
                    required
                    placeholder="Enter corporate address"
                  />
                  {errors.corporateAddress && <div style={styles.errorMessage}>{errors.corporateAddress}</div>}
              </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>City <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    style={styles.input}
                    required
                    placeholder="Enter city"
                  />
                  {errors.city && <div style={styles.errorMessage}>{errors.city}</div>}
                  </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>State <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    style={styles.input}
                    required
                    placeholder="Enter state"
                  />
                  {errors.state && <div style={styles.errorMessage}>{errors.state}</div>}
                  </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>PIN Code <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    name="pinCode"
                    value={form.pinCode}
                    onChange={handleChange}
                    style={styles.input}
                    required
                    placeholder="Enter PIN code"
                  />
                  {errors.pinCode && <div style={styles.errorMessage}>{errors.pinCode}</div>}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Contact Email <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={form.contactEmail}
                    onChange={handleChange}
                    style={styles.input}
                    required
                    placeholder="Enter contact email"
                  />
                  {errors.contactEmail && <div style={styles.errorMessage}>{errors.contactEmail}</div>}
              </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Contact Number <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={form.contactNumber}
                    onChange={handleChange}
                    style={styles.input}
                    required
                    placeholder="Enter contact number"
                  />
                  {errors.contactNumber && <div style={styles.errorMessage}>{errors.contactNumber}</div>}
                  </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Website URL <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="url"
                    name="websiteUrl"
                    value={form.websiteUrl}
                    onChange={handleChange}
                    style={styles.input}
                    required
                    placeholder="Enter website URL"
                  />
                  {errors.websiteUrl && <div style={styles.errorMessage}>{errors.websiteUrl}</div>}
                </div>
              </div>
                  </div>
            )}

            {currentStep === 2 && (
            <div>
              <h3 style={styles.sectionTitle}>About & Highlights</h3>
              <div style={styles.section}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Short Description <span style={{ color: '#ef4444' }}>*</span></label>
              <textarea
                name="shortDescription"
                      value={form.shortDescription}
                onChange={handleAboutChange}
                maxLength={250}
                    style={styles.textarea}
                required
                    placeholder="Brief summary (max 250 characters)"
                  />
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      {form.shortDescription.length}/250
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Detailed Description <span style={{ color: '#ef4444' }}>*</span></label>
              <textarea
                name="detailedDescription"
                      value={form.detailedDescription}
                onChange={handleAboutChange}
                maxLength={2000}
                    style={styles.textarea}
                required
                    placeholder="Describe your company, achievements, and highlights... (max 2000 characters)"
                  />
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      {form.detailedDescription.length}/2000
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Completed Projects <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="number"
                    name="completedProjects"
                      value={form.completedProjects}
                    onChange={handleAboutChange}
                    style={styles.input}
                    required
                    placeholder="Enter number of completed projects"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Ongoing Projects <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="number"
                    name="ongoingProjects"
                      value={form.ongoingProjects}
                    onChange={handleAboutChange}
                    style={styles.input}
                    required
                    placeholder="Enter number of ongoing projects"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Awards & Recognition</label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  value={awardInput}
                      onChange={(e) => setAwardInput(e.target.value)}
                      style={styles.input}
                      placeholder="Enter award or recognition"
                    />
                    <button
                      type="button"
                      onClick={handleAddAward}
                      style={styles.secondaryButton}
                    >
                      Add
                    </button>
              </div>
                    {form.awards.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {form.awards.map((award, index) => (
                        <div
                          key={index}
                          style={{
                            background: '#f1f5f9',
                            padding: '4px 12px',
                            borderRadius: '16px',
                            fontSize: '12px',
                            color: '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {award}
                          <button
                            type="button"
                            onClick={() => handleRemoveAward(index)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#64748b',
                              cursor: 'pointer',
                              padding: '0 4px',
                            }}
                          >
                            ×
                          </button>
            </div>
                      ))}
            </div>
          )}
            </div>
                      </div>
            </div>
          )}

            {currentStep === 3 && (
            <div>
                <h3 style={styles.sectionTitle}>Media & Documents</h3>
              <div style={styles.section}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Builder Logo</label>
                    <div style={styles.fileUpload}>
                      <input
                        type="file"
                        name="builderLogo"
                        onChange={handleChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="logo-upload"
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('logo-upload').click()}
                        style={styles.fileUploadButton}
                      >
                        + Upload Logo
                      </button>
                      {form.builderLogo && (
                        <img
                          src={getImagePreview(form.builderLogo)}
                          alt="Logo Preview"
                          style={styles.previewImage}
                        />
                      )}
                </div>
                    {errors.builderLogo && <div style={styles.errorMessage}>{errors.builderLogo}</div>}
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Cover Banner</label>
                    <div style={styles.fileUpload}>
                      <input
                        type="file"
                        name="coverBanner"
                        onChange={handleChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="banner-upload"
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('banner-upload').click()}
                        style={styles.fileUploadButton}
                      >
                        + Upload Cover Banner
                      </button>
                      {form.coverBanner && (
                        <img
                          src={getImagePreview(form.coverBanner)}
                          alt="Banner Preview"
                          style={styles.previewImage}
                        />
                      )}
                    </div>
                    {errors.coverBanner && <div style={styles.errorMessage}>{errors.coverBanner}</div>}
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Certificates <span style={{ color: '#ef4444' }}>*</span></label>
                    <div style={styles.fileUpload}>
                      <input
                        type="file"
                        name="certificates"
                        onChange={handleChange}
                        accept=".pdf,.jpg,.jpeg,.png"
                        multiple
                        style={{ display: 'none' }}
                        id="certificates-upload"
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('certificates-upload').click()}
                        style={styles.fileUploadButton}
                      >
                        + Upload Certificates
                      </button>
                      {form.certificates.length > 0 && (
                        <div style={{ marginTop: '8px' }}>
                          {form.certificates.map((cert, index) => (
                            <div key={index} style={{ fontSize: '12px', color: '#64748b' }}>
                              {cert.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {errors.certificates && <div style={styles.errorMessage}>{errors.certificates}</div>}
                  </div>
              </div>
            </div>
          )}

            {currentStep === 4 && (
            <div>
                <h3 style={styles.sectionTitle}>Review & Submit</h3>
              <div style={styles.section}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Location <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    style={styles.input}
                    required
                    placeholder="Enter primary location"
                  />
                  {errors.location && <div style={styles.errorMessage}>{errors.location}</div>}
                </div>
              </div>
            </div>
          )}
          </div>

          {/* Navigation Buttons */}
          <div style={styles.navigationButtons}>
            {currentStep > 1 && (
          <button
                type="button"
                onClick={handleBack}
                style={styles.secondaryButton}
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              style={styles.primaryButton}
          >
              {currentStep === 3 ? 'Submit' : 'Next'}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddBuilder;