import React, { useState, useEffect } from 'react'
import { faceAPI } from '../../services/api'
import { formatIST } from '../../utils/formatIST'

const API_BASE = ''

function imgUrl(path: string | null | undefined): string {
  if (!path) return ''
  const parts = path.replace(/\\/g, '/').split('uploads')
  return parts.length > 1 ? `${API_BASE}/uploads${parts[1]}` : path
}

function confidenceClass(level: string) {
  if (level === 'HIGH') return 'color-success'
  if (level === 'PROBABLE') return 'color-warning'
  return 'color-danger'
}

function decisionColor(d: string) {
  if (d === 'MATCH' || d === 'CONFIRMED') return 'var(--color-success)'
  if (d === 'NO_FACE' || d === 'WAITING') return 'var(--color-text-muted)'
  if (d === 'LOW_QUALITY_FACE') return 'orange'
  if (d === 'NO_CONSENSUS') return 'var(--color-warning)'
  return 'var(--color-danger)'
}

const FaceAudit: React.FC = () => {
  const [entries, setEntries] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [workersCache, setWorkersCache] = useState<Record<number, any>>({})

  useEffect(() => {
    Promise.all([
      faceAPI.auditList(),
      faceAPI.recognitionStats(),
    ]).then(([auditRes, statsRes]) => {
      setEntries(auditRes.data.entries || [])
      setStats(statsRes.data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const viewDetail = async (metaFile: string) => {
    try {
      const res = await faceAPI.auditDetail(metaFile)
      setSelected(res.data)
      const wid = res.data.worker_id
      if (wid && !workersCache[wid]) {
        try {
          const wr = await faceAPI.auditList()
          const allW = wr.data.entries || []
        } catch {}
      }
    } catch (e) {
      console.error(e)
    }
  }

  const getWorkerImageUrl = (workerId: number | null | undefined): string => {
    if (!workerId) return ''
    return `/uploads/workers/worker_${workerId}_`
  }

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Face Recognition Audit</div>
        <div className="page-subtitle">Verify worker assignments, review confidence levels, and detect recognition bias</div>
      </div>

      {stats && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <div className="card-title">Recognition Statistics</div>
          </div>
          <div style={{ padding: 16 }}>
            <div className="grid grid-4" style={{ marginBottom: 16, gap: 12 }}>
              <div className="stat-card">
                <div className="stat-icon green">{'Σ'}</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.total_assigned || 0}</div>
                  <div className="stat-label">Total Assigned</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon red">{'?'}</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.metrics?.unknown || 0}</div>
                  <div className="stat-label">Total Unknown</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon blue">{'H'}</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.high_confidence_matches || 0}</div>
                  <div className="stat-label">High Confidence</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon yellow">{'P'}</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.probable_matches || 0}</div>
                  <div className="stat-label">Probable Matches</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon purple">{'~'}</div>
                <div className="stat-content">
                  <div className="stat-value">{(stats.metrics?.avg_similarity || 0).toFixed(3)}</div>
                  <div className="stat-label">Avg Similarity</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon grey">{'Δ'}</div>
                <div className="stat-content">
                  <div className="stat-value">{(stats.average_gap || 0).toFixed(2)}</div>
                  <div className="stat-label">Min Gap</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon orange">{'!'}</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.needs_review || 0}</div>
                  <div className="stat-label">Needs Review</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon green">{'%'}</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.metrics?.recognition_rate || 0}%</div>
                  <div className="stat-label">Recognition Rate</div>
                </div>
              </div>
            </div>

            {stats.bias_warning && (
              <div className="alert alert-danger" style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: 'rgba(244,67,54,0.12)', border: '1px solid var(--color-danger)' }}>
                <strong style={{ color: 'var(--color-danger)', fontSize: 14 }}>POSSIBLE RECOGNITION BIAS DETECTED</strong>
                <div style={{ marginTop: 4, fontSize: 12, color: 'var(--color-text)' }}>
                  {stats.bias_warning.worker_name} receives {stats.bias_warning.percentage}% of all assignments ({stats.bias_warning.assignments}/{stats.bias_warning.total_assigned})
                </div>
              </div>
            )}

            {stats.distribution && stats.distribution.length > 0 && (
              <div>
                <h4 style={{ marginBottom: 8, fontSize: 13, color: 'var(--color-text-muted)' }}>Worker Assignment Distribution</h4>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {stats.distribution.map((d: any, i: number) => {
                    const isBias = stats.bias_warning && d.worker_id === stats.bias_warning.worker_id
                    return (
                      <div
                        key={i}
                        style={{
                          flex: 1, minWidth: 160, padding: 12, borderRadius: 8,
                          border: isBias ? '2px solid var(--color-danger)' : '1px solid var(--color-border)',
                          background: isBias ? 'rgba(244,67,54,0.08)' : 'var(--color-card)',
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: isBias ? 'var(--color-danger)' : 'var(--color-text)' }}>
                          {d.worker_name}
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 2 }}>{d.assignments}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{d.percentage}% of assignments</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-2" style={{ gap: 16 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Recognition Events ({entries.length})</div>
          </div>
          <div style={{ maxHeight: 600, overflowY: 'auto' }}>
            {entries.length === 0 && (
              <div className="empty-state"><div className="empty-state-text">No recognition data yet</div></div>
            )}
            {entries.map((e: any, i: number) => {
              const level = e.confidence >= 0.50 ? 'HIGH' : e.confidence >= 0.40 ? 'PROBABLE' : e.worker_id ? 'LOW' : 'NONE'
              return (
                <div
                  key={i}
                  className="clickable-row"
                  onClick={() => viewDetail(e.raw_face_path?.replace('_raw_face.jpg', '_meta.json')?.split('\\').pop() || '')}
                  style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                      background: level === 'HIGH' ? 'rgba(76,175,80,0.2)' : level === 'PROBABLE' ? 'rgba(255,193,7,0.2)' : 'rgba(244,67,54,0.15)',
                      color: level === 'HIGH' ? 'var(--color-success)' : level === 'PROBABLE' ? '#ffc107' : 'var(--color-danger)',
                    }}>
                      {level}
                    </span>
                    <span style={{ fontSize: 11, color: decisionColor(e.decision), fontWeight: 600, width: 90 }}>{e.decision}</span>
                    <span style={{ fontSize: 12, flex: 1 }}>
                      cam{e.camera_id} | sim:{(e.confidence || 0).toFixed(3)} | {e.worker_name || 'Unknown'}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4 }}>
                    {formatIST(e.timestamp)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">Visual Comparison</div></div>
          <div style={{ padding: 16 }}>
            {!selected && <div className="empty-state"><div className="empty-state-text">Click an event to view side-by-side comparison</div></div>}
            {selected && (
              <div>
                <div className="grid grid-2" style={{ gap: 12, marginBottom: 16 }}>
                  {selected.raw_face_url && (
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>Detected Face (raw)</div>
                      <img src={imgUrl(selected.raw_face_url)} alt="raw" style={{ width: '100%', borderRadius: 8, border: '1px solid var(--color-border)', background: '#111' }} />
                    </div>
                  )}
                  {selected.enhanced_face_url && (
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>Enhanced Face (CLAHE+sharpen)</div>
                      <img src={imgUrl(selected.enhanced_face_url)} alt="enhanced" style={{ width: '100%', borderRadius: 8, border: '1px solid var(--color-border)', background: '#111' }} />
                    </div>
                  )}
                </div>

                <div className="grid grid-2" style={{ gap: 12, marginBottom: 16 }}>
                  {selected.worker_id && (
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                        Assigned Worker: {selected.worker_name || `#${selected.worker_id}`}
                      </div>
                      <img
                        src={`/uploads/workers/worker_${selected.worker_id}_`}
                        alt="assigned worker"
                        style={{ width: '100%', borderRadius: 8, border: '2px solid var(--color-success)', background: '#111', minHeight: 100, objectFit: 'contain' }}
                        onError={(e: any) => { e.target.style.display = 'none' }}
                      />
                    </div>
                  )}
                  {selected.all_scores && selected.all_scores.length > 1 && (
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                        Second Best: {selected.all_scores[1]?.worker_name || 'N/A'}
                      </div>
                      <div style={{
                        width: '100%', borderRadius: 8, border: '1px solid var(--color-border)',
                        background: '#111', minHeight: 100, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', padding: 8,
                      }}>
                        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                          sim: {(selected.all_scores[1]?.similarity || 0).toFixed(4)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <table className="table">
                  <tbody>
                    <tr>
                      <td>Decision</td>
                      <td><strong style={{ color: decisionColor(selected.decision) }}>{selected.decision}</strong></td>
                    </tr>
                    <tr>
                      <td>Worker</td>
                      <td>{selected.worker_name || 'Unknown'} {selected.worker_id ? `(#${selected.worker_id})` : ''}</td>
                    </tr>
                    <tr>
                      <td>Confidence Level</td>
                      <td>
                        <span style={{
                          padding: '2px 10px', borderRadius: 4, fontSize: 12, fontWeight: 700,
                          background: selected.confidence >= 0.50 ? 'rgba(76,175,80,0.2)' : selected.confidence >= 0.40 ? 'rgba(255,193,7,0.2)' : 'rgba(244,67,54,0.15)',
                          color: selected.confidence >= 0.50 ? 'var(--color-success)' : selected.confidence >= 0.40 ? '#ffc107' : 'var(--color-danger)',
                        }}>
                          {selected.confidence >= 0.50 ? 'HIGH' : selected.confidence >= 0.40 ? 'PROBABLE' : 'UNKNOWN'}
                        </span>
                      </td>
                    </tr>
                    <tr><td>Best Similarity</td><td>{(selected.confidence || 0).toFixed(4)}</td></tr>
                    {selected.all_scores && selected.all_scores.length > 1 && (
                      <tr><td>Second-Best Similarity</td><td>{(selected.all_scores[1]?.similarity || 0).toFixed(4)}</td></tr>
                    )}
                    {selected.gap !== undefined && (
                      <tr><td>Gap Score</td><td>{(selected.gap || 0).toFixed(4)}</td></tr>
                    )}
                    <tr><td>Camera</td><td>{selected.camera_id}</td></tr>
                    <tr><td>Timestamp</td><td>{formatIST(selected.timestamp)}</td></tr>
                    {selected.quality?.face_width && <tr><td>Face Size</td><td>{selected.quality.face_width} × {selected.quality.face_height}px</td></tr>}
                    {selected.quality?.blur_score && <tr><td>Blur Score</td><td>{(selected.quality.blur_score || 0).toFixed(1)}</td></tr>}
                    {selected.quality?.brightness && <tr><td>Brightness</td><td>{(selected.quality.brightness || 0).toFixed(1)}</td></tr>}
                  </tbody>
                </table>

                {selected.vote_history && selected.vote_history.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <h4 style={{ marginBottom: 8, fontSize: 13, color: 'var(--color-text-muted)' }}>Voting History ({selected.vote_history.length} frames)</h4>
                    <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                      <table className="table">
                        <thead><tr><th>#</th><th>Worker</th><th>Similarity</th><th>Label</th><th>Weight</th><th>Decision</th></tr></thead>
                        <tbody>
                          {selected.vote_history.map((v: any, i: number) => (
                            <tr key={i} style={{
                              background: v.worker_id === selected.worker_id ? 'rgba(76,175,80,0.06)' : '',
                            }}>
                              <td>{i + 1}</td>
                              <td>{v.worker_name || 'None'}</td>
                              <td>{(v.confidence || 0).toFixed(3)}</td>
                              <td>
                                <span style={{
                                  padding: '1px 6px', borderRadius: 3, fontSize: 10, fontWeight: 600,
                                  background: v.label === 'HIGH' ? 'rgba(76,175,80,0.2)' : v.label === 'PROBABLE' ? 'rgba(255,193,7,0.2)' : 'transparent',
                                  color: v.label === 'HIGH' ? 'var(--color-success)' : v.label === 'PROBABLE' ? '#ffc107' : 'var(--color-text-muted)',
                                }}>
                                  {v.label || 'NONE'}
                                </span>
                              </td>
                              <td>{v.weight || 0}</td>
                              <td style={{ color: decisionColor(v.decision), fontSize: 11 }}>{v.decision || ''}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {selected.all_scores && selected.all_scores.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <h4 style={{ marginBottom: 8, fontSize: 13, color: 'var(--color-text-muted)' }}>All Match Scores ({selected.all_scores.length} workers)</h4>
                    <table className="table">
                      <thead><tr><th>Worker</th><th>Similarity</th><th>Rank</th></tr></thead>
                      <tbody>
                        {selected.all_scores
                          .sort((a: any, b: any) => (b.similarity || 0) - (a.similarity || 0))
                          .map((s: any, i: number) => (
                          <tr key={i} style={{
                            background: s.worker_id === selected.worker_id ? 'rgba(76,175,80,0.1)' : '',
                            fontWeight: s.worker_id === selected.worker_id ? 600 : 400,
                          }}>
                            <td>{s.worker_name || `#${s.worker_id}`}</td>
                            <td>{(s.similarity || 0).toFixed(4)}</td>
                            <td>{i === 0 ? 'Best' : i === 1 ? '2nd' : `${i + 1}th`}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FaceAudit