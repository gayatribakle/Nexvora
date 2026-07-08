import React, { useState, useEffect } from 'react'
import { schemesAPI } from '../../services/api'

// Department color map
const deptColors: Record<string, string> = {
  'Ministry of Labour & Employment': '#2563eb',
  'Ministry of Finance': '#7c3aed',
  'Ministry of Health & Family Welfare': '#059669',
  'Ministry of Housing & Urban Affairs': '#d97706',
  'Ministry of Skill Development': '#dc2626',
}

const deptBadgeStyle = (dept: string): React.CSSProperties => ({
  display: 'inline-block',
  padding: '3px 8px',
  borderRadius: 12,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.02em',
  color: '#fff',
  backgroundColor: deptColors[dept] || '#6b7280',
})

const enrolledBadgeStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '3px 8px',
  borderRadius: 12,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.03em',
  color: '#065f46',
  backgroundColor: '#d1fae5',
  border: '1px solid #6ee7b7',
}

const notEnrolledBadgeStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '3px 8px',
  borderRadius: 12,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.03em',
  color: '#92400e',
  backgroundColor: '#fef3c7',
  border: '1px solid #fcd34d',
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  transition: 'box-shadow 0.2s',
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: '#9ca3af',
  marginBottom: 4,
}

const btnBase: React.CSSProperties = {
  padding: '7px 14px',
  borderRadius: 7,
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  border: 'none',
  transition: 'opacity 0.15s',
}

const WorkerSchemes: React.FC = () => {
  const [schemes, setSchemes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    fetchSchemes()
  }, [])

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(''), 3500)
      return () => clearTimeout(t)
    }
  }, [successMsg])

  const fetchSchemes = async () => {
    setLoading(true)
    try {
      const res = await schemesAPI.available()
      setSchemes(res.data || [])
    } catch {
      setSchemes([])
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (schemeId: number, schemeName: string) => {
    setActionLoading(schemeId)
    try {
      await schemesAPI.enroll(schemeId)
      setSuccessMsg(`✓ Enrolled in "${schemeName}"`)
      fetchSchemes()
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to enroll. Please try again.'
      alert(msg)
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnenroll = async (schemeId: number, schemeName: string) => {
    if (!window.confirm(`Are you sure you want to un-enroll from "${schemeName}"?`)) return
    setActionLoading(schemeId)
    try {
      await schemesAPI.unenroll(schemeId)
      setSuccessMsg(`Un-enrolled from "${schemeName}"`)
      fetchSchemes()
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to un-enroll. Please try again.'
      alert(msg)
    } finally {
      setActionLoading(null)
    }
  }

  const enrolledCount = schemes.filter(s => s.is_enrolled).length
  const totalCount = schemes.length

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">Government Schemes for Construction Workers</div>
        <div className="page-subtitle">
          Browse and enroll in welfare schemes provided by the Government of India
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{
          background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10,
          padding: '12px 20px', flex: '1 1 160px', minWidth: 160,
        }}>
          <div style={{ fontSize: 11, color: '#1d4ed8', fontWeight: 700, letterSpacing: '0.05em' }}>TOTAL SCHEMES</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#1e40af' }}>{totalCount}</div>
        </div>
        <div style={{
          background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 10,
          padding: '12px 20px', flex: '1 1 160px', minWidth: 160,
        }}>
          <div style={{ fontSize: 11, color: '#047857', fontWeight: 700, letterSpacing: '0.05em' }}>ENROLLED</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#065f46' }}>{enrolledCount}</div>
        </div>
        <div style={{
          background: '#fefce8', border: '1px solid #fde68a', borderRadius: 10,
          padding: '12px 20px', flex: '1 1 160px', minWidth: 160,
        }}>
          <div style={{ fontSize: 11, color: '#92400e', fontWeight: 700, letterSpacing: '0.05em' }}>AVAILABLE TO ENROLL</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#713f12' }}>{totalCount - enrolledCount}</div>
        </div>
      </div>

      {/* Success Toast */}
      {successMsg && (
        <div style={{
          background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 8,
          padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#065f46',
          fontWeight: 600,
        }}>
          {successMsg}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
          <div className="spinner" />
          <div style={{ marginTop: 12 }}>Loading government schemes...</div>
        </div>
      )}

      {/* Schemes Grid */}
      {!loading && (
        <div className="grid grid-2" style={{ gap: 20 }}>
          {schemes.map((s: any) => (
            <div key={s.id} style={cardStyle}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 6, lineHeight: '1.35' }}>
                    {s.name}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    {s.department && <span style={deptBadgeStyle(s.department)}>{s.department}</span>}
                    {s.is_enrolled
                      ? <span style={enrolledBadgeStyle}>✓ ENROLLED</span>
                      : <span style={notEnrolledBadgeStyle}>NOT ENROLLED</span>
                    }
                  </div>
                </div>
              </div>

              {/* Description */}
              {s.description && (
                <div>
                  <div style={sectionLabelStyle}>About</div>
                  <p style={{ fontSize: 13, color: '#4b5563', lineHeight: '1.55', margin: 0 }}>
                    {s.description}
                  </p>
                </div>
              )}

              {/* Benefits */}
              {s.benefits && (
                <div>
                  <div style={sectionLabelStyle}>Benefits</div>
                  <p style={{
                    fontSize: 13, color: '#374151', margin: 0,
                    whiteSpace: 'pre-line', lineHeight: '1.6',
                    background: '#f0fdf4', border: '1px solid #bbf7d0',
                    borderRadius: 7, padding: '8px 12px',
                  }}>
                    {s.benefits}
                  </p>
                </div>
              )}

              {/* Eligibility */}
              {s.eligibility && (
                <div>
                  <div style={sectionLabelStyle}>Eligibility</div>
                  <p style={{
                    fontSize: 13, color: '#374151', margin: 0,
                    whiteSpace: 'pre-line', lineHeight: '1.6',
                    background: '#eff6ff', border: '1px solid #bfdbfe',
                    borderRadius: 7, padding: '8px 12px',
                  }}>
                    {s.eligibility}
                  </p>
                </div>
              )}

              {/* Action Button */}
              <div style={{ marginTop: 'auto', paddingTop: 4 }}>
                {s.is_enrolled ? (
                  <button
                    style={{
                      ...btnBase,
                      background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca',
                      opacity: actionLoading === s.id ? 0.6 : 1,
                    }}
                    onClick={() => handleUnenroll(s.id, s.name)}
                    disabled={actionLoading === s.id}
                  >
                    {actionLoading === s.id ? '...' : 'Un-enroll'}
                  </button>
                ) : (
                  <button
                    style={{
                      ...btnBase,
                      background: '#2563eb', color: '#fff',
                      opacity: actionLoading === s.id ? 0.6 : 1,
                    }}
                    onClick={() => handleEnroll(s.id, s.name)}
                    disabled={actionLoading === s.id}
                  >
                    {actionLoading === s.id ? 'Enrolling...' : '+ Enroll Now'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && schemes.length === 0 && (
        <div style={{
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
          padding: '40px 20px', textAlign: 'center', color: '#6b7280',
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>No schemes available</div>
          <div style={{ fontSize: 13 }}>Contact your site administrator for scheme information.</div>
        </div>
      )}
    </div>
  )
}

export default WorkerSchemes
