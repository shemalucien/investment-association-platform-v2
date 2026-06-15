"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { User, AuthState } from "./types"
import { authService } from "./auth-service"

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ user: User } | { error: string }>
  logout: () => Promise<void>
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true,
  })

  useEffect(() => {
    const initAuth = async () => {
      const user = await authService.fetchCurrentUser()
      setAuthState({
        user,
        isAuthenticated: !!user,
        loading: false,
      })
    }

    initAuth()

    // Subscribe to auth changes
    const unsubscribe = authService.subscribe(setAuthState)
    return unsubscribe
  }, [])

  const login = async (email: string, password: string) => {
    setAuthState((prev) => ({ ...prev, loading: true }))
    const result = await authService.login(email, password)
    if ("error" in result) {
      setAuthState((prev) => ({ ...prev, loading: false }))
    }
    return result
  }

  const logout = async () => {
    await authService.logout()
  }

  const hasPermission = (permission: string) => {
    return authService.hasPermission(permission as any)
  }

  return <AuthContext.Provider value={{ ...authState, login, logout, hasPermission }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
