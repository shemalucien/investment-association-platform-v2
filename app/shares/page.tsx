"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, TrendingUp } from "lucide-react"
import { apiGet, apiPost } from "@/lib/api/client"
import { formatCurrency, formatDate } from "@/lib/utils/calculations"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/lib/auth/auth-context"

const SHARE_PRICE = 30000 // RWF per share

export default function SharesPage() {
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState("")
  const [numberOfShares, setNumberOfShares] = useState("")
  const [shares, setShares] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { hasPermission } = useAuth()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sharesData, membersData] = await Promise.all([
          apiGet<any[]>("/api/shares"),
          apiGet<any[]>("/api/members"),
        ])
        setShares(sharesData)
        setMembers(membersData)
      } catch (error) {
        console.error("[v0] Error fetching shares data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const totalShares = shares.reduce((sum, share) => sum + share.quantity, 0)
  const totalValue = shares.reduce((sum, share) => sum + share.totalAmount, 0)

  const calculateTotal = () => {
    const shares = Number.parseInt(numberOfShares) || 0
    return shares * SHARE_PRICE
  }

  const handlePurchase = async () => {
    try {
      const payload = {
        memberId: selectedMemberId,
        quantity: Number.parseInt(numberOfShares),
        pricePerShare: SHARE_PRICE,
        totalAmount: calculateTotal(),
      }
      const newShare = await apiPost<any>("/api/shares", payload)
      setShares([...shares, newShare])
      setShowPurchaseDialog(false)
      setSelectedMemberId("")
      setNumberOfShares("")
    } catch (error) {
      console.error("[v0] Error recording purchase:", error)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Shares Management</h2>
              <p className="text-muted-foreground">Track and manage member share purchases</p>
            </div>
            {hasPermission("canManageShares") && (
              <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Record Share Purchase
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Share Purchase</DialogTitle>
                    <DialogDescription>
                      Record a new share purchase for a member. Current price: {formatCurrency(SHARE_PRICE)} per share.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="member">Select Member</Label>
                      <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                        <SelectTrigger id="member">
                          <SelectValue placeholder="Choose a member" />
                        </SelectTrigger>
                        <SelectContent>
                          {members.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shares">Number of Shares</Label>
                      <Input
                        id="shares"
                        type="number"
                        min="1"
                        placeholder="Enter number of shares"
                        value={numberOfShares}
                        onChange={(e) => setNumberOfShares(e.target.value)}
                      />
                    </div>
                    {numberOfShares && (
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Total Amount:</span>
                          <span className="text-lg font-bold">{formatCurrency(calculateTotal())}</span>
                        </div>
                      </div>
                    )}
                    <Button className="w-full" onClick={handlePurchase} disabled={!selectedMemberId || !numberOfShares}>
                      Record Purchase
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Shares Issued</p>
                    <h3 className="text-3xl font-bold mt-2">{totalShares}</h3>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                    <h3 className="text-2xl font-bold mt-2">{formatCurrency(totalValue)}</h3>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Price Per Share</p>
                    <h3 className="text-2xl font-bold mt-2">{formatCurrency(SHARE_PRICE)}</h3>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Share Purchase History</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading history...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member Name</TableHead>
                      <TableHead className="text-right">Number of Shares</TableHead>
                      <TableHead className="text-right">Price Per Share</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                      <TableHead>Purchase Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shares.map((share) => (
                      <TableRow key={share.id}>
                        <TableCell className="font-medium">{share.memberName}</TableCell>
                        <TableCell className="text-right">{share.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(share.pricePerShare)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(share.totalAmount)}</TableCell>
                        <TableCell>{formatDate(share.purchaseDate)}</TableCell>
                        <TableCell>
                          <Badge variant={share.status === "active" ? "default" : "secondary"}>{share.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Share Distribution by Member</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {members.map((member) => {
                  const memberShares = shares
                    .filter((s) => s.memberId === member.id)
                    .reduce((sum, s) => sum + s.numberOfShares, 0)
                  const percentage = totalShares > 0 ? ((memberShares / totalShares) * 100).toFixed(1) : "0.0"

                  return (
                    <div key={member.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{member.name}</span>
                        <span className="text-muted-foreground">
                          {memberShares} shares ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  )
}
