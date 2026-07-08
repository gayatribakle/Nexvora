import React, { useState, useEffect } from 'react'
import { faceAPI } from '../../services/api'

const fieldStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '14px 16px', borderBottom: '1px solid var(--color-border)',
}

const labelStyle: React.CSSProperties = {
  fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500,
}

const valueStyle = (color?: string): React.CSSProperties => ({
  fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: color || 'var(--color-text)',
})

const FaceRuntime: React.FC = () => {
  const [info, setInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    faceAPI.recognitionEngine()
      .then(res => setInfo(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>
  if (error) return <div className="empty-state"><div className="empty-state-text">Error: {error}</div></div>
  if (!info) return <div className="empty-state"><div className="empty-state-text">No engine info available</div></div>

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Face Recognition Runtime Report</div>
        <div className="page-subtitle">Active recognition engine, model details, and fallback status</div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="card-title">Recognition Engine</div>
        </div>
        <div style={{ padding: 0 }}>
          <div style={fieldStyle}>
            <span style={labelStyle}>Recognition Engine</span>
            <span style={{
              ...valueStyle(info.last_used_engine === 'deepface' ? 'var(--color-success)' : info.last_used_engine === 'facenet-pytorch' ? '#ffc107' : 'var(--color-text-muted)'),
              textTransform: 'uppercase',
            }}>
              {info.recognition_engine}
            </span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Model Name</span>
            <span style={valueStyle()}>{info.model_name}</span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Embedding Dimension</span>
            <span style={valueStyle()}>{info.embedding_dimension}</span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Model Source File</span>
            <span style={{ ...valueStyle(), fontSize: 12 }}>{info.model_source_file}</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="card-title">Initialization Status</div>
        </div>
        <div style={{ padding: 0 }}>
          <div style={fieldStyle}>
            <span style={labelStyle}>DeepFace Initialized</span>
            <span style={{
              ...valueStyle(info.deepface_initialized ? 'var(--color-success)' : 'var(--color-danger)'),
              fontWeight: 700,
            }}>
              {info.deepface_initialized ? 'True' : 'False'}
            </span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>DeepFace Tried</span>
            <span style={valueStyle(info.deepface_tried ? 'var(--color-text)' : 'var(--color-text-muted)')}>
              {info.deepface_tried ? 'True' : 'False'}
            </span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Torch Facenet Loaded</span>
            <span style={{
              ...valueStyle(info.torch_facenet_loaded ? 'var(--color-success)' : 'var(--color-danger)'),
              fontWeight: 700,
            }}>
              {info.torch_facenet_loaded ? 'True' : 'False'}
            </span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Fallback Active</span>
            <span style={{
              ...valueStyle(info.fallback_active ? '#ffc107' : 'var(--color-success)'),
              fontWeight: 700,
            }}>
              {info.fallback_active ? 'True' : 'False'}
            </span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Last Used Engine</span>
            <span style={{
              ...valueStyle(info.last_used_engine === 'deepface' ? 'var(--color-success)' : info.last_used_engine === 'facenet-pytorch' ? '#ffc107' : 'var(--color-danger)'),
              textTransform: 'uppercase', fontWeight: 700,
            }}>
              {info.last_used_engine || 'NONE'}
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Engine Execution Logic</div>
        </div>
        <div style={{ padding: 16, fontSize: 13, lineHeight: 1.8, fontFamily: 'monospace' }}>
          <div>1. <strong>get_embedding()</strong> called with 160×160 face crop</div>
          <div style={{ marginLeft: 20 }}>
            ├─ Try <strong>DeepFace.represent(model_name='Facenet512')</strong>
          </div>
          <div style={{ marginLeft: 20 }}>
            │  {info.deepface_tried ? (info.deepface_initialized ? '✅ Succeeded → return 512-d L2 embedding' : '❌ Failed: DeepFace not initialized') : '⏭ Skipped: DeepFace unavailable'}
          </div>
          <div style={{ marginLeft: 20 }}>
            ├─ On failure → Try <strong>facenet-pytorch InceptionResnetV1</strong>
          </div>
          <div style={{ marginLeft: 20 }}>
            │  {info.torch_facenet_loaded ? (info.last_used_engine === 'facenet-pytorch' ? '✅ Active → return 512-d L2 embedding' : '✅ Available but DeepFace succeeded') : '❌ Failed: torch model not loaded'}
          </div>
          <div style={{ marginLeft: 20 }}>
            └─ On both failure → return <strong>None</strong> → decision: EMBEDDING_FAILED
          </div>
          <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: info.fallback_active ? 'rgba(255,193,7,0.1)' : 'rgba(76,175,80,0.08)', border: '1px solid var(--color-border)' }}>
            <strong>Current Status:</strong>{' '}
            {info.fallback_active
              ? '⚠ Running in FALLBACK mode — facenet-pytorch InceptionResnetV1 is active. DeepFace Facenet512 could not be initialized (likely CPU lacks AVX instructions). Similarity scores may differ from Facenet512 distribution.'
              : info.last_used_engine === 'deepface'
                ? '✅ DeepFace Facenet512 is active — expected similarity distribution ~0.50+'
                : '❌ No embedding engine available — face recognition disabled.'
            }
          </div>
        </div>
      </div>
    </div>
  )
}

export default FaceRuntime