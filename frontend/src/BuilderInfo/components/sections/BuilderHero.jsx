import React from 'react';

const BuilderHero = ({ builder }) => {
    const builderName = builder?.company_name || 'Premium Builder';
    const tagline = builder?.tagline || builder?.short_description || 'Building Dreams, Delivering Excellence';

    return (
        <div className="builder-hero-strip">
            <div className="builder-hero-content">
                <div className="builder-hero-text">
                    <h1>{builderName}</h1>
                    <p>{tagline.length > 80 ? tagline.substring(0, 80) + '...' : tagline}</p>
                </div>
                <div className="builder-hero-accent"></div>
            </div>
        </div>
    );
};

export default BuilderHero;
