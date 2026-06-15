import { type NextRequest, NextResponse } from "next/server"
import { getLoanById, updateLoanStatus } from "@/lib/db/queries/loans"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const loan = await getLoanById(id)

    if (!loan) {
      return NextResponse.json({ success: false, error: "Loan not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: loan })
  } catch (error) {
    console.error("[v0] Error fetching loan:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch loan" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!body.status) {
      return NextResponse.json({ success: false, error: "Status is required" }, { status: 400 })
    }

    const loan = await updateLoanStatus(id, body.status, body.approvedBy)

    if (!loan) {
      return NextResponse.json({ success: false, error: "Loan not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: loan })
  } catch (error) {
    console.error("[v0] Error updating loan:", error)
    return NextResponse.json({ success: false, error: "Failed to update loan" }, { status: 500 })
  }
}
