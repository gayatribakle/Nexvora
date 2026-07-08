import React, { useState, useEffect } from 'react'
import { leaderboardAPI } from '../../services/api'

const Leaderboard: React.FC = () => {
  const [workers, setWorkers] = useState<any[]>([])
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetchLeaderboard()
  }, [filter])

  const fetchLeaderboard = async () => {
    try {
      const params: any = { limit: 50 }
      if (filter) params.department = filter
      const res = await leaderboardAPI.get(params)
      setWorkers(res.data || [])
    } catch {}
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Safety Leaderboard</div>
        <div className="page-subtitle">Top performing workers by safety score</div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Filter by Department:</label>
          <select className="form-select" style={{ width: 200 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All Departments</option>
            <option value="Construction">Construction</option>
            <option value="Electrical">Electrical</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Safety">Safety</option>
            <option value="Logistics">Logistics</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Worker</th>
                <th>Department</th>
                <th>Safety Score</th>
                <th>Violations</th>
                <th>Trainings</th>
                <th>Quizzes</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {workers.length === 0 && (
                <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-text">No data available</div></div></td></tr>
              )}
              {workers.map((w: any) => (
                <tr key={w.rank}>
                  <td>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: w.rank <= 3 ? 'linear-gradient(135deg, var(--color-warning), var(--color-warning-dark))' : 'var(--color-bg-card)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 13, border: '2px solid var(--color-border)',
                    }}>
                      {w.rank}
                    </div>
                  </td>
                  <td style={{ fontWeight: 500 }}>{w.worker_name}</td>
                  <td>{w.department || '-'}</td>
                  <td>
                    <span className={`badge badge-${w.safety_score >= 80 ? 'green' : w.safety_score >= 60 ? 'yellow' : 'red'}`}
                      style={{ fontSize: 14, padding: '4px 12px' }}>
                      {w.safety_score}
                    </span>
                  </td>
                  <td>{w.total_violations}</td>
                  <td>{w.trainings_completed}</td>
                  <td>{w.quizzes_passed}</td>
                  <td>
                    <div style={{ width: 120, height: 8, background: 'var(--color-border)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${w.safety_score}%`,
                        background: w.safety_score >= 80 ? 'var(--color-success)' : w.safety_score >= 60 ? 'var(--color-warning)' : 'var(--color-danger)',
                        borderRadius: 4, transition: 'width 0.5s',
                      }} />
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

export default Leaderboard
