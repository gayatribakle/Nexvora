import React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const navItems = [
  { path: '/worker', label: 'My Profile', icon: '\u263A', end: true },
  { path: '/worker/violations', label: 'My Violations', icon: '\u26D4' },
  { path: '/worker/fines', label: 'My Fines', icon: '\u20B9' },
  { path: '/worker/schemes', label: 'Govt Schemes', icon: '\u2605' },
  { path: '/worker/leaderboard', label: 'Leaderboard', icon: '\u262A' },
  { path: '/worker/training', label: 'Training', icon: '\u2699' },
  { path: '/worker/quiz', label: 'Quiz', icon: '\u2753' },
]

const WorkerLayout: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

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
              <div className="sidebar-logo-sub">Worker Portal</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">Worker Panel</div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>
            {user?.full_name}
          </div>
          <button className="btn btn-outline btn-sm" style={{ width: '100%' }} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="top-header">
          <div className="header-left">
            <span className="header-title">Worker Portal</span>
          </div>
          <div className="header-right">
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              {user?.full_name}
            </span>
          </div>
        </header>

        <div className="content-area">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default WorkerLayout
