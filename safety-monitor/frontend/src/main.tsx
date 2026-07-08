import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { HealthProvider } from './contexts/HealthContext'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <HealthProvider>
          <App />
        </HealthProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
