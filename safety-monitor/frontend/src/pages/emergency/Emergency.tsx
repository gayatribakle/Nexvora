import React, { useState, useEffect } from 'react'
import { emergencyAPI } from '../../services/api'
import { formatIST } from '../../utils/formatIST'

const Emergency: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', message: '', severity: 'orange' })

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      const res = await emergencyAPI.list()
      setAlerts(res.data || [])
    } catch {}
  }

  const createAlert = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await emergencyAPI.create(form)
      setShowModal(false)
      setForm({ title: '', message: '', severity: 'orange' })
      fetchAlerts()
    } catch {}
  }

  const resolveAlert = async (id: number) => {
    try {
      await emergencyAPI.resolve(id)
      fetchAlerts()
    } catch {}
  }

  const severityColor = (s: string) => {
    switch(s) {
      case 'red': return 'var(--color-critical)'
      case 'orange': return 'var(--color-warning-dark)'
      case 'yellow': return 'var(--color-warning)'
      default: return 'var(--color-success)'
    }
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="page-title">Emergency Broadcast</div>
          <div className="page-subtitle">Send emergency alerts and notifications</div>
        </div>
        <button className="btn btn-danger" onClick={() => setShowModal(true)}>
          {'\u26A0'} New Emergency
        </button>
      </div>

      {alerts.filter(a => a.is_active).length > 0 && (
        <div className="emergency-banner" style={{ marginBottom: 24 }}>
          {'\u26A0'} {alerts.filter(a => a.is_active).length} Active Emergency Alert{alerts.filter(a => a.is_active).length > 1 ? 's' : ''}
        </div>
      )}

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Severity</th>
                <th>Title</th>
                <th>Message</th>
                <th>Status</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {alerts.length === 0 && (
                <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-text">No emergency alerts</div></div></td></tr>
              )}
              {alerts.map((a: any) => (
                <tr key={a.id}>
                  <td>
                    <div style={{
                      display: 'inline-block', width: 12, height: 12, borderRadius: '50%',
                      background: severityColor(a.severity), marginRight: 6, verticalAlign: 'middle',
                    }} />
                    <span style={{ textTransform: 'uppercase', fontWeight: 600, fontSize: 12 }}>{a.severity}</span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{a.title}</td>
                  <td style={{ fontSize: 13 }}>{a.message}</td>
                  <td>
                    <span className={`badge badge-${a.is_active ? 'red' : 'green'}`}>
                      {a.is_active ? 'Active' : 'Resolved'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{formatIST(a.created_at)}</td>
                  <td>
                    {a.is_active && (
                      <button className="btn btn-success btn-sm" onClick={() => resolveAlert(a.id)}>Resolve</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Create Emergency Alert</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={createAlert}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea className="form-textarea" value={form.message} onChange={(e) => setForm({...form, message: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Severity</label>
                <select className="form-select" value={form.severity} onChange={(e) => setForm({...form, severity: e.target.value})}>
                  <option value="green">Green - Low</option>
                  <option value="yellow">Yellow - Medium</option>
                  <option value="orange">Orange - High</option>
                  <option value="red">Red - Critical</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-danger">Broadcast Alert</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Emergency
