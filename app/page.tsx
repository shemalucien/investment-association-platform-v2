"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"
import { Sun, Moon, Users, TrendingUp, Shield, BarChart3, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MemberRegistrationForm } from "@/components/auth/member-registration-form"
import logo from "../images/icon.png"

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("login")
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const currentTheme = theme === "system" ? systemTheme : theme

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="flex justify-end mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
            aria-label="Toggle color scheme"
          >
            {mounted ? (currentTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />) : <Sun className="h-5 w-5" />}
          </Button>
        </div>
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          <section className="space-y-8">
            <div className="space-y-6 max-w-2xl">
              <div className="flex items-center gap-4">
                <Image
                  src={logo}
                  alt="AMATSINDA Cooperative logo"
                  width={100}
                  height={100}
                  className="rounded-full shadow-lg"
                />
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-primary font-semibold">Welcome to COOPERATIVE</p>
                  <p className="text-xs text-muted-foreground">Cooperative Management System</p>
                </div>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
                Empowering Your Cooperative
              </h1>
              <p className="text-lg leading-8 text-muted-foreground">
                A modern platform for managing members, loans, deposits, and shares. Stay organized with secure financial tools, member tracking, and comprehensive reporting.
              </p>
              <div className="flex gap-4 pt-4">
                <Link href="/login" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="mt-12 max-w-2xl">
              <h2 className="text-2xl font-bold mb-6">About COOPERATIVE</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
              <Card className="border-2 border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Member Management</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground text-base">
                    Track member registrations, contributions, and cooperative participation with a secure member directory.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-green-10 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle className="text-xl">Financial Oversight</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground text-base">
                    Monitor deposits, loans, and share capital in real time so your association stays transparent and compliant.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-blue-10 flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl">Reports & Analytics</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground text-base">
                    Generate reports and review cooperative activity summaries to support planning and decision making.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-purple-10 flex items-center justify-center">
                      <Shield className="h-6 w-6 text-purple-600" />
                    </div>
                    <CardTitle className="text-xl">Secure & Reliable</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground text-base">
                    Built with security in mind, your data is protected with modern encryption and access controls.
                  </CardDescription>
                </CardContent>
              </Card>
              </div>
            </div>

          </section>

          <section className="flex items-center justify-center">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md">
              <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
                <TabsTrigger value="login" className="text-base">Sign In</TabsTrigger>
                <TabsTrigger value="register" className="text-base">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-2xl">Welcome Back</CardTitle>
                    <CardDescription className="text-base">
                      Sign in to access your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/login" className="w-full">
                      <Button size="lg" className="w-full">
                        Sign In to Your Account
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-2xl">Join AMATSINDA</CardTitle>
                    <CardDescription className="text-base">
                      Register as a new member
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MemberRegistrationForm />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>


          </section>
        </div>
      </div>
    </main>
  )
}
