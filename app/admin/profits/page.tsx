"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { TrendingUp, DollarSign, Calendar, Users } from "lucide-react"
import { apiPost, apiGet } from "@/lib/api/client"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { formatCurrency } from "@/lib/utils/calculations"

export default function AdminProfitsPage() {
  const [totalAmount, setTotalAmount] = useState("")
  const [description, setDescription] = useState("")
  const [period, setPeriod] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [distributions, setDistributions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDistributions = async () => {
      try {
        const data = await apiGet<any[]>("/api/profit-distributions")
        setDistributions(data)
      } catch (error) {
        console.error("[v0] Error fetching profit distributions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDistributions()
  }, [])

  const handleDistribute = async () => {
    if (!totalAmount || !period) return

    setIsSubmitting(true)
    try {
      await apiPost("/api/profit-distributions", {
        totalAmount: Number.parseFloat(totalAmount),
        description: description || "Profit distribution",
        period,
      })
      setSubmitted(true)
      setTotalAmount("")
      setDescription("")
      setPeriod("")

      // Refresh distributions
      const data = await apiGet<any[]>("/api/profit-distributions")
      setDistributions(data)
    } catch (error) {
      console.error("[v0] Error distributing profits:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <Card className="max-w-md mx-auto border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-200">Profit Distributed!</h3>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                      Profits have been distributed to members based on their share holdings (2% per share).
                    </p>
                  </div>
                  <Button onClick={() => setSubmitted(false)} variant="outline" className="mt-4">
                    Distribute Another Profit
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Profit Distribution</h2>
            <p className="text-muted-foreground">Distribute profits to members based on their share holdings</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profit Distribution Form */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Distribute Profits</CardTitle>
                    <CardDescription>Enter profit amount and period for distribution</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="total-amount">Total Profit Amount (RWF)</Label>
                  <Input
                    id="total-amount"
                    type="number"
                    min="1"
                    placeholder="Enter total profit amount"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="period">Period (e.g., January 2026, Q1 2026)</Label>
                  <Input
                    id="period"
                    type="text"
                    placeholder="Enter period"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    placeholder="Add a description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-1">Distribution Rule:</p>
                  <p className="text-sm text-muted-foreground">
                    Members receive 2% of profit per share owned
                  </p>
                </div>

                <Button
                  className="w-full"
                  onClick={handleDistribute}
                  disabled={!totalAmount || !period || isSubmitting}
                >
                  {isSubmitting ? "Distributing..." : "Distribute Profits"}
                </Button>
              </CardContent>
            </Card>

            {/* Distribution History */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Distribution History</CardTitle>
                    <CardDescription>Previous profit distributions</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">Loading history...</div>
                ) : distributions.length > 0 ? (
                  <div className="space-y-3">
                    {distributions.map((dist) => (
                      <div key={dist.id} className="flex items-center justify-between py-3 border-b last:border-0">
                        <div>
                          <p className="font-medium">{dist.description}</p>
                          <p className="text-sm text-muted-foreground">{dist.period}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(dist.distribution_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">{formatCurrency(dist.total_amount)} RWF</p>
                          <p className="text-xs text-muted-foreground">
                            {dist.member_count} members
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No profit distributions yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
