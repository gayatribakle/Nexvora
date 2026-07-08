import React, { useState, useEffect } from 'react'
import { safetyOfficerAPI } from '../../services/api'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'

const IncidentReview: React.FC = () => {
  const [violations, setViolations] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchQueue()
  }, [page])

  const fetchQueue = async () => {
    setLoading(true)
    try {
      const res = await safetyOfficerAPI.incidentReviewQueue({ page, limit: 20 })
      setViolations(res.data.violations || [])
      setTotal(res.data.total || 0)
    } catch {}
    setLoading(false)
  }

  const handleApprove = async (id: number) => {
    try {
      await safetyOfficerAPI.approveViolation(id)
      fetchQueue()
    } catch {}
  }

  const handleReject = async (id: number) => {
    const reason = prompt('Rejection reason:')
    if (!reason) return
    try {
      await safetyOfficerAPI.rejectViolation(id, reason)
      fetchQueue()
    } catch {}
  }

  const getConfidenceBadge = (level: string) => {
    const colors: Record<string, string> = {
      HIGH: 'bg-green-500/20 text-green-400',
      PROBABLE: 'bg-yellow-500/20 text-yellow-400',
      LOW_CONFIDENCE: 'bg-red-500/20 text-red-400',
    }
    return colors[level] || 'bg-gray-500/20 text-gray-400'
  }

  const formatViolationType = (type: string) => type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown'

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Incident Review Queue</div>
        <div className="page-subtitle">Review and approve/reject detected violations ({total} pending review)</div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Worker</th>
                  <th>Violation</th>
                  <th>Confidence</th>
                  <th>Level</th>
                  <th>Face Match</th>
                  <th>Detected</th>
                  <th>Evidence</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {violations.length === 0 && (
                  <tr>
                    <td colSpan={9}>
                      <div className="empty-state">
                        <div className="empty-state-text">No violations pending review</div>
                      </div>
                    </td>
                  </tr>
                )}
                {violations.map((v: any) => (
                  <tr key={v.id}>
                    <td>{v.id}</td>
                    <td style={{ fontWeight: 500 }}>{v.worker_name}</td>
                    <td>{formatViolationType(v.violation_type)}</td>
                    <td>{v.confidence ? `${(v.confidence * 100).toFixed(1)}%` : 'N/A'}</td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getConfidenceBadge(v.confidence_level)}`}>
                        {v.confidence_level || 'N/A'}
                      </span>
                    </td>
                    <td className="text-sm">{v.face_confidence ? `${(v.face_confidence * 100).toFixed(1)}%` : '—'}</td>
                    <td className="text-xs text-muted">{new Date(v.detected_at).toLocaleString()}</td>
                    <td>
                      <span className="text-xs text-muted">
                        {v.evidence_files?.length || 0} files
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleApprove(v.id)}>Approve</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReject(v.id)}>Reject</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > 20 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span className="text-sm text-muted flex items-center">Page {page}</span>
              <Button variant="outline" size="sm" disabled={violations.length < 20} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default IncidentReview
