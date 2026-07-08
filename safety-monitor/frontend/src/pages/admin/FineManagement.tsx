import React, { useState, useEffect } from 'react'
import { finesAPI } from '../../services/api'
import { formatIST } from '../../utils/formatIST'

const FineManagement: React.FC = () => {
  const [fines, setFines] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetchFines()
    fetchSummary()
  }, [page, filter])

  const fetchFines = async () => {
    try {
      const params: any = { page, limit: 20 }
      if (filter === 'paid') params.is_paid = true
      if (filter === 'unpaid') params.is_paid = false
      const res = await finesAPI.list(params)
      setFines(res.data.fines || [])
    } catch {}
  }

  const fetchSummary = async () => {
    try {
      const res = await finesAPI.summary()
      setSummary(res.data)
    } catch {}
  }

  const payFine = async (id: number) => {
    try {
      await finesAPI.pay(id)
      fetchFines()
      fetchSummary()
    } catch {}
  }

  const deleteFine = async (id: number) => {
    if (!window.confirm(`Delete fine #${id}?`)) return
    try {
      await finesAPI.remove(id)
      fetchFines()
      fetchSummary()
    } catch {}
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Fine Management</div>
        <div className="page-subtitle">Manage and track safety violation fines</div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon red">{'\u20B9'}</div>
          <div className="stat-content">
            <div className="stat-value">{'\u20B9'}{(summary.total_amount || 0).toLocaleString()}</div>
            <div className="stat-label">Total Fine Amount</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">{'\u20B9'}</div>
          <div className="stat-content">
            <div className="stat-value">{'\u20B9'}{(summary.paid_amount || 0).toLocaleString()}</div>
            <div className="stat-label">Collected Amount</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">{'\u20B9'}</div>
          <div className="stat-content">
            <div className="stat-value">{'\u20B9'}{(summary.pending_amount || 0).toLocaleString()}</div>
            <div className="stat-label">Pending Amount</div>
          </div>
        </div>
      </div>

      <div className="tabs">
        <div className={`tab${filter === '' ? ' active' : ''}`} onClick={() => setFilter('')}>All</div>
        <div className={`tab${filter === 'unpaid' ? ' active' : ''}`} onClick={() => setFilter('unpaid')}>Unpaid</div>
        <div className={`tab${filter === 'paid' ? ' active' : ''}`} onClick={() => setFilter('paid')}>Paid</div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Worker</th>
                <th>Violation</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {fines.length === 0 && (
                <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-text">No fines found</div></div></td></tr>
              )}
              {fines.map((f: any) => (
                <tr key={f.id}>
                  <td>{f.id}</td>
                  <td>{f.worker_name}</td>
                  <td>{f.violation_type}</td>
                  <td style={{ fontWeight: 600 }}>{'\u20B9'}{f.amount}</td>
                  <td>
                    <span className={`badge badge-${f.is_paid ? 'green' : 'yellow'}`}>
                      {f.is_paid ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{formatIST(f.created_at)}</td>
                  <td style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {!f.is_paid && (
                      <button className="btn btn-success btn-sm" onClick={() => payFine(f.id)}>Mark Paid</button>
                    )}
                    <button className="btn btn-danger btn-sm" onClick={() => deleteFine(f.id)}>Delete</button>
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

export default FineManagement
