import React from 'react';
import FooterNavBar from '../layout/FooterNavBar';
import FooterSection from '../layout/FooterSection';
import { Home, Users, Shield, Award, MapPin, Phone, TrendingUp } from 'lucide-react';
import DynamicBreadcrumb from '../../../components/ui/DynamicBreadcrumb';

const AboutPage = () => {
  const values = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Transparency",
      description: "Complete clarity in pricing and information"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "No Brokerage",
      description: "Direct connection with builders"
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Trusted Builders",
      description: "RERA verified developers"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <FooterNavBar />
      <DynamicBreadcrumb />

      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-6">
              <Home className="w-8 h-8 text-blue-700" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              About HouseNSeek
            </h1>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              We are a modern real estate platform focused on transparency, no brokerage fees,
              and helping you find your perfect home with smart tools and trusted builders.
            </p>
            <p className="text-2xl font-bold text-blue-700">
              No brokers. No noise. Just smart choices.
            </p>
          </div>
        </div>
      </div>

      {/* ---- Background Image Stripe ---- */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '320px',
          backgroundImage: 'url("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Dark overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(30,58,138,0.85) 0%, rgba(37,99,235,0.75) 100%)',
          }}
        />
        {/* Content over overlay */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '3rem 1.5rem', maxWidth: '800px' }}>
          <h2 style={{ color: '#fff', fontSize: '2rem', fontWeight: 700, marginBottom: '1rem', lineHeight: 1.3 }}>
            Empowering Home Buyers Across India
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '2rem' }}>
            From Navi Mumbai to every growing metro, we connect verified builders with genuine buyers —
            cutting out middlemen and making property discovery effortless.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <MapPin style={{ width: '1.25rem', height: '1.25rem', color: '#93c5fd' }} />
              </div>
              <span style={{ color: '#fff', fontSize: '1.75rem', fontWeight: 700, display: 'block' }}>14+</span>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>Locations Covered</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <TrendingUp style={{ width: '1.25rem', height: '1.25rem', color: '#93c5fd' }} />
              </div>
              <span style={{ color: '#fff', fontSize: '1.75rem', fontWeight: 700, display: 'block' }}>500+</span>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>Properties Listed</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <Phone style={{ width: '1.25rem', height: '1.25rem', color: '#93c5fd' }} />
              </div>
              <span style={{ color: '#fff', fontSize: '1.75rem', fontWeight: 700, display: 'block' }}>Zero</span>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>Brokerage Fee</span>
            </div>
          </div>
        </div>
      </div>

      {/* Core Values */}
      <div className="bg-white py-16 md:py-20 border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Our Core Values
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4 text-blue-700">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {value.title}
                </h3>
                <p className="text-gray-700">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="bg-white py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
            Why Choose HouseNSeek?
          </h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-blue-700 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                1
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg mb-1">Save Money</h4>
                <p className="text-gray-700">No brokerage fees. Direct deals with builders.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue-700 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                2
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg mb-1">Save Time</h4>
                <p className="text-gray-700">Smart filters help you find properties quickly.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue-700 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                3
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg mb-1">Complete Trust</h4>
                <p className="text-gray-700">All builders are RERA verified and transparent.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FooterSection />
    </div>
  );
};

export default AboutPage;