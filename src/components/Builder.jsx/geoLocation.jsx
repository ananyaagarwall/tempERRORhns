import React, { useEffect, useState } from 'react';

const GeoLocation = () => {
  const [geo, setGeo] = useState({ district: '', full_address: '', latitude: '', longitude: '' });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGeo();
  }, []);

  const fetchGeo = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/latest-geolocation');
      if (res.ok) {
        const data = await res.json();
        setGeo(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    // Simulate save (could POST to backend if DB is used)
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ padding: 32, maxWidth: 500, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Geo Location</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div style={{ background: '#f3f4f6', borderRadius: 8, padding: 24, marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>District:</div>
          <div style={{ marginBottom: 12 }}>{geo.district || 'N/A'}</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Address:</div>
          <div style={{ marginBottom: 12 }}>{geo.full_address || 'N/A'}</div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>
            Lat: {geo.latitude || 'N/A'}<br />
            Lon: {geo.longitude || 'N/A'}
          </div>
        </div>
      )}
      <button
        onClick={handleSave}
        style={{ padding: '10px 32px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 16 }}
        disabled={loading || saved}
      >
        {saved ? 'Saved!' : 'Save Entry'}
      </button>
    </div>
  );
};

export default GeoLocation;