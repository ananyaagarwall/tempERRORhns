import React from "react";

const Card = ({ className = "", children }) => {
  return (
    <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>
      {children}
    </div>
  );
};

const CardContent = ({ className = "", children }) => {
  return (
    <div className={`p-6 ${className}`}> {/* Removed pt-0 to make it more generic */}
      {children}
    </div>
  );
};

export { Card, CardContent };