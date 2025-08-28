import React, { useState } from 'react';
import Navbar from '../Navbar'; // Adjust path as needed

const tableHeaderStyle = {
  background: '#eef2f7',
  fontWeight: 600,
  fontSize: 14,
  color: '#444',
  borderBottom: '1px solid #d1d5db',
  padding: '10px 14px',
  textAlign: 'left',
};
const tableCellStyle = {
  padding: '10px 14px',
  fontSize: 14,
  color: '#333',
  borderBottom: '1px solid #e5e7eb',
  textAlign: 'left',
};
const tableRowStyle = {
  background: '#fff',
};
const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 4,
  border: '1px solid #bdbdbd',
  fontSize: 15,
  marginBottom: 12,
  outline: 'none',
};
const buttonStyle = {
  padding: '8px 16px',
  borderRadius: 4,
  border: 'none',
  fontWeight: 600,
  fontSize: 15,
  cursor: 'pointer',
  marginRight: 10,
};
const saveButtonStyle = {
  ...buttonStyle,
  background: '#185a9d',
  color: '#fff',
};
const cancelButtonStyle = {
  ...buttonStyle,
  background: '#e0e0e0',
  color: '#333',
};

const ManagePropertyInBuilderProfile = () => {
  // Placeholder state for form fields
  const [propertyForm, setPropertyForm] = useState({
    propertyType: '',
    availabilityStatus: '',
    socialLinks: '',
    location: '',
  });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setPropertyForm({ ...propertyForm, [name]: value });
  };

  const handleSave = () => {
    // TODO: Implement save logic
    alert('Save clicked!');
  };

  const handleCancel = () => {
    // TODO: Implement cancel logic or clear form
    alert('Cancel clicked!');
  };

  // Placeholder data for property list table
  const properties = [
    { id: 1, name: 'Property A', type: 'Apartment', status: 'Available' },
    { id: 2, name: 'Property B', type: 'House', status: 'Sold' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f5f5f5', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      {/* Sidebar */}
      <Navbar vertical sidebarLinksOverride={[
        { name: 'Dashboard', path: '/dashboard/admin' },
        { name: 'Leads', path: '/dashboard/leads' },
        { name: 'Properties', path: '/dashboard/properties' },
        { name: 'Add Builder', path: '/dashboard/add-builder' },
        { name: 'Blogs', path: '/dashboard/blogs' },
        { name: 'Categories', path: '/dashboard/categories' }
      ]} />
      {/* Main Content */}
      <div style={{ flex: 1, padding: '32px 40px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 22, fontWeight: 600, color: '#222', marginBottom: 24 }}>Manage Property in Builder Profile</div>

        {/* Builder Info and Add Property Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: '16px', background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#333' }}>Builder Name</div>
            <div style={{ fontSize: 14, color: '#888' }}>0 Properties Managed</div> {/* Placeholder */}
          </div>
          <button style={{
            background: '#e0e0e0',
            color: '#333',
            border: 'none',
            borderRadius: 4,
            padding: '8px 16px',
            fontWeight: 600,
            fontSize: 15,
            cursor: 'pointer',
          }}>Add Property</button>
        </div>

        {/* Property List Table */}
        <div style={{ marginBottom: 24, background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...tableHeaderStyle, width: '40%' }}>Property Name</th>
                <th style={{ ...tableHeaderStyle, width: '30%' }}>Type</th>
                <th style={{ ...tableHeaderStyle, width: '30%' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property) => (
                <tr key={property.id} style={tableRowStyle}>
                  <td style={tableCellStyle}>{property.name}</td>
                  <td style={tableCellStyle}>{property.type}</td>
                  <td style={tableCellStyle}>{property.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Property Form Section (Placeholder) */}
        <div style={{ marginBottom: 24, padding: '16px', background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0' }}>
           <div style={{ fontSize: 18, fontWeight: 600, color: '#333', marginBottom: 16 }}>Add Property</div>
           <div style={{ display: 'flex', gap: 16 }}>
              <select style={{ ...inputStyle, flex: 1 }} name="propertyType" value={propertyForm.propertyType} onChange={handleFormChange}>
                 <option value="">Select Property</option>
                 {/* Options will go here */}
              </select>
              <select style={{ ...inputStyle, flex: 1 }} name="availabilityStatus" value={propertyForm.availabilityStatus} onChange={handleFormChange}>
                 <option value="">Availability Status</option>
                 {/* Options will go here */}
              </select>
           </div>
           {/* Social Links */}
           <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#444', marginBottom: 6 }}>Social Links</div>
              <input type="text" style={inputStyle} name="socialLinks" value={propertyForm.socialLinks} onChange={handleFormChange} placeholder="Comma separated links" />
           </div>
            {/* Location */}
           <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#444', marginBottom: 6 }}>Location</div>
              <input type="text" style={inputStyle} name="location" value={propertyForm.location} onChange={handleFormChange} placeholder="City, Country" />
           </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button style={cancelButtonStyle} onClick={handleCancel}>Cancel</button>
          <button style={saveButtonStyle} onClick={handleSave}>Save</button>
        </div>

      </div>
    </div>
  );
};

export default ManagePropertyInBuilderProfile; 