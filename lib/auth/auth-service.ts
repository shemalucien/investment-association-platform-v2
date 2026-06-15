"use client"

import type { User, AuthState } from "./types"

const SESSION_KEY = "abanyabuzare_session"

export class AuthService {
  private static instance: AuthService
  private listeners: Set<(state: AuthState) => void> = new Set()

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify(state: AuthState): void {
    this.listeners.forEach((listener) => listener(state))
  }

  async login(email: string, password: string): Promise<{ user: User } | { error: string }> {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      console.log("response",data.user);

      if (!response.ok || !data.success) {
        return { error: data.error || "Login failed" }
      }

      const user: User = {
        id: data.data.user.id,
        email: data.data.user.email,
        name: data.data.user.name,
        role: data.data.user.role,
        permissions: data.data.permissions,
        lastLogin: new Date(),
      }

      // Store user in session storage
      if (typeof window !== "undefined") {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
      }

      this.notify({ user, isAuthenticated: true, loading: false })
      return { user }
    } catch (error) {
      console.error("[v0] Login error:", error)
      return { error: "An error occurred during login" }
    }
  }

  async logout(): Promise<void> {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch (error) {
      console.error("[v0] Logout error:", error)
    }

    if (typeof window !== "undefined") {
      sessionStorage.removeItem(SESSION_KEY)
    }
    this.notify({ user: null, isAuthenticated: false, loading: false })
  }

  async fetchCurrentUser(): Promise<User | null> {
    // First check session storage
    if (typeof window !== "undefined") {
      const sessionData = sessionStorage.getItem(SESSION_KEY)
      if (sessionData) {
        try {
          return JSON.parse(sessionData)
        } catch {
          // Continue to fetch from API
        }
      }
    }

    // Fetch from API
    try {
      const response = await fetch("/api/auth/me")
      const data = await response.json()

      if (response.ok && data.success) {
        const user: User = {
          id: data.data.user.id,
          email: data.data.user.email,
          name: data.data.user.name,
          role: data.data.user.role,
          permissions: data.data.permissions,
          lastLogin: new Date(),
        }

        if (typeof window !== "undefined") {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
        }

        return user
      }
    } catch (error) {
      console.error("[v0] Error fetching current user:", error)
    }

    return null
  }

  getCurrentUser(): User | null {
    if (typeof window === "undefined") return null

    const sessionData = sessionStorage.getItem(SESSION_KEY)
    if (!sessionData) return null

    try {
      return JSON.parse(sessionData)
    } catch {
      return null
    }
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null
  }

  hasPermission(permission: keyof User["permissions"]): boolean {
    const user = this.getCurrentUser()
    if (!user) return false
    return user.permissions[permission] || false
  }
}

export const authService = AuthService.getInstance()
