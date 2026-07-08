import axios from 'axios'

const API_BASE = '/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  // Don't force Content-Type for FormData - let axios handle it
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  getMe: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users'),
  createUser: (data: any) => api.post('/auth/users', data),
  changePassword: (oldPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { old_password: oldPassword, new_password: newPassword }),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, new_password: newPassword }),
}

export const workersAPI = {
  list: (params?: any) => api.get('/workers', { params }),
  get: (id: number) => api.get(`/workers/${id}`),
  create: (data: any) => api.post('/workers', data),
  createWithPhoto: (formData: FormData) =>
    api.post('/workers/with-photo', formData),
  uploadImage: (id: number, file: File, photoType?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    if (photoType) formData.append('photo_type', photoType)
    return api.post(`/workers/${id}/image`, formData)
  },
  getViolations: (id: number) => api.get(`/workers/${id}/violations`),
  getFines: (id: number) => api.get(`/workers/${id}/fines`),
  getMyProfile: () => api.get('/workers/me/profile'),
  remove: (id: number) => api.delete(`/workers/${id}`),
}

export const violationsAPI = {
  list: (params?: any) => api.get('/violations', { params }),
  getReviewQueue: () => api.get('/violations/review-queue'),
  approve: (id: number) => api.post(`/violations/${id}/approve`),
  reject: (id: number, reason: string) =>
    api.post(`/violations/${id}/reject`, null, { params: { reason } }),
  delete: (id: number) => api.delete(`/violations/${id}`),
}

export const finesAPI = {
  list: (params?: any) => api.get('/fines', { params }),
  pay: (id: number) => api.post(`/fines/${id}/pay`),
  summary: () => api.get('/fines/summary'),
  remove: (id: number) => api.delete(`/fines/${id}`),
  adjust: (id: number, adjustedAmount: number, reason: string) =>
    api.put(`/fines/${id}/adjust`, { adjusted_amount: adjustedAmount, reason }),
}

export const alertsAPI = {
  list: (params?: any) => api.get('/alerts', { params }),
  markRead: (id: number) => api.put(`/alerts/${id}/read`),
  markAllRead: () => api.put('/alerts/read-all'),
  delete: (id: number) => api.delete(`/alerts/${id}`),
  clearAll: () => api.delete('/alerts/clear-all'),
}

export const camerasAPI = {
  list: () => api.get('/cameras'),
  get: (id: number) => api.get(`/cameras/${id}`),
  update: (id: number, data: any) => api.put(`/cameras/${id}`, data),
}

export const monitoringAPI = {
  start: () => api.get('/monitoring/start'),
  stop: () => api.get('/monitoring/stop'),
  status: () => api.get('/monitoring/status'),
  streamUrl: (cameraId: number) => `/api/monitoring/stream/${cameraId}`,
  switchVideo: (cameraId: number, videoId?: number) =>
    api.post(`/monitoring/switch-video/${cameraId}`, null, { params: videoId ? { video_id: videoId } : {} }),
  listStreamableVideos: () => api.get('/monitoring/streamable-videos'),
}

export const analyticsAPI = {
  dashboard: () => api.get('/analytics/dashboard'),
  violationsByType: () => api.get('/analytics/violations-by-type'),
  violationsTimeline: (days?: number) =>
    api.get('/analytics/violations-timeline', { params: { days } }),
  safetyScores: () => api.get('/analytics/safety-scores'),
  fineSummary: () => api.get('/analytics/fine-summary'),
}

export const reportsAPI = {
  daily: (params?: any) => api.get('/reports/daily', { params }),
  violationReport: (params?: any) => api.get('/reports/violation-report', { params }),
  employee: (workerId: number, params?: any) => api.get(`/reports/employee/${workerId}`, { params }),
  site: (siteId: number, params?: any) => api.get(`/reports/site/${siteId}`, { params }),
  monthly: (params?: any) => api.get('/reports/monthly', { params }),
  list: () => api.get('/reports/list'),
  download: (id: number) => api.get(`/reports/download/${id}`, { responseType: 'blob' }),
}

export const schemesAPI = {
  list: (params?: any) => api.get('/schemes', { params }),
  available: () => api.get('/schemes/available'),
  create: (data: any) => api.post('/schemes', null, { params: data }),
  update: (id: number, data: any) => api.put(`/schemes/${id}`, null, { params: data }),
  delete: (id: number) => api.delete(`/schemes/${id}`),
  assign: (workerId: number, schemeId: number) =>
    api.post('/schemes/assign', null, { params: { worker_id: workerId, scheme_id: schemeId } }),
  enroll: (schemeId: number) =>
    api.post('/schemes/enroll', null, { params: { scheme_id: schemeId } }),
  unenroll: (schemeId: number) =>
    api.post('/schemes/unenroll', null, { params: { scheme_id: schemeId } }),
  getWorkerSchemes: (workerId: number) => api.get(`/schemes/worker/${workerId}`),
}

export const trainingsAPI = {
  list: (params?: any) => api.get('/trainings', { params }),
  create: (data: any) => api.post('/trainings', null, { params: data }),
  complete: (id: number) => api.post(`/trainings/${id}/complete`),
}

export const quizzesAPI = {
  list: () => api.get('/quizzes'),
  get: (id: number) => api.get(`/quizzes/${id}`),
  submit: (id: number, answers: number[]) =>
    api.post(`/quizzes/${id}/submit`, answers),
  history: () => api.get('/quizzes/attempts/history'),
}

export const emergencyAPI = {
  list: (params?: any) => api.get('/emergency', { params }),
  create: (data: any) => api.post('/emergency', null, { params: data }),
  resolve: (id: number) => api.put(`/emergency/${id}/resolve`),
}

export const leaderboardAPI = {
  get: (params?: any) => api.get('/leaderboard', { params }),
}

export const notificationsAPI = {
  list: (params?: any) => api.get('/notifications', { params }),
  markRead: (id: number) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
}

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data: any) => api.put('/settings', null, { params: data }),
}

export const faceAPI = {
  metrics: () => api.get('/monitoring/recognition-metrics'),
  qualityStats: () => api.get('/monitoring/debug/face-quality-stats'),
  calibration: () => api.get('/monitoring/debug/face-calibration'),
  calibrate: () => api.post('/monitoring/debug/face-calibrate'),
  auditList: () => api.get('/monitoring/debug/face-audit'),
  auditDetail: (filename: string) => api.get(`/monitoring/debug/face-audit/${filename}`),
  voteHistory: (cameraId: number) => api.get(`/monitoring/debug/face-votes/${cameraId}`),
  evaluate: () => api.get('/monitoring/evaluate'),
  recognitionStats: () => api.get('/monitoring/recognition-stats'),
  separationReport: () => api.get('/monitoring/separation-report'),
  qualityAnalytics: () => api.get('/monitoring/face-quality-analytics'),
  resetQualityAnalytics: () => api.post('/monitoring/face-quality-analytics/reset'),
  recognitionEngine: () => api.get('/face/runtime'),
}

export const videosAPI = {
  upload: (formData: FormData) =>
    api.post('/videos/upload', formData),
  list: (params?: any) => api.get('/videos', { params }),
  get: (id: number) => api.get(`/videos/${id}`),
  progress: (id: number) => api.get(`/videos/${id}/progress`),
  process: (id: number, sync: boolean = false) =>
    api.post(`/videos/${id}/process`, null, { params: { sync } }),
  remove: (id: number) => api.delete(`/videos/${id}`),
  debugFrames: (id: number) => api.get(`/videos/${id}/debug-frames`),
}

export const penaltyRulesAPI = {
  list: () => api.get('/penalty-rules'),
  create: (data: any) => api.post('/penalty-rules', data),
  update: (id: number, data: any) => api.put(`/penalty-rules/${id}`, data),
  remove: (id: number) => api.delete(`/penalty-rules/${id}`),
}

export const safetyOfficerAPI = {
  incidentReviewQueue: (params?: any) => api.get('/safety-officer/incident-review-queue', { params }),
  verifyEmployee: (violationId: number, confirmedWorkerId: number) =>
    api.post(`/safety-officer/verify-employee/${violationId}`, null, { params: { confirmed_worker_id: confirmedWorkerId } }),
  employeeVerification: (workerId: number) => api.get(`/safety-officer/employee-verification/${workerId}`),
  unverifiedViolations: (params?: any) => api.get('/safety-officer/unverified-violations', { params }),
  approveViolation: (id: number) => api.post(`/violations/${id}/approve`),
  rejectViolation: (id: number, reason: string) =>
    api.post(`/violations/${id}/reject`, null, { params: { reason } }),
}
