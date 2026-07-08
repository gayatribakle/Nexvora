import React, { useState, useEffect } from 'react'
import { reportsAPI } from '../../services/api'
import { formatIST } from '../../utils/formatIST'

const Reports: React.FC = () => {
  const [reportList, setReportList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const res = await reportsAPI.list()
      setReportList(res.data || [])
    } catch {}
  }

  const generateDaily = async () => {
    setLoading(true)
    try {
      await reportsAPI.daily()
      fetchReports()
    } catch {}
    setLoading(false)
  }

  const generateViolation = async () => {
    setLoading(true)
    try {
      await reportsAPI.violationReport()
      fetchReports()
    } catch {}
    setLoading(false)
  }

  const downloadReport = async (id: number) => {
    try {
      const res = await reportsAPI.download(id)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `report-${id}.html`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch {}
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Reports</div>
        <div className="page-subtitle">Generate and download safety reports</div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <div className="card" style={{ cursor: 'pointer' }} onClick={generateDaily}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="card-title">Daily Report</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                Generate today's violation and fine summary
              </div>
            </div>
            <button className="btn btn-primary" disabled={loading}>
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>
        <div className="card" style={{ cursor: 'pointer' }} onClick={generateViolation}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="card-title">Violation Report</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                Comprehensive violation analysis report
              </div>
            </div>
            <button className="btn btn-primary" disabled={loading}>
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Generated Reports</div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Format</th>
                <th>Generated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {reportList.length === 0 && (
                <tr><td colSpan={5}><div className="empty-state"><div className="empty-state-text">No reports generated yet</div></div></td></tr>
              )}
              {reportList.map((r: any) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 500 }}>{r.title}</td>
                  <td><span className="badge badge-blue">{r.report_type}</span></td>
                  <td>{r.format}</td>
                  <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{formatIST(r.created_at)}</td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => downloadReport(r.id)}>
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Reports
