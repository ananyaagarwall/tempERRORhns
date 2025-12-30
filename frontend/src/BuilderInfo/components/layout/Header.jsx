import React from 'react';

const pillStyle = {
  height: 44,
  borderRadius: 9999,
  background: 'linear-gradient(180deg, #263A8F 0%, #1B2E73 100%)',
  boxShadow:
    '0 14px 28px rgba(0,0,0,0.35), 0 6px 12px rgba(0,0,0,0.28), inset 0 -2px 10px rgba(255,255,255,0.08)',
};

const Header = () => {
  return (
    <div
      className="w-full text-white"
      style={{
        background:
          'linear-gradient(180deg, #0B2C6C 0%, #0A2A5E 40%, #0A2860 100%)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-14">
        <div className="text-center">
          <h1
            className="text-4xl font-extrabold tracking-wide select-none"
            style={{
              textShadow:
                '0 2px 0 rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.45), 0 0 18px rgba(255,255,255,0.25)',
              letterSpacing: 1,
            }}
          >
            HouseNSeekkkk
          </h1>
        </div>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={pillStyle}></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Header;