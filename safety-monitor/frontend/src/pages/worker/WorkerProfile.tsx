import React, { useState, useEffect } from 'react'
import { workersAPI } from '../../services/api'

const WorkerProfile: React.FC = () => {
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await workersAPI.getMyProfile()
      setProfile(res.data)
    } catch {}
  }

  if (!profile) return <div className="loading-screen"><div className="spinner"></div></div>

  return (
    <div>
      <div className="page-header">
        <div className="page-title">My Profile</div>
        <div className="page-subtitle">Your safety performance overview</div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Personal Information</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Name</div>
              <div style={{ fontWeight: 500 }}>{profile.full_name}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Employee ID</div>
              <div style={{ fontWeight: 500 }}>{profile.employee_id}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Email</div>
              <div style={{ fontWeight: 500 }}>{profile.email}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Phone</div>
              <div style={{ fontWeight: 500 }}>{profile.phone || 'N/A'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Department</div>
              <div style={{ fontWeight: 500 }}>{profile.department || 'N/A'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Designation</div>
              <div style={{ fontWeight: 500 }}>{profile.designation || 'N/A'}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Safety Score</div>
          </div>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 120, height: 120, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              background: `conic-gradient(var(--color-success) ${profile.safety_score}%, var(--color-border) ${profile.safety_score}%)`,
              position: 'relative',
            }}>
              <div style={{
                width: 90, height: 90, borderRadius: '50%',
                background: 'var(--color-bg-card)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 800,
                color: profile.safety_score >= 80 ? 'var(--color-success)' : profile.safety_score >= 60 ? 'var(--color-warning)' : 'var(--color-danger)',
              }}>
                {profile.safety_score}
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Safety Score</div>
          </div>
        </div>
      </div>

      <div className="grid grid-3">
        <div className="stat-card">
          <div className="stat-icon red">{'\u26D4'}</div>
          <div className="stat-content">
            <div className="stat-value">{profile.total_violations}</div>
            <div className="stat-label">Total Violations</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">{'\u20B9'}</div>
          <div className="stat-content">
            <div className="stat-value">{'\u20B9'}{profile.total_fine_amount || 0}</div>
            <div className="stat-label">Total Fines</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">{'\u2699'}</div>
          <div className="stat-content">
            <div className="stat-value">{profile.trainings_completed}</div>
            <div className="stat-label">Trainings Completed</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkerProfile
