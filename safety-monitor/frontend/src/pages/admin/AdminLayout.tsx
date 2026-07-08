import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useHealth } from '../../contexts/HealthContext'
import { alertsAPI } from '../../services/api'

const navItems = [
  { section: 'Main', items: [
    { path: '/', label: 'Dashboard', icon: '\u2302' },
    { path: '/cctv', label: 'Live CCTV', icon: '\u25D9' },
    { path: '/alerts', label: 'Alerts', icon: '\u26A0', badge: true },
  ]},
  { section: 'Management', items: [
    { path: '/violations', label: 'Violations', icon: '\u26D4' },
    { path: '/fines', label: 'Fines', icon: '\u20B9' },
    { path: '/workers', label: 'Workers', icon: '\u263A' },
    { path: '/videos', label: 'Videos', icon: '\u25B6', roles: ['admin', 'safety_officer'] },
  ]},
  { section: 'Safety Officer', items: [
    { path: '/incident-review', label: 'Incident Review', icon: '\u2705', roles: ['admin', 'safety_officer'] },
    { path: '/employee-verification', label: 'Verify Employee', icon: '\u1F9D1', roles: ['admin', 'safety_officer'] },
    { path: '/penalty-rules', label: 'Penalty Rules', icon: '\u2696', roles: ['admin', 'safety_officer'] },
  ]},
  { section: 'Reports & Analytics', items: [
    { path: '/reports', label: 'Reports', icon: '\u2261' },
    { path: '/analytics', label: 'Analytics', icon: '\u25B2' },
  ]},
  { section: 'Programs', items: [
    { path: '/schemes', label: 'Govt Schemes', icon: '\u2605' },
    { path: '/training', label: 'Training', icon: '\u2699' },
    { path: '/quiz', label: 'Quiz', icon: '\u2753' },
    { path: '/leaderboard', label: 'Leaderboard', icon: '\u262A' },
  ]},
  { section: 'System', items: [
    { path: '/emergency', label: 'Emergency', icon: '\u2622' },
    { path: '/settings', label: 'Settings', icon: '\u2630' },
  ]},
]

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth()
  const { connected, error } = useHealth()
  const navigate = useNavigate()
  const [alertCount, setAlertCount] = useState(0)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await alertsAPI.list({ is_read: false, limit: 1 })
        setAlertCount(res.data.total || 0)
      } catch {}
    }
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 15000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">CS</div>
            <div>
              <div className="sidebar-logo-text">Safety Monitor</div>
              <div className="sidebar-logo-sub">Construction Site</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((section) => (
            <React.Fragment key={section.section}>
              <div className="nav-section">{section.section}</div>
              {section.items.map((item) => {
                // Filter nav items by role if roles are specified
                if ('roles' in item && item.roles && !item.roles.includes(user?.role || '')) return null
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {item.label}
                    {'badge' in item && item.badge && alertCount > 0 && (
                      <span className="nav-badge">{alertCount > 99 ? '99+' : alertCount}</span>
                    )}
                  </NavLink>
                )
              })}
            </React.Fragment>
          ))}
        </nav>
      </aside>

      <div className="main-area">
        <header className="top-header">
          <div className="header-left">
            <span className="header-title">Safety Monitoring Center</span>
          </div>
          <div className="header-right">
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
              {currentTime.toLocaleTimeString()}
            </span>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              {user?.full_name}
            </div>
            <button className="btn btn-outline btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        {!connected && (
          <div style={{
            background: 'var(--color-danger)', color: '#fff', textAlign: 'center',
            padding: '4px 16px', fontSize: 12, fontWeight: 600
          }}>
            {'\u26A0'} Connection Lost: {error || 'Backend unavailable'} — Retrying every 5s...
          </div>
        )}
        <div className="content-area">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AdminLayout
