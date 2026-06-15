import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db/connection"
import { createNotificationForMember } from "@/lib/db/queries/notifications"
import { verifyToken, hashPassword } from "@/lib/auth/jwt"

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload?.userId) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()

    if (!body.memberId) {
      return NextResponse.json({ success: false, error: "Missing member ID" }, { status: 400 })
    }

    // Get member details
    const memberResult = await query<any>(
      `SELECT id, member_number, full_name, email, phone, national_id, user_id FROM members WHERE id = $1`,
      [body.memberId],
    )

    if (memberResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Member not found" }, { status: 404 })
    }

    const member = memberResult.rows[0]

    // Check if member already has a user account
    if (member.user_id) {
      return NextResponse.json({ success: false, error: "Member already has a user account" }, { status: 400 })
    }

    // Generate a default password (using national ID)
    const defaultPassword = member.national_id
    const hashedPassword = await hashPassword(defaultPassword)

    // Create user account for the member
    const userResult = await query<any>(
      `
      INSERT INTO users (email, password_hash, full_name, role, is_active)
      VALUES ($1, $2, $3, 'member', true)
      RETURNING id
    `,
      [member.email, hashedPassword, member.full_name],
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Failed to create user account" }, { status: 500 })
    }

    const userId = userResult.rows[0].id

    // Update member with user_id and set status to active
    const result = await query<any>(
      `
      UPDATE members
      SET status = 'active', user_id = $2
      WHERE id = $1
      RETURNING id, member_number, full_name, email, phone
    `,
      [body.memberId, userId],
    )

    const updatedMember = result.rows[0]

    // Notify member about approval with login credentials
    try {
      await createNotificationForMember(
        member.id,
        "Membership Approved - Login Credentials",
        `Welcome to ABANYABUZARE Cooperative! Your membership has been approved. You can now log in to access your dashboard. Email: ${member.email}, Password: ${defaultPassword}`,
        "member",
        member.id,
        "success"
      )
    } catch (notificationError) {
      console.error("[v0] Error creating notification for member:", notificationError)
    }

    return NextResponse.json({ success: true, data: updatedMember }, { status: 200 })
  } catch (error) {
    console.error("[v0] Error approving member:", error)
    return NextResponse.json({ success: false, error: "Failed to approve member" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload?.userId) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    // Get all pending members
    const result = await query<any>(
      `
      SELECT id, member_number, full_name, email, phone, national_id, join_date
      FROM members
      WHERE status = 'pending'
      ORDER BY join_date DESC
    `,
    )

    return NextResponse.json({ success: true, data: result.rows })
  } catch (error) {
    console.error("[v0] Error fetching pending members:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch pending members" }, { status: 500 })
  }
}
