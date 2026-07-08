import React, { useState, useEffect } from 'react'
import { faceAPI } from '../../services/api'

function barColor(val: number, good: number, bad: number): string {
  if (val >= good) return 'var(--color-success)'
  if (val >= bad) return '#ffc107'
  return 'var(--color-danger)'
}

function fmt(v: any): string {
  if (v === null || v === undefined || v === 0) return '—'
  return typeof v === 'number' ? v.toFixed(2) : String(v)
}

const FaceQuality: React.FC = () => {
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReport = () => {
    setLoading(true)
    faceAPI.qualityAnalytics()
      .then(res => setReport(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchReport() }, [])
  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>
  if (error) return <div className="empty-state"><div className="empty-state-text">Error: {error}</div></div>

  const r = report || {}

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Face Quality Analytics</div>
        <div className="page-subtitle">Diagnose why live CCTV face similarities stay low — measure crop quality vs recognition score</div>
      </div>

      <div className="card" style={{ marginBottom: 16, position: 'relative' }}>
        <div className="card-header">
          <div className="card-title">Model Information</div>
        </div>
        <div style={{ padding: 16 }}>
          <table className="table">
            <tbody>
              <tr><td style={{ fontWeight: 600, width: 240 }}>Primary Embedding Model</td><td>DeepFace Facenet512 (TensorFlow/Keras, 95MB weights)</td></tr>
              <tr><td style={{ fontWeight: 600 }}>Fallback Model</td><td>facenet-pytorch InceptionResnetV1 (VGGFace2 pretrained)</td></tr>
              <tr><td style={{ fontWeight: 600 }}>Active Model (on this CPU)</td><td style={{ color: 'var(--color-danger)', fontWeight: 700 }}>facenet-pytorch fallback — DeepFace hangs on Core Ultra 5 125H (no AVX)</td></tr>
              <tr><td style={{ fontWeight: 600 }}>Enrollment Cross-Similarity</td><td>0.45 (Tulsidas vs Javed) — <strong>GOOD SEPARATION</strong></td></tr>
              <tr><td style={{ fontWeight: 600 }}>Live CCTV Avg Similarity</td><td style={{ color: 'var(--color-warning)', fontWeight: 700 }}>{(r.avg_similarity || 0).toFixed(4)}</td></tr>
              <tr><td style={{ fontWeight: 600 }}>Similarity Gap</td><td>{(r.avg_similarity || 0) > 0 ? `${((0.45 - (r.avg_similarity || 0)) * 100).toFixed(1)}% drop from enrollment to live` : 'N/A'}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {r.total_attempts === 0 && (
        <div className="card">
          <div className="card-header"><div className="card-title">No Data Yet</div></div>
          <div style={{ padding: 16 }}>
            <div className="empty-state">
              <div className="empty-state-text">No recognition attempts recorded yet. Start monitoring to collect data.</div>
            </div>
          </div>
        </div>
      )}

      {r.total_attempts > 0 && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <div className="card-title">Aggregate Quality Metrics</div>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{r.total_attempts} total attempts</span>
            </div>
            <div style={{ padding: 16 }}>
              <div className="grid grid-4" style={{ gap: 12 }}>
                <div className="stat-card">
                  <div className="stat-icon" style={{ color: barColor(r.avg_face_width, 120, 80) }}>{'\u25A2'}</div>
                  <div className="stat-content">
                    <div className="stat-value">{r.avg_face_width} × {r.avg_face_height}</div>
                    <div className="stat-label">Avg Face Size (px)</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>min: {r.min_face_width} × {r.min_face_height}px</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ color: barColor(r.avg_blur, 30, 15) }}>{'\u25C8'}</div>
                  <div className="stat-content">
                    <div className="stat-value">{r.avg_blur}</div>
                    <div className="stat-label">Avg Blur Score</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>threshold: ≥15</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ color: barColor(r.avg_brightness, 100, 50) }}>{'\u2600'}</div>
                  <div className="stat-content">
                    <div className="stat-value">{r.avg_brightness}</div>
                    <div className="stat-label">Avg Brightness</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>range: 30-240</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ color: barColor(r.avg_similarity * 100, 50, 40) }}>{'\u2248'}</div>
                  <div className="stat-content">
                    <div className="stat-value">{(r.avg_similarity || 0).toFixed(4)}</div>
                    <div className="stat-label">Avg Similarity</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>target: {'>'}0.50</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {(r.tiny_faces > 0 || r.blurry_faces > 0 || r.dark_faces > 0) && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <div className="card-title" style={{ color: 'var(--color-warning)' }}>Flagged Low-Quality Crops</div>
              </div>
              <div style={{ padding: 16 }}>
                <div className="grid grid-3" style={{ gap: 12, marginBottom: 16 }}>
                  <div style={{ padding: 12, borderRadius: 8, background: r.tiny_faces > 0 ? 'rgba(244,67,54,0.1)' : 'rgba(76,175,80,0.08)', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: r.tiny_faces > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>{r.tiny_faces}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text)' }}>Tiny Faces ({'<'}80×80px)</div>
                  </div>
                  <div style={{ padding: 12, borderRadius: 8, background: r.blurry_faces > 0 ? 'rgba(244,67,54,0.1)' : 'rgba(76,175,80,0.08)', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: r.blurry_faces > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>{r.blurry_faces}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text)' }}>Blurry Faces (blur {'<'} 15)</div>
                  </div>
                  <div style={{ padding: 12, borderRadius: 8, background: r.dark_faces > 0 ? 'rgba(244,67,54,0.1)' : 'rgba(76,175,80,0.08)', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: r.dark_faces > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>{r.dark_faces}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text)' }}>Dark Faces (brightness {'<'} 30)</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {r.width_buckets && Object.keys(r.width_buckets).length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <div className="card-title">Face Size vs Similarity (by width bucket)</div>
              </div>
              <div style={{ padding: 16 }}>
                <table className="table">
                  <thead><tr><th>Width Bucket (px)</th><th>Count</th><th>Avg Similarity</th></tr></thead>
                  <tbody>
                    {Object.entries(r.width_buckets).map(([bucket, info]: [string, any]) => (
                      <tr key={bucket} style={{
                        background: info.avg_similarity < 0.40 ? 'rgba(244,67,54,0.06)' : info.avg_similarity < 0.45 ? 'rgba(255,193,7,0.06)' : '',
                      }}>
                        <td>{bucket}</td>
                        <td>{info.count}</td>
                        <td style={{
                          color: barColor(info.avg_similarity, 0.50, 0.40),
                          fontWeight: 600,
                        }}>{info.avg_similarity.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {r.flagged_entries && r.flagged_entries.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <div className="card-title" style={{ color: 'var(--color-warning)' }}>Flagged Recognition Events</div>
              </div>
              <div style={{ maxHeight: 300, overflowY: 'auto', padding: 16 }}>
                <table className="table">
                  <thead><tr><th>Time</th><th>Cam</th><th>Size</th><th>Blur</th><th>Bright</th><th>Sim</th><th>Worker</th><th>Flag</th></tr></thead>
                  <tbody>
                    {r.flagged_entries.map((e: any, i: number) => (
                      <tr key={i}>
                        <td style={{ fontSize: 10 }}>{e.timestamp?.split('T')[1]?.split('.')[0] || ''}</td>
                        <td>{e.camera_id}</td>
                        <td>{e.face_width}×{e.face_height}</td>
                        <td>{(e.blur_score || 0).toFixed(1)}</td>
                        <td>{(e.brightness || 0).toFixed(0)}</td>
                        <td>{(e.similarity || 0).toFixed(4)}</td>
                        <td>{e.assigned_worker || '—'}</td>
                        <td style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{e.flags}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {r.correlation_data && r.correlation_data.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Correlation Data (last {r.correlation_data.length} attempts)</div>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>scatter-plot ready — face_size/blur/brightness vs similarity</span>
              </div>
              <div style={{ padding: 16 }}>
                <table className="table" style={{ fontSize: 11 }}>
                  <thead><tr><th>#</th><th>Width</th><th>Height</th><th>Blur</th><th>Bright</th><th>Area%</th><th>Sim</th><th>Worker</th><th>Decision</th></tr></thead>
                  <tbody>
                    {r.correlation_data.map((d: any, i: number) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{d.face_width || '—'}</td>
                        <td>{d.face_height || '—'}</td>
                        <td>{(d.blur_score || 0).toFixed(1)}</td>
                        <td>{(d.brightness || 0).toFixed(0)}</td>
                        <td>{d.face_area_percent || '—'}</td>
                        <td style={{
                          color: barColor(d.similarity || 0, 0.50, 0.40),
                          fontWeight: 600,
                        }}>{(d.similarity || 0).toFixed(4)}</td>
                        <td>{d.assigned_worker || '—'}</td>
                        <td style={{ color: d.decision === 'MATCH' ? 'var(--color-success)' : 'var(--color-text-muted)' }}>{d.decision || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <div className="card">
              <div className="card-header">
                <div className="card-title">Root Cause Analysis: Why Live Similarity is ~0.42-0.44</div>
              </div>
              <div style={{ padding: 16, fontSize: 13, lineHeight: 1.7 }}>
                <ol style={{ margin: 0, paddingLeft: 20 }}>
                  <li><strong>Model:</strong> Using <strong>facenet-pytorch fallback</strong> (not DeepFace Facenet512) — DeepFace's <code>represent()</code> hangs on this CPU (Core Ultra 5 125H lacks AVX/AVX2). The fallback model may have different embedding distribution.</li>
                  <li><strong>Enrollment images</strong> are high-quality frontal photos. Live CCTV crops are small ({r.avg_face_width}×{r.avg_face_height}px avg) after CLAHE + sharpen preprocessing.</li>
                  <li><strong>Face area:</strong> Detected face occupies small fraction of frame, limiting available detail for embedding extraction.</li>
                  <li><strong>Embedding mismatch:</strong> facenet-pytorch InceptionResnetV1 (VGGFace2) outputs 512-d. Even after L2 normalization, surveillance-quality crops produce embeddings farther from enrollment embeddings than expected.</li>
                  <li><strong>Enrollment cross-similarity (0.45) was measured using the same model pipeline</strong> (extract_face + enhance + get_embedding on enrollment photos), confirming the model can <em>theoretically</em> achieve 0.50+ self-similarity — but live crops degrade by {(r.avg_similarity ? ((0.45 - r.avg_similarity) * 100).toFixed(1) : 'N/A')}% on average.</li>
                </ol>
                <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: 'rgba(255,193,7,0.1)', border: '1px solid var(--color-warning)' }}>
                  <strong>Recommendation:</strong> The 0.02 gap threshold was already reduced from 0.05 to 0.02. The fundamental limitation is the <strong>facenet-pytorch fallback</strong> model giving lower similarity scores than Facenet512 would. If DeepFace cannot be made to work, consider: (a) lowering threshold further to 0.35, (b) improving face crop size by adjusting detection margins, or (c) using the <strong>FaceEval page's confusion matrix</strong> to find the optimal operating threshold.
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default FaceQuality