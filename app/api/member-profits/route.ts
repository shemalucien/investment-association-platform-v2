import { type NextRequest, NextResponse } from "next/server"
import { getMemberProfits, getTotalMemberProfits, getProfitDistributions } from "@/lib/db/queries/profits"
import { getMemberByUserId } from "@/lib/db/queries/members"
import { verifyToken } from "@/lib/auth/jwt"

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

    // Get member from user ID
    const member = await getMemberByUserId(payload.userId as string)
    if (!member) {
      return NextResponse.json({ success: true, data: { memberProfits: [], totalProfits: 0, totalRevenue: 0, allDistributions: [] } })
    }

    // Get member's profits
    const memberProfits = await getMemberProfits(member.id)
    const totalProfits = await getTotalMemberProfits(member.id)

    // Get all profit distributions to show cooperative revenue
    const allDistributions = await getProfitDistributions()
    const totalRevenue = allDistributions.reduce((sum, dist) => sum + dist.total_amount, 0)

    return NextResponse.json({
      success: true,
      data: {
        memberProfits,
        totalProfits,
        totalRevenue,
        allDistributions,
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching member profits:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch profit information" }, { status: 500 })
  }
}
