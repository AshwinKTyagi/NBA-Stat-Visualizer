import { Routes, Route, NavLink } from 'react-router-dom';
import BracketPage from './pages/BracketPage';
import StandingsPage from './pages/StandingsPage';
import './App.css';

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-wordmark">
          <div className="header-icon">🏀</div>
          <div className="header-text">
            <h1>Playoff Analyzer</h1>
            <p className="subtitle">2025–26 Season · Advanced Stats</p>
          </div>
        </div>
        <nav className="app-nav">
          <NavLink to="/" end className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
            Bracket
          </NavLink>
          <NavLink to="/standings" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
            Standings
          </NavLink>
        </nav>
        <div className="live-badge">
          <span className="live-dot" />
          Live Season
        </div>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<BracketPage />} />
          <Route path="/standings" element={<StandingsPage />} />
        </Routes>
      </main>
    </div>
  );
}
