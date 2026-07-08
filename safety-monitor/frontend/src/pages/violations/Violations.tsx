import React, { useState, useEffect } from 'react'
import { violationsAPI } from '../../services/api'
import { formatIST } from '../../utils/formatIST'

const Violations: React.FC = () => {
  const [violations, setViolations] = useState<any[]>([])
  const [queue, setQueue] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [tab, setTab] = useState('all')
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState<number | null>(null)
const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null)

  useEffect(() => {
    if (tab === 'review') {
      fetchReviewQueue()
    } else {
      fetchViolations()
    }
  }, [page, tab])

  const fetchViolations = async () => {
    try {
      const params: any = { page, limit: 20 }
      if (tab === 'pending') params.status = 'pending'
      if (tab === 'approved') params.status = 'approved'
      if (tab === 'rejected') params.status = 'rejected'
      const res = await violationsAPI.list(params)
      // Filter out unknown persons (worker_name = "Unknown")
      const filtered = (res.data.violations || []).filter((v: any) => v.worker_name !== "Unknown")
      setViolations(filtered)
      setTotal(res.data.total || 0)
    } catch {}
  }

  const fetchReviewQueue = async () => {
    try {
      const res = await violationsAPI.getReviewQueue()
      // Filter out unknown persons (worker_name = "Unknown")
      const filtered = (res.data || []).filter((item: any) => item.worker_name !== "Unknown")
      setQueue(filtered)
    } catch {}
  }

  const approve = async (id: number) => {
    try {
      await violationsAPI.approve(id)
      if (tab === 'review') fetchReviewQueue()
      else fetchViolations()
    } catch {}
  }

  const reject = async () => {
    if (!showRejectModal || !rejectReason) return
    try {
      await violationsAPI.reject(showRejectModal, rejectReason)
      setShowRejectModal(null)
      setRejectReason('')
      if (tab === 'review') fetchReviewQueue()
      else fetchViolations()
    } catch {}
  }

  const del = async (id: number) => {
    try {
      await violationsAPI.delete(id)
      setShowDeleteModal(null)
      fetchViolations()
    } catch {}
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Violations</div>
        <div className="page-subtitle">Review and manage safety violations</div>
      </div>

      <div className="tabs">
        <div className={`tab${tab === 'all' ? ' active' : ''}`} onClick={() => setTab('all')}>All</div>
        <div className={`tab${tab === 'review' ? ' active' : ''}`} onClick={() => setTab('review')}>Review Queue</div>
        <div className={`tab${tab === 'pending' ? ' active' : ''}`} onClick={() => setTab('pending')}>Pending</div>
        <div className={`tab${tab === 'approved' ? ' active' : ''}`} onClick={() => setTab('approved')}>Approved</div>
        <div className={`tab${tab === 'rejected' ? ' active' : ''}`} onClick={() => setTab('rejected')}>Rejected</div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Status</th>
                <th>Worker</th>
                <th>Camera</th>
                <th>Confidence</th>
                <th>Evidence</th>
                <th>Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tab === 'review' ? (
                queue.length === 0 ? (
                  <tr><td colSpan={9}><div className="empty-state"><div className="empty-state-text">No pending reviews</div></div></td></tr>
                ) : (
                  queue.map((item: any) => (
                    <tr key={item.id}>
                      <td>{item.violation_id}</td>
                      <td><span className="badge badge-orange">{item.violation_type}</span></td>
                      <td><span className="badge badge-yellow">PENDING</span></td>
                      <td>{item.worker_name}</td>
                      <td>-</td>
                      <td>{item.confidence ? (item.confidence * 100).toFixed(0) + '%' : '-'}</td>
                      <td>
                        {(item.screenshot_path || item.evidence_path) && (
                          <a href={`/${(item.screenshot_path || item.evidence_path).replace(/\\/g, '/').replace(/^\/+/, '')}`} target="_blank" className="btn btn-outline btn-sm">View</a>
                        )}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{formatIST(item.detected_at)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-success btn-sm" onClick={() => approve(item.violation_id)}>Approve</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setShowRejectModal(item.violation_id)}>Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              ) : (
                violations.length === 0 ? (
                  <tr><td colSpan={9}><div className="empty-state"><div className="empty-state-text">No violations found</div></div></td></tr>
                ) : (
                  violations.map((v: any) => (
                    <tr key={v.id}>
                      <td>{v.id}</td>
                      <td><span className={`badge badge-${v.violation_type === 'fire' ? 'red' : v.violation_type === 'smoking' ? 'orange' : 'yellow'}`}>{v.violation_type}</span></td>
                      <td>
                        <span className={`badge badge-${v.status === 'approved' ? 'green' : v.status === 'rejected' ? 'red' : 'yellow'}`}>
                          {v.status}
                        </span>
                      </td>
                      <td>{v.worker_name}</td>
                      <td>Camera {v.camera_id}</td>
                      <td>{v.confidence ? (v.confidence * 100).toFixed(0) + '%' : '-'}</td>
                      <td>
                        {(v.screenshot_path || v.evidence_path) && (
                          <a href={`/${(v.screenshot_path || v.evidence_path).replace(/\\/g, '/').replace(/^\/+/, '')}`} target="_blank" className="btn btn-outline btn-sm">View</a>
                        )}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{formatIST(v.detected_at)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {v.status === 'pending' && (
                            <>
                              <button className="btn btn-success btn-sm" onClick={() => approve(v.id)}>Approve</button>
                              <button className="btn btn-danger btn-sm" onClick={() => setShowRejectModal(v.id)}>Reject</button>
                            </>
                          )}
                          <button className="btn btn-outline btn-sm" onClick={() => setShowDeleteModal(v.id)} style={{color:'var(--color-danger)'}}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Delete Violation</div>
              <button className="modal-close" onClick={() => setShowDeleteModal(null)}>&times;</button>
            </div>
            <p style={{color:'var(--color-text-secondary)',margin:'12px 0'}}>Delete violation #{showDeleteModal}? This also removes associated fines and alerts.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowDeleteModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => del(showDeleteModal)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Reject Violation</div>
              <button className="modal-close" onClick={() => setShowRejectModal(null)}>&times;</button>
            </div>
            <div className="form-group">
              <label className="form-label">Rejection Reason</label>
              <textarea className="form-textarea" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Enter reason for rejection..." />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowRejectModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={reject} disabled={!rejectReason}>Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Violations
