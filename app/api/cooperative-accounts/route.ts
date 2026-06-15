import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db/connection"

export async function GET(request: NextRequest) {
  try {
    const result = await query<any>(`
      SELECT id, account_name, account_number, bank_name
      FROM cooperative_accounts
      ORDER BY account_name
    `)

    return NextResponse.json({
      success: true,
      data: result.rows.map((row) => ({
        id: row.id,
        accountName: row.account_name,
        accountNumber: row.account_number,
        bankName: row.bank_name,
      })),
    })
  } catch (error) {
    console.error("[v0] Error fetching cooperative accounts:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch cooperative accounts" },
      { status: 500 }
    )
  }
}
