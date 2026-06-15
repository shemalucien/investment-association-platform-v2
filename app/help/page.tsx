"use client"

import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { HelpCircle, Wallet, TrendingUp, Phone, Mail, Info, AlertTriangle } from "lucide-react"

export default function HelpPage() {
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
                  <div className="h-10 w-10 rounded-full bg-orange-10 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle>Treasurer Support</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-semibold">Common Treasurer Issues:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li><strong>Report Submission Problems:</strong> If you cannot send reports to the admin, check your internet connection and ensure you have the correct admin permissions</li>
                  <li><strong>File Upload Issues:</strong> If document attachments fail, ensure the file is in supported format (PDF, DOC, DOCX, XLS, XLSX, JPG, PNG) and under 10MB</li>
                  <li><strong>Financial Data Discrepancies:</strong> If deposit or loan totals don't match, verify with the admin and check for pending transactions</li>
                  <li><strong>Report Not Delivered:</strong> If the admin doesn't receive your report, contact them directly at +250790255540</li>
                </ul>
                <p className="font-semibold mt-4">Quick Solutions:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Refresh the page if data doesn't load</li>
                  <li>Clear browser cache if reports won't submit</li>
                  <li>Contact admin immediately for financial discrepancies</li>
                  <li>Use the Reports page to send monthly financial summaries</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Contact Support</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Phone:</span>
                    </div>
                    <p className="text-muted-foreground">+250790255540</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Email:</span>
                    </div>
                    <p className="text-muted-foreground">ishimweniyonshutirem53@gmail.com</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  For urgent matters, please contact the cooperative administrator directly. Our support team is available during business hours to assist with any questions or concerns.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
