"use client"

import type React from "react"

import Image from "next/image"
import logo from "../../images/icon.png"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth/auth-context"
import { useTheme } from "next-themes"
import { Loader2, Lock, Mail, Sun, Moon, ArrowLeft } from "lucide-react"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme = theme === "system" ? systemTheme : theme

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const result = await login(email, password)

    if ("error" in result) {
      setError(result.error)
      setIsLoading(false)
    } else {
      // Redirect based on user role
      const userRole = result.user?.role
      if (userRole === "admin") {
        router.push("/admin/dashboard")
      } else if (userRole === "treasurer") {
        router.push("/treasurer/dashboard")
      } else {
        router.push("/dashboard")
      }
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
            className="absolute right-4 top-4"
            aria-label="Toggle color scheme"
          >
            {mounted ? (
              currentTheme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )
            ) : null}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
            className="absolute left-4 top-4"
            aria-label="Back to home"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center justify-center mb-4">
            <Image
              src={logo}
              alt="AMATSINDA Cooperative logo"
              width={80}
              height={80}
              className="rounded-full"
            />
          </div>
          <CardTitle className="text-2xl text-center">COOPERATIVE</CardTitle>
          <CardDescription className="text-center">Sign in to Cooperative Management System</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push("/forgot-password")}
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>

            {/* <div className="mt-6 p-4 bg-blue-50 rounded-lg space-y-2 text-xs">
              <p className="font-semibold text-blue-900">Demo Accounts:</p>
              <div className="space-y-1 text-blue-700">
                <p>
                  <strong>Admin:</strong> admin@abanyabuzare.rw / admin123
                </p>
                <p>
                  <strong>Treasurer:</strong> treasurer@abanyabuzare.rw / treasurer123
                </p>
                <p>
                  <strong>Member:</strong> member@abanyabuzare.rw / member123
                </p>
              </div>
            </div> */}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
