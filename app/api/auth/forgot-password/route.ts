import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db/connection"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 })
    }

    // Check if user exists
    const userResult = await query(
      `SELECT id, email, role FROM users WHERE email = $1 AND is_active = true`,
      [email]
    )

    if (userResult.rows.length === 0) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({ success: true, message: "If the email exists, a reset link has been sent" })
    }

    const user = userResult.rows[0]

    // Generate a reset token (simple implementation - in production, use a proper token system)
    const resetToken = Math.random().toString(36).substring(2) + Date.now().toString(36)
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    // Store the reset token in the user record
    await query(
      `UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3`,
      [resetToken, resetTokenExpiry, user.id]
    )

    // In production, send an email with the reset link
    // For now, we'll just return success
    // The reset link would be: ${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}

    console.log(`[v0] Password reset token for ${email}: ${resetToken}`)
    console.log(`[v0] Reset link would be: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`)

    return NextResponse.json({ 
      success: true, 
      message: "If the email exists, a reset link has been sent",
      // For development only - remove in production
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    })
  } catch (error) {
    console.error("[v0] Error in forgot password:", error)
    return NextResponse.json({ success: false, error: "Failed to process request" }, { status: 500 })
  }
}
