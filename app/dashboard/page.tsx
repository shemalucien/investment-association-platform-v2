"use client"

import { useEffect, useState } from "react"
import { TrendingUp, HandCoins, Sparkles, CreditCard, AlertTriangle, History, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency, formatDate } from "@/lib/utils/calculations"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { apiGet, apiPost, apiPatch } from "@/lib/api/client"
import { useAuth } from "@/lib/auth/auth-context"

export default function DashboardPage() {
  const [userShares, setUserShares] = useState<any[]>([])
  const [userLoans, setUserLoans] = useState<any[]>([])
  const [pendingLoans, setPendingLoans] = useState<any[]>([])
  const [loanPayments, setLoanPayments] = useState<any[]>([])
  const [penalties, setPenalties] = useState<any[]>([])
  const [memberProfits, setMemberProfits] = useState<any[]>([])
  const [totalProfits, setTotalProfits] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [loading, setLoading] = useState(true)
  const [membersLoading, setMembersLoading] = useState(true)
  const [showAllShares, setShowAllShares] = useState(false)
  const [showBuyShares, setShowBuyShares] = useState(false)
  const [sharesToBuy, setSharesToBuy] = useState("")
  const [isBuyingShares, setIsBuyingShares] = useState(false)
  const { user } = useAuth()

  // Loan application form state
  const [loanAmount, setLoanAmount] = useState("")
  const [loanDuration, setLoanDuration] = useState("")
  const [loanPurpose, setLoanPurpose] = useState("")
  const [selectedGuarantors, setSelectedGuarantors] = useState<string[]>([])
  const [allMembers, setAllMembers] = useState<any[]>([])
  const [agreementFile, setAgreementFile] = useState<File | null>(null)
  const [isSubmittingLoan, setIsSubmittingLoan] = useState(false)
  const [loanSubmitted, setLoanSubmitted] = useState(false)

  // Loan payment form state
  const [selectedLoanId, setSelectedLoanId] = useState("")
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentReceiptFile, setPaymentReceiptFile] = useState<File | null>(null)
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)
  const [paymentSubmitted, setPaymentSubmitted] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      // Run all fetches in parallel — failures don't block each other
      const [
        sharesResult,
        loansResult,
        paymentsResult,
        penaltiesResult,
        profitsResult,
        membersResult,
      ] = await Promise.allSettled([
        apiGet<any[]>(`/api/shares?memberId=${user.id}`),
        apiGet<any[]>(`/api/loans?memberId=${user.id}`),
        apiGet<any[]>(`/api/loan-payments?memberId=${user.id}`),
        apiGet<any[]>(`/api/penalties?memberId=${user.id}`),
        apiGet<any>("/api/member-profits"),
        apiGet<any[]>("/api/members?guarantors=true"),
      ])

      if (sharesResult.status === "fulfilled") {
        setUserShares(sharesResult.value ?? [])
      }

      if (loansResult.status === "fulfilled") {
        const loans = loansResult.value ?? []
        setUserLoans(loans.filter((l: any) => l.status === "active"))
        setPendingLoans(loans.filter((l: any) => l.status === "pending"))
      }

      if (paymentsResult.status === "fulfilled") {
        setLoanPayments(paymentsResult.value ?? [])
      }

      if (penaltiesResult.status === "fulfilled") {
        setPenalties((penaltiesResult.value ?? []).filter((p: any) => p.status === "pending"))
      } else {
        console.warn("[v0] Penalties not available:", penaltiesResult.reason)
      }

      if (profitsResult.status === "fulfilled") {
        const profitsData = profitsResult.value ?? {}
        setMemberProfits(profitsData.memberProfits || [])
        setTotalProfits(profitsData.totalProfits || 0)
        setTotalRevenue(profitsData.totalRevenue || 0)
      }

      if (membersResult.status === "fulfilled") {
        const members = (membersResult.value ?? []).filter((m: any) => m.id !== user.id)
        setAllMembers(members)
      } else {
        console.error("[v0] Failed to load members for guarantors:", membersResult.reason)
      }

      setMembersLoading(false)
      setLoading(false)
    }

    fetchData()
  }, [user?.id])

  const handleLoanApplication = async () => {
    if (!loanAmount || !loanDuration) return

    setIsSubmittingLoan(true)
    try {
      const formData = new FormData()
      formData.append("memberId", user?.id || "")
      formData.append("principalAmount", loanAmount)
      formData.append("duration", loanDuration)
      formData.append("interestRate", "10")
      formData.append("purpose", loanPurpose || "General purpose")
      if (selectedGuarantors.length > 0) {
        const guarantorNames = selectedGuarantors.map(
          (id) => allMembers.find((m) => m.id === id)?.name || id
        )
        formData.append("guarantors", JSON.stringify(guarantorNames))
      }
      if (agreementFile) {
        formData.append("agreementFile", agreementFile)
      }

      const response = await fetch("/api/loans", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit loan application")
      }

      setLoanSubmitted(true)
      setLoanAmount("")
      setLoanDuration("")
      setLoanPurpose("")
      setSelectedGuarantors([])
      setAgreementFile(null)

      // Refresh loans so pending status card shows immediately
      const loansData = await apiGet<any[]>(`/api/loans?memberId=${user?.id}`)
      setUserLoans(loansData.filter((l: any) => l.status === "active"))
      setPendingLoans(loansData.filter((l: any) => l.status === "pending"))
    } catch (error: any) {
      console.error("[v0] Error submitting loan application:", error)
      alert(error?.message || "Failed to submit loan application. Please try again.")
    } finally {
      setIsSubmittingLoan(false)
    }
  }

  const handleLoanPayment = async () => {
    if (!selectedLoanId || !paymentAmount) return

    setIsSubmittingPayment(true)
    try {
      const formData = new FormData()
      formData.append("loanId", selectedLoanId)
      formData.append("amount", paymentAmount)
      if (paymentReceiptFile) {
        formData.append("receipt", paymentReceiptFile)
      }

      const response = await fetch("/api/loan-payments", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error((data as any)?.error || "Failed to submit loan payment")
      }

      setPaymentSubmitted(true)
      setSelectedLoanId("")
      setPaymentAmount("")
      setPaymentReceiptFile(null)

      // Refresh loans so balance and status update immediately
      const updatedLoans = await apiGet<any[]>(`/api/loans?memberId=${user?.id}`)
      setUserLoans(updatedLoans.filter((l: any) => l.status === "active"))
      setPendingLoans(updatedLoans.filter((l: any) => l.status === "pending"))

      // Refresh payment history
      const updatedPayments = await apiGet<any[]>(`/api/loan-payments?memberId=${user?.id}`)
      setLoanPayments(updatedPayments)
    } catch (error) {
      console.error("[v0] Error submitting loan payment:", error)
    } finally {
      setIsSubmittingPayment(false)
    }
  }

  const handleBuyShares = async () => {
    if (!sharesToBuy || Number.parseInt(sharesToBuy) <= 0) {
      alert("Please enter a valid number of shares")
      return
    }

    setIsBuyingShares(true)
    try {
      const SHARE_PRICE = 10000 // 10,000 RWF per share
      await apiPost<any>("/api/shares", {
        memberId: user?.id,
        quantity: Number.parseInt(sharesToBuy),
        pricePerShare: SHARE_PRICE,
        paymentMethod: "cash",
        notes: "Purchased via member dashboard",
      })

      alert(`Successfully purchased ${sharesToBuy} share${Number.parseInt(sharesToBuy) > 1 ? "s" : ""} for ${formatCurrency(Number.parseInt(sharesToBuy) * SHARE_PRICE)} RWF`)
      setSharesToBuy("")
      setShowBuyShares(false)

      // Refresh shares data
      const sharesData = await apiGet<any[]>(`/api/shares?memberId=${user?.id}`)
      setUserShares(sharesData)
    } catch (error: any) {
      console.error("[v0] Error purchasing shares:", error)
      alert(error?.message || "Failed to purchase shares. Please try again.")
    } finally {
      setIsBuyingShares(false)
    }
  }

  const handlePayPenalty = async (penaltyId: string) => {
    try {
      await apiPatch("/api/penalties", { penaltyId })
      setPenalties(penalties.filter(p => p.id !== penaltyId))
    } catch (error) {
      console.error("[v0] Error paying penalty:", error)
    }
  }

  const totalShares = userShares.reduce((sum, share) => sum + (share.numberOfShares || 0), 0)
  const totalShareValue = userShares.reduce((sum, share) => sum + (share.totalAmount || 0), 0)

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <div className="text-center py-12">Loading...</div>
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
          {/* Welcome Section */}
          <Card className="mb-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-1">Welcome, {user?.name}!</h2>
                  <p className="text-muted-foreground">
                    You are lucky to be part of our Cooperative. Together, we build a stronger financial future for our community.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Penalties Alert */}
          {penalties.length > 0 && (
            <Card className="mb-6 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <CardTitle className="text-red-900 dark:text-red-200">Pending Penalties</CardTitle>
                    <CardDescription className="text-red-700 dark:text-red-300">
                      You have {penalties.length} pending penalty(s) to pay
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {penalties.map((penalty) => (
                    <div key={penalty.id} className="flex items-center justify-between p-3 bg-white dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex-1">
                        <p className="font-medium text-red-900 dark:text-red-200">{penalty.reason}</p>
                        <p className="text-sm text-red-700 dark:text-red-300">
                          {formatCurrency(penalty.amount)} RWF ({penalty.penalty_rate}% rate)
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handlePayPenalty(penalty.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Pay
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* User's Shares */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Your Shares</CardTitle>
                    <CardDescription>Your cooperative share holdings</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Total Shares</span>
                    <span className="text-2xl font-bold">{totalShares}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Total Value</span>
                    <span className="text-2xl font-bold">{formatCurrency(totalShareValue)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold mb-2">Share History</h4>
                  {userShares.length > 0 ? (
                    <>
                      {(showAllShares ? userShares : userShares.slice(0, 3)).map((share) => (
                        <div key={share.id} className="flex justify-between items-center py-2 border-b last:border-0 text-sm">
                          <div>
                            <p className="font-medium">{share.numberOfShares} shares</p>
                            <p className="text-xs text-muted-foreground">{share.purchaseDate}</p>
                          </div>
                          <p className="font-semibold">{formatCurrency(share.totalAmount)}</p>
                        </div>
                      ))}
                      {userShares.length > 3 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => setShowAllShares(!showAllShares)}
                        >
                          {showAllShares ? "See Less" : "See More"}
                        </Button>
                      )}
                    </>
                  ) : (
                    <p className="text-center text-muted-foreground py-4 text-sm">No shares purchased yet</p>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button
                    className="w-full"
                    onClick={() => setShowBuyShares(!showBuyShares)}
                    variant="outline"
                  >
                    {showBuyShares ? "Cancel" : "Buy More Shares"}
                  </Button>
                </div>
                {showBuyShares && (
                  <div className="mt-4 space-y-4 p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="shares-to-buy">Number of Shares</Label>
                      <Input
                        id="shares-to-buy"
                        type="number"
                        min="1"
                        placeholder="Enter number of shares"
                        value={sharesToBuy}
                        onChange={(e) => setSharesToBuy(e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Share price: {formatCurrency(10000)} RWF per share
                    </p>
                    {sharesToBuy && (
                      <p className="text-sm font-medium">
                        Total: {formatCurrency(Number.parseInt(sharesToBuy) * 10000)} RWF
                      </p>
                    )}
                    <Button
                      className="w-full"
                      onClick={handleBuyShares}
                      disabled={!sharesToBuy || Number.parseInt(sharesToBuy) <= 0 || isBuyingShares}
                    >
                      {isBuyingShares ? "Processing..." : "Purchase Shares"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Profit & Revenue */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle>Profit Distribution</CardTitle>
                    <CardDescription>Cooperative revenue and your profit shares</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <span className="text-sm font-medium">Total Cooperative Revenue</span>
                    <span className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Your Total Profits</span>
                    <span className="text-2xl font-bold text-green-600">{formatCurrency(totalProfits)}</span>
                  </div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg mb-4">
                  <p className="text-sm font-medium mb-1">Profit Sharing Rule</p>
                  <p className="text-xs text-muted-foreground">
                    Members receive 2% of profit per share owned
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold mb-2">Profit History</h4>
                  {memberProfits.length > 0 ? (
                    memberProfits.slice(0, 3).map((profit) => (
                      <div key={profit.id} className="flex justify-between items-center py-2 border-b last:border-0 text-sm">
                        <div>
                          <p className="font-medium">{profit.period}</p>
                          <p className="text-xs text-muted-foreground">{profit.shares_count} shares</p>
                        </div>
                        <p className="font-semibold text-green-600">{formatCurrency(profit.profit_amount)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4 text-sm">No profit distributions yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Loan Section - Only show if member has active loans */}
          {userLoans.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Active Loans */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <HandCoins className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Active Loans</CardTitle>
                      <CardDescription>Your current loan status</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {userLoans.map((loan) => (
                    <div key={loan.id} className="space-y-4 p-4 bg-muted/50 rounded-lg mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Principal Amount</span>
                        <span className="font-semibold">{formatCurrency(loan.principalAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Amount Paid</span>
                        <span className="font-semibold">{formatCurrency(loan.amountPaid)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Remaining Balance</span>
                        <span className="font-semibold text-red-600">{formatCurrency(loan.remainingBalance)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Monthly Payment</span>
                        <span className="font-semibold">{formatCurrency(loan.monthlyPayment)}</span>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => setSelectedLoanId(loan.id)}
                        variant="outline"
                      >
                        Make a Payment
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Loan Payment Form */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>Loan Payment</CardTitle>
                      <CardDescription>Make a loan payment</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedLoanId && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="payment-amount">Payment Amount (RWF)</Label>
                        <Input
                          id="payment-amount"
                          type="number"
                          min="1"
                          placeholder="Enter amount"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="payment-receipt">Payment Receipt (Optional)</Label>
                        <Input
                          id="payment-receipt"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => setPaymentReceiptFile(e.target.files?.[0] || null)}
                        />
                        {paymentReceiptFile && (
                          <p className="text-sm text-muted-foreground">
                            Selected: {paymentReceiptFile.name} ({(paymentReceiptFile.size / 1024).toFixed(2)} KB)
                          </p>
                        )}
                      </div>

                      <Button
                        className="w-full"
                        onClick={handleLoanPayment}
                        disabled={!paymentAmount || isSubmittingPayment}
                      >
                        {isSubmittingPayment ? "Processing..." : "Submit Payment"}
                      </Button>
                    </div>
                  )}
                  {!selectedLoanId && (
                    <p className="text-center text-muted-foreground py-4 text-sm">
                      Select a loan above to make a payment
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Pending Loan Applications */}
          {userLoans.length === 0 && pendingLoans.length > 0 && (
            <Card className="mb-6 border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <CardTitle className="text-yellow-900 dark:text-yellow-200">Loan Application Pending</CardTitle>
                    <CardDescription className="text-yellow-700 dark:text-yellow-300">
                      Your application is awaiting admin approval. You will be notified once reviewed.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingLoans.map((loan) => (
                    <div key={loan.id} className="p-4 bg-white dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-yellow-900 dark:text-yellow-200">Amount Requested</span>
                        <span className="font-bold text-yellow-900 dark:text-yellow-200">{formatCurrency(loan.principalAmount)} RWF</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-yellow-900 dark:text-yellow-200">Duration</span>
                        <span className="font-semibold text-yellow-900 dark:text-yellow-200">{loan.duration} months</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-yellow-900 dark:text-yellow-200">Monthly Payment</span>
                        <span className="font-semibold text-yellow-900 dark:text-yellow-200">{formatCurrency(loan.monthlyPayment)} RWF</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-yellow-900 dark:text-yellow-200">Application Date</span>
                        <span className="text-sm text-yellow-700 dark:text-yellow-300">{formatDate(loan.applicationDate)}</span>
                      </div>
                      <div className="pt-1">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 px-3 py-1 rounded-full">
                          <Clock className="h-3 w-3" />
                          Awaiting Admin Approval
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loan Application Form — only when no active or pending loans */}
          {userLoans.length === 0 && pendingLoans.length === 0 && (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <HandCoins className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Apply for a Loan</CardTitle>
                    <CardDescription>Request a loan from the cooperative</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loanSubmitted ? (
                  <div className="text-center py-10">
                    <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                      <Clock className="h-8 w-8 text-yellow-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Application Submitted!</h3>
                    <p className="text-sm text-muted-foreground mb-1">
                      Your loan application has been submitted successfully.
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                      Please wait for the admin to review and approve your request. You will receive a notification once a decision is made.
                    </p>
                    <div className="inline-flex items-center gap-2 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg px-4 py-2 text-sm text-yellow-800 dark:text-yellow-200">
                      <Clock className="h-4 w-4" />
                      Awaiting Admin Approval
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="loan-amount">Loan Amount (RWF)</Label>
                      <Input
                        id="loan-amount"
                        type="number"
                        min="1"
                        placeholder="Enter amount"
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="loan-duration">Duration (months)</Label>
                      <Select value={loanDuration} onValueChange={setLoanDuration}>
                        <SelectTrigger id="loan-duration">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 months</SelectItem>
                          <SelectItem value="6">6 months</SelectItem>
                          <SelectItem value="12">12 months</SelectItem>
                          <SelectItem value="18">18 months</SelectItem>
                          <SelectItem value="24">24 months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="loan-purpose">Purpose</Label>
                      <Textarea
                        id="loan-purpose"
                        placeholder="Describe why you need this loan"
                        value={loanPurpose}
                        onChange={(e) => setLoanPurpose(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Guarantors (optional)</Label>
                      {membersLoading ? (
                        <div className="border rounded-md p-4 text-sm text-muted-foreground text-center">
                          Loading members…
                        </div>
                      ) : allMembers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No other active members available.</p>
                      ) : (
                        <div className="border rounded-md p-3 space-y-1 max-h-44 overflow-y-auto bg-background">
                          {allMembers.map((member) => {
                            const checked = selectedGuarantors.includes(member.id)
                            return (
                              <label
                                key={member.id}
                                className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 rounded px-2 py-1.5 transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 accent-primary flex-shrink-0"
                                  checked={checked}
                                  onChange={() =>
                                    setSelectedGuarantors((prev) =>
                                      checked
                                        ? prev.filter((id) => id !== member.id)
                                        : [...prev, member.id]
                                    )
                                  }
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium leading-none">{member.name}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">{member.memberNumber}</p>
                                </div>
                              </label>
                            )
                          })}
                        </div>
                      )}
                      {selectedGuarantors.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {selectedGuarantors.length} guarantor{selectedGuarantors.length > 1 ? "s" : ""} selected
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="agreement-file">Loan Agreement Document (Optional)</Label>
                      <Input
                        id="agreement-file"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setAgreementFile(e.target.files?.[0] || null)}
                      />
                      {agreementFile && (
                        <p className="text-sm text-muted-foreground">
                          Selected: {agreementFile.name} ({(agreementFile.size / 1024).toFixed(2)} KB)
                        </p>
                      )}
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleLoanApplication}
                      disabled={!loanAmount || !loanDuration || isSubmittingLoan}
                    >
                      {isSubmittingLoan ? "Submitting..." : "Submit Application"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Loan Payment History - always visible */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <History className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Loan Payment History</CardTitle>
                  <CardDescription>All your submitted loan payments and their status</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loanPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No loan payments recorded yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground text-left">
                        <th className="pb-3 font-medium">Loan #</th>
                        <th className="pb-3 font-medium">Amount</th>
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Confirmed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loanPayments.map((payment) => {
                        const statusStyle =
                          payment.status === "confirmed"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : payment.status === "rejected"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"

                        return (
                          <tr key={payment.id} className="border-b last:border-0">
                            <td className="py-3 font-medium">{payment.loanNumber ?? "—"}</td>
                            <td className="py-3 font-semibold">{formatCurrency(payment.amount)}</td>
                            <td className="py-3 text-muted-foreground">
                              {payment.paymentDate
                                ? new Date(payment.paymentDate).toLocaleDateString()
                                : "—"}
                            </td>
                            <td className="py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusStyle}`}>
                                {payment.status}
                              </span>
                            </td>
                            <td className="py-3 text-muted-foreground">
                              {payment.confirmedAt
                                ? new Date(payment.confirmedAt).toLocaleDateString()
                                : "—"}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  )
}
