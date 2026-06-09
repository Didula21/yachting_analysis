import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Import the client-side routing hook
import heroVideo from "../assets/hero-video.mp4";
import '../styles/Home.css';

const Home = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate(); // 2. Initialize the navigation pipeline routing hook

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="homepage">

      {/* ── NAVBAR ── */}
      <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
        <div className="navbar__inner">

          {/* Logo */}
          <div className="navbar__logo">
            <div className="logo-badge" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img 
                src="/logo.png" 
                alt="Yachting Pages Logo" 
                className="navbar__logo-img"
                style={{
                  width: '36px',
                  height: '36px',
                  objectFit: 'contain',
                  borderRadius: '6px'
                }} 
              />
              <div className="logo-badge__text">
                <span className="logo-badge__title">YACHTING PAGES</span>
                <span className="logo-badge__sub">MEDIA GROUP</span>
              </div>
            </div>
          </div>

          {/* Desktop nav */}
          <ul className="navbar__links">
            <li><button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer' }}>Dashboard</button></li>
            <li><a href="#insights">Insights</a></li>
            <li><a href="#reports">Reports</a></li>
            <li><a href="#companies">Companies</a></li>
            <li className="navbar__dropdown">
              <a href="#resources">
                Resources
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </li>
          </ul>

          {/* Hamburger */}
          <button
            className={`navbar__hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>

        {/* Mobile menu */}
        <div className={`navbar__mobile ${menuOpen ? 'navbar__mobile--open' : ''}`}>
          <a href="#dashboard" onClick={() => { setMenuOpen(false); navigate('/dashboard'); }}>Dashboards</a>
          <a href="#insights" onClick={() => setMenuOpen(false)}>Insights</a>
          <a href="#reports" onClick={() => setMenuOpen(false)}>Reports</a>
          <a href="#companies" onClick={() => setMenuOpen(false)}>Companies</a>
          <a href="#resources" onClick={() => setMenuOpen(false)}>Resources</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">

        {/* Video background */}
        <div className="video-background">
          <video autoPlay muted loop playsInline>
            <source src={heroVideo} type="video/mp4" />
          </video>
          <div className="video-overlay" />
        </div>

        {/* Vignette edges */}
        <div className="hero__vignette" />

        {/* Content */}
        <div className="hero__content">

          {/* Eyebrow */}
          <div className="hero__eyebrow">
            <span className="eyebrow-dot" />
            Marine Analytics Intelligence
          </div>

          {/* Heading */}
          <h1 className="hero__heading">
            <span className="hero__heading-line hero__heading-line--1">Yachting Pages</span>
            <span className="hero__heading-line hero__heading-line--2">
              Analytics{' '}
              <span className="hero__heading-gradient">Platform</span>
            </span>
          </h1>

          {/* Divider */}
          <div className="hero__divider" />

          {/* Sub-heading */}
          <p className="hero__subheading">
            Powerful insights. Smarter decisions.
          </p>

          {/* Description */}
          <p className="hero__desc">
            Track performance, understand your audience,<br className="br-desktop" />
            and grow your business with real-time marine<br className="br-desktop" />
            analytics and market intelligence.
          </p>

          {/* CTA Buttons */}
          <div className="hero__buttons">
            {/* Primary Button: Navigate directly to local file data ingestion app pipeline */}
            <button onClick={() => navigate('/dashboard')} className="btn btn--primary" style={{ border: 'none', cursor: 'pointer' }}>
              <span className="btn__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M3 17l4-8 4 4 4-6 4 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              Enquiries Analytics
              <span className="btn__arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </button>

            {/* CHANGED: Anchor tag modified to button executing SPA navigate hook to /advanced-dashboards */}
            <button 
              onClick={() => navigate('/advanced-dashboards')} 
              className="btn btn--secondary"
              style={{ border: 'none', cursor: 'pointer' }}
            >
              <span className="btn__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="12" width="4" height="9" rx="1" stroke="currentColor" strokeWidth="2"/>
                  <rect x="10" y="7" width="4" height="14" rx="1" stroke="currentColor" strokeWidth="2"/>
                  <rect x="17" y="3" width="4" height="18" rx="1" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </span>
              Advanced Power BI Dashboards
              <span className="btn__arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </button>
          </div>

          {/* Feature badges */}
          <div className="hero__features">

            <div className="feature-item">
              <div className="feature-item__icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="feature-item__text">
                <span className="feature-item__label">Trusted by marine</span>
                <span className="feature-item__sub">professionals worldwide</span>
              </div>
            </div>

            <div className="feature-divider" />

            <div className="feature-item">
              <div className="feature-item__icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  <path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="feature-item__text">
                <span className="feature-item__label">50K+ companies</span>
                <span className="feature-item__sub">global marine database</span>
              </div>
            </div>

            <div className="feature-divider" />

            <div className="feature-item">
              <div className="feature-item__icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="feature-item__text">
                <span className="feature-item__label">Real-time analytics</span>
                <span className="feature-item__sub">live data &amp; updates</span>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;