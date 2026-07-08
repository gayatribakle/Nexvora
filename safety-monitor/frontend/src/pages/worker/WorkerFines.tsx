import React, { useState, useEffect } from 'react'
import { workersAPI, finesAPI } from '../../services/api'
import { formatIST } from '../../utils/formatIST'

const WorkerFines: React.FC = () => {
  const [fines, setFines] = useState<any[]>([])
  const [totalAmount, setTotalAmount] = useState(0)

  useEffect(() => {
    fetchFines()
  }, [])

  const fetchFines = async () => {
    try {
      const res = await workersAPI.getMyProfile()
      if (res.data?.id) {
        const fRes = await workersAPI.getFines(res.data.id)
        setFines(fRes.data || [])
        setTotalAmount(fRes.data.reduce((sum: number, f: any) => sum + f.amount, 0))
      }
    } catch {}
  }

  const payFine = async (id: number) => {
    try {
      await finesAPI.pay(id)
      fetchFines()
    } catch {}
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">My Fines</div>
        <div className="page-subtitle">View and pay your safety violation fines</div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon red">{'\u20B9'}</div>
          <div className="stat-content">
            <div className="stat-value">{'\u20B9'}{totalAmount}</div>
            <div className="stat-label">Total Fine Amount</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">{'\u20B9'}</div>
          <div className="stat-content">
            <div className="stat-value">{fines.length}</div>
            <div className="stat-label">Total Fines</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Violation</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {fines.length === 0 && (
                <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-text">No fines recorded</div></div></td></tr>
              )}
              {fines.map((f: any) => (
                <tr key={f.id}>
                  <td>{f.id}</td>
                  <td>{f.violation_type}</td>
                  <td style={{ fontWeight: 600 }}>{'\u20B9'}{f.amount}</td>
                  <td>
                    <span className={`badge badge-${f.is_paid ? 'green' : 'yellow'}`}>
                      {f.is_paid ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{formatIST(f.created_at)}</td>
                  <td>
                    {!f.is_paid && (
                      <button className="btn btn-success btn-sm" onClick={() => payFine(f.id)}>
                        Pay Now
                      </button>
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

export default WorkerFines
