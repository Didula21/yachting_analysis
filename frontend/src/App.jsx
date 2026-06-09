import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import AdvancedDashboards from './pages/AdvancedDashboards';
import Dashboard from './pages/Dashboard'; // Mounts your new dashboard page
import Home from './pages/Home'; // Keeps your exact original homepage path

function App() {
  return (
    <Router>
      <Routes>
        {/* Your original React home page */}
        <Route path="/" element={<Home />} />
        
        {/* Your premium statistical dashboard layout path */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/advanced-dashboards" element={<AdvancedDashboards />} />
      </Routes>
    </Router>
  );
}

export default App;