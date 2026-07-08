import React, { useState, useEffect } from 'react'
import { analyticsAPI } from '../../services/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts'

const COLORS = ['#5472d3', '#ffc107', '#ff8f00', '#f44336', '#4caf50', '#ce93d8']
const PIE_COLORS = ['#4caf50', '#ffc107', '#f44336', '#5472d3']

const Analytics: React.FC = () => {
  const [violationsByType, setViolationsByType] = useState<any[]>([])
  const [timeline, setTimeline] = useState<any[]>([])
  const [safetyScores, setSafetyScores] = useState<any[]>([])
  const [fineSummary, setFineSummary] = useState<any>({})
  const [stats, setStats] = useState({ total: 0, ppe: 0, smoking: 0, fire: 0, avgScore: 0 })

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [typeRes, timeRes, scoreRes, fineRes] = await Promise.all([
          analyticsAPI.violationsByType(),
          analyticsAPI.violationsTimeline(14),
          analyticsAPI.safetyScores(),
          analyticsAPI.fineSummary(),
        ])
        const vbt = typeRes.data || []
        setViolationsByType(vbt)
        setTimeline(timeRes.data || [])
        setSafetyScores(scoreRes.data || [])
        setFineSummary(fineRes.data || {})
        const total = vbt.reduce((s: number, r: any) => s + (r.count || 0), 0)
        const find = (t: string) => vbt.find((r: any) => r.type === t)
        setStats({
          total,
          ppe: (find('no_hardhat')?.count || 0) + (find('ppe_violation')?.count || 0) + (find('no_safety_vest')?.count || 0) + (find('no_mask')?.count || 0),
          smoking: find('smoking')?.count || 0,
          fire: find('fire')?.count || 0,
          avgScore: scoreRes.data?.length ? Math.round(scoreRes.data.reduce((s: number, w: any) => s + w.safety_score, 0) / scoreRes.data.length) : 0,
        })
      } catch {}
    }
    fetchAll()
  }, [])

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Safety Analytics</div>
        <div className="page-subtitle">Data-driven safety insights and trends</div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card"><div className="stat-icon red">{'\u26D4'}</div><div className="stat-content"><div className="stat-value">{stats.total}</div><div className="stat-label">Total Violations</div></div></div>
        <div className="stat-card"><div className="stat-icon yellow">{'\u26A0'}</div><div className="stat-content"><div className="stat-value">{stats.ppe}</div><div className="stat-label">PPE Violations</div></div></div>
        <div className="stat-card"><div className="stat-icon orange">{'\u{1F6AC}'}</div><div className="stat-content"><div className="stat-value">{stats.smoking}</div><div className="stat-label">Smoking Incidents</div></div></div>
        <div className="stat-card"><div className="stat-icon red">{'\u{1F525}'}</div><div className="stat-content"><div className="stat-value">{stats.fire}</div><div className="stat-label">Fire Alerts</div></div></div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card"><div className="stat-icon green">{'\u20B9'}</div><div className="stat-content"><div className="stat-value">{'\u20B9'}{(fineSummary.total_amount || 0).toLocaleString()}</div><div className="stat-label">Total Fines</div></div></div>
        <div className="stat-card"><div className="stat-icon green">{'\u20B9'}</div><div className="stat-content"><div className="stat-value">{'\u20B9'}{(fineSummary.paid_amount || 0).toLocaleString()}</div><div className="stat-label">Collected</div></div></div>
        <div className="stat-card"><div className="stat-icon yellow">{'\u20B9'}</div><div className="stat-content"><div className="stat-value">{'\u20B9'}{(fineSummary.pending_amount || 0).toLocaleString()}</div><div className="stat-label">Pending</div></div></div>
        <div className="stat-card"><div className="stat-icon blue">{'\u2605'}</div><div className="stat-content"><div className="stat-value">{stats.avgScore}</div><div className="stat-label">Avg Safety Score</div></div></div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header"><div className="card-title">Violations by Type</div></div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={violationsByType} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis type="number" stroke="var(--color-text-muted)" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="type" stroke="var(--color-text-muted)" tick={{ fontSize: 11 }} width={90} />
                <Tooltip contentStyle={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
                <Bar dataKey="count" fill="var(--color-accent)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">Fine Distribution</div></div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[
                  { name: 'Collected', value: fineSummary.paid_amount || 0 },
                  { name: 'Pending', value: fineSummary.pending_amount || 0 },
                  { name: 'Unpaid', value: Math.max(0, (fineSummary.total_amount || 0) - (fineSummary.paid_amount || 0) - (fineSummary.pending_amount || 0)) },
                ]} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" nameKey="name"
                  label={({ name, value }) => `${name}: \u20B9${value}`}>
                  {[0, 1, 2].map((i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header"><div className="card-title">Violations Trend (14 Days)</div></div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" stroke="var(--color-text-muted)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--color-text-muted)" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
                <Line type="monotone" dataKey="count" stroke="var(--color-primary-light)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">Safety Score Distribution</div></div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[
                  { name: 'Good (80+)', value: safetyScores.filter((w: any) => w.safety_score >= 80).length },
                  { name: 'Average (60-79)', value: safetyScores.filter((w: any) => w.safety_score >= 60 && w.safety_score < 80).length },
                  { name: 'Poor (<60)', value: safetyScores.filter((w: any) => w.safety_score < 60).length },
                ]} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name"
                  label={({ name, value }) => `${name}: ${value}`}>
                  {[0, 1, 2].map((i) => <Cell key={i} fill={['#4caf50', '#ffc107', '#f44336'][i]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Top Workers by Safety Score</div></div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Worker</th>
                <th>Department</th>
                <th>Safety Score</th>
                <th>Violations</th>
                <th>Score Bar</th>
              </tr>
            </thead>
            <tbody>
              {safetyScores.length === 0 && (
                <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-text">No data available</div></div></td></tr>
              )}
              {safetyScores.slice(0, 10).map((w: any, i: number) => (
                <tr key={w.worker_id}>
                  <td style={{ fontWeight: 700 }}>#{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{w.worker_name}</td>
                  <td>{w.department || '-'}</td>
                  <td>
                    <span className={`badge badge-${w.safety_score >= 80 ? 'green' : w.safety_score >= 60 ? 'yellow' : 'red'}`}>
                      {w.safety_score}
                    </span>
                  </td>
                  <td>{w.total_violations}</td>
                  <td>
                    <div style={{ height: 6, width: 120, background: 'var(--color-border)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${w.safety_score}%`, background: w.safety_score >= 80 ? 'var(--color-success)' : w.safety_score >= 60 ? 'var(--color-warning)' : 'var(--color-danger)', borderRadius: 3, transition: 'width 0.5s' }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Analytics