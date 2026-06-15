"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Users, TrendingUp, Wallet, HandCoins, DollarSign, BarChart3, CheckCircle, XCircle } from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils/calculations"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { apiGet, apiPatch, apiPost } from "@/lib/api/client"
import type { Member, Loan, Deposit } from "@/lib/types"
import { useAuth } from "@/lib/auth/auth-context"
import logo from "@/images/icon.png"

export default function AdminDashboardPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [sharesSummary, setSharesSummary] = useState({ totalShares: 0, totalValue: 0, totalMembers: 0 })
  const [loading, setLoading] = useState(true)
  const { hasPermission, user } = useAuth()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [membersData, loansData, depositsData, sharesData] = await Promise.all([
          apiGet<Member[]>("/api/members"),
          apiGet<Loan[]>("/api/loans"),
          apiGet<Deposit[]>("/api/deposits"),
          apiGet<any>("/api/shares?summary=true"),
        ])

        setMembers(membersData)
        setLoans(loansData)
        setDeposits(depositsData)
        setSharesSummary(sharesData)
      } catch (error) {
        console.error("[v0] Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const updateLoanStatus = async (id: string, status: string) => {
    try {
      const loan = loans.find((l) => l.id === id)
      const updatedLoan = await apiPatch<Loan>(`/api/loans/${id}`, {
        status,
        approvedBy: user?.id,
      })
      setLoans(loans.map((l) => (l.id === id ? updatedLoan : l)))

      // Send notification when loan is approved
      if (status === "active" && loan?.memberId) {
        await apiPost("/api/notifications", {
          memberId: loan.memberId,
          title: "Loan Application Approved",
          message: "Your loan application approved you may receive the message in awhile",
          notificationType: "success",
          relatedEntityType: "loan",
          relatedEntityId: loan.id,
        })
      }
    } catch (error) {
      console.error("[v0] Error updating loan status:", error)
    }
  }

  const updateMemberStatus = async (id: string, status: string) => {
    try {
      const member = members.find((m) => m.id === id)
      const updatedMember = await apiPatch<Member>(`/api/members/${id}`, {
        status,
      })
      setMembers(members.map((m) => (m.id === id ? updatedMember : m)))

      // Send notification when member is approved
      if (status === "active" && member) {
        await apiPost("/api/notifications", {
          memberId: member.id,
          title: "Membership Approved",
          message: "Your membership has been approved. Welcome to AMATSINDA Cooperative!",
          notificationType: "success",
          relatedEntityType: "member",
          relatedEntityId: member.id,
        })
      }
    } catch (error) {
      console.error("[v0] Error updating member status:", error)
    }
  }

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

  const totalMembers = members.length
  const totalShares = sharesSummary.totalShares
  const totalCapital = sharesSummary.totalValue
  const activeLoans = loans.filter((loan) => loan.status === "active").length
  const totalLoansOutstanding = loans
    .filter((loan) => loan.status === "active")
    .reduce((sum, loan) => sum + loan.remainingBalance, 0)
  const totalDepositsAmount = deposits.reduce((sum, deposit) => sum + deposit.amount, 0)
  const totalInterestEarned = loans
    .filter((loan) => loan.status === "active")
    .reduce((sum, loan) => sum + (loan.totalRepayment - loan.principalAmount), 0)

  const recentTransactions = deposits
    .slice()
    .sort((a, b) => new Date(b.depositDate).getTime() - new Date(a.depositDate).getTime())
    .slice(0, 5)

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center gap-4">
            <Image
              src={logo}
              alt="AMATSINDA Cooperative logo"
              width={60}
              height={60}
              className="rounded-full"
            />
            <div>
              <h2 className="text-3xl font-bold mb-2">Admin Dashboard</h2>
              <p className="text-muted-foreground">Overview of association activities and financial status</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatCard title="Total Members" value={totalMembers.toString()} icon={Users} />
            <StatCard title="Total Capital" value={formatCurrency(totalCapital)} icon={DollarSign} />
            <StatCard title="Total Shares" value={totalShares.toString()} icon={TrendingUp} />
            <StatCard title="Active Loans" value={activeLoans.toString()} icon={HandCoins} />
            <StatCard title="Loans Outstanding" value={formatCurrency(totalLoansOutstanding)} icon={Wallet} />
            <StatCard title="Interest Earned" value={formatCurrency(totalInterestEarned)} icon={BarChart3} />
          </div>

        </main>
      </div>
    </ProtectedRoute>
  )
}
