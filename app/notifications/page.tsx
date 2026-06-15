"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { apiGet } from "@/lib/api/client"
import type { Notification } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, BellOff, Download } from "lucide-react"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await apiGet<Notification[]>("/api/notifications")
        setNotifications(data)
      } catch (error) {
        console.error("[v0] Error fetching notifications:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  const typeColor: Record<string, string> = {
    success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    alert: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold">Notifications</h2>
              <p className="text-muted-foreground">Important updates about loans, deposits, and membership activity.</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Bell className="h-5 w-5" />
              <span>{notifications.length} message{notifications.length !== 1 ? "s" : ""}</span>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Member Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-8 text-muted-foreground">Loading notifications…</p>
              ) : notifications.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <BellOff className="mx-auto mb-4 h-8 w-8" />
                  <p>No notifications available right now.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-start gap-4 rounded-lg border p-4 bg-card"
                    >
                      <div className={`mt-0.5 flex-shrink-0 rounded-full p-2 ${typeColor[notification.type] ?? typeColor.info}`}>
                        <Bell className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{notification.title}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                        {notification.attachmentData && notification.attachmentName && (
                          <button
                            type="button"
                            onClick={() => {
                              const link = document.createElement("a")
                              link.href = notification.attachmentData!
                              link.download = notification.attachmentName
                              link.click()
                            }}
                            className="mt-3 inline-flex items-center gap-2 rounded-md border bg-muted px-3 py-2 text-sm font-medium hover:bg-muted/80"
                          >
                            <Download className="h-4 w-4" />
                            Download report file
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  )
}
