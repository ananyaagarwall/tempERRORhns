import React, { useEffect, useRef, useState } from 'react';
import FooterNavBar from '../layout/FooterNavBar';
import FooterSection from '../layout/FooterSection';
import './AboutUs.css';

/* ── Intersection Observer hook for scroll animations ── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

/* ── Feature Cards data ── */
const features = [
  {
    icon: '🤖',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    shadowColor: 'rgba(102,126,234,0.45)',
    tag: 'AI-Powered',
    title: 'Seeku Guidance',
    shortDesc: 'Your 24/7 real estate consultant. No sales pitch.',
    highlights: ['Instant answers', 'Personalised recs', 'Zero bias'],
  },
  {
    icon: '📊',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    shadowColor: 'rgba(240,147,251,0.45)',
    tag: 'Smart Scoring',
    title: 'Confidence Score',
    shortDesc: 'Compare every property by what matters to you.',
    highlights: ['Budget fit', 'Locality match', 'Quality rating'],
  },
  {
    icon: '🧭',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    shadowColor: 'rgba(79,172,254,0.45)',
    tag: 'Guided Discovery',
    title: 'Smart Discovery',
    shortDesc: 'Skip the scroll. Find homes that actually fit.',
    highlights: ['Curated listings', 'Smart filters', 'Saved searches'],
  },
  {
    icon: '🤝',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    shadowColor: 'rgba(67,233,123,0.45)',
    tag: 'Real People',
    title: 'Human Support',
    shortDesc: 'Expert consultants ready when it matters most.',
    highlights: ['Free advice', 'Legal guidance', 'No pressure'],
  },
];

/* ── Buyer benefits ── */
const buyerBenefits = [
  'Discover relevant homes in minutes, not months',
  'Compare properties with confidence scores',
  'Reduce decision fatigue with guided discovery',
  'Escape broker chaos and spam calls',
  'Make purchases with clarity, not pressure',
];

/* ── Builder benefits ── */
const builderBenefits = [
  'Reach serious, qualified buyers',
  'Improve conversion quality',
  'Understand buyer demand trends',
  'Gain market intelligence',
  'Build trust digitally',
];

/* ────────────────────────────────────────── */
const AboutPage = () => {
  const [heroRef, heroInView] = useInView(0.1);
  const [problemRef, problemInView] = useInView(0.1);
  const [featuresRef, featuresInView] = useInView(0.1);
  const [visionRef, visionInView] = useInView(0.1);
  const [helpRef, helpInView] = useInView(0.1);
  const [seekuRef, seekuInView] = useInView(0.1);
  const [ctaRef, ctaInView] = useInView(0.1);

  return (
    <div className="au-root">
      <FooterNavBar />

      {/* ═══════════════════════ HERO ═══════════════════════ */}
      <section className="au-hero" ref={heroRef}>
        {/* Animated mesh background */}
        <div className="au-hero-mesh" />
        <div className="au-hero-blob au-hero-blob-1" />
        <div className="au-hero-blob au-hero-blob-2" />
        <div className="au-hero-blob au-hero-blob-3" />

        <div className={`au-hero-content ${heroInView ? 'au-fade-up' : 'au-hidden'}`}>
          <div className="au-hero-pill">
            <span className="au-pill-dot" />
            About HousenSeek
          </div>
          <h1 className="au-hero-h1">
            We're Making Home Buying
            <br />
            <span className="au-hero-accent">Clear &amp; Confident</span>
          </h1>
          <p className="au-hero-sub">
            At HousenSeek, we believe the right home is out there for everyone. We're combining
            technology, data, and real people to help you discover it without the chaos.
          </p>
          <div className="au-hero-ctas">
            <a href="/properties" className="au-btn-primary">
              Explore Properties
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4 9h10M10 5l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a href="/seeku" className="au-btn-ghost">
              <span className="au-btn-ghost-icon">✦</span>
              Meet Seeku
            </a>
          </div>

          {/* Compact stat row — Zero Brokerage highlighted in the middle */}
          <div className="au-hero-stats">
            <div className="au-stat-card au-stat-small">
              <span className="au-stat-num au-stat-num-sm">14+</span>
              <span className="au-stat-lbl">Cities</span>
            </div>
            {/* Highlighted Zero Brokerage card */}
            <div className="au-stat-card au-stat-hero">
              <div className="au-stat-hero-badge">★ Featured</div>
              <span className="au-stat-num au-stat-zero">₹0</span>
              <span className="au-stat-lbl au-stat-lbl-hero">Brokerage Fee</span>
              <span className="au-stat-hero-sub">Always &amp; forever free</span>
            </div>
            <div className="au-stat-card au-stat-small">
              <span className="au-stat-num au-stat-num-sm">500+</span>
              <span className="au-stat-lbl">Properties</span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="au-scroll-hint">
          <div className="au-scroll-mouse">
            <div className="au-scroll-wheel" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════ PROBLEM ═══════════════════════ */}
      <section className="au-problem" ref={problemRef}>
        <div className="au-problem-inner">
          <div className={`au-problem-left ${problemInView ? 'au-slide-right' : 'au-hidden'}`}>
            <div className="au-section-eyebrow">
              <span className="au-eyebrow-dot" />
              The Problem We Saw
            </div>
            <h2 className="au-problem-h2">
              Buying a home shouldn't be
              <span className="au-problem-accent"> this complicated!</span>
            </h2>
            <p className="au-problem-body">
              Buying a home is one of life's biggest decisions. But the process? It's broken.
              You're juggling multiple listing portals, broker spam calls, conflicting advice, and
              information overload.
            </p>
            <p className="au-problem-body">
              Builders, meanwhile, invest millions in their projects only to get fragmented leads
              and low-quality inquiries.
            </p>
            <div className="au-problem-belief">
              <span className="au-belief-quote">"</span>
              We believed there had to be a better way. A platform that's honest, transparent, and
              built for both buyers and builders.
            </div>
          </div>

          <div className={`au-problem-right ${problemInView ? 'au-slide-left' : 'au-hidden'}`}>
            {/* Pain-point visual cards */}
            <div className="au-pain-grid">
              {[
                { icon: '📱', label: 'Multiple Portals', sub: 'Fragmented listings everywhere' },
                { icon: '📞', label: 'Broker Spam', sub: 'Endless unwanted calls' },
                { icon: '🤷', label: 'Conflicting Advice', sub: 'No one to trust' },
                { icon: '😵', label: 'Info Overload', sub: 'Decision paralysis' },
              ].map((p, i) => (
                <div className="au-pain-card" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                  <span className="au-pain-icon">{p.icon}</span>
                  <strong>{p.label}</strong>
                  <span>{p.sub}</span>
                </div>
              ))}
            </div>
            <div className="au-problem-badge">
              <span className="au-badge-check">✓</span>
              We're fixing all of this.
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ WHAT WE'RE BUILDING ═══════════════════════ */}
      <section className="au-features" ref={featuresRef}>
        <div className="au-features-inner">
          <div className={`au-features-header ${featuresInView ? 'au-fade-up' : 'au-hidden'}`}>
            <div className="au-section-eyebrow au-eyebrow-light">
              <span className="au-eyebrow-dot au-dot-gold" />
              What We're Building
            </div>
            <h2 className="au-features-h2">
              HousenSeek isn't just a listing site.<br />
              It's your <span className="au-features-accent">intelligent home-buying companion.</span>
            </h2>
          </div>

          <div className={`au-feature-cards ${featuresInView ? 'au-fade-up-delay' : 'au-hidden'}`}>
            {features.map((f, i) => (
              <div className="au-feature-card" key={i} style={{ '--card-delay': `${i * 0.12}s`, '--card-gradient': f.gradient, '--card-shadow': f.shadowColor }}>
                {/* Glow blob behind card */}
                <div className="au-fc-glow" style={{ background: f.gradient }} />
                {/* Top: big icon */}
                <div className="au-fc-icon-wrap" style={{ background: f.gradient, boxShadow: `0 16px 40px ${f.shadowColor}` }}>
                  <span className="au-fc-emoji">{f.icon}</span>
                </div>
                {/* Tag */}
                <div className="au-fc-tag" style={{ color: 'rgba(255,255,255,0.5)' }}>{f.tag}</div>
                {/* Title */}
                <h3 className="au-fc-title">{f.title}</h3>
                {/* Short desc */}
                <p className="au-fc-desc">{f.shortDesc}</p>
                {/* Highlight chips */}
                <div className="au-fc-chips">
                  {f.highlights.map((h) => (
                    <span key={h} className="au-fc-chip">{h}</span>
                  ))}
                </div>
                {/* Bottom accent bar */}
                <div className="au-fc-bar" style={{ background: f.gradient }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ VISION ═══════════════════════ */}
      <section className="au-vision" ref={visionRef}>
        <div className={`au-vision-inner ${visionInView ? 'au-fade-up' : 'au-hidden'}`}>
          <div className="au-vision-label">Our Vision</div>
          <div className="au-vision-card">
            <div className="au-vision-icon">🏛️</div>
            <div className="au-vision-title">Trust is Infrastructure</div>
            <p className="au-vision-body">
              The future of real estate won't be won by whoever has the most listings—it will be
              won by whoever helps people make better decisions.
            </p>
            <p className="au-vision-body au-vision-bold">
              We're building India's most trusted home-buying platform.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ HOW WE HELP ═══════════════════════ */}
      <section className="au-help" ref={helpRef}>
        <div className="au-help-inner">
          <div className={`au-help-header ${helpInView ? 'au-fade-up' : 'au-hidden'}`}>
            <div className="au-section-eyebrow">
              <span className="au-eyebrow-dot" />
              How We Help
            </div>
            <h2 className="au-help-h2">Built for every side of the transaction</h2>
          </div>

          <div className={`au-help-grid ${helpInView ? 'au-fade-up-delay' : 'au-hidden'}`}>
            {/* For Buyers */}
            <div className="au-help-card au-help-buyers">
              <div className="au-help-card-header">
                <div className="au-help-icon-wrap">🏠</div>
                <div>
                  <div className="au-help-card-tag">For Home Buyers</div>
                  <h3 className="au-help-card-title">Find Your Home, Your Way</h3>
                </div>
              </div>
              <ul className="au-help-list">
                {buyerBenefits.map((b, i) => (
                  <li key={i} className="au-help-item">
                    <span className="au-help-check">✓</span>
                    {b}
                  </li>
                ))}
              </ul>
              <a href="/properties" className="au-help-cta">Explore Properties →</a>
            </div>

            {/* Divider glyph */}
            <div className="au-help-divider">
              <div className="au-help-divider-line" />
              <div className="au-help-divider-icon">⇌</div>
              <div className="au-help-divider-line" />
            </div>

            {/* For Builders */}
            <div className="au-help-card au-help-builders">
              <div className="au-help-card-header">
                <div className="au-help-icon-wrap au-icon-gold">🏗️</div>
                <div>
                  <div className="au-help-card-tag au-tag-gold">For Builders</div>
                  <h3 className="au-help-card-title">Reach the Right Buyers</h3>
                </div>
              </div>
              <ul className="au-help-list">
                {builderBenefits.map((b, i) => (
                  <li key={i} className="au-help-item">
                    <span className="au-help-check au-check-gold">✓</span>
                    {b}
                  </li>
                ))}
              </ul>
              <a href="/builders" className="au-help-cta au-cta-gold">List Your Project →</a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ MEET SEEKU ═══════════════════════ */}
      <section className="au-seeku" ref={seekuRef}>
        <div className="au-seeku-bg-glow" />
        <div className="au-seeku-inner">
          <div className={`au-seeku-visual ${seekuInView ? 'au-slide-right' : 'au-hidden'}`}>
            {/* Seeku avatar card */}
            <div className="au-seeku-card">
              <div className="au-seeku-avatar">
                <div className="au-seeku-avatar-ring" />
                <div className="au-seeku-avatar-core">
                  <span className="au-seeku-avatar-emoji">✦</span>
                </div>
                <div className="au-seeku-online">
                  <span className="au-seeku-online-dot" />
                  Online 24/7
                </div>
              </div>

              <div className="au-seeku-name">Seeku</div>
              <div className="au-seeku-role">Your Honest Real Estate Companion</div>

              {/* Seeku traits */}
              <div className="au-seeku-traits">
                {['No sales pitch', 'Flags red flags', 'Explains clearly'].map((t) => (
                  <span key={t} className="au-seeku-trait">{t}</span>
                ))}
              </div>

              {/* Chat bubble */}
              <div className="au-seeku-bubble">
                <div className="au-seeku-bubble-dot" />
                <p>"Pause before you pay."</p>
              </div>
            </div>

            {/* Floating info pills */}
            <div className="au-seeku-pill au-seeku-pill-1">
              <span>📊</span> Market data from millions of transactions
            </div>
            <div className="au-seeku-pill au-seeku-pill-2">
              <span>🔍</span> Highlights deals that make sense
            </div>
          </div>

          <div className={`au-seeku-content ${seekuInView ? 'au-slide-left' : 'au-hidden'}`}>
            <div className="au-section-eyebrow">
              <span className="au-eyebrow-dot" />
              Meet Seeku
            </div>
            <h2 className="au-seeku-h2">
              Unlike a sales agent, Seeku is designed to
              <span className="au-seeku-accent"> help you think clearly.</span>
            </h2>
            <p className="au-seeku-body">
              He simplifies complex real-estate jargon, flags red flags, and helps you focus on
              what actually matters.
            </p>

            <blockquote className="au-seeku-quote">
              <span className="au-quote-mark">"</span>
              Pause before you pay.
              <span className="au-quote-mark">"</span>
              <cite>— Seeku, your honest real estate companion</cite>
            </blockquote>

            <p className="au-seeku-body">
              Seeku learns from millions of property transactions and market data. He gives you
              information a broker would bury, highlights deals that actually make sense, and
              explains why every property is or isn't right for you.
            </p>

            <a href="/seeku" className="au-btn-seeku">
              <span>Chat with Seeku</span>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4 9h10M10 5l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FINAL CTA ═══════════════════════ */}
      <section className="au-cta" ref={ctaRef}>
        <div className="au-cta-glow au-cta-glow-1" />
        <div className="au-cta-glow au-cta-glow-2" />
        <div className={`au-cta-inner ${ctaInView ? 'au-fade-up' : 'au-hidden'}`}>
          <div className="au-cta-eyebrow">Ready to Find Your Next Home?</div>
          <h2 className="au-cta-h2">
            Decide with <span className="au-cta-accent-1">clarity.</span>{' '}
            Own with <span className="au-cta-accent-2">confidence.</span>
          </h2>
          <p className="au-cta-sub">
            Whether buying your first home or exploring your next move, HousenSeek is here to help.
          </p>
          <a href="/properties" className="au-btn-cta">
            Explore Properties
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
              <path d="M4 9h10M10 5l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <p className="au-cta-footnote">No brokerage. No spam. Just smart choices.</p>
        </div>
      </section>

      <FooterSection />
    </div>
  );
};

export default AboutPage;