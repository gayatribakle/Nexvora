import React, { useState, useEffect } from 'react'
import { penaltyRulesAPI } from '../../services/api'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'

const PenaltyRules: React.FC = () => {
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingRule, setEditingRule] = useState<any>(null)
  const [form, setForm] = useState({
    violation_type: '',
    base_amount: 500,
    escalation_enabled: false,
    escalation_multiplier: 1.5,
    max_amount: 10000,
  })

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    try {
      const res = await penaltyRulesAPI.list()
      setRules(res.data || [])
    } catch {}
  }

  const resetForm = () => {
    setForm({
      violation_type: '',
      base_amount: 500,
      escalation_enabled: false,
      escalation_multiplier: 1.5,
      max_amount: 10000,
    })
    setEditingRule(null)
    setShowForm(false)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      if (editingRule) {
        await penaltyRulesAPI.update(editingRule.id, form)
      } else {
        await penaltyRulesAPI.create(form)
      }
      resetForm()
      fetchRules()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Operation failed')
    }
    setLoading(false)
  }

  const handleEdit = (rule: any) => {
    setForm({
      violation_type: rule.violation_type,
      base_amount: rule.base_amount,
      escalation_enabled: rule.escalation_enabled,
      escalation_multiplier: rule.escalation_multiplier,
      max_amount: rule.max_amount,
    })
    setEditingRule(rule)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Deactivate this penalty rule?')) return
    try {
      await penaltyRulesAPI.remove(id)
      fetchRules()
    } catch {}
  }

  const formatViolationType = (type: string) => type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Penalty Rules</div>
        <div className="page-subtitle">Configure violation penalties and escalation rules</div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Button onClick={() => { resetForm(); setShowForm(true) }}>
          + Add Penalty Rule
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingRule ? 'Edit Penalty Rule' : 'New Penalty Rule'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {!editingRule && (
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Violation Type</label>
                  <select
                    value={form.violation_type}
                    onChange={(e) => setForm({ ...form, violation_type: e.target.value })}
                    className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground"
                  >
                    <option value="">Select type...</option>
                    <option value="no_hardhat">No Hardhat</option>
                    <option value="no_safety_vest">No Safety Vest</option>
                    <option value="no_mask">No Mask</option>
                    <option value="ppe_violation">PPE Violation</option>
                    <option value="smoking">Smoking</option>
                    <option value="fire">Fire</option>
                  </select>
                </div>
              )}
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Base Amount (₹)</label>
                <input
                  type="number"
                  value={form.base_amount}
                  onChange={(e) => setForm({ ...form, base_amount: Number(e.target.value) })}
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.escalation_enabled}
                    onChange={(e) => setForm({ ...form, escalation_enabled: e.target.checked })}
                  />
                  Escalation Enabled
                </label>
                <p className="text-xs text-muted">Increase fine for repeat offenders</p>
              </div>
              {form.escalation_enabled && (
                <>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Escalation Multiplier</label>
                    <input
                      type="number"
                      step="0.1"
                      value={form.escalation_multiplier}
                      onChange={(e) => setForm({ ...form, escalation_multiplier: Number(e.target.value) })}
                      className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground"
                    />
                    <p className="text-xs text-muted mt-1">Base × multiplier^count for repeat offenses</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Max Amount (₹)</label>
                    <input
                      type="number"
                      value={form.max_amount}
                      onChange={(e) => setForm({ ...form, max_amount: Number(e.target.value) })}
                      className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Rule'}
              </Button>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Active Penalty Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Violation Type</th>
                  <th>Base Amount</th>
                  <th>Escalation</th>
                  <th>Multiplier</th>
                  <th>Max Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <div className="empty-state-text">No penalty rules configured</div>
                      </div>
                    </td>
                  </tr>
                )}
                {rules.map((r: any) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 500 }}>{formatViolationType(r.violation_type)}</td>
                    <td>₹{r.base_amount.toLocaleString()}</td>
                    <td>
                      {r.escalation_enabled ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">Enabled</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-500/20 text-gray-400">Disabled</span>
                      )}
                    </td>
                    <td>{r.escalation_enabled ? `${r.escalation_multiplier}x` : '—'}</td>
                    <td>{r.escalation_enabled ? `₹${r.max_amount.toLocaleString()}` : '—'}</td>
                    <td>
                      {r.is_active ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">Active</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400">Inactive</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(r)}>Edit</Button>
                        {r.is_active && (
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(r.id)}>Deactivate</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PenaltyRules
