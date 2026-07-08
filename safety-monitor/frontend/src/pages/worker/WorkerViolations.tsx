import React, { useState, useEffect } from 'react'
import { workersAPI } from '../../services/api'
import { formatIST } from '../../utils/formatIST'

const WorkerViolations: React.FC = () => {
  const [violations, setViolations] = useState<any[]>([])

  useEffect(() => {
    fetchViolations()
  }, [])

  const fetchViolations = async () => {
    try {
      const res = await workersAPI.getMyProfile()
      if (res.data?.id) {
        const vRes = await workersAPI.getViolations(res.data.id)
        setViolations(vRes.data || [])
      }
    } catch {}
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">My Violations</div>
        <div className="page-subtitle">View your safety violation history</div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Status</th>
                <th>Camera</th>
                <th>Confidence</th>
                <th>Date</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              {violations.length === 0 && (
                <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-text">No violations recorded</div></div></td></tr>
              )}
              {violations.map((v: any) => (
                <tr key={v.id}>
                  <td>{v.id}</td>
                  <td><span className={`badge badge-${v.violation_type === 'fire' ? 'red' : v.violation_type === 'smoking' ? 'orange' : 'yellow'}`}>{v.violation_type}</span></td>
                  <td><span className={`badge badge-${v.status === 'approved' ? 'green' : v.status === 'rejected' ? 'red' : 'yellow'}`}>{v.status}</span></td>
                  <td>Camera {v.camera_id}</td>
                  <td>{v.confidence ? (v.confidence * 100).toFixed(0) + '%' : '-'}</td>
                  <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{formatIST(v.detected_at)}</td>
                  <td>
                    {(v.screenshot_path || v.evidence_path) && (
                      <a href={`/${(v.screenshot_path || v.evidence_path).replace(/\\/g, '/').replace(/^\/+/, '')}`} target="_blank" className="btn btn-outline btn-sm">View</a>
                    )}
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

export default WorkerViolations
