import React from 'react';

const tabList = [
  { label: 'Basic Info', value: 'basic' },
  { label: 'About & Highlights', value: 'about' },
  { label: 'Projects', value: 'projects' },
  { label: 'Settings', value: 'settings' },
];

const Tabs = ({ activeTab, setActiveTab }) => {
  return (
    <div style={{ display: 'flex', borderBottom: '2px solid #e3e3e3', marginBottom: 24, gap: 32 }}>
      {tabList.map(tab => (
        <button
          key={tab.value}
          onClick={() => setActiveTab(tab.value)}
          style={{
            background: 'none',
            border: 'none',
            outline: 'none',
            fontSize: 18,
            fontWeight: 600,
            color: activeTab === tab.value ? '#185a9d' : '#666666',
            borderBottom: activeTab === tab.value ? '3px solid #185a9d' : '3px solid transparent',
            padding: '8px 0',
            cursor: 'pointer',
            transition: 'color 0.2s, border-bottom 0.2s',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default Tabs;