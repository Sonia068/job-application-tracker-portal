// components/Layout.js — App shell with navigation & upcoming deadline/interview alert bar

import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const NAV_ITEMS = [
  { path: '/dashboard',    icon: '◈', label: 'Dashboard' },
  { path: '/applications', icon: '☰', label: 'Applications' },
  { path: '/kanban',       icon: '⊞', label: 'Pipeline Board' },
  { path: '/reports',      icon: '◉', label: 'Reports' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [alerts, setAlerts] = useState([]);
  const [alertsDismissed, setAlertsDismissed] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const { data } = await api.get('/applications/alerts/upcoming');
        setAlerts(data.data || []);
      } catch (err) {
        // Silently fail if alerts can't load
      }
    };
    fetchAlerts();
  }, [location.pathname]);

  const initial = user?.name?.charAt(0)?.toUpperCase() || 'U';

  const formatAlertDate = (d) => {
    if (!d) return '';
    const diff = Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return 'Today!';
    if (diff === 1) return 'Tomorrow';
    return `in ${diff} days`;
  };

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">
            <div className="logo-icon">🎯</div>
            <div className="logo-text">Job<span>Track</span></div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-label">Menu</div>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{initial}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-email">{user?.email}</div>
            </div>
            <button className="logout-btn" onClick={logout} title="Logout">⏻</button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="main-content">
        {/* Upcoming Deadline / Interview Alerts Banner */}
        {alerts.length > 0 && !alertsDismissed && (
          <div
            style={{
              background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.12), rgba(59, 130, 246, 0.1))',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 16px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 18 }}>⏰</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-text)' }}>
                Upcoming Reminders:
              </span>
              {alerts.slice(0, 3).map((a) => {
                const isInterview = a.interviewDate && new Date(a.interviewDate) >= new Date();
                const targetDate = isInterview ? a.interviewDate : a.deadlineDate;
                const label = isInterview ? 'Interview' : 'Deadline';
                return (
                  <span
                    key={a._id}
                    style={{
                      fontSize: 12,
                      padding: '2px 8px',
                      background: 'var(--bg-elevated)',
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <strong>{a.company}</strong> ({label} {formatAlertDate(targetDate)})
                  </span>
                );
              })}
              {alerts.length > 3 && (
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  +{alerts.length - 3} more
                </span>
              )}
            </div>
            <button
              onClick={() => setAlertsDismissed(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: 16,
              }}
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        <Outlet />
      </main>
    </div>
  );
}