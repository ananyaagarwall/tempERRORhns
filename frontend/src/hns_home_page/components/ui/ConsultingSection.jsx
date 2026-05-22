import React, { useState, useEffect } from 'react';
import './Consultingsection.css';

/* ─── helpers ─────────────────────────────────────── */
const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

// Next 7 days, skip indices 1 and 4 (unavailable gaps)
const AVAILABLE_DAYS = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(TODAY);
    d.setDate(TODAY.getDate() + i);
    return d;
}).filter((_, i) => i !== 1 && i !== 4); // gaps on day +1 and +4

const TIME_SLOTS = (() => {
    const slots = [];
    for (let h = 9; h <= 18; h++) {
        slots.push(`${String(h).padStart(2, '0')}:00`);
        if (h < 18) slots.push(`${String(h).padStart(2, '0')}:30`);
    }
    return slots;
})();

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const fmt = (d) => `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;

/* ─── Modal ─────────────────────────────────────────── */
function ScheduleModal({ onClose }) {
    const [step, setStep] = useState(1); // 1=date, 2=time, 3=confirm
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [submitted, setSubmitted] = useState(false);

    // trap scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    const handleSubmit = () => {
        if (!name.trim() || !phone.trim()) return;
        setSubmitted(true);
    };

    return (
        <div className="cs-modal-overlay" onClick={handleOverlayClick}>
            <div className="cs-modal">
                {/* Header */}
                <div className="cs-modal-header">
                    <div className="cs-modal-header-left">
                        <span className="cs-modal-icon">📞</span>
                        <div>
                            <h3 className="cs-modal-title">Schedule a Call</h3>
                            <p className="cs-modal-subtitle">Free 30-min expert consultation</p>
                        </div>
                    </div>
                    <button className="cs-modal-close" onClick={onClose} aria-label="Close">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M2 2L16 16M16 2L2 16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                {/* Step indicator */}
                {!submitted && (
                    <div className="cs-steps">
                        {['Choose Date', 'Choose Time', 'Your Details'].map((label, i) => (
                            <React.Fragment key={i}>
                                <div className={`cs-step ${step > i + 1 ? 'done' : ''} ${step === i + 1 ? 'active' : ''}`}>
                                    <div className="cs-step-circle">
                                        {step > i + 1
                                            ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            : <span>{i + 1}</span>
                                        }
                                    </div>
                                    <span className="cs-step-label">{label}</span>
                                </div>
                                {i < 2 && <div className={`cs-step-line ${step > i + 1 ? 'done' : ''}`} />}
                            </React.Fragment>
                        ))}
                    </div>
                )}

                {/* Body */}
                <div className="cs-modal-body">
                    {submitted ? (
                        /* ── Success ── */
                        <div className="cs-success">
                            <div className="cs-success-icon">✓</div>
                            <h4 className="cs-success-title">You're all set!</h4>
                            <p className="cs-success-msg">
                                Your call is scheduled for<br />
                                <strong>{fmt(selectedDate)}</strong> at <strong>{selectedTime}</strong>.
                            </p>
                            <p className="cs-success-note">Our expert will call you on the number provided.</p>
                            <button className="cs-btn-primary" onClick={onClose}>Done</button>
                        </div>

                    ) : step === 1 ? (
                        /* ── Step 1: Date ── */
                        <div className="cs-date-section">
                            <p className="cs-section-hint">Available dates for the next 7 days</p>
                            <div className="cs-date-grid">
                                {AVAILABLE_DAYS.map((day, i) => {
                                    const isToday = day.getTime() === TODAY.getTime();
                                    const sel = selectedDate && selectedDate.getTime() === day.getTime();
                                    return (
                                        <button
                                            key={i}
                                            className={`cs-date-card ${sel ? 'selected' : ''}`}
                                            onClick={() => setSelectedDate(day)}
                                        >
                                            <span className="cs-date-dayname">{DAY_NAMES[day.getDay()]}</span>
                                            <span className="cs-date-num">{day.getDate()}</span>
                                            <span className="cs-date-month">{MONTH_NAMES[day.getMonth()]}</span>
                                            {isToday && <span className="cs-today-badge">Today</span>}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="cs-modal-footer">
                                <button
                                    className="cs-btn-primary"
                                    disabled={!selectedDate}
                                    onClick={() => setStep(2)}
                                >
                                    Continue →
                                </button>
                            </div>
                        </div>

                    ) : step === 2 ? (
                        /* ── Step 2: Time ── */
                        <div className="cs-time-section">
                            <p className="cs-section-hint">
                                Available slots on <strong>{fmt(selectedDate)}</strong>
                            </p>
                            <div className="cs-time-grid">
                                {TIME_SLOTS.map((slot) => {
                                    const sel = selectedTime === slot;
                                    return (
                                        <button
                                            key={slot}
                                            className={`cs-time-chip ${sel ? 'selected' : ''}`}
                                            onClick={() => setSelectedTime(slot)}
                                        >
                                            {slot}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="cs-modal-footer">
                                <button className="cs-btn-ghost" onClick={() => setStep(1)}>← Back</button>
                                <button
                                    className="cs-btn-primary"
                                    disabled={!selectedTime}
                                    onClick={() => setStep(3)}
                                >
                                    Continue →
                                </button>
                            </div>
                        </div>

                    ) : (
                        /* ── Step 3: Details ── */
                        <div className="cs-details-section">
                            <p className="cs-section-hint">Almost there — confirm your details</p>
                            <div className="cs-booking-summary">
                                <div className="cs-summary-row">
                                    <span className="cs-summary-icon">📅</span>
                                    <span>{fmt(selectedDate)}</span>
                                </div>
                                <div className="cs-summary-row">
                                    <span className="cs-summary-icon">🕐</span>
                                    <span>{selectedTime}</span>
                                </div>
                            </div>
                            <div className="cs-form">
                                <div className="cs-field">
                                    <label className="cs-field-label">Your Name</label>
                                    <input
                                        id="cs-name"
                                        name="name"
                                        className="cs-field-input"
                                        type="text"
                                        placeholder="e.g. Rohan Mehta"
                                        autoComplete="name"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                    />
                                </div>
                                <div className="cs-field">
                                    <label className="cs-field-label">Phone Number</label>
                                    <input
                                        id="cs-phone"
                                        name="phone"
                                        className="cs-field-input"
                                        type="tel"
                                        placeholder="+91 98765 43210"
                                        autoComplete="tel"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="cs-modal-footer">
                                <button className="cs-btn-ghost" onClick={() => setStep(2)}>← Back</button>
                                <button
                                    className="cs-btn-primary"
                                    disabled={!name.trim() || !phone.trim()}
                                    onClick={handleSubmit}
                                >
                                    Confirm Booking
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─── Main Section ────────────────────────────────── */
export default function ConsultingSection() {
    const [showModal, setShowModal] = useState(false);

    return (
        <>
            <section className="cs-section">
                {/* Decorative background blobs */}
                <div className="cs-blob cs-blob-1" />
                <div className="cs-blob cs-blob-2" />

                <div className="cs-inner">
                    {/* ── Left: Graphic ── */}
                    <div className="cs-graphic-wrap">
                        <div className="cs-graphic-card">
                            {/* Floating stat pill */}
                            <div className="cs-stat-pill cs-stat-top">
                                <span className="cs-stat-num">2,400+</span>
                                <span className="cs-stat-txt">Families Guided</span>
                            </div>

                            {/* Main illustration area */}
                            <div className="cs-illustration">
                                <div className="cs-illustration-bg" />
                                {/* Stylised building silhouette */}
                                <svg className="cs-building-svg" viewBox="0 0 240 260" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    {/* Ground */}
                                    <rect x="0" y="245" width="240" height="4" rx="2" fill="#E8EEF7" />
                                    {/* Building A */}
                                    <rect x="20" y="100" width="70" height="145" rx="6" fill="#1E3A6E" />
                                    <rect x="28" y="112" width="14" height="14" rx="2" fill="#F1D97A" opacity="0.9" />
                                    <rect x="48" y="112" width="14" height="14" rx="2" fill="#F1D97A" opacity="0.5" />
                                    <rect x="28" y="134" width="14" height="14" rx="2" fill="#F1D97A" opacity="0.7" />
                                    <rect x="48" y="134" width="14" height="14" rx="2" fill="#F1D97A" opacity="0.9" />
                                    <rect x="28" y="156" width="14" height="14" rx="2" fill="#F1D97A" opacity="0.4" />
                                    <rect x="48" y="156" width="14" height="14" rx="2" fill="#F1D97A" opacity="0.8" />
                                    <rect x="28" y="178" width="14" height="14" rx="2" fill="#F1D97A" opacity="0.9" />
                                    <rect x="48" y="178" width="14" height="14" rx="2" fill="#F1D97A" opacity="0.6" />
                                    <rect x="33" y="210" width="24" height="35" rx="3" fill="#2a4a80" />
                                    {/* Building B (tall center) */}
                                    <rect x="100" y="50" width="60" height="195" rx="6" fill="#16386D" />
                                    <rect x="108" y="62" width="16" height="16" rx="2" fill="#F1D97A" opacity="0.9" />
                                    <rect x="130" y="62" width="16" height="16" rx="2" fill="#F1D97A" opacity="0.6" />
                                    <rect x="108" y="86" width="16" height="16" rx="2" fill="#F1D97A" opacity="0.5" />
                                    <rect x="130" y="86" width="16" height="16" rx="2" fill="#F1D97A" opacity="0.9" />
                                    <rect x="108" y="110" width="16" height="16" rx="2" fill="#F1D97A" opacity="0.7" />
                                    <rect x="130" y="110" width="16" height="16" rx="2" fill="#F1D97A" opacity="0.4" />
                                    <rect x="108" y="134" width="16" height="16" rx="2" fill="#F1D97A" opacity="0.9" />
                                    <rect x="130" y="134" width="16" height="16" rx="2" fill="#F1D97A" opacity="0.8" />
                                    <rect x="108" y="158" width="16" height="16" rx="2" fill="#F1D97A" opacity="0.6" />
                                    <rect x="130" y="158" width="16" height="16" rx="2" fill="#F1D97A" opacity="0.9" />
                                    <rect x="116" y="198" width="28" height="47" rx="3" fill="#1a3060" />
                                    {/* Building C */}
                                    <rect x="170" y="120" width="55" height="125" rx="6" fill="#1E3A6E" />
                                    <rect x="178" y="132" width="12" height="12" rx="2" fill="#F1D97A" opacity="0.8" />
                                    <rect x="196" y="132" width="12" height="12" rx="2" fill="#F1D97A" opacity="0.5" />
                                    <rect x="178" y="152" width="12" height="12" rx="2" fill="#F1D97A" opacity="0.9" />
                                    <rect x="196" y="152" width="12" height="12" rx="2" fill="#F1D97A" opacity="0.7" />
                                    <rect x="178" y="172" width="12" height="12" rx="2" fill="#F1D97A" opacity="0.4" />
                                    <rect x="196" y="172" width="12" height="12" rx="2" fill="#F1D97A" opacity="0.9" />
                                    <rect x="178" y="192" width="12" height="12" rx="2" fill="#F1D97A" opacity="0.6" />
                                    <rect x="196" y="192" width="12" height="12" rx="2" fill="#F1D97A" opacity="0.9" />
                                    <rect x="180" y="215" width="22" height="30" rx="3" fill="#2a4a80" />
                                    {/* Moon / glow */}
                                    <circle cx="200" cy="30" r="18" fill="#F1D97A" opacity="0.15" />
                                    <circle cx="200" cy="30" r="12" fill="#F1D97A" opacity="0.25" />
                                </svg>

                                {/* Consultant avatar bubble */}
                                <div className="cs-avatar-bubble">
                                    <div className="cs-avatar-img">
                                        <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="28" cy="28" r="28" fill="#1E3A6E" />
                                            <circle cx="28" cy="22" r="10" fill="#F1D97A" opacity="0.9" />
                                            <ellipse cx="28" cy="46" rx="16" ry="10" fill="#F1D97A" opacity="0.7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="cs-avatar-name">Expert Advisor</div>
                                        <div className="cs-avatar-status">
                                            <span className="cs-online-dot" />
                                            Online now
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom stat pill */}
                            <div className="cs-stat-pill cs-stat-bottom">
                                <span className="cs-stat-num">⭐ 4.9</span>
                                <span className="cs-stat-txt">Avg. rating</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Right: Content ── */}
                    <div className="cs-content">
                        <div className="cs-eyebrow">
                            <span className="cs-eyebrow-dot" />
                            Free Expert Consultation
                        </div>

                        <h2 className="cs-headline">
                            Buy Smarter.<br />
                            <span className="cs-headline-accent">Not Harder.</span>
                        </h2>

                        <p className="cs-subheadline">
                            Skip the confusion. Our property experts have helped thousands of
                            families find the right home at the right price — with zero brokerage
                            and zero pressure.
                        </p>

                        <ul className="cs-perks">
                            <li className="cs-perk">
                                <span className="cs-perk-icon">🏠</span>
                                Personalised shortlisting based on your needs
                            </li>
                            <li className="cs-perk">
                                <span className="cs-perk-icon">💰</span>
                                Price negotiation &amp; ROI analysis
                            </li>
                            <li className="cs-perk">
                                <span className="cs-perk-icon">📋</span>
                                Legal &amp; documentation guidance
                            </li>
                        </ul>

                        <div className="cs-cta-row">
                            <button
                                className="cs-cta-btn"
                                onClick={() => setShowModal(true)}
                            >
                                <span>Take Guidance Now</span>
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                    <path d="M4 9h10M10 5l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            <span className="cs-cta-note">No commitment. 100% free.</span>
                        </div>
                    </div>
                </div>
            </section>

            {showModal && <ScheduleModal onClose={() => setShowModal(false)} />}
        </>
    );
}

