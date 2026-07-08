import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { analyticsAPI, alertsAPI, monitoringAPI, faceAPI } from '../../services/api'
import { formatIST } from '../../utils/formatIST'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#5472d3', '#ffc107', '#ff8f00', '#f44336', '#4caf50']

const EMPTY_STATS = {
  total_workers: 0, total_violations: 0, pending_violations: 0,
  approved_violations: 0, total_fines: 0, total_fine_amount: 0,
  total_alerts: 0, unread_alerts: 0, active_emergencies: 0,
  average_safety_score: 0, today_violations: 0,
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState(EMPTY_STATS)
  const [violationsByType, setViolationsByType] = useState<any[]>([])
  const [timeline, setTimeline] = useState<any[]>([])
  const [recentAlerts, setRecentAlerts] = useState<any[]>([])
  const [cameraStatus, setCameraStatus] = useState<any[]>([])
  const [faceMetrics, setFaceMetrics] = useState<any>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, typeRes, timeRes, alertsRes, camRes, faceRes] = await Promise.all([
          analyticsAPI.dashboard(),
          analyticsAPI.violationsByType(),
          analyticsAPI.violationsTimeline(7),
          alertsAPI.list({ limit: 5 }),
          monitoringAPI.status(),
          faceAPI.metrics().catch(() => ({ data: null })),
        ])
        setStats(statsRes.data)
        setViolationsByType(typeRes.data)
        setTimeline(timeRes.data)
        setRecentAlerts(alertsRes.data.alerts || [])
        setCameraStatus(camRes.data.cameras || [])
        if (faceRes?.data) setFaceMetrics(faceRes.data)
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setReady(true)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  if (!ready) return <div className="loading-screen"><div className="spinner"></div></div>

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Dashboard</div>
        <div className="page-subtitle">Real-time construction site safety overview</div>
      </div>

      {stats.active_emergencies > 0 && (
        <div className="emergency-banner">
          {'⚠'} Active Emergency Alerts: {stats.active_emergencies} - Immediate attention required!
        </div>
      )}

      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon blue">{'◙'}</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total_workers || 0}</div>
            <div className="stat-label">Total Workers</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">{'⛔'}</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total_violations || 0}</div>
            <div className="stat-label">Total Violations</div>
            <div className="stat-change down">{stats.today_violations || 0} today</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">{'₨'}</div>
          <div className="stat-content">
            <div className="stat-value">{'₨'}{(stats.total_fine_amount || 0).toLocaleString()}</div>
            <div className="stat-label">Total Fines</div>
            <div className="stat-change up">{stats.total_fines || 0} fines issued</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">{'☺'}</div>
          <div className="stat-content">
            <div className="stat-value">{stats.average_safety_score || 0}%</div>
            <div className="stat-label">Avg Safety Score</div>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Violations Timeline (7 Days)</div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" stroke="var(--color-text-muted)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--color-text-muted)" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 8 }}
                  labelStyle={{ color: 'var(--color-text)' }}
                />
                <Line type="monotone" dataKey="count" stroke="var(--color-accent)" strokeWidth={2} dot={{ fill: 'var(--color-accent)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Violations by Type</div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={violationsByType}
                  cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                  dataKey="count" nameKey="type"
                  label={({ type, count }) => `${type}: ${count}`}
                >
                  {violationsByType.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Camera Status</div>
            <Link to="/cctv" className="btn btn-outline btn-sm">View All</Link>
          </div>
          <div>
            {cameraStatus.length === 0 && (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-muted)' }}>
                <p>Waiting for cameras...</p>
              </div>
            )}
            {cameraStatus.map((cam: any) => (
              <div key={cam.camera_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                <div>
                  <span style={{ fontWeight: 500 }}>Camera {cam.camera_id}</span>
                  <span className="badge badge-green" style={{ marginLeft: 8 }}>LIVE</span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{cam.frame_count} frames</span>
              </div>
            ))}
          </div>
        </div>

        {faceMetrics && faceMetrics.total_attempts > 0 && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">Face Recognition</div>
              <Link to="/face-audit" className="btn btn-outline btn-sm">Audit</Link>
            </div>
            <div style={{ padding: 12 }}>
              <div className="grid grid-2" style={{ gap: 8 }}>
                <div style={{ textAlign: 'center', padding: 8, background: 'var(--color-bg)', borderRadius: 8 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-success)' }}>{faceMetrics.recognition_rate || 0}%</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Recognition</div>
                </div>
                <div style={{ textAlign: 'center', padding: 8, background: 'var(--color-bg)', borderRadius: 8 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-danger)' }}>{faceMetrics.unknown_rate || 0}%</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Unknown</div>
                </div>
                <div style={{ textAlign: 'center', padding: 8, background: 'var(--color-bg)', borderRadius: 8 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-accent)' }}>{(faceMetrics.avg_similarity || 0).toFixed(3)}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Avg Sim</div>
                </div>
                <div style={{ textAlign: 'center', padding: 8, background: 'var(--color-bg)', borderRadius: 8 }}>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{faceMetrics.matches || 0}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Matches</div>
                </div>
              </div>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 8, textAlign: 'center' }}>
                {faceMetrics.total_attempts} total | {faceMetrics.low_quality || 0} low quality
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Alerts</div>
            <Link to="/alerts" className="btn btn-outline btn-sm">View All</Link>
          </div>
          <div>
            {recentAlerts.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-text">No recent alerts</div>
              </div>
            )}
            {recentAlerts.map((alert: any) => (
              <div key={alert.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span className={`badge badge-${alert.severity === 'red' ? 'red' : alert.severity === 'orange' ? 'orange' : 'yellow'}`}>
                  {alert.severity}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{alert.message}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{formatIST(alert.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
