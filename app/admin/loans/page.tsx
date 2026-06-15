"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, HandCoins, Wallet, TrendingUp, CheckCircle, XCircle, Eye, CreditCard } from "lucide-react"
import { apiGet, apiPatch, apiPost } from "@/lib/api/client"
import { formatCurrency, formatDate, calculateLoanRepayment } from "@/lib/utils/calculations"
import type { Loan } from "@/lib/types"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/lib/auth/auth-context"

export default function AdminLoansPage() {
  const [showApplicationDialog, setShowApplicationDialog] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [loanAmount, setLoanAmount] = useState("")
  const [duration, setDuration] = useState("")
  const [purpose, setPurpose] = useState("")
  const [memberId, setMemberId] = useState("")
  const [selectedGuarantors, setSelectedGuarantors] = useState<string[]>([])
  const [receivingAccount, setReceivingAccount] = useState("")
  const [agreementFile, setAgreementFile] = useState<File | null>(null)
  const [loans, setLoans] = useState<Loan[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [guarantorMembers, setGuarantorMembers] = useState<any[]>([])
  const [pendingPayments, setPendingPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { hasPermission, user } = useAuth()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [loansData, membersData, guarantorData, paymentsData] = await Promise.all([
          apiGet<Loan[]>("/api/loans"),
          apiGet<any[]>("/api/members"),
          apiGet<any[]>("/api/members?guarantors=true"),
          apiGet<any[]>("/api/loan-payments?pending=true"),
        ])
        setLoans(loansData)
        setMembers(membersData)
        setGuarantorMembers(guarantorData)
        setPendingPayments(paymentsData)
      } catch (error) {
        console.error("[v0] Error fetching loans data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const activeLoans = loans.filter((loan) => loan.status === "active")
  const pendingLoans = loans.filter((loan) => loan.status === "pending")
  const completedLoans = loans.filter((loan) => loan.status === "completed")

  const totalLoansIssued = activeLoans.reduce((sum, loan) => sum + loan.principalAmount, 0)
  const totalOutstanding = activeLoans.reduce((sum, loan) => sum + loan.remainingBalance, 0)
  const totalInterestEarned = activeLoans.reduce(
    (sum, loan) => sum + loan.amountPaid - (loan.principalAmount - loan.remainingBalance),
    0,
  )

  const calculatePreview = () => {
    const amount = Number.parseInt(loanAmount) || 0
    const months = Number.parseInt(duration) || 0
    if (amount > 0 && months > 0) {
      return calculateLoanRepayment(amount, 10, months)
    }
    return null
  }

  const preview = calculatePreview()

  // Available guarantors exclude the selected loan applicant
  const availableGuarantors = guarantorMembers.filter((m) => m.id !== memberId)

  const updateLoanStatus = async (id: string, status: string) => {
    try {
      const updatedLoan = await apiPatch<Loan>(`/api/loans/${id}`, {
        status,
        approvedBy: user?.id,
      })
      setLoans(loans.map((l) => (l.id === id ? updatedLoan : l)))
    } catch (error) {
      console.error("[v0] Error updating loan status:", error)
    }
  }

  const handlePaymentAction = async (paymentId: string, action: "confirmed" | "rejected") => {
    try {
      await apiPatch("/api/loan-payments", { paymentId, status: action })
      setPendingPayments((prev) => prev.filter((p) => p.id !== paymentId))
    } catch (error) {
      console.error("[v0] Error updating payment status:", error)
    }
  }

  const handleApply = async () => {
    try {
      const guarantorNames = selectedGuarantors.map(
        (id) => guarantorMembers.find((m) => m.id === id)?.name || id
      )

      const formData = new FormData()
      formData.append("memberId", memberId)
      formData.append("principalAmount", loanAmount)
      formData.append("duration", duration)
      formData.append("interestRate", "10")
      formData.append("purpose", purpose)
      formData.append("guarantors", JSON.stringify(guarantorNames))
      formData.append("receivingAccount", receivingAccount)
      if (agreementFile) {
        formData.append("agreementFile", agreementFile)
      }

      const response = await fetch("/api/loans", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to create loan")
      }

      const newLoan = data.data
      setLoans([...loans, newLoan])
      setShowApplicationDialog(false)
      setLoanAmount("")
      setDuration("")
      setPurpose("")
      setMemberId("")
      setSelectedGuarantors([])
      setReceivingAccount("")
      setAgreementFile(null)
    } catch (error) {
      console.error("[v0] Error applying for loan:", error)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Loan Management</h2>
              <p className="text-muted-foreground">Manage loan applications, approvals, and repayments</p>
            </div>
            <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Loan Application
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Loan Application</DialogTitle>
                  <DialogDescription>
                    Submit a loan application. Interest rate is 10% per year (simple interest).
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="loan-member">Select Member</Label>
                    <Select value={memberId} onValueChange={setMemberId}>
                      <SelectTrigger id="loan-member">
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
                    <Label htmlFor="loan-amount">Loan Amount (RWF)</Label>
                    <Input
                      id="loan-amount"
                      type="number"
                      min="1"
                      placeholder="Enter loan amount"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (months)</Label>
                    <Select value={duration} onValueChange={setDuration}>
                      <SelectTrigger id="duration">
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
                    <Label htmlFor="purpose">Loan Purpose</Label>
                    <Input
                      id="purpose"
                      placeholder="Enter loan purpose"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Guarantors</Label>
                    {availableGuarantors.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {memberId ? "No other active members available as guarantors." : "Select a member first."}
                      </p>
                    ) : (
                      <div className="border rounded-md p-3 space-y-1 max-h-40 overflow-y-auto bg-background">
                        {availableGuarantors.map((m) => {
                          const checked = selectedGuarantors.includes(m.id)
                          return (
                            <label key={m.id} className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 rounded px-2 py-1.5 transition-colors">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 accent-primary flex-shrink-0"
                                checked={checked}
                                onChange={() =>
                                  setSelectedGuarantors((prev) =>
                                    checked ? prev.filter((id) => id !== m.id) : [...prev, m.id]
                                  )
                                }
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium leading-none">{m.name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{m.memberNumber}</p>
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
                    <Label htmlFor="receiving-account">Receiving Account</Label>
                    <Input
                      id="receiving-account"
                      placeholder="Enter account number to receive loan"
                      value={receivingAccount}
                      onChange={(e) => setReceivingAccount(e.target.value)}
                    />
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

                  {preview && (
                    <div className="bg-muted p-4 rounded-lg space-y-2">
                      <h4 className="font-semibold mb-2">Loan Summary</h4>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Monthly Payment:</span>
                        <span className="font-medium">{formatCurrency(preview.monthlyPayment)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Repayment:</span>
                        <span className="font-medium">{formatCurrency(preview.totalRepayment)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Interest:</span>
                        <span className="font-medium">
                          {formatCurrency(preview.totalRepayment - Number.parseInt(loanAmount))}
                        </span>
                      </div>
                    </div>
                  )}

                  <Button className="w-full" onClick={handleApply} disabled={!memberId || !loanAmount || !duration}>
                    Submit Application
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Loans</p>
                    <h3 className="text-3xl font-bold mt-2">{activeLoans.length}</h3>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <HandCoins className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Issued</p>
                    <h3 className="text-xl font-bold mt-2">{formatCurrency(totalLoansIssued)}</h3>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Outstanding</p>
                    <h3 className="text-xl font-bold mt-2">{formatCurrency(totalOutstanding)}</h3>
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
                    <p className="text-sm font-medium text-muted-foreground">Interest Earned</p>
                    <h3 className="text-xl font-bold mt-2">{formatCurrency(totalInterestEarned)}</h3>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="active" className="space-y-6">
            <TabsList>
              <TabsTrigger value="active">Active Loans</TabsTrigger>
              <TabsTrigger value="pending">Pending Applications ({pendingLoans.length})</TabsTrigger>
              <TabsTrigger value="payments">
                Loan Payments
                {pendingPayments.length > 0 && (
                  <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                    {pendingPayments.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              <Card>
                <CardHeader>
                  <CardTitle>Active Loans</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead className="text-right">Principal</TableHead>
                        <TableHead className="text-right">Monthly Payment</TableHead>
                        <TableHead className="text-right">Amount Paid</TableHead>
                        <TableHead className="text-right">Remaining</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeLoans.map((loan) => {
                        const progress = ((loan.amountPaid / loan.totalRepayment) * 100).toFixed(1)
                        return (
                          <TableRow key={loan.id}>
                            <TableCell className="font-medium">{loan.memberName}</TableCell>
                            <TableCell className="text-right">{formatCurrency(loan.principalAmount)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(loan.monthlyPayment)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(loan.amountPaid)}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(loan.remainingBalance)}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="h-2 bg-muted rounded-full overflow-hidden w-20">
                                  <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                                </div>
                                <span className="text-xs text-muted-foreground">{progress}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" onClick={() => setSelectedLoan(loan)}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Loan Details</DialogTitle>
                                    <DialogDescription>{loan.memberName}</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 pt-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-muted-foreground">Principal Amount</Label>
                                        <p className="font-semibold">{formatCurrency(loan.principalAmount)}</p>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">Interest Rate</Label>
                                        <p className="font-semibold">{loan.interestRate}%</p>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">Duration</Label>
                                        <p className="font-semibold">{loan.duration} months</p>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">Monthly Payment</Label>
                                        <p className="font-semibold">{formatCurrency(loan.monthlyPayment)}</p>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">Total Repayment</Label>
                                        <p className="font-semibold">{formatCurrency(loan.totalRepayment)}</p>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">Application Date</Label>
                                        <p className="font-semibold">{formatDate(loan.applicationDate)}</p>
                                      </div>
                                    </div>
                                    <div className="border-t pt-4">
                                      <Label className="text-muted-foreground">Guarantors</Label>
                                      <div className="flex flex-wrap gap-2 mt-2">
                                        {(loan.guarantors ?? []).map((guarantor, i) => (
                                          <Badge key={i} variant="secondary">
                                            {guarantor}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="bg-muted p-4 rounded-lg">
                                      <div className="space-y-2">
                                        <div className="flex justify-between">
                                          <span className="text-sm">Amount Paid</span>
                                          <span className="font-semibold">{formatCurrency(loan.amountPaid)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-sm">Remaining Balance</span>
                                          <span className="font-semibold">{formatCurrency(loan.remainingBalance)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pending">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead className="text-right">Amount Requested</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead className="text-right">Monthly Payment</TableHead>
                        <TableHead>Application Date</TableHead>
                        <TableHead>Guarantors</TableHead>
                        <TableHead>Agreement</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingLoans.map((loan) => (
                        <TableRow key={loan.id}>
                          <TableCell className="font-medium">{loan.memberName}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(loan.principalAmount)}
                          </TableCell>
                          <TableCell>{loan.duration} months</TableCell>
                          <TableCell className="text-right">{formatCurrency(loan.monthlyPayment)}</TableCell>
                          <TableCell>{formatDate(loan.applicationDate)}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(loan.guarantors ?? []).slice(0, 2).map((guarantor, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {guarantor}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {loan.agreementFileName ? (
                              <Badge variant="secondary" className="text-xs">
                                {loan.agreementFileName}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">No file</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              {hasPermission("canApproveLoan") ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => updateLoanStatus(loan.id, "active")}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => updateLoanStatus(loan.id, "rejected")}
                                  >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              ) : (
                                <Badge variant="secondary">Pending Review</Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>Pending Loan Payments</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {pendingPayments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No pending payments to review.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Member</TableHead>
                          <TableHead>Loan #</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Receipt</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingPayments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell className="font-medium">{payment.memberName}</TableCell>
                            <TableCell className="font-mono text-sm">{payment.loanNumber}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(payment.amount)}
                            </TableCell>
                            <TableCell>
                              {payment.paymentDate
                                ? new Date(payment.paymentDate).toLocaleDateString()
                                : "—"}
                            </TableCell>
                            <TableCell>
                              {payment.receiptFileName ? (
                                <Badge variant="outline" className="text-xs">{payment.receiptFileName}</Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">No receipt</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                Pending
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  onClick={() => handlePaymentAction(payment.id, "confirmed")}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Confirm
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handlePaymentAction(payment.id, "rejected")}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="completed">
              <Card>
                <CardHeader>
                  <CardTitle>Completed Loans</CardTitle>
                </CardHeader>
                <CardContent>
                  {completedLoans.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No completed loans yet</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Member</TableHead>
                          <TableHead className="text-right">Principal</TableHead>
                          <TableHead className="text-right">Total Repaid</TableHead>
                          <TableHead>Completion Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {completedLoans.map((loan) => (
                          <TableRow key={loan.id}>
                            <TableCell className="font-medium">{loan.memberName}</TableCell>
                            <TableCell className="text-right">{formatCurrency(loan.principalAmount)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(loan.totalRepayment)}</TableCell>
                            <TableCell>{formatDate(loan.applicationDate)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ProtectedRoute>
  )
}
