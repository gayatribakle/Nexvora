import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'

import Login from './pages/auth/Login'
import AdminLayout from './pages/admin/AdminLayout'
import WorkerLayout from './pages/worker/WorkerLayout'

import Dashboard from './pages/dashboard/Dashboard'
import CCTV from './pages/cctv/CCTV'
import AdminAlerts from './pages/alerts/Alerts'
import Violations from './pages/violations/Violations'
import Reports from './pages/reports/EnhancedReports'
import Analytics from './pages/analytics/Analytics'
import Schemes from './pages/schemes/Schemes'
import Emergency from './pages/emergency/Emergency'
import Settings from './pages/admin/Settings'
import WorkerManagement from './pages/admin/WorkerManagement'
import WorkerProfile from './pages/worker/WorkerProfile'
import WorkerViolations from './pages/worker/WorkerViolations'
import WorkerFines from './pages/worker/WorkerFines'
import WorkerSchemes from './pages/worker/WorkerSchemes'
import Leaderboard from './pages/leaderboard/Leaderboard'
import Training from './pages/training/Training'
import Quiz from './pages/quiz/Quiz'
import FineManagement from './pages/admin/FineManagement'
import VideoUpload from './pages/videos/VideoUpload'
import PenaltyRules from './pages/admin/PenaltyRules'
import IncidentReview from './pages/officer/IncidentReview'
import EmployeeVerification from './pages/officer/EmployeeVerification'


const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({
  children,
  adminOnly = false,
}) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role === 'worker') return <Navigate to="/" replace />
  return <>{children}</>
}

const SafetyOfficerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin' && user.role !== 'safety_officer') return <Navigate to="/" replace />
  return <>{children}</>
}

const App: React.FC = () => {
  const { user } = useAuth()

  if (user?.role === 'worker') {
    return (
      <Routes>
        <Route path="/login" element={<Navigate to="/worker" replace />} />
        <Route path="/" element={<Navigate to="/worker" replace />} />
        <Route path="/worker" element={<ProtectedRoute><WorkerLayout /></ProtectedRoute>}>
          <Route index element={<WorkerProfile />} />
          <Route path="violations" element={<WorkerViolations />} />
          <Route path="fines" element={<WorkerFines />} />
          <Route path="schemes" element={<WorkerSchemes />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="training" element={<Training />} />
          <Route path="quiz" element={<Quiz />} />
        </Route>
        <Route path="*" element={<Navigate to="/worker" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

      <Route path="/" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="cctv" element={<CCTV />} />
        <Route path="alerts" element={<AdminAlerts />} />
        <Route path="violations" element={<Violations />} />
        <Route path="fines" element={<FineManagement />} />
        <Route path="workers" element={<WorkerManagement />} />
        <Route path="reports" element={<Reports />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="schemes" element={<Schemes />} />
        <Route path="emergency" element={<Emergency />} />
        <Route path="settings" element={<Settings />} />
        <Route path="videos" element={<VideoUpload />} />
        <Route path="penalty-rules" element={<PenaltyRules />} />
        <Route path="incident-review" element={<SafetyOfficerRoute><IncidentReview /></SafetyOfficerRoute>} />
        <Route path="employee-verification" element={<SafetyOfficerRoute><EmployeeVerification /></SafetyOfficerRoute>} />

        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="training" element={<Training />} />
        <Route path="quiz" element={<Quiz />} />
      </Route>

      <Route path="/worker" element={<Navigate to="/" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
