import React from 'react';
import { useNavigate } from 'react-router-dom';

const BuilderButton = () => {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate('/dashboard/add-builder')} style={{ padding: '10px 20px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
      Builder
    </button>
  );
};

export default BuilderButton; 