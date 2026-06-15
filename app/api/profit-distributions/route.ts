import { type NextRequest, NextResponse } from "next/server"
import { createProfitDistribution, getProfitDistributions } from "@/lib/db/queries/profits"
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

    const distributions = await getProfitDistributions()
    return NextResponse.json({ success: true, data: distributions })
  } catch (error) {
    console.error("[v0] Error fetching profit distributions:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch profit distributions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    if (!body.totalAmount || !body.period) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const result = await createProfitDistribution({
      totalAmount: body.totalAmount,
      description: body.description || "Profit distribution",
      period: body.period,
    })

    return NextResponse.json({ success: true, data: result }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating profit distribution:", error)
    return NextResponse.json({ success: false, error: "Failed to create profit distribution" }, { status: 500 })
  }
}
