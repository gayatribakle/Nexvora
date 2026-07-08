import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import api from '../services/api'

interface HealthContextType {
  connected: boolean
  lastCheck: Date | null
  error: string | null
  check: () => Promise<boolean>
}

const HealthContext = createContext<HealthContextType>({
  connected: true,
  lastCheck: null,
  error: null,
  check: async () => true,
})

export const useHealth = () => useContext(HealthContext)

export const HealthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(true)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const retriesRef = useRef(0)

  const check = useCallback(async () => {
    try {
      const res = await api.get('/health', { timeout: 5000 })
      if (res.data?.status === 'healthy') {
        setConnected(true)
        setError(null)
        retriesRef.current = 0
        return true
      }
      throw new Error('Unhealthy response')
    } catch (e: any) {
      const msg = e.code === 'ECONNREFUSED' || e.message?.includes('Network Error')
        ? 'Backend unavailable (ECONNREFUSED)'
        : e.message || 'Connection failed'
      setConnected(false)
      setError(msg)
      retriesRef.current++
      console.error(`[Health] Backend connection failed (attempt ${retriesRef.current}): ${msg}`)
      return false
    } finally {
      setLastCheck(new Date())
    }
  }, [])

  useEffect(() => {
    check()
    const interval = setInterval(check, 15000)
    return () => clearInterval(interval)
  }, [check])

  useEffect(() => {
    if (!connected) {
      const reconnectTimer = setTimeout(check, 5000)
      return () => clearTimeout(reconnectTimer)
    }
  }, [connected, check])

  return (
    <HealthContext.Provider value={{ connected, lastCheck, error, check }}>
      {children}
    </HealthContext.Provider>
  )
}
