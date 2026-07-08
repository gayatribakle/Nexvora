import React, { useState, useEffect } from 'react'
import { schemesAPI, workersAPI } from '../../services/api'

const Schemes: React.FC = () => {
  const [schemes, setSchemes] = useState<any[]>([])
  const [workers, setWorkers] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [assignModal, setAssignModal] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', benefits: '', eligibility: '', department: '' })
  const [assignData, setAssignData] = useState({ workerId: 0, schemeId: 0 })

  useEffect(() => {
    fetchSchemes()
    fetchWorkers()
  }, [])

  const fetchSchemes = async () => {
    try { const res = await schemesAPI.list(); setSchemes(res.data || []) } catch {}
  }

  const fetchWorkers = async () => {
    try { const res = await workersAPI.list({ limit: 200 }); setWorkers(res.data?.workers || res.data || []) } catch {}
  }

  const createScheme = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await schemesAPI.create(form)
      setShowModal(false)
      setForm({ name: '', description: '', benefits: '', eligibility: '', department: '' })
      fetchSchemes()
    } catch {}
  }

  const deleteScheme = async (id: number) => {
    if (!window.confirm('Delete this scheme?')) return
    try {
      await schemesAPI.delete(id)
      fetchSchemes()
    } catch {}
  }

  const assignScheme = async () => {
    try {
      await schemesAPI.assign(assignData.workerId, assignData.schemeId)
      setAssignModal(false)
    } catch {}
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="page-title">Government Schemes</div>
          <div className="page-subtitle">Manage welfare schemes for construction workers</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Scheme</button>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        {schemes.map((s: any) => (
          <div key={s.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div className="card-title" style={{ fontSize: 16 }}>{s.name}</div>
                {s.department && <span className="badge badge-blue">{s.department}</span>}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn btn-outline btn-sm" onClick={() => { setAssignData({ workerId: 0, schemeId: s.id }); setAssignModal(true) }}>
                  Assign
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => deleteScheme(s.id)}>Delete</button>
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 8 }}>{s.description}</p>
            {s.benefits && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 4 }}>BENEFITS</div>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{s.benefits}</p>
              </div>
            )}
            {s.eligibility && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 4 }}>ELIGIBILITY</div>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{s.eligibility}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Add Government Scheme</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={createScheme}>
              <div className="form-group">
                <label className="form-label">Scheme Name</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Benefits</label>
                <textarea className="form-textarea" value={form.benefits} onChange={(e) => setForm({...form, benefits: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Eligibility</label>
                <textarea className="form-textarea" value={form.eligibility} onChange={(e) => setForm({...form, eligibility: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input className="form-input" value={form.department} onChange={(e) => setForm({...form, department: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {assignModal && (
        <div className="modal-overlay" onClick={() => setAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Assign Scheme to Worker</div>
              <button className="modal-close" onClick={() => setAssignModal(false)}>&times;</button>
            </div>
            <div className="form-group">
              <label className="form-label">Worker</label>
              <select className="form-select" value={assignData.workerId} onChange={(e) => setAssignData({...assignData, workerId: parseInt(e.target.value)})}>
                <option value={0}>Select worker...</option>
                {workers.map((w: any) => (
                  <option key={w.id} value={w.id}>{w.full_name} ({w.employee_id})</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setAssignModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={assignScheme} disabled={!assignData.workerId}>Assign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Schemes
