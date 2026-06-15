import { type NextRequest, NextResponse } from "next/server"
import { getAllDeposits, createDeposit, getDepositsSummary, getDepositsByMemberId } from "@/lib/db/queries/deposits"
import { query } from "@/lib/db/connection"

async function resolveMemberId(userOrMemberId: string): Promise<string | null> {
  const result = await query<any>(
    `SELECT id FROM members WHERE id = $1 OR user_id = $1`,
    [userOrMemberId]
  )
  return result.rows[0]?.id ?? null
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const summary = searchParams.get("summary")
    const memberParam = searchParams.get("memberId")

    if (summary === "true") {
      const summaryData = await getDepositsSummary()
      return NextResponse.json({ success: true, data: summaryData })
    }

    if (memberParam) {
      const memberId = await resolveMemberId(memberParam)
      if (!memberId) {
        return NextResponse.json({ success: true, data: [] })
      }
      const deposits = await getDepositsByMemberId(memberId)
      return NextResponse.json({ success: true, data: deposits })
    }

    const deposits = await getAllDeposits()
    return NextResponse.json({ success: true, data: deposits })
  } catch (error) {
    console.error("[v0] Error fetching deposits:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch deposits" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type")

    if (contentType?.includes("multipart/form-data")) {
      const formData = await request.formData()
      const rawMemberId = formData.get("memberId") as string
      const amount = formData.get("amount") as string
      const type = formData.get("type") as string
      const description = formData.get("description") as string
      const paymentMethod = formData.get("paymentMethod") as string
      const phoneNumber = formData.get("phoneNumber") as string
      const cooperativeCode = formData.get("cooperativeCode") as string
      const cooperativeAccount = formData.get("cooperativeAccount") as string
      const receipt = formData.get("receipt") as File

      if (!rawMemberId || !amount || !type) {
        return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
      }

      const memberId = await resolveMemberId(rawMemberId)
      if (!memberId) {
        return NextResponse.json(
          { success: false, error: "Member record not found for this account." },
          { status: 404 }
        )
      }

      const deposit = await createDeposit({
        memberId,
        depositType: type,
        amount: Number.parseFloat(amount),
        paymentMethod,
        description,
        phoneNumber,
        cooperativeCode,
        cooperativeAccount,
        receiptFileName: receipt?.name,
      })

      return NextResponse.json({ success: true, data: deposit }, { status: 201 })
    } else {
      const body = await request.json()

      if (!body.memberId || !body.depositType || !body.amount) {
        return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
      }

      const deposit = await createDeposit({
        memberId: body.memberId,
        depositType: body.depositType,
        amount: body.amount,
        paymentMethod: body.paymentMethod,
        description: body.description,
      })

      return NextResponse.json({ success: true, data: deposit }, { status: 201 })
    }
  } catch (error) {
    console.error("[v0] Error creating deposit:", error)
    return NextResponse.json({ success: false, error: "Failed to create deposit" }, { status: 500 })
  }
}
