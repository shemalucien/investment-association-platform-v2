import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db/connection"
import { createNotificationForMember } from "@/lib/db/queries/notifications"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.fullName || !body.phone || !body.nationalId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Extract address from body (optional)
    const address = body.address || null

    // Check if member with this ID already exists
    const existingCheck = await query<any>(
      `SELECT id FROM members WHERE national_id = $1`,
      [body.nationalId],
    )

    if (existingCheck.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: "This ID number is already registered" },
        { status: 400 },
      )
    }

    // Generate member number
    const lastMemberResult = await query<{ member_number: string }>(
      `SELECT member_number FROM members ORDER BY member_number DESC LIMIT 1`,
    )

    let memberNumber = "ABZ001"
    if (lastMemberResult.rows.length > 0) {
      const lastNumber = Number.parseInt(lastMemberResult.rows[0].member_number.replace("ABZ", ""))
      memberNumber = `ABZ${String(lastNumber + 1).padStart(3, "0")}`
    }

    // Create member with "pending" status. The members.email column is NOT NULL
    // in the schema so generate a fallback email when one is not provided.
    const fallbackEmail = body.email || `${body.nationalId}@nomail.local`

    // Create member
    let result
    try {
      result = await query<any>(
        `
      INSERT INTO members (member_number, full_name, email, phone, national_id, address, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, member_number, full_name, email, phone, national_id, address, status, join_date
    `,
        [memberNumber, body.fullName, fallbackEmail, body.phone, body.nationalId, address, "pending"],
      )
    } catch (dbErr: any) {
      console.error("[v0] DB error creating registration:", dbErr)
      return NextResponse.json({ success: false, error: "Failed to create registration" }, { status: 500 })
    }

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Failed to create registration" }, { status: 500 })
    }

    const member = result.rows[0]

    // Create notification for admin about new member registration
    try {
      // Find admin user and their member record
      const adminUserResult = await query<any>(
        `SELECT u.id as user_id, m.id as member_id FROM users u 
         LEFT JOIN members m ON u.id = m.user_id 
         WHERE u.role = 'admin' AND u.is_active = true 
         LIMIT 1`
      )

      if (adminUserResult.rows.length > 0 && adminUserResult.rows[0].member_id) {
        await createNotificationForMember(
          adminUserResult.rows[0].member_id,
          "New Member Registration",
          `${body.fullName} has applied to join the cooperative. Member number: ${memberNumber}`,
          "member",
          member.id,
          "info"
        )
      }
    } catch (notificationError) {
      console.error("[v0] Error creating notification for admin:", notificationError)
      // Don't fail the registration if notification fails
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: member.id,
          memberNumber: member.member_number,
          name: member.full_name,
          email: member.email,
          phone: member.phone,
          nationalId: member.national_id,
          address: member.address,
          status: member.status,
          joinDate: member.join_date,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Error creating registration:", error)
    return NextResponse.json({ success: false, error: "Failed to create registration" }, { status: 500 })
  }
}
