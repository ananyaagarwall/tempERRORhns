import API_BASE_URL from '../../../config';
import React from 'react';

// UPDATED: SectionBox with cleaner, more professional styling
const SectionBox = ({ title, children }) => (
  <div className="bg-slate-50/75 p-5 md:bg-white md:p-6 md:rounded-2xl md:shadow-sm md:border md:border-gray-100 md:hover:shadow-lg md:transition-all padding-bottom:12px">
    <div className="builder-section-subheading">{title}</div>
    {children}
  </div>
);

const toArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const normalizeFileUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/uploads/')) return `${API_BASE_URL}${url}`;
  return `${API_BASE_URL}/uploads/${url}`;
};

const DetailsSection = ({ builder }) => {
  if (!builder) return null;

  const certificates = toArray(builder.certificates);
  const awards = toArray(builder.awards);

  return (
    // ADDED: A wrapper to create a seamless container on mobile
    <div className="overflow-hidden rounded-2xl border border-gray-200 md:border-0">
      <div className="grid md:grid-cols-2 md:gap-4">
        <SectionBox title="Contact Information">
          <div className="text-sm text-gray-800 space-y-2" style={{ fontFamily: 'sans-serif' }}>
            <div><span className="font-sans-serif">Email:</span> {builder.contact_email || 'NA'}</div>
            <div><span className="font-sans-serif">Phone:</span> {builder.contact_number || 'NA'}</div>
            <div>
              <span className="font-semibold">Website:</span>{' '}
              {builder.website_url ? (
                <a href={builder.website_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">
                  {builder.website_url}
                </a>
              ) : 'NA'}
            </div>
          </div>
        </SectionBox>

        <SectionBox title="Address">
          <div className="text-sm text-gray-800 space-y-1" style={{ fontFamily: 'var(--hns-sans)' }}>
            <div>{builder.corporate_address || 'NA'}</div>
            <div>{[builder.city, builder.state, builder.pin_code].filter(Boolean).join(', ')}</div>
          </div>
        </SectionBox>

        <SectionBox title="Certificates">
          {certificates.length === 0 ? (
            <div className="text-sm text-gray-500">No certificates available.</div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {certificates.map((c, i) => (
                <a key={i} href={normalizeFileUrl(c)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm hover:shadow-md transition-shadow">
                  <img src={normalizeFileUrl(c)} alt={`cert-${i}`} className="h-8 w-8 object-cover rounded-md" />
                  <span>Certificate {i + 1}</span>
                </a>
              ))}
            </div>
          )}
        </SectionBox>

        <SectionBox title="Awards">
          {awards.length === 0 ? (
            <div className="text-sm text-gray-500">No awards listed.</div>
          ) : (
            <ul className="list-disc pl-5 text-sm text-gray-800 space-y-1" style={{ fontFamily: 'var(--hns-sans)' }}>
              {awards.map((a, i) => (
                <li key={i}>{typeof a === 'string' ? a : JSON.stringify(a)}</li>
              ))}
            </ul>
          )}
        </SectionBox>
      </div>
    </div>
  );
};

export default DetailsSection;