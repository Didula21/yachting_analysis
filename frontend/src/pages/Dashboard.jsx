import Chart from 'chart.js/auto';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';

function Dashboard() {
  const navigate = useNavigate(); 

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileDetails, setFileDetails] = useState({ name: '—', size: '—' });
  const [isFileReady, setIsFileReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [downloadBlob, setDownloadBlob] = useState(null);

  // KPI Metrics States
  const [kpis, setKpis] = useState({ total: 0, unique: 0, multi: 0, crossCountry: 0 });
  const [previewRows, setPreviewRows] = useState([]);
  const [previewCols, setPreviewCols] = useState([]);

  // Excel-Style Interactive Data Grid States
  const [columnFilters, setColumnFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Chart References
  const chartWeekdayRef = useRef(null);
  const chartCountryRef = useRef(null);
  const chartMultiRef = useRef(null);
  const chartTimeRef = useRef(null);

  const chartInstances = useRef({});

  // Initialize empty charts on component mount
  useEffect(() => {
    const commonTicks = { color: 'rgba(148,163,184,0.8)', font: { family: 'Outfit', size: 11 } };
    const gridStyle = { color: 'rgba(255,255,255,0.05)' };

    chartInstances.current.weekday = new Chart(chartWeekdayRef.current, {
      type: 'bar',
      data: { labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], datasets: [{ data: [0,0,0,0,0,0,0], backgroundColor: 'rgba(255,46,166,0.8)', borderRadius: 4 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: gridStyle, ticks: commonTicks }, y: { grid: gridStyle, ticks: commonTicks } } }
    });

    chartInstances.current.country = new Chart(chartCountryRef.current, {
      type: 'doughnut',
      data: { labels: ['No Data'], datasets: [{ data: [1], backgroundColor: ['rgba(148,163,184,0.2)'] }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'right', labels: { color: 'rgba(148,163,184,0.8)' } } } }
    });

    chartInstances.current.multi = new Chart(chartMultiRef.current, {
      type: 'pie',
      data: { labels: ['No Data'], datasets: [{ data: [1], backgroundColor: ['rgba(148,163,184,0.2)'] }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: 'rgba(148,163,184,0.8)' } } } }
    });

    chartInstances.current.time = new Chart(chartTimeRef.current, {
      type: 'line',
      data: { labels: Array.from({length: 24}, (_,i) => `${i}:00`), datasets: [{ label: 'Enquiries', data: Array(24).fill(0), borderColor: 'rgba(255,46,166,0.8)', backgroundColor: 'rgba(255,46,166,0.1)', fill: true, tension: 0.4 }] },
      options: { 
        responsive: true, 
        maintainAspectRatio: false, 
        plugins: { legend: { display: false } }, 
        scales: { 
          x: { grid: gridStyle, ticks: commonTicks }, 
          y: { 
            grid: gridStyle, 
            ticks: {
              color: 'rgba(148,163,184,0.8)',
              font: { family: 'Outfit', size: 11 },
              precision: 0 
            }, 
            beginAtZero: true 
          } 
        } 
      }
    });

    return () => {
      Object.values(chartInstances.current).forEach(instance => instance.destroy());
    };
  }, []);

  // Data Grid Data Handling Handlers
  const handleFilterChange = (columnName, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnName]: value
    }));
  };

  const handleColumnSort = (columnName) => {
    let direction = 'asc';
    if (sortConfig.key === columnName && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key: columnName, direction });
  };

  const getProcessedRows = () => {
    let processed = [...previewRows];

    Object.keys(columnFilters).forEach(colName => {
      const query = columnFilters[colName]?.toLowerCase().trim();
      if (query) {
        processed = processed.filter(row => 
          row[colName] !== null && 
          row[colName] !== undefined && 
          String(row[colName]).toLowerCase().includes(query)
        );
      }
    });

    if (sortConfig.key) {
      processed.sort((a, b) => {
        let valA = a[sortConfig.key] !== null ? String(a[sortConfig.key]) : '';
        let valB = b[sortConfig.key] !== null ? String(b[sortConfig.key]) : '';
        
        return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' }) * (sortConfig.direction === 'asc' ? 1 : -1);
      });
    }

    return processed;
  };

  const processFileSelection = (file) => {
    if (!file) return;
    setSelectedFile(file);
    setFileDetails({ name: file.name, size: `${(file.size / 1024 / 1024).toFixed(2)} MB` });
    setIsFileReady(true);
  };

  const handleUploadPipeline = async () => {
    if (!selectedFile) return alert("Please map an incoming spreadsheet source file.");
    setIsProcessing(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Dataframe aggregation failure.");

      // Update Local State Elements
      setKpis({
        total: result.analytics.total_enquiries,
        unique: result.analytics.unique_listings,
        multi: result.analytics.multiquote_count,
        crossCountry: result.analytics.same_country_yes
      });

      if (result.analytics.preview?.length > 0) {
        setPreviewCols(Object.keys(result.analytics.preview[0]));
        setPreviewRows(result.analytics.preview); // Loads all rows dynamically
        setColumnFilters({}); 
        setSortConfig({ key: null, direction: 'asc' });
      }

      // Update Chart Telemetry - Weekday
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      chartInstances.current.weekday.data.datasets[0].data = days.map(d => result.analytics.weekday_distribution[d] || 0);
      chartInstances.current.weekday.update();

      // Update Chart Telemetry - Country
      const countries = Object.keys(result.analytics.country_distribution);
      if (countries.length > 0) {
        chartInstances.current.country.data.labels = countries;
        chartInstances.current.country.data.datasets[0].data = Object.values(result.analytics.country_distribution);
        chartInstances.current.country.data.datasets[0].backgroundColor = ['rgba(255,46,166,0.7)', 'rgba(56,189,248,0.6)', 'rgba(217,70,239,0.6)', 'rgba(255,46,166,0.4)', 'rgba(148,163,184,0.3)'];
        chartInstances.current.country.update();
      }

      // Update Chart Telemetry - Multiquote
      const multiquoteData = result.analytics.multiquote_distribution;
      const multiquoteLabels = Object.keys(multiquoteData);
      
      if (multiquoteLabels.length > 0) {
        chartInstances.current.multi.data.labels = multiquoteLabels;
        chartInstances.current.multi.data.datasets[0].data = Object.values(multiquoteData);
        chartInstances.current.multi.data.datasets[0].backgroundColor = [
          'rgba(56,189,248,0.6)',  
          'rgba(255,46,166,0.6)',  
          'rgba(217,70,239,0.5)',  
          'rgba(148,163,184,0.3)'   
        ];
        chartInstances.current.multi.update();
      }

      // Update Chart Telemetry - Hourly Time Volume
      const timeData = result.analytics.time_distribution;
      const hourlyCounts = Array(24).fill(0);
      
      for (let hour = 0; hour < 24; hour++) {
        if (timeData[hour] !== undefined) {
          hourlyCounts[hour] = timeData[hour];
        }
      }
      
      chartInstances.current.time.data.datasets[0].data = hourlyCounts;
      chartInstances.current.time.update();

      // Convert Base64 array string back to a file download link element 
      const byteCharacters = atob(result.file);
      const byteNumbers = Array.from(byteCharacters, char => char.charCodeAt(0));
      const byteArray = new Uint8Array(byteNumbers);
      setDownloadBlob(new Blob([byteArray], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));

      setIsProcessing(false);
      setShowSuccess(false); 
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      alert("Pipeline Processing Exception: " + err.message);
    }
  };

  const executeFileDownload = () => {
    if (!downloadBlob) return;
    const url = window.URL.createObjectURL(downloadBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "processed_crew_analytics.xlsx";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">
            <img src="/logo.png" alt="Logo" className="logo-img" />
            <div>
              <div className="logo-text">Enquiry Analytics</div>
              <div className="logo-sub">YACHT INTELLIGENCE</div>
            </div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">Main</div>
          <div className="nav-item active">🧭 Dashboard</div>
          
          <div 
            className="nav-item" 
            onClick={() => navigate('/')} 
            style={{ marginTop: '4px', cursor: 'pointer' }}
          >
            <span className="nav-icon">↩️</span> Back to Home
          </div>
        </nav>
      </aside>

      {/* DASHBOARD CONTAINER SECTION WORKSPACE */}
      <main className="main">
        <div className="hero">
          <div className="hero-bg"></div>
          <div className="hero-yacht"></div>
          <div className="hero-grid"></div>
          <div className="hero-content">
            <div className="hero-badge"><div className="badge-dot"></div> AI Powered Analytics</div>
            <h1 className="hero-title">Enquiry Analytics Engine</h1>
            <p className="hero-sub">Analyze vessel enquiries seamlessly with verified reference data cross matching and crew metadata parameters.</p>
          </div>
          <div className="hero-wave"></div>
        </div>

        <div className="content">
          
          {/* DYNAMIC DOWNLOAD ROW */}
          {downloadBlob && (
            <div className="file-info-card show" style={{ background: 'linear-gradient(135deg, rgba(255,46,166,0.1), rgba(7,18,38,0.95))', borderColor: 'var(--pink)', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderRadius: '8px', border: '1px solid rgba(255,46,166,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '24px' }}>🎉</span>
                <div>
                  <div style={{ fontWeight: '600', color: '#fff', fontSize: '15px' }}>Database Enrichment Successfully Compiled!</div>
                  <div style={{ fontSize: '12px', color: 'rgba(148,163,184,0.9)' }}>Fuzzy references matched. Use the action button to grab your updated spreadsheet.</div>
                </div>
              </div>
              <button className="download-btn" onClick={executeFileDownload} style={{ margin: 0, padding: '10px 20px', fontSize: '13px', cursor: 'pointer', boxShadow: '0 0 15px rgba(255,46,166,0.3)' }}>
                ⬇ Download Processed Excel
              </button>
            </div>
          )}

          {/* STATS INFRASTRUCTURE */}
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-label">Total Enquiries</div><div className="stat-value">{kpis.total.toLocaleString()}</div></div>
            <div className="stat-card"><div className="stat-label">Unique Listings</div><div className="stat-value">{kpis.unique.toLocaleString()}</div></div>
            <div className="stat-card"><div className="stat-label">Multiquote Count</div><div className="stat-value">{kpis.multi.toLocaleString()}</div></div>
            <div className="stat-card"><div className="stat-label">Same Country Matches</div><div className="stat-value">{kpis.crossCountry.toLocaleString()}</div></div>
          </div>

          {/* DRAG AND DROP INTERACTIVE UPLOAD MATRIX BOX CARD */}
          <div className="upload-card" onClick={() => document.getElementById('reactFileInput').click()}>
            <div className="upload-icon-wrap">📊</div>
            <h3 className="upload-title">Drop your spreadsheet workbook here</h3>
            <p className="upload-sub">Accepts tabular standard .xlsx, .xls, or formatted .csv records</p>
            <input type="file" id="reactFileInput" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={(e) => processFileSelection(e.target.files[0])} />
          </div>

          {isFileReady && (
            <div className="file-info-card show">
              <div className="file-success-icon">✅</div>
              <div className="file-details">
                <div className="file-name">{fileDetails.name}</div>
                <div className="file-meta"><span>{fileDetails.size}</span></div>
              </div>
            </div>
          )}

          {/* PREVIEW CONTAINER WINDOW WITH EXCEL-STYLE COLUMN FILTERS */}
          {previewRows.length > 0 && (
            <div id="tableSection" style={{ marginTop: '32px' }}>
              <div className="section-header">
                <h2 className="section-title">🗂 Spreadsheet Preview Matrix</h2>
                <div className="section-line"></div>
                <div className="section-badge" style={{ background: 'rgba(255,46,166,0.1)', color: 'var(--pink2)' }}>
                  Interactive Filter View ({getProcessedRows().length} / {previewRows.length} rows)
                </div>
              </div>

              <div className="table-wrap" style={{ background: 'var(--bg1)', border: '1px solid rgba(255,46,166,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
                {/* Fixed internal scrolling wrapper to gracefully support endless data entries without page stretching */}
                <div className="table-scroll" style={{ overflowX: 'auto', maxHeight: '480px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: '#071226', zIndex: 10, borderBottom: '2px solid rgba(255,46,166,0.2)' }}>
                      <tr>
                        {previewCols.map((col, idx) => (
                          <th key={idx} style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            <div 
                              onClick={() => handleColumnSort(col)} 
                              style={{ fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', marginBottom: '8px' }}
                            >
                              {col} 
                              <span style={{ color: 'var(--pink2)', fontSize: '10px' }}>
                                {sortConfig.key === col ? (sortConfig.direction === 'asc' ? '🔼' : '🔽') : '↕️'}
                              </span>
                            </div>
                            <input
                              type="text"
                              placeholder={`Filter ${col}...`}
                              value={columnFilters[col] || ''}
                              onChange={(e) => handleFilterChange(col, e.target.value)}
                              style={{ width: '100%', minWidth: '120px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,46,166,0.15)', borderRadius: '6px', padding: '5px 8px', fontSize: '12px', color: '#fff', outline: 'none' }}
                            />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {getProcessedRows().length > 0 ? (
                        getProcessedRows().map((row, rIdx) => (
                          <tr key={rIdx} style={{ borderBottom: '1px solid rgba(255,46,166,0.05)', backgroundColor: rIdx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                            {previewCols.map((col, cIdx) => {
                              let val = row[col] !== null && row[col] !== undefined ? String(row[col]) : '';
                              if (val === 'Yes' || val === 'Single') {
                                return <td key={cIdx} style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}><span className="cell-badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', padding: '2px 8px', borderRadius: '6px', fontSize: '11px' }}>{val}</span></td>;
                              }
                              if (val === 'No') {
                                return <td key={cIdx} style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}><span className="cell-badge" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', padding: '2px 8px', borderRadius: '6px', fontSize: '11px' }}>{val}</span></td>;
                              }
                              if (val.includes('multiquote') || val === 'Repeat') {
                                return <td key={cIdx} style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}><span className="cell-badge" style={{ background: 'rgba(217,70,239,0.15)', color: 'var(--pink2)', padding: '2px 8px', borderRadius: '6px', fontSize: '11px' }}>{val}</span></td>;
                              }
                              return <td key={cIdx} style={{ padding: '10px 14px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{val}</td>;
                            })}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={previewCols.length} style={{ padding: '32px', textAlign: 'center', color: 'var(--text3)' }}>
                            🚫 No records matching your active column filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VISUALIZATION CONTAINER BLOCK SECTIONS */}
          <div className="charts-grid" style={{ marginTop: '32px' }}>
            <div className="chart-card"><div className="chart-title">Enquiries by Day of Week</div><div style={{ position: 'relative', height: '200px' }}><canvas ref={chartWeekdayRef}></canvas></div></div>
            <div className="chart-card"><div className="chart-title">Country Distribution</div><div style={{ position: 'relative', height: '200px' }}><canvas ref={chartCountryRef}></canvas></div></div>
            <div className="chart-card"><div className="chart-title">Multiquote Classification</div><div style={{ position: 'relative', height: '200px' }}><canvas ref={chartMultiRef}></canvas></div></div>
            <div className="chart-card wide"><div className="chart-title">Time Sent Distribution (Hourly Volume)</div><div style={{ position: 'relative', height: '200px' }}><canvas ref={chartTimeRef}></canvas></div></div>
          </div>

          <div className="cta-wrap">
            <button className="cta-btn" onClick={handleUploadPipeline}>⚡ Analyze Enquiries</button>
          </div>
        </div>
      </main>

      {/* OVERLAY APP ENGAGEMENT LIFE CYCLES */}
      {isProcessing && (
        <div className="processing-overlay show">
          <div className="processing-ring"></div>
          <div className="processing-title">Running Statistical Enrichments...</div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;