import { type NextRequest, NextResponse } from "next/server"
import { getAllPenalties, getPenaltiesForMember, markPenaltyAsPaid } from "@/lib/db/queries/penalties"
import { verifyToken } from "@/lib/auth/jwt"
import { query } from "@/lib/db/connection"

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

    const { searchParams } = new URL(request.url)
    const memberParam = searchParams.get("memberId")

    if (memberParam) {
      // Resolve user_id → members.id
      const memberLookup = await query<any>(
        `SELECT id FROM members WHERE id = $1 OR user_id = $1`,
        [memberParam]
      )
      const memberId = memberLookup.rows[0]?.id ?? memberParam
      const penalties = await getPenaltiesForMember(memberId)
      return NextResponse.json({ success: true, data: penalties })
    }

    const penalties = await getAllPenalties()
    return NextResponse.json({ success: true, data: penalties })
  } catch (error) {
    console.error("[v0] Error fetching penalties:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch penalties" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.penaltyId) {
      return NextResponse.json({ success: false, error: "Missing penalty ID" }, { status: 400 })
    }

    const penalty = await markPenaltyAsPaid(body.penaltyId)
    return NextResponse.json({ success: true, data: penalty })
  } catch (error) {
    console.error("[v0] Error marking penalty as paid:", error)
    return NextResponse.json({ success: false, error: "Failed to mark penalty as paid" }, { status: 500 })
  }
}
