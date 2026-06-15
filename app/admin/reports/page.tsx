"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, DollarSign, TrendingUp, Wallet, BarChart3, Send, CheckCircle2, FileDown } from "lucide-react"
import { apiGet, apiPost } from "@/lib/api/client"
import { formatCurrency, calculateProfitShare } from "@/lib/utils/calculations"
import { StatCard } from "@/components/ui/stat-card"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/lib/auth/auth-context"

export default function AdminReportsPage() {
  const [members, setMembers] = useState<any[]>([])
  const [shares, setShares] = useState<any[]>([])
  const [loans, setLoans] = useState<any[]>([])
  const [deposits, setDeposits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const [reportTitle, setReportTitle] = useState("")
  const [reportMessage, setReportMessage] = useState("")
  const [selectedMember, setSelectedMember] = useState("")
  const [sendToAll, setSendToAll] = useState(true)
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

  const getShareQuantity = (share: any) => Number(share.numberOfShares ?? share.quantity ?? 0)
  const totalCapital = shares.reduce((sum, s) => sum + s.totalAmount, 0)
  const totalShares = shares.reduce((sum, s) => sum + getShareQuantity(s), 0)
  const totalLoansIssued = loans
    .filter((l) => l.status === "active" || l.status === "completed")
    .reduce((sum, l) => sum + l.principalAmount, 0)
  const totalLoansOutstanding = loans
    .filter((l) => l.status === "active")
    .reduce((sum, l) => sum + l.remainingBalance, 0)
  const totalInterestEarned = loans
    .filter((l) => l.status === "active")
    .reduce((sum, l) => sum + (l.amountPaid - (l.principalAmount - l.remainingBalance)), 0)
  const totalVoluntaryDeposits = deposits
    .filter((d) => d.type === "voluntary")
    .reduce((sum, d) => sum + d.amount, 0)
  const availableFunds = totalCapital + totalVoluntaryDeposits - totalLoansIssued + totalInterestEarned
  const annualProfit = totalInterestEarned * 1.2

  const memberFinancialData = members.map((member) => {
    const memberShares = shares.filter((s) => s.memberId === member.id).reduce((sum, s) => sum + getShareQuantity(s), 0)
    const memberShareValue = shares.filter((s) => s.memberId === member.id).reduce((sum, s) => sum + s.totalAmount, 0)
    const memberLoanBalance = loans
      .filter((l) => l.memberId === member.id && l.status === "active")
      .reduce((sum, l) => sum + l.remainingBalance, 0)
    const memberDepositTotal = deposits
      .filter((d) => d.memberId === member.id)
      .reduce((sum, d) => sum + d.amount, 0)
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

  // ── PDF Report generation ─────────────────────────────────────────────────
  const reportDate = new Date().toLocaleDateString("en-RW", { year: "numeric", month: "long", day: "numeric" })

  const printHTML = (title: string, bodyHtml: string) => {
    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>${title}</title>
<style>
  body{font-family:Arial,sans-serif;padding:32px;color:#111}
  h1{font-size:22px;margin-bottom:4px}
  h2{font-size:16px;color:#555;font-weight:normal;margin-bottom:24px}
  .meta{font-size:12px;color:#888;margin-bottom:32px}
  table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}
  th{background:#f3f4f6;text-align:left;padding:8px 10px;border-bottom:2px solid #e5e7eb}
  td{padding:7px 10px;border-bottom:1px solid #e5e7eb}
  .total-row td{font-weight:bold;background:#f9fafb}
  .section{margin-top:32px}
  .section-title{font-size:15px;font-weight:bold;margin-bottom:8px;border-bottom:1px solid #e5e7eb;padding-bottom:6px}
  .kv{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f3f4f6;font-size:13px}
  .right{text-align:right}
  @media print{body{padding:16px}}
</style></head>
<body>
  <h1>AMATSINDA Cooperative</h1>
  <h2>${title}</h2>
  <div class="meta">Generated on ${reportDate} &nbsp;|&nbsp; Admin: ${user?.name ?? "—"}</div>
  ${bodyHtml}
  <script>window.onload=()=>{window.print()}</script>
</body></html>`)
    win.document.close()
  }

  const generateOverviewReport = () => {
    const rows = loans
      .filter((l) => l.status === "active")
      .map((l) => {
        const pct = l.totalRepayment > 0 ? ((l.amountPaid / l.totalRepayment) * 100).toFixed(1) : "0.0"
        return `<tr>
          <td>${l.memberName}</td>
          <td class="right">${formatCurrency(l.principalAmount)}</td>
          <td class="right">${formatCurrency(l.amountPaid)}</td>
          <td class="right">${formatCurrency(l.remainingBalance)}</td>
          <td class="right">${pct}%</td>
        </tr>`
      }).join("")

    printHTML("Financial Overview Report", `
      <div class="section">
        <div class="section-title">Financial Overview</div>
        <div class="kv"><span>Total Members</span><span>${members.length}</span></div>
        <div class="kv"><span>Total Share Capital</span><span>${formatCurrency(totalCapital)}</span></div>
        <div class="kv"><span>Total Shares Issued</span><span>${totalShares}</span></div>
        <div class="kv"><span>Voluntary Deposits</span><span>${formatCurrency(totalVoluntaryDeposits)}</span></div>
        <div class="kv"><span>Loans Issued</span><span>${formatCurrency(totalLoansIssued)}</span></div>
        <div class="kv"><span>Loans Outstanding</span><span>${formatCurrency(totalLoansOutstanding)}</span></div>
        <div class="kv"><span>Interest Earned</span><span>${formatCurrency(totalInterestEarned)}</span></div>
        <div class="kv" style="font-weight:bold;font-size:14px;margin-top:8px">
          <span>Available Funds</span>
          <span style="color:${availableFunds >= 0 ? "#16a34a" : "#dc2626"}">${formatCurrency(availableFunds)}</span>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Active Loan Performance</div>
        <table><thead><tr>
          <th>Member</th><th class="right">Principal</th><th class="right">Paid</th>
          <th class="right">Remaining</th><th class="right">Progress</th>
        </tr></thead><tbody>${rows}</tbody></table>
      </div>`)
  }

  const generateMemberReport = () => {
    const rows = memberFinancialData.map((m) => `<tr>
      <td>${m.name}</td>
      <td class="right">${m.shares}</td>
      <td class="right">${formatCurrency(m.shareValue)}</td>
      <td class="right">${formatCurrency(m.deposits)}</td>
      <td class="right">${formatCurrency(m.loanBalance)}</td>
      <td class="right">${formatCurrency(m.netPosition)}</td>
    </tr>`).join("")

    printHTML("Member Financial Summary Report", `
      <div class="section">
        <div class="section-title">Member Financial Summary</div>
        <table><thead><tr>
          <th>Member</th><th class="right">Shares</th><th class="right">Share Value</th>
          <th class="right">Deposits</th><th class="right">Loan Balance</th><th class="right">Net Position</th>
        </tr></thead><tbody>
          ${rows}
          <tr class="total-row">
            <td>TOTALS</td>
            <td class="right">${totalShares}</td>
            <td class="right">${formatCurrency(totalCapital)}</td>
            <td class="right">${formatCurrency(totalVoluntaryDeposits)}</td>
            <td class="right">${formatCurrency(totalLoansOutstanding)}</td>
            <td class="right">${formatCurrency(memberFinancialData.reduce((s, m) => s + m.netPosition, 0))}</td>
          </tr>
        </tbody></table>
      </div>`)
  }

  const generateProfitReport = () => {
    const rows = memberFinancialData.map((m) => {
      const pct = totalShares > 0 ? ((m.shares / totalShares) * 100).toFixed(2) : "0.00"
      return `<tr>
        <td>${m.name}</td>
        <td class="right">${m.shares}</td>
        <td class="right">${pct}%</td>
        <td class="right">${formatCurrency(m.profitShare)}</td>
      </tr>`
    }).join("")

    printHTML("Annual Profit Distribution Report", `
      <div class="section">
        <div class="section-title">Profit Summary</div>
        <div class="kv"><span>Total Interest Earned</span><span>${formatCurrency(totalInterestEarned)}</span></div>
        <div class="kv"><span>Estimated Annual Profit</span><span>${formatCurrency(annualProfit)}</span></div>
        <div class="kv"><span>Total Shares</span><span>${totalShares}</span></div>
      </div>
      <div class="section">
        <div class="section-title">Per-Member Distribution</div>
        <table><thead><tr>
          <th>Member</th><th class="right">Shares</th><th class="right">Share %</th><th class="right">Profit Share</th>
        </tr></thead><tbody>
          ${rows}
          <tr class="total-row">
            <td>TOTAL</td><td class="right">${totalShares}</td>
            <td class="right">100%</td><td class="right">${formatCurrency(annualProfit)}</td>
          </tr>
        </tbody></table>
      </div>`)
  }
  // ── End report generation ─────────────────────────────────────────────────

  const handleSendMonthlyReport = async () => {
    if (!reportTitle || !reportMessage) return
    setIsSending(true)
    try {
      const membersToSend = sendToAll ? members : members.filter((m) => m.id === selectedMember)
      for (const member of membersToSend) {
        const formData = new FormData()
        formData.append("memberId", member.id)
        formData.append("title", reportTitle)
        formData.append("message", reportMessage)
        formData.append("notificationType", "info")
        formData.append("relatedEntityType", "report")
        if (attachedFile) {
          formData.append("attachment", attachedFile)
        }

        const response = await fetch("/api/notifications", {
          method: "POST",
          body: formData,
        })
        const data = await response.json()
        if (!response.ok || !data?.success) {
          throw new Error(data?.error || "Failed to send report")
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

  if (loading) {
    return (
      <ProtectedRoute requiredPermission="canViewReports">
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <div className="text-center py-12">Loading reports...</div>
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
              <TabsTrigger value="send-report">Send Monthly Report</TabsTrigger>
            </TabsList>

            {/* ── Financial Overview ─────────────────────────────────────── */}
            <TabsContent value="overview" className="space-y-6">
              <div className="flex justify-end">
                <Button variant="outline" onClick={generateOverviewReport}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              </div>

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
                  <CardHeader><CardTitle>Association Balance Sheet</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span className="text-sm">Member Shares Capital</span><span className="font-medium">{formatCurrency(totalCapital)}</span></div>
                      <div className="flex justify-between"><span className="text-sm">Voluntary Deposits</span><span className="font-medium">{formatCurrency(totalVoluntaryDeposits)}</span></div>
                      <div className="flex justify-between"><span className="text-sm">Loans Outstanding (Receivable)</span><span className="font-medium">{formatCurrency(totalLoansOutstanding)}</span></div>
                      <div className="flex justify-between"><span className="text-sm">Interest Earned</span><span className="font-medium">{formatCurrency(totalInterestEarned)}</span></div>
                      <div className="flex justify-between pt-2 border-t font-semibold">
                        <span>Total Assets</span>
                        <span>{formatCurrency(totalCapital + totalVoluntaryDeposits + totalLoansOutstanding + totalInterestEarned)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Liquidity Analysis</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span className="text-sm">Total Capital</span><span className="font-medium">{formatCurrency(totalCapital)}</span></div>
                      <div className="flex justify-between"><span className="text-sm">Voluntary Deposits</span><span className="font-medium">{formatCurrency(totalVoluntaryDeposits)}</span></div>
                      <div className="flex justify-between text-red-600"><span className="text-sm">Less: Loans Issued</span><span className="font-medium">-{formatCurrency(totalLoansIssued)}</span></div>
                      <div className="flex justify-between text-green-600"><span className="text-sm">Add: Interest Earned</span><span className="font-medium">+{formatCurrency(totalInterestEarned)}</span></div>
                      <div className="flex justify-between pt-3 border-t font-semibold text-lg">
                        <span>Available Funds</span>
                        <span className={availableFunds >= 0 ? "text-green-600" : "text-red-600"}>{formatCurrency(availableFunds)}</span>
                      </div>
                    </div>
                    <div className="bg-muted p-4 rounded-lg mt-4">
                      <p className="text-sm text-muted-foreground">
                        {availableFunds >= 0
                          ? "Association has sufficient liquidity to process new loan requests."
                          : "Association needs to collect more deposits or loan repayments before issuing new loans."}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader><CardTitle>Loan Performance</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {loans.filter((l) => l.status === "active").map((loan) => {
                      const rate = (loan.amountPaid / loan.totalRepayment) * 100
                      return (
                        <div key={loan.id} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{loan.memberName}</span>
                            <span className="text-muted-foreground">{formatCurrency(loan.amountPaid)} / {formatCurrency(loan.totalRepayment)}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${rate}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Member Summary ─────────────────────────────────────────── */}
            <TabsContent value="members">
              <div className="flex justify-end mb-4">
                <Button variant="outline" onClick={generateMemberReport}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              </div>
              <Card>
                <CardHeader><CardTitle>Member Financial Summary</CardTitle></CardHeader>
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
                          <TableCell className="text-right font-semibold">{formatCurrency(member.netPosition)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-semibold bg-muted/50">
                        <TableCell>TOTALS</TableCell>
                        <TableCell className="text-right">{totalShares}</TableCell>
                        <TableCell className="text-right">{formatCurrency(totalCapital)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(totalVoluntaryDeposits)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(totalLoansOutstanding)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(memberFinancialData.reduce((s, m) => s + m.netPosition, 0))}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Profit Distribution ────────────────────────────────────── */}
            <TabsContent value="profit">
              <div className="flex justify-end mb-4">
                <Button variant="outline" onClick={generateProfitReport}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              </div>
              <Card>
                <CardHeader><CardTitle>Annual Profit Distribution</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="bg-muted p-6 rounded-lg">
                      <div className="grid grid-cols-3 gap-6">
                        <div><p className="text-sm text-muted-foreground mb-1">Interest Earned</p><p className="text-2xl font-bold">{formatCurrency(totalInterestEarned)}</p></div>
                        <div><p className="text-sm text-muted-foreground mb-1">Estimated Annual Profit</p><p className="text-2xl font-bold">{formatCurrency(annualProfit)}</p></div>
                        <div><p className="text-sm text-muted-foreground mb-1">Total Shares</p><p className="text-2xl font-bold">{totalShares}</p></div>
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
                          const pct = totalShares > 0 ? ((member.shares / totalShares) * 100).toFixed(2) : "0.00"
                          return (
                            <TableRow key={member.id}>
                              <TableCell className="font-medium">{member.name}</TableCell>
                              <TableCell className="text-right">{member.shares}</TableCell>
                              <TableCell className="text-right">{pct}%</TableCell>
                              <TableCell className="text-right font-semibold">{formatCurrency(member.profitShare)}</TableCell>
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
                        <strong>Note:</strong> Profit distribution is based on share ownership percentage.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Send Monthly Report ────────────────────────────────────── */}
            <TabsContent value="send-report">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Send className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Send Monthly Report</CardTitle>
                      <CardDescription>Send monthly financial reports to members</CardDescription>
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
                        Sent to {sendToAll ? "all members" : "the selected member"}.
                      </p>
                      <Button onClick={() => setReportSent(false)} variant="outline">Send Another Report</Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="report-title">Report Title</Label>
                        <Input id="report-title" placeholder="e.g., Monthly Financial Report - June 2026" value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="report-message">Report Message</Label>
                        <Textarea id="report-message" placeholder="Enter report details..." value={reportMessage} onChange={(e) => setReportMessage(e.target.value)} rows={6} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="file-upload">Attach Document (Optional)</Label>
                        <Input id="file-upload" type="file" onChange={(e) => setAttachedFile(e.target.files?.[0] || null)} accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" />
                        {attachedFile && <p className="text-sm text-muted-foreground">Selected: {attachedFile.name} ({(attachedFile.size / 1024).toFixed(2)} KB)</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>Send To</Label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" checked={sendToAll} onChange={() => setSendToAll(true)} className="w-4 h-4" />
                            All Members
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" checked={!sendToAll} onChange={() => setSendToAll(false)} className="w-4 h-4" />
                            Specific Member
                          </label>
                        </div>
                      </div>
                      {!sendToAll && (
                        <div className="space-y-2">
                          <Label>Select Member</Label>
                          <Select value={selectedMember} onValueChange={setSelectedMember}>
                            <SelectTrigger><SelectValue placeholder="Choose a member" /></SelectTrigger>
                            <SelectContent>
                              {members.map((m) => (
                                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <Button className="w-full" onClick={handleSendMonthlyReport} disabled={!reportTitle || !reportMessage || (!sendToAll && !selectedMember) || isSending}>
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
