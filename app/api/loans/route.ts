import { type NextRequest, NextResponse } from "next/server"
import { getAllLoans, getLoansByMemberId, createLoan } from "@/lib/db/queries/loans"
import { createNotificationForMember } from "@/lib/db/queries/notifications"
import { query } from "@/lib/db/connection"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get("memberId")

    if (memberId) {
      // memberId here could be either users.id or members.id — resolve to members.id
      const memberLookup = await query<any>(
        `SELECT id FROM members WHERE id = $1 OR user_id = $1`,
        [memberId]
      )
      const realMemberId = memberLookup.rows[0]?.id ?? memberId
      const loans = await getLoansByMemberId(realMemberId)
      return NextResponse.json({ success: true, data: loans })
    }

    const loans = await getAllLoans()
    return NextResponse.json({ success: true, data: loans })
  } catch (error) {
    console.error("[v0] Error fetching loans:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch loans" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || ""

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      const userOrMemberId = formData.get("memberId") as string
      const principalAmount = formData.get("principalAmount") as string
      const duration = formData.get("duration") as string
      const interestRate = formData.get("interestRate") as string
      const purpose = (formData.get("purpose") as string) || "General purpose"
      const guarantorsStr = formData.get("guarantors") as string
      const agreementFile = formData.get("agreementFile") as File | null

      if (!userOrMemberId || !principalAmount || !duration) {
        return NextResponse.json(
          { success: false, error: "Missing required fields: memberId, principalAmount, duration" },
          { status: 400 }
        )
      }

      const guarantors = guarantorsStr ? JSON.parse(guarantorsStr) : []

      // Resolve user_id → members.id (loans.member_id is a FK to members, not users)
      const memberLookup = await query<any>(
        `SELECT id FROM members WHERE id = $1 OR user_id = $1`,
        [userOrMemberId]
      )
      if (memberLookup.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: "Member record not found for this account. Please contact the admin." },
          { status: 404 }
        )
      }
      const memberId = memberLookup.rows[0].id

      // Block if already has an active loan
      const activeCheck = await query<any>(
        `SELECT id FROM loans WHERE member_id = $1 AND status = 'active'`,
        [memberId]
      )
      if (activeCheck.rows.length > 0) {
        return NextResponse.json(
          { success: false, error: "You already have an active loan. Please repay it before applying for a new one." },
          { status: 400 }
        )
      }

      // Block if already has a pending application
      const pendingCheck = await query<any>(
        `SELECT id FROM loans WHERE member_id = $1 AND status = 'pending'`,
        [memberId]
      )
      if (pendingCheck.rows.length > 0) {
        return NextResponse.json(
          { success: false, error: "You already have a pending loan application awaiting approval." },
          { status: 400 }
        )
      }

      const loan = await createLoan({
        memberId,
        principalAmount: Number.parseFloat(principalAmount),
        interestRate: Number.parseFloat(interestRate) || 10,
        durationMonths: Number.parseInt(duration),
        purpose,
        guarantors,
        agreementFileName: agreementFile?.name || undefined,
      })

      // Notify admin (non-blocking)
      try {
        const adminResult = await query<any>(
          `SELECT m.id as member_id FROM users u
           LEFT JOIN members m ON u.id = m.user_id
           WHERE u.role = 'admin' AND u.is_active = true
           LIMIT 1`
        )
        if (adminResult.rows.length > 0 && adminResult.rows[0].member_id) {
          await createNotificationForMember(
            adminResult.rows[0].member_id,
            "New Loan Application",
            `A loan application of ${new Intl.NumberFormat("rw-RW").format(Number.parseFloat(principalAmount))} RWF submitted. Purpose: ${purpose}`,
            "loan",
            loan.id,
            "info"
          )
        }
      } catch (notifErr) {
        console.error("[v0] Notification error:", notifErr)
      }

      return NextResponse.json({ success: true, data: loan }, { status: 201 })

    } else {
      // JSON body
      const body = await request.json()

      if (!body.memberId || !body.principalAmount || !body.durationMonths) {
        return NextResponse.json(
          { success: false, error: "Missing required fields: memberId, principalAmount, durationMonths" },
          { status: 400 }
        )
      }

      // Resolve user_id → members.id
      const memberLookup = await query<any>(
        `SELECT id FROM members WHERE id = $1 OR user_id = $1`,
        [body.memberId]
      )
      if (memberLookup.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: "Member record not found for this account." },
          { status: 404 }
        )
      }
      const memberId = memberLookup.rows[0].id

      const activeCheck = await query<any>(
        `SELECT id FROM loans WHERE member_id = $1 AND status = 'active'`,
        [memberId]
      )
      if (activeCheck.rows.length > 0) {
        return NextResponse.json(
          { success: false, error: "You already have an active loan." },
          { status: 400 }
        )
      }

      const loan = await createLoan({
        memberId,
        principalAmount: body.principalAmount,
        interestRate: body.interestRate || 10,
        durationMonths: body.durationMonths,
        purpose: body.purpose || "General purpose",
        notes: body.notes,
        guarantors: body.guarantors,
      })

      return NextResponse.json({ success: true, data: loan }, { status: 201 })
    }
  } catch (error: any) {
    console.error("[v0] Error creating loan:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create loan" },
      { status: 500 }
    )
  }
}
