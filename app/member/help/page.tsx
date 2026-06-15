"use client"

import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Info, Wallet, TrendingUp, HelpCircle, Phone, Mail } from "lucide-react"

export default function MemberHelpPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Help & Support</h1>
            <p className="text-muted-foreground">Find answers to common questions and get support</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Info className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>About AMATSINDA Cooperative</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>AMATSINDA Cooperative is a member-owned financial cooperative that helps our community save money, access loans, and build wealth together.</p>
                <p className="font-semibold mt-4">Key Benefits:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Save money through share purchases</li>
                  <li>Access affordable loans</li>
                  <li>Build financial security with your community</li>
                  <li>Transparent and democratic management</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>How to Make Deposits</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Go to the Deposits page from the navigation menu</li>
                  <li>Enter the amount you wish to deposit (in RWF)</li>
                  <li>Select your payment method (MTN, Airtel, BK Card, or Zigama CSS)</li>
                  <li>For mobile money, enter your phone number</li>
                  <li>Click "Deposit" and enter your cooperative code to confirm</li>
                  <li>Your deposit will be recorded and visible in your deposit history</li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>How to Apply for Loans</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Go to the Dashboard page</li>
                  <li>Fill in the loan application form with the amount and duration</li>
                  <li>Provide the purpose of the loan</li>
                  <li>Optionally add guarantors for larger loan amounts</li>
                  <li>Submit your application for admin review</li>
                  <li>You will receive a notification when your loan is approved</li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <HelpCircle className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>Understanding Your Shares</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Shares represent your ownership in the cooperative. Each share has a value and contributes to your voting rights and dividend eligibility.</p>
                <p className="font-semibold mt-4">View Your Shares:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Your total shares and value are shown on the Dashboard</li>
                  <li>Share purchase history is displayed with dates and amounts</li>
                  <li>Shares can be purchased through the cooperative</li>
                  <li>Share values may change based on cooperative performance</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
