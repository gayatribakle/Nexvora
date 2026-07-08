import React, { useState, useEffect } from 'react'
import { faceAPI } from '../../services/api'

function simColor(sim: number): string {
  if (sim >= 0.75) return 'var(--color-danger)'
  if (sim >= 0.60) return 'rgba(255,193,7,0.9)'
  if (sim >= 0.40) return 'rgba(76,175,80,0.8)'
  return 'var(--color-text-muted)'
}

function simBg(sim: number, isSelf: boolean): string {
  if (isSelf) return 'rgba(76,175,80,0.15)'
  if (sim >= 0.75) return 'rgba(244,67,54,0.2)'
  if (sim >= 0.60) return 'rgba(255,193,7,0.15)'
  return 'transparent'
}

const FaceSeparation: React.FC = () => {
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    faceAPI.separationReport()
      .then(res => setReport(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>
  if (error) return <div className="empty-state"><div className="empty-state-text">Error: {error}</div></div>
  if (!report || report.error) return <div className="empty-state"><div className="empty-state-text">{report?.error || 'No data'}</div></div>

  const { labels, matrix, status, max_cross_similarity, max_cross_pair, recommendations, cross_pairs_above_threshold, self_similarities, cross_similarities, threshold } = report

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Face Recognition Separation Report</div>
        <div className="page-subtitle">Measure identity distinctiveness between enrolled workers</div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="card-title">Separation Status</div>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{
            display: 'inline-block', padding: '8px 20px', borderRadius: 6,
            fontSize: 18, fontWeight: 700, marginBottom: 12,
            background: status === 'POOR_IDENTITY_SEPARATION' ? 'rgba(244,67,54,0.15)' :
                        status === 'MODERATE_SEPARATION' ? 'rgba(255,193,7,0.15)' : 'rgba(76,175,80,0.15)',
            color: status === 'POOR_IDENTITY_SEPARATION' ? 'var(--color-danger)' :
                   status === 'MODERATE_SEPARATION' ? '#ffc107' : 'var(--color-success)',
          }}>
            {status === 'POOR_IDENTITY_SEPARATION' ? 'POOR IDENTITY SEPARATION' :
             status === 'MODERATE_SEPARATION' ? 'MODERATE SEPARATION' : 'GOOD SEPARATION'}
          </div>

          {max_cross_pair && (
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 8 }}>
              Highest cross-worker similarity: <strong style={{ color: simColor(max_cross_similarity) }}>{max_cross_similarity.toFixed(4)}</strong> ({max_cross_pair})
            </div>
          )}
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 8 }}>
            Current threshold: <strong>{threshold}</strong>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="card-title">Similarity Matrix <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--color-text-muted)' }}> — self vs cross-worker</span></div>
        </div>
        <div style={{ padding: 16, overflowX: 'auto' }}>
          <table className="table" style={{ minWidth: labels.length * 140 + 100 }}>
            <thead>
              <tr>
                <th style={{ position: 'sticky', left: 0, background: 'var(--color-card)', minWidth: 90 }}>Worker</th>
                {labels.map((l: string, i: number) => (
                  <th key={i} style={{ textAlign: 'center', minWidth: 100 }}>{l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row: number[], i: number) => (
                <tr key={i}>
                  <td style={{ position: 'sticky', left: 0, background: 'var(--color-card)', fontWeight: 600 }}>{labels[i]}</td>
                  {row.map((sim: number, j: number) => (
                    <td key={j} style={{
                      textAlign: 'center', padding: '10px 8px',
                      background: simBg(sim, i === j),
                      border: i !== j && sim > 0.75 ? '2px solid var(--color-danger)' : '1px solid var(--color-border)',
                      fontWeight: i === j ? 700 : 400,
                      color: simColor(sim),
                    }}>
                      {sim.toFixed(2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {cross_pairs_above_threshold && cross_pairs_above_threshold.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <div className="card-title" style={{ color: 'var(--color-danger)' }}>Flagged Cross-Worker Pairs (similarity &gt; 0.75)</div>
          </div>
          <div style={{ padding: 16 }}>
            <table className="table">
              <thead><tr><th>Worker A</th><th>Worker B</th><th>Similarity</th><th>Issue</th></tr></thead>
              <tbody>
                {cross_pairs_above_threshold.map((p: any, i: number) => (
                  <tr key={i} style={{ background: 'rgba(244,67,54,0.08)' }}>
                    <td>{p.worker_a}</td>
                    <td>{p.worker_b}</td>
                    <td style={{ color: 'var(--color-danger)', fontWeight: 700 }}>{p.similarity.toFixed(4)}</td>
                    <td style={{ color: 'var(--color-danger)' }}>POOR IDENTITY SEPARATION</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="card-title">Per-Worker Metrics</div>
        </div>
        <div style={{ padding: 16 }}>
          <table className="table">
            <thead><tr><th>Worker</th><th>Self-Similarity</th><th>Max Cross-Similarity</th><th>Min Cross-Similarity</th><th>Separation Margin</th></tr></thead>
            <tbody>
              {labels.map((name: string, i: number) => {
                const selfSim = self_similarities[i]
                const crossVals = Object.values(cross_similarities[name]) as number[]
                const maxCross = Math.max(...crossVals)
                const minCross = Math.min(...crossVals)
                const margin = selfSim - maxCross
                return (
                  <tr key={i} style={{ background: margin < 0.20 ? 'rgba(244,67,54,0.06)' : margin < 0.40 ? 'rgba(255,193,7,0.06)' : '' }}>
                    <td style={{ fontWeight: 600 }}>{name}</td>
                    <td style={{ color: simColor(selfSim), fontWeight: 700 }}>{selfSim.toFixed(4)}</td>
                    <td style={{ color: simColor(maxCross) }}>{maxCross.toFixed(4)}</td>
                    <td>{minCross.toFixed(4)}</td>
                    <td style={{
                      color: margin < 0.20 ? 'var(--color-danger)' : margin < 0.40 ? '#ffc107' : 'var(--color-success)',
                      fontWeight: 600,
                    }}>
                      {margin.toFixed(4)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {recommendations && recommendations.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Recommendations</div>
          </div>
          <div style={{ padding: 16 }}>
            <ol style={{ margin: 0, paddingLeft: 20 }}>
              {recommendations.map((r: string, i: number) => (
                <li key={i} style={{ marginBottom: 8, fontSize: 13, lineHeight: 1.6 }}>{r}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}

export default FaceSeparation