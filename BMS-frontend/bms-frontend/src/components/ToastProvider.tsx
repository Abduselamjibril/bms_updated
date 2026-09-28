import React, { createContext, useContext, useState, useCallback } from 'react'

type Toast = { id: number; message: string; type?: 'info' | 'success' | 'error' | 'warning' }

const ToastContext = createContext<{ addToast: (m: string, t?: Toast['type']) => void } | null>(null)

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts(s => [...s, { id, message, type }])
    setTimeout(() => setToasts(s => s.filter(t => t.id !== id)), 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{ position: 'fixed', right: 16, top: 16, zIndex: 9999 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ 
            marginBottom: 8, 
            padding: '12px 16px', 
            borderRadius: '12px', 
            background: t.type === 'error' ? '#fef2f2' : t.type === 'success' ? '#f0fdf4' : t.type === 'warning' ? '#fffbeb' : '#f0f9ff', 
            color: t.type === 'error' ? '#991b1b' : t.type === 'success' ? '#166534' : t.type === 'warning' ? '#92400e' : '#075985',
            border: `1px solid ${t.type === 'error' ? '#fee2e2' : t.type === 'success' ? '#dcfce7' : t.type === 'warning' ? '#fef3c7' : '#e0f2fe'}`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            fontSize: '13px',
            fontWeight: 600,
            minWidth: '200px'
          }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export default ToastProvider
