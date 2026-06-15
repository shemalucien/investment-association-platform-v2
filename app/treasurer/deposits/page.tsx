"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { History, Users, Wallet, CheckCircle2 } from "lucide-react"
import { apiGet } from "@/lib/api/client"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/lib/auth/auth-context"
import { formatCurrency, formatDate } from "@/lib/utils/calculations"

export default function TreasurerDepositsPage() {
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [description, setDescription] = useState("")
  const [cooperativeAccount, setCooperativeAccount] = useState("")
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [deposits, setDeposits] = useState<any[]>([])
  const [cooperativeAccounts, setCooperativeAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user, hasPermission } = useAuth()
  const isTreasurer = user?.role === "treasurer"

  useEffect(() => {
    const fetchDeposits = async () => {
      try {
        const [depositsData, accountsData] = await Promise.all([
          apiGet<any[]>(isTreasurer ? `/api/deposits?memberId=${user?.id}` : "/api/deposits"),
          apiGet<any[]>("/api/cooperative-accounts"),
        ])

        setDeposits(depositsData)
        setCooperativeAccounts(accountsData)
      } catch (error) {
        console.error("[v0] Error fetching deposits:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDeposits()
  }, [hasPermission, user?.id])

  const visibleDeposits = isTreasurer
    ? deposits
    : deposits.filter((deposit) => deposit.memberId === user?.id)

  const handleDepositClick = async () => {
    if (!amount || !paymentMethod || !cooperativeAccount) return

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("memberId", user?.id || "")
      formData.append("amount", amount)
      formData.append("type", "voluntary")
      formData.append("description", description || `Deposit via ${paymentMethod}`)
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
      setDeposits((prev) => [newDeposit, ...prev])
      setSubmitted(true)
      setAmount("")
      setPaymentMethod("")
      setPhoneNumber("")
      setDescription("")
      setCooperativeAccount("")
      setReceiptFile(null)

      const refreshed = await apiGet<any[]>(isTreasurer ? `/api/deposits?memberId=${user?.id}` : "/api/deposits")
      setDeposits(refreshed)
    } catch (error) {
      console.error("[v0] Error recording deposit:", error)
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
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-200">Deposit Submitted!</h3>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                      The treasurer deposit has been recorded successfully.
                    </p>
                  </div>
                  <Button onClick={() => setSubmitted(false)} variant="outline" className="mt-4">
                    Make Another Deposit
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
        <main className="container mx-auto px-4 py-8 space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Make a Deposit</CardTitle>
                    <CardDescription>Record a deposit for the treasurer account</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (RWF)</Label>
                  <Input id="amount" type="number" min="1" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment-method">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger id="payment-method"><SelectValue placeholder="Select payment method" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mtn">MTN Mobile Money</SelectItem>
                      <SelectItem value="airtel">Airtel Money</SelectItem>
                      <SelectItem value="bk-card">BK Card</SelectItem>
                      <SelectItem value="zigama-css">Zigama CSS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(paymentMethod === "mtn" || paymentMethod === "airtel") && (
                  <div className="space-y-2">
                    <Label htmlFor="phone-number">Phone Number</Label>
                    <Input id="phone-number" type="tel" placeholder="Enter phone number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="receipt">Upload Receipt (Optional)</Label>
                  <Input id="receipt" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} />
                  {receiptFile && <p className="text-sm text-muted-foreground">Selected: {receiptFile.name} ({(receiptFile.size / 1024).toFixed(2)} KB)</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input id="description" placeholder="Add a note about this deposit" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cooperative-account">Select Cooperative Account</Label>
                  <Select value={cooperativeAccount} onValueChange={setCooperativeAccount}>
                    <SelectTrigger id="cooperative-account"><SelectValue placeholder="Select an account" /></SelectTrigger>
                    <SelectContent>
                      {cooperativeAccounts.length > 0 ? cooperativeAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.accountNumber}>{account.accountName} - {account.accountNumber}</SelectItem>
                      )) : <SelectItem value="manual" disabled>No accounts available</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full" onClick={handleDepositClick} disabled={!amount || !paymentMethod || !cooperativeAccount || isSubmitting}>
                  {isSubmitting ? "Processing..." : "Deposit"}
                </Button>
              </CardContent>
            </Card>

            <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>{isTreasurer ? "My Deposit History" : "All Deposit History"}</CardTitle>
                  <CardDescription>{isTreasurer ? "Your deposit transactions in Rwandan Francs" : "All member deposits in Rwandan Francs"}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading history...</div>
              ) : visibleDeposits.length > 0 ? (
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
                      {visibleDeposits
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
                        {formatCurrency(visibleDeposits.reduce((sum, d) => sum + d.amount, 0))} RWF
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
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
