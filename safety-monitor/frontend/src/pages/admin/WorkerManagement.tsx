import React, { useState, useEffect, useRef } from 'react'
import { workersAPI } from '../../services/api'

const WorkerManagement: React.FC = () => {
  const [workers, setWorkers] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    username: '', email: '', password: '', full_name: '',
    employee_id: '', phone: '', department: '', designation: '',
  })

  const deleteWorker = async (id: number, name: string) => {
    if (!window.confirm(`Delete worker "${name}" (ID: ${id})? This cannot be undone.`)) return
    try {
      await workersAPI.remove(id)
      fetchWorkers()
    } catch {}
  }

  useEffect(() => {
    fetchWorkers()
  }, [page])

  const fetchWorkers = async () => {
    try {
      const res = await workersAPI.list({ page, limit: 50 })
      setWorkers(res.data?.workers || res.data || [])
    } catch {}
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const createWorker = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      alert('Please select a worker photo for face registration')
      return
    }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('username', form.username)
      fd.append('email', form.email)
      fd.append('password', form.password)
      fd.append('full_name', form.full_name)
      fd.append('employee_id', form.employee_id)
      if (form.phone) fd.append('phone', form.phone)
      if (form.department) fd.append('department', form.department)
      if (form.designation) fd.append('designation', form.designation)
      fd.append('file', selectedFile)

      await workersAPI.createWithPhoto(fd)
      setShowModal(false)
      resetForm()
      fetchWorkers()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create worker')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setForm({ username: '', email: '', password: '', full_name: '', employee_id: '', phone: '', department: '', designation: '' })
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="page-title">Worker Management</div>
          <div className="page-subtitle">Register workers with photos for automatic face identification</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Worker</button>
      </div>

      <div className="card" style={{ marginBottom: 16, background: 'rgba(13, 71, 161, 0.08)', borderColor: 'var(--color-primary)' }}>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          {'\u2139'} When a violation is detected, the system automatically matches the worker's face against uploaded photos and assigns fines accordingly. Upload a clear face photo for each worker.
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Photo</th>
                <th>ID</th>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Safety Score</th>
                <th>Violations</th>
                <th>Fines</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {workers.length === 0 && (
                <tr><td colSpan={9}><div className="empty-state"><div className="empty-state-text">No workers registered. Add workers with photos to enable face-based violation tracking.</div></div></td></tr>
              )}
              {workers.map((w: any) => (
                <tr key={w.id}>
                  <td>
                    {w.images && w.images.length > 0 ? (
                      <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', background: 'var(--color-border)' }}>
                        <img src={`/${w.images[0].filepath.replace(/\\/g, '/')}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ) : (
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'var(--color-text-muted)' }}>
                        {'\u263A'}
                      </div>
                    )}
                  </td>
                  <td>{w.id}</td>
                  <td>{w.employee_id}</td>
                  <td style={{ fontWeight: 500 }}>{w.full_name}</td>
                  <td>{w.department || '-'}</td>
                  <td>
                    <span className={`badge badge-${w.safety_score >= 80 ? 'green' : w.safety_score >= 60 ? 'yellow' : 'red'}`}>
                      {w.safety_score}
                    </span>
                  </td>
                  <td>{w.total_violations}</td>
                  <td>{'\u20B9'}{w.total_fine_amount || 0}</td>
                  <td>
                    {w.images && w.images.length > 0 ? (
                      <span className="badge badge-green">Face Registered</span>
                    ) : (
                      <span className="badge badge-yellow">No Photo</span>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteWorker(w.id, w.full_name)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: 600 }}>
            <div className="modal-header">
              <div className="modal-title">Register New Worker (with Photo)</div>
              <button className="modal-close" onClick={() => { setShowModal(false); resetForm() }}>&times;</button>
            </div>
            <form onSubmit={createWorker}>
              <div style={{ display: 'flex', gap: 20 }}>
                <div style={{ flex: 1 }}>
                  <div className="grid grid-2" style={{ gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Username *</label>
                      <input className="form-input" value={form.username} onChange={(e) => setForm({...form, username: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email *</label>
                      <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Password *</label>
                      <input className="form-input" type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Full Name *</label>
                      <input className="form-input" value={form.full_name} onChange={(e) => setForm({...form, full_name: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Employee ID *</label>
                      <input className="form-input" value={form.employee_id} onChange={(e) => setForm({...form, employee_id: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <input className="form-input" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Department</label>
                      <input className="form-input" value={form.department} onChange={(e) => setForm({...form, department: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Designation</label>
                      <input className="form-input" value={form.designation} onChange={(e) => setForm({...form, designation: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div style={{ width: 180, flexShrink: 0 }}>
                  <label className="form-label">Worker Photo *</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      width: 180, height: 200, border: '2px dashed var(--color-border)',
                      borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', overflow: 'hidden', background: 'var(--color-bg)',
                      flexDirection: 'column', gap: 8,
                    }}
                  >
                    {previewUrl ? (
                      <img src={previewUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <>
                        <span style={{ fontSize: 32, opacity: 0.3 }}>{'\u{1F4F7}'}</span>
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center', padding: '0 8px' }}>
                          Click to upload worker photo
                        </span>
                      </>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16, borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                <button type="button" className="btn btn-outline" onClick={() => { setShowModal(false); resetForm() }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving || !selectedFile}>
                  {saving ? 'Creating...' : `Create Worker${!selectedFile ? ' (add photo)' : ''}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkerManagement
