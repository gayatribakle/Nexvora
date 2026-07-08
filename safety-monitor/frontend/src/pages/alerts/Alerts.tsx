import React, { useState, useEffect } from 'react'
import { alertsAPI } from '../../services/api'
import { formatIST } from '../../utils/formatIST'

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetchAlerts()
  }, [page, filter])

  const fetchAlerts = async () => {
    try {
      const params: any = { page, limit: 20 }
      if (filter === 'unread') params.is_read = false
      if (filter === 'emergency') params.is_emergency = true
      const res = await alertsAPI.list(params)
      // Filter out unknown person alerts (only show emergency alerts for unknown people)
      const filtered = (res.data.alerts || []).filter((alert: any) => {
        if (alert.worker_name === "Unknown" && !alert.is_emergency) {
          return false // Hide unknown person non-emergency alerts
        }
        return true
      })
      setAlerts(filtered)
      setTotal(res.data.total || 0)
    } catch {}
  }

  const markRead = async (id: number) => {
    try {
      await alertsAPI.markRead(id)
      fetchAlerts()
    } catch {}
  }

  const markAllRead = async () => {
    try {
      await alertsAPI.markAllRead()
      fetchAlerts()
    } catch {}
  }

  const delAlert = async (id: number) => {
    try {
      await alertsAPI.delete(id)
      fetchAlerts()
    } catch {}
  }

  const clearAll = async () => {
    try {
      await alertsAPI.clearAll()
      fetchAlerts()
    } catch {}
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="page-title">Alerts</div>
          <div className="page-subtitle">Monitor and manage all alerts ({total} total)</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-outline btn-sm" onClick={markAllRead}>Mark All Read</button>
          <button className="btn btn-outline btn-sm" onClick={clearAll} style={{color:'var(--color-danger)'}}>Clear All</button>
        </div>
      </div>

      <div className="tabs">
        <div className={`tab${filter === '' ? ' active' : ''}`} onClick={() => setFilter('')}>All</div>
        <div className={`tab${filter === 'unread' ? ' active' : ''}`} onClick={() => setFilter('unread')}>Unread</div>
        <div className={`tab${filter === 'emergency' ? ' active' : ''}`} onClick={() => setFilter('emergency')}>Emergency</div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Severity</th>
                <th>Message</th>
                <th>Type</th>
                <th>Worker</th>
                <th>Camera</th>
                <th>Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {alerts.length === 0 && (
                <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-text">No alerts</div></div></td></tr>
              )}
              {alerts.map((alert: any) => (
                <tr key={alert.id}>
                  <td>
                    <span className={`badge badge-${alert.severity === 'red' ? 'red' : alert.severity === 'orange' ? 'orange' : 'yellow'}`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{alert.message}</td>
                  <td>{alert.violation_type}</td>
                  <td>{alert.worker_name || 'Unknown'}</td>
                  <td>Camera {alert.camera_id}</td>
                  <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{formatIST(alert.created_at)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {!alert.is_read && (
                        <button className="btn btn-outline btn-sm" onClick={() => markRead(alert.id)}>
                          Mark Read
                        </button>
                      )}
                      <button className="btn btn-outline btn-sm" onClick={() => delAlert(alert.id)} style={{color:'var(--color-danger)'}}>Delete</button>
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

export default Alerts
