"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Wallet, CheckCircle2, History, Users } from "lucide-react"
import { apiPost, apiGet } from "@/lib/api/client"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/lib/auth/auth-context"
import { formatCurrency, formatDate } from "@/lib/utils/calculations"

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user, hasPermission } = useAuth()

  useEffect(() => {
    const fetchDeposits = async () => {
      try {
        const depositsData = await apiGet<any[]>("/api/deposits")
        // Admins see all deposits, members see only their own
        if (hasPermission("canViewDeposits")) {
          setDeposits(depositsData)
        } else {
          const userDeposits = depositsData.filter((d) => d.memberId === user?.id)
          setDeposits(userDeposits)
        }
      } catch (error) {
        console.error("[v0] Error fetching deposits:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDeposits()
  }, [user?.id, hasPermission])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          {/* Deposit History */}
          <Card>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    {hasPermission("canViewDeposits") ? <Users className="h-6 w-6 text-primary" /> : <History className="h-6 w-6 text-primary" />}
                  </div>
                  <div>
                    <CardTitle>{hasPermission("canViewDeposits") ? "All Deposit History" : "Deposit History"}</CardTitle>
                    <CardDescription>
                      {hasPermission("canViewDeposits") ? "All member deposits in Rwandan Francs" : "Your deposit transactions in Rwandan Francs"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">Loading history...</div>
                ) : deposits.length > 0 ? (
                  <>
                    {hasPermission("canViewDeposits") ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Member</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Payment Method</TableHead>
                            <TableHead className="text-right">Amount (RWF)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {deposits
                            .sort((a, b) => new Date(b.depositDate).getTime() - new Date(a.depositDate).getTime())
                            .map((deposit) => (
                              <TableRow key={deposit.id}>
                                <TableCell className="font-medium">{deposit.memberName || "Unknown"}</TableCell>
                                <TableCell>{deposit.description || "Deposit"}</TableCell>
                                <TableCell>{formatDate(deposit.depositDate)}</TableCell>
                                <TableCell className="capitalize">{deposit.paymentMethod || "N/A"}</TableCell>
                                <TableCell className="text-right font-semibold text-green-600">{formatCurrency(deposit.amount)}</TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="space-y-3">
                        {deposits
                          .sort((a, b) => new Date(b.depositDate).getTime() - new Date(a.depositDate).getTime())
                          .map((deposit) => (
                            <div key={deposit.id} className="flex items-center justify-between py-3 border-b last:border-0">
                              <div>
                                <p className="font-medium">{deposit.description || "Deposit"}</p>
                                <p className="text-sm text-muted-foreground">{formatDate(deposit.depositDate)}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-green-600">{formatCurrency(deposit.amount)} RWF</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                    <div className="pt-4 border-t mt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total Deposited:</span>
                        <span className="text-xl font-bold text-green-600">
                          {formatCurrency(deposits.reduce((sum, d) => sum + d.amount, 0))} RWF
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No deposit history yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
        </main>
      </div>
    </ProtectedRoute>
  )
}
