"use client"

import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Info, Wallet, TrendingUp, HelpCircle, Phone, Mail } from "lucide-react"

export default function AdminHelpPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Admin Help & Support</h1>
            <p className="text-muted-foreground">Administrator guidance and support</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Info className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>Admin Responsibilities</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Approve or reject member registrations</li>
                  <li>Approve or reject loan applications</li>
                  <li>Manage member accounts and information</li>
                  <li>Monitor all deposits and transactions</li>
                  <li>Generate and view financial reports</li>
                  <li>Send monthly reports to members</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>Managing Deposits</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>View all member deposits</li>
                  <li>Track deposit history by member</li>
                  <li>Verify deposit amounts and dates</li>
                  <li>Monitor payment methods used</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>Managing Loans</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Review pending loan applications</li>
                  <li>Approve or reject loans based on criteria</li>
                  <li>Monitor active loans and repayments</li>
                  <li>Track loan guarantors and accounts</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <HelpCircle className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>Reports & Analytics</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>View financial overview and statistics</li>
                  <li>Generate member summary reports</li>
                  <li>Calculate profit distribution</li>
                  <li>Send monthly reports to members</li>
                </ul>
              </CardContent>
            </Card>

          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
