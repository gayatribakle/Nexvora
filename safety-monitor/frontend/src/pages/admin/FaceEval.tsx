import React, { useState } from 'react'
import { faceAPI } from '../../services/api'

const FaceEval: React.FC = () => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runEval = async () => {
    setLoading(true)
    try {
      const res = await faceAPI.evaluate()
      setData(res.data)
    } catch (e) {
      console.error(e)
      alert('Evaluation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Face Recognition Evaluation</div>
        <div className="page-subtitle">Confusion matrix and accuracy metrics</div>
      </div>

      <button className="btn btn-primary" onClick={runEval} disabled={loading} style={{ marginBottom: 16 }}>
        {loading ? 'Running...' : 'Run Evaluation'}
      </button>

      {data && (
        <>
          <div className="grid grid-4" style={{ marginBottom: 16 }}>
            <div className="stat-card">
              <div className="stat-content">
                <div className="stat-value">{(data.accuracy * 100).toFixed(1)}%</div>
                <div className="stat-label">Accuracy</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-content">
                <div className="stat-value" style={{ color: 'var(--color-danger)' }}>{(data.false_positive_rate * 100).toFixed(1)}%</div>
                <div className="stat-label">False Positive Rate</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-content">
                <div className="stat-value" style={{ color: 'var(--color-warning)' }}>{(data.false_negative_rate * 100).toFixed(1)}%</div>
                <div className="stat-label">False Negative Rate</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-content">
                <div className="stat-value">{data.evaluated_workers}</div>
                <div className="stat-label">Workers Evaluated</div>
              </div>
            </div>
          </div>

          <div className="grid grid-3" style={{ marginBottom: 16 }}>
            <div className="card"><div className="card-header"><div className="card-title">TP: {data.true_positives}</div></div></div>
            <div className="card"><div className="card-header"><div className="card-title">FP: {data.false_positives}</div></div></div>
            <div className="card"><div className="card-header"><div className="card-title">TN: {data.true_negatives}</div></div></div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <div className="card-title">Confusion Matrix</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Threshold: {data.threshold_used} | Gap: {data.gap_threshold_used}</div>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Worker</th>
                  {data.worker_ids.map((id: number) => <th key={id}>#{id}</th>)}
                  <th>Genuine</th>
                  <th>Impostor</th>
                </tr>
              </thead>
              <tbody>
                {data.per_worker.map((row: any) => (
                  <tr key={row.worker_id}>
                    <td><strong>{row.worker_name}</strong></td>
                    {data.worker_ids.map((id: number) => {
                      const score = row.scores.find((s: any) => s.against_worker_id === id)
                      const isSelf = id === row.worker_id
                      return (
                        <td key={id} style={{
                          background: isSelf ? 'rgba(76,175,80,0.15)' : 'rgba(244,67,54,0.05)',
                          fontWeight: isSelf ? 600 : 400,
                          color: score && score.similarity >= data.threshold_used ? 'var(--color-success)' : 'var(--color-text-muted)'
                        }}>
                          {score ? score.similarity.toFixed(4) : '-'}
                        </td>
                      )
                    })}
                    <td style={{ color: 'var(--color-success)' }}>
                      {data.genuine?.avg ? (data.genuine.avg).toFixed(4) : '-'}
                    </td>
                    <td style={{ color: 'var(--color-danger)' }}>
                      {data.impostor?.avg ? (data.impostor.avg).toFixed(4) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Per-Worker Scores</div></div>
            {data.per_worker.map((row: any) => (
              <div key={row.worker_id} style={{ padding: 12, borderBottom: '1px solid var(--color-border)' }}>
                <h4 style={{ marginBottom: 8 }}>{row.worker_name}</h4>
                <table className="table">
                  <thead><tr><th>Against</th><th>Similarity</th><th>Decision</th></tr></thead>
                  <tbody>
                    {row.scores.map((s: any, i: number) => {
                      const isSelf = s.against_worker_id === row.worker_id
                      const passed = s.similarity >= data.threshold_used
                      return (
                        <tr key={i} style={{
                          background: isSelf ? 'rgba(76,175,80,0.08)' : '',
                          fontWeight: isSelf ? 600 : 400
                        }}>
                          <td>{s.against_worker_name} {isSelf ? '(self)' : ''}</td>
                          <td>{s.similarity.toFixed(4)}</td>
                          <td>
                            {isSelf
                              ? (passed ? '✓ TP' : '✗ FN')
                              : (passed ? '✗ FP' : '✓ TN')
                            }
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default FaceEval
