import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db/connection"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json({ success: false, error: "Token and password are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, error: "Password must be at least 6 characters long" }, { status: 400 })
    }

    // Check if the token is valid and not expired
    const userResult = await query(
      `SELECT id, email, reset_token, reset_token_expiry FROM users WHERE reset_token = $1`,
      [token]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Invalid or expired reset token" }, { status: 400 })
    }

    const user = userResult.rows[0]

    // Check if token has expired
    const tokenExpiry = new Date(user.reset_token_expiry)
    if (tokenExpiry < new Date()) {
      return NextResponse.json({ success: false, error: "Reset token has expired" }, { status: 400 })
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update the user's password and clear the reset token
    await query(
      `UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2`,
      [hashedPassword, user.id]
    )

    return NextResponse.json({ success: true, message: "Password reset successful" })
  } catch (error) {
    console.error("[v0] Error in reset password:", error)
    return NextResponse.json({ success: false, error: "Failed to reset password" }, { status: 500 })
  }
}
