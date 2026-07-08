import React, { useState, useEffect } from 'react'
import { monitoringAPI, camerasAPI } from '../../services/api'
import { formatIST } from '../../utils/formatIST'

interface StreamableVideo {
  id: number
  filename: string
  duration_seconds: number | null
  violations_found: number
  processed_at: string | null
  camera_id: number | null
}

const CCTV: React.FC = () => {
  const [cameras, setCameras] = useState<{ id: number; name: string; error: boolean; currentVideo?: StreamableVideo }[]>([])
  const [streamableVideos, setStreamableVideos] = useState<StreamableVideo[]>([])
  const [showVideoSelector, setShowVideoSelector] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchCameras = async () => {
      try {
        const res = await camerasAPI.list()
        setCameras(res.data.map((c: any) => ({ id: c.id, name: c.name, error: false })))
      } catch {
        setCameras([
          { id: 1, name: 'Camera 1', error: false },
          { id: 2, name: 'Camera 2', error: false },
          { id: 3, name: 'Camera 3', error: false },
          { id: 4, name: 'Camera 4', error: false },
        ])
      }
    }
    fetchCameras()
    loadStreamableVideos()
  }, [])

  const loadStreamableVideos = async () => {
    try {
      const res = await monitoringAPI.listStreamableVideos()
      setStreamableVideos(res.data.videos || [])
    } catch (err) {
      console.error('Failed to load streamable videos:', err)
    }
  }

  const handleSwitchVideo = async (cameraId: number, videoId?: number) => {
    setLoading(true)
    try {
      await monitoringAPI.switchVideo(cameraId, videoId)
      
      // Update camera state
      setCameras(prev => prev.map(cam => {
        if (cam.id === cameraId) {
          const selectedVideo = videoId 
            ? streamableVideos.find(v => v.id === videoId)
            : undefined
          return { ...cam, currentVideo: selectedVideo, error: false }
        }
        return cam
      }))
      
      setShowVideoSelector(null)
    } catch (err) {
      console.error('Failed to switch video:', err)
      alert('Failed to switch video. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Live CCTV Monitoring</div>
        <div className="page-subtitle">Real-time AI-powered surveillance feeds</div>
      </div>

      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            background: 'var(--color-bg-card)',
            padding: '24px 32px',
            borderRadius: 'var(--radius-lg)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
            <div>Switching video source...</div>
          </div>
        </div>
      )}

      <div className="cctv-grid">
        {cameras.map((cam) => (
          <div key={cam.id} className="cctv-feed active">
            <div className="cctv-overlay">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="cctv-name">{cam.name}</span>
                {cam.currentVideo && (
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    background: 'rgba(59, 130, 246, 0.8)',
                    borderRadius: '4px',
                    color: 'white',
                  }}>
                    📹 {cam.currentVideo.filename}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="cctv-status live">LIVE</span>
                <button
                  onClick={() => setShowVideoSelector(showVideoSelector === cam.id ? null : cam.id)}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '10px',
                  }}
                  title="Change video source"
                >
                  🔄 Change
                </button>
              </div>
            </div>

            {showVideoSelector === cam.id && (
              <div style={{
                position: 'absolute',
                top: '40px',
                right: '10px',
                background: 'rgba(0,0,0,0.95)',
                border: '2px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                zIndex: 100,
                minWidth: '300px',
                maxHeight: '400px',
                overflow: 'auto',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid var(--color-border)',
                }}>
                  <span style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>
                    Select Video
                  </span>
                  <button
                    onClick={() => setShowVideoSelector(null)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '18px',
                    }}
                  >
                    ✕
                  </button>
                </div>

                <button
                  onClick={() => handleSwitchVideo(cam.id)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    marginBottom: '8px',
                    background: cam.currentVideo ? 'var(--color-bg-card)' : 'var(--color-primary)',
                    border: cam.currentVideo ? '1px solid var(--color-border)' : 'none',
                    borderRadius: '6px',
                    color: 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontWeight: '600', fontSize: '12px' }}>🎥 Default Video</div>
                  <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '2px' }}>
                    Original camera feed
                  </div>
                </button>

                {streamableVideos.length === 0 && (
                  <div style={{
                    color: 'var(--color-text-muted)',
                    fontSize: '12px',
                    textAlign: 'center',
                    padding: '16px',
                  }}>
                    No processed videos available
                  </div>
                )}

                {streamableVideos.map(video => (
                  <button
                    key={video.id}
                    onClick={() => handleSwitchVideo(cam.id, video.id)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      marginBottom: '8px',
                      background: cam.currentVideo?.id === video.id ? 'var(--color-primary)' : 'var(--color-bg-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '6px',
                      color: 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ fontWeight: '600', fontSize: '12px' }}>📹 {video.filename}</div>
                    <div style={{ 
                      fontSize: '10px', 
                      opacity: 0.7, 
                      marginTop: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}>
                      <span>⏱ {video.duration_seconds ? `${Math.round(video.duration_seconds)}s` : 'N/A'}</span>
                      <span>⚠ {video.violations_found} violations</span>
                    </div>
                    {video.processed_at && (
                      <div style={{ fontSize: '9px', opacity: 0.5, marginTop: '2px' }}>
                        Processed: {new Date(video.processed_at).toLocaleString()}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            <img
              src={monitoringAPI.streamUrl(cam.id)}
              alt={cam.name}
              onError={() => setCameras((prev) => prev.map((c) => c.id === cam.id ? { ...c, error: true } : c))}
              style={{
                display: cam.error ? 'none' : 'block',
                width: '100%', height: '100%',
                objectFit: 'contain', background: '#000',
              }}
            />

            {cam.error && (
              <div style={{
                width: '100%', height: '100%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', background: '#0a0a0a', color: 'var(--color-text-muted)',
                flexDirection: 'column', gap: 8,
              }}>
                <span style={{ fontSize: 32, opacity: 0.3 }}>&#9674;</span>
                <span>Connecting...</span>
              </div>
            )}

            <div className="cctv-timestamp">{formatIST(new Date().toISOString())}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CCTV
