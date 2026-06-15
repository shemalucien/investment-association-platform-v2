"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Bell, Menu, LogOut, User, Shield, Sun, Moon } from "lucide-react"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth/auth-context"
import logo from "@/images/icon.png"

const getNavigation = (role: string | undefined) => {
  if (role === "admin") {
    return [
      { name: "Dashboard", href: "/admin/dashboard" },
      { name: "Members", href: "/admin/members" },
      { name: "Loans", href: "/admin/loans" },
      { name: "Deposits", href: "/admin/deposits" },
      { name: "Reports", href: "/admin/reports" },
      { name: "Help", href: "/admin/help" },
    ]
  } else if (role === "treasurer") {
    return [
      { name: "Dashboard", href: "/treasurer/dashboard" },
      { name: "Loans", href: "/treasurer/loans" },
      { name: "Deposits", href: "/treasurer/deposits" },
      { name: "Reports", href: "/treasurer/reports" },
      { name: "Help", href: "/treasurer/help" },
    ]
  } else {
    return [
      { name: "Dashboard", href: "/dashboard" },
      { name: "Deposits", href: "/member/deposits" },
      { name: "Reports", href: "/member/reports" },
      { name: "Help", href: "/member/help" },
    ]
  }
}

export function Header() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) {
        setUnreadNotifications(0)
        return
      }

      try {
        const response = await fetch("/api/notifications")
        const payload = await response.json()
        if (response.ok && payload.success && Array.isArray(payload.data)) {
          setUnreadNotifications(payload.data.filter((item: any) => !item.read).length)
        }
      } catch (error) {
        console.error("[v0] Error loading notifications:", error)
      }
    }

    loadNotifications()
  }, [user])

  const currentTheme = theme === "system" ? systemTheme : theme

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800"
      case "treasurer":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <header className="border-b bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex-shrink-0 flex items-center gap-3">
            <Image
              src={logo}
              alt="AMATSINDA Cooperative logo"
              width={40}
              height={40}
              className="rounded-full"
            />
            <div>
              <h1 className="text-2xl font-bold text-foreground">AMATSINDA</h1>
              <p className="text-sm text-muted-foreground">Cooperative Management System</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-6">
            {getNavigation(user?.role).map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-4">
            {user && (
              <Link href="/notifications" className="relative inline-flex items-center rounded-full p-2 text-muted-foreground transition hover:bg-muted/70 hover:text-foreground">
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] rounded-full px-1.5 text-[10px]">
                    {unreadNotifications}
                  </Badge>
                )}
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
              aria-label="Toggle color scheme"
            >
              {mounted ? (
                currentTheme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      <span
                        className={`mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs ${getRoleBadgeColor(user.role)}`}
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Mobile Navigation */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Navigation</SheetTitle>
                  <SheetDescription>Access all platform features</SheetDescription>
                </SheetHeader>
                <div className="flex items-center justify-between gap-2 mt-4">
                  <p className="text-sm font-medium">Theme</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
                    aria-label="Toggle color scheme"
                  >
                    {mounted ? (
                      currentTheme === "dark" ? (
                        <Sun className="h-5 w-5" />
                      ) : (
                        <Moon className="h-5 w-5" />
                      )
                    ) : (
                      <Sun className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                <nav className="flex flex-col gap-4 mt-6">
                  {getNavigation(user?.role).map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`text-base font-medium transition-colors py-2 ${
                          isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {item.name}
                      </Link>
                    )
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
