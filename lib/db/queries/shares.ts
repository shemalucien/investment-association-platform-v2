import { query } from "../connection"
import type { Share } from "@/lib/types"

function mapRow(row: any): Share {
  return {
    id: row.id,
    memberId: row.member_id,
    memberName: row.member_name ?? row.full_name ?? "",
    numberOfShares: row.quantity,
    pricePerShare: Number.parseFloat(row.price_per_share),
    totalAmount: Number.parseFloat(row.total_amount),
    purchaseDate: row.purchase_date,
    paymentMethod: row.payment_method,
    notes: row.notes,
    status: "active" as const,
  }
}

export async function getAllShares(): Promise<Share[]> {
  const result = await query<any>(`
    SELECT 
      s.*,
      m.full_name as member_name,
      m.member_number
    FROM shares s
    JOIN members m ON s.member_id = m.id
    ORDER BY s.purchase_date DESC
  `)
  return result.rows.map(mapRow)
}

export async function getSharesByMemberId(memberId: string): Promise<Share[]> {
  const result = await query<any>(
    `
    SELECT 
      s.*,
      m.full_name as member_name,
      m.member_number
    FROM shares s
    JOIN members m ON s.member_id = m.id
    WHERE s.member_id = $1
    ORDER BY s.purchase_date DESC
  `,
    [memberId],
  )
  return result.rows.map(mapRow)
}

export async function createShare(data: {
  memberId: string
  quantity: number
  pricePerShare: number
  paymentMethod?: string
  notes?: string
  createdBy?: string
}): Promise<Share> {
  const totalAmount = data.quantity * data.pricePerShare

  const result = await query<any>(
    `
    INSERT INTO shares (member_id, quantity, price_per_share, total_amount, payment_method, notes, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `,
    [
      data.memberId,
      data.quantity,
      data.pricePerShare,
      totalAmount,
      data.paymentMethod || "cash",
      data.notes || null,
      data.createdBy || null,
    ],
  )

  const row = result.rows[0]

  const memberResult = await query<any>(
    `SELECT full_name, member_number FROM members WHERE id = $1`,
    [data.memberId],
  )

  return {
    id: row.id,
    memberId: row.member_id,
    memberName: memberResult.rows[0]?.full_name ?? "",
    numberOfShares: row.quantity,
    pricePerShare: Number.parseFloat(row.price_per_share),
    totalAmount: Number.parseFloat(row.total_amount),
    purchaseDate: row.purchase_date,
    paymentMethod: row.payment_method,
    notes: row.notes,
    status: "active" as const,
  }
}

export async function getSharesSummary(): Promise<{
  totalShares: number
  totalValue: number
  totalMembers: number
}> {
  const result = await query<any>(`
    SELECT 
      COALESCE(SUM(quantity), 0) as total_shares,
      COALESCE(SUM(total_amount), 0) as total_value,
      COUNT(DISTINCT member_id) as total_members
    FROM shares
  `)

  const row = result.rows[0]
  return {
    totalShares: Number.parseInt(row.total_shares),
    totalValue: Number.parseFloat(row.total_value),
    totalMembers: Number.parseInt(row.total_members),
  }
}
