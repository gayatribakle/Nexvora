import React, { useState } from 'react'
import { safetyOfficerAPI } from '../../services/api'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'

const EmployeeVerification: React.FC = () => {
  const [unverified, setUnverified] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [verificationData, setVerificationData] = useState<any>(null)
  const [verifyWorkerId, setVerifyWorkerId] = useState('')
  const [confirmWorkerId, setConfirmWorkerId] = useState('')

  const fetchUnverified = async () => {
    setLoading(true)
    try {
      const res = await safetyOfficerAPI.unverifiedViolations({ page: 1, limit: 50 })
      setUnverified(res.data.violations || [])
      setTotal(res.data.total || 0)
    } catch {}
    setLoading(false)
  }

  const fetchVerificationData = async () => {
    if (!verifyWorkerId) return
    try {
      const res = await safetyOfficerAPI.employeeVerification(Number(verifyWorkerId))
      setVerificationData(res.data)
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Worker not found')
    }
  }

  const handleVerify = async (violationId: number, workerId: number) => {
    try {
      await safetyOfficerAPI.verifyEmployee(violationId, workerId)
      fetchUnverified()
      alert('Employee identity verified successfully')
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Verification failed')
    }
  }

  const formatViolationType = (type: string) => type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown'

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Employee Verification</div>
        <div className="page-subtitle">Verify face recognition matches and confirm worker identities</div>
      </div>

      <div className="grid grid-2" style={{ gap: 24 }}>
        {/* Unverified Violations */}
        <Card>
          <CardHeader>
            <CardTitle>Unverified Detections ({total})</CardTitle>
            <CardDescription>Violations where face recognition confidence is low</CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="sm" className="mb-4" onClick={fetchUnverified} disabled={loading}>
              {loading ? 'Loading...' : 'Load Unverified'}
            </Button>
            <div className="space-y-2">
              {unverified.length === 0 && !loading && (
                <p className="text-sm text-muted">Click "Load Unverified" to fetch violations needing verification</p>
              )}
              {unverified.map((v: any) => (
                <div key={v.id} className="flex items-center justify-between p-3 rounded border border-border bg-secondary/50">
                  <div>
                    <div className="text-sm font-medium">
                      Violation #{v.id} — {formatViolationType(v.violation_type)}
                    </div>
                    <div className="text-xs text-muted mt-1">
                      Current: {v.worker_name} | Face: {v.face_confidence ? `${(v.face_confidence * 100).toFixed(1)}%` : 'N/A'} | Gap: {v.face_gap?.toFixed(3) || 'N/A'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Correct Worker ID"
                      value={confirmWorkerId}
                      onChange={(e) => setConfirmWorkerId(e.target.value)}
                      className="w-32 bg-secondary border border-border rounded px-2 py-1 text-xs text-foreground"
                    />
                    <Button size="sm" onClick={() => handleVerify(v.id, Number(confirmWorkerId || v.worker_id))}>
                      Verify
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Employee Lookup */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Lookup</CardTitle>
            <CardDescription>Look up registered photos and embeddings for a worker</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <input
                type="number"
                placeholder="Worker ID"
                value={verifyWorkerId}
                onChange={(e) => setVerifyWorkerId(e.target.value)}
                className="flex-1 bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground"
              />
              <Button onClick={fetchVerificationData}>Lookup</Button>
            </div>

            {verificationData && (
              <div className="space-y-4">
                <div className="p-3 rounded border border-border bg-secondary/50">
                  <h4 className="text-sm font-medium">{verificationData.worker?.full_name}</h4>
                  <div className="text-xs text-muted mt-1">
                    Employee ID: {verificationData.worker?.employee_id} |
                    Dept: {verificationData.worker?.department || 'N/A'} |
                    Contractor: {verificationData.worker?.contractor || 'N/A'}
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-medium text-muted-foreground mb-2">Registered Photos ({verificationData.registered_photos?.length || 0})</h5>
                  <div className="flex flex-wrap gap-2">
                    {verificationData.registered_photos?.map((p: any) => (
                      <div key={p.id} className="text-xs p-2 rounded bg-secondary border border-border">
                        <div className="font-medium">{p.photo_type?.replace(/_/g, ' ')}</div>
                        {p.is_primary && <span className="text-accent">Primary</span>}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-medium text-muted-foreground mb-2">Embeddings ({verificationData.embeddings?.length || 0})</h5>
                  <div className="flex flex-wrap gap-2">
                    {verificationData.embeddings?.map((e: any) => (
                      <div key={e.id} className="text-xs p-2 rounded bg-secondary border border-border">
                        {e.photo_type?.replace(/_/g, ' ')} ({e.model_name}, {e.embedding_dim}d)
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-medium text-muted-foreground mb-2">Recent Violations ({verificationData.recent_violations?.length || 0})</h5>
                  {verificationData.recent_violations?.map((v: any) => (
                    <div key={v.id} className="flex items-center justify-between text-xs p-2 border-b border-border">
                      <span>{formatViolationType(v.violation_type)}</span>
                      <span className={v.needs_review ? 'text-yellow-400' : 'text-green-400'}>
                        {v.status} {v.needs_review ? '(needs review)' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default EmployeeVerification
