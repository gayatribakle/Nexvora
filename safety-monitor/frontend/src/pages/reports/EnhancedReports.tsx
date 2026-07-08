import React, { useState } from 'react'
import { reportsAPI } from '../../services/api'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { formatIST } from '../../utils/formatIST'

const EnhancedReports: React.FC = () => {
  const [reportList, setReportList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'daily' | 'employee' | 'site' | 'monthly'>('daily')
  const [reportFormat, setReportFormat] = useState<'html' | 'pdf' | 'excel'>('pdf')

  // Employee report params
  const [employeeId, setEmployeeId] = useState('')
  // Site report params
  const [siteId, setSiteId] = useState('')
  // Monthly report params
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)

  const fetchReportList = async () => {
    try {
      const res = await reportsAPI.list()
      setReportList(res.data || [])
    } catch {}
  }

  React.useEffect(() => {
    fetchReportList()
  }, [])

  const generateReport = async () => {
    setLoading(true)
    try {
      const params: any = { format: reportFormat }
      switch (activeTab) {
        case 'daily':
          await reportsAPI.daily(params)
          break
        case 'employee':
          if (!employeeId) { alert('Please enter an Employee ID'); setLoading(false); return }
          await reportsAPI.employee(Number(employeeId), params)
          break
        case 'site':
          if (!siteId) { alert('Please enter a Site ID'); setLoading(false); return }
          await reportsAPI.site(Number(siteId), params)
          break
        case 'monthly':
          await reportsAPI.monthly({ ...params, year, month })
          break
      }
      fetchReportList()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Report generation failed')
    }
    setLoading(false)
  }

  const downloadReport = async (id: number, fmt: string) => {
    try {
      const res = await reportsAPI.download(id)
      const contentType = fmt === 'pdf' ? 'application/pdf' : fmt === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/html'
      const ext = fmt === 'pdf' ? 'pdf' : fmt === 'excel' ? 'xlsx' : 'html'
      const url = window.URL.createObjectURL(new Blob([res.data], { type: contentType }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `report-${id}.${ext}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch {}
  }

  const tabs = [
    { key: 'daily' as const, label: 'Daily Report' },
    { key: 'employee' as const, label: 'Employee Report' },
    { key: 'site' as const, label: 'Site Report' },
    { key: 'monthly' as const, label: 'Monthly Report' },
  ]

  const formatOptions = [
    { key: 'html' as const, label: 'HTML' },
    { key: 'pdf' as const, label: 'PDF' },
    { key: 'excel' as const, label: 'Excel' },
  ]

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Reports</div>
        <div className="page-subtitle">Generate and download safety reports in multiple formats</div>
      </div>

      {/* Report Generator */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
          <CardDescription>Select report type, parameters, and output format</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Tabs */}
          <div className="flex gap-2 mb-4 border-b border-border pb-2">
            {tabs.map(tab => (
              <button
                key={tab.key}
                className={`px-4 py-2 text-sm rounded-t transition-colors ${
                  activeTab === tab.key
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Format selector */}
          <div className="flex items-center gap-4 mb-4">
            <label className="text-sm text-muted-foreground">Format:</label>
            <div className="flex gap-2">
              {formatOptions.map(opt => (
                <button
                  key={opt.key}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    reportFormat === opt.key
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setReportFormat(opt.key)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Parameters based on tab */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            {activeTab === 'employee' && (
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Employee (Worker) ID</label>
                <input
                  type="number"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="Enter worker ID"
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground"
                />
              </div>
            )}
            {activeTab === 'site' && (
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Site ID</label>
                <input
                  type="number"
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  placeholder="Enter site ID"
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground"
                />
              </div>
            )}
            {activeTab === 'monthly' && (
              <>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Year</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Month</label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          <Button onClick={generateReport} disabled={loading}>
            {loading ? 'Generating...' : `Generate ${tabs.find(t => t.key === activeTab)?.label} (${reportFormat.toUpperCase()})`}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Reports</CardTitle>
        </CardHeader>
        <CardContent>
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
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">
                        <div className="empty-state-text">No reports generated yet</div>
                      </div>
                    </td>
                  </tr>
                )}
                {reportList.map((r: any) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 500 }}>{r.title}</td>
                    <td><span className="badge badge-blue">{r.report_type}</span></td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        r.format === 'pdf' ? 'bg-red-500/20 text-red-400' :
                        r.format === 'excel' ? 'bg-green-500/20 text-green-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {r.format?.toUpperCase() || 'HTML'}
                      </span>
                    </td>
                    <td className="text-xs text-muted">{formatIST(r.created_at)}</td>
                    <td>
                      <Button size="sm" variant="outline" onClick={() => downloadReport(r.id, r.format || 'html')}>
                        Download
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default EnhancedReports
