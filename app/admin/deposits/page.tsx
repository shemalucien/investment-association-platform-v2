"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { History, Users, Plus } from "lucide-react"
import { apiGet, apiPost } from "@/lib/api/client"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/lib/auth/auth-context"
import { formatCurrency, formatDate } from "@/lib/utils/calculations"

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [cooperativeAccounts, setCooperativeAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showDepositForm, setShowDepositForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  // Deposit form state
  const [selectedMemberId, setSelectedMemberId] = useState("")
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [description, setDescription] = useState("")
  const [cooperativeAccount, setCooperativeAccount] = useState("")
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  
  const { hasPermission, user } = useAuth()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [depositsData, membersData, accountsData] = await Promise.all([
          apiGet<any[]>("/api/deposits"),
          apiGet<any[]>("/api/members"),
          apiGet<any[]>("/api/cooperative-accounts")
        ])
        setDeposits(depositsData)
        setMembers(membersData)
        setCooperativeAccounts(accountsData)
      } catch (error) {
        console.error("[v0] Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleDeposit = async () => {
    if (!selectedMemberId || !amount || !paymentMethod || !cooperativeAccount) return

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("memberId", selectedMemberId)
      formData.append("amount", amount)
      formData.append("type", "voluntary")
      formData.append("description", description || `Admin deposit via ${paymentMethod}`)
      formData.append("paymentMethod", paymentMethod)
      if (phoneNumber) formData.append("phoneNumber", phoneNumber)
      formData.append("cooperativeAccount", cooperativeAccount)
      if (receiptFile) formData.append("receipt", receiptFile)

      const response = await fetch("/api/deposits", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit deposit")
      }

      const newDeposit = data.data
      setDeposits([newDeposit, ...deposits])
      setSubmitted(true)
      setSelectedMemberId("")
      setAmount("")
      setPaymentMethod("")
      setPhoneNumber("")
      setDescription("")
      setCooperativeAccount("")
      setReceiptFile(null)
    } catch (error) {
      console.error("[v0] Error recording deposit:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">All Deposit History</h2>
              <p className="text-muted-foreground">All member deposits in Rwandan Francs</p>
            </div>
            {(user?.role === "admin" || user?.role === "treasurer") && (
              <Button onClick={() => setShowDepositForm(!showDepositForm)}>
                <Plus className="mr-2 h-4 w-4" />
                {showDepositForm ? "Cancel" : "New Deposit"}
              </Button>
            )}
          </div>

          {showDepositForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Make a Deposit</CardTitle>
                <CardDescription>Record a deposit for a member</CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="text-center py-8">
                    <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <History className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Deposit Recorded!</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      The deposit has been recorded successfully.
                    </p>
                    <Button onClick={() => setSubmitted(false)} variant="outline">
                      Make Another Deposit
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="member-select">Select Member</Label>
                      <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                        <SelectTrigger id="member-select">
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
                      <Label htmlFor="amount">Amount (RWF)</Label>
                      <Input
                        id="amount"
                        type="number"
                        min="1"
                        placeholder="Enter amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="payment-method">Payment Method</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger id="payment-method">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mobile-money">Mobile Money</SelectItem>
                          <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="check">Check</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {paymentMethod === "mobile-money" && (
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="Enter phone number"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="cooperative-account">Select Cooperative Account</Label>
                      <Select value={cooperativeAccount} onValueChange={setCooperativeAccount}>
                        <SelectTrigger id="cooperative-account">
                          <SelectValue placeholder="Select an account" />
                        </SelectTrigger>
                        <SelectContent>
                          {cooperativeAccounts.length > 0 ? (
                            cooperativeAccounts.map((account) => (
                              <SelectItem key={account.id} value={account.accountNumber}>
                                {account.accountName} - {account.accountNumber}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="manual" disabled>
                              No accounts available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Input
                        id="description"
                        placeholder="Add a note about this deposit"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="receipt">Upload Receipt (Optional)</Label>
                      <Input
                        id="receipt"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                      />
                      {receiptFile && (
                        <p className="text-sm text-muted-foreground">
                          Selected: {receiptFile.name} ({(receiptFile.size / 1024).toFixed(2)} KB)
                        </p>
                      )}
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleDeposit}
                      disabled={!selectedMemberId || !amount || !paymentMethod || !cooperativeAccount || isSubmitting}
                    >
                      {isSubmitting ? "Processing..." : "Record Deposit"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>All Deposit History</CardTitle>
                  <CardDescription>All member deposits in Rwandan Francs</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading history...</div>
              ) : deposits.length > 0 ? (
                <>
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
