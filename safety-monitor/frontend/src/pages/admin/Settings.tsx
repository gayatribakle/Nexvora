import React, { useState, useEffect } from 'react'
import { settingsAPI } from '../../services/api'

const Settings: React.FC = () => {
  const [form, setForm] = useState({
    fine_ppe_violation: 100,
    fine_smoking: 200,
    fine_multiple_same_day: 50,
    confidence_threshold: 0.35,
    alert_cooldown_seconds: 900,
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await settingsAPI.get()
      setForm(res.data)
    } catch {}
  }

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await settingsAPI.update(form)
      setMessage('Settings saved successfully')
    } catch {
      setMessage('Failed to save settings')
    }
    setSaving(false)
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Settings</div>
        <div className="page-subtitle">Configure system parameters and thresholds</div>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        {message && <div className={`alert-box ${message.includes('success') ? 'success' : 'error'}`}>{message}</div>}

        <form onSubmit={saveSettings}>
          <div className="form-group">
            <label className="form-label">PPE Violation Fine ({'\u20B9'})</label>
            <input className="form-input" type="number" value={form.fine_ppe_violation} onChange={(e) => setForm({...form, fine_ppe_violation: parseInt(e.target.value)})} />
          </div>
          <div className="form-group">
            <label className="form-label">Smoking Fine ({'\u20B9'})</label>
            <input className="form-input" type="number" value={form.fine_smoking} onChange={(e) => setForm({...form, fine_smoking: parseInt(e.target.value)})} />
          </div>
          <div className="form-group">
            <label className="form-label">Multiple Violations Same Day Penalty ({'\u20B9'})</label>
            <input className="form-input" type="number" value={form.fine_multiple_same_day} onChange={(e) => setForm({...form, fine_multiple_same_day: parseInt(e.target.value)})} />
          </div>
          <div className="form-group">
            <label className="form-label">Detection Confidence Threshold</label>
            <input className="form-input" type="number" step="0.05" min="0" max="1" value={form.confidence_threshold} onChange={(e) => setForm({...form, confidence_threshold: parseFloat(e.target.value)})} />
          </div>
          <div className="form-group">
            <label className="form-label">Alert Cooldown (seconds)</label>
            <input className="form-input" type="number" value={form.alert_cooldown_seconds} onChange={(e) => setForm({...form, alert_cooldown_seconds: parseInt(e.target.value)})} />
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Settings
