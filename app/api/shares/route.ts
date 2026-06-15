import { type NextRequest, NextResponse } from "next/server"
import { getAllShares, createShare, getSharesSummary, getSharesByMemberId } from "@/lib/db/queries/shares"
import { query } from "@/lib/db/connection"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const summary = searchParams.get("summary")
    const memberParam = searchParams.get("memberId")

    if (summary === "true") {
      const summaryData = await getSharesSummary()
      return NextResponse.json({ success: true, data: summaryData })
    }

    if (memberParam) {
      // Resolve user_id → members.id
      const memberLookup = await query<any>(
        `SELECT id FROM members WHERE id = $1 OR user_id = $1`,
        [memberParam]
      )
      const memberId = memberLookup.rows[0]?.id ?? memberParam
      const shares = await getSharesByMemberId(memberId)
      return NextResponse.json({ success: true, data: shares })
    }

    const shares = await getAllShares()
    return NextResponse.json({ success: true, data: shares })
  } catch (error) {
    console.error("[v0] Error fetching shares:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch shares" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.memberId || !body.quantity || !body.pricePerShare) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Resolve user_id → members.id (shares.member_id is FK to members, not users)
    const memberLookup = await query<any>(
      `SELECT id FROM members WHERE id = $1 OR user_id = $1`,
      [body.memberId]
    )
    if (memberLookup.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Member record not found for this account. Please contact the admin." },
        { status: 404 }
      )
    }
    const memberId = memberLookup.rows[0].id

    const share = await createShare({
      memberId,
      quantity: body.quantity,
      pricePerShare: body.pricePerShare,
      paymentMethod: body.paymentMethod,
      notes: body.notes,
    })

    return NextResponse.json({ success: true, data: share }, { status: 201 })
  } catch (error: any) {
    console.error("[v0] Error creating share:", error)
    return NextResponse.json({ success: false, error: error?.message || "Failed to create share" }, { status: 500 })
  }
}
