import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import '../../hns_propertylisting_css/PropertyFilterSidebar.css';

const MobileTagsSection = ({ allTags, removeTag }) => {
  const [tags, setTags] = useState(allTags);

  useEffect(() => {
    setTags(allTags);
  }, [allTags]);

  const handleRemoveTag = (tagToRemove) => {
    removeTag(tagToRemove);
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="mobile-tags-section">
      <div className="mobile-tags-container">
        {tags.map((tag, i) => (
          <div key={i} className="mobile-tag">
            {tag}
            <X className="mobile-tag-remove" onClick={() => handleRemoveTag(tag)} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobileTagsSection;
