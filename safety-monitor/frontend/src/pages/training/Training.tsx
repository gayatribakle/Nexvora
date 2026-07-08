import React, { useState, useEffect } from 'react'
import { trainingsAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

const Training: React.FC = () => {
  const [trainings, setTrainings] = useState<any[]>([])
  const { isWorker } = useAuth()

  useEffect(() => {
    fetchTrainings()
  }, [])

  const fetchTrainings = async () => {
    try {
      const res = await trainingsAPI.list()
      setTrainings(res.data || [])
    } catch {}
  }

  const completeTraining = async (id: number) => {
    try {
      await trainingsAPI.complete(id)
      fetchTrainings()
    } catch {}
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Safety Training</div>
        <div className="page-subtitle">Complete training modules to improve safety score</div>
      </div>

      <div className="grid grid-2">
        {trainings.length === 0 && (
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-state">
              <div className="empty-state-text">No training modules available</div>
            </div>
          </div>
        )}
        {trainings.map((t: any) => (
          <div key={t.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div className="card-title" style={{ fontSize: 15 }}>{t.title}</div>
                <span className={`badge badge-${t.training_type === 'video' ? 'blue' : 'gray'}`} style={{ marginTop: 4 }}>
                  {t.training_type}
                </span>
                {t.is_mandatory && <span className="badge badge-red" style={{ marginLeft: 4 }}>Mandatory</span>}
              </div>
              {isWorker && (
                <button className="btn btn-success btn-sm" onClick={() => completeTraining(t.id)}>
                  Complete
                </button>
              )}
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 8 }}>{t.description}</p>
            {t.duration_minutes && (
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                Duration: {t.duration_minutes} minutes
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Training
