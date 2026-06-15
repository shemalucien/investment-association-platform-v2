"use client"

import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { AlertTriangle, Phone, Mail } from "lucide-react"

export default function TreasurerHelpPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Treasurer Help & Support</h1>
            <p className="text-muted-foreground">Treasurer-specific guidance and support</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-10 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  </div>
                  <CardTitle>Treasurer Support</CardTitle>
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
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
