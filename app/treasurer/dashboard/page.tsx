"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Wallet, TrendingUp, DollarSign, BarChart3, HandCoins } from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { formatCurrency } from "@/lib/utils/calculations"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { apiGet } from "@/lib/api/client"
import type { Loan, Deposit } from "@/lib/types"
import logo from "@/images/icon.png"

export default function TreasurerDashboardPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [sharesSummary, setSharesSummary] = useState({ totalShares: 0, totalValue: 0, totalMembers: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [loansData, depositsData, sharesData] = await Promise.all([
          apiGet<Loan[]>("/api/loans"),
          apiGet<Deposit[]>("/api/deposits"),
          apiGet<any>("/api/shares?summary=true"),
        ])

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

  const recentDeposits = deposits
    .slice()
    .sort((a, b) => new Date(b.depositDate).getTime() - new Date(a.depositDate).getTime())
    .slice(0, 5)

  const activeLoansList = loans.filter((loan) => loan.status === "active")

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
              <h2 className="text-3xl font-bold mb-2">Treasurer Dashboard</h2>
              <p className="text-muted-foreground">Financial management and overview</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatCard title="Total Capital" value={formatCurrency(totalCapital)} icon={DollarSign} />
            <StatCard title="Total Shares" value={totalShares.toString()} icon={TrendingUp} />
            <StatCard title="Total Deposits" value={formatCurrency(totalDepositsAmount)} icon={Wallet} />
            <StatCard title="Active Loans" value={activeLoans.toString()} icon={HandCoins} />
            <StatCard title="Loans Outstanding" value={formatCurrency(totalLoansOutstanding)} icon={Wallet} />
            <StatCard title="Interest Earned" value={formatCurrency(totalInterestEarned)} icon={BarChart3} />
          </div>

        </main>
      </div>
    </ProtectedRoute>
  )
}
