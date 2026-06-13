'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

type LoginMode = 'user' | 'admin'

interface LoginModeContextType {
  loginMode: LoginMode
  setLoginMode: (mode: LoginMode) => void
  hideNavigation: boolean
  setHideNavigation: (hide: boolean) => void
}

const LoginModeContext = createContext<LoginModeContextType | undefined>(undefined)

export function LoginModeProvider({ children }: { children: ReactNode }) {
  const [loginMode, setLoginMode] = useState<LoginMode>('user')
  const [hideNavigation, setHideNavigation] = useState(false)

  return (
    <LoginModeContext.Provider value={{ 
      loginMode, 
      setLoginMode, 
      hideNavigation, 
      setHideNavigation 
    }}>
      {children}
    </LoginModeContext.Provider>
  )
}

export function useLoginMode() {
  const context = useContext(LoginModeContext)
  if (context === undefined) {
    throw new Error('useLoginMode must be used within a LoginModeProvider')
  }
  return context
}