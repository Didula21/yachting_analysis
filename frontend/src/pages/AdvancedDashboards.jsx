import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AdvancedDashboards() {
  const navigate = useNavigate();

  // 1. ADDED: Custom web URLs for each specific Power BI service layout node
  const dashboards = [
    {
      id: 1,
      title: "Keyword Tracking Dashboard",
      description: "Comprehensive evaluation of global SEO keyword metadata rankings, organic visibility index shifts, and search share percentages across regional marine markets.",
      image: "./keyword.png", 
      icon: "📈",
      context: "Strategic search engine performance charts",
      url: "https://app.powerbi.com/links/3LWbQKRqP6?ctid=18db4570-643b-4f69-be18-407af8d85fb6&pbi_source=linkShare" 
    },
    {
      id: 2,
      title: "Keyword Tracking Dashboard - Sales ",
      description: "Tailored conversion-oriented keyword intelligence isolating high-commercial-intent search queries, local landing conversions, and client acquisition pipelines.",
      image: "./Keyword_1.png", 
      icon: "🎯",
      context: "Targeted conversion loops and funnel charts",
      url: "https://app.powerbi.com/links/EQZScyK5O9?ctid=18db4570-643b-4f69-be18-407af8d85fb6&pbi_source=linkShare&bookmarkGuid=470e25a5-68dc-4098-9863-b187e1409ea1"
    },
    {
      id: 3,
      title: "Enquiries Dashboard",
      description: "Core operations data matrix mapping incoming yacht charter and media engagement volumes, response velocity KPIs, and regional communication trends.",
      image: "/dash-enquiries.png", 
      icon: "📊",
      context: "Global telemetry traffic graphs",
      url: "https://app.powerbi.com/links/PEoUYxo60R?ctid=18db4570-643b-4f69-be18-407af8d85fb6&pbi_source=linkShare"
    },
    {
      id: 4,
      title: "Enquiries Dashboard - Sales",
      description: "Deep-dive financial enquiry analytics tracking lead values, account executive touchpoints, closed win-loss distribution models, and pipeline velocities.",
      image: "/dash-enquiries-sales.png", 
      icon: "💼",
      context: "Executive revenue generation pipelines",
      url: "https://app.powerbi.com/links/Mzuf5MDTB-?ctid=18db4570-643b-4f69-be18-407af8d85fb6&pbi_source=linkShare&bookmarkGuid=93a907db-b478-431c-a7b8-83a3ffb75842"
    },
    {
      id: 5,
      title: "Google Country Data Dashboard",
      description: "Geographical traffic and engagement hub aggregating audience demographic streams, country-level interaction densities, and localization performance.",
      image: "/dash-google-country.png", 
      icon: "🌍",
      context: "Interactive map vectors and density nodes",
      url: "https://app.powerbi.com/links/oaiuR9JRaG?ctid=18db4570-643b-4f69-be18-407af8d85fb6&pbi_source=linkShare"
    },
    {
      id: 6,
      title: "Print Drop-Out Data Dashboard",
      description: "Specialized production tracking module visualizing print distribution lifecycle performance, dropout drop-rates, plant capacity metrics, and media drop configurations.",
      image: "/print.png", 
      icon: "🏭",
      context: "Factory workflow lines and yield bar charts",
      url: "https://app.powerbi.com/links/Qb9sraeGqR?ctid=18db4570-643b-4f69-be18-407af8d85fb6&pbi_source=linkShare"
    }
  ];

  const [hoveredCard, setHoveredCard] = useState(null);

  const styles = {
    layout: {
      minHeight: '100vh',
      backgroundColor: '#071226', 
      color: '#f8fafc',
      padding: '40px 24px',
      fontFamily: "'Outfit', 'Inter', sans-serif"
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto'
    },
    header: {
      marginBottom: '48px'
    },
    backButton: {
      background: 'none',
      border: 'none',
      color: 'rgba(255, 46, 166, 0.8)', 
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '0 0 12px 0',
      transition: 'color 0.2s ease, transform 0.2s ease'
    },
    titleSection: {
      marginTop: '8px'
    },
    title: {
      fontSize: '32px',
      fontWeight: '700',
      letterSpacing: '-0.02em',
      margin: '0 0 8px 0',
      color: '#ffffff'
    },
    subtitle: {
      fontSize: '15px',
      color: '#94a3b8', 
      margin: 0,
      maxWidth: '600px',
      lineHeight: '1.5'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', 
      gap: '32px'
    },
    card: (isHovered) => ({
      background: 'rgba(15, 23, 42, 0.55)', 
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderRadius: '16px',
      border: isHovered ? '1px solid #ff2ea6' : '1px solid rgba(255, 46, 166, 0.15)', 
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      cursor: 'pointer',
      transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
      boxShadow: isHovered ? '0 15px 35px -10px rgba(255, 46, 166, 0.2)' : 'none', 
      transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
    }),
    imageContainer: {
      width: '100%',
      height: '180px',
      borderRadius: '10px',
      marginBottom: '20px',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      position: 'relative',
      overflow: 'hidden',
      background: '#0c1933'
    },
    dashboardImg: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transition: 'transform 0.5s ease'
    },
    fallbackGradient: {
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, rgba(255, 46, 166, 0.08), rgba(7, 18, 38, 0.9))',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    },
    cardTitle: {
      fontSize: '19px',
      fontWeight: '600',
      color: '#ffffff',
      margin: '0 0 10px 0',
      lineHeight: '1.3'
    },
    cardDescription: {
      fontSize: '13px',
      color: '#94a3b8',
      lineHeight: '1.6',
      margin: '0 0 28px 0',
      flexGrow: 1
    },
    premiumCta: (isHovered) => ({
      width: '100%',
      padding: '12px 20px',
      borderRadius: '8px',
      background: isHovered 
        ? 'linear-gradient(135deg, #ff2ea6 0%, #a855f7 100%)' 
        : 'linear-gradient(135deg, rgba(255, 46, 166, 0.85) 0%, rgba(147, 51, 234, 0.85) 100%)',
      color: '#ffffff', 
      fontSize: '13px',
      fontWeight: '600',
      letterSpacing: '0.02em',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      boxShadow: isHovered ? '0 0 20px rgba(255, 46, 166, 0.4)' : 'none',
      transition: 'all 0.2s ease',
      transform: isHovered ? 'scale(1.02)' : 'scale(1)'
    }),
    ctaArrow: (isHovered) => ({
      display: 'inline-block',
      transition: 'transform 0.2s ease',
      transform: isHovered ? 'translateX(4px)' : 'translateX(0)'
    })
  };

  // 2. ADDED: Centralized click handler that prevents card nesting issues and triggers secure new tabs
  const handleLaunchDashboard = (e, url) => {
    e.stopPropagation(); // Stops parent container click triggers
    if (!url || url.includes("YOUR_")) {
      return alert("Please map a valid Power BI shared web link variable here.");
    }
    window.open(url, '_blank', 'noopener,noreferrer'); // Safely opens link in a new browser window
  };

  return (
    <div style={styles.layout}>
      <div style={styles.container}>
        
        {/* ── HEADER NAVIGATION SUITE ── */}
        <header style={styles.header}>
          <button 
            style={styles.backButton} 
            onClick={() => navigate('/dashboard')}
            onMouseEnter={(e) => { e.target.style.color = '#ffffff'; e.target.style.transform = 'translateX(-2px)'; }}
            onMouseLeave={(e) => { e.target.style.color = 'rgba(255, 46, 166, 0.8)'; e.target.style.transform = 'translateX(0)'; }}
          >
            ← Back to Operations
          </button>
          
          <div style={styles.titleSection}>
            <h1 style={styles.title}>Yachting Pages Analytics Suites</h1>
            <p style={styles.subtitle}>
              Access underlying system data streams via our integrated Power BI visualization modules to process executive market intelligence.
            </p>
          </div>
        </header>

        {/* ── CORE RESPONSIVE MATRIX GRID ── */}
        <section style={styles.grid}>
          {dashboards.map((dash) => {
            const isHovered = hoveredCard === dash.id;
            
            return (
              <div
                key={dash.id}
                style={styles.card(isHovered)}
                onMouseEnter={() => setHoveredCard(dash.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={(e) => handleLaunchDashboard(e, dash.url)} // Clicking anywhere on the card launches it
              >
                {/* Visual Dashboard Image Container */}
                <div style={styles.imageContainer}>
                  {dash.image ? (
                    <img 
                      src={dash.image} 
                      alt={dash.title} 
                      style={{
                        ...styles.dashboardImg,
                        transform: isHovered ? 'scale(1.06)' : 'scale(1)' 
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const fallback = document.getElementById(`fallback-${dash.id}`);
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}

                  {/* Fallback Layout Node */}
                  <div id={`fallback-${dash.id}`} style={{...styles.fallbackGradient, display: dash.image ? 'none' : 'flex'}}>
                    <span style={{ fontSize: '36px', marginBottom: '6px' }}>{dash.icon}</span>
                    <span style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{dash.context}</span>
                  </div>
                </div>

                {/* Typography Metadata */}
                <h3 style={styles.cardTitle}>{dash.title}</h3>
                <p style={styles.cardDescription}>{dash.description}</p>

                {/* 3. UPDATED: Button captures click properties and links directly */}
                <button 
                  style={styles.premiumCta(isHovered)}
                  onClick={(e) => handleLaunchDashboard(e, dash.url)}
                >
                  <span>Link to the Power BI Dashboard ⚡</span>
                  <span style={styles.ctaArrow(isHovered)}>→</span>
                </button>
              </div>
            );
          })}
        </section>

      </div>
    </div>
  );
}

export default AdvancedDashboards;