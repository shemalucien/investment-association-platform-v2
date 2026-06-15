"use client"

import { useEffect } from "react"

import { useState } from "react"

import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, DollarSign, TrendingUp, Wallet, BarChart3, Send, CheckCircle2 } from "lucide-react"
import { apiGet, apiPost } from "@/lib/api/client"
import { formatCurrency, calculateProfitShare } from "@/lib/utils/calculations"
import { StatCard } from "@/components/ui/stat-card"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/lib/auth/auth-context"

export default function ReportsPage() {
  const [members, setMembers] = useState<any[]>([])
  const [shares, setShares] = useState<any[]>([])
  const [loans, setLoans] = useState<any[]>([])
  const [deposits, setDeposits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { hasPermission, user } = useAuth()

  // Monthly report form state
  const [reportTitle, setReportTitle] = useState("")
  const [reportMessage, setReportMessage] = useState("")
  const [selectedMember, setSelectedMember] = useState("")
  const [sendToAll, setSendToAll] = useState(true)
  const [sendToAdmin, setSendToAdmin] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [reportSent, setReportSent] = useState(false)
  const [attachedFile, setAttachedFile] = useState<File | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [membersData, sharesData, loansData, depositsData] = await Promise.all([
          apiGet<any[]>("/api/members"),
          apiGet<any[]>("/api/shares"),
          apiGet<any[]>("/api/loans"),
          apiGet<any[]>("/api/deposits"),
        ])
        setMembers(membersData)
        setShares(sharesData)
        setLoans(loansData)
        setDeposits(depositsData)
      } catch (error) {
        console.error("[v0] Error fetching report data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const totalCapital = shares.reduce((sum, share) => sum + share.totalAmount, 0)
  const getShareQuantity = (share: any) => Number(share.numberOfShares ?? share.quantity ?? 0)

  const totalShares = shares.reduce((sum, share) => sum + getShareQuantity(share), 0)
  const totalLoansIssued = loans
    .filter((loan) => loan.status === "active" || loan.status === "completed")
    .reduce((sum, loan) => sum + loan.principalAmount, 0)
  const totalLoansOutstanding = loans
    .filter((loan) => loan.status === "active")
    .reduce((sum, loan) => sum + loan.remainingBalance, 0)
  const totalInterestEarned = loans
    .filter((loan) => loan.status === "active")
    .reduce((sum, loan) => {
      const principalPaid = loan.principalAmount - loan.remainingBalance
      const interestPaid = loan.amountPaid - principalPaid
      return sum + interestPaid
    }, 0)
  const totalVoluntaryDeposits = deposits.filter((d) => d.type === "voluntary").reduce((sum, d) => sum + d.amount, 0)

  const availableFunds = totalCapital + totalVoluntaryDeposits - totalLoansIssued + totalInterestEarned

  // Simulated profit for distribution
  const annualProfit = totalInterestEarned * 1.2

  const handleSendMonthlyReport = async () => {
    if (!reportTitle || !reportMessage) return

    setIsSending(true)
    try {
      // Build message with file attachment info
      let messageToSend = reportMessage
      if (attachedFile) {
        messageToSend += `\n\nAttachment: ${attachedFile.name} (${(attachedFile.size / 1024).toFixed(2)} KB)`
      }

      // Treasurer sends to admin, Admin sends to members
      if (user?.role === "treasurer") {
        // Send to admin - find admin member
        const adminMember = members.find((m) => m.role === "admin")
        if (adminMember) {
          await apiPost("/api/notifications", {
            memberId: adminMember.id,
            title: reportTitle,
            message: messageToSend,
            notificationType: "info",
            relatedEntityType: "report",
            relatedEntityId: "monthly",
          })
        }
      } else {
        // Admin sends to members
        const membersToSend = sendToAll ? members : members.filter((m) => m.id === selectedMember)

        for (const member of membersToSend) {
          await apiPost("/api/notifications", {
            memberId: member.id,
            title: reportTitle,
            message: messageToSend,
            notificationType: "info",
            relatedEntityType: "report",
            relatedEntityId: "monthly",
          })
        }
      }

      setReportSent(true)
      setReportTitle("")
      setReportMessage("")
      setSelectedMember("")
      setAttachedFile(null)
    } catch (error) {
      console.error("[v0] Error sending monthly report:", error)
    } finally {
      setIsSending(false)
    }
  }

  const memberFinancialData = members.map((member) => {
    const memberShares = shares.filter((s) => s.memberId === member.id).reduce((sum, s) => sum + getShareQuantity(s), 0)
    const memberShareValue = shares.filter((s) => s.memberId === member.id).reduce((sum, s) => sum + s.totalAmount, 0)
    const memberLoans = loans.filter((l) => l.memberId === member.id && l.status === "active")
    const memberLoanBalance = memberLoans.reduce((sum, l) => sum + l.remainingBalance, 0)
    const memberDeposits = deposits.filter((d) => d.memberId === member.id)
    const memberDepositTotal = memberDeposits.reduce((sum, d) => sum + d.amount, 0)
    const profitShare = calculateProfitShare(annualProfit, memberShares, totalShares)

    return {
      ...member,
      shares: memberShares,
      shareValue: memberShareValue,
      loanBalance: memberLoanBalance,
      deposits: memberDepositTotal,
      profitShare,
      netPosition: memberShareValue + memberDepositTotal - memberLoanBalance,
    }
  })

  if (loading) {
    return (
      <ProtectedRoute requiredPermission="canViewReports">
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <div className="text-center py-12">Generating reports...</div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredPermission="canViewReports">
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Financial Reports</h2>
            <p className="text-muted-foreground">Comprehensive financial overview and profit distribution</p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Financial Overview</TabsTrigger>
              <TabsTrigger value="members">Member Summary</TabsTrigger>
              <TabsTrigger value="profit">Profit Distribution</TabsTrigger>
              {hasPermission("canViewReports") && (
                <TabsTrigger value="send-report">Send Monthly Report</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total Members" value={members.length.toString()} icon={Users} />
                <StatCard title="Total Capital" value={formatCurrency(totalCapital)} icon={DollarSign} />
                <StatCard title="Total Shares" value={totalShares.toString()} icon={TrendingUp} />
                <StatCard title="Loans Issued" value={formatCurrency(totalLoansIssued)} icon={Wallet} />
                <StatCard title="Loans Outstanding" value={formatCurrency(totalLoansOutstanding)} icon={Wallet} />
                <StatCard title="Interest Earned" value={formatCurrency(totalInterestEarned)} icon={BarChart3} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Association Balance Sheet</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-3 text-sm text-muted-foreground">ASSETS</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Member Shares Capital</span>
                            <span className="font-medium">{formatCurrency(totalCapital)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Voluntary Deposits</span>
                            <span className="font-medium">{formatCurrency(totalVoluntaryDeposits)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Loans Outstanding (Receivable)</span>
                            <span className="font-medium">{formatCurrency(totalLoansOutstanding)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Interest Earned</span>
                            <span className="font-medium">{formatCurrency(totalInterestEarned)}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t font-semibold">
                            <span>Total Assets</span>
                            <span>
                              {formatCurrency(
                                totalCapital + totalVoluntaryDeposits + totalLoansOutstanding + totalInterestEarned,
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Liquidity Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Total Capital</span>
                          <span className="font-medium">{formatCurrency(totalCapital)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Voluntary Deposits</span>
                          <span className="font-medium">{formatCurrency(totalVoluntaryDeposits)}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span className="text-sm">Less: Loans Issued</span>
                          <span className="font-medium">-{formatCurrency(totalLoansIssued)}</span>
                        </div>
                        <div className="flex justify-between text-green-600">
                          <span className="text-sm">Add: Interest Earned</span>
                          <span className="font-medium">+{formatCurrency(totalInterestEarned)}</span>
                        </div>
                        <div className="flex justify-between pt-3 border-t font-semibold text-lg">
                          <span>Available Funds</span>
                          <span className={availableFunds >= 0 ? "text-green-600" : "text-red-600"}>
                            {formatCurrency(availableFunds)}
                          </span>
                        </div>
                      </div>

                      <div className="bg-muted p-4 rounded-lg mt-4">
                        <p className="text-sm text-muted-foreground">
                          {availableFunds >= 0
                            ? "Association has sufficient liquidity to process new loan requests."
                            : "Association needs to collect more deposits or loan repayments before issuing new loans."}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Loan Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {loans
                      .filter((loan) => loan.status === "active")
                      .map((loan) => {
                        const repaymentRate = (loan.amountPaid / loan.totalRepayment) * 100
                        return (
                          <div key={loan.id} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">{loan.memberName}</span>
                              <span className="text-muted-foreground">
                                {formatCurrency(loan.amountPaid)} / {formatCurrency(loan.totalRepayment)}
                              </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${repaymentRate}%` }} />
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="members">
              <Card>
                <CardHeader>
                  <CardTitle>Member Financial Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead className="text-right">Shares</TableHead>
                        <TableHead className="text-right">Share Value</TableHead>
                        <TableHead className="text-right">Deposits</TableHead>
                        <TableHead className="text-right">Loan Balance</TableHead>
                        <TableHead className="text-right">Net Position</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {memberFinancialData.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">{member.name}</TableCell>
                          <TableCell className="text-right">{member.shares}</TableCell>
                          <TableCell className="text-right">{formatCurrency(member.shareValue)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(member.deposits)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(member.loanBalance)}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(member.netPosition)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-semibold bg-muted/50">
                        <TableCell>TOTALS</TableCell>
                        <TableCell className="text-right">{totalShares}</TableCell>
                        <TableCell className="text-right">{formatCurrency(totalCapital)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(totalVoluntaryDeposits)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(totalLoansOutstanding)}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(memberFinancialData.reduce((sum, m) => sum + m.netPosition, 0))}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profit">
              <Card>
                <CardHeader>
                  <CardTitle>Annual Profit Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="bg-muted p-6 rounded-lg">
                      <div className="grid grid-cols-3 gap-6">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Interest Earned</p>
                          <p className="text-2xl font-bold">{formatCurrency(totalInterestEarned)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Estimated Annual Profit</p>
                          <p className="text-2xl font-bold">{formatCurrency(annualProfit)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Total Shares</p>
                          <p className="text-2xl font-bold">{totalShares}</p>
                        </div>
                      </div>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Member</TableHead>
                          <TableHead className="text-right">Shares Owned</TableHead>
                          <TableHead className="text-right">Share %</TableHead>
                          <TableHead className="text-right">Profit Share</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {memberFinancialData.map((member) => {
                          const sharePercentage = totalShares > 0 ? ((member.shares / totalShares) * 100).toFixed(2) : "0.00"
                          return (
                            <TableRow key={member.id}>
                              <TableCell className="font-medium">{member.name}</TableCell>
                              <TableCell className="text-right">{member.shares}</TableCell>
                              <TableCell className="text-right">{sharePercentage}%</TableCell>
                              <TableCell className="text-right font-semibold">
                                {formatCurrency(member.profitShare)}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                        <TableRow className="font-semibold bg-muted/50">
                          <TableCell>TOTAL</TableCell>
                          <TableCell className="text-right">{totalShares}</TableCell>
                          <TableCell className="text-right">100%</TableCell>
                          <TableCell className="text-right">{formatCurrency(annualProfit)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>

                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                      <p className="text-sm text-blue-900 dark:text-blue-100">
                        <strong>Note:</strong> Profit distribution is based on share ownership percentage. Members with
                        more shares receive a proportionally larger share of the association's profits.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="send-report">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Send className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Send Monthly Report</CardTitle>
                      <CardDescription>
                        {user?.role === "treasurer" ? "Send monthly financial reports to admin" : "Send monthly financial reports to members"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {reportSent ? (
                    <div className="text-center py-8">
                      <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Report Sent Successfully!</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        The monthly report has been sent to {user?.role === "treasurer" ? "the admin" : (sendToAll ? "all members" : "the selected member")}.
                      </p>
                      <Button onClick={() => setReportSent(false)} variant="outline">
                        Send Another Report
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="report-title">Report Title</Label>
                        <Input
                          id="report-title"
                          placeholder="e.g., Monthly Financial Report - June 2026"
                          value={reportTitle}
                          onChange={(e) => setReportTitle(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="report-message">Report Message</Label>
                        <Textarea
                          id="report-message"
                          placeholder="Enter the monthly report details including financial summary, profit distribution, and any important updates..."
                          value={reportMessage}
                          onChange={(e) => setReportMessage(e.target.value)}
                          rows={6}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="file-upload">Attach Document (Optional)</Label>
                        <Input
                          id="file-upload"
                          type="file"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null
                            setAttachedFile(file)
                          }}
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                        />
                        {attachedFile && (
                          <p className="text-sm text-muted-foreground">
                            Selected: {attachedFile.name} ({(attachedFile.size / 1024).toFixed(2)} KB)
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Send To</Label>
                        {user?.role === "treasurer" ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              id="send-admin"
                              checked={true}
                              disabled
                              className="w-4 h-4"
                            />
                            <Label htmlFor="send-admin" className="cursor-pointer">Admin Only</Label>
                          </div>
                        ) : (
                          <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                id="send-all"
                                checked={sendToAll}
                                onChange={() => setSendToAll(true)}
                                className="w-4 h-4"
                              />
                              <Label htmlFor="send-all" className="cursor-pointer">All Members</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                id="send-specific"
                                checked={!sendToAll}
                                onChange={() => setSendToAll(false)}
                                className="w-4 h-4"
                              />
                              <Label htmlFor="send-specific" className="cursor-pointer">Specific Member</Label>
                            </div>
                          </div>
                        )}
                      </div>

                      {user?.role !== "treasurer" && !sendToAll && (
                        <div className="space-y-2">
                          <Label htmlFor="select-member">Select Member</Label>
                          <Select value={selectedMember} onValueChange={setSelectedMember}>
                            <SelectTrigger id="select-member">
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
                      )}

                      <Button
                        className="w-full"
                        onClick={handleSendMonthlyReport}
                        disabled={!reportTitle || !reportMessage || (user?.role !== "treasurer" && !sendToAll && !selectedMember) || isSending}
                      >
                        {isSending ? "Sending..." : "Send Report"}
                      </Button>
                    </div>
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
