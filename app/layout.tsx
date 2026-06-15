import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AuthProvider } from "@/lib/auth/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Footer } from "@/components/layout/footer"

export const metadata: Metadata = {
  title: "Cooperative Management System Platform",
  description: "Comprehensive Cooperative Management System for AMATSINDA Rwanda",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/cooperative-icon.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/cooperative-icon.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/cooperative-icon.png",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <div className="flex flex-col min-h-screen">
              {children}
              <Footer />
            </div>
            <Analytics />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
